import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  test(`primitives showcase has no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`/__visual/primitives?theme=${theme}`);
    await page.evaluate((next) => document.documentElement.setAttribute('data-theme', next), theme);
    await page.waitForSelector('[data-testid="showcase-progress"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
