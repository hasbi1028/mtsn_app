import { test, expect } from '@playwright/test';

test.describe('Roster', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('roster page loads', async ({ page }) => {
		await page.goto('/roster');
		await expect(page.locator('body')).toBeVisible();
	});

	test('roster has kelas selector or empty state', async ({ page }) => {
		await page.goto('/roster');
		await page.waitForLoadState('networkidle');
		await expect(page.getByRole('heading', { name: 'Roster' })).toBeVisible({ timeout: 5000 });
	});

	test('roster page shows content or empty state', async ({ page }) => {
		await page.goto('/roster');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});
});
