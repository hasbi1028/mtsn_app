import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Bel', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page); });

  test('monitoring bel tampil', async ({ page }) => {
    await gotoAndWait(page, '/bel');
    await expect(page.locator('body')).toContainText(/Bel/i, { timeout: 5000 });
  });

  test('status bel tampil', async ({ page }) => {
    await gotoAndWait(page, '/bel');
    await expect(page.locator('body')).toContainText(/Aktif|Nonaktif|Master|Status/i, { timeout: 5000 });
  });

  test('perpustakaan suara tampil', async ({ page }) => {
    await gotoAndWait(page, '/bel/suara');
    await expect(page.locator('body')).toContainText(/Suara|Perpustakaan/i, { timeout: 5000 });
  });
});
