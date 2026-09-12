import { form, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { loginSchema } from './auth.validation';
import {
	validateCredentials,
	createSession,
	deleteSessionByToken,
	getUserFromSession,
	updateLastLogin
} from './auth.service';

/**
 * Login form — thin wrapper
 *
 * Responsibilities:
 * 1. Validate input (via schema)
 * 2. Call service function
 * 3. Set cookie
 * 4. Redirect
 *
 * DOES NOT: hash passwords, query DB directly, etc.
 */
export const login = form(loginSchema, async ({ username, password }) => {
	const { cookies } = getRequestEvent();

	// 1. Validate credentials (service handles DB query + password check)
	const user = validateCredentials(username, password);
	if (!user) {
		return { error: 'Username atau password salah' };
	}

	// 2. Create session (service handles DB insert)
	const token = createSession(user.id);

	// 3. Set cookie
	cookies.set('session_id', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60
	});

	// 4. Update last login (fire and forget)
	updateLastLogin(user.id);

	// 5. Role-based redirect
	const redirectTo = user.role === 'siswa' ? '/siswa/profil' : '/';
	redirect(303, redirectTo);
});

/**
 * Logout form — dipakai pada <form {...logoutForm}>
 *
 * Form (bukan command) karena `redirect()` tidak diizinkan di dalam `command`.
 * Progressive enhancement milik `form()`: tanpa JS tetap berfungsi.
 */
export const logoutForm = form(v.object({}), async () => {
	const { cookies } = getRequestEvent();
	const token = cookies.get('session_id');

	if (token) {
		deleteSessionByToken(token);
	}

	cookies.delete('session_id', { path: '/' });
	cookies.delete('mtsn_session', { path: '/' });

	redirect(303, '/login');
});

/**
 * Get current user query — thin wrapper
 *
 * Auto-deduped: multiple calls with same args = 1 DB query
 */
export const getMe = query(async () => {
	const { cookies } = getRequestEvent();
	const token = cookies.get('session_id');

	if (!token) return null;

	return getUserFromSession(token);
});
