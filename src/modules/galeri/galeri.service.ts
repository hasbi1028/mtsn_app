import { db } from '$lib/server/db';
import { galeri } from '$lib/server/db/schema';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import type { GaleriListInput, GaleriCreateInput } from './galeri.validation';

/** Publik: hanya galeri terbit. */
export function getGaleriList({ q, kategori, page, perPage }: GaleriListInput) {
	const conditions = [eq(galeri.published, true)];
	if (q) {
		conditions.push(sql`(${galeri.judul} LIKE ${'%' + q + '%'} OR ${galeri.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	if (kategori) {
		conditions.push(eq(galeri.kategori, kategori));
	}
	const where = and(...conditions);

	const total = db.select({ count: count() }).from(galeri).where(where).get();
	const items = db
		.select()
		.from(galeri)
		.where(where)
		.orderBy(desc(galeri.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

/** Admin: semua galeri (termasuk draft). */
export function getAllGaleriList({ q, kategori, page, perPage, mine }: GaleriListInput) {
	const conditions = [];
	if (q) {
		conditions.push(sql`(${galeri.judul} LIKE ${'%' + q + '%'} OR ${galeri.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	if (kategori) {
		conditions.push(eq(galeri.kategori, kategori));
	}
	if (mine) {
		conditions.push(eq(galeri.authorUserId, mine));
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const total = db.select({ count: count() }).from(galeri).where(where).get();
	const items = db
		.select()
		.from(galeri)
		.where(where)
		.orderBy(desc(galeri.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getGaleriById(id: number) {
	return db.select().from(galeri).where(eq(galeri.id, id)).get() ?? null;
}

export interface Author {
	userId: number | null;
	nama: string;
}

export function createGaleri(data: GaleriCreateInput, author?: Author) {
	const publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	const result = db
		.insert(galeri)
		.values({
			...data,
			publishedAt,
			penulis: author?.nama ?? 'Admin',
			authorUserId: author?.userId ?? null
		})
		.run();
	return { id: Number(result.lastInsertRowid) };
}

export function updateGaleri(id: number, data: Partial<GaleriCreateInput>) {
	const updateData: Record<string, unknown> = { ...data };
	if (data.published !== undefined) {
		updateData.publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	}
	db.update(galeri).set(updateData).where(eq(galeri.id, id)).run();
}

export function deleteGaleri(id: number) {
	db.delete(galeri).where(eq(galeri.id, id)).run();
}

export function toggleGaleriPublish(id: number) {
	const item = db.select({ published: galeri.published }).from(galeri).where(eq(galeri.id, id)).get();
	if (!item) return;
	const newStatus = !item.published;
	db.update(galeri)
		.set({
			published: newStatus,
			publishedAt: newStatus ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
		})
		.where(eq(galeri.id, id))
		.run();
}
