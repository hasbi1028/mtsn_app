import { query } from '$app/server';
import * as v from 'valibot';
import { getSkmtList, getSkbkList, getSkakptList, getSkakptMonths } from './dokumen.service';

export const getSkmtListQ = query(async () => getSkmtList());
export const getSkbkListQ = query(async () => getSkbkList());
export const getSkakptMonthsQ = query(async () => getSkakptMonths());
export const getSkakptListQ = query(v.optional(v.string()), async (bulan) => getSkakptList(bulan));
