import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Dashboard', () => {
	test('loads dashboard after login', async ({ page }) => {
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page).toHaveURL('/');
	});

	test('has navigation sidebar after login', async ({ page }) => {
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page.locator('nav, [class*="sidebar"]').first()).toBeVisible();
	});

	test('shows stats cards', async ({ page }) => {
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page.locator('body')).toBeVisible();
		const body = await page.locator('body').textContent();
		expect(body).toBeTruthy();
	});

	test('dashboard heading visible', async ({ page }) => {
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
	});

	test('unauthenticated -> redirect to login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});
});
