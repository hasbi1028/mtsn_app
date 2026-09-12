import { db } from '$lib/server/db';
import { galeri } from '$lib/server/db/schema';
import { eq, desc, like, count, sql, and } from 'drizzle-orm';
import type { GaleriListInput, GaleriCreateInput } from './galeri.validation';

export function getGaleriList({ q, kategori, page, perPage }: GaleriListInput) {
	const conditions = [];
	if (q) {
		conditions.push(sql`(${galeri.judul} LIKE ${'%' + q + '%'} OR ${galeri.deskripsi} LIKE ${'%' + q + '%'})`);
	}
	if (kategori) {
		conditions.push(eq(galeri.kategori, kategori));
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

export function createGaleri(data: GaleriCreateInput) {
	const result = db.insert(galeri).values(data).run();
	return { id: Number(result.lastInsertRowid) };
}

export function updateGaleri(id: number, data: Partial<GaleriCreateInput>) {
	db.update(galeri).set(data).where(eq(galeri.id, id)).run();
}

export function deleteGaleri(id: number) {
	db.delete(galeri).where(eq(galeri.id, id)).run();
}
