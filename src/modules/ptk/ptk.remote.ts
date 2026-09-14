import { query } from '$app/server';
import { requireRole } from '$lib/server/guard';
import { ptkListSchema, ptkDetailSchema } from './ptk.validation';
import { getPtkList, getPtkDetail } from './ptk.service';

export const getPtkListQ = query(ptkListSchema, async (args) => {
	requireRole('admin', 'kepsek');
	return getPtkList(args);
});
export const getPtkDetailQ = query(ptkDetailSchema, async ({ id }) => {
	requireRole('admin', 'kepsek');
	return getPtkDetail(id);
});
