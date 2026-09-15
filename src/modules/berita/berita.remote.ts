import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guard';
import { canManageContent, isKontributor, actorNama } from '$lib/server/konten';
import { beritaListSchema, beritaSlugSchema, beritaCreateSchema, beritaUpdateSchema } from './berita.validation';
import {
	getBeritaList, getBeritaBySlug, getAllBeritaList, getBeritaById,
	createBerita, updateBerita, deleteBerita, toggleBeritaPublish
} from './berita.service';

const ROLES = ['admin', 'kepsek', 'guru'];

export const getBeritaListQ = query(beritaListSchema, async (args) => getBeritaList(args));
export const getBeritaBySlugQ = query(beritaSlugSchema, async ({ slug }) => getBeritaBySlug(slug));
export const getAllBeritaListQ = query(beritaListSchema, async (args) => {
	const user = requireRole(...ROLES);
	return getAllBeritaList({ ...args, mine: args.mine ? user.userId : undefined });
});

export const createBeritaF = form(beritaCreateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const kontributor = isKontributor(user);
	const nama = kontributor ? actorNama(user) : data.penulis || actorNama(user);
	return createBerita(
		{ ...data, penulis: nama, published: kontributor ? false : data.published },
		{ userId: user.userId, nama }
	);
});

export const updateBeritaF = form(beritaUpdateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const existing = getBeritaById(data.id);
	if (!existing) throw error(404, 'Berita tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa mengubah konten milik Anda.');

	const payload: Record<string, unknown> = { ...data };
	if (isKontributor(user)) delete payload.published; // moderasi: guru tak bisa mengubah status terbit
	updateBerita(data.id, payload);
});

export const deleteBeritaC = command(v.number(), async (id) => {
	const user = requireRole(...ROLES);
	const existing = getBeritaById(id);
	if (!existing) throw error(404, 'Berita tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa menghapus konten milik Anda.');
	return deleteBerita(id);
});

export const toggleBeritaPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return toggleBeritaPublish(id);
});
