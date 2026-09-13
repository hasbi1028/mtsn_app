import { describe, it, expect, vi } from 'vitest';

/**
 * Regression test: filter "layak bansos" harus mengikuti semantik `isLayak`
 * yang dipakai UI (bukan dipadankan ke string 'LAYAK'/'AKTIF').
 *
 * Mock `$lib/server/db` diganti drizzle asli di atas SQLite in-memory agar
 * SQL service benar-benar dieksekusi.
 */
vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/db', async () => {
	const { default: Database } = await import('better-sqlite3');
	const { drizzle } = await import('drizzle-orm/better-sqlite3');

	const mem = new Database(':memory:');
	mem.exec(`
		CREATE TABLE siswa (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			kelas TEXT,
			bansos_desil TEXT,
			bansos_pkh TEXT,
			bansos_sembako TEXT,
			bansos_pbijk TEXT,
			bansos_cek_at TEXT
		);
	`);
	const insert = mem.prepare(
		'INSERT INTO siswa (kelas, bansos_desil, bansos_pkh, bansos_sembako, bansos_pbijk, bansos_cek_at) VALUES (?,?,?,?,?,?)'
	);
	// 2 siswa benar-benar terdaftar PBI-JK
	insert.run('7', '1', 'TIDAK', 'TIDAK', 'YA (JULI 2026)', '2026-01-01');
	insert.run('7', '2', 'TIDAK', 'TIDAK', 'YA (MARET 2026)', '2026-01-01');
	// 1 siswa layak PKH & Sembako (format lama 'LAYAK'/'AKTIF' juga harus dihitung)
	insert.run('8', '3', 'LAYAK', 'AKTIF', 'TIDAK', '2026-01-01');
	// 1 belum dicek (cek_at NULL)
	insert.run('8', null, null, null, null, null);
	// 1 belum dicek (semua string kosong)
	insert.run('9', '', '', '', '', '');

	return { db: drizzle(mem) };
});

import { getBansosStats } from '$modules/dashboard/dashboard.service';

describe('getBansosStats — semantik layak', () => {
	const stats = getBansosStats();

	it('menghitung total & sudah dicek', () => {
		expect(stats.totalSiswa).toBe(5);
		expect(stats.belumCek).toBe(2);
		expect(stats.sudahCek).toBe(3);
	});

	it("PBI-JK dihitung dari nilai 'YA' (bukan 'LAYAK')", () => {
		expect(stats.layakPbijk).toBe(2);
	});

	it('PKH/Sembako menghitung nilai non-TIDAK/kosong', () => {
		expect(stats.layakPkh).toBe(1);
		expect(stats.layakSembako).toBe(1);
	});
});
