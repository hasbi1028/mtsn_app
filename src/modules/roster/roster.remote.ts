import { query } from '$app/server';
import * as v from 'valibot';
import { getRosterList } from './roster.service';

export const getRosterListQ = query(v.optional(v.string(), ''), async (kelas) => getRosterList(kelas));
