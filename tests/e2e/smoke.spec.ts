import { test, expect } from '@playwright/test';

test('phase1 snell flow: fill table derived updates and tab switch', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /interactive physics labs/i }).first()).toBeVisible();

  await page.getByRole('link', { name: /lab 6: snellslaw/i }).first().click();
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  await page.getByLabel(/Incident angle \(deg\) row 1/i).nth(1).fill('30');
  await page.getByLabel(/Refracted angle \(deg\) row 1/i).nth(1).fill('19.47122063449069');
  await expect(page.getByLabel(/sin\(theta_1\) row 1/i).first()).toHaveValue(/0\.5/);

  await page.getByRole('button', { name: /tabs/i }).click();
  await page.getByRole('button', { name: /simulation/i }).click();
  const iframe = page.getByTitle(/bending light/i);
  await expect(iframe).toBeVisible();
  const mountIdBefore = await iframe.getAttribute('data-mount-id');
  expect(mountIdBefore).toBeTruthy();

  await page.getByRole('button', { name: /side by side/i }).click();
  await expect(page.getByTitle(/bending light/i)).toHaveAttribute('data-mount-id', mountIdBefore ?? '');

  await page.getByRole('button', { name: /tabs/i }).click();
  await page.getByRole('button', { name: /simulation/i }).click();
  await expect(page.getByTitle(/bending light/i)).toHaveAttribute('data-mount-id', mountIdBefore ?? '');

  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType('navigation').length,
  );
  expect(navigationCount).toBe(1);
});
