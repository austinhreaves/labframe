import { expect, test } from '@playwright/test';

test('persists per course/lab key when switching catalog routes', async ({ page }) => {
  // phy132's snellsLaw is enabled:false (presentation only), so reach it by
  // direct URL; phy114's snellsLaw shares the lab id but must not share data.
  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();
  const incidentField = page.getByLabel(/incident angle \(deg\) row 1/i).nth(1);
  // Wait for initLab defaults to land before filling; prevents the race where
  // initLab's set(defaults) fires after fill and overwrites '31' with ''.
  await expect(incidentField).toHaveValue('');
  await incidentField.fill('31');
  // Poll until the lab store has saved the value; avoids a hard-coded timeout
  // that becomes flaky under parallel-worker load from the full e2e suite.
  await page.waitForFunction(
    (expected) => {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key?.startsWith('lab:')) {
          continue;
        }
        try {
          const parsed = JSON.parse(localStorage.getItem(key) ?? '') as {
            tables?: Record<string, Array<Record<string, { text: string }>>>;
          };
          const row0 = parsed.tables?.part2Table?.[0];
          if (row0 && Object.values(row0).some((v) => v.text === expected)) {
            return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    },
    '31',
    { timeout: 3000 },
  );

  await page.goto('/c/phy114/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();
  const phy114IncidentField = page.getByLabel(/incident angle \(deg\) row 1/i).nth(1);
  await expect(phy114IncidentField).toHaveValue('');

  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByLabel(/incident angle \(deg\) row 1/i).nth(1)).toHaveValue('31');
});

test('keeps large uploaded image after reload via IndexedDB blob storage', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

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
