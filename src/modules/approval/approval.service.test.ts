import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {
		all: vi.fn(() => []),
		run: vi.fn()
	},
	raw: vi.fn()
}));

vi.mock('fs', () => ({
	existsSync: vi.fn(() => false),
	renameSync: vi.fn(),
	unlinkSync: vi.fn()
}));

import { getApprovalFotoList, approveFoto, rejectFoto, getApprovalPerubahanList, approvePerubahan, rejectPerubahan } from './approval.service';

describe('approval.service', () => {
	describe('getApprovalFotoList', () => {
		it('returns array of pending foto approvals', async () => {
			const result = getApprovalFotoList();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe('approveFoto', () => {
		it('returns error when foto not found', async () => {
			const result = approveFoto(999);
			expect(result).toEqual({ ok: false, error: 'Tidak ada foto pending' });
		});
	});

	describe('rejectFoto', () => {
		it('returns error when foto not found', async () => {
			const result = rejectFoto(999);
			expect(result).toEqual({ ok: false, error: 'Tidak ada foto pending' });
		});
	});

	describe('getApprovalPerubahanList', () => {
		it('returns array of pending perubahan approvals', async () => {
			const result = getApprovalPerubahanList();
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe('approvePerubahan', () => {
		it('returns error when request not found', async () => {
			const result = approvePerubahan(999, 'admin');
			expect(result).toEqual({ ok: false, error: 'Permintaan tidak ditemukan atau sudah diproses' });
		});
	});

	describe('rejectPerubahan', () => {
		it('returns success when rejection processed', async () => {
			const result = rejectPerubahan(999, 'Data tidak sesuai');
			expect(result).toEqual({ ok: true, pesan: 'Perubahan ditolak' });
		});
	});
});
