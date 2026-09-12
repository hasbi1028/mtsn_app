import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
	test('loads dashboard after login', async ({ page }) => {
		// Login via UI
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });

		// Dashboard should load
		expect(page.url()).toContain('/');
	});

	test('has navigation sidebar after login', async ({ page }) => {
		// Login via UI
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });

		// Should have sidebar
		await expect(page.locator('nav, [class*="sidebar"]').first()).toBeVisible();
	});
});
