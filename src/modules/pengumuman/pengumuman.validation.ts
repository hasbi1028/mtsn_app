import * as v from 'valibot';

export const pengumumanListSchema = v.object({
	q: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20)
});

export type PengumumanListInput = v.InferOutput<typeof pengumumanListSchema>;

export const pengumumanCreateSchema = v.object({
	judul: v.pipe(v.string(), v.nonEmpty()),
	konten: v.pipe(v.string(), v.nonEmpty()),
	penting: v.optional(v.boolean(), false),
	published: v.optional(v.boolean(), false)
});

export type PengumumanCreateInput = v.InferOutput<typeof pengumumanCreateSchema>;

export const pengumumanUpdateSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	judul: v.optional(v.string()),
	konten: v.optional(v.string()),
	penting: v.optional(v.boolean()),
	published: v.optional(v.boolean())
});

export type PengumumanUpdateInput = v.InferOutput<typeof pengumumanUpdateSchema>;
