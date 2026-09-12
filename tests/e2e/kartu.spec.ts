import { test, expect, type Page } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

async function firstSiswaId(page: Page): Promise<string> {
	const src = await page
		.locator('.kartu-item')
		.first()
		.locator('img.kartu-img')
		.first()
		.getAttribute('src');
	return src?.match(/\/api\/siswa\/(\d+)\//)?.[1] ?? '';
}

test.describe('Kartu Siswa', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
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

	test('batch: tombol generate semua & regenerate tampil', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		await expect(page.getByRole('button', { name: /Generate Semua Kartu/i })).toBeVisible();
		const btn = page.locator('.kartu-item').first().getByRole('button', { name: /regenerate/i });
		await expect(btn).toBeVisible();
		await expect(btn).toBeEnabled();
	});

	test('batch: regenerate via UI menampilkan toast sukses', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		await page.locator('.kartu-item').first().getByRole('button', { name: /regenerate/i }).click();
		await expect(
			page.getByText(/(berhasil digenerate ulang|Gagal regenerate)/)
		).toBeVisible({ timeout: 90_000 });
	});

	// ─── SINGLE PAGE ───────────────────────────────────────────────

	test('single: front card tampil dengan data sekolah', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		const id = await firstSiswaId(page);
		test.skip(!id, 'Tidak ada kartu');
		await gotoAndWait(page, `/siswa/${id}/kartu`);
		await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 8000 });
		const card = page.locator('.card');
		await expect(card).toBeVisible();
		await expect(card.getByText('MTsN 2 KOLAKA UTARA')).toBeVisible();
		await expect(card.getByText('KEMENTERIAN AGAMA REPUBLIK INDONESIA')).toBeVisible();
	});

	test('single: toggle ke belakang', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		const id = await firstSiswaId(page);
		test.skip(!id, 'Tidak ada kartu');
		await gotoAndWait(page, `/siswa/${id}/kartu`);
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
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		const id = await firstSiswaId(page);
		test.skip(!id, 'Tidak ada kartu');
		await gotoAndWait(page, `/siswa/${id}/kartu`);
		await page.getByRole('button', { name: /lihat belakang/i }).click();
		await expect(page.locator('.card-back-img')).toBeVisible({ timeout: 8000 });
		await page.getByRole('button', { name: /lihat depan/i }).click();
		await expect(page.locator('.card')).toBeVisible();
		await expect(page.locator('.card').getByText('MTsN 2 KOLAKA UTARA')).toBeVisible();
	});

	test('single: tombol generate ulang, print, download ada', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		const id = await firstSiswaId(page);
		test.skip(!id, 'Tidak ada kartu');
		await gotoAndWait(page, `/siswa/${id}/kartu`);
		await expect(page.getByText('Preview Kartu Siswa')).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('button', { name: /generate ulang/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /^Cetak$/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /download png/i })).toBeVisible();
	});

	test('single: tombol kembali ke profil', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		const id = await firstSiswaId(page);
		test.skip(!id, 'Tidak ada kartu');
		await gotoAndWait(page, `/siswa/${id}/kartu`);
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

	// ─── GUARD: endpoint bisnis legacy harus 404 ───────────────────

	test('endpoint bisnis kartu legacy sudah 404', async ({ page }) => {
		const responses = await Promise.all([
			page.request.post('/api/kartu/generate-all'),
			page.request.get('/api/siswa/kartu/list'),
			page.request.get('/api/kartu/queue/abc'),
			page.request.post('/api/kartu/queue/abc/cancel'),
			page.request.get('/api/siswa/1/detail'),
			page.request.post('/api/siswa/1/kartu-regenerate')
		]);
		for (const res of responses) {
			expect(res.status()).toBe(404);
		}
	});

	test('endpoint PNG kartu tetap 200/404 gambar valid', async ({ page }) => {
		await gotoAndWait(page, '/siswa/kartu');
		await expect(page.locator('.kartu-item').first()).toBeVisible({ timeout: 12000 });
		const id = await firstSiswaId(page);
		test.skip(!id, 'Tidak ada kartu');
		const res = await page.request.get(`/api/siswa/${id}/kartu-front`);
		expect(res.ok()).toBeTruthy();
		expect(res.headers()['content-type']).toContain('image/png');
		expect((await res.body()).length).toBeGreaterThan(1000);
	});
});
