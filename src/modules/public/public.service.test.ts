import { describe, it, expect, vi } from 'vitest';

// Mock $app/environment before importing service
vi.mock('$app/environment', () => ({ dev: true }));

// Mock DB to return test data
const mockDbChain = {
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	select: vi.fn().mockReturnThis(),
	get: vi.fn(),
	all: vi.fn()
};

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn().mockReturnValue(mockDbChain),
		all: vi.fn().mockReturnValue([
			{ nama: 'Guru A', fungsi: 'Guru', sertifikasi: true, waliKelas: 'VII-A', jabatanStruktural: null },
			{ nama: 'Guru B', fungsi: 'Guru', sertifikasi: false, waliKelas: null, jabatanStruktural: 'Wakamad' },
		])
	}
}));

// Mock schema
vi.mock('$lib/server/db/schema', () => ({
	ptk: { fungsi: 'fungsi', sertifikasi: 'sertifikasi' },
	siswa: {},
	rombel: { aktif: 'aktif' },
	count: vi.fn(() => 0),
	eq: vi.fn(() => ({})),
	sql: vi.fn(() => ({}))
}));

const { getPublicStats, getPublicGuruList } = await import('./public.service');

describe('getPublicStats', () => {
	it('returns stats with correct shape', () => {
		// Mock the chain to return values
		mockDbChain.get.mockReturnValue({ count: 10 });
		mockDbChain.all.mockReturnValue([{ kelas: 7 }, { kelas: 8 }, { kelas: 9 }]);

		const stats = getPublicStats();
		expect(stats).toHaveProperty('totalSiswa');
		expect(stats).toHaveProperty('totalGuru');
		expect(stats).toHaveProperty('totalRombel');
		expect(stats).toHaveProperty('totalKelas');
		expect(typeof stats.totalSiswa).toBe('number');
		expect(typeof stats.totalGuru).toBe('number');
		expect(typeof stats.totalRombel).toBe('number');
		expect(typeof stats.totalKelas).toBe('number');
	});

	it('returns non-negative numbers', () => {
		mockDbChain.get.mockReturnValue({ count: 5 });
		mockDbChain.all.mockReturnValue([{ kelas: 7 }]);

		const stats = getPublicStats();
		expect(stats.totalSiswa).toBeGreaterThanOrEqual(0);
		expect(stats.totalGuru).toBeGreaterThanOrEqual(0);
		expect(stats.totalRombel).toBeGreaterThanOrEqual(0);
		expect(stats.totalKelas).toBeGreaterThanOrEqual(0);
	});
});

describe('getPublicGuruList', () => {
	it('returns array', () => {
		const list = getPublicGuruList();
		expect(Array.isArray(list)).toBe(true);
	});

	it('returns guru with required fields', () => {
		const list = getPublicGuruList();
		for (const guru of list as any[]) {
			expect(guru).toHaveProperty('nama');
			expect(guru).toHaveProperty('fungsi');
			expect(guru).toHaveProperty('sertifikasi');
		}
	});

	it('only returns Guru (not Staf)', () => {
		const list = getPublicGuruList();
		for (const guru of list as any[]) {
			expect(guru.fungsi).toBe('Guru');
		}
	});

	it('returns sorted by nama', () => {
		const list = getPublicGuruList();
		const names = list.map((g: any) => g.nama);
		const sorted = [...names].sort();
		expect(names).toEqual(sorted);
	});
});
