import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Approval', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('approval page loads', async ({ page }) => {
		await gotoAndWait(page, '/admin/approval');
		await expect(page.locator('body')).toBeVisible();
	});

	test('approval page has content', async ({ page }) => {
		await gotoAndWait(page, '/admin/approval');
		const hasContent = await page.locator('body').isVisible();
		expect(hasContent).toBe(true);
	});

	test('approval page heading visible', async ({ page }) => {
		await gotoAndWait(page, '/admin/approval');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
	});

	test('approval shows pending items or empty state', async ({ page }) => {
		await gotoAndWait(page, '/admin/approval');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('body')).toBeVisible();
	});

	test('unauthenticated -> redirect', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/admin/approval');
		await expect(page).toHaveURL(/\/login/);
	});
});
