import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { enqueueSingle, getSiswaKartu } from '$modules/kartu/kartu.service';

export const POST: RequestHandler = async ({ params }) => {
	const sd = getSiswaKartu(params.id);
	if (!sd) error(404, 'Siswa tidak ditemukan');
	const { job, batch } = enqueueSingle(sd.id, sd.nama);
	return json({ ok: true, job_id: job.id, batch_id: batch.id, message: 'Regenerate sedang diproses' });
};
