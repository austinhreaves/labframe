import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Whole-page (nothing excluded) accessibility scan of a real lab route. The
// suite storageState seeds a student name, so the on-load name gate does not
// appear and the lab content renders. snellsLaw exercises the high-risk
// surfaces: derived-column table headers (.table-column-formula contrast) and
// an equation-entry calculation section (MathLive's role="textbox" keyboard
// sink, which needs an accessible name). Keep this scan unscoped so future
// regressions on the lab page are caught.
test('lab page has no axe violations (whole page)', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  // Wait for the lazily imported equation editor to mount and MathLive to label
  // its shadow-DOM sink, so the scan reflects the settled DOM.
  const mathField = page.locator('math-field').first();
  await expect(mathField).toBeAttached();
  await expect
    .poll(() =>
      mathField.evaluate(
        (el) =>
          el.shadowRoot
            ?.querySelector('.ML__keyboard-sink[role="textbox"]')
            ?.getAttribute('aria-label') ?? null,
      ),
    )
    .not.toBeNull();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
