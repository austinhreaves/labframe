import { test, expect } from '@playwright/test';

// The MathLive virtual keyboard must stay opt-in: policy is "manual" so it never
// auto-pops on focus, and the editor's own toggle button summons/dismisses it.
test('equation editor keyboard is manual and toggles on demand', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  // Wait for MathLive to finish its dynamic import and mount the first editor.
  const mathField = page.locator('math-field').first();
  await expect(mathField).toBeVisible();

  const keyboardVisible = () =>
    page.evaluate(
      () =>
        (window as unknown as { mathVirtualKeyboard?: { visible: boolean } }).mathVirtualKeyboard
          ?.visible,
    );

  // Focusing the field must NOT summon the keyboard (the old "half the screen" bug).
  await mathField.focus();
  expect(await keyboardVisible()).toBeFalsy();

  // The toggle button summons it...
  await page.getByRole('button', { name: 'On-screen keyboard' }).first().click();
  expect(await keyboardVisible()).toBeTruthy();

  // ...and dismisses it.
  await page.getByRole('button', { name: 'Hide keyboard' }).first().click();
  expect(await keyboardVisible()).toBeFalsy();
});
