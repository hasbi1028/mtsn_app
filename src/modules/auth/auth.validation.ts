import * as v from 'valibot';

/**
 * Schema untuk login form
 * Dipakai di: auth.remote.ts (server-side validation)
 */
export const loginSchema = v.object({
	username: v.pipe(v.string(), v.nonEmpty(), v.minLength(3)),
	password: v.pipe(v.string(), v.nonEmpty(), v.minLength(3))
});

export type LoginInput = v.InferOutput<typeof loginSchema>;

/**
 * Schema untuk user session
 * Uses snake_case to match old Go API convention for backward compatibility
 */
export interface UserSession {
	userId: number;
	username: string;
	role: string;
	ref_id: number | null;
	mustChangePassword: number;
}
