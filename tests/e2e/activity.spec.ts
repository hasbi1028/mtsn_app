import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Aktivitas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/activity');
  });

  test('halaman aktivitas tampil', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Aktivitas/i, { timeout: 5000 });
  });
});
