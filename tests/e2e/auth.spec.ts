import { test, expect } from '@playwright/test';
import { loginAs, loginViaUI, gotoAndWait } from './helpers';

test.describe('Auth', () => {
  test('login via UI -> redirect ke dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('username').fill('hasbi');
    await page.locator('#password').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 5000 });
  });

  test('login gagal -> tampilkan error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('username').fill('hasbi');
    await page.locator('#password').fill('salah123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    // Error appears as alert div
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('akses halaman tanpa login -> redirect ke login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('loginAs via API -> bisa akses dashboard', async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 8000 });
  });
});
