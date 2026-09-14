import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Alias pendek untuk QR/spanduk: /struktur → /profil/struktur (redirect permanen).
 * Ditempatkan di grup (public) supaya tetap memakai navbar & footer publik.
 */
export const load: PageServerLoad = async () => {
	throw redirect(308, '/profil/struktur');
};
