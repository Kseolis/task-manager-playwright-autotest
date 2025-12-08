import { test, expect } from '@playwright/test';

test('приложение успешно рендерится', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/qa-auto-engineer-javascript-project-90/);
  await expect(page.locator('input[name="username"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

