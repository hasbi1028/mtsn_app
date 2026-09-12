import { db } from '$lib/server/db';
import { ptk, siswa, rombel, skmtAjuan, skbkAjuan, skakpt, jtmSemester } from '$lib/server/db/schema';
import { count, eq, sql, and, isNull, or } from 'drizzle-orm';

/**
 * Dashboard statistics — pure business logic
 * No SvelteKit dependency, no fetch, no HTTP
 */

// ============================================
// GENERAL STATS
// ============================================

export function getGeneralStats() {
	const [
		totalPtkRow,
		guruRow,
		sertifikasiRow,
		pendingSkmtRow,
		pendingSkbkRow,
		pendingSkakptRow,
		totalSiswaRow
	] = db.all(sql`
		SELECT
			(SELECT COUNT(*) FROM ptk) as total_ptk,
			(SELECT COUNT(*) FROM ptk WHERE fungsi = 'Guru') as guru,
			(SELECT COUNT(*) FROM ptk WHERE sertifikasi = 1) as sertifikasi,
			(SELECT COUNT(*) FROM skmt_ajuan WHERE status = 'Menunggu') as pending_skmt,
			(SELECT COUNT(*) FROM skbk_ajuan WHERE status = 'Belum Diajukan') as pending_skbk,
			(SELECT COUNT(*) FROM skakpt WHERE status = 'Menunggu') as pending_skakpt,
			(SELECT COUNT(*) FROM siswa) as total_siswa
	`);

	const totalPtk = (totalPtkRow as any)?.total_ptk ?? 0;
	const sertifikasi = (sertifikasiRow as any)?.sertifikasi ?? 0;

	return {
		totalPtk,
		guru: (guruRow as any)?.guru ?? 0,
		sertifikasi,
		belumSertifikasi: totalPtk - sertifikasi,
		totalSiswa: (totalSiswaRow as any)?.total_siswa ?? 0,
		pendingSkmt: (pendingSkmtRow as any)?.pending_skmt ?? 0,
		pendingSkbk: (pendingSkbkRow as any)?.pending_skbk ?? 0,
		pendingSkakpt: (pendingSkakptRow as any)?.pending_skakpt ?? 0
	};
}

// ============================================
// ROMBEL STATS
// ============================================

export function getRombelStats() {
	const totalRombel = db.select({ count: count() }).from(rombel).where(eq(rombel.aktif, true)).get();
	const totalSiswa = db.select({ count: count() }).from(siswa).get();

	const teralokasi = db
		.select({ count: count() })
		.from(siswa)
		.where(sql`${siswa.rombel} IS NOT NULL AND ${siswa.rombel} != ''`)
		.get();

	const tanpaRombel = (totalSiswa?.count ?? 0) - (teralokasi?.count ?? 0);

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
	const [
		totalSiswaRow,
		belumCekRow,
		layakPkhRow,
		layakSembakoRow,
		layakPbijkRow,
		desilRows,
		kelasRows
	] = db.all(sql`
		SELECT
			(SELECT COUNT(*) FROM siswa) as total_siswa,
			(SELECT COUNT(*) FROM siswa WHERE bansos_cek_at IS NULL OR bansos_cek_at = '') as belum_cek,
			(SELECT COUNT(*) FROM siswa WHERE bansos_pkh = 'LAYAK') as layak_pkh,
			(SELECT COUNT(*) FROM siswa WHERE bansos_sembako = 'AKTIF') as layak_sembako,
			(SELECT COUNT(*) FROM siswa WHERE bansos_pbijk = 'LAYAK') as layak_pbijk,
			(SELECT bansos_desil, COUNT(*) as cnt FROM siswa GROUP BY bansos_desil) as desil_data,
			(SELECT kelas, COUNT(*) as cnt FROM siswa GROUP BY kelas) as kelas_data
	`);

	const total = (totalSiswaRow as any)?.total_siswa ?? 0;
	const bc = (belumCekRow as any)?.belum_cek ?? 0;

	const desilDist: Record<string, number> = {};
	let belumDesil = 0;
	let tidakDitemukan = 0;

	for (const row of (desilRows as any)?.desil_data ?? []) {
		const key = row.bansos_desil || 'Belum Dicek';
		const num = parseInt(key);
		if (num >= 1 && num <= 10) {
			desilDist[key] = row.cnt;
		} else if (key === 'TIDAK DITEMUKAN') {
			tidakDitemukan += row.cnt;
		} else {
			belumDesil += row.cnt;
		}
	}
	if (belumDesil > 0) desilDist['Belum Dicek'] = belumDesil;
	if (tidakDitemukan > 0) desilDist['Tidak Ditemukan'] = tidakDitemukan;

	const kelasDist: Record<string, number> = {};
	for (const row of (kelasRows as any)?.kelas_data ?? []) {
		if (row.kelas) {
			kelasDist[row.kelas] = row.cnt;
		}
	}

	return {
		totalSiswa: total,
		belumCek: bc,
		sudahCek: total - bc,
		layakPkh: (layakPkhRow as any)?.layak_pkh ?? 0,
		layakSembako: (layakSembakoRow as any)?.layak_sembako ?? 0,
		layakPbijk: (layakPbijkRow as any)?.layak_pbijk ?? 0,
		desilDist,
		kelasDist
	};
}
