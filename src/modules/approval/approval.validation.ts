import * as v from 'valibot';

export const approveIdSchema = v.pipe(v.number(), v.minValue(1));
export const rejectPerubahanSchema = v.object({
	id: v.pipe(v.number(), v.minValue(1)),
	catatan: v.optional(v.string(), '')
});
