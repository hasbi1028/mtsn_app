import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MANIFEST_ENTRY } from './guards';
import { createBackup } from '../../../modules/backup/backup.service';
import { applyRestore, compareRowCounts, detectDbLock, planSwap } from './apply';

let dir: string;
let dbFile: string;
let uploadsDir: string;
let backupDir: string;
let restoreDir: string;

function buatDb(file: string, siswa: number) {
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
	for (let i = 1; i <= siswa; i++) db.prepare('INSERT INTO siswa (id, nama) VALUES (?, ?)').run(i, `Siswa ${i}`);
	db.close();
}

function siswaSekarang(file: string): number {
	const db = new Database(file, { readonly: true });
	try {
		return (db.prepare('SELECT COUNT(*) AS c FROM siswa').get() as { c: number }).c;
	} finally {
		db.close();
	}
}

beforeEach(() => {
	dir = mkdtempSync(path.join(tmpdir(), 'simad-apply-'));
	dbFile = path.join(dir, 'local.db');
	uploadsDir = path.join(dir, 'uploads');
	backupDir = path.join(dir, 'backups');
	restoreDir = path.join(dir, 'restore');
	mkdirSync(path.join(uploadsDir, 'foto_siswa'), { recursive: true });
	buatDb(dbFile, 3);
	writeFileSync(path.join(uploadsDir, 'foto_siswa', '1.jpg'), 'foto-1');
	writeFileSync(path.join(uploadsDir, 'logo-kemenag.png'), 'logo');
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('apply — detectDbLock', () => {
	it('melaporkan bebas untuk file yang tidak dipakai proses lain', () => {
		const r = detectDbLock(dbFile);
		expect(r.locked).toBe(false);
		expect(r.message).toBe('');
	});

	it('melaporkan terkunci + instruksi pm2 saat DB masih dibuka', () => {
		const handle = new Database(dbFile);
		try {
			const r = detectDbLock(dbFile);
			expect(r.locked).toBe(true);
			expect(r.message).toMatch(/pm2 stop simad-bel mtsn-app-bff/);
		} finally {
			handle.close();
		}
	});
});

describe('apply — planSwap & compareRowCounts', () => {
	it('menghasilkan urutan langkah swap dengan target .replaced-<stamp>', () => {
		const steps = planSwap({ dbFile, uploadsDir, stagedDir: path.join(dir, 'staged'), stamp: '20260913-230000' });
		const aksi = steps.map((s) => `${s.action}:${path.basename(s.from ?? '')}->${path.basename(s.to ?? '')}`);
		expect(aksi[0]).toBe(`rename:${path.basename(dbFile)}->${path.basename(dbFile)}.replaced-20260913-230000`);
		expect(aksi[1]).toBe('remove:local.db-wal->');
		expect(aksi[2]).toBe('remove:local.db-shm->');
		expect(aksi[3]).toBe('move:local.db->local.db');
		expect(aksi[4]).toBe(`rename:uploads->uploads.replaced-20260913-230000`);
		expect(aksi[5]).toBe('move:uploads->uploads');
	});

	it('mendeteksi tabel yang jumlah barisnya tidak cocok manifest', () => {
		expect(compareRowCounts({ siswa: 3, ptk: 0 }, { siswa: 3, ptk: 0 })).toEqual([]);
		expect(compareRowCounts({ siswa: 3 }, { siswa: 999 })).toEqual(['siswa (manifest 3, hasil 999)']);
		expect(compareRowCounts({ siswa: 3 }, {})).toEqual(['siswa (manifest 3, hasil 0)']);
	});
});

describe('apply — applyRestore', () => {
	it('dry-run tidak mengubah berkas apa pun', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir: backupDir });
		const db = new Database(dbFile);
		db.prepare('DELETE FROM siswa WHERE id = 3').run();
		db.close();
		writeFileSync(path.join(uploadsDir, 'baru.txt'), 'baru');

		const res = await applyRestore({
			zipPath: info.path,
			dryRun: true,
			dbFile,
			uploadsDir,
			restoreDir,
			backupDir
		});
		expect(res.ok).toBe(true);
		expect(res.dryRun).toBe(true);
		expect(siswaSekarang(dbFile)).toBe(2);
		expect(existsSync(path.join(uploadsDir, 'baru.txt'))).toBe(true);
	});

	it('memulihkan DB + uploads, menghapus -wal/-shm lama, dan menulis last-result', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir: backupDir });
		const db = new Database(dbFile);
		db.prepare('DELETE FROM siswa WHERE id >= 2').run();
		db.close();
		writeFileSync(path.join(uploadsDir, 'sampah.txt'), 'buang');
		writeFileSync(dbFile + '-wal', 'wal-lama');
		writeFileSync(dbFile + '-shm', 'shm-lama');

		const res = await applyRestore({ zipPath: info.path, actor: 'hasbi', dbFile, uploadsDir, restoreDir, backupDir });
		expect(res.ok).toBe(true);
		expect(res.rolledBack).toBeFalsy();
		expect(siswaSekarang(dbFile)).toBe(3);
		expect(existsSync(path.join(uploadsDir, 'foto_siswa', '1.jpg'))).toBe(true);
		expect(existsSync(path.join(uploadsDir, 'sampah.txt'))).toBe(false);
		expect(existsSync(dbFile + '-wal')).toBe(false);
		expect(existsSync(dbFile + '-shm')).toBe(false);
		expect(res.filesTotal).toBe(2);
		expect(res.dbRowCounts?.siswa).toBe(3);

		const hasil = JSON.parse(readFileSync(path.join(restoreDir, 'last-result.json'), 'utf-8'));
		expect(hasil.ok).toBe(true);
		expect(hasil.actor).toBe('hasbi');
	});

	it('rollback otomatis bila hasil restore tidak cocok manifest', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir: backupDir });
		// rusak manifest: klaim jumlah siswa yang mustahil → verifikasi pasca-swap gagal
		const zip = new AdmZip(info.path);
		const m = JSON.parse((zip.readFile(MANIFEST_ENTRY) as Buffer).toString('utf-8'));
		m.dbRowCounts.siswa = 999;
		zip.addFile(MANIFEST_ENTRY, Buffer.from(JSON.stringify(m, null, 2)));
		zip.writeZip(info.path);

		const db = new Database(dbFile);
		db.prepare('DELETE FROM siswa WHERE id = 1').run();
		db.close();
		expect(siswaSekarang(dbFile)).toBe(2);

		const res = await applyRestore({ zipPath: info.path, actor: 'hasbi', dbFile, uploadsDir, restoreDir, backupDir });
		expect(res.ok).toBe(false);
		expect(res.rolledBack).toBe(true);
		// data sebelum swap harus utuh kembali
		expect(siswaSekarang(dbFile)).toBe(2);
		expect(existsSync(path.join(uploadsDir, 'logo-kemenag.png'))).toBe(true);
	});

	it('menyisipkan ulang sesi admin pelaku bila diminta', async () => {
		const db = new Database(dbFile);
		db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, 1, 9999999999999)').run('sesi-pelaku');
		db.close();

		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir: backupDir });
		const res = await applyRestore({
			zipPath: info.path,
			dbFile,
			uploadsDir,
			restoreDir,
			backupDir,
			keepSession: 'sesi-pelaku'
		});
		expect(res.ok).toBe(true);
		const cek = new Database(dbFile, { readonly: true });
		try {
			const row = cek.prepare('SELECT user_id FROM sessions WHERE token = ?').get('sesi-pelaku');
			expect(row).toBeTruthy();
		} finally {
			cek.close();
		}
	});

	it('menolak arsip yang rusak sebelum menyentuh data', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir: backupDir });
		const zip = new AdmZip(info.path);
		zip.addFile('local.db', Buffer.from('rusak'));
		zip.writeZip(info.path);
		const res = await applyRestore({ zipPath: info.path, dbFile, uploadsDir, restoreDir, backupDir });
		expect(res.ok).toBe(false);
		expect(res.rolledBack).toBeFalsy();
		expect(siswaSekarang(dbFile)).toBe(3);
	});

	it('menolak berjalan saat DB masih terkunci proses lain', async () => {
		const info = await createBackup({ source: 'ui', dbFile, uploadsDir, outDir: backupDir });
		const handle = new Database(dbFile);
		try {
			const res = await applyRestore({ zipPath: info.path, dbFile, uploadsDir, restoreDir, backupDir });
			expect(res.ok).toBe(false);
			expect(res.error).toMatch(/pm2 stop/);
		} finally {
			handle.close();
		}
	});
});
