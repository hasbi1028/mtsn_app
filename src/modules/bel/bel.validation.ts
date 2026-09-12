import * as v from 'valibot';

export const belJadwalSchema = v.object({
	hari: v.pipe(v.string(), v.minLength(1)),
	jam: v.pipe(v.string(), v.minLength(1)),
	jenis: v.optional(v.string(), 'khusus'),
	label: v.optional(v.string(), ''),
	sound_path: v.optional(v.string(), ''),
	repeat: v.optional(v.number(), 2)
});
