import { expect, test } from '@playwright/test';

test('swap sides changes layout order and keeps iframe mount stable', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw?layout=side&side=left');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  const iframe = page.getByTitle(/bending light/i);
  await expect(iframe).toBeVisible();

  const mountId = await iframe.getAttribute('data-mount-id');
  expect(mountId).toBeTruthy();

  const before = await page.evaluate(() => {
    const layout = document.querySelector('.lab-layout-side') as HTMLElement | null;
    if (!layout) {
      return '';
    }
    return window.getComputedStyle(layout).gridTemplateAreas;
  });

  await page.getByRole('button', { name: /swap sides/i }).click();
  await expect(page).toHaveURL(/side=right/);

  const after = await page.evaluate(() => {
    const layout = document.querySelector('.lab-layout-side') as HTMLElement | null;
    if (!layout) {
      return '';
    }
    return window.getComputedStyle(layout).gridTemplateAreas;
  });

  expect(after).not.toEqual(before);
  await expect(iframe).toHaveAttribute('data-mount-id', mountId ?? '');
});
