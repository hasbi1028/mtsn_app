import { db } from '$lib/server/db';
import { ptk, siswa, rombel, skmtAjuan, skbkAjuan, skakpt, jtmSemester } from '$lib/server/db/schema';
import { count, eq, sql } from 'drizzle-orm';

/**
 * Dashboard statistics — pure business logic
 * No SvelteKit dependency, no fetch, no HTTP
 */

// ============================================
// GENERAL STATS
// ============================================

export function getGeneralStats() {
	const totalPtk = db.select({ count: count() }).from(ptk).get();
	const guru = db.select({ count: count() }).from(ptk).where(eq(ptk.fungsi, 'Guru')).get();
	const sertifikasi = db.select({ count: count() }).from(ptk).where(eq(ptk.sertifikasi, true)).get();
	const belumSertifikasi = (totalPtk?.count ?? 0) - (sertifikasi?.count ?? 0);

	const totalSiswa = db.select({ count: count() }).from(siswa).get();

	const pendingSkmt = db.select({ count: count() }).from(skmtAjuan).where(eq(skmtAjuan.status, 'Menunggu')).get();
	const pendingSkbk = db.select({ count: count() }).from(skbkAjuan).where(eq(skbkAjuan.status, 'Belum Diajukan')).get();
	const pendingSkakpt = db.select({ count: count() }).from(skakpt).where(eq(skakpt.status, 'Menunggu')).get();

	return {
		totalPtk: totalPtk?.count ?? 0,
		guru: guru?.count ?? 0,
		sertifikasi: sertifikasi?.count ?? 0,
		belumSertifikasi,
		totalSiswa: totalSiswa?.count ?? 0,
		pendingSkmt: pendingSkmt?.count ?? 0,
		pendingSkbk: pendingSkbk?.count ?? 0,
		pendingSkakpt: pendingSkakpt?.count ?? 0
	};
}

// ============================================
// ROMBEL STATS
// ============================================

export function getRombelStats() {
	const totalRombel = db.select({ count: count() }).from(rombel).where(eq(rombel.aktif, true)).get();
	const totalSiswa = db.select({ count: count() }).from(siswa).get();

	// Count siswa with rombel assigned
	const teralokasi = db
		.select({ count: count() })
		.from(siswa)
		.where(sql`${siswa.rombel} IS NOT NULL AND ${siswa.rombel} != ''`)
		.get();

	const tanpaRombel = (totalSiswa?.count ?? 0) - (teralokasi?.count ?? 0);

	// Per kelas breakdown
	const perKelas = db
		.select({
			kelas: siswa.kelas,
			count: count()
		})
		.from(siswa)
		.groupBy(siswa.kelas)
		.all();

	const perKelasMap: Record<string, number> = {};
	for (const row of perKelas) {
		if (row.kelas) {
			perKelasMap[row.kelas] = row.count;
		}
	}

	return {
		totalRombel: totalRombel?.count ?? 0,
		totalSiswa: totalSiswa?.count ?? 0,
		teralokasi: teralokasi?.count ?? 0,
		tanpaRombel,
		perKelas: perKelasMap
	};
}

// ============================================
// BANSOS STATS
// ============================================

export function getBansosStats() {
	const totalSiswa = db.select({ count: count() }).from(siswa).get();

	// Belum dicek
	const belumCek = db
		.select({ count: count() })
		.from(siswa)
		.where(sql`${siswa.bansosCekAt} IS NULL OR ${siswa.bansosCekAt} = ''`)
		.get();

	// Layak PKH
	const layakPkh = db
		.select({ count: count() })
		.from(siswa)
		.where(eq(siswa.bansosPkh, 'LAYAK'))
		.get();

	// Sembako aktif
	const layakSembako = db
		.select({ count: count() })
		.from(siswa)
		.where(eq(siswa.bansosSembako, 'AKTIF'))
		.get();

	// PBI JK
	const layakPbijk = db
		.select({ count: count() })
		.from(siswa)
		.where(eq(siswa.bansosPbijk, 'LAYAK'))
		.get();

	// Desil distribution
	const desilRows = db
		.select({
			desil: siswa.bansosDesil,
			count: count()
		})
		.from(siswa)
		.groupBy(siswa.bansosDesil)
		.all();

	const desilDist: Record<string, number> = {};
	let belumDesil = 0;
	let tidakDitemukan = 0;

	for (const row of desilRows) {
		const key = row.desil || 'Belum Dicek';
		const num = parseInt(key);
		if (num >= 1 && num <= 10) {
			desilDist[key] = row.count;
		} else if (key === 'TIDAK DITEMUKAN') {
			tidakDitemukan += row.count;
		} else {
			belumDesil += row.count;
		}
	}
	if (belumDesil > 0) desilDist['Belum Dicek'] = belumDesil;
	if (tidakDitemukan > 0) desilDist['Tidak Ditemukan'] = tidakDitemukan;

	// Kelas breakdown
	const kelasRows = db
		.select({
			kelas: siswa.kelas,
			count: count()
		})
		.from(siswa)
		.groupBy(siswa.kelas)
		.all();

	const kelasDist: Record<string, number> = {};
	for (const row of kelasRows) {
		if (row.kelas) {
			kelasDist[row.kelas] = row.count;
		}
	}

	const total = totalSiswa?.count ?? 0;
	const bc = belumCek?.count ?? 0;

	return {
		totalSiswa: total,
		belumCek: bc,
		sudahCek: total - bc,
		layakPkh: layakPkh?.count ?? 0,
		layakSembako: layakSembako?.count ?? 0,
		layakPbijk: layakPbijk?.count ?? 0,
		desilDist,
		kelasDist
	};
}
