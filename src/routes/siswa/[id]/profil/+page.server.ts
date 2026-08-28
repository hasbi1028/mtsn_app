const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, params }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const id = params.id;

	try {
		const res = await fetch(`${API}/api/siswa/${id}`, { headers: h });
		if (!res.ok) return { siswa: null };
		const siswa = await res.json();
		return { siswa };
	} catch {
		return { siswa: null };
	}
};
