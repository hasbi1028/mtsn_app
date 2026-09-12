import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getKartuList } from '$modules/kartu/kartu.service';

export const GET: RequestHandler = async () => {
	return json({ rows: getKartuList() });
};
