import { test, expect } from '@playwright/test';

function unique(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

test('Click on public profile increments analytics summary', async ({ page }) => {
  const email = `${unique('user')}@example.com`;
  const username = unique('user');
  const password = 'secret123';

  // Register
  await page.goto('/register');
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByPlaceholder('username').fill(username);
  await page.getByPlaceholder('choose a secure password').fill(password);
  await page.getByRole('button', { name: /Register/i }).click();

  // Login
  await page.goto('/login');
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(/\/dashboard$/);

  // Add a link (no scheduling, active)
  await page.goto('/dashboard/links');
  await page.getByPlaceholder('Link title').fill('Analytics Link');
  await page.getByPlaceholder('https://example.com').fill('https://example.com');
  await page.getByRole('button', { name: /Add/i }).click();
  await expect(page.getByText('Analytics Link')).toBeVisible();

  // Visit public profile and click link
  await page.goto(`/${username}`);
  const linkEl = page.getByRole('link', { name: /Analytics Link/i });
  await expect(linkEl).toBeVisible();
  await linkEl.click();
  // Navigate back
  await page.waitForLoadState('domcontentloaded');
  await page.goBack();

  // Query analytics summary API (range 7 days) and expect totalClicks >= 1
  const response = await page.request.get('/api/analytics/summary?range=7');
  expect(response.ok()).toBeTruthy();
  const summary = await response.json();
  expect(summary.totalClicks).toBeGreaterThanOrEqual(1);
});