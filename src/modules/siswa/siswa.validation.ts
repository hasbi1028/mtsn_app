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
 * Schema untuk siswa detail (by ID string)
 */
export const siswaDetailSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty())
});

/**
 * Schema untuk siswa detail (by user ID number)
 */
export const siswaByUserSchema = v.object({
	userId: v.number()
});

/**
 * Schema untuk siswa by ref ID
 */
export const siswaByRefSchema = v.object({
	refId: v.number()
});

/**
 * Schema untuk perubahan data
 */
export const perubahanSchema = v.object({
	siswaId: v.number(),
	field: v.pipe(v.string(), v.nonEmpty()),
	nilai_baru: v.pipe(v.string(), v.nonEmpty())
});

export type PerubahanInput = v.InferOutput<typeof perubahanSchema>;

/**
 * Schema upload foto siswa (self-service) — multipart/form-data
 */
export const fotoSchema = v.object({
	foto: v.pipe(
		v.file('Pilih file foto'),
		v.mimeType(['image/png', 'image/jpeg', 'image/webp'], 'Format tidak didukung (hanya PNG, JPG, WEBP)'),
		v.maxSize(2_000_000, 'Ukuran foto maksimal 2MB')
	)
});

/**
 * Schema upload foto oleh admin/kepsek — butuh id siswa
 */
export const fotoAdminSchema = v.object({
	id: v.number(),
	foto: v.pipe(
		v.file('Pilih file foto'),
		v.mimeType(['image/png', 'image/jpeg', 'image/webp'], 'Format tidak didukung (hanya PNG, JPG, WEBP)'),
		v.maxSize(2_000_000, 'Ukuran foto maksimal 2MB')
	)
});
