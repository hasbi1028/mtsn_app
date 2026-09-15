import * as v from 'valibot';

export const galeriListSchema = v.object({
	q: v.optional(v.string(), ''),
	kategori: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20),
	mine: v.optional(v.number())
});

export type GaleriListInput = v.InferOutput<typeof galeriListSchema>;

export const galeriCreateSchema = v.object({
	judul: v.pipe(v.string(), v.nonEmpty()),
	deskripsi: v.optional(v.string()),
	gambar: v.pipe(v.string(), v.nonEmpty()),
	kategori: v.optional(v.string(), 'kegiatan'),
	published: v.optional(v.boolean(), true)
});

export type GaleriCreateInput = v.InferOutput<typeof galeriCreateSchema>;

export const galeriUpdateSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	judul: v.optional(v.string()),
	deskripsi: v.optional(v.string()),
	gambar: v.optional(v.string()),
	kategori: v.optional(v.string()),
	published: v.optional(v.boolean())
});

export type GaleriUpdateInput = v.InferOutput<typeof galeriUpdateSchema>;
