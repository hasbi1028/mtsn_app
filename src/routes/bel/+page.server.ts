const API = process.env.API_BASE || 'http://localhost:3730';
import { fail } from '@sveltejs/kit';

async function api(cookies: any, fetchFn: any, path: string, opts: any = {}) {
	const token = cookies.get('mtsn_session');
	if (!token) return fail(401, { ok: false, error: 'Sesi berakhir' });
	const res = await fetchFn(`${API}${path}`, {
		...opts,
		headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) }
	});
	return await res.json();
}

export const load = async ({ cookies, fetch }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const [statusRes, jadwalRes, suaraRes] = await Promise.all([
		fetch(`${API}/api/bel/status`, { headers: h }),
		fetch(`${API}/api/bel/jadwal`, { headers: h }),
		fetch(`${API}/api/bel/suara`, { headers: h })
	]);
	const status = statusRes.ok ? await statusRes.json() : { ok: false, offline: true };
	const jadwal = jadwalRes.ok
		? await jadwalRes.json()
		: { hari_ini: '', jadwal_hari_ini: [], semua: [] };
	const suara = suaraRes.ok ? await suaraRes.json() : { files: [] };
	return { status, jadwal, suara };
};

export const actions = {
	stop: async ({ cookies, fetch }) => {
		const res = await api(cookies, fetch, '/api/bel/stop', { method: 'POST' });
		if (res?.ok) return { ok: true, pesan: 'Pemutaran dihentikan.' };
		return res;
	},

	play: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const file = String(fd.get('file') || '');
		const res = await api(cookies, fetch, '/api/bel/play', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: file, repeat: 1 })
		});
		if (res?.ok) return { ok: true, pesan: `Memutar ${file}...` };
		if (res?.error) return fail(409, { ok: false, error: res.error });
		return fail(400, { ok: false, error: 'Gagal memutar suara.' });
	},

	// Master switch — konfirmasi kata wajib
	master: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const confirm = String(fd.get('confirm') || '').toUpperCase().trim();
		const target = String(fd.get('target')) === '1' ? 'AKTIF' : 'NONAKTIF';
		if (confirm !== target) {
			return fail(400, { ok: false, error: `Ketik "${target}" untuk konfirmasi.` });
		}
		const enabled = target === 'AKTIF';
		const res = await api(cookies, fetch, '/api/bel/master', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ enabled })
		});
		if (res?.ok) return { ok: true, pesan: `Bel sekarang ${enabled ? 'AKTIF' : 'NONAKTIF (mode darurat)'}.` };
		return fail(500, { ok: false, error: 'Gagal mengubah master switch.' });
	},

	// Tambah jadwal
	create: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const body = {
			hari: String(fd.get('hari') || ''),
			jam: String(fd.get('jam') || ''),
			jenis: String(fd.get('jenis') || 'khusus'),
			label: String(fd.get('label') || ''),
			sound_path: String(fd.get('sound_path') || ''),
			repeat: Number(fd.get('repeat') || 2)
		};
		const res = await api(cookies, fetch, '/api/bel/jadwal', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) return fail(400, res);
		return { ok: true, pesan: `Jadwal ${body.hari} ${body.jam} ditambahkan.` };
	},

	// Toggle aktif/nonaktif satu jadwal
	update: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') || '');
		const body = {
			hari: String(fd.get('hari') || ''),
			jam: String(fd.get('jam') || ''),
			jenis: String(fd.get('jenis') || 'khusus'),
			label: String(fd.get('label') || ''),
			sound_path: String(fd.get('sound_path') || ''),
			repeat: Number(fd.get('repeat') || 2)
		};
		const res = await api(cookies, fetch, `/api/bel/jadwal/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (res?.error) return fail(400, { ok: false, error: res.error });
		if (!res?.ok) return fail(400, { ok: false, error: 'Gagal menyimpan perubahan.' });
		return { ok: true, pesan: `Jadwal ${body.hari} ${body.jam} diperbarui.` };
	},

	toggle: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id'));
		const aktif = Number(fd.get('aktif'));
		const res = await api(cookies, fetch, `/api/bel/jadwal/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ aktif })
		});
		if (res?.error) return fail(404, { ok: false, error: res.error });
		if (!res?.ok) return fail(400, { ok: false, error: 'Gagal mengubah jadwal.' });
		return { ok: true, pesan: `Jadwal ${aktif ? 'diaktifkan' : 'dinonaktifkan'}.` };
	},

	// Hapus jadwal
	delete: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id'));
		const res = await api(cookies, fetch, `/api/bel/jadwal/${id}`, { method: 'DELETE' });
		if (res?.error) return fail(404, { ok: false, error: res.error });
		if (!res.ok) return fail(400, { ok: false, error: 'Gagal menghapus jadwal.' });
		return { ok: true, pesan: 'Jadwal dihapus.' };
	}
};
