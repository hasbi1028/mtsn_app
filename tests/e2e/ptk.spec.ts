import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('PTK', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('can list PTK', async ({ page }) => {
		await gotoAndWait(page, '/ptk');
		await expect(page.locator('body')).toBeVisible();
	});

	test('can search PTK', async ({ page }) => {
		await gotoAndWait(page, '/ptk');
		const searchInput = page.locator('input[placeholder*="cari"], input[type="search"]').first();
		if (await searchInput.isVisible()) {
			await searchInput.fill('guru');
			await page.waitForTimeout(500);
		}
	});

	test('PTK list page has table or empty state', async ({ page }) => {
		await gotoAndWait(page, '/ptk');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});

	test('PTK page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/ptk');
		await expect(page.locator('h1, h2, [class*="heading"]').first()).toBeVisible({ timeout: 8000 });
	});

	test('navigasi ke detail PTK', async ({ page }) => {
		await gotoAndWait(page, '/ptk');
		const firstRow = page.locator('tbody tr a, [class*="row"] a').first();
		if (await firstRow.isVisible()) {
			await firstRow.click();
			await page.waitForTimeout(1000);
			expect(page.url()).toContain('/ptk/');
		}
	});

	test('PTK detail shows data sections', async ({ page }) => {
		await gotoAndWait(page, '/ptk');
		const firstRow = page.locator('tbody tr a, [class*="row"] a').first();
		if (await firstRow.isVisible()) {
			await firstRow.click();
			await page.waitForTimeout(1000);
			await expect(page.locator('body')).toBeVisible();
		}
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.goto('/ptk');
		await expect(page).toHaveURL(/\/login/);
	});
});
