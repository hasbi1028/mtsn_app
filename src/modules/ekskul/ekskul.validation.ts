import * as v from 'valibot';

export const ekskulListSchema = v.object({
	q: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20),
	mine: v.optional(v.number())
});

export type EkskulListInput = v.InferOutput<typeof ekskulListSchema>;

export const ekskulSlugSchema = v.object({
	slug: v.pipe(v.string(), v.nonEmpty())
});

export const ekskulCreateSchema = v.object({
	nama: v.pipe(v.string(), v.nonEmpty()),
	deskripsi: v.optional(v.string()),
	gambar: v.optional(v.string()),
	pembina: v.optional(v.string()),
	jadwal: v.optional(v.string()),
	aktif: v.optional(v.boolean(), true),
	published: v.optional(v.boolean(), true)
});

export type EkskulCreateInput = v.InferOutput<typeof ekskulCreateSchema>;

export const ekskulUpdateSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	nama: v.optional(v.string()),
	deskripsi: v.optional(v.string()),
	gambar: v.optional(v.string()),
	pembina: v.optional(v.string()),
	jadwal: v.optional(v.string()),
	aktif: v.optional(v.boolean()),
	published: v.optional(v.boolean())
});

export type EkskulUpdateInput = v.InferOutput<typeof ekskulUpdateSchema>;
