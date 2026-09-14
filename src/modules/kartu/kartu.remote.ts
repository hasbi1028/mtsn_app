import { query, command } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { requireStaff } from '$lib/server/guard';
import {
	getKartuList,
	getAllActiveSiswaWithFoto,
	getSiswaKartu,
	enqueueBatch,
	enqueueSingle,
	getBatchStatus,
	cancelBatch,
} from './kartu.service';

export const getKartuListQ = query(async () => {
	requireStaff();
	return getKartuList();
});

export const generateAllKartu = command(async () => {
	requireStaff();
	const siswaList = getAllActiveSiswaWithFoto();
	if (siswaList.length === 0) {
		return { error: 'Tidak ada siswa dengan foto' };
	}
	const batch = enqueueBatch(siswaList);
	return {
		batch_id: batch.id,
		total: batch.total,
		message: 'Generate sedang diproses',
	};
});

export const regenerateKartuCmd = command(v.string(), async (id) => {
	requireStaff();
	const sd = getSiswaKartu(id);
	if (!sd) error(404, 'Siswa tidak ditemukan');
	const { job, batch } = enqueueSingle(sd.id, sd.nama);
	return {
		ok: true,
		job_id: job.id,
		batch_id: batch.id,
		message: 'Regenerate sedang diproses',
	};
});

export const getBatchStatusQ = query(v.string(), async (batchId) => {
	requireStaff();
	const batch = getBatchStatus(batchId);
	if (!batch) return null;
	return {
		batch_id: batch.id,
		status: batch.status,
		total: batch.total,
		done: batch.done,
		failed: batch.failed,
	};
});

export const cancelBatchC = command(v.string(), async (batchId) => {
	requireStaff();
	const cancelled = cancelBatch(batchId);
	return { ok: true, cancelled, message: `${cancelled} job dibatalkan` };
});
