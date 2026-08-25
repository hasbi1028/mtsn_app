import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const API = process.env.API_BASE || 'http://localhost:3730';

async function checkSession(token: string | undefined): Promise<string | null> {
	if (!token) return null;
	try {
		const res = await fetch(`${API}/api/me`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) return null;
		const j = await res.json();
		return j.username || null;
	} catch {
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('mtsn_session');
	const username = await checkSession(token);
	event.locals.user = username ? { username, role: 'admin' } : null;

	const path = event.url.pathname;
	if (!event.locals.user && !path.startsWith('/login') && !path.startsWith('/test-ui') && !path.startsWith('/api/') && !path.startsWith('/uploads')) {
		redirect(302, '/login');
	}
	return resolve(event);
};
