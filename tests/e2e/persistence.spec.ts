import { expect, test } from '@playwright/test';

test('persists per course/lab key when switching catalog routes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: /lab 6: snellslaw/i }).first().click();
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();
  const incidentField = page.getByLabel(/incident angle \(deg\) row 1/i).nth(1);
  await incidentField.fill('31');
  await page.waitForTimeout(450);

  await page.getByRole('link', { name: /back to phy 132/i }).click();
  await page.goto('/');
  await page.getByRole('link', { name: /lab 5: snellslaw/i }).first().click();

  const phy114IncidentField = page.getByLabel(/incident angle \(deg\) row 1/i).nth(1);
  await expect(phy114IncidentField).toHaveValue('');

  await page.goto('/');
  await page.getByRole('link', { name: /lab 6: snellslaw/i }).first().click();
  await expect(page.getByLabel(/incident angle \(deg\) row 1/i).nth(1)).toHaveValue('31');
});

test('keeps large uploaded image after reload via IndexedDB blob storage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /lab 6: snellslaw/i }).first().click();

  const largeImage = Buffer.alloc(3 * 1024 * 1024, 127);
  await page.getByLabel(/upload image/i).setInputFiles({
    name: 'large-test.png',
    mimeType: 'image/png',
    buffer: largeImage,
  });

  await expect(page.getByRole('img', { name: /large-test\.png/i })).toBeVisible();
  await page.waitForTimeout(4000);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('img', { name: /large-test\.png/i })).toBeVisible({ timeout: 45000 });
});
