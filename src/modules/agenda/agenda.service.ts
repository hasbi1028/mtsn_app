import { db } from '$lib/server/db';
import { agenda } from '$lib/server/db/schema';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import type { AgendaListInput, AgendaCreateInput } from './agenda.validation';

/** Publik: hanya agenda terbit. */
export function getAgendaList({ q, page, perPage }: AgendaListInput) {
	const conditions = [eq(agenda.published, true)];
	if (q) {
		conditions.push(sql`(${agenda.judul} LIKE ${'%' + q + '%'} OR ${agenda.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	const where = and(...conditions);

	const total = db.select({ count: count() }).from(agenda).where(where).get();
	const items = db
		.select()
		.from(agenda)
		.where(where)
		.orderBy(desc(agenda.tanggalMulai))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

/** Admin: semua agenda (termasuk draft), opsi filter milik sendiri. */
export function getAllAgendaList({ q, page, perPage, mine }: AgendaListInput) {
	const conditions = [];
	if (q) {
		conditions.push(sql`(${agenda.judul} LIKE ${'%' + q + '%'} OR ${agenda.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	if (mine) {
		conditions.push(eq(agenda.authorUserId, mine));
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const total = db.select({ count: count() }).from(agenda).where(where).get();
	const items = db
		.select()
		.from(agenda)
		.where(where)
		.orderBy(desc(agenda.tanggalMulai))
		.limit(perPage)
		.offset((page - 1) * perPage)
		.all();

	return { items, total: total?.count ?? 0, page, perPage };
}

export function getAgendaById(id: number) {
	return db.select().from(agenda).where(eq(agenda.id, id)).get() ?? null;
}

export function getAgendaUpcoming() {
	const today = new Date().toISOString().slice(0, 10);
	return db
		.select()
		.from(agenda)
		.where(and(eq(agenda.published, true), sql`${agenda.tanggalMulai} >= ${today}`))
		.orderBy(agenda.tanggalMulai)
		.limit(10)
		.all();
}

export interface Author {
	userId: number | null;
	nama: string;
}

export function createAgenda(data: AgendaCreateInput, author?: Author) {
	const publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	const result = db
		.insert(agenda)
		.values({
			...data,
			publishedAt,
			penulis: author?.nama ?? 'Admin',
			authorUserId: author?.userId ?? null
		})
		.run();
	return { id: Number(result.lastInsertRowid) };
}

export function updateAgenda(id: number, data: Partial<AgendaCreateInput>) {
	const updateData: Record<string, unknown> = { ...data };
	if (data.published !== undefined) {
		updateData.publishedAt = data.published ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
	}
	db.update(agenda).set(updateData).where(eq(agenda.id, id)).run();
}

export function deleteAgenda(id: number) {
	db.delete(agenda).where(eq(agenda.id, id)).run();
}

export function toggleAgendaPublish(id: number) {
	const item = db.select({ published: agenda.published }).from(agenda).where(eq(agenda.id, id)).get();
	if (!item) return;
	const newStatus = !item.published;
	db.update(agenda)
		.set({
			published: newStatus,
			publishedAt: newStatus ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
		})
		.where(eq(agenda.id, id))
		.run();
}
