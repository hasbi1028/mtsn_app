import { error } from '@sveltejs/kit';
import { getSiswaDetail } from '$modules/siswa/siswa.service';

export const load = async ({ params }) => {
	const siswa = getSiswaDetail(params.id);
	if (!siswa) error(404, 'Siswa tidak ditemukan');
	return { siswa };
};
