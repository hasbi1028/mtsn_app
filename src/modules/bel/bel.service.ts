import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { jamBel, belSettings } from '$lib/server/db/schema';

export function getBelJadwal() {
	const rows = db.all(sql`
		SELECT id, hari, jam, jenis, COALESCE(label,'') as label, sound_path, repeat, aktif
		FROM jam_bel
		ORDER BY CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3
			WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END, jam
	`);

	const now = new Date();
	const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
	const hariIni = dayNames[now.getDay()];
	const jadwalHariIni = rows.filter((r: any) => r.hari === hariIni);

	return { hari_ini: hariIni, jadwal_hari_ini: jadwalHariIni, semua: rows };
}

export function getBelSuara() {
	const files: string[] = [];
	return { files };
}

export function createBelJadwal(data: { hari: string; jam: string; jenis: string; label: string; sound_path: string; repeat: number }) {
	db.run(sql`INSERT INTO jam_bel (hari, jam, jenis, label, sound_path, repeat) VALUES (${data.hari}, ${data.jam}, ${data.jenis}, ${data.label}, ${data.sound_path}, ${data.repeat})`);
}

export function updateBelJadwal(id: string, data: { hari: string; jam: string; jenis: string; label: string; sound_path: string; repeat: number }) {
	db.run(sql`UPDATE jam_bel SET hari=${data.hari}, jam=${data.jam}, jenis=${data.jenis}, label=${data.label}, sound_path=${data.sound_path}, repeat=${data.repeat} WHERE id=${id}`);
}

export function toggleBelJadwal(id: string, aktif: number) {
	db.run(sql`UPDATE jam_bel SET aktif=${aktif} WHERE id=${id}`);
}

export function deleteBelJadwal(id: string) {
	db.run(sql`DELETE FROM jam_bel WHERE id=${id}`);
}

export function getBelMaster() {
	const row = db.all(sql`SELECT enabled FROM bel_settings LIMIT 1`);
	return (row[0] as any)?.enabled ?? false;
}

export function setBelMaster(enabled: boolean) {
	const row = db.all(sql`SELECT id FROM bel_settings LIMIT 1`);
	if (row.length) {
		db.run(sql`UPDATE bel_settings SET enabled=${enabled ? 1 : 0} WHERE id=${(row[0] as any).id}`);
	} else {
		db.run(sql`INSERT INTO bel_settings (enabled) VALUES (${enabled ? 1 : 0})`);
	}
}
