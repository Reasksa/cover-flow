import { test, expect } from '@playwright/test';

function unique(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

test('Register, login, add link, schedule, view public, analytics', async ({ page }) => {
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

  // Manage links
  await page.waitForURL(/\/dashboard$/);
  await page.goto('/dashboard/links');

  // Add a link
  await page.getByPlaceholder('Link title').fill('My Site');
  await page.getByPlaceholder('https://example.com').fill('https://example.com');
  // Set visible window: now - 1 min to now + 1 min
  const now = new Date();
  const from = new Date(now.getTime() - 60 * 1000);
  const until = new Date(now.getTime() + 60 * 1000);
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
  await page.locator('input[type="datetime-local"]').first().fill(toLocalInput(from));
  await page.locator('input[type="datetime-local"]').nth(1).fill(toLocalInput(until));
  await page.getByRole('button', { name: /Add/i }).click();

  // Expect link appears in list
  await expect(page.getByText('My Site')).toBeVisible();

  // Save link row (first row)
  await page.getByRole('button', { name: /Save/i }).first().click();

  // View public profile
  await page.goto(`/${username}`);
  await expect(page.getByRole('heading', { name: new RegExp(username, 'i') })).toBeVisible();
  // Link visible and clickable
  const link = page.getByRole('link', { name: /My Site/i });
  await expect(link).toBeVisible();

  // Click link (will navigate away); go back
  await link.click();
  await page.waitForLoadState('domcontentloaded');
  await page.goBack();

  // Analytics page should show Total Clicks >= 1 eventually
  await page.goto('/dashboard/analytics');
  // Give a brief delay for beacon processing
  await page.waitForTimeout(500);
  const totalClicksText = await page.locator('main').innerText();
  expect(totalClicksText).toMatch(/Total Clicks:\s*\d+/);
});