import { describe, it, expect, vi } from 'vitest';

// Mock $app/environment before importing service
vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$lib/server/db', () => ({
	db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), all: vi.fn(), run: vi.fn(), get: vi.fn() }
}));

import { hashPassword } from '$modules/auth/auth.service';

describe('auth.service', () => {
	describe('hashPassword', () => {
		it('returns salt:hash format', () => {
			const result = hashPassword('test123');
			expect(result).toContain(':');
			const [salt, hash] = result.split(':');
			expect(salt).toHaveLength(32);
			expect(hash).toHaveLength(128);
		});

		it('returns different hashes for same password (random salt)', () => {
			const h1 = hashPassword('test123');
			const h2 = hashPassword('test123');
			expect(h1).not.toBe(h2);
		});
	});
});
