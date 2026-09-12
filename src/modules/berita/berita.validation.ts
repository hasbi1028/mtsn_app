import * as v from 'valibot';

export const beritaListSchema = v.object({
	q: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20)
});

export type BeritaListInput = v.InferOutput<typeof beritaListSchema>;

export const beritaSlugSchema = v.object({
	slug: v.pipe(v.string(), v.nonEmpty())
});

export const beritaCreateSchema = v.object({
	judul: v.pipe(v.string(), v.nonEmpty()),
	ringkasan: v.optional(v.string()),
	konten: v.optional(v.string()),
	gambar: v.optional(v.string()),
	penulis: v.optional(v.string(), 'Admin'),
	kategori: v.optional(v.string(), 'umum'),
	published: v.optional(v.boolean(), false)
});

export type BeritaCreateInput = v.InferOutput<typeof beritaCreateSchema>;

export const beritaUpdateSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	judul: v.optional(v.string()),
	ringkasan: v.optional(v.string()),
	konten: v.optional(v.string()),
	gambar: v.optional(v.string()),
	penulis: v.optional(v.string()),
	kategori: v.optional(v.string()),
	published: v.optional(v.boolean())
});

export type BeritaUpdateInput = v.InferOutput<typeof beritaUpdateSchema>;
