import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const BEL_API = env.BEL_API || 'http://127.0.0.1:8093';

async function belFetch(path: string, opts: RequestInit = {}) {
	const res = await fetch(`${BEL_API}${path}`, opts);
	return res.json();
}

export const load = async () => {
	const suara = await belFetch('/api/suara').catch(() => ({ files: [] }));
	return { suara };
};

export const actions = {
	play: async ({ request }) => {
		const fd = await request.formData();
		const file = String(fd.get('file') || '');
		const res = await belFetch('/api/play', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: file, repeat: 1 })
		});
		if (res?.ok) return { ok: true, pesan: `Memutar ${file}...` };
		return fail(409, { ok: false, error: res?.error || 'Gagal memutar (mungkin suara lain sedang berbunyi).' });
	},

	stop: async () => {
		const res = await belFetch('/api/stop', { method: 'POST' });
		if (res?.ok) return { ok: true, pesan: 'Pemutaran dihentikan.' };
		return fail(500, { ok: false, error: 'Gagal stop.' });
	},

	upload: async ({ request }) => {
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
			const res = await fetch(`${BEL_API}/api/suara`, {
				method: 'POST',
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

	delete: async ({ request }) => {
		const fd = await request.formData();
		const name = String(fd.get('name') || '');
		const res = await belFetch(`/api/suara/${encodeURIComponent(name)}`, {
			method: 'DELETE'
		});
		if (res?.error) return fail(409, { ok: false, error: res.error });
		if (!res?.ok) return fail(400, { ok: false, error: 'Gagal menghapus.' });
		return { ok: true, pesan: `Suara "${name}" dihapus.` };
	}
};
