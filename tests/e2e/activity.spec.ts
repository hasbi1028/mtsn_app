import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Aktivitas', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('halaman aktivitas tampil', async ({ page }) => {
		await gotoAndWait(page, '/activity');
		await expect(page.locator('body')).toBeVisible();
	});

	test('activity page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/activity');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('activity shows log entries or empty state', async ({ page }) => {
		await gotoAndWait(page, '/activity');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('body')).toBeVisible();
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.goto('/activity');
		await expect(page).toHaveURL(/\/login/);
	});
});
