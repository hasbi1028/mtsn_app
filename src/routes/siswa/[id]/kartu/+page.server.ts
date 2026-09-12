import type { PageServerLoad } from './$types';
import { getSiswaDetail } from '$modules/siswa/siswa.service';

export const load: PageServerLoad = async ({ params }) => {
	const siswa = getSiswaDetail(params.id);
	return { siswa };
};
