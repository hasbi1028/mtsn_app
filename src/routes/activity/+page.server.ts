const API = process.env.API_BASE || 'http://localhost:3730';
export const load = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
	const res = await fetch(`${API}/api/activity`, { headers: h });
	const rows = res.ok ? await res.json() : [];
	return { rows };
};
