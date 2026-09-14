/**
 * User management service — logika bisnis untuk CRUD user (tanpa SvelteKit).
 */
import { db } from '$lib/server/db';
import { users, ptk } from '$lib/server/db/schema';
import { eq, sql, desc, like, or } from 'drizzle-orm';
import { hashPassword } from '$modules/auth/auth.service';

export interface UserListRow {
	id: number;
	username: string;
	role: string;
	refId: number | null;
	isActive: number | null;
	mustChangePassword: number;
	lastLogin: string | null;
	createdAt: Date | null;
	ptkNama: string | null;
	ptkNip: string | null;
	ptkFungsi: string | null;
}

export interface PtkOption {
	id: number;
	nama: string;
	nip: string | null;
	fungsi: string | null;
}

/** Daftar user dengan info PTK. */
export function listUsers(): UserListRow[] {
	return db
		.select({
			id: users.id,
			username: users.username,
			role: users.role,
			refId: users.refId,
			isActive: users.isActive,
			mustChangePassword: users.mustChangePassword,
			lastLogin: users.lastLogin,
			createdAt: users.createdAt,
			ptkNama: ptk.nama,
			ptkNip: ptk.nip,
			ptkFungsi: ptk.fungsi
		})
		.from(users)
		.leftJoin(ptk, eq(users.refId, ptk.id))
		.orderBy(desc(users.createdAt))
		.all();
}

/** PTK yang belum punya akun user. */
export function ptkBelumPunyaAkun(): PtkOption[] {
	const subQuery = db
		.select({ refId: users.refId })
		.from(users)
		.where(sql`${users.refId} IS NOT NULL`);

	return db
		.select({ id: ptk.id, nama: ptk.nama, nip: ptk.nip, fungsi: ptk.fungsi })
		.from(ptk)
		.where(sql`${ptk.id} NOT IN (SELECT ref_id FROM users WHERE ref_id IS NOT NULL)`)
		.orderBy(ptk.nama)
		.all();
}

/** Buat akun user baru. */
export function createUser(input: {
	ptkId: number;
	username: string;
	password: string;
	role: string;
}): { ok: true; pesan: string } {
	// Cek PTK
	const ptkRow = db.select().from(ptk).where(eq(ptk.id, input.ptkId)).get();
	if (!ptkRow) throw new Error('Data PTK tidak ditemukan.');

	// Cek username duplikat
	const existing = db.select().from(users).where(eq(users.username, input.username)).get();
	if (existing) throw new Error(`Username "${input.username}" sudah dipakai.`);

	const hash = hashPassword(input.password);
	const now = new Date().toISOString();

	db.insert(users)
		.values({
			username: input.username,
			passwordHash: hash,
			role: input.role,
			refId: input.ptkId,
			isActive: 1,
			mustChangePassword: 1,
			updatedAt: now
		})
		.run();

	return { ok: true, pesan: `Akun "${input.username}" berhasil dibuat.` };
}

/** Toggle aktif/nonaktif user. */
export function toggleUser(userId: number, isActive: number): { ok: true; pesan: string } {
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	if (!user) throw new Error('User tidak ditemukan.');

	db.update(users)
		.set({ isActive, updatedAt: new Date().toISOString() })
		.where(eq(users.id, userId))
		.run();

	const status = isActive ? 'diaktifkan' : 'dinonaktifkan';
	return { ok: true, pesan: `User "${user.username}" ${status}.` };
}

/** Reset password user ke default. */
export function resetPasswordUser(userId: number): { ok: true; pesan: string; defaultPassword: string } {
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	if (!user) throw new Error('User tidak ditemukan.');

	const defaultPassword = '2026qwerty!';
	const hash = hashPassword(defaultPassword);

	db.update(users)
		.set({ passwordHash: hash, mustChangePassword: 1, updatedAt: new Date().toISOString() })
		.where(eq(users.id, userId))
		.run();

	return { ok: true, pesan: `Password direset ke ${defaultPassword}`, defaultPassword };
}

/** Hapus user. */
export function deleteUser(userId: number): { ok: true; pesan: string } {
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	if (!user) throw new Error('User tidak ditemukan.');
	if (user.role === 'admin') throw new Error('Tidak bisa menghapus akun admin.');

	db.delete(users).where(eq(users.id, userId)).run();
	return { ok: true, pesan: `User "${user.username}" dihapus.` };
}
