import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSelect, mockFrom, mockWhere, mockGet, mockAll, mockInsert, mockValues, mockRun, mockUpdate, mockSet, mockLimit, mockOffset, mockGroupBy, mockCount } = vi.hoisted(() => {
	const mockSelect = vi.fn();
	const mockFrom = vi.fn();
	const mockWhere = vi.fn();
	const mockGet = vi.fn();
	const mockAll = vi.fn();
	const mockInsert = vi.fn();
	const mockValues = vi.fn();
	const mockRun = vi.fn();
	const mockUpdate = vi.fn();
	const mockSet = vi.fn();
	const mockLimit = vi.fn();
	const mockOffset = vi.fn();
	const mockGroupBy = vi.fn();
	const mockCount = vi.fn();

	return { mockSelect, mockFrom, mockWhere, mockGet, mockAll, mockInsert, mockValues, mockRun, mockUpdate, mockSet, mockLimit, mockOffset, mockGroupBy, mockCount };
});

function setupMocks() {
	mockSelect.mockReturnValue({
		from: mockFrom,
		where: mockWhere,
		count: mockCount
	});
	mockFrom.mockReturnValue({
		where: mockWhere,
		all: mockAll,
		get: mockGet,
		groupBy: mockGroupBy
	});
	mockWhere.mockReturnValue({
		get: mockGet,
		all: mockAll,
		limit: mockLimit,
		offset: mockOffset
	});
	mockLimit.mockReturnValue({
		offset: mockOffset
	});
	mockOffset.mockReturnValue({
		all: mockAll
	});
	mockGroupBy.mockReturnValue({
		all: mockAll
	});
	mockInsert.mockReturnValue({
		values: mockValues
	});
	mockValues.mockReturnValue({
		run: mockRun
	});
	mockUpdate.mockReturnValue({
		set: mockSet
	});
	mockSet.mockReturnValue({
		where: mockWhere
	});
}

setupMocks();

vi.mock('$lib/server/db', () => ({
	db: {
		select: mockSelect,
		insert: mockInsert,
		update: mockUpdate
	}
}));

vi.mock('$lib/server/db/schema', () => ({
	siswa: {},
	perubahanSiswa: {},
	ortu: {},
	siswaOrtu: {},
	users: {}
}));

import { getSiswaList, getSiswaDetail, getMyProfile, getSiswaByRefId, submitPerubahan, getKartuList, getRekap } from './siswa.service';

describe('siswa.service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMocks();
	});

	describe('getSiswaList', () => {
		it('returns empty result when no filters provided', async () => {
			mockGet.mockReturnValue({ count: 0 });
			mockAll.mockReturnValue([]);

			const result = getSiswaList({
				q: '',
				kelas: '',
				nisn: '',
				ortu: '',
				rombel: '',
				status: '',
				page: 1,
				perPage: 20
			});

			expect(result).toBeDefined();
			expect(result.rows).toEqual([]);
			expect(result.total).toBe(0);
		});
	});

	describe('getSiswaDetail', () => {
		it('returns null when siswa not found', async () => {
			mockGet.mockReturnValue(null);

			const result = getSiswaDetail('nonexistent');
			expect(result).toBeNull();
		});
	});

	describe('getMyProfile', () => {
		it('returns null when user has no refId', async () => {
			mockGet.mockReturnValue(null);

			const result = getMyProfile(999);
			expect(result).toBeNull();
		});
	});

	describe('getSiswaByRefId', () => {
		it('returns null when refId not found', async () => {
			mockGet.mockReturnValue(null);

			const result = getSiswaByRefId(999);
			expect(result).toBeNull();
		});
	});

	describe('submitPerubahan', () => {
		it('returns error when siswa not found', async () => {
			mockGet.mockReturnValue(null);

			const result = submitPerubahan(999, 'nama', 'Nama Baru');
			expect(result).toEqual({ error: 'Siswa tidak ditemukan' });
		});
	});

	describe('getKartuList', () => {
		it('returns array', async () => {
			mockAll.mockReturnValue([]);

			const result = getKartuList();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe('getRekap', () => {
		it('returns array of class summaries', async () => {
			mockAll.mockReturnValue([]);

			const result = getRekap();
			expect(Array.isArray(result)).toBe(true);
		});
	});
});
