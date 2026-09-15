import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guard';
import { canManageContent, isKontributor, actorNama } from '$lib/server/konten';
import { prestasiListSchema, prestasiCreateSchema, prestasiUpdateSchema } from './prestasi.validation';
import {
	getPrestasiList, getAllPrestasiList, getPrestasiHighlight, getPrestasiById,
	createPrestasi, updatePrestasi, deletePrestasi, togglePrestasiPublish
} from './prestasi.service';

const ROLES = ['admin', 'kepsek', 'guru'];

export const getPrestasiListQ = query(prestasiListSchema, async (args) => getPrestasiList(args));
export const getPrestasiHighlightQ = query(async () => getPrestasiHighlight());
export const getAllPrestasiListQ = query(prestasiListSchema, async (args) => {
	const user = requireRole(...ROLES);
	return getAllPrestasiList({ ...args, mine: args.mine ? user.userId : undefined });
});

export const createPrestasiF = form(prestasiCreateSchema, async (data) => {
	const user = requireRole(...ROLES);
	return createPrestasi(
		{ ...data, published: isKontributor(user) ? false : data.published },
		{ userId: user.userId, nama: actorNama(user) }
	);
});

export const updatePrestasiF = form(prestasiUpdateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const existing = getPrestasiById(data.id);
	if (!existing) throw error(404, 'Prestasi tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa mengubah konten milik Anda.');

	const payload: Record<string, unknown> = { ...data };
	if (isKontributor(user)) delete payload.published;
	updatePrestasi(data.id, payload);
});

export const deletePrestasiC = command(v.number(), async (id) => {
	const user = requireRole(...ROLES);
	const existing = getPrestasiById(id);
	if (!existing) throw error(404, 'Prestasi tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa menghapus konten milik Anda.');
	return deletePrestasi(id);
});

export const togglePrestasiPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return togglePrestasiPublish(id);
});
