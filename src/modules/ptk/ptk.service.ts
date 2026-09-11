import { db } from '$lib/server/db';
import { ptk, jtmSemester, skmtAjuan, skbkAjuan, skakpt, dokumen, roster } from '$lib/server/db/schema';
import { eq, or, like, sql, count, desc } from 'drizzle-orm';
import type { PtkListInput, PtkRow } from './ptk.validation';

/**
 * PTK service — pure business logic
 * No SvelteKit dependency, no fetch, no HTTP
 */

// ============================================
// LIST PTK
// ============================================

export function getPtkList(args: PtkListInput) {
	const { q, filter, page, perPage } = args;
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
	}

	// Get total count
	const whereClause = conditions.length > 0 ? sql`${conditions[0]}` : undefined;
	const totalResult = db
		.select({ count: count() })
		.from(ptk)
		.where(whereClause)
		.get();

	// Get rows
	const rows = db
		.select()
		.from(ptk)
		.where(whereClause)
		.limit(perPage)
		.offset(offset)
		.all();

	return {
		rows: rows as PtkRow[],
		total: totalResult?.count ?? 0,
		page,
		perPage
	};
}

// ============================================
// DETAIL PTK
// ============================================

export function getPtkDetail(id: string) {
	const ptkId = parseInt(id, 10);
	if (isNaN(ptkId)) return null;

	// Get PTK
	const p = db.select().from(ptk).where(eq(ptk.id, ptkId)).get();
	if (!p) return null;

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

	// Get SKAKPT
	const skakptList = db
		.select()
		.from(skakpt)
		.where(eq(skakpt.ptkId, ptkId))
		.orderBy(desc(skakpt.bulan))
		.all();

	// Get Documents
	const docs = db
		.select()
		.from(dokumen)
		.where(eq(dokumen.ptkId, ptkId))
		.orderBy(desc(dokumen.uploadedAt))
		.all();

	// Get Roster
	const rosterList = db
		.select()
		.from(roster)
		.where(eq(roster.guruKode, ptkId))
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
