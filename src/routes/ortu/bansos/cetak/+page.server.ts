import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

const API = process.env.API_BASE || 'http://localhost:3730';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const user = locals.user;
	if (!user || user.role !== 'ortu') {
		error(403, 'Akses ditolak');
	}

	const token = cookies.get('mtsn_session');
	const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

	try {
		const siswaRes = await fetch(`${API}/api/siswa?page=1&per_page=200`, { headers: h });
		if (!siswaRes.ok) error(500, 'Gagal mengambil data siswa');

		const siswaData = await siswaRes.json();
		const rows = siswaData.rows || [];

		// For now, use first siswa as child (same logic as existing ortu/bansos page)
		const child = rows.length > 0 ? rows[0] : null;
		if (!child) error(404, 'Data anak tidak ditemukan');

		return {
			siswa: child,
			ortu: { nama: user.username }
		};
	} catch (e: any) {
		error(500, e.message || 'Terjadi kesalahan');
	}
};
