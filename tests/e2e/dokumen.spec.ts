import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Dokumen', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('SKMT list page loads', async ({ page }) => {
		await gotoAndWait(page, '/admin/skmt');
		await expect(page.locator('body')).toBeVisible();
	});

	test('SKBK list page loads', async ({ page }) => {
		await gotoAndWait(page, '/admin/skbk');
		await expect(page.locator('body')).toBeVisible();
	});

	test('SKAKPT list page loads', async ({ page }) => {
		await gotoAndWait(page, '/admin/skakpt');
		await expect(page.locator('body')).toBeVisible();
	});

	test('SKMT page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/admin/skmt');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('SKBK page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/admin/skbk');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('SKAKPT page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/admin/skakpt');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/admin/skmt');
		await expect(page).toHaveURL(/\/login/);
	});
});
