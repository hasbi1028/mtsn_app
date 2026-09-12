import { describe, it, expect } from 'vitest';
import * as v from 'valibot';
import { loginSchema } from '$modules/auth/auth.validation';
import { siswaListSchema, siswaDetailSchema, perubahanSchema } from '$modules/siswa/siswa.validation';
import { ptkListSchema, ptkDetailSchema } from '$modules/ptk/ptk.validation';

describe('Validation Schemas', () => {
	describe('loginSchema', () => {
		it('accepts valid credentials', () => {
			const result = v.safeParse(loginSchema, { username: 'admin', password: 'admin123' });
			expect(result.success).toBe(true);
		});

		it('rejects empty username', () => {
			const result = v.safeParse(loginSchema, { username: '', password: 'admin123' });
			expect(result.success).toBe(false);
		});

		it('rejects empty password', () => {
			const result = v.safeParse(loginSchema, { username: 'admin', password: '' });
			expect(result.success).toBe(false);
		});
	});

	describe('siswaListSchema', () => {
		it('accepts defaults', () => {
			const result = v.safeParse(siswaListSchema, {});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.page).toBe(1);
				expect(result.output.perPage).toBe(20);
				expect(result.output.q).toBe('');
			}
		});

		it('accepts custom values', () => {
			const result = v.safeParse(siswaListSchema, { q: 'test', kelas: 'VII', page: 2, perPage: 10 });
			expect(result.success).toBe(true);
		});
	});

	describe('siswaDetailSchema', () => {
		it('accepts non-empty string', () => {
			const result = v.safeParse(siswaDetailSchema, { id: '123' });
			expect(result.success).toBe(true);
		});

		it('rejects empty string', () => {
			const result = v.safeParse(siswaDetailSchema, { id: '' });
			expect(result.success).toBe(false);
		});
	});

	describe('perubahanSchema', () => {
		it('accepts valid perubahan', () => {
			const result = v.safeParse(perubahanSchema, { siswaId: 1, field: 'nama', nilai_baru: 'Budi' });
			expect(result.success).toBe(true);
		});

		it('rejects empty field', () => {
			const result = v.safeParse(perubahanSchema, { siswaId: 1, field: '', nilai_baru: 'Budi' });
			expect(result.success).toBe(false);
		});

		it('rejects empty nilai_baru', () => {
			const result = v.safeParse(perubahanSchema, { siswaId: 1, field: 'nama', nilai_baru: '' });
			expect(result.success).toBe(false);
		});
	});

	describe('ptkListSchema', () => {
		it('accepts defaults', () => {
			const result = v.safeParse(ptkListSchema, {});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.output.page).toBe(1);
				expect(result.output.perPage).toBe(20);
			}
		});
	});

	describe('ptkDetailSchema', () => {
		it('accepts non-empty string', () => {
			const result = v.safeParse(ptkDetailSchema, { id: '1' });
			expect(result.success).toBe(true);
		});

		it('rejects empty string', () => {
			const result = v.safeParse(ptkDetailSchema, { id: '' });
			expect(result.success).toBe(false);
		});
	});
});
