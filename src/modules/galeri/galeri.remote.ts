import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { galeriListSchema, galeriCreateSchema, galeriUpdateSchema } from './galeri.validation';
import { getGaleriList, createGaleri, updateGaleri, deleteGaleri } from './galeri.service';

export const getGaleriListQ = query(galeriListSchema, async (args) => getGaleriList(args));

export const createGaleriF = form(galeriCreateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	return createGaleri(data);
});
export const updateGaleriF = form(galeriUpdateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	updateGaleri(data.id, data);
});
export const deleteGaleriC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return deleteGaleri(id);
});
