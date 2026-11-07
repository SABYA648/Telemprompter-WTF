import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

type EventLog = { __ev?: unknown[][] };
async function readRecord<T>(page: Page, store: string, key: string): Promise<T> {
  return page.evaluate(
    async ([store, key]) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('teleprompter-wtf');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return new Promise<T>((resolve, reject) => {
        const request = db.transaction(store!).objectStore(store!).get(key!);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      });
    },
    [store, key],
  );
}
/**
 * Stub Umami so every tracked call lands in `window.__ev`. With `persist`, the log also
 * survives same-tab navigations through sessionStorage, so a CTA click and the event it
 * leads to on the next page can be read in order.
 */
async function stubUmami(page: Page, { persist = false } = {}): Promise<void> {
  await page.route('https://analytics.sabya.pm/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.addInitScript((persist) => {
    const log = window as unknown as EventLog;
    if (persist) log.__ev = JSON.parse(sessionStorage.getItem('test.ev') ?? '[]') as unknown[][];
    (window as unknown as { umami: unknown }).umami = {
      track: (...args: unknown[]) => {
        (log.__ev ??= []).push(args);
        if (persist) sessionStorage.setItem('test.ev', JSON.stringify(log.__ev));
      },
    };
  }, persist);
}
/** Names of the tracked events in call order, skipping pageview callbacks. */
const eventNames = (page: Page) =>
  page.evaluate(() =>
    ((window as unknown as EventLog).__ev ?? [])
      .map((call) => call[0])
      .filter((name): name is string => typeof name === 'string'),
  );
const events = (page: Page, name: string) =>
  page.evaluate(
    (name) =>
      ((window as unknown as EventLog).__ev ?? [])
        .filter((call) => call[0] === name)
        .map((call) => call[1] as Record<string, unknown>),
    name,
  );

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
  const before = await readRecord<{ targetSeconds: number; aspect: string }>(
    page,
    'scripts',
    'quick',
  );
  await page.goto('/studio?preset=youtube');
  const dialog = page.getByRole('dialog', { name: 'Choose a script to record' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: 'Use starter' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.goto('/studio?preset=youtube');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Not now' }).click();
  await expect(dialog).toHaveCount(0);
  await page.goto('/studio?preset=youtube');
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    location.hash = '#/scripts';
  });
  await expect(dialog).toHaveCount(0);
  await page.goto('/studio?preset=youtube');
  await dialog.getByRole('button', { name: 'Introduce yourself in 30 seconds' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\/quick/);
  await expect(dialog).toHaveCount(0);
  // 14.6: the preset target is this session's, and the saved script is untouched.
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('studio.sessionTarget') ?? '{}')),
  ).toEqual({ id: 'quick', seconds: 0 });
  const after = await readRecord<{ targetSeconds: number; aspect: string }>(
    page,
    'scripts',
    'quick',
  );
  expect(after.targetSeconds).toBe(before.targetSeconds);
  expect(after.aspect).toBe(before.aspect);
});

test('an editor target edit ends the preset target in Record and Practice', async ({ page }) => {
  await page.context().grantPermissions(['camera', 'microphone']);
  const body = Array.from({ length: 150 }, (_, i) => `word${i + 1}`).join(' ');
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Script', { exact: true }).fill(body);
  await expect
    .poll(async () => (await readRecord<{ body: string }>(page, 'scripts', 'quick')).body)
    .toBe(body);
  await page.goto('/studio?preset=youtube');
  const dialog = page.getByRole('dialog', { name: 'Choose a script to record' });
  await dialog.getByRole('button', { name: 'Introduce yourself in 30 seconds' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\/quick/);
  await page.getByRole('button', { name: 'Allow camera' }).click();
  // The YouTube preset has an open duration, so Record uses the saved speed, not a fit.
  await page.getByRole('button', { name: 'Prompter controls' }).click();
  await expect(page.getByText('140 WPM')).toBeVisible();
  await expect(page.locator('.record-timer .is-fit')).toHaveCount(0);
  // Practice reads the same target as Record. At 140 WPM, 150 words project to 64 seconds.
  const practiceFit = async (fit: string) => {
    await page.goto('/studio#/practice/quick');
    await page.getByRole('button', { name: 'Start practice' }).click();
    // Finish enables once practice has counted active time.
    const finish = page.getByRole('button', { name: 'Finish practice' });
    await expect(finish).toBeEnabled();
    await finish.click();
    await expect(page.getByRole('region', { name: 'Practice summary' })).toContainText(
      `Target fit: ${fit}`,
    );
  };
  await practiceFit('No target set');
  await page.goto('/studio#/scripts/quick');
  // Any length outside the chips goes through the custom chip's seconds field.
  await page.getByRole('button', { name: 'Custom target length' }).click();
  await page.getByLabel('Target seconds').fill('60');
  await expect
    .poll(
      async () =>
        (await readRecord<{ targetSeconds: number }>(page, 'scripts', 'quick')).targetSeconds,
    )
    .toBe(60);
  expect(await page.evaluate(() => sessionStorage.getItem('studio.sessionTarget'))).toBeNull();
  await page.goto('/studio#/record/quick');
  // 150 spoken words over a 60 second target, and the camera says why it is not 140.
  await expect(page.locator('.record-timer .is-fit')).toHaveText('/ 1:00');
  await expect(page.getByText('Speed fits 1:00')).toHaveCount(1);
  await page.getByRole('button', { name: 'Prompter controls' }).click();
  await expect(page.getByText('150 WPM')).toBeVisible();
  await practiceFit('On target');
});

test('a preset on a library holding only a trashed quick script keeps that script', async ({
  page,
}) => {
  await page.goto('/studio');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const deletedAt = Date.now();
  await page.evaluate(async (deletedAt) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('teleprompter-wtf');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const store = db.transaction('scripts', 'readwrite').objectStore('scripts');
    await new Promise<void>((resolve, reject) => {
      const all = store.getAll();
      all.onsuccess = () => {
        for (const script of all.result as { id: string }[])
          if (script.id !== 'quick') store.delete(script.id);
        const get = store.get('quick');
        get.onsuccess = () => {
          const put = store.put({ ...get.result, body: 'My trashed draft', deletedAt });
          put.onsuccess = () => resolve();
          put.onerror = () => reject(put.error);
        };
      };
      all.onerror = () => reject(all.error);
    });
  }, deletedAt);
  await page.goto('/studio?preset=tiktok');
  await expect(page).toHaveURL(/\/studio#\/record\/(?!quick)[^/?]+/);
  const trashed = await readRecord<{ body: string; deletedAt: number }>(page, 'scripts', 'quick');
  expect(trashed).toMatchObject({ body: 'My trashed draft', deletedAt });
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

test('the record page CTA reports a Studio click with its page type and cluster', async ({
  page,
}) => {
  await stubUmami(page);
  await page.goto('/record/instagram-reels');
  const cta = page.getByRole('link', { name: 'Record a Reel now' });
  await cta.evaluate((element) =>
    element.addEventListener('click', (event) => event.preventDefault()),
  );
  await cta.click();
  await expect
    .poll(() => events(page, 'clicked_open_studio'))
    .toEqual([
      expect.objectContaining({
        page_type: 'record_preset',
        content_cluster: 'reels',
        cta_location: 'hero',
      }),
    ]);
  expect(await events(page, 'clicked_open_teleprompter')).toEqual([]);
});

test('Record with camera from a guide opens Studio with the guide entry', async ({ page }) => {
  await stubUmami(page);
  await page.goto('/guides/instagram-teleprompter');
  await page.getByRole('link', { name: 'Record with camera' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
  await expect
    .poll(() => events(page, 'opened_studio'))
    .toEqual([expect.objectContaining({ entry: 'guide' })]);
});

test('Record with camera on a guide reports one Studio click before Studio opens', async ({
  page,
}) => {
  await stubUmami(page, { persist: true });
  await page.goto('/guides/instagram-teleprompter');
  await page.getByRole('link', { name: 'Record with camera' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
  await expect.poll(() => events(page, 'opened_studio')).toHaveLength(1);
  expect(await events(page, 'clicked_open_studio')).toEqual([
    { page_type: 'guide', cta_location: 'inline' },
  ]);
  const names = await eventNames(page);
  expect(names.indexOf('clicked_open_studio')).toBeLessThan(names.indexOf('opened_studio'));
  // A guide whose cluster is a known content cluster reports it with the click.
  await page.evaluate(() => sessionStorage.removeItem('test.ev'));
  await page.goto('/guides/teleprompter-for-youtube');
  await page.getByRole('link', { name: 'Record with camera' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
  await expect.poll(() => events(page, 'opened_studio')).toHaveLength(1);
  expect(await events(page, 'clicked_open_studio')).toEqual([
    { page_type: 'guide', cta_location: 'inline', content_cluster: 'youtube' },
  ]);
});

test('the record hub CTA reports one Studio click before Studio opens', async ({ page }) => {
  await stubUmami(page, { persist: true });
  await page.goto('/record');
  await page.getByRole('link', { name: 'Record a video' }).click();
  await expect(page).toHaveURL(/\/studio/);
  await expect.poll(() => events(page, 'opened_studio')).toHaveLength(1);
  expect(await events(page, 'clicked_open_studio')).toEqual([
    { page_type: 'record_preset', cta_location: 'hero' },
  ]);
  expect(await events(page, 'clicked_open_teleprompter')).toEqual([]);
  const names = await eventNames(page);
  expect(names.indexOf('clicked_open_studio')).toBeLessThan(names.indexOf('opened_studio'));
});

test('tool islands load the Studio data layer only on Record', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (request) => scripts.push(new URL(request.url()).pathname));
  const studioChunk = /\/_astro\/(handoff|scriptsRepo|db|idb)\.[\w-]+\.js$/;
  await page.goto('/tools/script-length-checker');
  await expect(page.locator('astro-island:not([ssr])')).toHaveCount(1);
  await page.getByLabel('Your script').fill('One two three four.');
  await expect(page.getByRole('button', { name: 'Record this script' })).toBeVisible();
  expect(scripts.filter((path) => studioChunk.test(path))).toEqual([]);
  await page.getByRole('button', { name: 'Record this script' }).click();
  await expect(page).toHaveURL(/\/studio#\/record\//);
  expect(scripts.some((path) => studioChunk.test(path))).toBe(true);
});

test('new page types have one top-level main landmark', async ({ page }) => {
  for (const route of ['/record', '/record/instagram-reels', '/tools/caption-counter']) {
    await page.goto(route);
    await expect(page.locator('main')).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .withRules([
        'landmark-no-duplicate-main',
        'landmark-main-is-top-level',
        'landmark-one-main',
        'landmark-unique',
      ])
      .analyze();
    expect(result.violations, route).toEqual([]);
  }
});

test('the Instagram preview never splits an emoji at the cut', async ({ page }) => {
  await page.goto('/tools/caption-counter');
  await expect(page.locator('astro-island:not([ssr])')).toHaveCount(1);
  await page.getByLabel('Caption, title or description').fill(`${'a'.repeat(124)}😀 and more`);
  await expect(page.getByText(`${'a'.repeat(124)}😀…`)).toBeVisible();
});

test('template record links name the template and destination platform', async ({ page }) => {
  await page.goto('/templates/30-second-reel-script');
  await expect(
    page.getByRole('link', {
      name: 'Record the 30-second Reel script template with the Instagram Reels teleprompter',
    }),
  ).toHaveAttribute('href', '/record/instagram-reels');
});
