import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { getBelJadwal, getBelSuara } from './bel.service';

export const getBelJadwalQ = query(async () => getBelJadwal());
export const getBelSuaraQ = query(async () => getBelSuara());
