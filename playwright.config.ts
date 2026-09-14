import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CATATAN FLAKY: saat mesin sedang sibuk, Chromium kadang mati di tengah tes
  // ("Target page, context or browser has been closed") dan tes yang gagal
  // berbeda-beda tiap run. Sudah dicoba workers 8/4/2 — semuanya bisa kena, jadi
  // ini bukan soal jumlah worker. Spec yang sama LULUS penuh bila dijalankan
  // terpisah. Kalau suite merah tanpa alasan jelas, jalankan spec terkait sendiri
  // dulu sebelum menyimpulkan ada regresi.
  workers: 4,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
