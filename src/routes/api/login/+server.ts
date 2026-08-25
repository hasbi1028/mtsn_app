import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Proxy login ke Go API; set cookie session di sini (httpOnly)
const API = process.env.API_BASE || 'http://localhost:3730';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const res = await fetch(`${API}/api/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		return json({ error: data?.error || 'Login gagal' }, { status: res.status });
	}
	cookies.set('mtsn_session', data.token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 7 * 86400
	});
	return json({ username: data.username });
};
