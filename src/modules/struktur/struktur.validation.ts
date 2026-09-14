import * as v from 'valibot';

/**
 * Form remote diparsing dari FormData → SEMUA nilai masuk sebagai string
 * ("", "on", "2", ...). Karena itu skema di sini sengaja menerima string/lain-lain
 * lalu dinormalkan, dan validasi bisnis (kode, nama, dsb.) dilakukan di service
 * supaya pesan errornya ramah pengguna.
 */
function angka(def: number) {
	return v.optional(
		v.pipe(
			v.union([v.string(), v.number(), v.null_(), v.undefined_()]),
			v.transform((x) => {
				if (x == null || x === '') return def;
				const n = Number(x);
				return Number.isFinite(n) ? n : def;
			})
		),
		def
	);
}

function angkaOpsional() {
	return v.optional(
		v.pipe(
			v.union([v.string(), v.number(), v.null_(), v.undefined_()]),
			v.transform((x) => {
				if (x == null || x === '') return null;
				const n = Number(x);
				return Number.isFinite(n) && n > 0 ? n : null;
			})
		),
		null
	);
}

function teks(def = '') {
	return v.optional(v.union([v.string(), v.null_(), v.undefined_()]), def);
}

/**
 * Checkbox HTML mengirim "on" saat dicentang, dan TIDAK mengirim apa pun saat tidak dicentang.
 * Karena itu nilai kosong dipetakan ke `def` — bukan lewat `v.optional` (yang akan
 * mem-bypass transform sehingga defaultnya tidak pernah terpakai).
 */
function saklar(def = true) {
	return v.pipe(
		v.union([v.string(), v.null_(), v.undefined_()]),
		v.transform((x) => (x == null ? def : x === 'on' || x === '1' || x === 'true'))
	);
}

export const unitFormSchema = v.object({
	kode: teks(),
	nama: teks(),
	tipe: teks('unit'),
	kelompok: teks(),
	parentKode: teks(),
	kolom: angka(1),
	urutan: angka(0),
	tampilBagan: saklar(true),
	catatan: teks()
});

export type UnitFormInput = v.InferOutput<typeof unitFormSchema>;

export const anggotaFormSchema = v.object({
	id: angkaOpsional(),
	unitKode: teks(),
	ptkId: angkaOpsional(),
	namaManual: teks(),
	nipManual: teks(),
	gelar: teks(),
	jabatanTampil: teks(),
	keterangan: teks(),
	urutan: angka(0),
	tampilBagan: saklar(true),
	kepala: saklar(false)
});

export type AnggotaFormInput = v.InferOutput<typeof anggotaFormSchema>;

export const kodeUnitSchema = v.pipe(v.string(), v.nonEmpty('Kode unit wajib diisi.'));

export const idAnggotaSchema = v.pipe(v.number(), v.minValue(1));

export const urutkanSchema = v.object({
	unitKode: v.pipe(v.string(), v.nonEmpty()),
	urutan: v.array(v.number())
});

export const pengaturanBaganSchema = v.object({
	struktur_judul: teks(),
	struktur_tahun: teks(),
	struktur_sk: teks(),
	struktur_kop: teks(),
	struktur_badge: teks(),
	struktur_kamad_nama: teks(),
	struktur_kamad_nip: teks(),
	struktur_tempat_tgl: teks(),
	struktur_tampil_nip: saklar(false),
	struktur_publik_aktif: saklar(true)
});

export type PengaturanBaganInput = v.InferOutput<typeof pengaturanBaganSchema>;
