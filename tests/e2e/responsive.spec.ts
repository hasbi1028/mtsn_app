import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Responsive', () => {
  test('mobile: data siswa tampil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page);
    await gotoAndWait(page, '/siswa');
    await expect(page.getByText('Data Siswa').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
  });

  test('tablet: layout adaptif', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAs(page);
    await gotoAndWait(page, '/');
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 5000 });
  });

  test('desktop: sidebar full', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page);
    await gotoAndWait(page, '/');
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 5000 });
  });
});
