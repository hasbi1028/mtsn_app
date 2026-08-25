import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API = process.env.API_BASE || 'http://localhost:3730';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/');
	return {};
};

const attempts = new Map<string, { n: number; until: number }>();

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const username = String(form.get('username') || '').trim();
		const password = String(form.get('password') || '');
		const ip = 'local';

		const now = Date.now();
		const rec = attempts.get(ip);
		if (rec && rec.n >= 5 && now < rec.until) {
			return { error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' };
		}

		const res = await fetch(`${API}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			const cur = attempts.get(ip);
			if (!cur || now > cur.until) attempts.set(ip, { n: 1, until: now + 60_000 });
			else cur.n++;
			return { error: data?.error || 'Username atau kata sandi salah.' };
		}
		attempts.delete(ip);
		cookies.set('mtsn_session', data.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 7 * 86400
		});
		redirect(302, '/');
	}
};
