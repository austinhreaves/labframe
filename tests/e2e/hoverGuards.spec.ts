import { test, expect } from '@playwright/test';

// Track T-B: hover-only styles are gated behind @media (hover: hover) (or reset
// under @media (hover: none)) so a tap on a touch device does not leave a
// "phantom" stuck hover highlight. The "Start fresh" toolbar button is a plain
// bordered <button>, which gains a darker border on hover via the gated generic
// rule, so it stands in for the toolbar's plain buttons here. (It is always
// visible in the consolidated toolbar; About and the tour now live in the "..."
// overflow menu after Pass 4.)

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

    const plainButton = page.getByRole('button', { name: 'Start fresh' });
    await plainButton.waitFor();
    const base = await plainButton.evaluate((el) => getComputedStyle(el).borderColor);
    await plainButton.hover();
    const afterHover = await plainButton.evaluate((el) => getComputedStyle(el).borderColor);
    expect(afterHover).toBe(base);
  } finally {
    await context.close();
  }
});

test('desktop pointer still gets the button hover affordance', async ({ page }) => {
  await page.goto(LAB_URL);

  const plainButton = page.getByRole('button', { name: 'Start fresh' });
  await plainButton.waitFor();
  const base = await plainButton.evaluate((el) => getComputedStyle(el).borderColor);
  await plainButton.hover();
  // On a hover-capable pointer the gated rule applies and the border darkens.
  await expect
    .poll(() => plainButton.evaluate((el) => getComputedStyle(el).borderColor))
    .not.toBe(base);
});
