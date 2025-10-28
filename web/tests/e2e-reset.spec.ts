import { test, expect } from '@playwright/test';

function unique(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

test('Forgot password and reset flow works', async ({ page }) => {
  const email = `${unique('user')}@example.com`;
  const username = unique('user');
  const password = 'secret123';
  const newPassword = 'newsecret456';

  // Register
  await page.goto('/register');
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByPlaceholder('username').fill(username);
  await page.getByPlaceholder('choose a secure password').fill(password);
  await page.getByRole('button', { name: /Register/i }).click();

  // Trigger forgot password (email may not be delivered, so we'll fetch token via test route)
  await page.goto('/forgot');
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByRole('button', { name: /Send reset link/i }).click();

  // Retrieve token via test route
  const tokRes = await page.request.get(`/api/test/password-token?email=${encodeURIComponent(email)}`);
  expect(tokRes.ok()).toBeTruthy();
  const { token } = await tokRes.json();
  expect(token).toBeTruthy();

  // Reset password with token
  await page.goto(`/reset?token=${token}`);
  await page.getByPlaceholder('New secure password').fill(newPassword);
  await page.getByRole('button', { name: /Update password/i }).click();
  await expect(page.getByText(/Password updated/i)).toBeVisible();

  // Login with new password
  await page.goto('/login');
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(newPassword);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL(/\/dashboard$/);
});