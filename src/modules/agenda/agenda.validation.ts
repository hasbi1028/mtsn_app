import * as v from 'valibot';

export const agendaListSchema = v.object({
	q: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20),
	mine: v.optional(v.number())
});

export type AgendaListInput = v.InferOutput<typeof agendaListSchema>;

export const agendaCreateSchema = v.object({
	judul: v.pipe(v.string(), v.nonEmpty()),
	deskripsi: v.optional(v.string()),
	tanggalMulai: v.pipe(v.string(), v.nonEmpty()),
	tanggalSelesai: v.optional(v.string()),
	lokasi: v.optional(v.string()),
	warna: v.optional(v.string(), '#3b82f6'),
	published: v.optional(v.boolean(), true)
});

export type AgendaCreateInput = v.InferOutput<typeof agendaCreateSchema>;

export const agendaUpdateSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	judul: v.optional(v.string()),
	deskripsi: v.optional(v.string()),
	tanggalMulai: v.optional(v.string()),
	tanggalSelesai: v.optional(v.string()),
	lokasi: v.optional(v.string()),
	warna: v.optional(v.string()),
	published: v.optional(v.boolean())
});

export type AgendaUpdateInput = v.InferOutput<typeof agendaUpdateSchema>;
