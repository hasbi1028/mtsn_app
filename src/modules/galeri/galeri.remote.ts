import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guard';
import { canManageContent, isKontributor, actorNama } from '$lib/server/konten';
import { galeriListSchema, galeriCreateSchema, galeriUpdateSchema } from './galeri.validation';
import {
	getGaleriList, getAllGaleriList, getGaleriById,
	createGaleri, updateGaleri, deleteGaleri, toggleGaleriPublish
} from './galeri.service';

const ROLES = ['admin', 'kepsek', 'guru'];

export const getGaleriListQ = query(galeriListSchema, async (args) => getGaleriList(args));
export const getAllGaleriListQ = query(galeriListSchema, async (args) => {
	const user = requireRole(...ROLES);
	return getAllGaleriList({ ...args, mine: args.mine ? user.userId : undefined });
});

export const createGaleriF = form(galeriCreateSchema, async (data) => {
	const user = requireRole(...ROLES);
	return createGaleri(
		{ ...data, published: isKontributor(user) ? false : data.published },
		{ userId: user.userId, nama: actorNama(user) }
	);
});

export const updateGaleriF = form(galeriUpdateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const existing = getGaleriById(data.id);
	if (!existing) throw error(404, 'Galeri tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa mengubah konten milik Anda.');

	const payload: Record<string, unknown> = { ...data };
	if (isKontributor(user)) delete payload.published;
	updateGaleri(data.id, payload);
});

export const deleteGaleriC = command(v.number(), async (id) => {
	const user = requireRole(...ROLES);
	const existing = getGaleriById(id);
	if (!existing) throw error(404, 'Galeri tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa menghapus konten milik Anda.');
	return deleteGaleri(id);
});

export const toggleGaleriPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return toggleGaleriPublish(id);
});
