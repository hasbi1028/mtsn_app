import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Dokumen', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page); });

  test('SKMT: list tampil', async ({ page }) => {
    await gotoAndWait(page, '/skmt');
    await expect(page.locator('body')).toContainText(/SKMT/i, { timeout: 5000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
  });
  test('SKBK: list tampil', async ({ page }) => {
    await gotoAndWait(page, '/skbk');
    await expect(page.locator('body')).toContainText(/SKBK/i, { timeout: 5000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
  });
  test('SKAKPT: list tampil', async ({ page }) => {
    await gotoAndWait(page, '/skakpt');
    await expect(page.locator('body')).toContainText(/SKAKPT/i, { timeout: 5000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
  });
});
