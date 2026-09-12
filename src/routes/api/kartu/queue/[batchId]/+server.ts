import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBatchStatus } from '$modules/kartu/kartu.service';

export const GET: RequestHandler = async ({ params }) => {
	const batch = getBatchStatus(params.batchId);
	if (!batch) error(404, 'Batch tidak ditemukan');
	return json({
		batch_id: batch.id,
		status: batch.status,
		total: batch.total,
		done: batch.done,
		failed: batch.failed,
		created_at: batch.created_at,
		done_at: batch.done_at,
	});
};
