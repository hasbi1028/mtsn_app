import { fail, redirect } from '@sveltejs/kit';
import { validateCredentials, createSession, updateLastLogin } from '$modules/auth/auth.service';

export const actions = {
	default: async ({ cookies, request }) => {
		const fd = await request.formData();
		const username = String(fd.get('username') || '');
		const password = String(fd.get('password') || '');

		if (!username || !password) {
			return fail(400, { error: 'Username dan password wajib diisi' });
		}

		const user = validateCredentials(username, password);
		if (!user) {
			return fail(401, { error: 'Username atau password salah' });
		}

		const token = createSession(user.id);
		cookies.set('session_id', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60
		});
		updateLastLogin(user.id);

		const redirectTo = user.role === 'siswa' ? '/siswa/profil' : '/';
		throw redirect(303, redirectTo);
	}
};
