import { db } from '$lib/server/db';
import { ekskul } from '$lib/server/db/schema';
import { eq, count, sql, and } from 'drizzle-orm';
import type { EkskulListInput, EkskulCreateInput } from './ekskul.validation';

function makeSlug(nama: string): string {
	return nama
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

/** Publik: hanya ekskul aktif & terbit. */
export function getEkskulList({ q, page, perPage }: EkskulListInput) {
	const conditions = [eq(ekskul.aktif, true), eq(ekskul.published, true)];
	if (q) {
		conditions.push(sql`(${ekskul.nama} LIKE ${'%' + q + '%'} OR ${ekskul.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	const where = and(...conditions);

	const total = db.select({ count: count() }).from(ekskul).where(where).get();
	const items = db
		.select()
		.from(ekskul)
		.where(where)
		.orderBy(ekskul.nama)
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

/** Admin: semua ekskul (termasuk draft/nonaktif). */
export function getAllEkskulList({ q, page, perPage, mine }: EkskulListInput) {
	const conditions = [];
	if (q) {
		conditions.push(sql`(${ekskul.nama} LIKE ${'%' + q + '%'} OR ${ekskul.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	if (mine) {
		conditions.push(eq(ekskul.authorUserId, mine));
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const total = db.select({ count: count() }).from(ekskul).where(where).get();
	const items = db
		.select()
		.from(ekskul)
		.where(where)
		.orderBy(ekskul.nama)
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getEkskulBySlug(slug: string) {
	return db.select().from(ekskul).where(eq(ekskul.slug, slug)).get() ?? null;
}

export function getEkskulById(id: number) {
	return db.select().from(ekskul).where(eq(ekskul.id, id)).get() ?? null;
}

export interface Author {
	userId: number | null;
	nama: string;
}

export function createEkskul(data: EkskulCreateInput, author?: Author) {
	let slug = makeSlug(data.nama);
	const existing = db.select({ slug: ekskul.slug }).from(ekskul).where(eq(ekskul.slug, slug)).get();
	if (existing) {
		slug = slug + '-' + Date.now();
	}
	const publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	const result = db
		.insert(ekskul)
		.values({
			...data,
			slug,
			publishedAt,
			penulis: author?.nama ?? 'Admin',
			authorUserId: author?.userId ?? null
		})
		.run();
	return { id: Number(result.lastInsertRowid), slug };
}

export function updateEkskul(id: number, data: Partial<EkskulCreateInput>) {
	const updateData: Record<string, unknown> = { ...data };
	if (data.published !== undefined) {
		updateData.publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	}
	db.update(ekskul).set(updateData).where(eq(ekskul.id, id)).run();
}

export function deleteEkskul(id: number) {
	db.delete(ekskul).where(eq(ekskul.id, id)).run();
}

export function toggleEkskulPublish(id: number) {
	const item = db.select({ published: ekskul.published }).from(ekskul).where(eq(ekskul.id, id)).get();
	if (!item) return;
	const newStatus = !item.published;
	db.update(ekskul)
		.set({
			published: newStatus,
			publishedAt: newStatus ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
		})
		.where(eq(ekskul.id, id))
		.run();
}
