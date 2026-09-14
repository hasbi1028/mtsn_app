/**
 * struktur-dari-html.mjs
 * Membaca acuan bagan (struktur-foto-v2-premium.html) lalu menulis data siap-seed
 * ke `scripts/struktur-sk023.json` (satu sumber data untuk seed DB).
 *
 * Usage: node scripts/struktur-dari-html.mjs "<path html>" [out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC =
	process.argv[2] ?? 'C:/Users/LENOVO/Downloads/struktur-foto-v4-nip.html';
const OUT = process.argv[3] ?? 'scripts/struktur-sk023.json';

const html = readFileSync(SRC, 'utf8');

const bersih = (s) =>
	(s ?? '')
		.replace(/<svg[\s\S]*?<\/svg>/g, ' ')
		.replace(/<br\s*\/?>/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&bull;/g, '•')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

/** Ambil blok sebuah kolom berdasarkan class-nya. */
function blokKolom(cls) {
	const i = html.indexOf(`<div class="col ${cls}">`);
	if (i < 0) return '';
	const setelah = html.slice(i);
	// mulai cari dari >0 supaya tidak menangkap pembuka kolom itu sendiri
	const akhir = setelah.indexOf('<div class="col ', 30);
	return akhir > 0 ? setelah.slice(0, akhir) : setelah;
}

/** Ambil NIP 18 digit dari potongan HTML kartu (kosong bila placeholder "·····"). */
function nipDari(chunk) {
	const m = chunk.match(/class="nip">\s*NIP\.?\s*([0-9]{18})/);
	return m ? m[1] : '';
}

/** Teks head (jab + nama + nip) dari sebuah blok kolom. */
function head(blok) {
	const m = blok.match(/<div class="head">([\s\S]*?)<\/div><\/div>/);
	const isi = m ? m[1] : blok.slice(0, 400);
	return {
		jabatan: bersih((isi.match(/<div class="jab">([^<]*)/) ?? [])[1] ?? ''),
		nama: bersih((isi.match(/<div class="nama">([^<]*)/) ?? [])[1] ?? ''),
		nip: nipDari(isi)
	};
}

/**
 * Daftar item (tu-item / gcard / wcard) dalam satu blok kolom.
 * Catatan: regex batas item memotong TEPAT sebelum tag penutup, jadi tiap field
 * diambil lewat pembuka tag-nya (`[^<]*`) — bukan lewat pasangan tag penutup.
 */
function item(blok, cls) {
	const pola = new RegExp(`<div class="${cls}[^"]*">([\\s\\S]*?)(?=<div class="${cls}|<h4|\\s*<\\/div>\\s*<\\/div>)`, 'g');
	const hasil = [];
	let m;
	while ((m = pola.exec(blok))) {
		const c = m[1];
		const jab = bersih((c.match(/<div class="jab">([^<]*)/) ?? [])[1] ?? '');
		const nama = bersih((c.match(/<div class="(?:nama|n)">([^<]*)/) ?? [])[1] ?? '');
		const ket = bersih((c.match(/<div class="(?:m|ket)">([^<]*)/) ?? [])[1] ?? '');
		const kelas = bersih((c.match(/<div class="k">([^<]*)/) ?? [])[1] ?? '');
		if (nama) hasil.push({ jabatan: jab, nama, keterangan: ket || kelas, nip: nipDari(c) });
	}
	return hasil;
}

/** Pisahkan "Nama, Gelar" → { nama, gelar }. */
function pisahGelar(s) {
	const t = bersih(s);
	const i = t.indexOf(', ');
	if (i < 0) return { nama: t, gelar: '' };
	return { nama: t.slice(0, i).trim(), gelar: t.slice(i + 2).trim() };
}

const row1 = html.slice(html.indexOf('<div class="row1">'), html.indexOf('<div class="cols">'));
const kotakRow1 = [...row1.matchAll(/<div class="jab">([\s\S]*?)<\/div><div class="nama">([\s\S]*?)<\/div>(?:<div class="nip">([\s\S]*?)<\/div>)?/g)].map(
	(m) => ({ jabatan: bersih(m[1]), nama: bersih(m[2]), nip: (bersih(m[3] ?? '').match(/([0-9]{18})/) ?? [])[1] ?? '' })
);

const colTu = blokKolom('col-tu');
const colKur = blokKolom('col-kur');
const colKes = blokKolom('col-kes');
const colSar = blokKolom('col-sar');
const colHum = blokKolom('col-hum');

const ekskulRaw = bersih((html.match(/<div class="ekskul">([\s\S]*?)<\/div>/) ?? [])[1] ?? '');
const pembina = [...ekskulRaw.matchAll(/([A-Za-zÀ-ÿ.\-\s]+?):\s*([A-Za-zÀ-ÿ.\s]+?)(?=\s*•|$)/g)]
	.map((m) => ({ keterangan: m[1].replace(/^.*?([A-Za-zÀ-ÿ-]+)$/, '$1').trim(), nama: m[2].trim() }))
	.filter((p) => p.nama);

const footerTeks = bersih((html.match(/<div class="catatan">([\s\S]*?)<\/div>/) ?? [])[1] ?? '');
const ttdBlok = html.slice(html.indexOf('<div class="ttd">'), html.indexOf('<div class="ttd">') + 600);
const ttdTeks = bersih(ttdBlok);
const namaKamad = bersih((ttdBlok.match(/<div class="gab">([^<]*)/) ?? [])[1] ?? '');
const nipKamad =
	(footerTeks.match(/NIP\.\s*(\d+)/) ?? [])[1] ?? (html.match(/NIP\.\s*(\d{18})/) ?? [])[1] ?? '';
const mTempat = ttdTeks.match(/Ditetapkan di\s*:\s*([A-Za-zÀ-ÿ.\s]+?)\s+Tanggal\s*:\s*([0-9]{1,2}\s+[A-Za-zÀ-ÿ]+\s+[0-9]{4})/);
const tempatTgl = mTempat ? `${mTempat[1].trim()}, ${mTempat[2].trim()}` : '';
const badge = (html.match(/(\d+)\s*ORANG/) ?? [])[1] ?? '';

const units = [
	{ kode: 'komite', nama: 'Ketua Komite', kelompok: 'MITRA', tipe: 'daftar', kolom: 0, urutan: 1 },
	{ kode: 'kamad', nama: 'Kepala Madrasah', kelompok: 'PIMPINAN', tipe: 'daftar', kolom: 0, urutan: 2 },
	{ kode: 'kaur-tu', nama: 'Kepala Tata Usaha', kelompok: 'PIMPINAN', tipe: 'daftar', kolom: 1, urutan: 1 },
	{ kode: 'tu-staf', nama: 'Tata Usaha', kelompok: 'TATA USAHA', tipe: 'daftar', kolom: 1, urutan: 2 },
	{ kode: 'pendukung', nama: 'Tenaga Pendukung', kelompok: 'PENDUKUNG', tipe: 'daftar', kolom: 1, urutan: 3 },
	{
		kode: 'wakamad-kurikulum',
		nama: 'Wakamad Kurikulum',
		kelompok: 'PIMPINAN',
		tipe: 'daftar',
		kolom: 2,
		urutan: 1
	},
	{
		kode: 'guru-mapel',
		nama: 'Dewan Guru Mata Pelajaran',
		kelompok: 'GURU',
		tipe: 'grid',
		kolom: 2,
		urutan: 2
	},
	{
		kode: 'wakamad-kesiswaan',
		nama: 'Wakamad Kesiswaan',
		kelompok: 'PIMPINAN',
		tipe: 'daftar',
		kolom: 3,
		urutan: 1
	},
	{ kode: 'wali-kelas', nama: 'Wali Kelas', kelompok: 'GURU', tipe: 'grid', kolom: 3, urutan: 2 },
	{ kode: 'guru-bk', nama: 'Guru BK', kelompok: 'GURU', tipe: 'daftar', kolom: 3, urutan: 3 },
	{ kode: 'pembina-osim', nama: 'Pembina OSIM', kelompok: 'GURU', tipe: 'daftar', kolom: 3, urutan: 4 },
	{
		kode: 'pembina-ekskul',
		nama: 'Pembina Ekstrakurikuler & Kokurikuler',
		kelompok: 'GURU',
		tipe: 'catatan',
		kolom: 3,
		urutan: 5
	},
	{
		kode: 'wakamad-sarpras',
		nama: 'Wakamad Sarana & Prasarana',
		kelompok: 'PIMPINAN',
		tipe: 'daftar',
		kolom: 4,
		urutan: 1
	},
	{
		kode: 'pengelola-sarpras',
		nama: 'Sarana & Prasarana',
		kelompok: 'TATA USAHA',
		tipe: 'daftar',
		kolom: 4,
		urutan: 2
	},
	{
		kode: 'wakamad-humas',
		nama: 'Wakamad Humas',
		kelompok: 'PIMPINAN',
		tipe: 'catatan',
		kolom: 5,
		urutan: 1,
		catatan: 'Kerjasama, publikasi & hubungan dengan komite dan orang tua/wali'
	}
];

const anggota = [];
const tambah = (unitKode, namaTampil, jabatan = '', keterangan = '', kepala = false, nip = '') => {
	const { nama, gelar } = pisahGelar(namaTampil);
	anggota.push({
		unitKode,
		nama,
		gelar,
		jabatan,
		keterangan,
		urutan: anggota.filter((a) => a.unitKode === unitKode).length + 1,
		...(kepala ? { kepala: true } : {}),
		...(nip ? { nip } : {})
	});
};

// kolom 1 — komite & kamad (row1)
for (const k of kotakRow1) {
	const unitKode = /KOMITE/i.test(k.jabatan) ? 'komite' : 'kamad';
	tambah(unitKode, k.nama, /KOMITE/i.test(k.jabatan) ? 'Ketua Komite' : 'Kepala Madrasah', '', false, k.nip);
}

// kolom 2 — kepala TU + staf + pendukung
const hTu = head(colTu);
tambah('kaur-tu', hTu.nama, 'Kepala Tata Usaha', '', true, hTu.nip);
for (const it of item(colTu, 'tu-item')) {
	const pendukung = /KEAMANAN|KEBERSIHAN/i.test(it.jabatan);
	tambah(pendukung ? 'pendukung' : 'tu-staf', it.nama, it.jabatan.replace(/\s*\*\s*$/, ''), '', false, it.nip);
}

// kolom 3 — wakamad kurikulum + dewan guru
const hKur = head(colKur);
tambah('wakamad-kurikulum', hKur.nama, 'Wakamad Kurikulum', '', true, hKur.nip);
for (const it of item(colKur, 'gcard')) tambah('guru-mapel', it.nama, '', it.keterangan, false, it.nip);

// kolom 4 — wakamad kesiswaan + wali kelas + guru BK & pembina OSIM + pembina ekskul
const hKes = head(colKes);
tambah('wakamad-kesiswaan', hKes.nama, 'Wakamad Kesiswaan', '', true, hKes.nip);
for (const it of item(colKes, 'wcard')) {
	tambah(
		'wali-kelas',
		it.nama,
		/WALI KELAS/i.test(it.jabatan) ? 'Wali Kelas' : it.jabatan,
		it.keterangan,
		false,
		it.nip
	);
}
for (const it of item(colKes, 'tu-item')) {
	if (/BK/i.test(it.jabatan)) tambah('guru-bk', it.nama, it.jabatan, '', false, it.nip);
	else if (/OSIM/i.test(it.jabatan)) tambah('pembina-osim', it.nama, it.jabatan, '', false, it.nip);
	else if (/LAB|PERPUSTAKAAN/i.test(it.jabatan)) tambah('pengelola-sarpras', it.nama, it.jabatan, '', false, it.nip);
	else console.warn('! item kolom 4 tidak dikenal:', it.jabatan, it.nama);
}
for (const p of pembina) tambah('pembina-ekskul', p.nama, 'Pembina Ekskul', p.keterangan);

// kolom 5 — wakamad sarpras + pengelola + wakamad humas
const hSar = head(colSar);
tambah('wakamad-sarpras', hSar.nama, 'Wakamad Sarana & Prasarana', '', true, hSar.nip);
for (const it of item(colSar, 'tu-item')) tambah('pengelola-sarpras', it.nama, it.jabatan, '', false, it.nip);
const hHum = head(colHum);
tambah('wakamad-humas', hHum.nama, 'Wakamad Humas', '', true, hHum.nip);

const data = {
	sumber: SRC.replace(/\\/g, '/').split('/').pop(),
	badge,
	kop: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
	judul: 'STRUKTUR ORGANISASI',
	madrasah: bersih((html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [])[1] ?? ''),
	tahun: '2026/2027',
	sk: 'SK No. 023 Tahun 2026',
	tempatTgl: tempatTgl.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(),
	kamadNama: namaKamad,
	kamadNip: nipKamad,
	catatanKaki:
		'* Guru Mata Pelajaran Utama • * Tenaga Pendukung (di luar jumlah pegawai) · Ketua Komite: mitra madrasah · SK No. 023/2026',
	units,
	anggota
};

writeFileSync(OUT, JSON.stringify(data, null, 1), 'utf8');

const per = {};
for (const a of anggota) per[a.unitKode] = (per[a.unitKode] ?? 0) + 1;
console.log(`Sumber : ${data.sumber}`);
console.log(`Badge  : ${data.badge} ORANG · Kamad: ${data.kamadNama} (NIP ${data.kamadNip})`);
console.log(`Tempat : ${data.tempatTgl}`);
console.log(`Unit   : ${units.length} · Anggota: ${anggota.length}`);
for (const u of units) console.log(`  kolom ${u.kolom} urut ${u.urutan}  ${u.kode.padEnd(20)} ${per[u.kode] ?? 0} org`);
console.log(`Ditulis: ${OUT}`);

export { data };
