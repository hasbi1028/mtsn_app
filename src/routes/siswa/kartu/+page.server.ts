const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

	try {
		const res = await fetch(`${API}/api/siswa/kartu/list`, { headers: h });
		if (!res.ok) return { list: [] };
		const data = await res.json();
		return { list: data.rows || [] };
	} catch {
		return { list: [] };
	}
};