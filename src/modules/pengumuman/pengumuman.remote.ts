import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { pengumumanListSchema, pengumumanCreateSchema, pengumumanUpdateSchema } from './pengumuman.validation';
import {
	getPengumumanList, getAllPengumumanList, getPengumumanById,
	createPengumuman, updatePengumuman, deletePengumuman, togglePengumumanPublish
} from './pengumuman.service';

export const getPengumumanListQ = query(pengumumanListSchema, async (args) => getPengumumanList(args));
export const getAllPengumumanListQ = query(pengumumanListSchema, async (args) => getAllPengumumanList(args));
export const getPengumumanByIdQ = query(v.number(), async (id) => getPengumumanById(id));

export const createPengumumanF = form(pengumumanCreateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	return createPengumuman(data);
});
export const updatePengumumanF = form(pengumumanUpdateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	updatePengumuman(data.id, data);
});
export const deletePengumumanC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return deletePengumuman(id);
});
export const togglePengumumanPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return togglePengumumanPublish(id);
});
