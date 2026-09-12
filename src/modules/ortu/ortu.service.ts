import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export function getSiswaForOrtu(userId: number) {
	const rows = db.all(sql`
		SELECT s.id, s.nama, s.nis, s.nisn, s.jk, s.kelas, s.rombel, s.tempat_lahir,
			s.tgl_lahir, s.alamat, s.no_hp, s.foto_path
		FROM siswa s
		JOIN siswa_ortu so ON s.id = so.siswa_id
		WHERE so.ortu_user_id = ${userId}
		LIMIT 1
	`);
	return rows[0] || null;
}

export function getSiswaList() {
	return db.all(sql`
		SELECT id, nama, nis, nisn, jk, kelas, rombel, tempat_lahir,
			tgl_lahir, alamat, no_hp, foto_path
		FROM siswa ORDER BY nama LIMIT 200
	`);
}
