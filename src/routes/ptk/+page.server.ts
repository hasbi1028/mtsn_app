import { getPtkList } from '$modules/ptk/ptk.service';

export const load = async ({ url }) => {
	const q = url.searchParams.get('q') || '';
	const filter = url.searchParams.get('filter') || '';
	const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
	const perPage = 20;

	const result = getPtkList({ q, filter, page, perPage });

	return {
		rows: result.rows,
		total: result.total,
		page: result.page,
		perPage: result.perPage,
		q,
		filter
	};
};
