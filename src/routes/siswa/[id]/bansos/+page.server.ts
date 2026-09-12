import type { PageServerLoad } from './$types';
import { getSiswaDetail, getSiswaBansos } from '$modules/siswa/siswa.service';

export const load: PageServerLoad = async ({ params }) => {
	const siswa = getSiswaDetail(params.id);
	const bansos = getSiswaBansos(params.id);
	return { siswa, bansos };
};
