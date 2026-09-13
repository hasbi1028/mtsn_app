import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, utimesSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { APP_ID, FORMAT_VERSION, MANIFEST_ENTRY, sha256Buffer } from '$lib/server/backup/guards';
import {
	createBackup,
	verifyArchive,
	listBackups,
	deleteBackup,
	pruneBackups,
	inspectArchive,
	prepareRestore,
	readRestoreStatus
} from './backup.service';

let dir: string;
let dbFile: string;
let uploadsDir: string;
let outDir: string;

function buatDb(file: string, siswaJumlah = 2) {
	const db = new Database(file);
	db.exec(`
		CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT);
		CREATE TABLE sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at INTEGER);
		CREATE TABLE siswa (id INTEGER PRIMARY KEY, nama TEXT);
		CREATE TABLE ptk (id INTEGER PRIMARY KEY, nama TEXT);
		CREATE TABLE rombel (id INTEGER PRIMARY KEY, nama TEXT);
		CREATE TABLE roster (id INTEGER PRIMARY KEY, kelas TEXT);
		CREATE TABLE skakpt (id INTEGER PRIMARY KEY, ptk_id INTEGER);
		CREATE TABLE skmt_ajuan (id INTEGER PRIMARY KEY, ptk_id INTEGER);
		CREATE TABLE skbk_ajuan (id INTEGER PRIMARY KEY, ptk_id INTEGER);
		CREATE TABLE jam_bel (id INTEGER PRIMARY KEY, jam TEXT);
		CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY);
	`);
	db.prepare('INSERT INTO users (id, username, role) VALUES (1, ?, ?)').run('hasbi', 'admin');
	db.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
	for (let i = 1; i <= siswaJumlah; i++) {
		db.prepare('INSERT INTO siswa (id, nama) VALUES (?, ?)').run(i, `Siswa ${i}`);
	}
	db.close();
}

function buatFixture() {
	dir = mkdtempSync(path.join(tmpdir(), 'simad-bkp-'));
	dbFile = path.join(dir, 'local.db');
	uploadsDir = path.join(dir, 'uploads');
	outDir = path.join(dir, 'backups');
	mkdirSync(path.join(uploadsDir, 'bel'), { recursive: true });
	mkdirSync(path.join(uploadsDir, 'foto_siswa'), { recursive: true });
	buatDb(dbFile, 2);
	writeFileSync(path.join(uploadsDir, 'logo-kemenag.png'), 'logo-biner');
	writeFileSync(path.join(uploadsDir, 'bel', 'masuk.mp3'), 'suara-bel');
	writeFileSync(path.join(uploadsDir, 'foto_siswa', '1.jpg'), 'foto-siswa');
	writeFileSync(path.join(uploadsDir, 'catatan.log'), 'harus-di-exclude');
}

beforeEach(buatFixture);
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('backup.service — createBackup', () => {
	it('membuat arsip dengan manifest pertama, DB, dan seluruh upload', async () => {
		const info = await createBackup({ source: 'ui', by: 'hasbi', dbFile, uploadsDir, outDir });
		expect(existsSync(info.path)).toBe(true);
		expect(info.name).toMatch(/^simad-backup-\d{8}-\d{6}-ui\.zip$/);

		const zip = new AdmZip(info.path);
		const names = zip.getEntries().map((e) => e.entryName);
		expect(names).toContain(MANIFEST_ENTRY);
		expect(names).toContain('local.db');
		expect(names).toContain('uploads/logo-kemenag.png');
		expect(names).toContain('uploads/bel/masuk.mp3');
		expect(names).toContain('uploads/foto_siswa/1.jpg');
		expect(names.some((n) => n.endsWith('.log'))).toBe(false);

		expect(info.manifest.app).toBe(APP_ID);
		expect(info.manifest.filesTotal).toBe(3);
		expect(info.manifest.dbRowCounts.siswa).toBe(2);
		expect(info.manifest.dbRowCounts.users).toBe(1);
		expect(info.manifest.schemaMigrations).toBe(1);
		expect(info.manifest.db.integrityCheck).toBe('ok');
	});

	it('tidak meninggalkan file .tmp- sama sekali', async () => {
		await createBackup({ source: 'cron', dbFile, uploadsDir, outDir });
		const sisa = readdirSync(outDir).filter((f) => f.startsWith('.tmp-'));
		expect(sisa).toEqual([]);
	});
});

describe('backup.service — verifyArchive', () => {
	it('lolos untuk arsip buatan sendiri', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		const m = await verifyArchive(info.path);
		expect(m.filesTotal).toBe(3);
	});

	it('gagal bila isi database diubah setelah arsip dibuat', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		const zip = new AdmZip(info.path);
		zip.addFile('local.db', Buffer.from('bukan-database-lagi'));
		zip.writeZip(info.path);
		await expect(verifyArchive(info.path)).rejects.toThrow(/(sha256|ukuran)/i);
	});

	it('gagal bila file upload hilang dari arsip', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		const zip = new AdmZip(info.path);
		zip.deleteFile('uploads/bel/masuk.mp3');
		zip.writeZip(info.path);
		await expect(verifyArchive(info.path)).rejects.toThrow(/hilang|tidak cocok/i);
	});
});

describe('backup.service — listBackups & deleteBackup', () => {
	it('mendaftar arsip dan menandai yang rusak', async () => {
		await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		const rusak = path.join(outDir, 'simad-backup-20260101-000000-cron.zip');
		new AdmZip().writeZip(rusak);
		const items = await listBackups(outDir);
		expect(items).toHaveLength(2);
		const broken = items.find((i) => i.broken);
		expect(broken?.name).toBe('simad-backup-20260101-000000-cron.zip');
		expect(items.find((i) => !i.broken)?.manifest?.app).toBe(APP_ID);
	});

	it('menolak nama di luar pola (path traversal) dan menghapus yang sah', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		await expect(deleteBackup('../local.db', outDir)).rejects.toThrow();
		await deleteBackup(info.name, outDir);
		expect(existsSync(info.path)).toBe(false);
	});

	it('readRestoreStatus mengembalikan null bila belum ada hasil', async () => {
		expect(await readRestoreStatus('/tidak/ada/file.json')).toBeNull();
	});
});

describe('backup.service — pruneBackups', () => {
	it('menyisakan 30 cron + 5 pre-restore dan tidak memangkas arsip ui', async () => {
		mkdirSync(outDir, { recursive: true });
		const buat = (source: string, i: number) => {
			const name = `simad-backup-20260101-${String(i).padStart(6, '0')}-${source}.zip`;
			const zip = new AdmZip();
			zip.addFile(
				MANIFEST_ENTRY,
				Buffer.from(
					JSON.stringify({
						app: APP_ID,
						formatVersion: FORMAT_VERSION,
						createdAt: 'x',
						createdAtLocal: 'x',
						source,
						createdBy: 'test',
						appVersion: '0.0.1',
						gitCommit: 'x',
						db: { path: 'local.db', bytes: 1, sha256: 'a'.repeat(64), integrityCheck: 'ok' },
						dbRowCounts: {},
						schemaMigrations: 1,
						files: [],
						filesTotal: 0,
						filesBytes: 0,
						excluded: []
					})
				)
			);
			const file = path.join(outDir, name);
			zip.writeZip(file);
			const t = new Date(2026, 0, 1, 0, 0, i).getTime() / 1000;
			utimesSync(file, t, t);
			return file;
		};
		for (let i = 0; i < 32; i++) buat('cron', i);
		for (let i = 0; i < 6; i++) buat('pre-restore', i);
		for (let i = 0; i < 2; i++) buat('ui', i);

		const dihapus = await pruneBackups(outDir, { keepCron: 30, keepPre: 5 });
		const sisa = readdirSync(outDir);
		expect(dihapus.filter((n) => n.includes('-cron.')).length).toBe(2);
		expect(dihapus.filter((n) => n.includes('-pre-restore.')).length).toBe(1);
		expect(sisa.filter((n) => n.includes('-cron.')).length).toBe(30);
		expect(sisa.filter((n) => n.includes('-pre-restore.')).length).toBe(5);
		expect(sisa.filter((n) => n.includes('-ui.')).length).toBe(2);
	});
});

describe('backup.service — inspectArchive & prepareRestore', () => {
	it('memvalidasi arsip yang diunggah dan menampilkan preview', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		const incoming = path.join(dir, 'incoming');
		mkdirSync(incoming, { recursive: true });
		const staged = path.join(incoming, 'unggahan.zip');
		copyFileSync(info.path, staged);

		const hasil = await inspectArchive('unggahan.zip', { incomingDir: incoming, dbFile, uploadsDir });
		expect(hasil.ok).toBe(true);
		expect(hasil.manifest.filesTotal).toBe(3);
		expect(hasil.preview.archive.dbRowCounts.siswa).toBe(2);
		expect(hasil.preview.current.filesTotal).toBe(3);
		expect(hasil.preview.deltas.siswa).toBe(0);
	});

	it('menolak arsip palsu tanpa manifest', async () => {
		const incoming = path.join(dir, 'incoming');
		mkdirSync(incoming, { recursive: true });
		new AdmZip().writeZip(path.join(incoming, 'palsu.zip'));
		await expect(inspectArchive('palsu.zip', { incomingDir: incoming })).rejects.toThrow();
	});

	it('prepareRestore membuat snapshot pengaman + pending.json', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir });
		const incoming = path.join(dir, 'incoming');
		const restoreDir = path.join(dir, 'restore');
		mkdirSync(incoming, { recursive: true });
		copyFileSync(info.path, path.join(incoming, 'unggahan.zip'));

		const pending = await prepareRestore('unggahan.zip', 'hasbi', {
			incomingDir: incoming,
			dbFile,
			uploadsDir,
			outDir,
			restoreDir
		});
		expect(pending.actor).toBe('hasbi');
		expect(pending.stagedPath.endsWith('unggahan.zip')).toBe(true);
		expect(pending.preRestoreName).toMatch(/^simad-backup-\d{8}-\d{6}-pre-restore\.zip$/);
		const safety = path.join(outDir, pending.preRestoreName);
		expect(existsSync(safety)).toBe(true);
		const dbSafety = new AdmZip(safety);
		const dbBuf = dbSafety.readFile('local.db') as Buffer;
		expect(sha256Buffer(dbBuf)).toHaveLength(64);
		expect(existsSync(path.join(restoreDir, 'pending.json'))).toBe(true);
	});
});
