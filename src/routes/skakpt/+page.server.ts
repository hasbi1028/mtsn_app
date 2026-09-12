import { getSkakptList, getSkakptMonths } from '$modules/dokumen/dokumen.service';

export const load = async ({ url }) => {
	const allMonths = getSkakptMonths();
	const bulan = url.searchParams.get('bulan') || allMonths[0] || '';
	const rows = getSkakptList(bulan || undefined);
	return { rows, bulan, allMonths };
};

export const actions = {
	download: async ({ request }) => {
		const formData = await request.formData();
		const filename = formData.get('filename') as string;
		if (!filename) return { ok: false, error: 'Filename tidak ada' };
		if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
			return { ok: false, error: 'Filename tidak valid' };
		}
		return { ok: true, filename };
	}
};
