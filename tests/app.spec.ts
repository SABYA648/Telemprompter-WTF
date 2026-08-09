import { expect, test } from '@playwright/test';

const longScript = Array.from(
  { length: 45 },
  (_, index) =>
    `Paragraph ${index + 1}. This is a clear sentence for testing the smooth teleprompter scroll.`,
).join('\n\n');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Free online teleprompter that follows your voice' }),
  ).toBeVisible();
});

test('homepage loads and updates script statistics', async ({ page }) => {
  const editor = page.getByLabel('Teleprompter script');
  await editor.fill('One two three\n\nFour five.');
  await expect(page.getByText('5 words')).toBeVisible();
  await expect(page.getByText(/at 130 WPM/)).toBeVisible();
});

test('presenter starts, scrolls, pauses, resumes, changes speed and restarts', async ({ page }) => {
  await page.getByLabel('Teleprompter script').fill(longScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  const scroller = page.getByTestId('presenter-scroll');
  await expect(scroller).toBeVisible();
  await page.waitForTimeout(700);
  const firstPosition = await scroller.evaluate((element) => element.scrollTop);
  await page.waitForTimeout(500);
  const secondPosition = await scroller.evaluate((element) => element.scrollTop);
  expect(secondPosition).toBeGreaterThan(firstPosition);

  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  const pausedPosition = await scroller.evaluate((element) => element.scrollTop);
  await page.waitForTimeout(400);
  expect(await scroller.evaluate((element) => element.scrollTop)).toBeCloseTo(pausedPosition, 0);

  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  expect(await scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(pausedPosition);

  await page.keyboard.press('ArrowUp');
  await expect(page.getByLabel('Scroll speed').getByRole('status')).toContainText('5');
  await page.keyboard.press('Home');
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeLessThan(10);
});

test('appearance settings update font size and mirror mode', async ({ page }) => {
  await page.getByLabel('Teleprompter script').fill(longScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('dialog', { name: 'Teleprompter presenter' })).toBeFocused();
  const script = page.locator('.presenter__script');
  await page.keyboard.press(']');
  await expect(script).toHaveCSS('font-size', '58px');
  await page.keyboard.press('m');
  await expect(script).toHaveCSS('transform', /matrix\(-1, 0, 0, 1/);

  await page.getByRole('button', { name: 'Appearance' }).click();
  await expect(page.getByRole('dialog', { name: 'Appearance' })).toBeVisible();
  await page.getByRole('slider', { name: 'Font size' }).fill('64');
  await expect(script).toHaveCSS('font-size', '64px');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Appearance' })).toBeHidden();
});

test('fullscreen capability is exposed only when supported', async ({ page }) => {
  await page.getByLabel('Teleprompter script').fill('A short presenter script.');
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  const supported = await page.evaluate(
    () => typeof document.documentElement.requestFullscreen === 'function',
  );
  await expect(page.getByRole('button', { name: 'Fullscreen' })).toHaveCount(supported ? 1 : 0);
});

test('script survives refresh', async ({ page }) => {
  const canary = 'A locally saved script survives this refresh.';
  await page.getByLabel('Teleprompter script').fill(canary);
  await expect(page.getByText('Saved only on this device')).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByLabel('Teleprompter script')).toHaveValue(canary);
});

test('clear script confirms and removes text', async ({ page }) => {
  await page.getByLabel('Teleprompter script').fill('Text that will be cleared.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear script' }).click();
  await expect(page.getByLabel('Teleprompter script')).toHaveValue('');
});

test('clear local data removes script and resets preferences', async ({ page }) => {
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.getByLabel('Teleprompter script').fill('Text saved only here.');
  await page.getByText('Privacy & local data').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear local data' }).click();
  await expect(page.getByLabel('Teleprompter script')).toHaveValue('');
  await expect(page.getByText('Local script and preferences cleared.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Allow analytics' })).toBeVisible();
});

test('TXT import reads plain text and rejects malformed binary content', async ({ page }) => {
  const input = page.locator('#txt-import');
  await input.setInputFiles({
    name: 'speech.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Imported\n\nscript text'),
  });
  await expect(page.getByLabel('Teleprompter script')).toHaveValue('Imported\n\nscript text');
  await expect(page.getByText('Text file imported.')).toBeVisible();

  await input.setInputFiles({
    name: 'broken.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from([65, 0, 66]),
  });
  await expect(page.getByText('That file could not be read as plain text.')).toBeVisible();
});

test('shortcuts help is accessible and Escape exits overlays then presenter', async ({ page }) => {
  await page.getByLabel('Teleprompter script').fill(longScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: 'Shortcuts' }).click();
  await expect(page.getByRole('dialog', { name: 'Shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Shortcuts' })).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('presenter-scroll')).toBeHidden();
  await expect(page.getByRole('button', { name: /Start teleprompter/ })).toBeFocused();
});

test('core pages and presenter emit no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByLabel('Teleprompter script').fill(longScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  await page.goto('/privacy');
  await page.goto('/tools/teleprompter-speed-calculator');
  expect(errors).toEqual([]);
});
