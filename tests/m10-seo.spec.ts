import { expect, test } from '@playwright/test';

const newRoutes = [
  '/record',
  '/record/instagram-reels',
  '/record/youtube-shorts',
  '/record/tiktok',
  '/record/youtube',
  '/record/linkedin-video',
  '/tools/script-length-checker',
  '/tools/caption-counter',
  '/tools/hook-generator',
  '/guides/instagram-teleprompter',
  '/guides/capcut-teleprompter',
  '/guides/how-to-film-talking-head-reels',
  '/guides/how-to-batch-record-videos',
  '/guides/how-to-write-a-30-second-video-script',
  '/guides/teleprompter-remote-control',
  '/guides/best-camera-settings-for-reels',
  '/guides/external-microphone-for-phone-video',
  '/templates/30-second-reel-script',
  '/hooks/fitness',
];

for (const width of [390, 360]) {
  test(`M10 search pages fit ${width}px and expose their primary action`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 740 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of newRoutes) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
      if (route.startsWith('/tools/')) {
        const control = page.locator('astro-island textarea, astro-island select').first();
        const box = await control.boundingBox();
        expect(box?.y ?? Infinity, `${route} first control`).toBeLessThan(
          width === 390 ? 844 : 740,
        );
      }
    }
    expect(errors).toEqual([]);
    await page.goto('/record/instagram-reels');
    const cta = page.getByRole('link', { name: 'Record a Reel now' });
    await expect(cta).toBeVisible();
    expect((await cta.boundingBox())!.y).toBeLessThan(width === 390 ? 844 : 740);
  });
}

test('script length checker computes spoken time and the target cut point', async ({ page }) => {
  await page.goto('/tools/script-length-checker');
  await expect(page.locator('astro-island:not([ssr])')).toHaveCount(1);
  await page
    .getByLabel('Your script')
    .fill(Array.from({ length: 90 }, (_, i) => `word${i + 1}`).join(' '));
  await expect(page.getByText('90 spoken words')).toBeVisible();
  await expect(page.getByText('Estimated 39 seconds before pauses')).toBeVisible();
  await page.getByText('Show cut point').first().click();
  await expect(page.locator('.creator-tool__cut mark').first()).toContainText('word36');
});

test('caption counter updates each limit and the Instagram preview', async ({ page }) => {
  await page.goto('/tools/caption-counter');
  await expect(page.locator('astro-island:not([ssr])')).toHaveCount(1);
  await page
    .getByLabel('Caption, title or description')
    .fill('One idea #one #two #three #four #five #six');
  await expect(page.getByText(/1 hashtags over the 5 limit/)).toBeVisible();
  await expect(page.getByText('42 characters')).toBeVisible();
  await expect(page.getByText(/42 \/ 100 characters/)).toBeVisible();
});

test('hook generator fills a niche template and records it as a new script', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/hook-generator');
  await expect(page.locator('astro-island:not([ssr])')).toHaveCount(1);
  await page.getByLabel('Niche').selectOption('tech');
  await page.getByLabel('Topic').fill('camera setup');
  await expect(page.locator('.creator-tool__results li').first()).toContainText('camera setup');
  await page.getByRole('button', { name: 'Copy' }).first().click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  await page.getByRole('button', { name: 'Record this hook' }).first().click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
});

test('a preset starts its matching script on an empty library', async ({ page }) => {
  await page.goto('/studio?preset=instagram-reels');
  await expect(page).toHaveURL(/\/studio#\/record\/quick/);
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('studio.sessionPreset') ?? '{}')),
  ).toEqual({ aspect: '9:16', safeZone: 'instagram' });
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('studio.sessionPreset') ?? '{}')),
  ).toEqual({ aspect: '9:16', safeZone: 'instagram' });
  const script = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('teleprompter-wtf');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise<{ body: string; targetSeconds: number; aspect: string }>(
      (resolve, reject) => {
        const request = db.transaction('scripts').objectStore('scripts').get('quick');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
  });
  expect(script.body).toContain('# Hook');
  expect(script.targetSeconds).toBe(30);
  expect(script.aspect).toBe('9:16');
});

test('an existing library offers starter or an existing script for a preset', async ({ page }) => {
  await page.goto('/studio');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/studio?preset=youtube');
  await expect(page.getByRole('heading', { name: 'Choose a script to record' })).toBeVisible();
  await page.getByRole('button', { name: 'Introduce yourself in 30 seconds' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\/quick/);
  const script = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('teleprompter-wtf');
      request.onsuccess = () => resolve(request.result);
    });
    return new Promise<{ targetSeconds: number; aspect: string }>((resolve) => {
      const request = db.transaction('scripts').objectStore('scripts').get('quick');
      request.onsuccess = () => resolve(request.result);
    });
  });
  expect(script.aspect).toBe('16:9');
  expect(script.targetSeconds).toBe(0);
});

test('guide camera CTA transfers its authored sample to Studio', async ({ page }) => {
  await page.goto('/guides/instagram-teleprompter');
  await page.getByRole('link', { name: 'Record with camera' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
  await expect(page.getByText(/record/i).first()).toBeVisible();
  await page.goto('/guides/teleprompter-for-youtube');
  const href = await page.getByRole('link', { name: 'Record with camera' }).getAttribute('href');
  const handoff = JSON.parse(new URLSearchParams(href!.split('?')[1]).get('handoff')!);
  expect(handoff).toMatchObject({ aspect: '16:9', targetSeconds: 0 });
});
