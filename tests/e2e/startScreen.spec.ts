import { expect, test } from '@playwright/test';

// Start screen redesign (docs/specs/START_SCREEN_SPEC.md) + /sims
// (docs/specs/SIMS_SPEC.md). Navigate directly to routes per the repo note.

test('course page shows On deck cards and Up next chips for PHY 114', async ({ page }) => {
  await page.goto('/c/phy114');

  // exact: the "Up next ... coming to PHY 114" eyebrow is also a heading.
  await expect(page.getByRole('heading', { name: 'PHY 114', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /on deck/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /lab 1: charge buildup/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /lab 2: coulomb/i })).toBeVisible();

  // Coming-soon labs are quiet, non-navigable chips under Up next.
  await expect(page.getByRole('heading', { name: /up next/i })).toBeVisible();
  const upNext = page.locator('.start-upnext');
  await expect(upNext.getByText(/ohm's law/i)).toBeVisible();
  await expect(upNext.getByRole('link')).toHaveCount(0);
});

test('details save, collapse to a summary bar, and rehydrate on reload', async ({ page }) => {
  await page.goto('/c/phy114');

  await page.getByLabel(/student name/i).fill('Test Student');
  await page.getByLabel(/ta name/i).fill('Test TA');
  await page.getByRole('button', { name: /save & continue/i }).click();

  const summary = page.locator('.start-details-summary');
  await expect(summary).toBeVisible();
  await expect(summary.getByText('Test Student')).toBeVisible();
  await expect(summary.getByText(/TA: Test TA/)).toBeVisible();
  await expect(summary.getByText(/saved on this device/i)).toBeVisible();

  // The On deck card now carries the ?student= hand-off.
  await expect(page.getByRole('link', { name: /lab 1: charge buildup/i })).toHaveAttribute(
    'href',
    /student=Test%20Student/,
  );

  // A fresh load lands straight in the collapsed summary state.
  await page.reload();
  await expect(page.locator('.start-details-summary')).toBeVisible();
  await expect(page.getByLabel(/student name/i)).toHaveCount(0);

  // Edit reopens the form with the saved values.
  await page.getByRole('button', { name: /^edit$/i }).click();
  await expect(page.getByLabel(/student name/i)).toHaveValue('Test Student');
});

test('the multi-course staff index stacks a block per course', async ({ page }) => {
  await page.goto('/labs');

  await expect(page.getByRole('heading', { name: /LabFrame/i }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PHY 132', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PHY 114', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Getting Started', exact: true })).toBeVisible();
});

test('Just explore routes to /sims and cards link out to PhET in a new tab', async ({ page }) => {
  await page.goto('/c/phy114');
  await page.getByRole('link', { name: /just explore/i }).click();
  await expect(page).toHaveURL(/\/sims$/);

  await expect(page.getByRole('heading', { name: /just explore/i })).toBeVisible();
  const travoltage = page.getByRole('link', { name: /john travoltage/i });
  await expect(travoltage).toBeVisible();
  await expect(travoltage).toHaveAttribute('target', '_blank');
  await expect(travoltage).toHaveAttribute('rel', /noopener/);
  await expect(travoltage).toHaveAttribute('href', /phet\.colorado\.edu/);

  // A sim shared across labs appears once (deduped by URL).
  await expect(page.getByRole('link', { name: /john travoltage/i })).toHaveCount(1);
});
