import { query, command } from '$app/server';
import * as v from 'valibot';
import {
	getKartuList,
	getAllActiveSiswaWithFoto,
	getOrGenerateKartu,
	getOrGenerateKartuBack,
	regenerateKartu,
	enqueueBatch,
	enqueueSingle,
	getBatchStatus,
	cancelBatch,
} from './kartu.service';

export const getKartuListQ = query(async () => getKartuList());

export const generateAllKartu = command(async () => {
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
	const { job, batch } = enqueueSingle(id, '');
	return {
		ok: true,
		job_id: job.id,
		batch_id: batch.id,
		message: 'Regenerate sedang diproses',
	};
});
