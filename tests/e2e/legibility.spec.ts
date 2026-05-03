import { expect, test, type Page } from '@playwright/test';

const whiteishColors = new Set(['rgb(255, 255, 255)', 'rgb(254, 254, 254)', 'rgb(255, 255, 254)', 'rgb(254, 255, 255)']);

async function assertUnpressedButtonLegible(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: /lab 6: snellslaw/i }).first().click();
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  const unpressedButton = page.locator('button[aria-pressed="false"]').first();
  await expect(unpressedButton).toBeVisible();

  const computedColor = await unpressedButton.evaluate((button) => window.getComputedStyle(button).color);
  expect(whiteishColors.has(computedColor)).toBe(false);
}

test.describe('legibility in forced browser color schemes', () => {
  test.describe('dark color scheme', () => {
    test.use({ colorScheme: 'dark' });
    test('unpressed button text is not white-ish', async ({ page }) => {
      await assertUnpressedButtonLegible(page);
    });
  });

  test.describe('light color scheme', () => {
    test.use({ colorScheme: 'light' });
    test('unpressed button text is not white-ish', async ({ page }) => {
      await assertUnpressedButtonLegible(page);
    });
  });
});
