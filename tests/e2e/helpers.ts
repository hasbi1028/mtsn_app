import { type Page } from '@playwright/test';

const API_URL = 'http://localhost:3730';

export async function loginAs(page: Page, username = 'hasbi', password = 'admin123') {
  const res = await page.request.post(`${API_URL}/api/login`, {
    data: { username, password },
  });
  if (!res.ok()) throw new Error('API login failed: ' + (await res.text()));
  const body = await res.json();
  const token = body.token;
  await page.context().addCookies([
    { name: 'mtsn_session', value: token, url: 'http://localhost:3720', sameSite: 'Lax' },
  ]);
}

export async function loginViaUI(page: Page, username = 'hasbi', password = 'admin123') {
  await page.goto('/login');
  await page.getByPlaceholder('username').fill(username);
  await page.locator('#password').fill(password);
  await Promise.all([
    page.waitForURL('**/', { timeout: 10000 }).catch(() => page.waitForLoadState('networkidle')),
    page.getByRole('button', { name: /^Masuk$/ }).click(),
  ]);
  await page.waitForTimeout(1000);
}

export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}
