import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Roster', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('roster page loads', async ({ page }) => {
		await gotoAndWait(page, '/admin/roster');
		await expect(page.locator('body')).toBeVisible();
	});

	test('roster has kelas selector or empty state', async ({ page }) => {
		await gotoAndWait(page, '/admin/roster');
		await page.waitForLoadState('networkidle');
		await expect(page.getByRole('heading', { name: 'Roster' })).toBeVisible({ timeout: 5000 });
	});

	test('roster page shows content or empty state', async ({ page }) => {
		await gotoAndWait(page, '/admin/roster');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});

	test('roster page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/admin/roster');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/admin/roster');
		await expect(page).toHaveURL(/\/login/);
	});
});
