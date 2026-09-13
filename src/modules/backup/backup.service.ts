/**
 * Service Backup & Restore (spec 027).
 *
 * ATURAN: modul ini sengaja hanya memakai `node:*`, `adm-zip`, dan `better-sqlite3`
 * (tanpa alias `$lib`/`$app`, tanpa koneksi Drizzle) supaya fungsi-fungsi di sini
 * bisa dipanggil dari server SvelteKit DAN dari CLI cron (`scripts/backup-create.ts`,
 * `scripts/restore-apply.ts`) yang dijalankan saat server mati.
 */
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { existsSync, statSync, unlinkSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	APP_ID,
	BACKUP_NAME_RE,
	DB_ENTRY,
	EXCLUDED_LABELS,
	FORMAT_VERSION,
	MANIFEST_ENTRY,
	REQUIRED_TABLES,
	STAGED_NAME_RE,
	type BackupListItem,
	type BackupManifest,
	type BackupSource,
	type ManifestFile,
	type RestoreInspection,
	type RestorePending,
	type RestoreResult,
	formatLocal,
	formatStamp,
	safeJoin,
	sha256Buffer,
	sha256File,
	validateManifest,
	walkFiles
} from '../../lib/server/backup/guards';
import {
	APP_VERSION,
	BACKUP_DIR,
	DB_FILE,
	INCOMING_DIR,
	PENDING_FILE,
	RESTORE_DIR,
	RESULT_FILE,
	ROOT,
	UPLOADS_DIR,
	gitCommit
} from '../../lib/server/paths';

export interface BackupInfo {
	name: string;
	path: string;
	bytes: number;
	manifest: BackupManifest;
}

export interface CreateBackupOptions {
	source: BackupSource;
	by?: string;
	dbFile?: string;
	uploadsDir?: string;
	outDir?: string;
	skipPrune?: boolean;
}

export interface InspectOptions {
	incomingDir?: string;
	dbFile?: string;
	uploadsDir?: string;
	restoreDir?: string;
}

interface DbInfo {
	integrityCheck: string;
	tables: string[];
	rowCounts: Record<string, number>;
	schemaMigrations: number | null;
}

/* ── DB helper (tanpa Drizzle) ───────────────────────────── */

export function inspectDatabase(file: string): DbInfo {
	const db = new Database(file, { readonly: true });
	try {
		const integrityCheck = String(db.pragma('integrity_check', { simple: true }));
		const tables = (
			db
				.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
				.all() as { name: string }[]
		).map((r) => r.name);
		const rowCounts: Record<string, number> = {};
		for (const t of tables) {
			rowCounts[t] = (db.prepare(`SELECT COUNT(*) AS c FROM "${t}"`).get() as { c: number }).c;
		}
		const schemaMigrations = tables.includes('schema_migrations')
			? ((db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get() as { v: number | null }).v ?? null)
			: null;
		return { integrityCheck, tables, rowCounts, schemaMigrations };
	} finally {
		db.close();
	}
}

async function snapshotDatabase(dbFile: string, dest: string): Promise<void> {
	if (!existsSync(dbFile)) throw new Error(`Database tidak ditemukan: ${dbFile}`);
	const src = new Database(dbFile);
	try {
		// SQLite Online Backup API → konsisten walau ada proses lain yang menulis,
		// dan hasilnya sudah ter-checkpoint (tanpa perlu -wal/-shm).
		await src.backup(dest);
	} finally {
		src.close();
	}
}

function readManifestFromZip(file: string): BackupManifest {
	const zip = new AdmZip(file);
	const buf = zip.readFile(MANIFEST_ENTRY);
	if (!buf) throw new Error('Arsip tidak memuat manifest.json.');
	return validateManifest(JSON.parse(buf.toString('utf-8')));
}

/* ── createBackup ────────────────────────────────────────── */

export async function createBackup(opts: CreateBackupOptions): Promise<BackupInfo> {
	const dbFile = opts.dbFile ?? DB_FILE;
	const uploadsDir = opts.uploadsDir ?? UPLOADS_DIR;
	const outDir = opts.outDir ?? BACKUP_DIR;
	if (!existsSync(dbFile)) throw new Error(`Database tidak ditemukan: ${dbFile}`);

	await mkdir(outDir, { recursive: true });
	const now = new Date();
	const stamp = formatStamp(now);
	const tmpDb = path.join(outDir, `.tmp-${stamp}-${process.pid}.db`);

	await snapshotDatabase(dbFile, tmpDb);
	try {
		const dbInfo = inspectDatabase(tmpDb);
		if (dbInfo.integrityCheck !== 'ok') {
			throw new Error(`Snapshot database tidak lolos integrity_check: ${dbInfo.integrityCheck}`);
		}

		const files: ManifestFile[] = [];
		for (const rel of walkFiles(uploadsDir)) {
			const abs = path.join(uploadsDir, rel);
			files.push({ path: `uploads/${rel}`, bytes: statSync(abs).size, sha256: sha256File(abs) });
		}
		files.sort((a, b) => a.path.localeCompare(b.path));

		const configSrc = path.join(ROOT, 'ecosystem.config.cjs');
		const adaConfig = existsSync(configSrc);

		const manifest: BackupManifest = {
			app: APP_ID,
			formatVersion: FORMAT_VERSION,
			createdAt: now.toISOString(),
			createdAtLocal: formatLocal(now),
			source: opts.source,
			createdBy: opts.by ?? 'system',
			appVersion: APP_VERSION,
			gitCommit: gitCommit(),
			db: {
				path: DB_ENTRY,
				bytes: statSync(tmpDb).size,
				sha256: sha256File(tmpDb),
				integrityCheck: dbInfo.integrityCheck
			},
			dbRowCounts: dbInfo.rowCounts,
			schemaMigrations: dbInfo.schemaMigrations,
			files,
			filesTotal: files.length,
			filesBytes: files.reduce((a, f) => a + f.bytes, 0),
			excluded: EXCLUDED_LABELS
		};

		const name = `simad-backup-${stamp}-${opts.source}.zip`;
		const outPath = path.join(outDir, name);

		const zip = new AdmZip();
		// manifest WAJIB entri pertama
		zip.addFile(MANIFEST_ENTRY, Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));
		zip.addLocalFile(tmpDb, '', DB_ENTRY);
		for (const f of files) {
			const rel = f.path.slice('uploads/'.length);
			zip.addLocalFile(path.join(uploadsDir, rel), path.posix.dirname(f.path));
		}
		if (adaConfig) zip.addLocalFile(configSrc, 'config');
		zip.writeZip(outPath);

		const verified = await verifyArchive(outPath);
		if (!opts.skipPrune) await pruneBackups(outDir);

		return { name, path: outPath, bytes: statSync(outPath).size, manifest: verified };
	} finally {
		await rm(tmpDb, { force: true });
	}
}

/* ── verifyArchive ───────────────────────────────────────── */

export async function verifyArchive(zipPath: string): Promise<BackupManifest> {
	if (!existsSync(zipPath)) throw new Error(`Arsip tidak ditemukan: ${zipPath}`);
	const zip = new AdmZip(zipPath);
	const entries = zip.getEntries();
	if (entries.length === 0) throw new Error('Arsip kosong.');
	for (const e of entries) {
		safeJoin(path.dirname(zipPath), e.entryName); // melempar bila zip-slip/absolut
	}

	const manifestBuf = zip.readFile(MANIFEST_ENTRY);
	if (!manifestBuf) throw new Error('Manifest tidak bisa dibaca dari arsip.');
	const manifest = validateManifest(JSON.parse(manifestBuf.toString('utf-8')));

	const dbBuf = zip.readFile(DB_ENTRY);
	if (!dbBuf) throw new Error('Arsip tidak memuat local.db.');
	if (dbBuf.length !== manifest.db.bytes) {
		throw new Error(`Ukuran database tidak cocok manifest (${dbBuf.length} vs ${manifest.db.bytes}).`);
	}
	if (sha256Buffer(dbBuf) !== manifest.db.sha256) {
		throw new Error('sha256 database tidak cocok — arsip rusak atau diubah.');
	}

	for (const f of manifest.files) {
		const buf = zip.readFile(f.path);
		if (!buf) throw new Error(`File ${f.path} hilang dari arsip.`);
		if (buf.length !== f.bytes) throw new Error(`Ukuran file ${f.path} tidak cocok manifest.`);
		if (sha256Buffer(buf) !== f.sha256) throw new Error(`sha256 file ${f.path} tidak cocok — arsip rusak.`);
	}
	return manifest;
}

/* ── list / delete / prune ───────────────────────────────── */

export async function listBackups(dir: string = BACKUP_DIR): Promise<BackupListItem[]> {
	if (!existsSync(dir)) return [];
	const names = (await readdir(dir)).filter((n) => n.endsWith('.zip') && BACKUP_NAME_RE.test(n));
	const items: BackupListItem[] = [];
	for (const name of names) {
		const full = path.join(dir, name);
		let manifest: BackupManifest | null = null;
		try {
			manifest = readManifestFromZip(full);
		} catch {
			manifest = null;
		}
		items.push({
			name,
			bytes: statSync(full).size,
			mtime: statSync(full).mtimeMs,
			source: manifest?.source ?? 'tidak dikenal',
			broken: manifest === null,
			manifest
		});
	}
	return items.sort((a, b) => b.mtime - a.mtime);
}

export async function deleteBackup(name: string, dir: string = BACKUP_DIR): Promise<{ ok: true; name: string }> {
	if (!BACKUP_NAME_RE.test(name)) throw new Error('Nama arsip tidak valid.');
	const full = safeJoin(dir, name);
	if (!existsSync(full)) throw new Error('Arsip tidak ditemukan.');
	await rm(full, { force: true });
	return { ok: true, name };
}

export async function pruneBackups(
	dir: string = BACKUP_DIR,
	opts: { keepCron?: number; keepPre?: number } = {}
): Promise<string[]> {
	const keepCron = opts.keepCron ?? 30;
	const keepPre = opts.keepPre ?? 5;
	const items = await listBackups(dir);
	const dihapus: string[] = [];

	const pangkas = (sumber: string, batas: number) => {
		const grup = items.filter((i) => i.source === sumber); // sudah terurut terbaru → terlama
		for (const i of grup.slice(batas)) {
			const full = path.join(dir, i.name);
			try {
				unlinkSync(full);
				dihapus.push(i.name);
			} catch {
				/* biarkan bila gagal dihapus */
			}
		}
	};
	pangkas('cron', keepCron);
	pangkas('pre-restore', keepPre);
	return dihapus;
}

/* ── restore: inspeksi & persiapan ───────────────────────── */

export async function inspectArchive(
	stagedName: string,
	opts: InspectOptions = {}
): Promise<RestoreInspection> {
	if (!STAGED_NAME_RE.test(stagedName)) throw new Error('Nama berkas unggahan tidak valid.');
	const incomingDir = opts.incomingDir ?? INCOMING_DIR;
	const restoreDir = opts.restoreDir ?? RESTORE_DIR;
	const stagedPath = safeJoin(incomingDir, stagedName);
	if (!existsSync(stagedPath)) throw new Error('Berkas arsip tidak ditemukan — silakan unggah ulang.');

	const manifest = await verifyArchive(stagedPath);

	const zip = new AdmZip(stagedPath);
	const dbBuf = zip.readFile(DB_ENTRY);
	if (!dbBuf) throw new Error('Arsip tidak memuat local.db.');

	await mkdir(restoreDir, { recursive: true });
	const tmp = path.join(restoreDir, `.inspeksi-${Date.now()}-${process.pid}.db`);
	await writeFile(tmp, dbBuf);
	let archiveDb: DbInfo;
	try {
		archiveDb = inspectDatabase(tmp);
	} finally {
		await rm(tmp, { force: true });
	}
	if (archiveDb.integrityCheck !== 'ok') {
		throw new Error(`Database di dalam arsip tidak lolos integrity_check: ${archiveDb.integrityCheck}`);
	}
	const missing = REQUIRED_TABLES.filter((t) => !archiveDb.tables.includes(t));
	if (missing.length > 0) {
		throw new Error(`Arsip kekurangan tabel wajib: ${missing.join(', ')}`);
	}

	const liveDb = opts.dbFile ?? DB_FILE;
	let current: { dbRowCounts: Record<string, number>; filesTotal: number; filesBytes: number } = {
		dbRowCounts: {},
		filesTotal: 0,
		filesBytes: 0
	};
	if (existsSync(liveDb)) {
		try {
			const info = inspectDatabase(liveDb);
			current = { dbRowCounts: info.rowCounts, filesTotal: 0, filesBytes: 0 };
		} catch {
			/* DB produksi sedang terkunci — preview kosong, tidak fatal */
		}
	}

	const uploadsDir = opts.uploadsDir ?? UPLOADS_DIR;
	const curFiles = walkFiles(uploadsDir);
	current.filesTotal = curFiles.length;
	current.filesBytes = curFiles.reduce((a, rel) => a + statSync(path.join(uploadsDir, rel)).size, 0);

	const deltas: Record<string, number> = {};
	for (const t of new Set([...Object.keys(current.dbRowCounts), ...Object.keys(archiveDb.rowCounts)])) {
		deltas[t] = (archiveDb.rowCounts[t] ?? 0) - (current.dbRowCounts[t] ?? 0);
	}

	return {
		ok: true,
		stagedName,
		manifest,
		preview: {
			current,
			archive: {
				dbRowCounts: archiveDb.rowCounts,
				filesTotal: manifest.filesTotal,
				filesBytes: manifest.filesBytes
			},
			deltas,
			filesDelta: manifest.filesTotal - current.filesTotal
		}
	};
}

export async function prepareRestore(
	stagedName: string,
	actor: string,
	opts: InspectOptions & { outDir?: string } = {}
): Promise<RestorePending> {
	const restoreDir = opts.restoreDir ?? RESTORE_DIR;
	const incomingDir = opts.incomingDir ?? INCOMING_DIR;
	const inspeksi = await inspectArchive(stagedName, opts);

	// Snapshot pengaman WAJIB — dibuat sebelum apa pun menyentuh data.
	const safety = await createBackup({
		source: 'pre-restore',
		by: actor,
		dbFile: opts.dbFile,
		uploadsDir: opts.uploadsDir,
		outDir: opts.outDir
	});

	const now = new Date();
	const pending: RestorePending = {
		stagedName,
		stagedPath: safeJoin(incomingDir, stagedName),
		preRestoreName: safety.name,
		preRestorePath: safety.path,
		actor,
		createdAt: now.toISOString(),
		createdAtLocal: formatLocal(now),
		manifestSummary: {
			app: inspeksi.manifest.app,
			formatVersion: inspeksi.manifest.formatVersion,
			createdAt: inspeksi.manifest.createdAt,
			source: inspeksi.manifest.source,
			gitCommit: inspeksi.manifest.gitCommit,
			dbRowCounts: inspeksi.manifest.dbRowCounts,
			filesTotal: inspeksi.manifest.filesTotal,
			filesBytes: inspeksi.manifest.filesBytes
		}
	};

	await mkdir(restoreDir, { recursive: true });
	await writeFile(path.join(restoreDir, 'pending.json'), JSON.stringify(pending, null, 2), 'utf-8');
	return pending;
}

export async function readRestoreStatus(file: string = RESULT_FILE): Promise<RestoreResult | null> {
	if (!existsSync(file)) return null;
	try {
		return JSON.parse(await readFile(file, 'utf-8')) as RestoreResult;
	} catch {
		return null;
	}
}

export async function readPending(file: string = PENDING_FILE): Promise<RestorePending | null> {
	if (!existsSync(file)) return null;
	try {
		return JSON.parse(await readFile(file, 'utf-8')) as RestorePending;
	} catch {
		return null;
	}
}

/** Salin berkas unggahan (dipakai remote function setelah streaming dari request). */
export async function simpanUnggahan(src: string, destName: string, incomingDir = INCOMING_DIR): Promise<string> {
	await mkdir(incomingDir, { recursive: true });
	const dest = safeJoin(incomingDir, destName);
	await copyFile(src, dest);
	return dest;
}
