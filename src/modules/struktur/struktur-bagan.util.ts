/**
 * Penyusun data bagan struktur organisasi.
 *
 * Fungsi murni (tanpa DB / tanpa SvelteKit) supaya mudah diuji dan dipakai bersama
 * oleh halaman admin, halaman publik, dan halaman cetak — satu sumber tampilan.
 */

export interface UnitRow {
	kode: string;
	nama: string;
	tipe: string;
	kelompok: string | null;
	parentKode: string | null;
	kolom: number;
	urutan: number;
	tampilBagan: number;
	aktif: number;
}

export interface AnggotaRow {
	id: number;
	unitKode: string;
	ptkId: number | null;
	namaManual: string | null;
	gelar: string | null;
	jabatanTampil: string | null;
	keterangan: string | null;
	urutan: number;
	tampilBagan: number;
	aktif: number;
	namaPtk: string | null;
	nipPtk: string | null;
	publicId: string | null;
	/** Path foto dari ptk.foto_path (kosong = tampilkan placeholder). */
	fotoPtk?: string | null;
}

export interface BaganAnggota {
	nama: string;
	gelar: string;
	label: string;
	keterangan: string;
	nip: string;
	/** URL/path foto pegawai; kosong = placeholder inisial. */
	foto?: string;
}

export interface BaganKotak {
	kode: string;
	judul: string;
	tipe: string;
	kelompok: string;
	kolom: number;
	anggota: BaganAnggota[];
}

export interface BaganKolom {
	kolom: number;
	kotak: BaganKotak[];
}

export interface Rekap {
	unitAktif: number;
	unitKosong: number;
	anggotaAktif: number;
	pegawaiUnik: number;
	wali: number;
	jumlahRombel: number;
	selisihWali: number;
}

/** "ABDILLAH" → "Abdillah"; nama yang sudah campuran dibiarkan apa adanya. */
export function titleCase(nama: string): string {
	const bersih = (nama ?? '').trim();
	if (!bersih) return '';
	const semuaKapital = bersih === bersih.toUpperCase() && /\p{L}/u.test(bersih);
	if (!semuaKapital) return bersih;
	return bersih
		.toLowerCase()
		.replace(/(^|[\s.,'()-])(\p{L})/gu, (_m, sep: string, huruf: string) => sep + huruf.toUpperCase());
}

/** Nama tampil di bagan: nama PTK (atau nama manual) + gelar. */
export function namaTampil(a: AnggotaRow): string {
	const dasar = a.namaPtk ? titleCase(a.namaPtk) : (a.namaManual ?? '').trim();
	const gelar = (a.gelar ?? '').trim();
	if (!dasar) return gelar;
	if (!gelar) return dasar;
	return `${dasar}, ${gelar}`;
}

function keBaganAnggota(a: AnggotaRow, publik: boolean): BaganAnggota {
	return {
		nama: namaTampil(a),
		gelar: (a.gelar ?? '').trim(),
		label: (a.jabatanTampil ?? '').trim(),
		keterangan: (a.keterangan ?? '').trim(),
		nip: publik ? '' : (a.nipPtk ?? ''),
		foto: (a.fotoPtk ?? '').trim()
	};
}

/**
 * Susun bagan: dikelompokkan per `kolom` (urutan tampil kiri→kanan), di dalam kolom
 * diurutkan `urutan` lalu nama. Unit/anggota dengan `tampil_bagan = 0` dibuang.
 */
export function susunBagan(
	units: UnitRow[],
	anggota: AnggotaRow[],
	opts: { publik?: boolean } = {}
): BaganKolom[] {
	const publik = opts.publik === true;
	const unitTampil = units
		.filter((u) => u.aktif === 1 && u.tampilBagan === 1)
		.slice()
		.sort((a, b) => a.kolom - b.kolom || a.urutan - b.urutan || a.nama.localeCompare(b.nama));

	const anggotaTampil = anggota.filter((a) => a.aktif === 1 && a.tampilBagan === 1);

	const kolomMap = new Map<number, BaganKotak[]>();
	for (const u of unitTampil) {
		const isi = anggotaTampil
			.filter((a) => a.unitKode === u.kode)
			.slice()
			.sort((a, b) => a.urutan - b.urutan || namaTampil(a).localeCompare(namaTampil(b)))
			.map((a) => keBaganAnggota(a, publik));
		const kotak: BaganKotak = {
			kode: u.kode,
			judul: u.nama,
			tipe: u.tipe,
			kelompok: u.kelompok ?? '',
			kolom: u.kolom,
			anggota: isi
		};
		const daftar = kolomMap.get(u.kolom) ?? [];
		daftar.push(kotak);
		kolomMap.set(u.kolom, daftar);
	}

	return [...kolomMap.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([kolom, kotak]) => ({ kolom, kotak }));
}

/** Kode unit wali kelas (dipakai untuk rekap konsistensi dengan jumlah rombel). */
export const UNIT_WALI_KELAS = 'wali-kelas';

/** Rekap untuk halaman admin: jumlah pegawai unik, wali kelas, unit kosong. */
export function hitungRekap(units: UnitRow[], anggota: AnggotaRow[], jumlahRombel: number): Rekap {
	const anggotaAktif = anggota.filter((a) => a.aktif === 1);
	const unitAktif = units.filter((u) => u.aktif === 1);
	const ptkSet = new Set(anggotaAktif.filter((a) => a.ptkId != null).map((a) => a.ptkId as number));
	const wali = anggotaAktif.filter((a) => a.unitKode === UNIT_WALI_KELAS).length;
	const unitKosong = unitAktif.filter((u) => !anggotaAktif.some((a) => a.unitKode === u.kode)).length;

	return {
		unitAktif: unitAktif.length,
		unitKosong,
		anggotaAktif: anggotaAktif.length,
		pegawaiUnik: ptkSet.size,
		wali,
		jumlahRombel,
		selisihWali: wali - jumlahRombel
	};
}
