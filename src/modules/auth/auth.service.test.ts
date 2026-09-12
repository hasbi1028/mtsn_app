import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({ db: {} }));

import { hashPassword, createToken } from './auth.service';

describe('auth.service — password & token', () => {
	it('hashPassword menghasilkan format salt:hash (scrypt 64 byte)', () => {
		const hash = hashPassword('rahasia123');
		const [salt, digest] = hash.split(':');
		expect(salt).toHaveLength(32);
		expect(digest).toHaveLength(128);
	});

	it('hash unik untuk password sama (salt acak)', () => {
		expect(hashPassword('sama')).not.toBe(hashPassword('sama'));
	});

	it('createToken menghasilkan 64 hex char', () => {
		expect(createToken()).toMatch(/^[0-9a-f]{64}$/);
	});
});
