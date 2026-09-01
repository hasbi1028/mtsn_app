import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('PTK', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/ptk');
  });

  test('list PTK tampil dengan data', async ({ page }) => {
    await expect(page.getByText('Data PTK').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });
  });

  test('search PTK by nama', async ({ page }) => {
    // Search via q param by navigating
    await page.goto('/ptk?q=Hasbi');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });
  });

  test('klik nama PTK -> detail', async ({ page }) => {
    const firstLink = page.locator('tbody tr a').first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    await firstLink.click();
    await page.waitForURL(/\/ptk\/\d+/, { timeout: 8000 });
    await expect(page.locator('body')).toContainText(/NIP|PTK|Detail/i, { timeout: 5000 });
  });

  test('detail PTK tampilkan data lengkap', async ({ page }) => {
    const firstLink = page.locator('tbody tr a').first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    const href = await firstLink.getAttribute('href');
    if (href) {
      await page.goto(href);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toContainText(/Nama|NIP|PTK/i, { timeout: 5000 });
    }
  });
});
