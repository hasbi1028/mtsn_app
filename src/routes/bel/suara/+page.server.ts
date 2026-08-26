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
	const res = await fetch(`${API}/api/bel/suara`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	});
	const suara = res.ok ? await res.json() : { files: [] };
	return { suara };
};

export const actions = {
	play: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const file = String(fd.get('file') || '');
		const res = await api(cookies, fetch, '/api/bel/play', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: file, repeat: 1 })
		});
		if (res?.ok) return { ok: true, pesan: `Memutar ${file}...` };
		return fail(409, { ok: false, error: res?.error || 'Gagal memutar (mungkin suara lain sedang berbunyi).' });
	},

	stop: async ({ cookies, fetch }) => {
		const res = await api(cookies, fetch, '/api/bel/stop', { method: 'POST' });
		if (res?.ok) return { ok: true, pesan: 'Pemutaran dihentikan.' };
		return fail(500, { ok: false, error: 'Gagal stop.' });
	},

	upload: async ({ cookies, fetch, request }) => {
		const token = cookies.get('mtsn_session');
		if (!token) return fail(401, { ok: false, error: 'Sesi berakhir' });
		const fd = await request.formData();
		const file = fd.get('file');
		if (!file || typeof file === 'string') {
			return fail(400, { ok: false, error: 'Pilih file terlebih dahulu.' });
		}
		if (file.size > 10 << 20) {
			return fail(400, { ok: false, error: 'Ukuran maksimal 10 MB.' });
		}
		const up = new FormData();
		up.append('file', file, file.name);
		try {
			const res = await fetch(`${API}/api/bel/suara`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: up
			});
			const data = await res.json();
			if (!res.ok || !data.ok) {
				return fail(400, { ok: false, error: data.error || 'Upload gagal.' });
			}
			return { ok: true, pesan: `Suara "${data.name}" terupload.` };
		} catch {
			return fail(400, { ok: false, error: 'Upload gagal — coba lagi.' });
		}
	},

	delete: async ({ cookies, fetch, request }) => {
		const fd = await request.formData();
		const name = String(fd.get('name') || '');
		const res = await api(cookies, fetch, `/api/bel/suara/${encodeURIComponent(name)}`, {
			method: 'DELETE'
		});
		if (res?.error) return fail(409, { ok: false, error: res.error });
		if (!res?.ok) return fail(400, { ok: false, error: 'Gagal menghapus.' });
		return { ok: true, pesan: `Suara "${name}" dihapus.` };
	}
};
