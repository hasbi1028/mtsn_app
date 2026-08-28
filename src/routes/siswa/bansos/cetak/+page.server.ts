import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

const API = process.env.API_BASE || 'http://localhost:3730';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'siswa') {
		error(403, 'Akses ditolak');
	}

	const token = cookies.get('mtsn_session');
	const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

	try {
		const res = await fetch(`${API}/api/siswa?page=1&per_page=200`, { headers: h });
		if (!res.ok) error(500, 'Gagal mengambil data siswa');
		const data = await res.json();
		const rows = data.rows || [];
		const found = rows.find((r: any) => r.id === user.ref_id);
		if (!found) error(404, 'Data siswa tidak ditemukan');
		return { siswa: found };
	} catch (e: any) {
		error(500, e.message || 'Terjadi kesalahan');
	}
};
