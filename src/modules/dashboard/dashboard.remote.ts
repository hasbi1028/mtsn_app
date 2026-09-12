import { query } from '$app/server';
import { getGeneralStats, getRombelStats, getBansosStats } from './dashboard.service';

export const getGeneralStatsQ = query(async () => getGeneralStats());
export const getRombelStatsQ = query(async () => getRombelStats());
export const getBansosStatsQ = query(async () => getBansosStats());
