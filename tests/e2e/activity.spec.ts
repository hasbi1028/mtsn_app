import { test, expect } from '@playwright/test';

test.describe('Aktivitas', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('halaman aktivitas tampil', async ({ page }) => {
		await page.goto('/activity');
		await expect(page.locator('body')).toBeVisible();
	});
});
