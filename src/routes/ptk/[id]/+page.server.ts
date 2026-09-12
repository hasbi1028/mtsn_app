import type { PageServerLoad } from './$types';
import { getPtkDetail } from '$modules/ptk/ptk.service';

export const load: PageServerLoad = async ({ params }) => {
	const p = getPtkDetail(params.id);
	return { p };
};
