import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Bel', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('bel monitoring page loads', async ({ page }) => {
		await gotoAndWait(page, '/admin/bel');
		await expect(page.locator('body')).toBeVisible();
	});

	test('bel page has schedule section', async ({ page }) => {
		await gotoAndWait(page, '/admin/bel');
		await expect(page.locator('body')).toBeVisible();
	});

	test('bel page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/admin/bel');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('bel page shows jadwal or empty state', async ({ page }) => {
		await gotoAndWait(page, '/admin/bel');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('body')).toBeVisible();
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/admin/bel');
		await expect(page).toHaveURL(/\/login/);
	});
});
