import { query } from '$app/server';
import { getRequestEvent } from '$app/server';
import { getSiswaForOrtu, getSiswaList } from './ortu.service';
import { getUserFromSession } from '$modules/auth/auth.service';

function getCookie(name: string): string | undefined {
	const { cookies } = getRequestEvent();
	return cookies.get(name);
}

function getCurrentUser() {
	const token = getCookie('session_id');
	if (!token) return null;
	return getUserFromSession(token);
}

export const getOrtuSiswaQ = query(async () => {
	const user = getCurrentUser();
	if (!user || user.role !== 'ortu') return null;

	let siswa = getSiswaForOrtu(user.ref_id || user.userId);
	if (!siswa) {
		const all = getSiswaList() as any[];
		siswa = all.length > 0 ? all[0] : null;
	}
	return { siswa, ortu: { nama: user.username } };
});
