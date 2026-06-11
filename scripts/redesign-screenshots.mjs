// Screenshot helper for the UI redesign checkpoint reviews.
// Usage: node scripts/redesign-screenshots.mjs <outDir> [baseUrl]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const outDir = resolve(process.argv[2] ?? '.screenshots/out');
const baseUrl = process.argv[3] ?? 'http://localhost:5173';
mkdirSync(outDir, { recursive: true });

const shots = [
  { name: 'catalog', path: '/', fullPage: true },
  { name: 'catalog-wizard-course', path: '/?step=course', fullPage: false },
  { name: 'catalog-wizard-lab', path: '/?step=course', fullPage: false, clickCourse: true },
  { name: 'course-phy132', path: '/c/phy132', fullPage: true },
  { name: 'lab-coulombs', path: '/c/phy132/coulombsLaw', fullPage: false },
];

const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('labframe:theme', t);
      localStorage.setItem('labframe:student-name', 'Jordan Rivera');
    } catch {
      /* ignore */
    }
  }, theme);
  const page = await context.newPage();
  for (const shot of shots) {
    await page.goto(baseUrl + shot.path, { waitUntil: 'networkidle' });
    // Catalog route does not apply stored theme pre-redesign; force it for parity.
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    if (shot.clickCourse) {
      const btn = page.getByRole('button', { name: /phy 132/i }).first();
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${outDir}/${shot.name}-${theme}.png`,
      fullPage: shot.fullPage,
    });
    console.log(`saved ${shot.name}-${theme}.png`);
  }
  await context.close();
}
await browser.close();
