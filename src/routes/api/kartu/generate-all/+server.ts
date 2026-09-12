import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllActiveSiswaWithFoto, enqueueBatch } from '$modules/kartu/kartu.service';

export const POST: RequestHandler = async () => {
	const siswaList = getAllActiveSiswaWithFoto();
	if (siswaList.length === 0) {
		return json({ error: 'Tidak ada siswa dengan foto' }, { status: 400 });
	}
	const batch = enqueueBatch(siswaList);
	return json({ batch_id: batch.id, total: batch.total, message: 'Generate sedang diproses' });
};
