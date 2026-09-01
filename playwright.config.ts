import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 3720);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL,
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
    command: 'bun run dev -- --port 3720 --host 0.0.0.0',
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      API_BASE: 'http://localhost:3730',
      ORIGIN: baseURL,
    },
  },
});
