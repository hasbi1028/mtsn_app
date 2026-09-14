import { test, expect } from '@playwright/test';
import { loginAs, gotoAndWait } from './helpers';

test.describe('Struktur Organisasi (spec 029)', () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page);
	});

	test('029-01 halaman daftar unit + rekap tampil', async ({ page }) => {
		await gotoAndWait(page, '/admin/struktur');
		await expect(page.getByRole('heading', { name: /Struktur Organisasi/i }).first()).toBeVisible({ timeout: 8000 });
		await expect(page.getByText(/Pegawai di struktur/i).first()).toBeVisible({ timeout: 8000 });
		await expect(page.getByText(/Wali kelas vs rombel/i).first()).toBeVisible({ timeout: 8000 });
	});

	test('029-02 admin menambah unit lalu menghapusnya', async ({ page }) => {
		page.on('dialog', (d) => d.accept());
		await gotoAndWait(page, '/admin/struktur');
		await page.getByRole('button', { name: /Tambah Unit/i }).click();
		await page.getByLabel('Kode').fill('uji-otomatis');
		await page.getByLabel('Nama unit').fill('Unit Uji Otomatis');
		await page.getByLabel('Kolom').fill('5');
		await page.getByRole('button', { name: /^Simpan$/ }).click();
		await expect(page.getByText('Unit Uji Otomatis').first()).toBeVisible({ timeout: 8000 });

		// bersihkan: hapus unit uji (baris = kartu unit yang memuat namanya)
		const baris = page
			.locator('div.rounded-lg.border')
			.filter({ hasText: 'Unit Uji Otomatis' })
			.first();
		await baris.getByRole('button', { name: /Hapus/i }).first().click();
		await expect(page.getByText('Unit Uji Otomatis')).toHaveCount(0, { timeout: 8000 });
	});

	test('029-03 halaman kelola anggota unit dapat dibuka', async ({ page }) => {
		await gotoAndWait(page, '/admin/struktur');
		const tautan = page
			.locator('a[href*="/admin/struktur/"]')
			.filter({ hasText: /Kepala Madrasah|Ketua Komite/i })
			.first();
		await expect(tautan).toBeVisible({ timeout: 8000 });
		await tautan.click();
		await page.waitForTimeout(1000);
		await expect(page.getByRole('button', { name: /Tambah Anggota/i })).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('button', { name: /Daftar Unit/i })).toBeVisible({ timeout: 8000 });
	});

	test('029-04 halaman bagan admin tampil', async ({ page }) => {
		await gotoAndWait(page, '/admin/struktur/bagan');
		await expect(page.getByRole('heading', { name: /Bagan/i }).first()).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('link', { name: /Unduh PNG/i })).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('link', { name: /Cetak/i }).first()).toBeVisible({ timeout: 8000 });
	});

	test('029-05 halaman cetak memuat kanvas & @page spanduk', async ({ page }) => {
		const res = await page.request.get('/admin/struktur/bagan/cetak/spanduk-2x1');
		expect(res.status()).toBe(200);
		const html = await res.text();
		expect(html).toContain('@page');
		expect(html).toMatch(/529\.17mm\s+264\.58mm/);
		expect(html).not.toMatch(/data-slot="sidebar"/);
	});

	test('029-06 unduh PNG bagan (endpoint biner)', async ({ page }) => {
		const res = await page.request.get('/api/struktur/bagan.png');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('image/png');
		expect((await res.body()).length).toBeGreaterThan(20_000);
	});

	test('029-07 bagan publik tampil & tanpa NIP', async ({ page, request }) => {
		// pastikan publik aktif dulu lewat form pengaturan
		await gotoAndWait(page, '/admin/struktur/bagan');
		const toggle = page.getByLabel(/halaman publik/i);
		if ((await toggle.isChecked()) === false) {
			await toggle.check();
			await page.getByRole('button', { name: /^Simpan pengaturan$/i }).click();
			await page.waitForTimeout(1200);
		}
		const res = await request.get('/profil/struktur');
		expect(res.status()).toBe(200);
		const html = await res.text();
		expect(html).not.toMatch(/NIP\.\s*\d/);
		expect(html).toMatch(/STRUKTUR ORGANISASI/i);
	});

	test('029-08 belum login -> redirect ke login', async ({ page }) => {
		await page.context().clearCookies();
		await page.goto('/admin/struktur');
		await expect(page).toHaveURL(/\/login/);
	});

	test('029-09 tautan di /guru & menu publik', async ({ page }) => {
		await gotoAndWait(page, '/guru');
		await expect(page.getByRole('link', { name: /Lihat Struktur Organisasi/i })).toBeVisible({ timeout: 8000 });
		await gotoAndWait(page, '/');
		await expect(page.locator('header').getByText(/Struktur Organisasi/i).first()).toBeAttached({
			timeout: 8000
		});
	});

	test('029-10 alias /struktur -> /profil/struktur (308)', async ({ request }) => {
		const res = await request.get('/struktur', { maxRedirects: 0 });
		expect([301, 302, 307, 308]).toContain(res.status());
		expect(res.headers()['location']).toContain('/profil/struktur');
	});
});
