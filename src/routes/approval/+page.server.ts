import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API = process.env.API_BASE || 'http://localhost:3730';

function authH(cookies: any): HeadersInit {
	const token = cookies.get('mtsn_session');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export const load: PageServerLoad = async ({ cookies }) => {
	const h = authH(cookies);
	const [fotoRes, perubahRes] = await Promise.all([
		fetch(`${API}/api/approval/foto`, { headers: h }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
		fetch(`${API}/api/approval/perubahan`, { headers: h }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
	]);
	return { fotoPending: fotoRes, perubahanPending: perubahRes };
};

export const actions: Actions = {
	approveFoto: async ({ params, request, cookies }) => {
		const form = await request.formData();
		const id = form.get('id');
		const res = await fetch(`${API}/api/approval/foto/${id}/approve`, {
			method: 'POST', headers: authH(cookies),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return fail(res.status, { ok: false, error: data?.error || 'Gagal' });
		return { ok: true, pesan: data.pesan || 'Foto disetujui' };
	},
	rejectFoto: async ({ request, cookies }) => {
		const form = await request.formData();
		const id = form.get('id');
		const res = await fetch(`${API}/api/approval/foto/${id}/reject`, {
			method: 'POST', headers: authH(cookies),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return fail(res.status, { ok: false, error: data?.error || 'Gagal' });
		return { ok: true, pesan: data.pesan || 'Foto ditolak' };
	},
	approvePerubahan: async ({ request, cookies }) => {
		const form = await request.formData();
		const id = form.get('id');
		const res = await fetch(`${API}/api/approval/perubahan/${id}/approve`, {
			method: 'POST', headers: authH(cookies),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return fail(res.status, { ok: false, error: data?.error || 'Gagal' });
		return { ok: true, pesan: data.pesan || 'Perubahan disetujui' };
	},
	rejectPerubahan: async ({ request, cookies }) => {
		const form = await request.formData();
		const id = form.get('id');
		const catatan = String(form.get('catatan') || '');
		const res = await fetch(`${API}/api/approval/perubahan/${id}/reject`, {
			method: 'POST',
			headers: { ...authH(cookies), 'Content-Type': 'application/json' },
			body: JSON.stringify({ catatan }),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return fail(res.status, { ok: false, error: data?.error || 'Gagal' });
		return { ok: true, pesan: data.pesan || 'Perubahan ditolak' };
	},
};