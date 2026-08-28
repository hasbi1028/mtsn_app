const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const res = await fetch(`${API}/api/skakpt`, { headers: h });
	const rows = res.ok ? await res.json() : [];
	return { rows };
};

export const actions = {
	download: async ({ request, cookies }) => {
		const formData = await request.formData();
		const filename = formData.get('filename') as string;
		if (!filename) return { ok: false, error: 'Filename tidak ada' };
		
		// Validasi filename (anti path traversal)
		if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
			return { ok: false, error: 'Filename tidak valid' };
		}
		
		return { ok: true, filename };
	},
};