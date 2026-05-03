import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('axe accessibility checks', () => {
  test('catalog page has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /interactive physics labs/i }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('course catalog page has no axe violations', async ({ page }) => {
    await page.goto('/c/phy132');
    await expect(page.getByRole('heading', { name: /phy 132/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
