const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, url }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const q = url.searchParams.get('q') || '';
	const filter = url.searchParams.get('filter') || '';
	const res = await fetch(`${API}/api/ptk?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}`, { headers: h });
	const rows = res.ok ? await res.json() : [];
	return { rows, q, filter };
};
