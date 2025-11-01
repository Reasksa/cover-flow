import { test, expect } from '@playwright/test';

test('landing page loads and navigates', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /All Your Links\. One Place\./i })).toBeVisible();

  await page.getByRole('link', { name: /Pricing/i }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole('heading', { name: /Pricing/i })).toBeVisible();
});

test('auth pages render', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Login/i })).toBeVisible();

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();

  await page.goto('/forgot');
  await expect(page.getByRole('heading', { name: /Forgot password/i })).toBeVisible();
});