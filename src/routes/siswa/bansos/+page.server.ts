const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'siswa') {
		return { siswa: null };
	}

	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

	try {
		const res = await fetch(`${API}/api/siswa?page=1&per_page=200`, { headers: h });
		if (!res.ok) return { siswa: null };
		const data = await res.json();
		const rows = data.rows || [];
		const found = rows.find((r: any) => r.id === user.ref_id);
		return { siswa: found || null };
	} catch {
		return { siswa: null };
	}
};
