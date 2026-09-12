import { db } from '$lib/server/db';
import { rombel, siswa, ptk } from '$lib/server/db/schema';
import { eq, sql, count, and, ne, like } from 'drizzle-orm';
import type { CreateRombel, UpdateRombel } from './rombel.validation';

export async function getRombelList() {
	const rows = db.all(sql`
		SELECT r.id, r.nama, r.kelas, r.label, COALESCE(r.wali_ptk_id,0) as wali_ptk_id,
			r.kapasitas, r.aktif,
			COALESCE(p.nama,'') AS wali_nama,
			(SELECT COUNT(*) FROM siswa s WHERE s.rombel = r.nama) AS jml_siswa
		FROM rombel r
		LEFT JOIN ptk p ON r.wali_ptk_id = p.id
		ORDER BY r.kelas, r.label
	`);
	return rows;
}

export async function getRombelStats() {
	const perKelas = db.all(sql`
		SELECT kelas, COUNT(*) as total,
			SUM(CASE WHEN rombel IS NULL OR rombel='' THEN 1 ELSE 0 END) as tanpa
		FROM siswa GROUP BY kelas ORDER BY kelas
	`);

	const totalSiswa = perKelas.reduce((a: number, r: any) => a + (r.total || 0), 0);
	const tanpa = perKelas.reduce((a: number, r: any) => a + (r.tanpa || 0), 0);
	const teralokasi = totalSiswa - tanpa;

	const rombelRow = db.all(sql`SELECT COUNT(*) as cnt FROM rombel WHERE aktif=1`);
	const totalRombel = (rombelRow[0] as any)?.cnt || 0;

	const perKelasMap: Record<string, any> = {};
	for (const r of perKelas as any[]) {
		perKelasMap[String(r.kelas)] = {
			total: r.total,
			teralokasi: r.total - r.tanpa,
			tanpa: r.tanpa
		};
	}

	return {
		total_rombel: totalRombel,
		total_siswa_teralokasi: teralokasi,
		siswa_tanpa_rombel: tanpa,
		total_siswa: totalSiswa,
		per_kelas: perKelasMap
	};
}

export async function getRombelDetail(id: number) {
	const row = db.all(sql`
		SELECT r.id, r.nama, r.kelas, r.label, COALESCE(r.wali_ptk_id,0) as wali_ptk_id,
			r.kapasitas, r.aktif, COALESCE(p.nama,'') as wali_nama
		FROM rombel r LEFT JOIN ptk p ON r.wali_ptk_id = p.id
		WHERE r.id = ${id}
	`);
	if (!row.length) return null;

	const rom = row[0] as any;
	const siswaRows = db.all(sql`
		SELECT id, nama, nis, nisn, jk, status_emis
		FROM siswa WHERE rombel = ${rom.nama} ORDER BY nama
	`);

	return { ...rom, jml_siswa: siswaRows.length, siswa: siswaRows };
}

export async function createRombel(data: CreateRombel) {
	db.run(sql`INSERT INTO rombel (nama, kelas, label, kapasitas) VALUES (${data.nama}, ${data.kelas}, ${data.label}, ${data.kapasitas})`);
}

export async function updateRombel(id: number, data: UpdateRombel) {
	db.run(sql`UPDATE rombel SET kapasitas=${data.kapasitas}, aktif=${data.aktif}, updated_at=datetime('now','localtime') WHERE id=${id}`);
}

export async function deleteRombel(id: number) {
	const row = db.all(sql`SELECT nama FROM rombel WHERE id=${id}`);
	if (!row.length) return { ok: false, error: 'Rombel tidak ditemukan' };

	const nama = (row[0] as any).nama;
	const cnt = db.all(sql`SELECT COUNT(*) as cnt FROM siswa WHERE rombel=${nama}`);
	if ((cnt[0] as any).cnt > 0) {
		return { ok: false, error: `Tidak bisa hapus: ${(cnt[0] as any).cnt} siswa masih di rombel ${nama}` };
	}

	db.run(sql`DELETE FROM rombel WHERE id=${id}`);
	return { ok: true, pesan: 'Rombel dihapus' };
}

export async function allocateSiswa(rombelId: number, siswaIds: number[]) {
	const row = db.all(sql`SELECT nama, kapasitas FROM rombel WHERE id=${rombelId}`);
	if (!row.length) return { ok: false, error: 'Rombel tidak ditemukan' };

	const rom = row[0] as any;
	const cur = db.all(sql`SELECT COUNT(*) as cnt FROM siswa WHERE rombel=${rom.nama}`);
	if ((cur[0] as any).cnt + siswaIds.length > rom.kapasitas) {
		return { ok: false, error: 'Melebihi kapasitas rombel' };
	}

	for (const sid of siswaIds) {
		db.run(sql`UPDATE siswa SET rombel=${rom.nama} WHERE id=${sid}`);
	}

	return { ok: true, pesan: `${siswaIds.length} siswa dialokasikan ke ${rom.nama}` };
}

export async function removeSiswa(rombelId: number, siswaId: number) {
	const row = db.all(sql`SELECT nama FROM rombel WHERE id=${rombelId}`);
	if (!row.length) return { ok: false, error: 'Rombel tidak ditemukan' };

	const nama = (row[0] as any).nama;
	db.run(sql`UPDATE siswa SET rombel='' WHERE id=${siswaId} AND rombel=${nama}`);
	return { ok: true, pesan: 'Siswa dikeluarkan' };
}

export async function setWaliKelas(rombelId: number, ptkId: number) {
	db.run(sql`UPDATE rombel SET wali_ptk_id=${ptkId}, updated_at=datetime('now','localtime') WHERE id=${rombelId}`);
	return { ok: true, pesan: 'Wali kelas ditetapkan' };
}

export async function getRombelSiswa(rombelId: number) {
	const row = db.all(sql`SELECT nama FROM rombel WHERE id=${rombelId}`);
	if (!row.length) return [];
	const nama = (row[0] as any).nama;
	return db.all(sql`SELECT id, nama, nis, nisn, jk, status_emis FROM siswa WHERE rombel=${nama} ORDER BY nama`);
}

export async function getAvailableSiswa() {
	return db.all(sql`SELECT id, nama, nis, nisn, jk, kelas FROM siswa WHERE rombel IS NULL OR rombel='' ORDER BY nama`);
}
