import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guard';
import { canManageContent, isKontributor, actorNama } from '$lib/server/konten';
import { pengumumanListSchema, pengumumanCreateSchema, pengumumanUpdateSchema } from './pengumuman.validation';
import {
	getPengumumanList, getAllPengumumanList, getPengumumanById,
	createPengumuman, updatePengumuman, deletePengumuman, togglePengumumanPublish
} from './pengumuman.service';

const ROLES = ['admin', 'kepsek', 'guru'];

export const getPengumumanListQ = query(pengumumanListSchema, async (args) => getPengumumanList(args));
export const getAllPengumumanListQ = query(pengumumanListSchema, async (args) => {
	const user = requireRole(...ROLES);
	return getAllPengumumanList({ ...args, mine: args.mine ? user.userId : undefined });
});
export const getPengumumanByIdQ = query(v.number(), async (id) => getPengumumanById(id));

export const createPengumumanF = form(pengumumanCreateSchema, async (data) => {
	const user = requireRole(...ROLES);
	return createPengumuman(
		{ ...data, published: isKontributor(user) ? false : data.published },
		{ userId: user.userId, nama: actorNama(user) }
	);
});

export const updatePengumumanF = form(pengumumanUpdateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const existing = getPengumumanById(data.id);
	if (!existing) throw error(404, 'Pengumuman tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa mengubah konten milik Anda.');

	const payload: Record<string, unknown> = { ...data };
	if (isKontributor(user)) delete payload.published;
	updatePengumuman(data.id, payload);
});

export const deletePengumumanC = command(v.number(), async (id) => {
	const user = requireRole(...ROLES);
	const existing = getPengumumanById(id);
	if (!existing) throw error(404, 'Pengumuman tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa menghapus konten milik Anda.');
	return deletePengumuman(id);
});

export const togglePengumumanPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return togglePengumumanPublish(id);
});
