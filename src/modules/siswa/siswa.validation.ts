import * as v from 'valibot';

/**
 * Schema untuk siswa list query
 */
export const siswaListSchema = v.object({
	q: v.optional(v.string(), ''),
	kelas: v.optional(v.string(), ''),
	nisn: v.optional(v.string(), ''),
	ortu: v.optional(v.string(), ''),
	rombel: v.optional(v.string(), ''),
	status: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20)
});

export type SiswaListInput = v.InferOutput<typeof siswaListSchema>;

/**
 * Schema untuk siswa detail
 */
export const siswaDetailSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty())
});

/**
 * Schema untuk perubahan data
 */
export const perubahanSchema = v.object({
	field: v.pipe(v.string(), v.nonEmpty()),
	nilai_baru: v.pipe(v.string(), v.nonEmpty())
});

export type PerubahanInput = v.InferOutput<typeof perubahanSchema>;
