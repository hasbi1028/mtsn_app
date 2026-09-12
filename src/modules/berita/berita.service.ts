import { db } from '$lib/server/db';
import { berita } from '$lib/server/db/schema';
import { eq, desc, asc, like, count, sql, and } from 'drizzle-orm';
import type { BeritaListInput, BeritaCreateInput } from './berita.validation';

function makeSlug(judul: string): string {
	return judul
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

export function getBeritaList({ q, page, perPage }: BeritaListInput) {
	const conditions = [eq(berita.published, true)];
	if (q) {
		conditions.push(sql`(${berita.judul} LIKE ${'%' + q + '%'} OR ${berita.ringkasan} LIKE ${'%' + q + '%'})`);
	}
	const where = and(...conditions);

	const total = db.select({ count: count() }).from(berita).where(where).get();
	const items = db
		.select()
		.from(berita)
		.where(where)
		.orderBy(desc(berita.publishedAt))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getBeritaBySlug(slug: string) {
	return db.select().from(berita).where(eq(berita.slug, slug)).get() ?? null;
}

export function getAllBeritaList({ q, page, perPage }: BeritaListInput) {
	let where = undefined;
	if (q) {
		where = sql`(${berita.judul} LIKE ${'%' + q + '%'} OR ${berita.ringkasan} LIKE ${'%' + q + '%'})`;
	}

	const total = db.select({ count: count() }).from(berita).where(where).get();
	const items = db
		.select()
		.from(berita)
		.where(where)
		.orderBy(desc(berita.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function createBerita(data: BeritaCreateInput) {
	let slug = makeSlug(data.judul);
	const existing = db.select({ slug: berita.slug }).from(berita).where(eq(berita.slug, slug)).get();
	if (existing) {
		slug = slug + '-' + Date.now();
	}
	const publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	const result = db.insert(berita).values({ ...data, slug, publishedAt }).run();
	return { id: Number(result.lastInsertRowid), slug };
}

export function updateBerita(id: number, data: Partial<BeritaCreateInput>) {
	const updateData: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
	if (data.published) {
		updateData.publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
	}
	db.update(berita).set(updateData).where(eq(berita.id, id)).run();
}

export function deleteBerita(id: number) {
	db.delete(berita).where(eq(berita.id, id)).run();
}

export function toggleBeritaPublish(id: number) {
	const item = db.select({ published: berita.published }).from(berita).where(eq(berita.id, id)).get();
	if (!item) return;
	const newStatus = !item.published;
	db.update(berita)
		.set({
			published: newStatus,
			publishedAt: newStatus ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
		})
		.where(eq(berita.id, id))
		.run();
}
