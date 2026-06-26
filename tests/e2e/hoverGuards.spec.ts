import { test, expect } from '@playwright/test';

// Track T-B: hover-only styles are gated behind @media (hover: hover) (or reset
// under @media (hover: none)) so a tap on a touch device does not leave a
// "phantom" stuck hover highlight. The lab header "About" button is a plain
// <button>, which gains a darker border on hover via the gated generic rule.

const LAB_URL = '/c/phy132/chargeBuildup';
const TABLET = { width: 768, height: 1024 };

test('touch-primary tablet (768x1024) shows no phantom hover on buttons', async ({
  browser,
  browserName,
}) => {
  // hover:none / pointer:coarse emulation via isMobile is Chromium-only.
  test.skip(browserName !== 'chromium', 'isMobile emulation is Chromium-only');

  const context = await browser.newContext({
    baseURL: 'http://localhost:5173',
    viewport: TABLET,
    isMobile: true,
    hasTouch: true,
    storageState: 'tests/e2e/onboarded.storage.json',
  });
  const page = await context.newPage();
  try {
    await page.goto(LAB_URL);

    // The emulated device is touch-primary, so hover guards apply.
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);

    const aboutButton = page.getByRole('button', { name: 'About' });
    await aboutButton.waitFor();
    const base = await aboutButton.evaluate((el) => getComputedStyle(el).borderColor);
    await aboutButton.hover();
    const afterHover = await aboutButton.evaluate((el) => getComputedStyle(el).borderColor);
    expect(afterHover).toBe(base);
  } finally {
    await context.close();
  }
});

test('desktop pointer still gets the button hover affordance', async ({ page }) => {
  await page.goto(LAB_URL);

  const aboutButton = page.getByRole('button', { name: 'About' });
  await aboutButton.waitFor();
  const base = await aboutButton.evaluate((el) => getComputedStyle(el).borderColor);
  await aboutButton.hover();
  // On a hover-capable pointer the gated rule applies and the border darkens.
  await expect
    .poll(() => aboutButton.evaluate((el) => getComputedStyle(el).borderColor))
    .not.toBe(base);
});
