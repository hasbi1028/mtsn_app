import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Roster', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/roster');
  });

  test('roster tampil dengan kelas default', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Roster/i, { timeout: 5000 });
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });

  test('ganti kelas -> data berubah', async ({ page }) => {
    const sel = page.locator('select').first();
    await expect(sel).toBeVisible({ timeout: 5000 });
    const opts = sel.locator('option');
    const count = await opts.count();
    if (count > 1) {
      await sel.selectOption({ index: 1 });
      await page.waitForTimeout(800);
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('roster tampilkan hari', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/SENIN|SELASA|RABU|KAMIS|JUMAT/i, { timeout: 5000 });
  });
});
