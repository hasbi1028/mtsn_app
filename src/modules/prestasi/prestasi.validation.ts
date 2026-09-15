import * as v from 'valibot';

export const prestasiListSchema = v.object({
	q: v.optional(v.string(), ''),
	tingkat: v.optional(v.string(), ''),
	tahun: v.optional(v.number()),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20),
	mine: v.optional(v.number())
});

export type PrestasiListInput = v.InferOutput<typeof prestasiListSchema>;

export const prestasiCreateSchema = v.object({
	judul: v.pipe(v.string(), v.nonEmpty()),
	deskripsi: v.optional(v.string()),
	gambar: v.optional(v.string()),
	pemenang: v.optional(v.string()),
	tingkat: v.optional(v.string(), 'sekolah'),
	tahun: v.optional(v.number()),
	published: v.optional(v.boolean(), true)
});

export type PrestasiCreateInput = v.InferOutput<typeof prestasiCreateSchema>;

export const prestasiUpdateSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	judul: v.optional(v.string()),
	deskripsi: v.optional(v.string()),
	gambar: v.optional(v.string()),
	pemenang: v.optional(v.string()),
	tingkat: v.optional(v.string()),
	tahun: v.optional(v.number()),
	published: v.optional(v.boolean())
});

export type PrestasiUpdateInput = v.InferOutput<typeof prestasiUpdateSchema>;
