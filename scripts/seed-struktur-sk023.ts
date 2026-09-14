/**
 * seed-struktur-sk023.ts — isi unit & anggota struktur organisasi dari data acuan
 * (scripts/struktur-sk023.json, hasil `scripts/struktur-dari-html.mjs` dari
 *  struktur-foto-v2-premium.html / SK No. 023/2026).
 *
 * Jalankan:
 *   npx tsx scripts/seed-struktur-sk023.ts            # isi bila tabel masih kosong
 *   npx tsx scripts/seed-struktur-sk023.ts --reset    # kosongkan dulu lalu isi ulang
 *   DB_PATH=local.db (default)
 *
 * Skrip ini TIDAK PERNAH mengubah/menghapus baris di tabel `ptk` — nama yang belum ada
 * di `ptk` disimpan sebagai entri luar (nama_manual) dan dilaporkan di akhir.
 * DDL di bawah harus sama dengan `ensureStrukturTables()` di src/modules/struktur/struktur.service.ts.
 */
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type Anggota = {
	unitKode: string;
	nama: string;
	gelar: string;
	jabatan: string;
	keterangan: string;
	urutan: number;
};
type Unit = { kode: string; nama: string; kelompok: string; tipe: string; kolom: number; urutan: number };
type Data = {
	sumber: string;
	badge: string;
	kop: string;
	judul: string;
	madrasah: string;
	tahun: string;
	tempatTgl: string;
	kamadNama: string;
	kamadNip: string;
	catatanKaki: string;
	units: Unit[];
	anggota: Anggota[];
};

const DB_PATH = process.env.DB_PATH ?? 'local.db';
const JSON_PATH = join('scripts', 'struktur-sk023.json');
const RESET = process.argv.includes('--reset');

/* ── util nama ───────────────────────────────────────────── */
const TITEL = new Set(['KM', 'K', 'M', 'MUH', 'A', 'ABD', 'H', 'HJ', 'DRA', 'DRS']);
const GELAR_RE =
	/\b(S\.?PD\.?,?\s*GR|S\.?PD\.?I|S\.?PD|S\.?AG|S\.?KOM|S\.?E|S\.?H|S\.?OR|S\.?AP|S\.?AK|M\.?PD|S\.?IP|S\.?SI|S\.?SOS|S\.?TH|A\.?MA|DRA|DRS|HJ|H)\b\.?/g;

function core(nama: string): string {
	let n = (nama ?? '').toUpperCase().normalize('NFKD');
	n = n.replace(/[*•]/g, ' ');
	n = n.replace(/KM\.?/g, ' MUHAMMAD ').replace(/\bMUH\.?/g, ' MUHAMMAD ');
	n = n.replace(GELAR_RE, ' ');
	n = n.replace(/[^A-Z ]/g, ' ');
	return n
		.split(/\s+/)
		.filter((t) => t.length >= 2 && !TITEL.has(t))
		.join(' ');
}

/* ── siapkan DB ──────────────────────────────────────────── */
if (!existsSync(DB_PATH)) {
	console.error(`DB tidak ditemukan: ${DB_PATH}`);
	process.exit(1);
}
const data = JSON.parse(readFileSync(JSON_PATH, 'utf8')) as Data;

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS struktur_unit (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	kode TEXT NOT NULL UNIQUE,
	nama TEXT NOT NULL,
	tipe TEXT NOT NULL DEFAULT 'unit',
	kelompok TEXT,
	parent_kode TEXT,
	kolom INTEGER NOT NULL DEFAULT 1,
	urutan INTEGER NOT NULL DEFAULT 0,
	tampil_bagan INTEGER NOT NULL DEFAULT 1,
	aktif INTEGER NOT NULL DEFAULT 1,
	catatan TEXT,
	created_at TEXT DEFAULT (datetime('now','localtime')),
	updated_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS struktur_anggota (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	unit_kode TEXT NOT NULL,
	ptk_id INTEGER,
	nama_manual TEXT,
	nip_manual TEXT,
	gelar TEXT,
	jabatan_tampil TEXT,
	keterangan TEXT,
	urutan INTEGER NOT NULL DEFAULT 0,
	tampil_bagan INTEGER NOT NULL DEFAULT 1,
	aktif INTEGER NOT NULL DEFAULT 1,
	created_at TEXT DEFAULT (datetime('now','localtime')),
	updated_at TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_struktur_anggota_unit ON struktur_anggota(unit_kode);
CREATE INDEX IF NOT EXISTS idx_struktur_anggota_ptk ON struktur_anggota(ptk_id);
CREATE TABLE IF NOT EXISTS pengaturan (
	key TEXT PRIMARY KEY,
	value TEXT,
	updated_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

const jumlahUnit = (db.prepare('SELECT COUNT(*) AS c FROM struktur_unit').get() as { c: number }).c;
const jumlahAnggota = (db.prepare('SELECT COUNT(*) AS c FROM struktur_anggota').get() as { c: number }).c;

if ((jumlahUnit > 0 || jumlahAnggota > 0) && !RESET) {
	console.log(
		`Tabel struktur sudah berisi ${jumlahUnit} unit / ${jumlahAnggota} anggota — tidak diubah.\n` +
			'Jalankan dengan --reset bila memang ingin menimpa dengan data acuan.'
	);
	process.exit(0);
}

/* ── pemetaan ke ptk (read-only) ─────────────────────────── */
type Ptk = { id: number; nama: string; nip: string | null; wali_kelas: string | null; jabatan_struktural: string | null };
const ptk = db
	.prepare('SELECT id, nama, nip, wali_kelas, jabatan_struktural FROM ptk')
	.all() as Ptk[];

/** Token mirip: sama, atau beda tipis (huruf dobel/kurang, awalan sama ≥5 huruf). */
function tokenMirip(a: string, b: string): boolean {
	if (a === b) return true;
	const ra = a.replace(/(.)\1+/g, '$1');
	const rb = b.replace(/(.)\1+/g, '$1');
	if (ra === rb) return true;
	if (a.length >= 5 && b.length >= 5) {
		if (a.startsWith(b) || b.startsWith(a)) return true;
		// beda maksimal 1 huruf (hanya untuk token panjang)
		if (Math.abs(a.length - b.length) <= 1) {
			let beda = 0;
			const [p, q] = a.length >= b.length ? [a, b] : [b, a];
			for (let i = 0, j = 0; i < p.length && beda <= 1; i++, j++) {
				if (p[i] !== q[j]) {
					beda++;
					if (p.length !== q.length) i--;
				}
			}
			if (beda <= 1) return true;
		}
	}
	return false;
}

const kandidat = (nama: string): Ptk[] => {
	const c = core(nama);
	if (!c) return [];
	const tepat = ptk.filter((p) => core(p.nama) === c);
	if (tepat.length) return tepat;
	const tc = c.split(' ');
	return ptk.filter((p) => {
		const tp = core(p.nama).split(' ');
		if (!tp.length) return false;
		const tcAdaDiTp = tc.every((t) => tp.some((u) => tokenMirip(t, u)));
		const tpAdaDiTc = tp.every((t) => tc.some((u) => tokenMirip(t, u)));
		return tcAdaDiTp || tpAdaDiTc;
	});
};

const terpakai = new Map<number, string>();
const tanpaPtk: Anggota[] = [];
const sudahDilaporkan = new Set<string>();
const ambigu: { nama: string; kandidat: string[] }[] = [];
const peta = new Map<string, number>(); // nama tampil → ptk.id

for (const a of data.anggota) {
	const kunci = `${a.nama}|${a.gelar}`;
	if (peta.has(kunci)) continue;
	const k = kandidat(a.nama);
	if (k.length === 0) {
		if (!sudahDilaporkan.has(kunci)) {
			sudahDilaporkan.add(kunci);
			tanpaPtk.push(a);
		}
		continue;
	}
	// pilih kandidat terbaik: yang belum terpakai & punya NIP
	const urut = k.slice().sort((x, y) => {
		const xp = terpakai.has(x.id) ? 1 : 0;
		const yp = terpakai.has(y.id) ? 1 : 0;
		if (xp !== yp) return xp - yp;
		return (y.nip ? 1 : 0) - (x.nip ? 1 : 0);
	});
	const pilih = urut[0];
	if (k.length > 1) ambigu.push({ nama: a.nama, kandidat: k.map((p) => `#${p.id} ${p.nama}`) });
	terpakai.set(pilih.id, a.nama);
	peta.set(kunci, pilih.id);
}

const idUntuk = (a: Anggota): number | null => peta.get(`${a.nama}|${a.gelar}`) ?? null;

/* ── laporan sebelum menulis ─────────────────────────────── */
const perUnit = new Map<string, number>();
for (const a of data.anggota) perUnit.set(a.unitKode, (perUnit.get(a.unitKode) ?? 0) + 1);

console.log('=== RENCANA SEED (SK No. 023/2026, acuan ' + data.sumber + ') ===');
console.log(`Unit   : ${data.units.length}`);
console.log(`Anggota: ${data.anggota.length} entri · pegawai unik terpetakan: ${terpakai.size}`);
console.log(`Badge  : ${data.badge} orang · ${data.tempatTgl}`);
for (const u of data.units) {
	console.log(`  kolom ${u.kolom} urut ${u.urutan}  ${u.kode.padEnd(20)} ${String(perUnit.get(u.kode) ?? 0).padStart(3)} org   ${u.nama}`);
}

if (tanpaPtk.length) {
	console.log(`\n--- ${tanpaPtk.length} nama TIDAK ada di tabel ptk (disimpan sebagai entri luar) ---`);
	for (const a of tanpaPtk) {
		console.log(`  - ${a.nama}${a.gelar ? ', ' + a.gelar : ''}  [${a.jabatan || a.unitKode}]`);
	}
}
if (ambigu.length) {
	console.log(`\n--- ${ambigu.length} nama punya lebih dari satu kandidat ptk (dipilih otomatis) ---`);
	for (const a of ambigu) console.log(`  - ${a.nama} → ${a.kandidat.join(' / ')}`);
}

const dipakai = new Set(terpakai.keys());
const ptkTakDipakai = ptk.filter((p) => !dipakai.has(p.id));
if (ptkTakDipakai.length) {
	console.log(`\n--- ${ptkTakDipakai.length} baris ptk tidak terpakai di bagan ---`);
	for (const p of ptkTakDipakai) {
		console.log(`  - #${p.id} ${p.nama}  (jabatan: ${p.jabatan_struktural ?? '-'}, wali: ${p.wali_kelas ?? '-'})`);
	}
}

/* ── tulis ───────────────────────────────────────────────── */
const tulis = db.transaction(() => {
	if (RESET) {
		db.prepare('DELETE FROM struktur_anggota').run();
		db.prepare('DELETE FROM struktur_unit').run();
	}

	const iUnit = db.prepare(`
		INSERT INTO struktur_unit (kode, nama, tipe, kelompok, kolom, urutan, tampil_bagan, aktif)
		VALUES (@kode, @nama, @tipe, @kelompok, @kolom, @urutan, 1, 1)
		ON CONFLICT(kode) DO UPDATE SET
			nama = @nama, tipe = @tipe, kelompok = @kelompok,
			kolom = @kolom, urutan = @urutan, updated_at = datetime('now','localtime')
	`);
	for (const u of data.units) iUnit.run(u);

	const iAnggota = db.prepare(`
		INSERT INTO struktur_anggota
			(unit_kode, ptk_id, nama_manual, gelar, jabatan_tampil, keterangan, urutan, tampil_bagan, aktif)
		VALUES (@unitKode, @ptkId, @namaManual, @gelar, @jabatanTampil, @keterangan, @urutan, 1, 1)
	`);
	for (const a of data.anggota) {
		const ptkId = idUntuk(a);
		iAnggota.run({
			unitKode: a.unitKode,
			ptkId,
			namaManual: ptkId ? null : a.nama,
			gelar: a.gelar || null,
			jabatanTampil: a.jabatan || null,
			keterangan: a.keterangan || null,
			urutan: a.urutan
		});
	}

	const iSet = db.prepare(`
		INSERT INTO pengaturan (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
	`);
	const pengaturan: [string, string][] = [
		['struktur_judul', data.judul],
		['struktur_tahun', data.tahun],
		['struktur_kop', data.kop],
		['struktur_badge', data.badge],
		['struktur_kamad_nama', data.kamadNama],
		['struktur_kamad_nip', data.kamadNip],
		['struktur_tempat_tgl', data.tempatTgl],
		['struktur_tampil_nip', '0'],
		['struktur_publik_aktif', '1'],
		['struktur_catatan_kaki', data.catatanKaki]
	];
	for (const [k, v] of pengaturan) iSet.run(k, v);
});

tulis();

const akhirUnit = (db.prepare('SELECT COUNT(*) AS c FROM struktur_unit').get() as { c: number }).c;
const akhirAnggota = (db.prepare('SELECT COUNT(*) AS c FROM struktur_anggota').get() as { c: number }).c;
const akhirPtk = (
	db.prepare('SELECT COUNT(*) AS c FROM struktur_anggota WHERE ptk_id IS NOT NULL').get() as { c: number }
).c;

console.log('\n=== HASIL ===');
console.log(`struktur_unit    : ${akhirUnit}`);
console.log(`struktur_anggota : ${akhirAnggota} (${akhirPtk} tertaut ptk, ${akhirAnggota - akhirPtk} entri luar)`);
console.log(`pengaturan bagan : 10 kunci diset (judul/kop/tahun/badge/kamad/tempat/tampil_nip=0/publik=1)`);
console.log('Tabel ptk TIDAK diubah.');

db.close();
