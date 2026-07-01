import { test, expect } from '@playwright/test';

// Track S onboarding tour. These run as a brand-new student, overriding the
// suite-wide onboarded seed in playwright.config.ts.
test.use({ storageState: { cookies: [], origins: [] } });

test('first run shows the splash and Skip tutorial reveals the start screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /skip tutorial/i })).toBeVisible();
  // The normal start-screen wordmark is hidden during first run (exact: the
  // splash's own "Welcome to LabFrame" heading would match a loose regex).
  await expect(page.getByRole('heading', { name: 'LabFrame', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /skip tutorial/i }).click();

  // Skipping drops the student into the normal start screen and does not nag again.
  await expect(page.getByRole('heading', { name: 'LabFrame', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /get started/i })).toHaveCount(0);
});

test('Get Started reveals the course picker and starts the tour', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /get started/i }).click();

  // The tour panel exposes the course-picker and name anchors, and the driver
  // spotlight popover appears.
  await expect(page.getByRole('heading', { name: /pick your course/i })).toBeVisible();
  await expect(page.getByLabel(/student name/i)).toBeVisible();
  await expect(page.locator('.driver-popover')).toBeVisible();
});

test('deep-link first timer sees the tour toast on a real lab', async ({ page }) => {
  // Seed only the name (not the onboarded flag) so the first-timer tour toast
  // still shows while the student-name gate stays out of the way.
  await page.context().addInitScript(() => {
    window.localStorage.setItem('labframe:student-name', 'E2E Student');
  });
  await page.goto('/c/phy132/chargeBuildup');

  const toast = page.locator('.lab-tour-toast');
  await expect(toast).toBeVisible();
  await expect(toast.getByText(/new here\?/i)).toBeVisible();

  await toast.getByRole('button', { name: /dismiss/i }).click();
  await expect(toast).toHaveCount(0);
});

test('Phase B auto-starts on /welcome?tour=1 and strips the flag', async ({ page }) => {
  await page.goto('/welcome?tour=1');

  // The lab-side spotlight starts and the tour flag is removed from the URL.
  await expect(page.locator('.driver-popover')).toBeVisible();
  await expect(page).toHaveURL(/\/welcome$/);
});
