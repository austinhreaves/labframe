import { expect, test } from '@playwright/test';

// Exporting a signed report persists it locally so the course page's Completed
// section can re-download the exact original (docs/specs/START_SCREEN_SPEC.md).

test('a completed lab appears under Completed and its report re-downloads', async ({ page }) => {
  await page.route('**/api/sign', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ signature: 'abc12345ffffeeee0000', signedAt: 1714521600000 }),
    });
  });

  // Export a signed report through the integrity gate (PHY 132 snellsLaw is
  // reachable by direct URL and uses the light Bending Light sim).
  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();
  // Commit the name first and let the lab re-initialize: renaming clears
  // transient integrity state, so affirm only after it settles.
  await page.getByLabel(/student name/i).fill('Ada Lovelace');
  await page.getByLabel(/student name/i).press('Enter');
  await page.waitForTimeout(600);
  await page.getByRole('checkbox', { name: /i affirm this submission/i }).check();

  const exportButton = page.getByRole('button', { name: /^export pdf$/i });
  await exportButton.scrollIntoViewIfNeeded();
  const [firstDownload] = await Promise.all([page.waitForEvent('download'), exportButton.click()]);
  const originalName = firstDownload.suggestedFilename();
  expect(originalName).toContain('AdaLovelace');

  // Wait until the report metadata is persisted before leaving the lab page,
  // then confirm the course page surfaces it under Completed.
  await page.waitForFunction(() =>
    Object.keys(localStorage).some((k) => k.startsWith('report:phy132:')),
  );
  await page.goto('/c/phy132');
  const completed = page.getByRole('heading', { name: /^completed/i });
  await expect(completed).toBeVisible();
  const openReport = page.getByRole('button', { name: /open report/i }).first();
  await expect(openReport).toBeVisible();

  // Open report re-downloads the exact stored file (same filename).
  const [reopened] = await Promise.all([page.waitForEvent('download'), openReport.click()]);
  expect(reopened.suggestedFilename()).toBe(originalName);
});
