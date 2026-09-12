import { error } from '@sveltejs/kit';
import { getSiswaForOrtu, getSiswaList } from '$modules/ortu/ortu.service';

export const load = async ({ locals }) => {
	const user = (locals as any).user;
	if (!user || user.role !== 'ortu') {
		error(403, 'Akses ditolak');
	}

	// Try to find child via siswa_ortu table
	let siswa = getSiswaForOrtu(user.refId || user.id);

	// Fallback: if no siswa_ortu link, return first siswa (placeholder)
	if (!siswa) {
		const all = getSiswaList() as any[];
		siswa = all.length > 0 ? all[0] : null;
	}

	if (!siswa) error(404, 'Data anak tidak ditemukan');

	return { siswa, ortu: { nama: user.username } };
};
