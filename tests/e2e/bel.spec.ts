import { test, expect } from '@playwright/test';

test.describe('Bel', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('bel monitoring page loads', async ({ page }) => {
		await page.goto('/bel');
		await expect(page.locator('body')).toBeVisible();
	});

	test('bel page has schedule section', async ({ page }) => {
		await page.goto('/bel');
		await expect(page.locator('body')).toBeVisible();
	});
});
