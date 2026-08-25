import { json, cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API = process.env.API_BASE || 'http://localhost:3730';

export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	if (token) {
		await fetch(`${API}/api/logout`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		}).catch(() => {});
	}
	cookies.delete('mtsn_session', { path: '/' });
	return json({ ok: true });
};
