import { query } from '$app/server';
import { ptkListSchema, ptkDetailSchema } from './ptk.validation';
import { getPtkList, getPtkDetail } from './ptk.service';

export const getPtkListQ = query(ptkListSchema, async (args) => getPtkList(args));
export const getPtkDetailQ = query(ptkDetailSchema, async ({ id }) => getPtkDetail(id));
