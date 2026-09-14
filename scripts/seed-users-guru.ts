/**
 * seed-users-guru.ts — Buat akun login untuk semua PTK (guru & staf)
 *
 *Username: NIP (atau fallback ke nama lowercase bila NIP kosong)
 * Password default: 2026qwerty!
 * Role: guru (untuk yang fungsi=Guru) atau staf (untuk yang fungsi=Staf)
 *
 * Catatan:
 *   - Tidak menimpa user yang sudah ada (berdasarkan ref_id)
 *   - PTK tanpa NIP dan tanpa nama unik dilewati
 *   - Jalankan: npx tsx scripts/seed-users-guru.ts
 */

import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'crypto';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'local.db');
const DEFAULT_PASSWORD = '2026qwerty!';

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
	return `${salt}:${hash.toString('hex')}`;
}

function generateUsername(nama: string, nip: string | null): string | null {
	if (nip && nip.trim()) return nip.trim();
	if (!nama) return null;
	const clean = nama
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s.]/g, '')
		.replace(/\s+/g, '.')
		.replace(/\.+/g, '.')
		.replace(/^\.|\.$/g, '');
	return clean || null;
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Pastikan tabel users ada
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'admin',
		ref_id INTEGER,
		is_active INTEGER DEFAULT 1,
		must_change_password INTEGER NOT NULL DEFAULT 0,
		last_login TEXT,
		created_at INTEGER,
		updated_at TEXT
	)
`);

// Pastikan kolom must_change_password ada (untuk DB lama)
try {
	db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0`);
} catch {
	/* kolom sudah ada */
}

type PtkRow = { id: number; nama: string; nip: string | null; fungsi: string | null };

const ptkList = db
	.prepare('SELECT id, nama, nip, fungsi FROM ptk ORDER BY nama')
	.all() as PtkRow[];

const existingRefIds = new Set(
	(db.prepare('SELECT ref_id FROM users WHERE ref_id IS NOT NULL').all() as { ref_id: number }[]).map(
		(r) => r.ref_id
	)
);

const existingUsernames = new Set(
	(db.prepare('SELECT username FROM users').all() as { username: string }[]).map((r) => r.username)
);

let dibuat = 0;
let dilewati = 0;
let gagal = 0;

const stmtInsert = db.prepare(`
	INSERT INTO users (username, password_hash, role, ref_id, is_active, must_change_password, created_at)
	VALUES (?, ?, ?, ?, 1, 1, CAST(strftime('%s','now') * 1000 AS INTEGER))
`);

const insertMany = db.transaction(() => {
	for (const ptk of ptkList) {
		// Lewati jika sudah punya akun
		if (existingRefIds.has(ptk.id)) {
			dilewati++;
			continue;
		}

		const username = generateUsername(ptk.nama, ptk.nip);
		if (!username) {
			console.log(`  SKIP  #${ptk.id} ${ptk.nama} — tidak ada NIP dan nama tidak valid`);
			gagal++;
			continue;
		}

		// Cek username duplikat
		if (existingUsernames.has(username)) {
			console.log(`  SKIP  #${ptk.id} ${ptk.nama} — username "${username}" sudah dipakai`);
			gagal++;
			continue;
		}

		const role = ptk.fungsi?.toLowerCase().includes('staf') ? 'staf' : 'guru';
		const hash = hashPassword(DEFAULT_PASSWORD);

		try {
			stmtInsert.run(username, hash, role, ptk.id);
			existingUsernames.add(username);
			dibuat++;
			console.log(`  OK    #${ptk.id} ${ptk.nama}  →  ${username}  (${role})`);
		} catch (e) {
			console.log(`  FAIL  #${ptk.id} ${ptk.nama} — ${(e as Error).message}`);
			gagal++;
		}
	}
});

insertMany();

console.log(`\n═══════════════════════════════════════`);
console.log(`  Selesai!`);
console.log(`  Dibuat  : ${dibuat} akun`);
console.log(`  Lewati  : ${dilewati} (sudah punya akun)`);
console.log(`  Gagal   : ${gagal}`);
console.log(`  Password default: ${DEFAULT_PASSWORD}`);
console.log(`═══════════════════════════════════════`);

db.close();
