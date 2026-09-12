import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: { all: () => [], select: () => ({}) }
}));

import {
	enqueueSingle,
	enqueueBatch,
	getBatchStatus,
	cancelBatch,
	getAllActiveSiswaWithFoto
} from './kartu.service';

describe('kartu.service — queue', () => {
	it('getBatchStatus batch tidak dikenal -> null', () => {
		expect(getBatchStatus('batch-tidak-ada')).toBeNull();
	});

	it('cancelBatch batch tidak dikenal -> 0', () => {
		expect(cancelBatch('batch-tidak-ada')).toBe(0);
	});

	it('getAllActiveSiswaWithFoto mengembalikan array', () => {
		expect(getAllActiveSiswaWithFoto()).toEqual([]);
	});

	it('enqueueSingle siswa tak ditemukan -> batch selesai dengan failed=1', async () => {
		vi.resetModules();
		const svc = await import('./kartu.service');
		const { batch } = svc.enqueueSingle('999999', 'Tidak Ada');
		const status = svc.getBatchStatus(batch.id);
		expect(status?.total).toBe(1);
		expect(status?.failed).toBe(1);
		expect(status?.status).toBe('completed');
	});

	it('enqueueBatch lalu cancelBatch menandai job pending failed & completed', async () => {
		vi.resetModules();
		const svc = await import('./kartu.service');
		const batch = svc.enqueueBatch([
			{ id: 1, nama: 'A' },
			{ id: 2, nama: 'B' },
			{ id: 3, nama: 'C' }
		]);
		expect(batch.total).toBe(3);

		const cancelled = svc.cancelBatch(batch.id);
		expect(cancelled).toBeGreaterThanOrEqual(1);

		const status = svc.getBatchStatus(batch.id)!;
		expect(status.total).toBe(3);
		expect(status.done + status.failed).toBe(3);
		expect(status.failed).toBe(3);
		expect(status.status).toBe('completed');
	});
});
