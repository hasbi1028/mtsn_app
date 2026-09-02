const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, url }) => {
	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
	const bulan = url.searchParams.get('bulan') || '';

	const qs = bulan ? `?bulan=${encodeURIComponent(bulan)}` : '';
	const res = await fetch(`${API}/api/skakpt${qs}`, { headers: h });
	const rows = res.ok ? await res.json() : [];
	return { rows, bulan };
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
