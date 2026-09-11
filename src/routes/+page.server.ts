import { getGeneralStats, getRombelStats, getBansosStats } from '$modules/dashboard/dashboard.service';

export const load = async () => {
	// Direct DB queries — no fetch to Go API
	const [stats, rombelStats, bansosStats] = await Promise.all([
		Promise.resolve(getGeneralStats()),
		Promise.resolve(getRombelStats()),
		Promise.resolve(getBansosStats())
	]);

	return {
		stats,
		rombelStats: {
			totalRombel: rombelStats.totalRombel,
			teralokasi: rombelStats.teralokasi,
			tanpa: rombelStats.tanpaRombel,
			totalSiswa: rombelStats.totalSiswa,
			perKelas: rombelStats.perKelas
		},
		bansosStats: {
			totalSiswa: bansosStats.totalSiswa,
			sudahCek: bansosStats.sudahCek,
			belumCek: bansosStats.belumCek,
			desilDist: bansosStats.desilDist,
			kelasDist: bansosStats.kelasDist,
			layakPkh: bansosStats.layakPkh,
			layakSembako: bansosStats.layakSembako,
			layakPbijk: bansosStats.layakPbijk,
			tenggang90: 0 // TODO: calculate tenggang 90
		}
	};
};
