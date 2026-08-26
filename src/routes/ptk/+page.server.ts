const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, url }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const q = url.searchParams.get('q') || '';
	const filter = url.searchParams.get('filter') || '';
	const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
	const perPage = 20;
	const params = new URLSearchParams();
	if (q) params.set('q', q);
	if (filter) params.set('filter', filter);
	params.set('page', String(page));
	params.set('per_page', String(perPage));
	const res = await fetch(`${API}/api/ptk?${params}`, { headers: h });
	const data = res.ok ? await res.json() : { rows: [], total: 0, page: 1, perPage };
	return {
		rows: data.rows,
		total: data.total,
		page: data.page || 1,
		perPage: data.perPage || perPage,
		q,
		filter,
	};
};
