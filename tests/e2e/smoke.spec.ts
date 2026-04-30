import { test, expect } from '@playwright/test';

test('homepage renders the placeholder', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /interactive physics labs/i })).toBeVisible();
});
