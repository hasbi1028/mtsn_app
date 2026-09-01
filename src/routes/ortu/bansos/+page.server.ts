const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'ortu') {
		return { siswa: null, ortu: null };
	}

	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

	try {
		// Get ortu info
		const ortuRes = await fetch(`${API}/api/siswa?page=1&per_page=1`, { headers: h });
		// Get all siswa to find child via ref_id
		const siswaRes = await fetch(`${API}/api/siswa?page=1&per_page=200`, { headers: h });

		if (!siswaRes.ok) return { siswa: null, ortu: null };

		const siswaData = await siswaRes.json();
		const rows = siswaData.rows || [];

		// For now, return first siswa as child (placeholder logic)
		// In real app, this would query siswa_ortu table
		return {
			siswa: rows.length > 0 ? rows[0] : null,
			ortu: { nama: user.username }
		};
	} catch {
		return { siswa: null, ortu: null };
	}
};
