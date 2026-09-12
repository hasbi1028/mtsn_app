import { db } from '$lib/server/db';
import { siswa, perubahanSiswa, ortu, siswaOrtu } from '$lib/server/db/schema';
import { eq, or, like, sql, count, and, isNull } from 'drizzle-orm';
import type { SiswaListInput } from './siswa.validation';

/**
 * Siswa service — pure business logic
 */

// ============================================
// LIST SISWA
// ============================================

export function getSiswaList(args: SiswaListInput) {
	const { q, kelas, nisn, ortu: ortuFilter, rombel, status, page, perPage } = args;
	const offset = (page - 1) * perPage;

	const conditions = [];

	if (q) {
		conditions.push(
			or(
				like(siswa.nama, `%${q}%`),
				like(siswa.nis, `%${q}%`),
				like(siswa.nisn, `%${q}%`)
			)
		);
	}
	if (kelas) conditions.push(eq(siswa.kelas, kelas));
	if (nisn) conditions.push(eq(siswa.nisn, nisn));
	if (rombel) conditions.push(eq(siswa.rombel, rombel));
	if (status === 'tanpa_rombel') {
		conditions.push(sql`(${siswa.rombel} IS NULL OR ${siswa.rombel} = '')`);
	} else if (status === 'aktif') {
		conditions.push(sql`${siswa.statusEmis} = 'AKTIF'`);
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const totalResult = db
		.select({ count: count() })
		.from(siswa)
		.where(whereClause)
		.get();

	const rows = db
		.select()
		.from(siswa)
		.where(whereClause)
		.limit(perPage)
		.offset(offset)
		.all();

	return {
		rows,
		total: totalResult?.count ?? 0,
		page,
		perPage
	};
}

// ============================================
// DETAIL SISWA
// ============================================

export function getSiswaDetail(id: string) {
	const siswaId = parseInt(id, 10);
	if (isNaN(siswaId)) return null;

	return db.select().from(siswa).where(eq(siswa.id, siswaId)).get() ?? null;
}

// ============================================
// MY PROFILE (siswa self-service)
// ============================================

export function getMyProfile(userId: number) {
	// Get user's ref_id to find siswa record
	const user = db
		.select({ refId: sql<number>`ref_id` })
		.from(sql`users`)
		.where(eq(sql`id`, userId))
		.get();

	if (!user?.refId) return null;

	return db.select().from(siswa).where(eq(siswa.id, user.refId)).get() ?? null;
}

// ============================================
// SISWA ME (from session)
// ============================================

export function getSiswaByRefId(refId: number) {
	return db.select().from(siswa).where(eq(siswa.id, refId)).get() ?? null;
}

// ============================================
// BANSOS DETAIL
// ============================================

export function getSiswaBansos(id: string) {
	const siswaId = parseInt(id, 10);
	if (isNaN(siswaId)) return null;

	const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get();
	if (!s) return null;

	// Interpret bansos data
	const bansos = {
		desil: s.bansosDesil,
		pkh: s.bansosPkh === 'LAYAK',
		sembako: s.bansosSembako === 'AKTIF',
		pbijk: s.bansosPbijk === 'LAYAK',
		kpd: s.bansosKpd,
		cekAt: s.bansosCekAt
	};

	return { ...s, bansosInterpretasi: bansos };
}

// ============================================
// SUBMIT PERUBAHAN
// ============================================

export function submitPerubahan(siswaId: number, field: string, nilaiBaru: string) {
	// Check for existing pending request
	const existing = db
		.select()
		.from(perubahanSiswa)
		.where(
			and(
				eq(perubahanSiswa.siswaId, siswaId),
				eq(perubahanSiswa.field, field),
				eq(perubahanSiswa.status, 'pending')
			)
		)
		.get();

	if (existing) {
		return { error: 'Sudah ada permintaan perubahan yang pending untuk field ini' };
	}

	// Get current value
	const s = db.select().from(siswa).where(eq(siswa.id, siswaId)).get();
	const nilaiLama = s ? String(s[field as keyof typeof s] ?? '') : '';

	// Insert perubahan
	db.insert(perubahanSiswa)
		.values({
			siswaId,
			field,
			nilaiLama,
			nilaiBaru,
			status: 'pending',
			diajukanBy: 'siswa'
		})
		.run();

	return { success: true };
}

// ============================================
// KARTU LIST
// ============================================

export function getKartuList() {
	return db
		.select({
			id: siswa.id,
			nama: siswa.nama,
			nis: siswa.nis,
			nisn: siswa.nisn,
			kelas: siswa.kelas,
			rombel: siswa.rombel,
			fotoPath: siswa.fotoPath
		})
		.from(siswa)
		.where(
			and(
				or(eq(siswa.statusEmis, 'AKTIF'), eq(siswa.statusEmis, 'Aktif'), isNull(siswa.statusEmis)),
				sql`${siswa.fotoPath} IS NOT NULL AND ${siswa.fotoPath} != ''`
			)
		)
		.all();
}

// ============================================
// REKAP (Class Summary)
// ============================================

export function getRekap() {
	const rows = db
		.select({
			kelas: siswa.kelas,
			jk: siswa.jk,
			count: count()
		})
		.from(siswa)
		.groupBy(siswa.kelas, siswa.jk)
		.all();

	// Group by kelas
	const kelasMap: Record<string, { kelas: string; total: number; l: number; p: number }> = {};
	for (const row of rows) {
		const k = row.kelas || 'Tanpa Kelas';
		if (!kelasMap[k]) {
			kelasMap[k] = { kelas: k, total: 0, l: 0, p: 0 };
		}
		kelasMap[k].total += row.count;
		if (row.jk === 'L') kelasMap[k].l += row.count;
		if (row.jk === 'P') kelasMap[k].p += row.count;
	}

	return Object.values(kelasMap).sort((a, b) => a.kelas.localeCompare(b.kelas));
}

// ============================================
// ORTU INFO
// ============================================

export function getOrtuInfo(refId: number) {
	const siswaRecord = db.select().from(siswa).where(eq(siswa.id, refId)).get();
	if (!siswaRecord) return null;

	// Get ortu via siswa_ortu relation
	const ortuList = db
		.select({
			nama: ortu.nama,
			nik: ortu.nik,
			noHp: ortu.noHp,
			pekerjaan: ortu.pekerjaan
		})
		.from(siswaOrtu)
		.innerJoin(ortu, eq(siswaOrtu.ortuId, ortu.id))
		.where(eq(siswaOrtu.siswaId, refId))
		.all();

	return { siswa: siswaRecord, ortu: ortuList };
}
