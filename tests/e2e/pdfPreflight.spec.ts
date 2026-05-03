import { expect, test } from '@playwright/test';

test('blocks PDF generation until student info preflight passes', async ({ page }) => {
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

  await page.goto('/');
  await page.getByRole('link', { name: /lab 6: snellslaw/i }).first().click();
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  await page.getByRole('button', { name: /export pdf/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(/student name/i);
  await page.getByRole('button', { name: /^ok$/i }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.waitForEvent('download', { timeout: 1200 })).rejects.toThrow();
  expect(signCalls).toBe(0);

  await page.getByLabel(/student name/i).fill('Austin Reaves');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export pdf/i }).click(),
  ]);

  expect(signCalls).toBe(1);
  expect(download.suggestedFilename()).toContain('AustinReaves');
});
