import { test, expect } from '@playwright/test';

test.describe('Public Website', () => {
	test.describe('Public pages are accessible without login', () => {
		const publicPages = [
			{ path: '/profil', title: 'Profil' },
			{ path: '/profil/visi-misi', title: 'Visi' },
			{ path: '/guru', title: 'Guru' },
			{ path: '/ppdb', title: 'PPDB' },
			{ path: '/berita', title: 'Berita' },
			{ path: '/fasilitas', title: 'Fasilitas' },
			{ path: '/kontak', title: 'Kontak' },
		];

		for (const page of publicPages) {
			test(`${page.path} loads without login`, async ({ page: p }) => {
				await p.goto(page.path, { waitUntil: 'domcontentloaded' });
				await expect(p.locator('body')).toContainText(page.title);
				await expect(p).not.toHaveURL(/login/);
			});
		}
	});

	test.describe('Protected pages redirect to login', () => {
		const protectedPages = ['/admin/dashboard', '/admin/ptk', '/admin/siswa', '/admin/rombel'];

		for (const path of protectedPages) {
			test(`${path} redirects to login`, async ({ page }) => {
				await page.goto(path);
				await expect(page).toHaveURL(/login/);
			});
		}
	});

	test.describe('Navigation', () => {
		test('navbar contains all public links', async ({ page }) => {
			await page.goto('/profil');
			const nav = page.locator('nav').first();
			for (const label of ['Profil', 'Guru', 'PPDB', 'Berita', 'Kontak']) {
				await expect(nav).toContainText(label);
			}
		});

		test('login button links to /login', async ({ page }) => {
			await page.goto('/profil');
			const loginLink = page.locator('a[href="/login"]');
			await expect(loginLink).toBeVisible();
		});

		test('mobile menu toggles', async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto('/profil');
			const menuButton = page.locator('button[aria-label="Menu"]');
			await expect(menuButton).toBeVisible();
		});
	});

	test.describe('Profil page', () => {
		test('shows school info', async ({ page }) => {
			await page.goto('/profil');
			await expect(page.locator('body')).toContainText('MTsN 2 Kolaka Utara');
			await expect(page.locator('body')).toContainText('Profil Sekolah');
		});

		test('has visi-misi link', async ({ page }) => {
			await page.goto('/profil');
			await expect(page.locator('a[href="/profil/visi-misi"]').first()).toBeAttached();
		});
	});

	test.describe('Guru page', () => {
		test('shows list of guru', async ({ page }) => {
			await page.goto('/guru');
			await expect(page.locator('body')).toContainText('Daftar Guru');
		});
	});

	test.describe('PPDB page', () => {
		test('shows PPDB info', async ({ page }) => {
			await page.goto('/ppdb');
			await expect(page.locator('body')).toContainText('Penerimaan Peserta Didik Baru');
		});

		test('shows registration requirements', async ({ page }) => {
			await page.goto('/ppdb');
			await expect(page.locator('body')).toContainText('Persyaratan');
		});

		test('shows schedule', async ({ page }) => {
			await page.goto('/ppdb');
			await expect(page.locator('body')).toContainText('Jadwal');
		});
	});

	test.describe('Kontak page', () => {
		test('shows contact info', async ({ page }) => {
			await page.goto('/kontak', { waitUntil: 'domcontentloaded' });
			await expect(page.locator('body')).toContainText('Kontak');
			await expect(page.locator('body')).toContainText('info@mtsn2kolut.sch.id');
		});
	});

	test.describe('Footer', () => {
		test('has copyright', async ({ page }) => {
			await page.goto('/profil');
			await expect(page.locator('footer')).toContainText('MTsN 2 Kolaka Utara');
		});

		test('has navigation links', async ({ page }) => {
			await page.goto('/profil');
			const footer = page.locator('footer');
			await expect(footer.locator('a[href="/profil"]')).toBeVisible();
			await expect(footer.locator('a[href="/ppdb"]')).toBeVisible();
			await expect(footer.locator('a[href="/guru"]')).toBeVisible();
		});
	});
});
