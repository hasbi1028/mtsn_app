const API = process.env.API_BASE || 'http://localhost:3730';

export const load = async ({ cookies }) => {
	const token = cookies.get('mtsn_session');
	const h = token ? { Authorization: `Bearer ${token}` } : {};

	const [stats, bansosRaw] = await Promise.all([
		fetch(`${API}/api/stats`, { headers: h }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
		fetch(`${API}/api/bansos/stats`, { headers: h }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
	]);

	// Transform bansos stats to frontend format
	const totalSiswa = bansosRaw.total_siswa || 0;
	const belumCek = bansosRaw.belum_cek || 0;
	const sudahCek = totalSiswa - belumCek;
	const layakPkh = bansosRaw.layak_pkh || 0;
	const layakSembako = bansosRaw.sembako_aktif || 0;
	const layakPbijk = bansosRaw.layak_pbi || 0;
	const tenggang90 = bansosRaw.tenggang_90 || 0;

	// Desil distribution (from per_desil) — 2 kategori non-desil: Belum Dicek & Tidak Ditemukan
	const desilDist: Record<string, number> = {};
	let belumDesil = 0;
	let tidakDitemukan = 0;
	if (bansosRaw.per_desil) {
		for (const [k, v] of Object.entries(bansosRaw.per_desil)) {
			const num = parseInt(k);
			if (num >= 1 && num <= 10) {
				desilDist[k] = v as number;
			} else if (k === 'TIDAK DITEMUKAN') {
				tidakDitemukan += (v as number) || 0;
			} else {
				belumDesil += (v as number) || 0;
			}
		}
	}
	if (belumDesil > 0) desilDist['Belum Dicek'] = belumDesil;
	if (tidakDitemukan > 0) desilDist['Tidak Ditemukan'] = tidakDitemukan;

	// Kelas breakdown (from per_kelas)
	const kelasDist: Record<string, number> = {};
	if (bansosRaw.per_kelas) {
		for (const item of bansosRaw.per_kelas) {
			kelasDist[item.category] = item.total;
		}
	}

	return {
		user: { username: 'hasbi' },
		stats,
		bansosStats: {
			totalSiswa,
			sudahCek,
			belumCek,
			desilDist,
			kelasDist,
			layakPkh,
			layakSembako,
			layakPbijk,
			tenggang90
		}
	};
};
