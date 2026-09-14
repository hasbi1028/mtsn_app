import { query } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { getRosterList } from './roster.service';

export const getRosterListQ = query(v.optional(v.string(), ''), async (kelas) => {
	requireRole('admin', 'kepsek', 'guru');
	return getRosterList(kelas);
});
