import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Run as a returning (onboarded) student who has no saved name, so the on-load
// name gate appears. Overrides the suite-wide seed, which includes a name.
test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:5173',
        localStorage: [{ name: 'labframe:onboarded', value: '1' }],
      },
    ],
  },
});

test('blocks a fresh lab load until a real name is entered', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw');

  const gate = page.getByRole('dialog', { name: /enter your name to begin/i });
  await expect(gate).toBeVisible();

  const nameInput = gate.getByLabel(/student name/i);

  // Empty submit is rejected and the gate stays up.
  await gate.getByRole('button', { name: /continue/i }).click();
  await expect(gate.getByRole('alert')).toHaveText(/enter your name/i);
  await expect(gate).toBeVisible();

  // The "Student" placeholder is rejected too.
  await nameInput.fill('Student');
  await gate.getByRole('button', { name: /continue/i }).click();
  await expect(gate.getByRole('alert')).toHaveText(/real name/i);
  await expect(gate).toBeVisible();

  // A real name dismisses the gate and lands on the committed name.
  await nameInput.fill('Austin Reaves');
  await gate.getByRole('button', { name: /continue/i }).click();
  await expect(gate).toBeHidden();
  await expect(page.getByLabel(/student name/i)).toHaveValue('Austin Reaves');
});

test('the open gate has no axe violations', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw');
  await expect(page.getByRole('dialog', { name: /enter your name to begin/i })).toBeVisible();

  // Scope the scan to the gate: the lab content behind the backdrop renders
  // lazily and has its own pre-existing violations (MathLive keyboard sink,
  // table formula contrast), so a whole-page scan is flaky and off-topic here.
  const results = await new AxeBuilder({ page }).include('.preflight-dialog-backdrop').analyze();
  expect(results.violations).toEqual([]);
});

test('a deep-linked name (?student=) skips the gate', async ({ page }) => {
  await page.goto('/c/phy132/snellsLaw?student=Jordan%20Lee');

  await expect(page.getByRole('heading', { name: /snell's law/i })).toBeVisible();
  await expect(page.getByRole('dialog', { name: /enter your name to begin/i })).toBeHidden();
  await expect(page.getByLabel(/student name/i)).toHaveValue('Jordan Lee');
});
