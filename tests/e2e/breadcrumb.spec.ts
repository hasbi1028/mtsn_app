import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Breadcrumb', () => {
  test.beforeEach(async ({ page }) => { await loginAs(page); });

  test('Dashboard: breadcrumb tampilkan Dashboard', async ({ page }) => {
    await gotoAndWait(page, '/');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Dashboard');
  });

  test('PTK: breadcrumb tampilkan Data PTK', async ({ page }) => {
    await gotoAndWait(page, '/ptk');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Data PTK');
  });

  test('Siswa: breadcrumb tampilkan Data Siswa', async ({ page }) => {
    await gotoAndWait(page, '/siswa');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Data Siswa');
  });

  test('Profil Siswa: breadcrumb Data Siswa > Profil', async ({ page }) => {
    await gotoAndWait(page, '/siswa');
    const firstLink = page.locator('tbody tr a').first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    await firstLink.click();
    await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('Data Siswa');
    await expect(bc).toContainText('Profil');
  });

  test('SKMT: breadcrumb tampilkan SKMT', async ({ page }) => {
    await gotoAndWait(page, '/skmt');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    await expect(bc).toContainText('SKMT');
  });

  test('klik breadcrumb Dashboard -> navigasi ke /', async ({ page }) => {
    await gotoAndWait(page, '/ptk');
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toBeVisible({ timeout: 5000 });
    const link = bc.getByRole('link', { name: 'Dashboard' });
    await expect(link).toBeVisible({ timeout: 3000 });
    await link.click();
    await expect(page).toHaveURL('/');
  });
});
