import * as v from 'valibot';

export const createRombelSchema = v.object({
	nama: v.pipe(v.string(), v.minLength(1)),
	kelas: v.pipe(v.number(), v.minValue(7), v.maxValue(9)),
	label: v.pipe(v.string(), v.minLength(1)),
	kapasitas: v.optional(v.pipe(v.number(), v.minValue(1)), 40)
});

export const updateRombelSchema = v.object({
	nama: v.optional(v.string()),
	kapasitas: v.optional(v.pipe(v.number(), v.minValue(1))),
	aktif: v.optional(v.number())
});

export const allocateSiswaSchema = v.object({
	siswa_ids: v.pipe(v.array(v.number()), v.minLength(1))
});

export const setWaliKelasSchema = v.object({
	ptk_id: v.pipe(v.number(), v.minValue(1))
});

export type CreateRombel = v.InferOutput<typeof createRombelSchema>;
export type UpdateRombel = v.InferOutput<typeof updateRombelSchema>;
