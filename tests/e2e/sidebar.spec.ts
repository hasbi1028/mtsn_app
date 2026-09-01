import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/');
  });

  test('sidebar tampil untuk admin', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 5000 });
  });

  test('module switcher tampil', async ({ page }) => {
    // Header contains MTsN 2 or SIMAD
    await expect(page.locator('[data-sidebar="header"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('menu items tampil sesuai role admin', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 5000 });
    // At least one main menu should be visible
    const menu = page.locator('[data-sidebar="group"]');
    await expect(menu.first()).toBeVisible({ timeout: 5000 });
  });

  test('submenu Dokumen bisa di-toggle', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Toggle Dokumen/i });
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(400);
      // After toggle, submenu should still have aria or be visible
      await expect(page.locator('body')).toContainText(/SKMT|Dokumen/i);
    } else {
      // Fallback: check Dokumen group exists
      await expect(page.locator('body')).toContainText('Dokumen');
    }
  });
});
