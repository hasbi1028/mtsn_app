import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { pengumumanListSchema, pengumumanCreateSchema, pengumumanUpdateSchema } from './pengumuman.validation';
import {
	getPengumumanList, getAllPengumumanList, getPengumumanById,
	createPengumuman, updatePengumuman, deletePengumuman, togglePengumumanPublish
} from './pengumuman.service';

export const getPengumumanListQ = query(pengumumanListSchema, async (args) => getPengumumanList(args));
export const getAllPengumumanListQ = query(pengumumanListSchema, async (args) => getAllPengumumanList(args));
export const getPengumumanByIdQ = query(v.number(), async (id) => getPengumumanById(id));

export const createPengumumanF = form(pengumumanCreateSchema, async (data) => createPengumuman(data));
export const updatePengumumanF = form(pengumumanUpdateSchema, async (data) => { updatePengumuman(data.id, data); });
export const deletePengumumanC = command(v.number(), async (id) => deletePengumuman(id));
export const togglePengumumanPublishC = command(v.number(), async (id) => togglePengumumanPublish(id));
