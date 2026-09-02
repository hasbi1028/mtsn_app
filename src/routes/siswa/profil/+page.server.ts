import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API = process.env.API_BASE || 'http://localhost:3730';

function authH(cookies: any): HeadersInit {
	const token = cookies.get('mtsn_session');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const h = authH(cookies);
	const meRes = await fetch(`${API}/api/siswa/me`, { headers: h });
	const me = meRes.ok ? await meRes.json() : null;
	return { user: locals.user, profile: me };
};

export const actions: Actions = {
	// Ajukan perubahan data → menunggu persetujuan admin
	ubahData: async ({ request, cookies }) => {
		const formData = await request.formData();
		const field = String(formData.get('field') || '');
		const nilaiBaru = String(formData.get('nilai_baru') || '').trim();
		if (!field) return fail(400, { ok: false, error: 'Field tidak valid' });
		if (!nilaiBaru) return fail(400, { ok: false, error: 'Nilai baru tidak boleh kosong' });

		const res = await fetch(`${API}/api/siswa/me/perubahan`, {
			method: 'POST',
			headers: { ...authH(cookies), 'Content-Type': 'application/json' },
			body: JSON.stringify({ field, nilai_baru: nilaiBaru }),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return fail(res.status, { ok: false, error: data?.error || 'Gagal mengajukan perubahan' });
		return { ok: true, pesan: data.pesan || 'Perubahan dikirim untuk persetujuan' };
	},
};