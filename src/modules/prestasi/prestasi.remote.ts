import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { prestasiListSchema, prestasiCreateSchema, prestasiUpdateSchema } from './prestasi.validation';
import {
	getPrestasiList, getPrestasiHighlight,
	createPrestasi, updatePrestasi, deletePrestasi
} from './prestasi.service';

export const getPrestasiListQ = query(prestasiListSchema, async (args) => getPrestasiList(args));
export const getPrestasiHighlightQ = query(async () => getPrestasiHighlight());

export const createPrestasiF = form(prestasiCreateSchema, async (data) => createPrestasi(data));
export const updatePrestasiF = form(prestasiUpdateSchema, async (data) => { updatePrestasi(data.id, data); });
export const deletePrestasiC = command(v.number(), async (id) => deletePrestasi(id));
