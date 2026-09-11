import { error } from '@sveltejs/kit';
import { getPtkDetail } from '$modules/ptk/ptk.service';

export const load = async ({ params }) => {
	const p = getPtkDetail(params.id);
	if (!p) error(404, 'PTK tidak ditemukan');
	return { p };
};
