import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guard';
import { canManageContent, isKontributor, actorNama } from '$lib/server/konten';
import { agendaListSchema, agendaCreateSchema, agendaUpdateSchema } from './agenda.validation';
import {
	getAgendaList, getAllAgendaList, getAgendaById, getAgendaUpcoming,
	createAgenda, updateAgenda, deleteAgenda, toggleAgendaPublish
} from './agenda.service';

const ROLES = ['admin', 'kepsek', 'guru'];

export const getAgendaListQ = query(agendaListSchema, async (args) => getAgendaList(args));
export const getAllAgendaListQ = query(agendaListSchema, async (args) => {
	const user = requireRole(...ROLES);
	return getAllAgendaList({ ...args, mine: args.mine ? user.userId : undefined });
});
export const getAgendaUpcomingQ = query(async () => getAgendaUpcoming());

export const createAgendaF = form(agendaCreateSchema, async (data) => {
	const user = requireRole(...ROLES);
	return createAgenda(
		{ ...data, published: isKontributor(user) ? false : data.published },
		{ userId: user.userId, nama: actorNama(user) }
	);
});

export const updateAgendaF = form(agendaUpdateSchema, async (data) => {
	const user = requireRole(...ROLES);
	const existing = getAgendaById(data.id);
	if (!existing) throw error(404, 'Agenda tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa mengubah konten milik Anda.');

	const payload: Record<string, unknown> = { ...data };
	if (isKontributor(user)) delete payload.published;
	updateAgenda(data.id, payload);
});

export const deleteAgendaC = command(v.number(), async (id) => {
	const user = requireRole(...ROLES);
	const existing = getAgendaById(id);
	if (!existing) throw error(404, 'Agenda tidak ditemukan.');
	if (!canManageContent(user, existing.authorUserId)) throw error(403, 'Anda hanya bisa menghapus konten milik Anda.');
	return deleteAgenda(id);
});

export const toggleAgendaPublishC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return toggleAgendaPublish(id);
});
