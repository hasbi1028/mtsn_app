import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'crypto';
import type { UserSession } from './auth.validation';

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
	db.update(users)
		.set({ lastLogin: new Date().toISOString() })
		.where(eq(users.id, userId))
		.run();
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
	const session = db
		.select({
			userId: users.id,
			username: users.username,
			role: users.role,
			ref_id: users.refId
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
	const user = findUserByUsername(username);
	if (!user) return null;
	if (!verifyPassword(password, user.passwordHash)) return null;
	return user;
}
