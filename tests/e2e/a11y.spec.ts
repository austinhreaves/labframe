import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('axe accessibility checks', () => {
  test('catalog page has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /LabFrame/i }).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('course catalog page has no axe violations', async ({ page }) => {
    await page.goto('/c/phy132');
    // exact: the "Up next ... coming to PHY 132" eyebrow is also a heading.
    await expect(page.getByRole('heading', { name: 'PHY 132', exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('sims page has no axe violations', async ({ page }) => {
    await page.goto('/sims');
    await expect(page.getByRole('heading', { name: /just explore/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
