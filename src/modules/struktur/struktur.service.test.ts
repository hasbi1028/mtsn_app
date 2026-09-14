import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
	mockDb: {
		all: vi.fn(() => [] as unknown[]),
		get: vi.fn(() => undefined as unknown),
		run: vi.fn(() => ({ changes: 1 }))
	}
}));

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$lib/server/db', () => ({ db: mockDb }));

import {
	DEFAULT_BAGAN,
	ensureStrukturTables,
	getStrukturTree,
	getPengaturanBagan,
	hapusAnggota,
	hapusUnit,
	jumlahRombel,
	simpanAnggota,
	simpanPengaturanBagan,
	simpanUnit
} from './struktur.service';

beforeEach(() => {
	mockDb.all.mockReset();
	mockDb.all.mockReturnValue([]);
	mockDb.get.mockReset();
	mockDb.get.mockReturnValue(undefined);
	mockDb.run.mockReset();
	mockDb.run.mockReturnValue({ changes: 1 });
});

describe('struktur.service — tabel & pembacaan', () => {
	it('ensureStrukturTables tidak melempar & idempoten', () => {
		expect(() => ensureStrukturTables()).not.toThrow();
		expect(() => ensureStrukturTables()).not.toThrow();
		expect(mockDb.run).toHaveBeenCalled();
	});

	it('getStrukturTree mengembalikan units + anggota (kosong tanpa error)', () => {
		mockDb.all.mockReturnValueOnce([]).mockReturnValueOnce([]);
		const tree = getStrukturTree();
		expect(tree).toEqual({ units: [], anggota: [] });
		expect(mockDb.all).toHaveBeenCalledTimes(2);
	});

	it('getStrukturTree meneruskan baris dari DB apa adanya', () => {
		mockDb.all
			.mockReturnValueOnce([{ kode: 'kamad', nama: 'Kepala Madrasah' }])
			.mockReturnValueOnce([{ id: 1, unitKode: 'kamad', namaPtk: 'ANWAR' }]);
		const tree = getStrukturTree();
		expect(tree.units).toHaveLength(1);
		expect(tree.anggota).toHaveLength(1);
	});

	it('jumlahRombel membaca count dari tabel rombel', () => {
		mockDb.all.mockReturnValueOnce([{ c: 12 }]);
		expect(jumlahRombel()).toBe(12);
	});

	it('jumlahRombel aman saat query gagal', () => {
		mockDb.all.mockImplementationOnce(() => {
			throw new Error('boom');
		});
		expect(jumlahRombel()).toBe(0);
	});
});

describe('struktur.service — unit', () => {
	it('menolak kode unit kosong / tidak valid', () => {
		expect(() => simpanUnit({ kode: 'Ada Spasi', nama: 'X' })).toThrow(/kode/i);
		expect(() => simpanUnit({ kode: '', nama: 'X' })).toThrow(/kode/i);
	});

	it('menyimpan unit baru (insert) lalu mengembalikan ok', () => {
		mockDb.get.mockReturnValueOnce(undefined);
		const res = simpanUnit({ kode: 'uji', nama: 'Unit Uji', kolom: 2, urutan: 3 });
		expect(res.ok).toBe(true);
		expect(mockDb.run).toHaveBeenCalled();
	});

	it('memperbarui unit yang sudah ada (update)', () => {
		mockDb.get.mockReturnValueOnce({ kode: 'uji' });
		const res = simpanUnit({ kode: 'uji', nama: 'Unit Uji Baru' });
		expect(res.ok).toBe(true);
		expect(mockDb.run).toHaveBeenCalled();
	});

	it('menolak hapus unit yang masih punya anggota aktif', () => {
		mockDb.all.mockReturnValueOnce([{ c: 3 }]);
		expect(() => hapusUnit('wali-kelas')).toThrow(/anggota/i);
	});

	it('menghapus unit kosong', () => {
		mockDb.all.mockReturnValueOnce([{ c: 0 }]);
		const res = hapusUnit('unit-kosong');
		expect(res.ok).toBe(true);
		expect(mockDb.run).toHaveBeenCalled();
	});
});

describe('struktur.service — anggota', () => {
	it('menolak anggota tanpa PTK maupun nama manual', () => {
		expect(() => simpanAnggota({ unitKode: 'wali-kelas' })).toThrow(/nama/i);
	});

	it('menyimpan anggota entri luar (komite) tanpa ptk_id', () => {
		const res = simpanAnggota({ unitKode: 'komite', namaManual: 'Sabaruddin, S.IP', keterangan: 'Ketua Komite' });
		expect(res.ok).toBe(true);
		expect(mockDb.run).toHaveBeenCalled();
	});

	it('menyimpan anggota dari PTK dengan gelar', () => {
		const res = simpanAnggota({ unitKode: 'wali-kelas', ptkId: 79, gelar: 'S.Pd', keterangan: 'VII-A' });
		expect(res.ok).toBe(true);
	});

	it('menghapus anggota berdasarkan id', () => {
		const res = hapusAnggota(7);
		expect(res.ok).toBe(true);
		expect(mockDb.run).toHaveBeenCalled();
	});
});

describe('struktur.service — pengaturan bagan', () => {
	it('memberi default aman saat pengaturan kosong', () => {
		mockDb.all.mockReturnValue([]);
		const p = getPengaturanBagan();
		expect(p.judul).toBe(DEFAULT_BAGAN.judul);
		expect(p.tahun).toBe(DEFAULT_BAGAN.tahun);
		expect(p.tampilNip).toBe(false);
		expect(typeof p.publikAktif).toBe('boolean');
	});

	it('membaca nilai yang tersimpan', () => {
		mockDb.all.mockReturnValue([
			{ key: 'struktur_judul', value: 'BAGAN UJI' },
			{ key: 'struktur_tampil_nip', value: '1' },
			{ key: 'struktur_publik_aktif', value: '0' }
		]);
		const p = getPengaturanBagan();
		expect(p.judul).toBe('BAGAN UJI');
		expect(p.tampilNip).toBe(true);
		expect(p.publikAktif).toBe(false);
	});

	it('menyimpan pengaturan bagan', () => {
		const res = simpanPengaturanBagan({ struktur_judul: 'BAGAN BARU' });
		expect(res.ok).toBe(true);
		expect(mockDb.run).toHaveBeenCalled();
	});
});
