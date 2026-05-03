import { expect, test } from '@playwright/test';

test('sticky header stays visible over long scroll', async ({ page }, testInfo) => {
  await page.goto('/c/phy132/snellsLaw?layout=side');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 1000));
  const header = page.locator('.lab-header');
  await expect(header).toBeVisible();
  const top = await header.evaluate((element) => Math.round(element.getBoundingClientRect().top));
  expect(top).toBeLessThanOrEqual(8);

  const screenshot = await page.screenshot();
  await testInfo.attach('layout-scroll-1000', { body: screenshot, contentType: 'image/png' });
});

test('splitter resizes panes without remounting iframe and resets on reload', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw?layout=side');
  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();

  const iframe = page.getByTitle(/bending light/i);
  await expect(iframe).toBeVisible();
  const mountId = await iframe.getAttribute('data-mount-id');
  expect(mountId).toBeTruthy();

  const initial = await page.evaluate(() => {
    const layout = document.querySelector('.lab-layout-side') as HTMLElement | null;
    const frame = document.querySelector('.simulation-frame') as HTMLElement | null;
    const sheet = document.querySelector('.worksheet-pane') as HTMLElement | null;
    return {
      layoutWidth: layout?.clientWidth ?? 0,
      simWidth: frame?.clientWidth ?? 0,
      worksheetWidth: sheet?.clientWidth ?? 0,
    };
  });
  expect(initial.simWidth).toBeGreaterThanOrEqual(initial.layoutWidth * 0.55);

  const handle = page.getByRole('separator', { name: /resize simulation and worksheet panes/i });
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('Expected split handle bounding box');
  }
  const dragY = box.y + Math.min(40, box.height / 2);
  await page.mouse.move(box.x + box.width / 2, dragY);
  await page.mouse.down();
  await page.mouse.move(box.x - 100, dragY, { steps: 5 });
  await page.mouse.up();

  const afterDrag = await page.evaluate(() => {
    const frame = document.querySelector('.simulation-frame') as HTMLElement | null;
    const sheet = document.querySelector('.worksheet-pane') as HTMLElement | null;
    return {
      simWidth: frame?.clientWidth ?? 0,
      worksheetWidth: sheet?.clientWidth ?? 0,
    };
  });
  expect(afterDrag.simWidth).toBeLessThan(initial.simWidth);
  expect(afterDrag.worksheetWidth).toBeGreaterThan(initial.worksheetWidth);
  await expect(iframe).toHaveAttribute('data-mount-id', mountId ?? '');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(iframe).toBeVisible();
  const afterReload = await page.evaluate(() => {
    const frame = document.querySelector('.simulation-frame') as HTMLElement | null;
    return frame?.clientWidth ?? 0;
  });
  expect(afterReload).toBeGreaterThanOrEqual(initial.layoutWidth * 0.55);
});
