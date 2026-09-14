import { query } from '$app/server';
import { requireStaff } from '$lib/server/guard';
import { getGeneralStats, getRombelStats, getBansosStats } from './dashboard.service';

export const getGeneralStatsQ = query(async () => {
	requireStaff();
	return getGeneralStats();
});
export const getRombelStatsQ = query(async () => {
	requireStaff();
	return getRombelStats();
});
export const getBansosStatsQ = query(async () => {
	requireStaff();
	return getBansosStats();
});
