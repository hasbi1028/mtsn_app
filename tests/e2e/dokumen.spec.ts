import { test, expect } from '@playwright/test';

test.describe('Dokumen', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('SKMT list page loads', async ({ page }) => {
		await page.goto('/skmt');
		await expect(page.locator('body')).toBeVisible();
	});

	test('SKBK list page loads', async ({ page }) => {
		await page.goto('/skbk');
		await expect(page.locator('body')).toBeVisible();
	});

	test('SKAKPT list page loads', async ({ page }) => {
		await page.goto('/skakpt');
		await expect(page.locator('body')).toBeVisible();
	});
});
