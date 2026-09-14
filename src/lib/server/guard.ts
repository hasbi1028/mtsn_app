/**
 * Guard role untuk remote function (defense-in-depth).
 *
 * Navigasi halaman dijaga `hooks.server.ts`, tetapi pemanggilan remote function
 * memakai endpoint sendiri (bukan `/admin/*`) sehingga guard hooks tidak berlaku.
 * Karena itu setiap remote read/write WAJIB memanggil salah satu helper di sini.
 */
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import type { UserSession } from '$modules/auth/auth.validation';

export const STAFF_ROLES = ['admin', 'kepsek', 'guru', 'staf'] as const;

export function currentUser(): UserSession | null {
	const { locals } = getRequestEvent();
	return (locals as unknown as { user?: UserSession | null }).user ?? null;
}

/** Pastikan sudah login. */
export function requireUser(): UserSession {
	const user = currentUser();
	if (!user) throw error(401, 'Silakan masuk terlebih dahulu.');
	return user;
}

/** Pastikan login & role termasuk daftar yang diizinkan. */
export function requireRole(...roles: string[]): UserSession {
	const user = requireUser();
	if (!roles.includes(user.role)) {
		throw error(403, 'Anda tidak punya akses ke fitur ini.');
	}
	return user;
}

/** Staf madrasah (admin/kepsek/guru/staf). */
export function requireStaff(): UserSession {
	return requireRole(...STAFF_ROLES);
}

/** Hanya admin. */
export function requireAdmin(): UserSession {
	return requireRole('admin');
}
