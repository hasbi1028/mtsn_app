import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'crypto';
import type { UserSession } from './auth.validation';

// ============================================
// MIGRATION RINGAN
// ============================================

let migrated = false;

function ensureAuthMigration() {
	if (migrated) return;
	try {
		db.run(sql`ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0`);
	} catch {
		/* kolom sudah ada */
	}
	migrated = true;
}

// ============================================
// PASSWORD UTILS (scrypt N=16384 r=8 p=1 keyLen=64)
// ============================================

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
	return `${salt}:${hash.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [salt, want] = stored.split(':');
	const got = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
	return got.toString('hex') === want;
}

export function createToken(): string {
	return randomBytes(32).toString('hex');
}

// ============================================
// USER QUERIES
// ============================================

/**
 * Find user by username
 */
export function findUserByUsername(username: string) {
	ensureAuthMigration();
	return db
		.select()
		.from(users)
		.where(and(eq(users.username, username), eq(users.isActive, 1)))
		.get();
}

/**
 * Update last login timestamp
 */
export function updateLastLogin(userId: number) {
	try {
		db.update(users)
			.set({ lastLogin: new Date().toISOString() })
			.where(eq(users.id, userId))
			.run();
	} catch (e) {
		console.error('Failed to update last login:', e);
	}
}

// ============================================
// SESSION QUERIES
// ============================================

/**
 * Create new session
 * Return: token string
 */
export function createSession(userId: number): string {
	const token = createToken();
	const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

	db.insert(sessions)
		.values({ token, userId, expiresAt })
		.run();

	return token;
}

/**
 * Delete session by token
 */
export function deleteSessionByToken(token: string) {
	db.delete(sessions).where(eq(sessions.token, token)).run();
}

/**
 * Get user from session token
 * Returns null if session invalid/expired
 */
export function getUserFromSession(token: string): UserSession | null {
	ensureAuthMigration();
	const session = db
		.select({
			userId: users.id,
			username: users.username,
			role: users.role,
			ref_id: users.refId,
			mustChangePassword: users.mustChangePassword
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(and(eq(sessions.token, token), gt(sessions.expiresAt, Date.now())))
		.get();

	return session ?? null;
}

/**
 * Validate credentials
 * Returns: user object or null
 */
export function validateCredentials(username: string, password: string) {
	ensureAuthMigration();
	const user = findUserByUsername(username);
	if (!user) return null;
	if (!verifyPassword(password, user.passwordHash)) return null;
	return user;
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * Ganti password user. Return { ok, pesan } atau throw.
 */
export function changePassword(userId: number, passwordLama: string, passwordBaru: string): { ok: true; pesan: string } {
	ensureAuthMigration();
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	if (!user) throw new Error('User tidak ditemukan.');
	if (!verifyPassword(passwordLama, user.passwordHash)) throw new Error('Password lama salah.');
	if (passwordBaru.length < 6) throw new Error('Password baru minimal 6 karakter.');

	const newHash = hashPassword(passwordBaru);
	db.update(users)
		.set({ passwordHash: newHash, mustChangePassword: 0, updatedAt: new Date().toISOString() })
		.where(eq(users.id, userId))
		.run();
	return { ok: true, pesan: 'Password berhasil diganti.' };
}

/**
 * Reset password user oleh admin. Return password default.
 */
export function resetPassword(userId: number): { ok: true; pesan: string; defaultPassword: string } {
	ensureAuthMigration();
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	if (!user) throw new Error('User tidak ditemukan.');

	const defaultPassword = '2026qwerty!';
	const newHash = hashPassword(defaultPassword);
	db.update(users)
		.set({ passwordHash: newHash, mustChangePassword: 1, updatedAt: new Date().toISOString() })
		.where(eq(users.id, userId))
		.run();
	return { ok: true, pesan: `Password direset ke ${defaultPassword}`, defaultPassword };
}
