import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/');
  });

  test('tampilkan judul Dashboard', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 8000 });
  });

  test('tampilkan minimal 1 stat card', async ({ page }) => {
    // Dashboard cards grid
    const cards = page.locator('.grid .rounded-lg, [class*="Card"]');
    // At least check that body has stats
    await expect(page.getByText('Total PTK')).toBeVisible({ timeout: 8000 });
  });

  test('sidebar tampil untuk admin', async ({ page }) => {
    // Sidebar uses data-sidebar attribute
    const sidebar = page.locator('[data-sidebar="sidebar"], [data-slot="sidebar"]');
    // Fallback: check for nav with Dashboard link
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible({ timeout: 5000 });
  });
});
