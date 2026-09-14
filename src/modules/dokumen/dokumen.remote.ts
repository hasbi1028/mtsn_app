import { query } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { getSkmtList, getSkbkList, getSkakptList, getSkakptMonths } from './dokumen.service';

const DOKUMEN_ROLES = ['admin', 'kepsek', 'guru'];

export const getSkmtListQ = query(async () => {
	requireRole(...DOKUMEN_ROLES);
	return getSkmtList();
});
export const getSkbkListQ = query(async () => {
	requireRole(...DOKUMEN_ROLES);
	return getSkbkList();
});
export const getSkakptMonthsQ = query(async () => {
	requireRole(...DOKUMEN_ROLES);
	return getSkakptMonths();
});
export const getSkakptListQ = query(v.optional(v.string()), async (bulan) => {
	requireRole(...DOKUMEN_ROLES);
	return getSkakptList(bulan);
});
