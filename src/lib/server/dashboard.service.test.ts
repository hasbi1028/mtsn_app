import { describe, it, expect, vi } from 'vitest';

// Mock $app/environment and DB before importing service
vi.mock('$app/environment', () => ({ dev: true }));

const mockDbResult = { count: 0 };
const mockDbChain = {
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	groupBy: vi.fn().mockReturnThis(),
	get: vi.fn().mockReturnValue(mockDbResult),
	all: vi.fn().mockReturnValue([])
};

vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(() => mockDbChain),
		all: vi.fn(() => []),
		run: vi.fn()
	}
}));

vi.mock('$lib/server/db/schema', () => ({
	ptk: {},
	siswa: {},
	rombel: {},
	skmtAjuan: {},
	skbkAjuan: {},
	skakpt: {},
	jtmSemester: {}
}));

import { getGeneralStats, getRombelStats, getBansosStats } from '$modules/dashboard/dashboard.service';

describe('dashboard.service', () => {
	describe('getGeneralStats', () => {
		it('returns object with all stat fields', () => {
			const stats = getGeneralStats();
			expect(stats).toHaveProperty('totalPtk');
			expect(stats).toHaveProperty('guru');
			expect(stats).toHaveProperty('sertifikasi');
			expect(stats).toHaveProperty('belumSertifikasi');
			expect(stats).toHaveProperty('totalSiswa');
			expect(stats).toHaveProperty('pendingSkmt');
			expect(stats).toHaveProperty('pendingSkbk');
			expect(stats).toHaveProperty('pendingSkakpt');
		});

		it('returns numbers', () => {
			const stats = getGeneralStats();
			expect(typeof stats.totalPtk).toBe('number');
			expect(typeof stats.totalSiswa).toBe('number');
		});
	});

	describe('getRombelStats', () => {
		it('returns object with rombel fields', () => {
			const stats = getRombelStats();
			expect(stats).toHaveProperty('totalRombel');
			expect(stats).toHaveProperty('totalSiswa');
			expect(stats).toHaveProperty('teralokasi');
			expect(stats).toHaveProperty('tanpaRombel');
			expect(stats).toHaveProperty('perKelas');
		});
	});

	describe('getBansosStats', () => {
		it('returns object with bansos fields', () => {
			const stats = getBansosStats();
			expect(stats).toHaveProperty('totalSiswa');
			expect(stats).toHaveProperty('belumCek');
			expect(stats).toHaveProperty('sudahCek');
			expect(stats).toHaveProperty('layakPkh');
			expect(stats).toHaveProperty('layakSembako');
			expect(stats).toHaveProperty('layakPbijk');
			expect(stats).toHaveProperty('desilDist');
			expect(stats).toHaveProperty('kelasDist');
		});
	});
});
