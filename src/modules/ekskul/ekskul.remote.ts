import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { ekskulListSchema, ekskulSlugSchema, ekskulCreateSchema, ekskulUpdateSchema } from './ekskul.validation';
import {
	getEkskulList, getAllEkskulList, getEkskulBySlug,
	createEkskul, updateEkskul, deleteEkskul
} from './ekskul.service';

export const getEkskulListQ = query(ekskulListSchema, async (args) => getEkskulList(args));
export const getAllEkskulListQ = query(ekskulListSchema, async (args) => getAllEkskulList(args));
export const getEkskulBySlugQ = query(ekskulSlugSchema, async ({ slug }) => getEkskulBySlug(slug));

export const createEkskulF = form(ekskulCreateSchema, async (data) => createEkskul(data));
export const updateEkskulF = form(ekskulUpdateSchema, async (data) => { updateEkskul(data.id, data); });
export const deleteEkskulC = command(v.number(), async (id) => deleteEkskul(id));
