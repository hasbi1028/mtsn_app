import { type Page } from '@playwright/test';

export async function loginAs(page: Page, username = 'hasbi', password = 'admin123') {
  await page.goto('/login');
  await page.getByPlaceholder('username').fill(username);
  await page.locator('#password').fill(password);
  await Promise.all([
    page.waitForURL('**/', { timeout: 10000 }).catch(() => page.waitForLoadState('networkidle')),
    page.getByRole('button', { name: /^Masuk$/ }).click(),
  ]);
  await page.waitForTimeout(500);
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
