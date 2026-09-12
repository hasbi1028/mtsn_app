import { query } from '$app/server';
import { ptkListSchema } from './ptk.validation';
import { getPtkList, getPtkDetail } from './ptk.service';

export const getPtkListQ = query(ptkListSchema, async (args) => getPtkList(args));
export const getPtkDetailQ = query(async (id: string) => getPtkDetail(id));
