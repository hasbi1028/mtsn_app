import { query } from '$app/server';
import { requireUser } from '$lib/server/guard';
import { getProfilSaya } from './profil.service';

export const getProfilSayaQ = query(async () => getProfilSaya(requireUser()));
