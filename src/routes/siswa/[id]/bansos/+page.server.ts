const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, params }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const id = params.id;

	try {
		const [siswaRes, bansosRes] = await Promise.all([
			fetch(`${API}/api/siswa/${id}`, { headers: h }),
			fetch(`${API}/api/siswa/${id}/bansos`, { headers: h })
		]);
		const siswa = siswaRes.ok ? await siswaRes.json() : null;
		const bansos = bansosRes.ok ? await bansosRes.json() : null;
		return { siswa, bansos };
	} catch {
		return { siswa: null, bansos: null };
	}
};
