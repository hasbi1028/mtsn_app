import { error } from '@sveltejs/kit';
import { getSiswaDetail, getSiswaBansos } from '$modules/siswa/siswa.service';

export const load = async ({ params }) => {
	const [siswa, bansos] = await Promise.all([
		Promise.resolve(getSiswaDetail(params.id)),
		Promise.resolve(getSiswaBansos(params.id))
	]);

	if (!siswa) error(404, 'Siswa tidak ditemukan');

	return { siswa, bansos };
};
