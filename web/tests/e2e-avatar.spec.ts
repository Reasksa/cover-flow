import { test, expect } from '@playwright/test';

function unique(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

test('Set Cloudinary avatar and verify transformation on public profile', async ({ page }) => {
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

  // Set avatar via API to a Cloudinary demo image; route should transform URL
  const cloudUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  const res = await page.request.patch('/api/me/avatar', {
    data: { avatarUrl: cloudUrl },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(String(data.avatar)).toContain('/image/upload/c_fill,g_face,r_max,w_192,h_192/');

  // Visit public profile and verify img src contains transformation segment
  await page.goto(`/${username}`);
  const img = page.locator('img[alt*="' + username + '"]');
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(String(src)).toContain('/image/upload/c_fill,g_face,r_max,w_192,h_192/');
});