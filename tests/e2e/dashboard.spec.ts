import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('loads dashboard after login', async ({ page }) => {
		await gotoAndWait(page, '/admin/dashboard');
		await expect(page).toHaveURL(/\/admin\/dashboard/);
		await expect(page.getByText('Dashboard SIMAD')).toBeVisible();
	});

	test('has navigation sidebar after login', async ({ page }) => {
		await gotoAndWait(page, '/admin/dashboard');
		await expect(page.locator('nav, [class*="sidebar"]').first()).toBeVisible();
	});

	test('menampilkan progres dokumen (bukan semua 0)', async ({ page }) => {
		await gotoAndWait(page, '/admin/dashboard');
		const skmt = page.getByText('SKMT disetujui', { exact: true }).locator('..');
		await expect(skmt).toBeVisible();
		const value = parseInt((await skmt.textContent())?.replace(/\D+/g, '') ?? '0', 10);
		expect(value).toBeGreaterThan(0);
	});

	test('menampilkan kelayakan PBI-JK (bukan 0)', async ({ page }) => {
		await gotoAndWait(page, '/admin/dashboard');
		const card = page.getByText('PBI-JK', { exact: true }).locator('..');
		await expect(card).toBeVisible();
		const value = parseInt((await card.textContent())?.replace(/\D+/g, '') ?? '0', 10);
		expect(value).toBeGreaterThan(0);
	});

	test('unauthenticated -> redirect ke login', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/admin/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});
});
