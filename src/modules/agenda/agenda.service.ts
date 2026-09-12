import { db } from '$lib/server/db';
import { agenda } from '$lib/server/db/schema';
import { eq, desc, like, count, sql, and, gte, lte } from 'drizzle-orm';
import type { AgendaListInput, AgendaCreateInput } from './agenda.validation';

export function getAgendaList({ q, page, perPage }: AgendaListInput) {
	let where = undefined;
	if (q) {
		where = sql`(${agenda.judul} LIKE ${'%' + q + '%'} OR ${agenda.deskripsi} LIKE ${'%' + q + '%'})`;
	}

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

export function getAgendaUpcoming() {
	const today = new Date().toISOString().slice(0, 10);
	return db
		.select()
		.from(agenda)
		.where(sql`${agenda.tanggalMulai} >= ${today}`)
		.orderBy(agenda.tanggalMulai)
		.limit(10)
		.all();
}

export function createAgenda(data: AgendaCreateInput) {
	const result = db.insert(agenda).values(data).run();
	return { id: Number(result.lastInsertRowid) };
}

export function updateAgenda(id: number, data: Partial<AgendaCreateInput>) {
	db.update(agenda).set(data).where(eq(agenda.id, id)).run();
}

export function deleteAgenda(id: number) {
	db.delete(agenda).where(eq(agenda.id, id)).run();
}
