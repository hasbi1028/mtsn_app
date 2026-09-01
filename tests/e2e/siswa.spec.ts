import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Siswa', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await gotoAndWait(page, '/siswa');
  });

  test('list siswa tampil dengan data', async ({ page }) => {
    await expect(page.getByText('Data Siswa').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });
  });

  test('rekap kelas tampil', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Kelas/, { timeout: 5000 });
  });

  test('filter by q param', async ({ page }) => {
    await page.goto('/siswa?q=Abdul');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });
  });

  test('klik nama siswa -> profil', async ({ page }) => {
    const firstLink = page.locator('tbody tr a').first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    await firstLink.click();
    await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
    await expect(page.getByRole('heading', { name: 'Profil Siswa' })).toBeVisible({ timeout: 5000 });
  });

  test('profil siswa tampilkan asal_sekolah + NPSN', async ({ page }) => {
    const firstLink = page.locator('tbody tr a').first();
    await expect(firstLink).toBeVisible({ timeout: 5000 });
    await firstLink.click();
    await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
    await expect(page.getByText('Asal Sekolah', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('NPSN Asal Sekolah')).toBeVisible({ timeout: 5000 });
  });
});
