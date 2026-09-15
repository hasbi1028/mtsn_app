import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({ db: {} }));

import { canManageContent, isKontributor } from './konten';
import { canManage, isModerator } from '$lib/konten';

const user = (role: string, userId: number) => ({
	userId,
	username: `u${userId}`,
	role,
	ref_id: null,
	mustChangePassword: 0
});

describe('konten — moderasi & kepemilikan', () => {
	it('admin & kepsek boleh mengelola konten siapa pun', () => {
		expect(canManageContent(user('admin', 1), 99)).toBe(true);
		expect(canManageContent(user('kepsek', 2), null)).toBe(true);
	});

	it('guru hanya boleh mengelola konten miliknya', () => {
		expect(canManageContent(user('guru', 5), 5)).toBe(true);
		expect(canManageContent(user('guru', 5), 6)).toBe(false);
		expect(canManageContent(user('guru', 5), null)).toBe(false);
	});

	it('guru dikenali sebagai kontributor (wajib moderasi)', () => {
		expect(isKontributor(user('guru', 5))).toBe(true);
		expect(isKontributor(user('admin', 1))).toBe(false);
		expect(isKontributor(user('kepsek', 2))).toBe(false);
	});
});

describe('konten (client) — helper moderasi', () => {
	it('canManage sejalan dengan aturan server', () => {
		expect(canManage('admin', 1, 99)).toBe(true);
		expect(canManage('kepsek', 2, null)).toBe(true);
		expect(canManage('guru', 5, 5)).toBe(true);
		expect(canManage('guru', 5, 6)).toBe(false);
		expect(canManage(undefined, undefined, 5)).toBe(false);
	});

	it('isModerator hanya admin/kepsek', () => {
		expect(isModerator('admin')).toBe(true);
		expect(isModerator('kepsek')).toBe(true);
		expect(isModerator('guru')).toBe(false);
		expect(isModerator('staf')).toBe(false);
	});
});
