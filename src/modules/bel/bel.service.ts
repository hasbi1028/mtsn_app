import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { jamBel, belSettings } from '$lib/server/db/schema';

const BEL_API = 'http://localhost:8093';

export async function belProxy(method: string, path: string, body?: any) {
	const res = await fetch(`${BEL_API}${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : {},
		body: body ? JSON.stringify(body) : undefined
	});
	return await res.json().catch(() => ({ ok: false, error: 'Bel service offline' }));
}

export async function getBelStatus() {
	return belProxy('GET', '/api/status').catch(() => ({ ok: false, offline: true }));
}

export async function getBelSuaraFromWorker() {
	return belProxy('GET', '/api/suara').catch(() => ({ files: [] }));
}

export async function playBell(file: string) {
	return belProxy('POST', '/api/play', { path: file, repeat: 1 });
}

export async function stopBell() {
	return belProxy('POST', '/api/stop');
}

export async function toggleMaster(enabled: boolean) {
	return belProxy('POST', '/api/master', { enabled });
}

export async function uploadSuaraToWorker(formData: FormData) {
	const res = await fetch(`${BEL_API}/api/suara`, { method: 'POST', body: formData });
	return res.json();
}

export async function deleteSuaraFromWorker(name: string) {
	return belProxy('DELETE', `/api/suara/${encodeURIComponent(name)}`);
}

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
