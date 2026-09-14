import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { requireRole } from '$lib/server/guard';
import { agendaListSchema, agendaCreateSchema, agendaUpdateSchema } from './agenda.validation';
import { getAgendaList, getAgendaUpcoming, createAgenda, updateAgenda, deleteAgenda } from './agenda.service';

export const getAgendaListQ = query(agendaListSchema, async (args) => getAgendaList(args));
export const getAgendaUpcomingQ = query(async () => getAgendaUpcoming());

export const createAgendaF = form(agendaCreateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	return createAgenda(data);
});
export const updateAgendaF = form(agendaUpdateSchema, async (data) => {
	requireRole('admin', 'kepsek');
	updateAgenda(data.id, data);
});
export const deleteAgendaC = command(v.number(), async (id) => {
	requireRole('admin', 'kepsek');
	return deleteAgenda(id);
});
