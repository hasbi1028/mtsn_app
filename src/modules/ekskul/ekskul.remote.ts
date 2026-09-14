import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { ekskulListSchema, ekskulSlugSchema, ekskulCreateSchema, ekskulUpdateSchema } from './ekskul.validation';
import {
	getEkskulList, getAllEkskulList, getEkskulBySlug,
	createEkskul, updateEkskul, deleteEkskul
} from './ekskul.service';

export const getEkskulListQ = query(ekskulListSchema, async (args) => getEkskulList(args));
export const getAllEkskulListQ = query(ekskulListSchema, async (args) => getAllEkskulList(args));
export const getEkskulBySlugQ = query(ekskulSlugSchema, async ({ slug }) => getEkskulBySlug(slug));

export const createEkskulF = form(ekskulCreateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	return createEkskul(data);
});
export const updateEkskulF = form(ekskulUpdateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	updateEkskul(data.id, data);
});
export const deleteEkskulC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return deleteEkskul(id);
});
