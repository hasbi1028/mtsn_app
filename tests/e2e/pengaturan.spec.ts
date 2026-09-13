import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Pengaturan — Branding', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('halaman pengaturan tampil untuk admin', async ({ page }) => {
		await gotoAndWait(page, '/admin/pengaturan');
		await expect(page.getByRole('heading', { name: /Pengaturan/ })).toBeVisible({ timeout: 10000 });
		await expect(page.getByText('Logo Aplikasi', { exact: true })).toBeVisible();
		await expect(page.getByText('Favicon', { exact: true })).toBeVisible();
	});

	test('menu Pengaturan muncul di sidebar admin', async ({ page }) => {
		await gotoAndWait(page, '/admin/dashboard');
		await page.getByRole('button', { name: 'Toggle Sistem' }).click();
		await expect(page.getByRole('link', { name: 'Pengaturan' }).first()).toBeVisible({ timeout: 10000 });
	});

	test('favicon dapat diakses dengan fallback logo Kemenag', async ({ page }) => {
		const res = await page.request.get('/favicon.ico');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toMatch(/image\//);
	});
});
