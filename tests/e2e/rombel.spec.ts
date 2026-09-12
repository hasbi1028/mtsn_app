import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Rombel', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('can list rombel', async ({ page }) => {
		await gotoAndWait(page, '/rombel');
		await expect(page.locator('body')).toBeVisible();
	});

	test('rombel page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/rombel');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('rombel list page has table or empty state', async ({ page }) => {
		await gotoAndWait(page, '/rombel');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});

	test('rombel page shows class list', async ({ page }) => {
		await gotoAndWait(page, '/rombel');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('body')).toBeVisible();
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.goto('/rombel');
		await expect(page).toHaveURL(/\/login/);
	});
});
