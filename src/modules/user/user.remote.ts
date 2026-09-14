import { command, form, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import {
	createUser,
	deleteUser,
	listUsers,
	ptkBelumPunyaAkun,
	resetPasswordUser,
	toggleUser
} from './user.service';
import {
	createUserSchema,
	resetPasswordSchema,
	toggleUserSchema,
	type CreateUserInput
} from './user.validation';

interface Aktor {
	username: string;
	role: string;
}

function requireAdmin(): Aktor {
	const { locals } = getRequestEvent();
	const user = (locals as unknown as { user?: Aktor }).user ?? null;
	if (!user) throw error(401, 'Tidak terautentikasi.');
	if (user.role !== 'admin') throw error(403, 'Hanya admin yang bisa mengelola user.');
	return user;
}

function pesanError(e: unknown, fallback: string): string {
	return (e instanceof Error ? e.message : fallback);
}

/* ── Read ────────────────────────────────────────────────── */

export const getUsersQ = query(async () => {
	requireAdmin();
	return listUsers();
});

export const getPtkBelumAkunQ = query(async () => {
	requireAdmin();
	return ptkBelumPunyaAkun();
});

/* ── Tulis ───────────────────────────────────────────────── */

export const createUserF = form(createUserSchema as any, async (data: CreateUserInput) => {
	try {
		requireAdmin();
		const hasil = createUser({
			ptkId: Number(data.ptkId),
			username: String(data.username).trim(),
			password: String(data.password),
			role: String(data.role)
		});
		return { ok: true as const, pesan: hasil.pesan, refresh: true };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Gagal membuat akun.') };
	}
});

export const toggleUserC = command(toggleUserSchema, async ({ userId, isActive }) => {
	try {
		requireAdmin();
		const hasil = toggleUser(Number(userId), Number(isActive));
		return { ok: true as const, pesan: hasil.pesan };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Gagal mengubah status.') };
	}
});

export const resetPasswordC = command(resetPasswordSchema, async ({ userId }) => {
	try {
		requireAdmin();
		const hasil = resetPasswordUser(Number(userId));
		return { ok: true as const, pesan: hasil.pesan, defaultPassword: hasil.defaultPassword };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Gagal reset password.') };
	}
});

export const deleteUserC = command(resetPasswordSchema, async ({ userId }) => {
	try {
		requireAdmin();
		const hasil = deleteUser(Number(userId));
		return { ok: true as const, pesan: hasil.pesan };
	} catch (e) {
		return { ok: false as const, error: pesanError(e, 'Gagal menghapus user.') };
	}
});
