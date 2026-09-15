import { db } from '$lib/server/db';
import { prestasi } from '$lib/server/db/schema';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import type { PrestasiListInput, PrestasiCreateInput } from './prestasi.validation';

/** Publik: hanya prestasi terbit. */
export function getPrestasiList({ q, tingkat, tahun, page, perPage }: PrestasiListInput) {
	const conditions = [eq(prestasi.published, true)];
	if (q) {
		conditions.push(sql`(${prestasi.judul} LIKE ${'%' + q + '%'} OR ${prestasi.pemenang} LIKE ${'%' + q + '%'})`);
	}
	if (tingkat) {
		conditions.push(eq(prestasi.tingkat, tingkat));
	}
	if (tahun) {
		conditions.push(eq(prestasi.tahun, tahun));
	}
	const where = and(...conditions);

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

/** Admin: semua prestasi (termasuk draft). */
export function getAllPrestasiList({ q, tingkat, tahun, page, perPage, mine }: PrestasiListInput) {
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
	if (mine) {
		conditions.push(eq(prestasi.authorUserId, mine));
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
		.where(eq(prestasi.published, true))
		.orderBy(desc(prestasi.tahun))
		.limit(6)
		.all();
}

export function getPrestasiById(id: number) {
	return db.select().from(prestasi).where(eq(prestasi.id, id)).get() ?? null;
}

export interface Author {
	userId: number | null;
	nama: string;
}

export function createPrestasi(data: PrestasiCreateInput, author?: Author) {
	const publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	const result = db
		.insert(prestasi)
		.values({
			...data,
			publishedAt,
			penulis: author?.nama ?? 'Admin',
			authorUserId: author?.userId ?? null
		})
		.run();
	return { id: Number(result.lastInsertRowid) };
}

export function updatePrestasi(id: number, data: Partial<PrestasiCreateInput>) {
	const updateData: Record<string, unknown> = { ...data };
	if (data.published !== undefined) {
		updateData.publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	}
	db.update(prestasi).set(updateData).where(eq(prestasi.id, id)).run();
}

export function deletePrestasi(id: number) {
	db.delete(prestasi).where(eq(prestasi.id, id)).run();
}

export function togglePrestasiPublish(id: number) {
	const item = db.select({ published: prestasi.published }).from(prestasi).where(eq(prestasi.id, id)).get();
	if (!item) return;
	const newStatus = !item.published;
	db.update(prestasi)
		.set({
			published: newStatus,
			publishedAt: newStatus ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
		})
		.where(eq(prestasi.id, id))
		.run();
}
