import { fail } from '@sveltejs/kit';
import { getBelJadwal, getBelSuara, createBelJadwal, updateBelJadwal, toggleBelJadwal, deleteBelJadwal } from '$modules/bel/bel.service';

const BEL_API = 'http://localhost:8093';

async function belProxy(method: string, path: string, body?: any) {
	const res = await fetch(`${BEL_API}${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : {},
		body: body ? JSON.stringify(body) : undefined
	});
	return await res.json().catch(() => ({ ok: false, error: 'Bel service offline' }));
}

export const load = async () => {
	const [status, jadwal, suara] = await Promise.all([
		belProxy('GET', '/api/status').catch(() => ({ ok: false, offline: true })),
		Promise.resolve(getBelJadwal()),
		Promise.resolve(getBelSuara())
	]);
	return { status, jadwal, suara };
};

export const actions = {
	stop: async () => {
		const res = await belProxy('POST', '/api/stop');
		if (res?.ok) return { ok: true, pesan: 'Pemutaran dihentikan.' };
		return res;
	},

	play: async ({ request }) => {
		const fd = await request.formData();
		const file = String(fd.get('file') || '');
		const res = await belProxy('POST', '/api/play', { path: file, repeat: 1 });
		if (res?.ok) return { ok: true, pesan: `Memutar ${file}...` };
		if (res?.error) return fail(409, { ok: false, error: res.error });
		return fail(400, { ok: false, error: 'Gagal memutar suara.' });
	},

	master: async ({ request }) => {
		const fd = await request.formData();
		const confirm = String(fd.get('confirm') || '').toUpperCase().trim();
		const target = String(fd.get('target')) === '1' ? 'AKTIF' : 'NONAKTIF';
		if (confirm !== target) {
			return fail(400, { ok: false, error: `Ketik "${target}" untuk konfirmasi.` });
		}
		const enabled = target === 'AKTIF';
		const res = await belProxy('POST', '/api/master', { enabled });
		if (res?.ok) return { ok: true, pesan: `Bel sekarang ${enabled ? 'AKTIF' : 'NONAKTIF (mode darurat)'}.` };
		return fail(500, { ok: false, error: 'Gagal mengubah master switch.' });
	},

	create: async ({ request }) => {
		const fd = await request.formData();
		const data = {
			hari: String(fd.get('hari') || ''),
			jam: String(fd.get('jam') || ''),
			jenis: String(fd.get('jenis') || 'khusus'),
			label: String(fd.get('label') || ''),
			sound_path: String(fd.get('sound_path') || ''),
			repeat: Number(fd.get('repeat') || 2)
		};
		createBelJadwal(data);
		return { ok: true, pesan: `Jadwal ${data.hari} ${data.jam} ditambahkan.` };
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') || '');
		const data = {
			hari: String(fd.get('hari') || ''),
			jam: String(fd.get('jam') || ''),
			jenis: String(fd.get('jenis') || 'khusus'),
			label: String(fd.get('label') || ''),
			sound_path: String(fd.get('sound_path') || ''),
			repeat: Number(fd.get('repeat') || 2)
		};
		updateBelJadwal(id, data);
		return { ok: true, pesan: `Jadwal ${data.hari} ${data.jam} diperbarui.` };
	},

	toggle: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id'));
		const aktif = Number(fd.get('aktif'));
		toggleBelJadwal(id, aktif);
		return { ok: true, pesan: `Jadwal ${aktif ? 'diaktifkan' : 'dinonaktifkan'}.` };
	},

	delete: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id'));
		deleteBelJadwal(id);
		return { ok: true, pesan: 'Jadwal dihapus.' };
	}
};
