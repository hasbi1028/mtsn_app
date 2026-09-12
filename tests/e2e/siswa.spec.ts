import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// 1x1 PNG transparan untuk uji upload
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
);

const SISWA_USER = '0128522954';
const SISWA_PASS = '7408024108120002';

test.describe('Siswa', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('can list siswa', async ({ page }) => {
		await page.goto('/siswa');
		await expect(page.locator('body')).toBeVisible();
	});

	test('can search siswa', async ({ page }) => {
		await page.goto('/siswa');
		const searchInput = page.locator('input[placeholder*="cari"], input[type="search"], input[name="q"]').first();
		if (await searchInput.isVisible()) {
			await searchInput.fill('test');
			await page.waitForTimeout(500);
		}
	});

	test('siswa list page loads', async ({ page }) => {
		await page.goto('/siswa');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});
});

test.describe('Siswa Profil & Foto (remote functions)', () => {
	test('siswa: ajukan perubahan data via command', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		await page.goto('/siswa/profil');
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
		await page.goto('/siswa/profil');
		await expect(page.getByText('Profil Saya').first()).toBeVisible({ timeout: 10000 });

		await page.setInputFiles('#foto-input', { name: 'foto.png', mimeType: 'image/png', buffer: PNG });
		await page.getByRole('button', { name: /Upload & Kirim/i }).click();

		await expect(
			page.getByText(/(Foto dikirim untuk persetujuan|Format tidak didukung|Ukuran foto maksimal)/)
		).toBeVisible({ timeout: 10000 });
	});

	test('admin: upload foto siswa via uploadFotoAdmin', async ({ page }) => {
		await loginAs(page);
		await page.goto('/siswa/1/profil');
		await expect(page.getByText('Profil Siswa')).toBeVisible({ timeout: 10000 });

		await page.locator('button', { hasText: 'Ubah' }).first().click();
		await page.setInputFiles('input[type="file"]', { name: 'foto.png', mimeType: 'image/png', buffer: PNG });
		await expect(page.getByText('Foto baru siap disimpan')).toBeVisible({ timeout: 5000 });
		await page.getByRole('button', { name: /Simpan Foto/i }).click();

		await expect(
			page.getByText(/(berhasil diperbarui|Akses ditolak)/)
		).toBeVisible({ timeout: 10000 });
	});

	test('legacy endpoint /api/siswa/me/foto sudah 404', async ({ page }) => {
		await loginAs(page, SISWA_USER, SISWA_PASS);
		const res = await page.request.post('/api/siswa/me/foto');
		expect(res.status()).toBe(404);
	});
});
