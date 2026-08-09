import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('speed calculator supports both calculation directions', async ({ page }) => {
  await page.goto('/tools/teleprompter-speed-calculator');
  await page.getByLabel('Script length').fill('650');
  await page.getByLabel('Available time').fill('5');
  await expect(page.getByText('130 WPM')).toBeVisible();
  await page.getByRole('tab', { name: 'Find my time' }).click();
  await page.getByLabel('Speaking pace').fill('130');
  await expect(page.getByText('5 min')).toBeVisible();
});

test('words-to-minutes updates its estimates', async ({ page }) => {
  await page.goto('/tools/words-to-minutes');
  await page.getByLabel('How many words?').fill('650');
  const row = page.getByRole('row', { name: /Conversational/ });
  await expect(row).toContainText('5 min');
});

for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
  test(`homepage has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 812 : 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

for (const path of [
  '/',
  '/privacy',
  '/guides/how-to-use-a-teleprompter',
  '/tools/words-to-minutes',
]) {
  test(`automated accessibility scan passes on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('presenter and appearance dialog pass automated accessibility scans', async ({ page }) => {
  await page.goto('/');
  await page
    .getByLabel('Teleprompter script')
    .fill(
      Array.from({ length: 30 }, () => 'A readable private script for accessibility testing.').join(
        '\n\n',
      ),
    );
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('dialog', { name: 'Teleprompter presenter' })).toBeVisible();
  const presenterResults = await new AxeBuilder({ page }).include('.presenter').analyze();
  expect(presenterResults.violations).toEqual([]);

  await page.getByRole('button', { name: 'Appearance' }).click();
  const settingsResults = await new AxeBuilder({ page }).include('.settings-panel').analyze();
  expect(settingsResults.violations).toEqual([]);
});

test('mobile presenter remains reachable in portrait and landscape', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page
    .getByLabel('Teleprompter script')
    .fill(
      Array.from({ length: 20 }, () => 'A short line for a small presenter screen.').join('\n\n'),
    );
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  const controls = page.locator('.presenter__controls');
  await expect(controls).toBeVisible();
  expect(
    await controls.evaluate((element) => element.getBoundingClientRect().right),
  ).toBeLessThanOrEqual(320);

  await page.setViewportSize({ width: 812, height: 375 });
  await page.mouse.move(400, 180);
  await expect(page.getByRole('button', { name: 'Appearance' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
