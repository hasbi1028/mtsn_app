import { query } from '$app/server';
import { getPublicStats, getPublicGuruList, getBerandaData } from './public.service';

export const getPublicStatsQ = query(async () => getPublicStats());
export const getPublicGuruListQ = query(async () => getPublicGuruList());
export const getBerandaDataQ = query(async () => getBerandaData());
