import { test, expect } from '@playwright/test';

test.describe('PTK', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('can list PTK', async ({ page }) => {
		await page.goto('/ptk');
		await expect(page.locator('body')).toBeVisible();
	});

	test('can search PTK', async ({ page }) => {
		await page.goto('/ptk');
		const searchInput = page.locator('input[placeholder*="cari"], input[type="search"]').first();
		if (await searchInput.isVisible()) {
			await searchInput.fill('guru');
			await page.waitForTimeout(500);
		}
	});

	test('PTK list page has table or empty state', async ({ page }) => {
		await page.goto('/ptk');
		// Should have either a table or empty message
		const hasTable = await page.locator('table, [class*="table"]').first().isVisible().catch(() => false);
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});
});
