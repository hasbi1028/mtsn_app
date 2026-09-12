import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSiswaDetail } from '$modules/siswa/siswa.service';

export const GET: RequestHandler = async ({ params }) => {
	const siswa = getSiswaDetail(params.id);
	if (!siswa) return json({ error: 'Siswa not found' }, { status: 404 });
	return json({ siswa });
};
