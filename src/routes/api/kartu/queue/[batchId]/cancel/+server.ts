import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cancelBatch } from '$modules/kartu/kartu.service';

export const POST: RequestHandler = async ({ params }) => {
	const cancelled = cancelBatch(params.batchId);
	return json({ ok: true, cancelled, message: `${cancelled} job dibatalkan` });
};
