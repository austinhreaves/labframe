import { expect, test } from '@playwright/test';

test('gates PDF generation on integrity agreement and student info', async ({ page }) => {
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

  const exportButton = page.getByRole('button', { name: /^export pdf$/i });
  await exportButton.scrollIntoViewIfNeeded();
  await expect(exportButton).toBeDisabled();

  // Affirm the agreement — button enables, but student name is still missing.
  await page.getByRole('checkbox', { name: /i affirm this submission/i }).check();
  await expect(exportButton).toBeEnabled();

  await exportButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(/student name/i);
  await page.getByRole('button', { name: /^ok$/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(signCalls).toBe(0);

  // Fill name, then export should succeed and trigger a download.
  await page.getByLabel(/student name/i).fill('Austin Reaves');
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
