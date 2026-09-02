const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, url }) => {
	const token = cookies.get('mtsn_session');
	const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

	// Ambil daftar bulan yang tersedia (terbaru dulu)
	const monthsRes = await fetch(`${API}/api/skakpt/months`, { headers: h });
	const allMonths = monthsRes.ok ? await monthsRes.json() : [];

	// Bulan terpilih: dari query, atau default = bulan terbaru
	const bulan = url.searchParams.get('bulan') || (allMonths[0] as string) || '';

	const qs = bulan ? `?bulan=${encodeURIComponent(bulan)}` : '';
	const res = await fetch(`${API}/api/skakpt${qs}`, { headers: h });
	const rows = res.ok ? await res.json() : [];

	return { rows, bulan, allMonths };
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
