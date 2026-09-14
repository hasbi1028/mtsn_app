#!/usr/bin/env node
/**
 * Migrasi akun login guru & staf (spec 030).
 *
 * Sumber NIP : C:\Users\LENOVO\Downloads\pegawai-backup-2026-08-28.json
 * (bisa dioverride lewat env PEGAWAI_JSON)
 *
 * Yang dilakukan:
 *  1. Backup local.db (via Online Backup API)
 *  2. Tambah kolom users.must_change_password bila belum ada
 *  3. Isi ptk.nip dari JSON (match nama ternormalisasi)
 *  4. Buat baris ptk baru untuk pegawai JSON yang belum ada (role staf)
 *  5. Nonaktifkan akun guru/staf lama (guru_<id>, staf)
 *  6. Buat/perbarui akun: username = NIP, password seragam, wajib ganti
 *  7. Akun PTK tanpa NIP dinonaktifkan
 *
 * Pemakaian:
 *   node --import tsx scripts/migrate-guru-login.ts            # dry-run (default)
 *   node --import tsx scripts/migrate-guru-login.ts --apply    # tulis ke DB
 */
import Database from 'better-sqlite3';
import { scryptSync, randomBytes } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || 'local.db';
const JSON_PATH =
	process.env.PEGAWAI_JSON || 'C:\\Users\\LENOVO\\Downloads\\pegawai-backup-2026-08-28.json';
const DEFAULT_PASSWORD = '2026qwerty!';
const APPLY = process.argv.includes('--apply');

// Pegawai yang sudah punya akun sendiri (mis. admin) — tidak dibuatkan akun staf baru.
const SKIP_NIPS = new Set(['199210282025211017']); // HASBI AWAL (admin 'hasbi')

const TITLES = [
	'A MA PD',
	'S PD I',
	'S PDI',
	'S PD',
	'S AG',
	'S KOM',
	'S AP',
	'S A P',
	'S H',
	'S SI',
	'S E',
	'SPD',
	'SAG',
	'SKOM',
	'SE',
	'MM',
	'M PD',
	'MPD',
	'DRA',
	'DRS'
];

function norm(nama: string): string {
	let s = (nama || '').toUpperCase();
	s = s.replace(/[.,]/g, ' ');
	s = s.replace(/\s+/g, ' ').trim();
	for (const t of TITLES) {
		s = s.replace(new RegExp('(^| )' + t.replace(/ /g, ' +') + '( |$)', 'g'), ' ');
	}
	return s.replace(/\s+/g, ' ').trim();
}

function cleanNama(nama: string): string {
	return norm(nama);
}

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
	return `${salt}:${hash.toString('hex')}`;
}

function roleFor(fungsi: string | null): string {
	return (fungsi || '').toLowerCase().includes('staf') ? 'staf' : 'guru';
}

interface Pegawai {
	nip: string;
	nama: string;
	password: string;
	aktif: boolean;
}

interface PtkRow {
	id: number;
	nama: string;
	nip: string | null;
	fungsi: string | null;
	user_emis: string | null;
}

async function main() {
	if (!existsSync(JSON_PATH)) throw new Error(`JSON tidak ditemukan: ${JSON_PATH}`);
	const pegawai: Pegawai[] = JSON.parse(readFileSync(JSON_PATH, 'utf8')).pegawai.filter(
		(p: Pegawai) => !SKIP_NIPS.has(p.nip)
	);

	const db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');

	const nowStamp = new Date()
		.toISOString()
		.replace(/[-:T]/g, '')
		.slice(0, 14);

	console.log('='.repeat(64));
	console.log(APPLY ? 'MIGRASI AKUN GURU/STAF — APPLY' : 'MIGRASI AKUN GURU/STAF — DRY RUN');
	console.log('='.repeat(64));
	console.log(`DB     : ${path.resolve(DB_PATH)}`);
	console.log(`JSON   : ${JSON_PATH}`);
	console.log(`Pegawai: ${pegawai.length} baris`);
	console.log('');

	// ── 2. Kolom must_change_password (dicek lebih dulu agar report akurat) ──
	const userCols = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map(
		(c) => c.name
	);
	const hasMustChange = userCols.includes('must_change_password');

	// ── 3. Match ptk <-> pegawai ──────────────────────────────────────────
	const ptkRows: PtkRow[] = db
		.prepare('SELECT id, nama, nip, fungsi, user_emis FROM ptk ORDER BY id')
		.all() as PtkRow[];

	const jsonByNorm = new Map<string, Pegawai>();
	for (const p of pegawai) jsonByNorm.set(norm(p.nama), p);

	const matchedPtk = new Map<number, Pegawai>(); // ptk.id -> pegawai
	const matchedNip = new Set<string>();
	const unmatchedPtk: PtkRow[] = [];

	for (const row of ptkRows) {
		const p = jsonByNorm.get(norm(row.nama));
		if (p) {
			matchedPtk.set(row.id, p);
			matchedNip.add(p.nip);
		} else {
			unmatchedPtk.push(row);
		}
	}

	const newPegawai = pegawai.filter((p) => !matchedNip.has(p.nip));

	console.log(`PTK cocok NIP      : ${matchedPtk.size}`);
	console.log(`PTK tanpa NIP      : ${unmatchedPtk.length}`);
	console.log(`Pegawai baru (ptk) : ${newPegawai.length}`);
	for (const p of newPegawai) console.log(`   + ${p.nip} | ${cleanNama(p.nama)}`);
	console.log('');

	// ── Bangun rencana akun ───────────────────────────────────────────────
	// Kelompokkan ptk yang cocok per NIP; pilih satu baris utama (ber-EMIS, id terkecil).
	type Account = { nip: string; nama: string; role: string; refId: number; ptkId: number };
	const byNip = new Map<string, PtkRow[]>();
	for (const [ptkId, p] of matchedPtk) {
		const arr = byNip.get(p.nip) ?? [];
		arr.push(ptkRows.find((r) => r.id === ptkId)!);
		byNip.set(p.nip, arr);
	}

	const accounts: Account[] = [];
	const duplicatePtkIds: number[] = [];
	for (const [nip, rows] of byNip) {
		const sorted = [...rows].sort((a, b) => {
			const ea = a.user_emis ? 0 : 1;
			const eb = b.user_emis ? 0 : 1;
			if (ea !== eb) return ea - eb;
			return a.id - b.id;
		});
		const utama = sorted[0];
		const peg = matchedPtk.get(utama.id)!;
		accounts.push({
			nip,
			nama: cleanNama(peg.nama),
			role: roleFor(utama.fungsi),
			refId: utama.id,
			ptkId: utama.id
		});
		for (const dup of sorted.slice(1)) duplicatePtkIds.push(dup.id);
	}

	// Pegawai baru (belum ada di ptk) → role staf
	for (const p of newPegawai) {
		accounts.push({
			nip: p.nip,
			nama: cleanNama(p.nama),
			role: 'staf',
			refId: -1, // diisi setelah insert
			ptkId: -1
		});
	}

	console.log('--- Rencana akun ---');
	for (const a of accounts) console.log(`  ${a.role.padEnd(5)} | ${a.nip} | ${a.nama}`);
	console.log('');
	console.log('--- PTK tanpa NIP (akun lama dinonaktifkan) ---');
	for (const r of unmatchedPtk) console.log(`  ${r.id} | ${r.fungsi} | ${r.nama}`);
	console.log('');

	if (!APPLY) {
		console.log('DRY RUN selesai. Jalankan ulang dengan --apply untuk menulis.');
		db.close();
		return;
	}

	// ── 1. Backup ─────────────────────────────────────────────────────────
	mkdirSync('data', { recursive: true });
	const backupPath = path.join('data', `backup_pra_guru_login_${nowStamp}.db`);
	await db.backup(backupPath);
	console.log(`[OK] Backup: ${backupPath}`);

	const run = db.transaction(() => {
		// Kolom must_change_password
		if (!hasMustChange) {
			db.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0');
			console.log('[OK] ALTER TABLE users ADD must_change_password');
		} else {
			console.log('[SKIP] Kolom must_change_password sudah ada');
		}

		// Set NIP ptk
		const setNip = db.prepare('UPDATE ptk SET nip = ? WHERE id = ?');
		for (const [ptkId, p] of matchedPtk) setNip.run(p.nip, ptkId);
		console.log(`[OK] Isi NIP untuk ${matchedPtk.size} baris ptk`);

		// Ptk baru untuk pegawai yang belum ada
		const insertPtk = db.prepare(
			'INSERT INTO ptk (public_id, nama, nip, fungsi) VALUES (?, ?, ?, ?)'
		);
		for (const a of accounts) {
			if (a.refId !== -1) continue;
			const info = insertPtk.run(`PTK-${randomBytes(4).toString('hex')}`, a.nama, a.nip, 'Staf TU');
			a.refId = Number(info.lastInsertRowid);
			a.ptkId = a.refId;
		}

		// Nonaktifkan semua akun guru & staf lama
		const deact = db
			.prepare("UPDATE users SET is_active = 0 WHERE role IN ('guru','staf')")
			.run();
		console.log(`[OK] Nonaktifkan ${deact.changes} akun guru/staf lama`);

		// Buat/perbarui akun berbasis NIP
		const findUser = db.prepare('SELECT id FROM users WHERE username = ?');
		const insertUser = db.prepare(
			`INSERT INTO users (username, password_hash, role, ref_id, is_active, must_change_password)
			 VALUES (?, ?, ?, ?, 1, 1)`
		);
		const updateUser = db.prepare(
			`UPDATE users SET password_hash = ?, role = ?, ref_id = ?, is_active = 1, must_change_password = 1
			 WHERE username = ?`
		);
		const hash = hashPassword(DEFAULT_PASSWORD);
		let created = 0;
		let updated = 0;
		for (const a of accounts) {
			const existing = findUser.get(a.nip) as { id: number } | undefined;
			if (existing) {
				updateUser.run(hash, a.role, a.refId, a.nip);
				updated++;
			} else {
				insertUser.run(a.nip, hash, a.role, a.refId);
				created++;
			}
		}
		console.log(`[OK] Akun dibuat: ${created}, diperbarui: ${updated}`);
		if (duplicatePtkIds.length)
			console.log(`[INFO] PTK duplikat dilewati: ${duplicatePtkIds.join(', ')}`);
	});

	run();

	console.log('');
	const summary = db
		.prepare(
			"SELECT role, COUNT(*) c FROM users WHERE is_active = 1 GROUP BY role ORDER BY role"
		)
		.all() as { role: string; c: number }[];
	console.log('--- Akun aktif per role ---');
	for (const s of summary) console.log(`  ${s.role.padEnd(10)}: ${s.c}`);

	db.close();
	console.log('\nSelesai. Password awal semua akun baru: ' + DEFAULT_PASSWORD);
}

main().catch((e) => {
	console.error('GAGAL:', e);
	process.exit(1);
});
