import { describe, it, expect } from 'vitest';
import {
	hitungRekap,
	namaTampil,
	susunBagan,
	type AnggotaRow,
	type UnitRow
} from './struktur-bagan.util';

const unit = (over: Partial<UnitRow>): UnitRow => ({
	kode: 'x',
	nama: 'X',
	tipe: 'unit',
	kelompok: 'TU',
	parentKode: null,
	kolom: 1,
	urutan: 1,
	tampilBagan: 1,
	aktif: 1,
	...over
});

const anggota = (over: Partial<AnggotaRow>): AnggotaRow => ({
	id: 1,
	unitKode: 'x',
	ptkId: null,
	namaManual: null,
	gelar: null,
	jabatanTampil: null,
	keterangan: null,
	urutan: 1,
	tampilBagan: 1,
	aktif: 1,
	namaPtk: null,
	nipPtk: null,
	nipManual: null,
	publicId: null,
	...over
});

describe('namaTampil', () => {
	it('menggabungkan nama PTK dengan gelar', () => {
		const a = anggota({ namaPtk: 'ABDILLAH', gelar: 'S.Pd' });
		expect(namaTampil(a)).toBe('Abdillah, S.Pd');
	});

	it('pakai nama PTK apa adanya bila gelar kosong', () => {
		expect(namaTampil(anggota({ namaPtk: 'MUTMAINNAH' }))).toBe('Mutmainnah');
	});

	it('pakai nama_manual untuk entri luar (komite/pendukung)', () => {
		expect(namaTampil(anggota({ namaManual: 'Sabaruddin, S.IP' }))).toBe('Sabaruddin, S.IP');
	});

	it('memprioritaskan PTK bila keduanya ada', () => {
		expect(namaTampil(anggota({ namaPtk: 'ANWAR', gelar: 'S.Ag., M.Pd', namaManual: 'lain' }))).toBe(
			'Anwar, S.Ag., M.Pd'
		);
	});
});

describe('susunBagan', () => {
	const units = [
		unit({ kode: 'kamad', nama: 'Kepala Madrasah', kolom: 1, urutan: 1 }),
		unit({ kode: 'tu', nama: 'Tata Usaha', kolom: 2, urutan: 1 }),
		unit({ kode: 'guru', nama: 'Dewan Guru', kolom: 3, urutan: 2 }),
		unit({ kode: 'wali', nama: 'Wali Kelas', kolom: 3, urutan: 1 }),
		unit({ kode: 'sembunyi', nama: 'Tidak Tampil', kolom: 3, urutan: 3, tampilBagan: 0 })
	];
	const anggotaRows = [
		anggota({ id: 1, unitKode: 'kamad', namaPtk: 'ANWAR', gelar: 'S.Ag., M.Pd', nipPtk: '196912311997031028' }),
		anggota({ id: 2, unitKode: 'tu', namaPtk: 'HASBI AWAL', gelar: 'S.Kom', nipPtk: '199210282025211017' }),
		anggota({ id: 3, unitKode: 'wali', namaPtk: 'ABDILLAH', gelar: 'S.Pd', keterangan: 'VII-A' }),
		anggota({ id: 4, unitKode: 'wali', namaPtk: 'HERNIATI', gelar: 'S.Pd', keterangan: 'VII-B' }),
		anggota({ id: 5, unitKode: 'guru', namaPtk: 'KARDI', gelar: 'S.Pd', keterangan: 'IPA Terpadu' }),
		anggota({ id: 6, unitKode: 'kamad', namaPtk: 'SEMBUNYI', tampilBagan: 0 })
	];

	it('mengelompokkan kotak per kolom lalu urutan', () => {
		const bagan = susunBagan(units, anggotaRows);
		expect(bagan.map((k) => k.kolom)).toEqual([1, 2, 3]);
		expect(bagan[2].kotak.map((k) => k.kode)).toEqual(['wali', 'guru']);
	});

	it('menyembunyikan unit dengan tampil_bagan = 0', () => {
		const bagan = susunBagan(units, anggotaRows);
		const semuaKode = bagan.flatMap((k) => k.kotak.map((x) => x.kode));
		expect(semuaKode).not.toContain('sembunyi');
	});

	it('menyembunyikan anggota dengan tampil_bagan = 0', () => {
		const bagan = susunBagan(units, anggotaRows);
		const kamad = bagan[0].kotak.find((k) => k.kode === 'kamad');
		expect(kamad?.anggota.map((a) => a.nama)).toEqual(['Anwar, S.Ag., M.Pd']);
	});

	it('membuang field NIP saat mode publik', () => {
		const bagan = susunBagan(units, anggotaRows, { publik: true });
		const adaNip = bagan
			.flatMap((k) => k.kotak)
			.flatMap((k) => k.anggota)
			.some((a) => a.nip !== '');
		expect(adaNip).toBe(false);
	});

	it('mempertahankan NIP pada mode admin', () => {
		const bagan = susunBagan(units, anggotaRows);
		const kamad = bagan[0].kotak.find((k) => k.kode === 'kamad');
		expect(kamad?.anggota[0].nip).toBe('196912311997031028');
	});

	it('mengosongkan kotak tanpa anggota (tidak error)', () => {
		const bagan = susunBagan([unit({ kode: 'kosong', nama: 'Kosong' })], []);
		expect(bagan[0].kotak[0].anggota).toEqual([]);
	});
});

describe('susunBagan — NIP, kepala unit, dan catatan kotak', () => {
	const units = [
		unit({ kode: 'kamad', nama: 'Kepala Madrasah', kolom: 0, urutan: 1 }),
		unit({ kode: 'kaur-tu', nama: 'Kepala Tata Usaha', kolom: 1, urutan: 1 }),
		unit({ kode: 'humas', nama: 'Wakamad Humas', kolom: 5, urutan: 1, catatan: 'Kerjasama & publikasi' })
	];
	const rows = [
		anggota({ id: 1, unitKode: 'kamad', namaPtk: 'ANWAR', nipManual: '196912311997031028', kepala: 1 }),
		anggota({ id: 2, unitKode: 'kaur-tu', namaManual: 'Wahyuniar', nipManual: '197907152022212001', kepala: 1 }),
		anggota({ id: 3, unitKode: 'humas', namaPtk: 'CHAIRUDDIN' })
	];

	it('memakai nip_manual bila ptk belum punya NIP', () => {
		const hasil = susunBagan(units, rows, { publik: false });
		const kamad = hasil[0].kotak.find((k) => k.kode === 'kamad');
		expect(kamad?.anggota[0].nip).toBe('196912311997031028');
	});

	it('menandai kepala unit dan meneruskan catatan kotak', () => {
		const hasil = susunBagan(units, rows, { publik: false });
		const kaur = hasil.find((k) => k.kolom === 1)?.kotak[0];
		expect(kaur?.anggota[0].kepala).toBe(true);
		const humas = hasil.find((k) => k.kolom === 5)?.kotak[0];
		expect(humas?.catatan).toBe('Kerjasama & publikasi');
	});

	it('menyembunyikan NIP pada mode publik', () => {
		const hasil = susunBagan(units, rows, { publik: true });
		const kamad = hasil[0].kotak.find((k) => k.kode === 'kamad');
		expect(kamad?.anggota[0].nip).toBe('');
	});
});

describe('hitungRekap', () => {
	const units = [unit({ kode: 'wali-kelas' }), unit({ kode: 'kosong' })];
	const anggotaRows = [
		anggota({ id: 1, unitKode: 'wali-kelas', ptkId: 79 }),
		anggota({ id: 2, unitKode: 'wali-kelas', ptkId: 80 }),
		anggota({ id: 3, unitKode: 'kamad', ptkId: 79, keterangan: 'rangkap' }),
		anggota({ id: 4, unitKode: 'wali-kelas', ptkId: null, namaManual: 'Sabaruddin, S.IP' }),
		anggota({ id: 5, unitKode: 'wali-kelas', ptkId: 81, tampilBagan: 0 })
	];

	it('menghitung pegawai unik, anggota, wali, dan unit kosong', () => {
		const r = hitungRekap(units, anggotaRows, 12);
		expect(r.anggotaAktif).toBe(5);
		expect(r.pegawaiUnik).toBe(3);
		expect(r.wali).toBe(4);
		expect(r.unitKosong).toBe(1);
		expect(r.jumlahRombel).toBe(12);
		expect(r.selisihWali).toBe(-8);
	});

	it('menandai selisih nol bila wali kelas sesuai rombel', () => {
		const r = hitungRekap(units, anggotaRows, 4);
		expect(r.selisihWali).toBe(0);
	});
});
