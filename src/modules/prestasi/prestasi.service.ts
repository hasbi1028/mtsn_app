import { db } from '$lib/server/db';
import { prestasi } from '$lib/server/db/schema';
import { eq, desc, like, count, sql, and } from 'drizzle-orm';
import type { PrestasiListInput, PrestasiCreateInput } from './prestasi.validation';

export function getPrestasiList({ q, tingkat, tahun, page, perPage }: PrestasiListInput) {
	const conditions = [];
	if (q) {
		conditions.push(sql`(${prestasi.judul} LIKE ${'%' + q + '%'} OR ${prestasi.pemenang} LIKE ${'%' + q + '%'})`);
	}
	if (tingkat) {
		conditions.push(eq(prestasi.tingkat, tingkat));
	}
	if (tahun) {
		conditions.push(eq(prestasi.tahun, tahun));
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const total = db.select({ count: count() }).from(prestasi).where(where).get();
	const items = db
		.select()
		.from(prestasi)
		.where(where)
		.orderBy(desc(prestasi.tahun))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getPrestasiHighlight() {
	return db
		.select()
		.from(prestasi)
		.orderBy(desc(prestasi.tahun))
		.limit(6)
		.all();
}

export function createPrestasi(data: PrestasiCreateInput) {
	const result = db.insert(prestasi).values(data).run();
	return { id: Number(result.lastInsertRowid) };
}

export function updatePrestasi(id: number, data: Partial<PrestasiCreateInput>) {
	db.update(prestasi).set(data).where(eq(prestasi.id, id)).run();
}

export function deletePrestasi(id: number) {
	db.delete(prestasi).where(eq(prestasi.id, id)).run();
}
