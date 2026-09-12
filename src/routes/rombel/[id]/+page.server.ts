import { fail } from '@sveltejs/kit';
import { getRombelDetail, getRombelSiswa, allocateSiswa, removeSiswa, setWaliKelas } from '$modules/rombel/rombel.service';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const load = async ({ params }) => {
	const id = parseInt(params.id, 10);
	const rombel = await getRombelDetail(id);
	if (!rombel) return { notFound: true, rombel: null };
	const selectedSiswa = await getRombelSiswa(id);
	const allPtk = db.all(sql`SELECT id, nama FROM ptk ORDER BY nama`);
	return { rombel, selectedSiswa, allPtk };
};

export const actions = {
	allocate: async ({ params, request }) => {
		const form = await request.formData();
		const raw = String(form.get('siswa_ids') || '[]');
		const ids = JSON.parse(raw).map((s: string) => parseInt(s, 10));
		if (ids.length === 0) return fail(400, { ok: false, error: 'Pilih minimal 1 siswa' });
		const result = await allocateSiswa(parseInt(params.id, 10), ids);
		if (!result?.ok) return fail(400, { ok: false, error: result?.error || 'Gagal alokasi' });
		return { ok: true, pesan: result.pesan };
	},

	remove: async ({ params, request }) => {
		const form = await request.formData();
		const siswaId = parseInt(String(form.get('siswa_id')), 10);
		const result = await removeSiswa(parseInt(params.id, 10), siswaId);
		if (!result?.ok) return fail(400, { ok: false, error: 'Gagal keluarkan siswa' });
		return { ok: true, pesan: result.pesan };
	},

	assignWali: async ({ params, request }) => {
		const form = await request.formData();
		const ptkId = parseInt(String(form.get('ptk_id')), 10);
		if (!ptkId) return fail(400, { ok: false, error: 'Pilih wali kelas' });
		const result = await setWaliKelas(parseInt(params.id, 10), ptkId);
		if (!result?.ok) return fail(400, { ok: false, error: 'Gagal set wali' });
		return { ok: true, pesan: result.pesan };
	}
};
