import { test, expect, type Page } from '@playwright/test';

const THEMES = ['light', 'dark'] as const;

async function gotoShowcase(page: Page, theme: 'light' | 'dark') {
  await page.goto(`/__visual/primitives?theme=${theme}`);
  await page.evaluate((next) => document.documentElement.setAttribute('data-theme', next), theme);
  await page.waitForSelector('[data-testid="showcase-progress"]');
  await page.evaluate(() => document.fonts.ready);
}

async function snap(page: Page, testId: string, name: string) {
  const locator = page.getByTestId(testId);
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toHaveScreenshot(name, { animations: 'disabled' });
}

for (const theme of THEMES) {
  test.describe(`primitives (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await gotoShowcase(page, theme);
    });

    test('Progress: default / half / full / md size', async ({ page }) => {
      await snap(page, 'progress-empty', `progress-empty-${theme}.png`);
      await snap(page, 'progress-half', `progress-half-${theme}.png`);
      await snap(page, 'progress-full', `progress-full-${theme}.png`);
      await snap(page, 'progress-md', `progress-md-${theme}.png`);
    });

    test('Checkbox: default / checked / focus / invalid / disabled', async ({ page }) => {
      await snap(page, 'checkbox-default', `checkbox-default-${theme}.png`);
      await snap(page, 'checkbox-checked', `checkbox-checked-${theme}.png`);

      // Focus state on the unchecked interactive checkbox.
      await page.getByTestId('checkbox-interactive').locator('input').focus();
      await snap(page, 'checkbox-interactive', `checkbox-focus-${theme}.png`);
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      // Focus + checked state.
      await page.getByTestId('checkbox-prechecked').locator('input').focus();
      await snap(page, 'checkbox-prechecked', `checkbox-focus-checked-${theme}.png`);
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await snap(page, 'checkbox-invalid', `checkbox-invalid-${theme}.png`);
      await snap(page, 'checkbox-disabled', `checkbox-disabled-${theme}.png`);
      await snap(page, 'checkbox-disabled-checked', `checkbox-disabled-checked-${theme}.png`);
    });

    test('Select: default / hover / focus / invalid / disabled / sm', async ({ page }) => {
      await snap(page, 'select-default', `select-default-${theme}.png`);

      // Hover.
      await page.getByTestId('select-default').locator('select').hover();
      await snap(page, 'select-default', `select-hover-${theme}.png`);
      await page.locator('body').hover({ position: { x: 0, y: 0 } });

      // Focus.
      await page.getByTestId('select-default').locator('select').focus();
      await snap(page, 'select-default', `select-focus-${theme}.png`);
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await snap(page, 'select-sm', `select-sm-${theme}.png`);
      await snap(page, 'select-invalid', `select-invalid-${theme}.png`);
      await snap(page, 'select-disabled', `select-disabled-${theme}.png`);
    });

    test('FileDropzone: empty / hover / focus / with-value / disabled', async ({ page }) => {
      await snap(page, 'dropzone-empty', `dropzone-empty-${theme}.png`);

      // Hover state on the dashed target.
      await page.getByTestId('dropzone-empty').locator('.file-dropzone-target').hover();
      await snap(page, 'dropzone-empty', `dropzone-hover-${theme}.png`);
      await page.locator('body').hover({ position: { x: 0, y: 0 } });

      // Focus state via the hidden input.
      await page.getByTestId('dropzone-empty').locator('input[type="file"]').focus();
      await snap(page, 'dropzone-empty', `dropzone-focus-${theme}.png`);
      await page.locator('body').click({ position: { x: 0, y: 0 } });

      await snap(page, 'dropzone-with-value', `dropzone-with-value-${theme}.png`);
      await snap(page, 'dropzone-disabled', `dropzone-disabled-${theme}.png`);
    });
  });
}
