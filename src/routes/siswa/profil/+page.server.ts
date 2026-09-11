import { error, fail } from '@sveltejs/kit';
import { getSiswaByRefId, submitPerubahan } from '$modules/siswa/siswa.service';

export const load = async ({ locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'siswa') error(403, 'Akses ditolak');

	const siswa = getSiswaByRefId(user.ref_id ?? 0);
	if (!siswa) error(404, 'Data siswa tidak ditemukan');

	return { siswa };
};

export const actions = {
	ubahData: async ({ request, locals }) => {
		const user = locals.user;
		if (!user || user.role !== 'siswa') return fail(403, { error: 'Akses ditolak' });

		const form = await request.formData();
		const field = String(form.get('field') || '');
		const nilaiBaru = String(form.get('nilai_baru') || '');

		if (!field || !nilaiBaru) {
			return fail(400, { error: 'Field dan nilai baru harus diisi' });
		}

		const result = submitPerubahan(user.ref_id ?? 0, field, nilaiBaru);
		if (result.error) {
			return fail(400, { error: result.error });
		}

		return { success: true, pesan: 'Perubahan data berhasil diajukan' };
	}
};
