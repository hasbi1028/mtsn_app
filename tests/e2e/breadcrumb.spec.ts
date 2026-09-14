import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Breadcrumb', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page); });

  test('Dashboard: breadcrumb tampilkan Dashboard', async ({ page }) => {
    await gotoAndWait(page, '/admin/dashboard');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Dashboard');
  });

  test('PTK: breadcrumb tampilkan Data PTK', async ({ page }) => {
    await gotoAndWait(page, '/admin/ptk');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('PTK');
  });

  test('Siswa: breadcrumb tampilkan Data Siswa', async ({ page }) => {
    await gotoAndWait(page, '/admin/siswa');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Siswa');
  });

  test('Profil Siswa: breadcrumb Data Siswa > Profil', async ({ page }) => {
    await gotoAndWait(page, '/admin/siswa');
    const firstLink = page.locator('tbody tr a').first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    await firstLink.click();
    await page.waitForURL(/\/admin\/siswa\/[^/]+\/profil/, { timeout: 8000 });
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Siswa');
    await expect(bc).toContainText('Profil');
  });

  test('SKMT: breadcrumb tampilkan SKMT', async ({ page }) => {
    await gotoAndWait(page, '/admin/skmt');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('SKMT');
  });

  test('klik breadcrumb Home -> navigasi ke dashboard', async ({ page }) => {
    await gotoAndWait(page, '/admin/ptk');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    const link = bc.getByRole('link', { name: 'Home' });
    await expect(link).toBeVisible({ timeout: 3000 });
    await link.click();
    await expect(page).toHaveURL('/admin/dashboard');
  });
});
