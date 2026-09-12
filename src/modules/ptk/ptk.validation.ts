import * as v from 'valibot';

/**
 * Schema untuk PTK list query
 */
export const ptkListSchema = v.object({
	q: v.optional(v.string(), ''),
	filter: v.optional(v.string(), ''),
	page: v.optional(v.number(), 1),
	perPage: v.optional(v.number(), 20),
	sortBy: v.optional(v.string(), 'nama'),
	sortDir: v.optional(v.union([v.literal('asc'), v.literal('desc')]), 'asc')
});

export type PtkListInput = v.InferOutput<typeof ptkListSchema>;

/**
 * Schema untuk PTK detail
 */
export const ptkDetailSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty())
});

export type PtkDetailInput = v.InferOutput<typeof ptkDetailSchema>;

/**
 * PTK row type (from DB)
 */
export interface PtkRow {
	id: number;
	publicId: string | null;
	nama: string;
	pegId: string | null;
	nip: string | null;
	nik: string | null;
	nuptk: string | null;
	fungsi: string | null;
	kepegawaian: string | null;
	sertifikasi: boolean | null;
	kelengkapan: number | null;
	aktivasi: boolean | null;
	waliKelas: string | null;
	jabatanStruktural: string | null;
	catatan: string | null;
}
