import { expect, test } from '@playwright/test';

test('scrollwheel on worksheet and simulation panes moves page scroll', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw?layout=side');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.layout-pane-worksheet').hover();
  await page.mouse.wheel(0, 700);
  const afterWorksheet = await page.evaluate(() => window.scrollY);
  expect(afterWorksheet).toBeGreaterThan(0);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.layout-pane-simulation').hover();
  await page.mouse.wheel(0, 700);
  const afterSimulation = await page.evaluate(() => window.scrollY);
  expect(afterSimulation).toBeGreaterThan(0);
});
