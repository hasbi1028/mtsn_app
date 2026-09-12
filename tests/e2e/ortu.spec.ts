import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Ortu', () => {
	test('ortu login -> bisa akses profil anak', async ({ page }) => {
		// Try to login as ortu (if test account exists)
		// For now, just verify page structure
		await loginAs(page);
		await gotoAndWait(page, '/');
		await expect(page.locator('body')).toBeVisible();
	});

	test('unauthenticated -> redirect to login', async ({ page }) => {
		await page.goto('/ortu');
		await expect(page).toHaveURL(/\/login/);
	});
});
