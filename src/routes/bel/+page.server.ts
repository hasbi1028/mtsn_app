const API = process.env.API_BASE || 'http://localhost:3730';
import { fail } from '@sveltejs/kit';

export const load = async ({ cookies, fetch }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const [statusRes, jadwalRes] = await Promise.all([
		fetch(`${API}/api/bel/status`, { headers: h }),
		fetch(`${API}/api/bel/jadwal`, { headers: h })
	]);
	const status = statusRes.ok ? await statusRes.json() : { ok: false, offline: true };
	const jadwal = jadwalRes.ok ? await jadwalRes.json() : { hari_ini: '', jadwal_hari_ini: [], semua: [] };
	return { status, jadwal };
};

export const actions = {
	stop: async ({ cookies, fetch }) => {
		const token = cookies.get('mtsn_session');
		if (!token) return fail(401, { error: 'Sesi berakhir' });
		const res = await fetch(`${API}/api/bel/stop`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});
		return await res.json();
	},
	play: async ({ cookies, fetch, request }) => {
		const token = cookies.get('mtsn_session');
		if (!token) return fail(401, { error: 'Sesi berakhir' });
		const fd = await request.formData();
		const file = String(fd.get('file') || '');
		const res = await fetch(`${API}/api/bel/play`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: file, repeat: 1 })
		});
		return await res.json();
	}
};
