/**
 * Eksekutor restore (spec 027) — DIJALANKAN SAAT SERVER BERHENTI.
 *
 * Dipakai oleh `scripts/restore-apply.ts`. Hanya boleh mengimpor `node:*`,
 * `adm-zip`, `better-sqlite3`, dan modul guard/service relatif (tanpa alias),
 * supaya bisa dijalankan lewat `node --import tsx` tanpa SvelteKit.
 *
 * Urutan kerja (setiap langkah punya jalur balik):
 *   1. verifikasi sha256 seluruh isi arsip
 *   2. cek ruang disk & pastikan local.db tidak terkunci proses lain
 *   3. ekstrak ke data/restore/staged/<stamp> (zip-slip guard)
 *   4. integrity_check + tabel wajib pada DB arsip
 *   5. cadangkan DB & uploads lama (.replaced-<stamp>), hapus -wal/-shm sisa
 *   6. pasang DB & uploads dari arsip
 *   7. verifikasi hasil vs manifest → gagal: ROLLBACK otomatis
 *   8. sisipkan ulang sesi admin pelaku (best-effort)
 *   9. tulis data/restore/last-result.json + history.log
 */
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	renameSync,
	rmSync,
	statSync,
	statfsSync,
	writeFileSync
} from 'node:fs';
import path from 'node:path';
import { inspectDatabase, verifyArchive } from '../../../modules/backup/backup.service';
import {
	DB_ENTRY,
	MANIFEST_ENTRY,
	REQUIRED_TABLES,
	type RestoreResult,
	formatLocal,
	formatStamp,
	humanBytes,
	safeJoin,
	walkFiles
} from './guards';
import { DB_FILE, RESTORE_DIR, UPLOADS_DIR } from '../paths';

export interface SwapStep {
	action: 'rename' | 'move' | 'remove';
	from: string;
	to?: string;
	label: string;
}

export interface ApplyOptions {
	zipPath: string;
	actor?: string;
	preRestoreName?: string;
	dryRun?: boolean;
	keepOld?: boolean;
	keepSession?: string;
	dbFile?: string;
	uploadsDir?: string;
	restoreDir?: string;
	backupDir?: string;
}

const LOCK_INSTRUKSI = 'pm2 stop simad-bel mtsn-app-bff';

/** Deteksi DB yang masih dipegang proses lain (Windows: rename gagal EBUSY/EPERM). */
export function detectDbLock(dbFile: string): { locked: boolean; message: string } {
	if (!existsSync(dbFile)) return { locked: false, message: '' };
	const probe = `${dbFile}.locktest`;
	try {
		renameSync(dbFile, probe);
		renameSync(probe, dbFile);
		return { locked: false, message: '' };
	} catch (e) {
		const code = (e as NodeJS.ErrnoException).code ?? 'EBUSY';
		return {
			locked: true,
			message: `Database ${path.basename(dbFile)} masih dipakai proses lain (${code}). Hentikan dulu: ${LOCK_INSTRUKSI} lalu jalankan ulang perintah restore.`
		};
	}
}

export function planSwap(o: { dbFile: string; uploadsDir: string; stagedDir: string; stamp: string }): SwapStep[] {
	const replaced = (p: string) => `${p}.replaced-${o.stamp}`;
	return [
		{ action: 'rename', from: o.dbFile, to: replaced(o.dbFile), label: 'Cadangkan database lama' },
		{ action: 'remove', from: `${o.dbFile}-wal`, label: 'Hapus WAL sisa database lama' },
		{ action: 'remove', from: `${o.dbFile}-shm`, label: 'Hapus SHM sisa database lama' },
		{ action: 'move', from: path.join(o.stagedDir, DB_ENTRY), to: o.dbFile, label: 'Pasang database dari arsip' },
		{ action: 'rename', from: o.uploadsDir, to: replaced(o.uploadsDir), label: 'Cadangkan folder uploads lama' },
		{ action: 'move', from: path.join(o.stagedDir, 'uploads'), to: o.uploadsDir, label: 'Pasang folder uploads dari arsip' }
	];
}

export function compareRowCounts(
	expected: Record<string, number>,
	actual: Record<string, number>
): string[] {
	const beda: string[] = [];
	for (const [tabel, jumlah] of Object.entries(expected)) {
		const hasil = actual[tabel] ?? 0;
		if (hasil !== jumlah) beda.push(`${tabel} (manifest ${jumlah}, hasil ${hasil})`);
	}
	return beda;
}

function jalankanStep(s: SwapStep): void {
	if (s.action === 'remove') {
		rmSync(s.from, { force: true });
		return;
	}
	if (!existsSync(s.from)) {
		if (s.action === 'rename') return; // tidak ada yang perlu dicadangkan
		throw new Error(`Berkas arsip ${path.basename(s.from)} tidak ditemukan saat pemasangan.`);
	}
	mkdirSync(path.dirname(s.to as string), { recursive: true });
	renameSync(s.from, s.to as string);
}

function balikkanStep(s: SwapStep): void {
	if (s.action === 'remove' || !s.to) return;
	if (!existsSync(s.to)) return;
	renameSync(s.to, s.from);
}

function ruangBebas(dir: string): number | null {
	try {
		const st = statfsSync(dir);
		return Number(st.bavail) * Number(st.bsize);
	} catch {
		return null;
	}
}

/** Ekstrak hanya local.db + uploads/** dengan perlindungan zip-slip. */
function extractArchive(zipPath: string, destDir: string): number {
	const zip = new AdmZip(zipPath);
	let jumlah = 0;
	for (const entry of zip.getEntries()) {
		if (entry.isDirectory) continue;
		if (entry.entryName === MANIFEST_ENTRY) continue;
		if (entry.entryName.startsWith('config/')) continue;
		const target = safeJoin(destDir, entry.entryName);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(target, entry.getData());
		jumlah++;
	}
	return jumlah;
}

function ambilSesi(dbFile: string, token: string): { token: string; user_id: number; expires_at: number } | null {
	if (!existsSync(dbFile)) return null;
	try {
		const db = new Database(dbFile, { readonly: true });
		try {
			const row = db
				.prepare('SELECT token, user_id, expires_at FROM sessions WHERE token = ?')
				.get(token) as { token: string; user_id: number; expires_at: number } | undefined;
			return row ?? null;
		} finally {
			db.close();
		}
	} catch {
		return null;
	}
}

function sisipSesi(dbFile: string, sesi: { token: string; user_id: number; expires_at: number }): void {
	const db = new Database(dbFile);
	try {
		const ada = db.prepare('SELECT 1 AS ada FROM users WHERE id = ?').get(sesi.user_id);
		if (!ada) return;
		db.prepare('INSERT OR IGNORE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
			sesi.token,
			sesi.user_id,
			sesi.expires_at
		);
	} finally {
		db.close();
	}
}

function tulisHasil(restoreDir: string, result: RestoreResult): void {
	try {
		mkdirSync(restoreDir, { recursive: true });
		writeFileSync(path.join(restoreDir, 'last-result.json'), JSON.stringify(result, null, 2), 'utf-8');
		appendFileSync(
			path.join(restoreDir, 'history.log'),
			`${result.restoredAtLocal} | ${result.ok ? 'OK' : 'GAGAL'} | ${result.stagedName} | actor=${result.actor} | rollback=${result.rolledBack ?? false} | ${result.error ?? '-'}\n`,
			'utf-8'
		);
	} catch {
		/* riwayat bersifat best-effort */
	}
}

export async function applyRestore(opts: ApplyOptions): Promise<RestoreResult> {
	const dbFile = opts.dbFile ?? DB_FILE;
	const uploadsDir = opts.uploadsDir ?? UPLOADS_DIR;
	const restoreDir = opts.restoreDir ?? RESTORE_DIR;
	const stamp = formatStamp();
	const log: string[] = [];
	const result: RestoreResult = {
		ok: false,
		dryRun: Boolean(opts.dryRun),
		actor: opts.actor ?? 'cli',
		stagedName: path.basename(opts.zipPath),
		preRestoreName: opts.preRestoreName ?? '',
		restoredAt: new Date().toISOString(),
		restoredAtLocal: formatLocal(),
		log
	};

	let steps: SwapStep[] = [];
	let swapped = false;

	try {
		if (!existsSync(opts.zipPath)) throw new Error(`Arsip tidak ditemukan: ${opts.zipPath}`);

		const manifest = await verifyArchive(opts.zipPath);
		log.push(`Arsip tervalidasi: ${manifest.filesTotal} berkas unggahan, DB ${manifest.db.bytes} byte.`);

		mkdirSync(restoreDir, { recursive: true });
		const ukuran = statSync(opts.zipPath).size;
		const bebas = ruangBebas(restoreDir);
		if (bebas !== null && bebas < ukuran * 3) {
			throw new Error(
				`Ruang disk tidak cukup: tersedia ${humanBytes(bebas)}, butuh minimal ${humanBytes(ukuran * 3)}.`
			);
		}
		log.push(`Ruang disk mencukupi (${humanBytes(bebas ?? 0)} tersedia).`);

		const lock = detectDbLock(dbFile);
		if (lock.locked) throw new Error(lock.message);
		log.push('Database tidak terkunci proses lain.');

		if (opts.dryRun) {
			result.ok = true;
			log.push('Mode dry-run: tidak ada berkas yang diubah.');
			tulisHasil(restoreDir, result);
			return result;
		}

		const stagedDir = path.join(restoreDir, 'staged', stamp);
		rmSync(stagedDir, { recursive: true, force: true });
		mkdirSync(stagedDir, { recursive: true });
		const jumlahEkstrak = extractArchive(opts.zipPath, stagedDir);
		log.push(`Arsip diekstrak (${jumlahEkstrak} berkas) ke data/restore/staged/${stamp}.`);

		const stagedDb = path.join(stagedDir, DB_ENTRY);
		if (!existsSync(stagedDb)) throw new Error('Arsip tidak memuat local.db.');
		const infoStaged = inspectDatabase(stagedDb);
		if (infoStaged.integrityCheck !== 'ok') {
			throw new Error(`Database arsip tidak lolos integrity_check: ${infoStaged.integrityCheck}`);
		}
		const tabelHilang = REQUIRED_TABLES.filter((t) => !infoStaged.tables.includes(t));
		if (tabelHilang.length > 0) {
			throw new Error(`Database arsip kekurangan tabel wajib: ${tabelHilang.join(', ')}`);
		}
		log.push('Database arsip lolos integrity_check dan tabel wajib lengkap.');

		const sesi = opts.keepSession ? ambilSesi(dbFile, opts.keepSession) : null;

		steps = planSwap({ dbFile, uploadsDir, stagedDir, stamp });
		for (const s of steps) jalankanStep(s);
		swapped = true;
		log.push('Database & folder uploads diganti dengan isi arsip.');

		const info = inspectDatabase(dbFile);
		if (info.integrityCheck !== 'ok') {
			throw new Error(`Hasil restore tidak lolos integrity_check: ${info.integrityCheck}`);
		}
		const beda = compareRowCounts(manifest.dbRowCounts, info.rowCounts);
		if (beda.length > 0) {
			throw new Error(`Jumlah baris tidak cocok manifest: ${beda.join('; ')}`);
		}
		log.push('Verifikasi pasca-restore lolos — jumlah baris cocok manifest.');

		if (sesi) {
			sisipSesi(dbFile, sesi);
			log.push('Sesi admin pelaku disisipkan ulang.');
		} else if (opts.keepSession) {
			log.push('Sesi admin pelaku tidak ditemukan di DB lama — semua sesi logout.');
		}

		const fileUploads = walkFiles(uploadsDir);
		if (fileUploads.length !== manifest.filesTotal) {
			log.push(`Catatan: ${fileUploads.length} berkas uploads terpasang (manifest ${manifest.filesTotal}).`);
		}

		result.ok = true;
		result.dbRowCounts = info.rowCounts;
		result.filesTotal = fileUploads.length;

		if (!opts.keepOld) {
			for (const s of steps) {
				if (s.action === 'rename' && s.to) rmSync(s.to, { recursive: true, force: true });
			}
			log.push('Cadangan sementara (.replaced-*) dibersihkan.');
		} else {
			log.push('Cadangan sementara (.replaced-*) dipertahankan (--keep-old).');
		}
	} catch (e) {
		const pesan = e instanceof Error ? e.message : String(e);
		result.ok = false;
		result.error = pesan;
		log.push(`GAGAL: ${pesan}`);
		if (swapped) {
			try {
				for (const s of [...steps].reverse()) balikkanStep(s);
				result.rolledBack = true;
				log.push('ROLLBACK: data lama dipulihkan dari cadangan .replaced-*.');
			} catch (e2) {
				result.rolledBack = false;
				log.push(`ROLLBACK GAGAL: ${e2 instanceof Error ? e2.message : String(e2)}`);
			}
		}
	}

	tulisHasil(restoreDir, result);
	return result;
}
