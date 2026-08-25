// Import semua seed ke SQLite (idempoten: kosongkan dulu)
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { ptk, jtmSemester, skmtAjuan, roster } from '../src/lib/server/db/schema.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const seed = (f) => JSON.parse(fs.readFileSync(path.join(here, '..', 'seed', f), 'utf-8'));

const client = createClient({ url: 'file:local.db' });
const db = drizzle(client);

const emisJtm = seed('emis_jtm.json');
const skV = seed('sk_lampiran_v.json');
const skEskul = seed('sk_eskul.json');
const waliKelas = seed('wali_kelas.json');
const skmtStatus = seed('emis_skmt_status.json');
const rosterSeed = seed('roster.json');

function norm(n) {
	return String(n).toUpperCase()
		.replace(/\s*,.*$/, '')
		.replace(/^DRS\.?\s*H?\.?\s*/, '')
		.replace(/^HJ?\.?\s*/, '')
		.replace(/^KM\.\s*/, '')
		.replace(/[^A-Z ]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
const key = (n) => norm(n);

// buang baris non-nama
const JUNK = /^(JAM|NAMA|KETERANGAN|NO|\*|T ?E ?N ?T ?A ?N ?G|LAMPIRAN|NOMOR|TANGGAL|PEMBAGIAN|SEMESTER)/i;

async function main() {
	await db.delete(jtmSemester);
	await db.delete(skmtAjuan);
	await db.delete(roster);
	await db.delete(ptk);

	const names = new Map(); // key -> canonical display name
	for (const k of Object.keys(emisJtm)) names.set(key(k), k.trim());
	for (const r of [...skV, ...skEskul]) {
		const raw = String(r.nama).trim();
		if (!raw || JUNK.test(raw) || raw.length < 3) continue;
		if (/^(Pakue|Kepala MTsN|Mengetahui|Kamad|Wakamad)/i.test(raw)) continue;
		const k = key(raw);
		if (!names.has(k)) names.set(k, raw.replace(/\s*,.*$/, '').trim());
	}

	let nP = 0, nJ = 0, nS = 0, nR = 0;
	const idByKey = new Map();

	for (const [k, canonical] of names) {
		const e = emisJtm[k];
		const w = waliKelas.find((x) => key(x.nama) === k);
		const eskul = skEskul.filter((x) => key(x.nama) === k);
		const jabatan =
			w?.jabatan ??
			(eskul.length
				? `Pembina ${eskul.map((x) => x.tugas.replace(/^Pembina /i, '')).join(', ')}`
				: null);
		const [row] = await db.insert(ptk).values({
			nama: canonical,
			fungsi: 'Guru',
			sertifikasi: e ? e.sertifikasi : false,
			kelengkapan: e ? e.kelengkapan : null,
			aktivasi: true,
			waliKelas: w?.kelas ?? null,
			jabatanStruktural: jabatan,
			catatan: e ? null : 'Hanya ada di SK/roster (bukan di daftar guru EMIS)'
		}).returning({ id: ptk.id });
		idByKey.set(k, row.id);
		nP++;

		if (e) {
			await db.insert(jtmSemester).values({
				ptkId: row.id, mengajar: e.mengajar, tugas: e.tugas,
				totalS25a: e.total, dashboardTotal: e.dashboard, source: 'emis+sk'
			});
			nJ++;
		}
	}

	for (const s of skmtStatus) {
		const pid = idByKey.get(key(s.nama));
		if (!pid) { console.warn('skip skmt:', s.nama); continue; }
		await db.insert(skmtAjuan).values({
			ptkId: pid, periode: '2026/Semester 1', instansi: s.instansi,
			status: s.status, nilaiPembelajaran: s.nilai_p, nilaiBimbingan: s.nilai_b, tglAjuan: s.tgl
		});
		nS++;
	}

	for (const r of rosterSeed) {
		await db.insert(roster).values({
			kelas: r.kelas, hari: r.hari, jamKe: r.jam,
			mapel: r.mapel, guruNama: r.guru, guruKode: r.kode
		});
		nR++;
	}

	console.log(`import selesai: ptk=${nP} jtm=${nJ} skmt=${nS} roster=${nR}`);
	process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
