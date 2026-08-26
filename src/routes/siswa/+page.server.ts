const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, url }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const kelas = url.searchParams.get('kelas') || '';
	const q = url.searchParams.get('q') || '';
	const rombel = url.searchParams.get('rombel') || '';
	const status = url.searchParams.get('status') || '';
	const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
	const perPage = 20;
	const params = new URLSearchParams();
	if (kelas) params.set('kelas', kelas);
	if (q) params.set('q', q);
	if (rombel) params.set('rombel', rombel);
	if (status) params.set('status', status);
	params.set('page', String(page));
	params.set('per_page', String(perPage));
	const res = await fetch(`${API}/api/siswa?${params}`, { headers: h });
	const data = res.ok ? await res.json() : { rows: [], rekap: [], total: 0, page: 1, perPage };
	return {
		rows: data.rows,
		rekap: data.rekap,
		total: data.total,
		page: data.page || 1,
		perPage: data.perPage || perPage,
		kelas,
		q,
		rombel,
		status,
	};
};
