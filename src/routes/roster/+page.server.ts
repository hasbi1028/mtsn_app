const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies, url }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};
	const kelas = url.searchParams.get('kelas') || 'IXA';
	const res = await fetch(`${API}/api/roster?kelas=${encodeURIComponent(kelas)}`, { headers: h });
	const data = res.ok ? await res.json() : { rows: [], daftarKelas: [], kelas };
	return { rows: data.rows || [], kelas: data.kelas, daftarKelas: data.daftarKelas || [] };
};
