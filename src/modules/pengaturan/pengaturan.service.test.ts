import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/db', () => ({
	db: {
		all: vi.fn(() => []),
		run: vi.fn()
	}
}));

import {
	FALLBACK_FAVICON,
	FALLBACK_LOGO,
	ensurePengaturanTable,
	getBrandingContentType,
	getPengaturan
} from '$modules/pengaturan/pengaturan.service';

describe('pengaturan.service', () => {
	it('membuat tabel tanpa error', () => {
		expect(() => ensurePengaturanTable()).not.toThrow();
	});

	it('getPengaturan mengembalikan fallback logo Kemenag saat kosong', () => {
		const b = getPengaturan();
		expect(b.appName.length).toBeGreaterThan(0);
		expect(b.appSubtitle.length).toBeGreaterThan(0);
		expect(b.logoCustom).toBe(false);
		expect(b.faviconCustom).toBe(false);
		expect(b.logoUrl).toBe(FALLBACK_LOGO);
		expect(b.faviconUrl).toBe(FALLBACK_FAVICON);
	});

	it('menentukan content-type dari ekstensi', () => {
		expect(getBrandingContentType('/uploads/branding/logo-1.png')).toBe('image/png');
		expect(getBrandingContentType('/uploads/branding/favicon-1.ico')).toBe('image/x-icon');
		expect(getBrandingContentType('/uploads/branding/logo-1.svg')).toBe('image/svg+xml');
		expect(getBrandingContentType('/uploads/branding/logo-1.bin')).toBe('application/octet-stream');
	});
});
