import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API = process.env.API_BASE || 'http://localhost:3730';

function authH(cookies: any): HeadersInit {
	const token = cookies.get('mtsn_session');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call(api: string, method: string, body?: any, cookies?: any) {
	const res = await fetch(`${API}${api}`, {
		method,
		headers: {
			...authH(cookies),
			...(body ? { 'Content-Type': 'application/json' } : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	return res.ok ? await res.json().catch(() => ({})) : null;
}

export const load: PageServerLoad = async ({ params, cookies }) => {
	const [rom, tepts] = await Promise.all([
		call(`/api/rombel/${params.id}`, 'GET', undefined, cookies),
		call('/api/ptk', 'GET', undefined, cookies),
	]);

	if (!rom) return { notFound: true, rombel: null };

	// Semua siswa tanpa rombel → kandidat alokasi
	const siswaRes = await fetch(`${API}/api/siswa?per_page=999&status=tanpa_rombel`, {
		headers: authH(cookies),
	});
	const selectedSiswa = siswaRes.ok ? (await siswaRes.json()).rows : [];

	// Daftar PTK (untuk pilihan wali)
	const ptkCandidates = Array.isArray(tepts) ? tepts : [];
	const availableWali = ptkCandidates.filter((p: any) => !p.waliKelas || p.waliKelas === '');

	return {
		rombel: rom,
		selectedSiswa,
		allPtk: ptkCandidates,
		availableWali,
	};
};

export const actions: Actions = {
	allocate: async ({ params, request, cookies }) => {
		const form = await request.formData();
		// siswa_ids datang sebagai array JSON
		const raw = String(form.get('siswa_ids') || '[]');
		const ids = JSON.parse(raw).map((s: string) => parseInt(s, 10));
		if (ids.length === 0) return fail(400, { ok: false, error: 'Pilih minimal 1 siswa' });
		const res = await call(`/api/rombel/${params.id}/siswa`, 'POST', { siswa_ids: ids }, cookies);
		if (!res?.ok) return fail(400, { ok: false, error: res?.message || 'Gagal alokasi' });
		return { ok: true, pesan: res.pesan };
	},

	remove: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const siswaId = form.get('siswa_id');
		const res = await call(`/api/rombel/${params.id}/siswa/${siswaId}`, 'DELETE', undefined, cookies);
		if (!res?.ok) return fail(400, { ok: false, error: 'Gagal keluarkan siswa' });
		return { ok: true, pesan: res.pesan };
	},

	assignWali: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const ptkId = form.get('ptk_id');
		if (!ptkId) return fail(400, { ok: false, error: 'Pilih wali kelas' });
		const res = await call(`/api/rombel/${params.id}/wali`, 'POST', { ptk_id: parseInt(String(ptkId), 10) }, cookies);
		if (!res?.ok) return fail(400, { ok: false, error: 'Gagal set wali' });
		return { ok: true, pesan: res.pesan };
	},
};