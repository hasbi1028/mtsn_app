import { db } from '$lib/server/db';
import { ptk, jtmSemester, skmtAjuan, skbkAjuan, skakpt, dokumen, roster } from '$lib/server/db/schema';
import { eq, or, like, sql, count, desc, asc } from 'drizzle-orm';
import type { PtkListInput, PtkRow } from './ptk.validation';

/**
 * PTK service — pure business logic
 * No SvelteKit dependency, no fetch, no HTTP
 */

// ============================================
// LIST PTK
// ============================================

// Allowed sort columns
const SORT_COLUMNS: Record<string, any> = {
	nama: ptk.nama,
	nip: ptk.nip,
	nuptk: ptk.nuptk,
	fungsi: ptk.fungsi,
	kepegawaian: ptk.kepegawaian,
	sertifikasi: ptk.sertifikasi,
	waliKelas: ptk.waliKelas,
	jabatanStruktural: ptk.jabatanStruktural,
	kelengkapan: ptk.kelengkapan
};

export function getPtkList(args: PtkListInput) {
	const { q, filter, page, perPage, sortBy, sortDir } = args;
	const offset = (page - 1) * perPage;

	// Build where conditions
	const conditions = [];

	// Search query
	if (q) {
		conditions.push(
			or(
				like(ptk.nama, `%${q}%`),
				like(ptk.nip, `%${q}%`),
				like(ptk.nuptk, `%${q}%`)
			)
		);
	}

	// Filter
	if (filter === 'belum-sertifikasi') {
		conditions.push(eq(ptk.sertifikasi, false));
	} else if (filter === 'wali') {
		conditions.push(sql`${ptk.waliKelas} IS NOT NULL AND ${ptk.waliKelas} != ''`);
	} else if (filter === 'jtm-rendah') {
		// Will be handled in HAVING clause
	}

	// Get total count
	const whereClause = conditions.length > 0 ? sql`${conditions[0]}` : undefined;
	const totalResult = db
		.select({ count: count() })
		.from(ptk)
		.where(whereClause)
		.get();

	// Determine sort column and direction
	const sortCol = SORT_COLUMNS[sortBy] || ptk.nama;
	const orderFn = sortDir === 'desc' ? desc : asc;

	// Get rows with sorting
	const rows = db
		.select()
		.from(ptk)
		.where(whereClause)
		.orderBy(orderFn(sortCol))
		.limit(perPage)
		.offset(offset)
		.all();

	return {
		rows: rows as PtkRow[],
		total: totalResult?.count ?? 0,
		page,
		perPage,
		sortBy,
		sortDir
	};
}

// ============================================
// DETAIL PTK
// ============================================

export function getPtkDetail(publicId: string) {
	// Lookup by public_id
	const p = db.select().from(ptk).where(eq(ptk.publicId, publicId)).get();
	if (!p) return null;
	const ptkId = p.id;

	// Get JTM
	const jtm = db
		.select()
		.from(jtmSemester)
		.where(eq(jtmSemester.ptkId, ptkId))
		.orderBy(desc(jtmSemester.periode))
		.all();

	// Get SKMT
	const skmt = db
		.select()
		.from(skmtAjuan)
		.where(eq(skmtAjuan.ptkId, ptkId))
		.orderBy(desc(skmtAjuan.id))
		.all();

	// Get SKBK
	const skbk = db
		.select()
		.from(skbkAjuan)
		.where(eq(skbkAjuan.ptkId, ptkId))
		.orderBy(desc(skbkAjuan.id))
		.all();

	// Get SKAKPT — parse detail JSON
	const skakptList = db
		.select()
		.from(skakpt)
		.where(eq(skakpt.ptkId, ptkId))
		.orderBy(desc(skakpt.bulan))
		.all()
		.map((row) => ({
			...row,
			detail: row.detail ? JSON.parse(row.detail) : null
		}));

	// Get Documents
	const docs = db
		.select()
		.from(dokumen)
		.where(eq(dokumen.ptkId, ptkId))
		.orderBy(desc(dokumen.uploadedAt))
		.all();

	// Get Roster — match by guru_nama (data uses name text, not guru_kode integer)
	const rosterList = db
		.select()
		.from(roster)
		.where(eq(roster.guruNama, p.nama))
		.all();

	return {
		...p,
		jtm,
		skmt,
		skbk,
		skakpt: skakptList,
		dokumen: docs,
		roster: rosterList
	};
}
