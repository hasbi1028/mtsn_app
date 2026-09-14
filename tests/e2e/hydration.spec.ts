
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// Deteksi hydration errors saat buka route langsung + refresh
test.describe('Hydration', () => {
  test('buka route langsung (SSR) tidak ada hydrate error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => {
      const t = m.text();
      if (t.includes('Failed to hydrate') || t.includes('hydration mismatch') || t.toUpperCase().includes('HYDRATION')) {
        errors.push('CONSOLE: ' + t);
      }
    });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await loginAs(page);
    await page.goto('/admin/ptk', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('errors after SSR /ptk:', JSON.stringify(errors));
    expect(errors).toEqual([]);

    // Cek breadcrumb aktif
    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toContainText('PTK', { timeout: 5000 });
  });

  test('refresh (F5) tidak ada hydrate error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => {
      const t = m.text();
      if (t.includes('Failed to hydrate') || t.includes('hydration mismatch') || t.toUpperCase().includes('HYDRATION')) {
        errors.push('CONSOLE: ' + t);
      }
    });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await loginAs(page);
    await page.goto('/admin/siswa', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // reload (refresh)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('errors after refresh /siswa:', JSON.stringify(errors));
    expect(errors).toEqual([]);

    const bc = page.locator('nav[aria-label="breadcrumb"]').first();
    await expect(bc).toContainText('Siswa', { timeout: 5000 });
  });

  test('dashboard tidak ada hydrate error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => {
      const t = m.text();
      if (t.includes('Failed to hydrate') || t.includes('hydration mismatch') || t.toUpperCase().includes('HYDRATION')) {
        errors.push('CONSOLE: ' + t);
      }
    });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await loginAs(page);
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('errors on /:', JSON.stringify(errors));
    expect(errors).toEqual([]);
  });
});
