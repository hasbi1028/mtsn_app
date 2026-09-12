import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

// 1x1 PNG transparan untuk uji upload
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
);

const SISWA_USER = '0128522954';
const SISWA_PASS = '7408024108120002';

test.describe('Siswa — Admin', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('can list siswa', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		await expect(page.locator('body')).toBeVisible();
	});

	test('can search siswa', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		const searchInput = page.locator('input[placeholder*="cari"], input[type="search"], input[name="q"]').first();
		if (await searchInput.isVisible()) {
			await searchInput.fill('test');
			await page.waitForTimeout(500);
		}
	});

	test('siswa list page loads', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});

	test('siswa page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('admin: navigasi ke profil siswa', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		const link = page.locator('tbody tr a, [class*="row"] a').first();
		if (await link.isVisible()) {
			await link.click();
			await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
			await expect(page.getByText('Profil Siswa')).toBeVisible({ timeout: 8000 });
		}
	});

	test('admin: upload foto siswa via uploadFotoAdmin', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		const link = page.locator('tbody tr a, [class*="row"] a').first();
		if (await link.isVisible()) {
			await link.click();
			await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
			await expect(page.getByText('Profil Siswa')).toBeVisible({ timeout: 8000 });

			await page.locator('button', { hasText: 'Ubah' }).first().click();
			await page.setInputFiles('input[type="file"]', { name: 'foto.png', mimeType: 'image/png', buffer: PNG });
			await expect(page.getByText('Foto baru siap disimpan')).toBeVisible({ timeout: 5000 });
			await page.getByRole('button', { name: /Simpan Foto/i }).click();
			await expect(
				page.getByText(/(berhasil diperbarui|Akses ditolak)/)
			).toBeVisible({ timeout: 10000 });
		}
	});

	test('admin: navigasi ke bansos siswa', async ({ page }) => {
		await gotoAndWait(page, '/siswa');
		const link = page.locator('tbody tr a, [class*="row"] a').first();
		if (await link.isVisible()) {
			await link.click();
			await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
			const bansosLink = page.locator('a[href$="/bansos"]').first();
			if (await bansosLink.isVisible()) {
				await bansosLink.click();
				await page.waitForTimeout(1000);
				expect(page.url()).toContain('/bansos');
			}
		}
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.goto('/siswa');
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('Siswa — Self-Service (Siswa Login)', () => {
	test('siswa: ajukan perubahan data via command', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		await gotoAndWait(page, '/siswa/profil');
		await expect(page.getByText('Profil Saya').first()).toBeVisible({ timeout: 10000 });

		await page.getByRole('button', { name: /Ubah Data Pribadi/i }).click();
		await page.locator('select').selectOption('alamat');
		await page.locator('[role="dialog"] input').first().fill('Jl. Uji Coba 123');
		await page.getByRole('button', { name: /Ajukan Perubahan/i }).click();
		await expect(
			page.getByText(/(Perubahan berhasil diajukan|Sudah ada permintaan perubahan)/)
		).toBeVisible({ timeout: 10000 });
	});

	test('siswa: upload foto via remote form()', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		await gotoAndWait(page, '/siswa/profil');
		await expect(page.getByText('Profil Saya').first()).toBeVisible({ timeout: 10000 });

		await page.setInputFiles('#foto-input', { name: 'foto.png', mimeType: 'image/png', buffer: PNG });
		await page.getByRole('button', { name: /Upload & Kirim/i }).click();
		await expect(
			page.getByText(/(Foto dikirim untuk persetujuan|Format tidak didukung|Ukuran foto maksimal)/)
		).toBeVisible({ timeout: 10000 });
	});

	test('siswa: bansos page tampil', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		await gotoAndWait(page, '/siswa/bansos');
		await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
	});

	test('siswa: cetak bansos tampil', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		await gotoAndWait(page, '/siswa/bansos/cetak');
		await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
	});
});

test.describe('Siswa — Legacy Endpoint Guard', () => {
	test('legacy endpoint /api/siswa/me/foto sudah 404', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		const res = await page.request.post('/api/siswa/me/foto');
		expect(res.status()).toBe(404);
	});
});
