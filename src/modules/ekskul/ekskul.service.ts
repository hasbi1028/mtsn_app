import { db } from '$lib/server/db';
import { ekskul } from '$lib/server/db/schema';
import { eq, desc, like, count, sql, and } from 'drizzle-orm';
import type { EkskulListInput, EkskulCreateInput } from './ekskul.validation';

function makeSlug(nama: string): string {
	return nama
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

export function getEkskulList({ q, page, perPage }: EkskulListInput) {
	const conditions = [eq(ekskul.aktif, true)];
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

export function getAllEkskulList({ q, page, perPage }: EkskulListInput) {
	let where = undefined;
	if (q) {
		where = sql`(${ekskul.nama} LIKE ${'%' + q + '%'} OR ${ekskul.deskripsi} LIKE ${'%' + q + '%'})`;
	}

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

export function createEkskul(data: EkskulCreateInput) {
	let slug = makeSlug(data.nama);
	const existing = db.select({ slug: ekskul.slug }).from(ekskul).where(eq(ekskul.slug, slug)).get();
	if (existing) {
		slug = slug + '-' + Date.now();
	}
	const result = db.insert(ekskul).values({ ...data, slug }).run();
	return { id: Number(result.lastInsertRowid), slug };
}

export function updateEkskul(id: number, data: Partial<EkskulCreateInput>) {
	db.update(ekskul).set(data).where(eq(ekskul.id, id)).run();
}

export function deleteEkskul(id: number) {
	db.delete(ekskul).where(eq(ekskul.id, id)).run();
}
