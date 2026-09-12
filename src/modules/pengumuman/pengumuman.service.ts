import { db } from '$lib/server/db';
import { pengumuman } from '$lib/server/db/schema';
import { eq, desc, like, count, sql, and } from 'drizzle-orm';
import type { PengumumanListInput, PengumumanCreateInput } from './pengumuman.validation';

export function getPengumumanList({ q, page, perPage }: PengumumanListInput) {
	const conditions = [eq(pengumuman.published, true)];
	if (q) {
		conditions.push(sql`(${pengumuman.judul} LIKE ${'%' + q + '%'} OR ${pengumuman.konten} LIKE ${'%' + q + '%'})`);
	}
	const where = and(...conditions);

	const total = db.select({ count: count() }).from(pengumuman).where(where).get();
	const items = db
		.select()
		.from(pengumuman)
		.where(where)
		.orderBy(desc(pengumuman.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getAllPengumumanList({ q, page, perPage }: PengumumanListInput) {
	let where = undefined;
	if (q) {
		where = sql`(${pengumuman.judul} LIKE ${'%' + q + '%'} OR ${pengumuman.konten} LIKE ${'%' + q + '%'})`;
	}

	const total = db.select({ count: count() }).from(pengumuman).where(where).get();
	const items = db
		.select()
		.from(pengumuman)
		.where(where)
		.orderBy(desc(pengumuman.createdAt))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getPengumumanById(id: number) {
	return db.select().from(pengumuman).where(eq(pengumuman.id, id)).get() ?? null;
}

export function createPengumuman(data: PengumumanCreateInput) {
	const publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	const result = db.insert(pengumuman).values({ ...data, publishedAt }).run();
	return { id: Number(result.lastInsertRowid) };
}

export function updatePengumuman(id: number, data: Partial<PengumumanCreateInput>) {
	const updateData: Record<string, unknown> = { ...data };
	if (data.published !== undefined) {
		updateData.publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	}
	db.update(pengumuman).set(updateData).where(eq(pengumuman.id, id)).run();
}

export function deletePengumuman(id: number) {
	db.delete(pengumuman).where(eq(pengumuman.id, id)).run();
}

export function togglePengumumanPublish(id: number) {
	const item = db.select({ published: pengumuman.published }).from(pengumuman).where(eq(pengumuman.id, id)).get();
	if (!item) return;
	const newStatus = !item.published;
	db.update(pengumuman)
		.set({
			published: newStatus,
			publishedAt: newStatus ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
		})
		.where(eq(pengumuman.id, id))
		.run();
}
