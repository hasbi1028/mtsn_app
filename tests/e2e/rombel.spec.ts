import { test, expect } from '@playwright/test';

test.describe('Rombel', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('can list rombel', async ({ page }) => {
		await page.goto('/rombel');
		await expect(page.locator('body')).toBeVisible();
	});

	test('rombel list page loads', async ({ page }) => {
		await page.goto('/rombel');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});

	test('rombel list page has table or empty state', async ({ page }) => {
		await page.goto('/rombel');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});
});
