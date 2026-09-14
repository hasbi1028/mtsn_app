import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { beritaListSchema, beritaSlugSchema, beritaCreateSchema, beritaUpdateSchema } from './berita.validation';
import {
	getBeritaList, getBeritaBySlug, getAllBeritaList,
	createBerita, updateBerita, deleteBerita, toggleBeritaPublish
} from './berita.service';

export const getBeritaListQ = query(beritaListSchema, async (args) => getBeritaList(args));
export const getBeritaBySlugQ = query(beritaSlugSchema, async ({ slug }) => getBeritaBySlug(slug));
export const getAllBeritaListQ = query(beritaListSchema, async (args) => getAllBeritaList(args));

export const createBeritaF = form(beritaCreateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	return createBerita(data);
});
export const updateBeritaF = form(beritaUpdateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	updateBerita(data.id, data);
});
export const deleteBeritaC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return deleteBerita(id);
});
export const toggleBeritaPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return toggleBeritaPublish(id);
});
