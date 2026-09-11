import { getSiswaList, getRekap } from '$modules/siswa/siswa.service';

export const load = async ({ url }) => {
	const q = url.searchParams.get('q') || '';
	const kelas = url.searchParams.get('kelas') || '';
	const nisn = url.searchParams.get('nisn') || '';
	const ortu = url.searchParams.get('ortu') || '';
	const rombel = url.searchParams.get('rombel') || '';
	const status = url.searchParams.get('status') || '';
	const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
	const perPage = 20;

	const result = getSiswaList({ q, kelas, nisn, ortu, rombel, status, page, perPage });
	const rekap = getRekap();

	return {
		rows: result.rows,
		total: result.total,
		page: result.page,
		perPage: result.perPage,
		rekap,
		q,
		kelas,
		nisn,
		ortu,
		rombel,
		status
	};
};
