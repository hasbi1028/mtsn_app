import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

const POLA_ARSIP = /^simad-backup-\d{8}-\d{6}-(ui|cron|pre-restore)\.zip$/;

test.describe('Backup & Restore', () => {
	test('tanpa login diarahkan ke /login', async ({ page }) => {
		await page.goto('/admin/backup');
		await expect(page).toHaveURL(/\/login/);
	});

	test('endpoint unduh arsip menolak permintaan tanpa autentikasi', async ({ request }) => {
		const res = await request.get('/api/backup/simad-backup-20260101-000000-cron.zip/download');
		expect(res.status()).toBe(401);
	});

	test('admin membuat, mengunduh, lalu menghapus arsip', async ({ page }) => {
		await loginAs(page);
		await page.goto('/admin/backup');
		await expect(page.getByRole('heading', { name: 'Backup & Restore' })).toBeVisible();
		await page.screenshot({ path: 'screenshots/backup-halaman.png', fullPage: true });

		// 1. buat backup baru
		await page.getByRole('button', { name: /Buat Backup Sekarang/i }).click();
		await expect(page.getByText(/Backup simad-backup-.*selesai/i).first()).toBeVisible({ timeout: 120_000 });

		// 2. baris arsip manual (source ui) muncul lengkap dengan kolom isi
		const baris = page.locator('table tbody tr').filter({ hasText: '-ui.zip' });
		await expect(baris.first()).toBeVisible({ timeout: 30_000 });
		await expect(baris.first()).toContainText(/siswa/i);

		// 3. unduh arsip
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			baris.first().locator('a[href^="/api/backup/"]').click()
		]);
		expect(download.suggestedFilename()).toMatch(POLA_ARSIP);

		// 4. hapus arsip yang baru dibuat (bersih-bersih setelah uji)
		await baris.first().getByTitle('Hapus').click();
		await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus' }).click();
		await expect(page.getByText(/dihapus/i).first()).toBeVisible({ timeout: 30_000 });
		await expect(page.locator('table tbody tr').filter({ hasText: '-ui.zip' })).toHaveCount(0, {
			timeout: 30_000
		});
	});

	test('role guru ditolak (tanpa daftar arsip)', async ({ page }) => {
		// Akun guru kini berbasis NIP (password awal 2026qwerty!) dan wajib ganti sandi.
		await loginAs(page, '199711012025211001', '2026qwerty!');
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.goto('/admin/backup', { waitUntil: 'domcontentloaded' });
		await page.waitForLoadState('networkidle').catch(() => {});
		// Apa pun hasilnya (dipaksa ganti sandi / ditolak), guru tidak boleh melihat kontrol backup.
		await expect(page.getByRole('button', { name: /Buat Backup Sekarang/i })).toHaveCount(0);
		await expect(page.getByText(/Belum ada arsip|Daftar Arsip/i)).toHaveCount(0);
	});
});
