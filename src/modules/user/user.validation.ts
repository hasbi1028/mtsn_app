import * as v from 'valibot';

export const createUserSchema = v.object({
	ptkId: v.pipe(v.number(), v.minValue(1)),
	username: v.pipe(v.string(), v.nonEmpty(), v.minLength(3)),
	password: v.pipe(v.string(), v.nonEmpty(), v.minLength(6)),
	role: v.picklist(['admin', 'guru', 'staf', 'siswa', 'orangtua'])
});

export type CreateUserInput = v.InferOutput<typeof createUserSchema>;

export const userIdSchema = v.object({
	userId: v.pipe(v.number(), v.minValue(1))
});

export const toggleUserSchema = v.object({
	userId: v.pipe(v.number(), v.minValue(1)),
	isActive: v.number()
});

export const resetPasswordSchema = v.object({
	userId: v.pipe(v.number(), v.minValue(1))
});
