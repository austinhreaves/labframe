import { test, expect } from '@playwright/test';

test('phase1 snell flow: fill table derived updates and view switch', async ({ page }) => {
  // PHY 132 restructured Snell's Law to enabled:false (lab 11). Use PHY 114
  // Lab 9 instead: it is enabled, with identical columns and the same Bending
  // Light simulation, so the smoke test runs against a live catalog lab.
  await page.goto('/c/phy114/snellsLaw');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  await page
    .getByLabel(/Incident angle \(deg\) row 1/i)
    .nth(1)
    .fill('30');
  await page
    .getByLabel(/Refracted angle \(deg\) row 1/i)
    .nth(1)
    .fill('19.47122063449069');
  await expect(page.getByLabel(/sin\(theta_1\) row 1/i).first()).toHaveValue(/0\.5/);

  // The View switcher (Parallel / Series) lives in the "..." overflow menu.
  // Switching layouts must not remount the sim iframe (keep-alive).
  const iframe = page.getByTitle(/bending light/i);
  await expect(iframe).toBeVisible();
  const mountIdBefore = await iframe.getAttribute('data-mount-id');
  expect(mountIdBefore).toBeTruthy();

  const openViewMenu = async () => {
    await page.locator('.overflow-menu > summary').click();
  };

  await openViewMenu();
  await page.getByRole('menuitemradio', { name: 'Series' }).click();
  await expect(page.getByTitle(/bending light/i)).toBeVisible();
  await expect(page.getByTitle(/bending light/i)).toHaveAttribute(
    'data-mount-id',
    mountIdBefore ?? '',
  );

  await openViewMenu();
  await page.getByRole('menuitemradio', { name: 'Parallel' }).click();
  await expect(page.getByTitle(/bending light/i)).toHaveAttribute(
    'data-mount-id',
    mountIdBefore ?? '',
  );

  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType('navigation').length,
  );
  expect(navigationCount).toBe(1);
});
