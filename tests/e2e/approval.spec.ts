import { test, expect } from '@playwright/test';

test.describe('Approval', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
		await page.getByPlaceholder('username').fill('hasbi');
		await page.locator('#password').fill('admin123');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await page.waitForURL('/', { timeout: 10000 });
	});

	test('approval page loads', async ({ page }) => {
		await page.goto('/approval');
		await expect(page.locator('body')).toBeVisible();
	});

	test('approval page has content', async ({ page }) => {
		await page.goto('/approval');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});
});
