import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export function getRosterList(kelas: string) {
	const kelasList = db.all(sql`
		SELECT nama FROM rombel WHERE aktif=1 ORDER BY kelas, label
	`).map((r: any) => r.nama);

	if (kelasList.length === 0) {
		kelasList.push('VII-A', 'VII-B', 'VII-C', 'VII-D', 'VII-E', 'VIII-A', 'VIII-B', 'VIII-C', 'VIII-D', 'IX-A', 'IX-B', 'IX-C');
	}

	if (!kelas && kelasList.length > 0) {
		kelas = kelasList[0];
	}

	const rows = db.all(sql`
		SELECT r.hari, r.jam_ke AS jamKe, r.mapel, r.guru_nama AS guru
		FROM roster r
		WHERE r.kelas = ${kelas}
		ORDER BY
			CASE REPLACE(r.hari, CHAR(96), '')
				WHEN 'SENIN' THEN 1 WHEN 'SELASA' THEN 2 WHEN 'RABU' THEN 3
				WHEN 'KAMIS' THEN 4 WHEN 'JUMAT' THEN 5 WHEN 'SABTU' THEN 6
			END,
			CASE r.jam_ke
				WHEN 'I' THEN 1 WHEN 'II' THEN 2 WHEN 'III' THEN 3 WHEN 'IV' THEN 4
				WHEN 'V' THEN 5 WHEN 'VI' THEN 6 WHEN 'VII' THEN 7 WHEN 'VIII' THEN 8
				WHEN 'IX' THEN 9 ELSE 99
			END,
			kelas
	`);

	return { kelas, daftarKelas: kelasList, rows };
}
