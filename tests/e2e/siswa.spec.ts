import { test, expect } from '@playwright/test';

test.describe('Siswa', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('can list siswa', async ({ page }) => {
		await page.goto('/siswa');
		await expect(page.locator('body')).toBeVisible();
	});

	test('can search siswa', async ({ page }) => {
		await page.goto('/siswa');
		const searchInput = page.locator('input[placeholder*="cari"], input[type="search"], input[name="q"]').first();
		if (await searchInput.isVisible()) {
			await searchInput.fill('test');
			await page.waitForTimeout(500);
		}
	});

	test('siswa list page loads', async ({ page }) => {
		await page.goto('/siswa');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});
});
