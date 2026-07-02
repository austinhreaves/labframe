import { expect, test } from '@playwright/test';

test('gates PDF generation on the integrity agreement', async ({ page }) => {
  // The suite seeds a student name, so the name gate is already satisfied; this
  // test covers the remaining export gate (the integrity agreement). The
  // missing-name path is now enforced by the on-load gate (studentNameGate.spec).
  let signCalls = 0;
  await page.route('**/api/sign', async (route) => {
    signCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        signature: 'abc12345ffffeeee0000',
        signedAt: 1714521600000,
      }),
    });
  });

  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  // Set a real name for the report filename, committing over the seeded value.
  await page.getByLabel(/student name/i).fill('Austin Reaves');
  await page.getByLabel(/student name/i).press('Enter');

  const exportButton = page.getByRole('button', { name: /^export pdf$/i });
  await exportButton.scrollIntoViewIfNeeded();
  await expect(exportButton).toBeDisabled();
  expect(signCalls).toBe(0);

  // Affirm the agreement — the button enables and export succeeds.
  await page.getByRole('checkbox', { name: /i affirm this submission/i }).check();
  await expect(exportButton).toBeEnabled();

  const [download] = await Promise.all([page.waitForEvent('download'), exportButton.click()]);

  expect(signCalls).toBe(1);
  expect(download.suggestedFilename()).toContain('AustinReaves');
});

test('blocks export when AI is reported without share links', async ({ page }) => {
  let signCalls = 0;
  await page.route('**/api/sign', async (route) => {
    signCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ signature: 'deadbeef', signedAt: 1714521600000 }),
    });
  });

  await page.goto('/c/phy132/snellsLaw');
  // Commit the name first and let the lab re-initialize: renaming clears
  // transient integrity state, so affirm only after it settles.
  await page.getByLabel(/student name/i).fill('Austin Reaves');
  await page.getByLabel(/student name/i).press('Enter');
  await page.waitForTimeout(600);
  await page.getByRole('checkbox', { name: /i affirm this submission/i }).check();
  await page.getByRole('checkbox', { name: /i used ai or llm tools/i }).check();

  const exportButton = page.getByRole('button', { name: /^export pdf$/i });
  await exportButton.scrollIntoViewIfNeeded();
  await expect(exportButton).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText(/add at least one share link/i);

  await page.getByLabel(/paste share links/i).fill('https://chat.example/share/xyz');
  await expect(exportButton).toBeEnabled();

  const [download] = await Promise.all([page.waitForEvent('download'), exportButton.click()]);

  expect(signCalls).toBe(1);
  expect(download.suggestedFilename()).toContain('AustinReaves');
});
