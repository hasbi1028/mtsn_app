import { query, form, command } from '$app/server';
import * as v from 'valibot';
import { galeriListSchema, galeriCreateSchema, galeriUpdateSchema } from './galeri.validation';
import { getGaleriList, createGaleri, updateGaleri, deleteGaleri } from './galeri.service';

export const getGaleriListQ = query(galeriListSchema, async (args) => getGaleriList(args));

export const createGaleriF = form(galeriCreateSchema, async (data) => createGaleri(data));
export const updateGaleriF = form(galeriUpdateSchema, async (data) => { updateGaleri(data.id, data); });
export const deleteGaleriC = command(v.number(), async (id) => deleteGaleri(id));
