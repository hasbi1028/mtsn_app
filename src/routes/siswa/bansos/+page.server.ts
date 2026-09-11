import { error } from '@sveltejs/kit';
import { getSiswaByRefId } from '$modules/siswa/siswa.service';

export const load = async ({ locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'siswa') error(403, 'Akses ditolak');

	const siswa = getSiswaByRefId(user.ref_id ?? 0);
	if (!siswa) error(404, 'Data siswa tidak ditemukan');

	return { siswa };
};
