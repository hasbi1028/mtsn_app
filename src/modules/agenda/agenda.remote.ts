import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { agendaListSchema, agendaCreateSchema, agendaUpdateSchema } from './agenda.validation';
import { getAgendaList, getAgendaUpcoming, createAgenda, updateAgenda, deleteAgenda } from './agenda.service';

export const getAgendaListQ = query(agendaListSchema, async (args) => getAgendaList(args));
export const getAgendaUpcomingQ = query(async () => getAgendaUpcoming());

export const createAgendaF = form(agendaCreateSchema, async (data) => createAgenda(data));
export const updateAgendaF = form(agendaUpdateSchema, async (data) => { updateAgenda(data.id, data); });
export const deleteAgendaC = command(v.number(), async (id) => deleteAgenda(id));
