import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Auth', () => {
	test('login via UI -> redirect ke dashboard', async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
		await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 5000 });
	});

	test('login gagal -> tampilkan error', async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('salah123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toBeVisible({ timeout: 5000 });
	});

	test('akses halaman tanpa login -> redirect ke login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});

	test('loginAs via API -> bisa akses dashboard', async ({ page }) => {
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page).toHaveURL('/');
		await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 8000 });
	});

	test('logout via UI -> session dihapus dan redirect ke /login', async ({ page }) => {
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page).toHaveURL('/');

		await page.getByRole('button', { name: /keluar/i }).first().click();
		await page.waitForURL(/\/login/, { timeout: 10000 });
		expect(await page.evaluate(() => document.cookie)).not.toContain('session_id=');
	});

	test('login dengan field kosong -> ditolak', async ({ page }) => {
		await page.goto('/login');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await expect(page).toHaveURL(/\/login/);
	});

	test('login dengan password < 3 karakter -> ditolak', async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('ab');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await expect(page).toHaveURL(/\/login/);
	});

	test('akses /ptk tanpa login -> redirect', async ({ page }) => {
		await page.goto('/ptk');
		await expect(page).toHaveURL(/\/login/);
	});

	test('akses /siswa tanpa login -> redirect', async ({ page }) => {
		await page.goto('/siswa');
		await expect(page).toHaveURL(/\/login/);
	});

	test('akses /approval tanpa login -> redirect', async ({ page }) => {
		await page.goto('/approval');
		await expect(page).toHaveURL(/\/login/);
	});
});
