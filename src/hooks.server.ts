import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const API = process.env.API_BASE || 'http://localhost:3730';

async function checkSession(token: string | undefined): Promise<{ username: string; role: string; ref_id: number } | null> {
	if (!token) return null;
	try {
		const res = await fetch(`${API}/api/me`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) return null;
		const j = await res.json();
		if (!j.username || !j.role) return null;
		return { username: j.username, role: j.role, ref_id: j.ref_id ?? 0 };
	} catch {
		return null;
	}
}

/** Redirect path based on user role */
function roleRedirect(role: string): string {
	switch (role) {
		case 'siswa': return '/siswa/profil';
		case 'ortu': return '/ortu/profil';
		default: return '/'; // admin, kepsek, guru, staf → dashboard
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('mtsn_session');
	const user = await checkSession(token);
	event.locals.user = user;

	const path = event.url.pathname;
	const isPublic = path.startsWith('/login') || path.startsWith('/test-ui') || path.startsWith('/api/') || path.startsWith('/uploads');

	if (!event.locals.user && !isPublic) {
		redirect(302, '/login');
	}

	return resolve(event);
};
