import { error } from '@sveltejs/kit';

const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, params }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const res = await fetch(`${API}/api/ptk/${params.id}`, { headers: h });
	if (!res.ok) error(404, 'PTK tidak ditemukan');
	const p = await res.json();
	return { p };
};
