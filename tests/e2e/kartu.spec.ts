import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Kartu Siswa', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  // ─── API ────────────────────────────────────────────────────────

  test('API: kartu/list returns rows with has_kartu + has_kartu_back', async ({ page }) => {
    const res = await page.request.get('/api/siswa/kartu/list');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.rows.length).toBeGreaterThan(0);
    const first = data.rows[0];
    expect(first).toHaveProperty('has_kartu');
    expect(first).toHaveProperty('has_kartu_back');
    expect(first).toHaveProperty('nama');
    expect(first).toHaveProperty('kelas');
  });

  test('API: kartu-front returns valid PNG', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    const res = await page.request.get(`/api/siswa/${rows[0].id}/kartu-front`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('image/png');
    expect((await res.body()).length).toBeGreaterThan(1000);
  });

  test('API: kartu-back returns valid PNG', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    const res = await page.request.get(`/api/siswa/${rows[0].id}/kartu-back`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('image/png');
    expect((await res.body()).length).toBeGreaterThan(1000);
  });

  test('API: regenerate returns batch_id', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    const res = await page.request.post(`/api/siswa/${rows[0].id}/kartu-regenerate`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.batch_id).toBeTruthy();
  });

  test('API: queue status endpoint works', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    const regRes = await page.request.post(`/api/siswa/${rows[0].id}/kartu-regenerate`);
    const regData = await regRes.json();
    await expect(async () => {
      const sRes = await page.request.get(`/api/kartu/queue/${regData.batch_id}`);
      expect(sRes.ok()).toBeTruthy();
      const sData = await sRes.json();
      expect(['processing', 'completed']).toContain(sData.status);
    }).toPass({ timeout: 60_000, intervals: [2000] });
  });

  // ─── BATCH PAGE (grid) ─────────────────────────────────────────

  test('batch: heading dan grid tampil', async ({ page }) => {
    await gotoAndWait(page, '/siswa/kartu');
    await expect(page.getByRole('heading', { name: 'Kartu Siswa' })).toBeVisible({ timeout: 12000 });
    await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
  });

  test('batch: setiap kartu punya depan + belakang', async ({ page }) => {
    await gotoAndWait(page, '/siswa/kartu');
    await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
    const item = page.locator('.kartu-item').first();
    await expect(item.locator('.kartu-side')).toHaveCount(2);
    await expect(item.getByText('Depan', { exact: true })).toBeVisible();
    await expect(item.getByText('Belakang', { exact: true })).toBeVisible();
  });

  test('batch: front image loaded', async ({ page }) => {
    await gotoAndWait(page, '/siswa/kartu');
    await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
    const img = page.locator('.kartu-side').first().locator('img');
    const nw = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(nw).toBeGreaterThan(0);
  });

  test('batch: back image loaded', async ({ page }) => {
    await gotoAndWait(page, '/siswa/kartu');
    await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
    const img = page.locator('.kartu-side').nth(1).locator('img');
    await expect(async () => {
      const nw = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(nw).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
  });

  test('batch: regenerate button ada di setiap kartu', async ({ page }) => {
    await gotoAndWait(page, '/siswa/kartu');
    await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
    const btn = page.locator('.kartu-item').first().getByRole('button', { name: /regenerate/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  // ─── SINGLE PAGE ───────────────────────────────────────────────

  test('single: front card tampil dengan data sekolah', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    await gotoAndWait(page, `/siswa/${rows[0].id}/kartu`);
    await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 8000 });
    const card = page.locator('.card');
    await expect(card).toBeVisible();
    await expect(card.getByText('MTsN 2 KOLAKA UTARA')).toBeVisible();
    await expect(card.getByText('KEMENTERIAN AGAMA REPUBLIK INDONESIA')).toBeVisible();
  });

  test('single: toggle ke belakang', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    await gotoAndWait(page, `/siswa/${rows[0].id}/kartu`);
    await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /lihat belakang/i }).click();
    const backImg = page.locator('.card-back-img');
    await expect(backImg).toBeVisible({ timeout: 8000 });
    await expect(async () => {
      const nw = await backImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(nw).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /lihat depan/i })).toBeVisible();
  });

  test('single: toggle balik ke depan', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    await gotoAndWait(page, `/siswa/${rows[0].id}/kartu`);
    await page.getByRole('button', { name: /lihat belakang/i }).click();
    await expect(page.locator('.card-back-img')).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /lihat depan/i }).click();
    await expect(page.locator('.card')).toBeVisible();
    await expect(page.locator('.card').getByText('MTsN 2 KOLAKA UTARA')).toBeVisible();
  });

  test('single: tombol generate ulang ada', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    await gotoAndWait(page, `/siswa/${rows[0].id}/kartu`);
    await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 8000 });
    const btn = page.getByRole('button', { name: /generate ulang/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('single: tombol kembali ke profil', async ({ page }) => {
    const rows = ((await (await page.request.get('/api/siswa/kartu/list')).json())).rows;
    test.skip(rows.length === 0, 'No students');
    await gotoAndWait(page, `/siswa/${rows[0].id}/kartu`);
    await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 8000 });
    const link = page.getByRole('link', { name: /kembali ke profil/i });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
  });

  test('navigasi: profil -> kartu siswa', async ({ page }) => {
    await gotoAndWait(page, '/siswa');
    await page.locator('tbody tr a').first().click();
    await page.waitForURL(/\/siswa\/\d+\/profil/, { timeout: 8000 });
    const kartuLink = page.locator('a[href$="/kartu"]:not([data-slot])').filter({ hasText: 'Kartu Siswa' });
    await expect(kartuLink).toBeVisible({ timeout: 5000 });
    await kartuLink.click();
    await page.waitForURL(/\/siswa\/\d+\/kartu/, { timeout: 8000 });
    await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 5000 });
  });
});
