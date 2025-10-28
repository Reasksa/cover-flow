import { test, expect } from '@playwright/test';

function unique(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

test('Apply theme and toggle hover/shadow; verify on public profile', async ({ page }) => {
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

  // Add a link so preview/public has content
  await page.goto('/dashboard/links');
  await page.getByPlaceholder('Link title').fill('Preview Link');
  await page.getByPlaceholder('https://example.com').fill('https://example.com');
  await page.getByRole('button', { name: /Add/i }).click();
  await expect(page.getByText('Preview Link')).toBeVisible();

  // Appearance: select first theme and apply
  await page.goto('/dashboard/appearance');
  const themeCards = page.locator('button:has(div.h-16)');
  await expect(themeCards.first()).toBeVisible();
  await themeCards.first().click();
  await page.getByRole('button', { name: /Apply Theme/i }).click();

  // Ensure live preview renders
  await expect(page.getByText(/Live preview/i)).toBeVisible();

  // Toggle hover/shadow off and save appearance
  const hoverCheckbox = page.locator('label:has-text("Hover scale") input[type="checkbox"]');
  const shadowCheckbox = page.locator('label:has-text("Shadow on hover") input[type="checkbox"]');
  await hoverCheckbox.check(); // ensure known state
  await shadowCheckbox.check();
  await hoverCheckbox.uncheck();
  await shadowCheckbox.uncheck();
  await page.getByRole('button', { name: /Save Appearance/i }).click();

  // Visit public profile
  await page.goto(`/${username}`);
  const linkEl = page.getByRole('link', { name: /Preview Link/i }).first();
  await expect(linkEl).toBeVisible();

  // Verify hover classes removed (no 'hover:scale-105' or 'hover:shadow-lg' in class attribute)
  const classAttr = await linkEl.getAttribute('class');
  expect(classAttr || '').not.toMatch(/hover:scale-105/);
  expect(classAttr || '').not.toMatch(/hover:shadow-lg/);
});