import { expect, test } from '@playwright/test';

const MISSING_PATH = '/this-page-is-definitely-missing';
const EMBED_SELECTOR = '[data-teleprompter-embed="not-found"]';

const waitForEmbedHydration = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(() =>
    document.querySelector('[data-teleprompter-embed="not-found"] .editor-shell:not([inert])'),
  );
};

test('nonexistent URLs serve the custom 404 with noindex and artwork', async ({ page }) => {
  const response = await page.goto(MISSING_PATH);
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

  const art = page.locator('.not-found__art img');
  await expect(art).toHaveCount(1);
  await expect(art).toHaveAttribute('src', '/illustrations/lost-script-404.webp');
  await expect(art).toHaveAttribute('width', '1024');
  await expect(art).toHaveAttribute('height', '683');
  const alt = await art.getAttribute('alt');
  expect(alt?.trim().length).toBeGreaterThan(0);
});

test('404 embed is eagerly hydrated and fully keyboard driven', async ({ page }) => {
  await page.goto(MISSING_PATH);
  const embed = page.locator(EMBED_SELECTOR);
  await expect(embed).toHaveCount(1);

  // client:load hydrates immediately; no scrolling required even though the
  // embed sits below the fold.
  await waitForEmbedHydration(page);
  await expect(embed.locator('.editor-shell[inert]')).toHaveCount(0);

  const editor = embed.locator('textarea.script-editor');
  const sample = await editor.inputValue();
  expect(sample).toContain('Lost your place?');

  await embed.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('dialog', { name: 'Teleprompter presenter' })).toBeVisible();
  const scroller = page.getByTestId('presenter-scroll');
  await expect(scroller).toBeVisible();

  await page.waitForTimeout(400);
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  const pausedPosition = await scroller.evaluate((element) => element.scrollTop);
  await page.waitForTimeout(400);
  expect(await scroller.evaluate((element) => element.scrollTop)).toBeCloseTo(pausedPosition, 0);

  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog', { name: 'Teleprompter presenter' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(scroller).toBeHidden();
  await expect(embed.getByRole('button', { name: /Start teleprompter/ })).toBeFocused();

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('teleprompter-wtf.state:embed:not-found')))
    .toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('teleprompter-wtf.state'))).toBeNull();
});

test('404 embed starts from a touch tap in a mobile viewport', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL: baseURL ?? 'http://127.0.0.1:48172',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await page.goto(MISSING_PATH);
    const embed = page.locator(EMBED_SELECTOR);
    await waitForEmbedHydration(page);
    const start = embed.getByRole('button', { name: /Start teleprompter/ });
    await start.scrollIntoViewIfNeeded();
    const box = await start.boundingBox();
    expect(box).toBeTruthy();
    await page.touchscreen.tap(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    );
    await expect(page.getByRole('dialog', { name: 'Teleprompter presenter' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('404 content stays intact with reduced motion', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL: baseURL ?? 'http://127.0.0.1:48172',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(MISSING_PATH);
    expect(response?.status()).toBe(404);
    await expect(page.locator('.not-found__art img')).toBeVisible();
    const embed = page.locator(EMBED_SELECTOR);
    await expect(embed).toBeVisible();
    await waitForEmbedHydration(page);
    await expect(embed.getByRole('button', { name: /Start teleprompter/ })).toBeVisible();
  } finally {
    await context.close();
  }
});
