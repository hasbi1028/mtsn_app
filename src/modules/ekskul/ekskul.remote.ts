import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guard';
import { canManageContent, isKontributor, actorNama } from '$lib/server/konten';
import { ekskulListSchema, ekskulSlugSchema, ekskulCreateSchema, ekskulUpdateSchema } from './ekskul.validation';
import {
	getEkskulList, getAllEkskulList, getEkskulBySlug, getEkskulById,
	createEkskul, updateEkskul, deleteEkskul, toggleEkskulPublish
} from './ekskul.service';

const ROLES = ['admin', 'kepsek', 'guru'];

export const getEkskulListQ = query(ekskulListSchema, async (args) => getEkskulList(args));
export const getEkskulBySlugQ = query(ekskulSlugSchema, async ({ slug }) => getEkskulBySlug(slug));
export const getAllEkskulListQ = query(ekskulListSchema, async (args) => {
	const user = requireRole(...ROLES);
	return getAllEkskulList({ ...args, mine: args.mine ? user.userId : undefined });
});

export const createEkskulF = form(ekskulCreateSchema, async (data) => {
	const user = requireRole(...ROLES);
	return createEkskul(
		{ ...data, published: isKontributor(user) ? false : data.published },
		{ userId: user.userId, nama: actorNama(user) }
	);
});

export const updateEkskulF = form(ekskulUpdateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const existing = getEkskulById(data.id);
	if (!existing) throw error(404, 'Ekskul tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa mengubah konten milik Anda.');

	const payload: Record<string, unknown> = { ...data };
	if (isKontributor(user)) delete payload.published;
	updateEkskul(data.id, payload);
});

export const deleteEkskulC = command(v.number(), async (id) => {
	const user = requireRole(...ROLES);
	const existing = getEkskulById(id);
	if (!existing) throw error(404, 'Ekskul tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa menghapus konten milik Anda.');
	return deleteEkskul(id);
});

export const toggleEkskulPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return toggleEkskulPublish(id);
});
