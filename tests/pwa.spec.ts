import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function fireInstallPrompt(page: Page) {
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.defineProperty(event, 'prompt', { value: async () => undefined });
    Object.defineProperty(event, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    });
    dispatchEvent(event);
  });
}

const SPEC_MANIFEST = {
  id: '/studio',
  name: 'teleprompter.wtf Studio',
  short_name: 'Teleprompter',
  description: 'Teleprompter camera for Reels, Shorts and YouTube.',
  start_url: '/studio?utm_source=pwa&utm_medium=homescreen',
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: '#090a09',
  theme_color: '#090a09',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
  shortcuts: [
    { name: 'Record', url: '/studio?go=record&utm_source=pwa&utm_medium=shortcut' },
    { name: 'New idea', url: '/studio?go=idea&utm_source=pwa&utm_medium=shortcut' },
    { name: 'Scripts', url: '/studio?go=scripts&utm_source=pwa&utm_medium=shortcut' },
  ],
  share_target: {
    action: '/share-target',
    method: 'POST',
    enctype: 'multipart/form-data',
    params: { title: 'title', text: 'text', url: 'url' },
  },
};
const CONTENT_PAGE = '/guides/how-to-use-a-teleprompter';
const NEVER_VISITED_PAGE = '/guides/voice-activated-teleprompters';

async function waitForController(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

test('manifest matches the plan field for field', async ({ request }) => {
  const response = await request.get('/site.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toEqual(SPEC_MANIFEST);
  expect(manifest.id).toBe('/studio');
  expect(manifest.start_url).toBe('/studio?utm_source=pwa&utm_medium=homescreen');
  expect(manifest.scope).toBe('/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toHaveLength(4);
  expect(manifest.shortcuts).toHaveLength(3);
  expect(manifest.share_target.action).toBe('/share-target');
  for (const icon of manifest.icons) {
    const file = await request.get(icon.src);
    expect(file.ok(), icon.src).toBe(true);
    if (icon.type !== 'image/png') continue;
    const bytes = await file.body();
    const [width, height] = icon.sizes.split('x').map(Number);
    expect(bytes.readUInt32BE(16)).toBe(width);
    expect(bytes.readUInt32BE(20)).toBe(height);
  }
  const touch = await (await request.get('/icons/apple-touch-icon.png')).body();
  expect(touch.readUInt32BE(16)).toBe(180);
});

test('manifest shortcuts open their screens', async ({ page }) => {
  await page.goto('/studio?go=scripts&utm_source=pwa&utm_medium=shortcut');
  await expect(page).toHaveURL(/#\/scripts$/);
  await page.goto('about:blank');
  await page.goto('/studio?go=idea&utm_source=pwa&utm_medium=shortcut');
  await expect(page.getByRole('heading', { name: 'Ideas inbox' })).toBeVisible();
  await page.goto('about:blank');
  await page.goto('/studio?go=record&utm_source=pwa&utm_medium=shortcut');
  await expect(page).toHaveURL(/#\/record\/quick$/);
});

test('both layouts carry the install head tags and /offline stays out of search', async ({
  page,
  request,
}) => {
  for (const path of ['/studio', CONTENT_PAGE, '/']) {
    await page.goto(path);
    await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href', '/site.webmanifest');
    await expect(page.locator('link[rel=apple-touch-icon]')).toHaveAttribute(
      'href',
      '/icons/apple-touch-icon.png',
    );
    await expect(page.locator('meta[name=apple-mobile-web-app-title]')).toHaveAttribute(
      'content',
      'Teleprompter',
    );
  }
  await page.goto('/studio');
  await expect(page.locator('meta[name=apple-mobile-web-app-status-bar-style]')).toHaveAttribute(
    'content',
    'black-translucent',
  );
  await expect(page.locator('meta[name=theme-color]')).toHaveAttribute('content', '#090a09');
  await page.goto('/offline');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Studio' })).toHaveAttribute('href', '/studio');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toContain('/offline');
  expect(sitemap).not.toContain('/studio');
});

test('built service worker is complete, versioned and reproducible', async ({ request }) => {
  const response = await request.get('/sw.js');
  expect(response.ok()).toBe(true);
  const code = await response.text();
  expect(code).not.toContain('__PRECACHE__');
  expect(code).not.toContain('__VERSION__');
  expect(code).not.toContain('__SHARE_HANDLER__');
  expect(code).not.toMatch(/^export /m);
  const precache = JSON.parse(code.match(/^const PRECACHE = (\[.*\]);$/m)?.[1] ?? '[]') as string[];
  const version = code.match(/^const VERSION = '([0-9a-f]{12})';$/m)?.[1];
  expect(version).toBe(
    createHash('sha256').update(JSON.stringify(precache)).digest('hex').slice(0, 12),
  );
  expect(precache).toEqual([...precache].sort());
  for (const url of [
    '/studio',
    '/offline',
    '/site.webmanifest',
    '/favicon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-512.png',
    '/icons/apple-touch-icon.png',
    '/fonts/atkinson-hyperlegible/AtkinsonHyperlegible-Regular.woff2',
  ])
    expect(precache).toContain(url);
  expect(precache.some((url) => /^\/_astro\/StudioApp\.[^/]+\.js$/.test(url))).toBe(true);
  expect(precache.some((url) => url.endsWith('.css'))).toBe(true);
  // One failed URL would abort the install, so every entry has to resolve.
  for (const url of precache) expect((await request.get(url)).ok(), url).toBe(true);
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    const before = await readFile('dist/sw.js', 'utf8');
    execFileSync(process.execPath, ['scripts/build-sw.mjs'], { stdio: 'pipe' });
    expect(await readFile('dist/sw.js', 'utf8')).toBe(before);
  }
});

test('service worker registers on /studio, not on content pages', async ({ page }) => {
  await page.goto(CONTENT_PAGE);
  await expect(page.locator('h1').first()).toBeVisible();
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistration())).toBeUndefined();
  await page.goto('/studio');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const registration = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return { scope: reg?.scope, script: reg?.active?.scriptURL };
  });
  expect(new URL(registration.scope ?? '').pathname).toBe('/');
  expect(new URL(registration.script ?? '').pathname).toBe('/sw.js');
});

test('offline: Studio renders its shell, content pages fall back to /offline', async ({
  page,
  context,
}) => {
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await waitForController(page);
  await page.goto(CONTENT_PAGE);
  await expect(page.locator('h1').first()).toBeVisible();
  const visitedTitle = await page.title();
  await context.setOffline(true);

  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Scripts', exact: true })).toBeVisible();
  expect(await page.evaluate(async () => (await fetch('/site.webmanifest')).ok)).toBe(true);
  expect(await page.evaluate(async () => (await fetch('/icons/icon-192.png')).ok)).toBe(true);
  expect(
    await page.evaluate(
      async () =>
        (await fetch('/fonts/atkinson-hyperlegible/AtkinsonHyperlegible-Regular.woff2')).ok,
    ),
  ).toBe(true);

  await page.goto('/studio?utm_source=pwa&utm_medium=homescreen');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();

  await page.goto(NEVER_VISITED_PAGE);
  await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
  await page.getByRole('link', { name: 'Open Studio' }).click();
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();

  await page.goto(CONTENT_PAGE);
  await expect(page).toHaveTitle(visitedTitle);
});

test('offline Studio keeps working on saved scripts', async ({ page, context }) => {
  await page.goto('/studio#/scripts');
  await waitForController(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'New script' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Written offline');
  await expect(page.getByText('Saved')).toBeVisible();
  await page.goto('/studio#/scripts');
  await expect(page.getByText('Written offline')).toBeVisible();
});

test('transfer code restores script and device identity in a fresh context', async ({
  page,
  browser,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: 'New script' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Transfer title');
  await page.getByLabel('Script', { exact: true }).fill('The script crosses storage contexts.');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const request = indexedDB.open('teleprompter-wtf');
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          const rows = await new Promise<Array<{ title: string; body: string }>>(
            (resolve, reject) => {
              const query = db.transaction('scripts', 'readonly').objectStore('scripts').getAll();
              query.onsuccess = () => resolve(query.result);
              query.onerror = () => reject(query.error);
            },
          );
          return rows.some(
            (row) =>
              row.title === 'Transfer title' && row.body === 'The script crosses storage contexts.',
          );
        } finally {
          db.close();
        }
      }),
    )
    .toBe(true);
  await page.goto('/studio#/settings/prompter');
  await page.getByLabel('Prompter dock').selectOption('left');
  await page.reload();
  await expect(page.getByLabel('Prompter dock')).toHaveValue('left');
  // Seed today's local date: a fixed date goes stale and the imported streak reads as broken.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  await page.evaluate(async (today) => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['ideas', 'kv'], 'readwrite');
      tx.objectStore('ideas').put({ id: 'transfer-idea', text: 'An idea to move', createdAt: 10 });
      tx.objectStore('kv').put({ current: 2, best: 2, activeDates: [today] }, 'streak');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, today);
  await page.goto('/studio#/settings');
  await page.getByRole('button', { name: 'Copy transfer code' }).click();
  await expect(page.getByRole('status')).toContainText('Transfer code copied');
  const exported = await page.evaluate(() => navigator.clipboard.readText());
  expect(exported.startsWith('T1.')).toBe(true);
  const keys = await page.evaluate(async (code) => {
    const packed = Uint8Array.from(atob(code.slice(3).replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0),
    );
    const bytes =
      packed[0] === 1
        ? await new Response(
            new Blob([packed.slice(1)])
              .stream()
              .pipeThrough(new DecompressionStream('deflate-raw')),
          ).arrayBuffer()
        : packed.slice(1);
    return Object.keys(JSON.parse(new TextDecoder().decode(bytes)));
  }, exported);
  expect(keys.sort()).toEqual(['did', 'ideas', 'scripts', 'settings', 'streak']);
  const did = await page.evaluate(() => localStorage.getItem('tw.did'));
  const fresh = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const importedPage = await fresh.newPage();
  await importedPage.goto('/studio#/settings');
  await importedPage.evaluate((code) => navigator.clipboard.writeText(code), exported);
  await Promise.all([
    importedPage.waitForEvent('load'),
    importedPage.getByRole('button', { name: 'Paste scripts' }).click(),
  ]);
  await expect(importedPage).toHaveURL(/#\/scripts$/);
  await expect(importedPage.getByText('Transfer title')).toBeVisible({ timeout: 15000 });
  await expect(importedPage.getByRole('status')).toContainText('Scripts added: 1');
  expect(await importedPage.evaluate(() => localStorage.getItem('tw.did'))).toBe(did);
  await importedPage.goto('/studio#/settings/prompter');
  await expect(importedPage.getByLabel('Prompter dock')).toHaveValue('left');
  const importedStreak = await importedPage.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const value = await new Promise<unknown>((resolve) => {
      const query = db.transaction('kv', 'readonly').objectStore('kv').get('streak');
      query.onsuccess = () => resolve(query.result);
    });
    db.close();
    return value;
  });
  expect(importedStreak).toMatchObject({
    current: 1,
    best: 2,
    activeDates: [today],
  });
  await importedPage.goto('/studio#/inbox');
  await expect(importedPage.getByText('An idea to move')).toBeVisible();
  await importedPage.goto('/studio#/scripts');
  await importedPage.getByRole('link', { name: /^Transfer title/ }).click();
  await importedPage.getByLabel('Title', { exact: true }).fill('Locally newer title');
  await expect(importedPage.getByText('Saved')).toBeVisible();
  await importedPage.goto('/studio#/settings');
  await importedPage.evaluate((code) => navigator.clipboard.writeText(code), exported);
  await Promise.all([
    importedPage.waitForEvent('load'),
    importedPage.getByRole('button', { name: 'Paste scripts' }).click(),
  ]);
  await expect(importedPage).toHaveURL(/#\/scripts$/);
  await expect(importedPage.getByText('Locally newer title')).toBeVisible();
  await expect(importedPage.getByText('Transfer title')).toHaveCount(0);
  await fresh.close();
});

test('transfer rejects decoded payloads over 1 MB', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/studio#/settings');
  const oversized = await page.evaluate(() => {
    const bytes = new Uint8Array(1024 * 1024 + 2);
    bytes[0] = 0;
    bytes.fill(65, 1);
    let body = '';
    for (let i = 0; i < bytes.length; i += 8192)
      body += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return `T1.${btoa(body).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  });
  await page.evaluate((code) => navigator.clipboard.writeText(code), oversized);
  await page.getByRole('button', { name: 'Paste scripts' }).click();
  await expect(page.getByRole('status')).toContainText('Transfer exceeds 1 MB');
});

test('transfer uses raw UTF-8 when deflate-raw is unavailable', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'CompressionStream', {
      configurable: true,
      value: class {
        constructor() {
          throw new Error('unsupported format');
        }
      },
    });
  });
  await page.goto('/studio#/settings');
  await page.getByRole('button', { name: 'Copy transfer code' }).click();
  await expect(page.getByRole('status')).toContainText('Transfer code copied');
  const flag = await page.evaluate(async () =>
    atob(
      (await navigator.clipboard.readText()).slice(3).replace(/-/g, '+').replace(/_/g, '/'),
    ).charCodeAt(0),
  );
  expect(flag).toBe(0);
});

async function submitShare(page: Page, fields: Record<string, string>) {
  await page.evaluate((values) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/share-target';
    form.enctype = 'multipart/form-data';
    for (const [name, value] of Object.entries(values)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.append(input);
    }
    document.body.append(form);
    form.submit();
  }, fields);
}

test('share target stores an idea and lands on the inbox like a share sheet', async ({ page }) => {
  const calls: unknown[] = [];
  await page.exposeFunction('recordUmami', (call: unknown) => calls.push(call));
  await page.addInitScript(() => {
    const record = (window as unknown as { recordUmami: (call: unknown) => void }).recordUmami;
    (window as unknown as { umami: unknown }).umami = {
      track: (...args: unknown[]) => record(args),
      identify: () => undefined,
    };
  });
  await page.goto('/studio');
  await waitForController(page);
  await submitShare(page, {
    title: 'Shared headline',
    text: 'Shared body',
    url: 'https://example.org/story',
  });
  await expect(page).toHaveURL(/\/studio#\/inbox$/);
  await expect(page.getByRole('heading', { name: 'Ideas inbox' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Idea saved.');
  await expect(
    page.getByText(/Shared headline\s+Shared body\s+https:\/\/example.org\/story/),
  ).toBeVisible();
  const stored = await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const rows = await new Promise<Array<Record<string, unknown>>>((resolve) => {
      const query = db.transaction('ideas', 'readonly').objectStore('ideas').getAll();
      query.onsuccess = () => resolve(query.result);
    });
    db.close();
    return rows;
  });
  expect(stored).toHaveLength(1);
  expect(Object.keys(stored[0] ?? {}).sort()).toEqual(['createdAt', 'id', 'text']);
  await expect
    .poll(() => JSON.stringify(calls))
    .toContain('"captured_idea",{"source":"share_target"}');
  const sent = JSON.stringify(calls);
  expect(sent).not.toContain('Shared headline');
  expect(sent).not.toContain('Shared body');
  expect(sent).not.toContain('example.org');
  const captures = () =>
    calls.filter((call) => JSON.stringify(call).includes('captured_idea')).length;
  expect(captures()).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ideas inbox' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(captures()).toBe(1);
});

test('share target says nothing was saved for an empty share', async ({ page }) => {
  await page.goto('/studio');
  await waitForController(page);
  await submitShare(page, { title: '   ', url: 'javascript:alert(1)' });
  await expect(page).toHaveURL(/\/studio#\/inbox$/);
  await expect(page.getByText('No ideas yet.')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('the inbox reports a share that could not be saved', async ({ page }) => {
  await page.goto('/studio#/inbox?shared=error');
  await expect(page.getByRole('status')).toContainText('We could not save that share.');
  await expect(page).toHaveURL(/#\/inbox$/);
});

test('iOS install sheet follows the second-session ask and dismissal cooldown', async ({
  browser,
}) => {
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
    userAgent: IPHONE,
  });
  const page = await context.newPage();
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Add to your Home Screen' })).toHaveCount(0);
  await page.close();
  const second = await context.newPage();
  await second.goto('/studio');
  await expect(
    second.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await expect(second.getByRole('dialog', { name: 'Add to your Home Screen' })).toBeVisible();
  await expect(
    second.getByText(
      'Open the Share menu, then tap Add to Home Screen. The app opens full screen and keeps your takes safer.',
    ),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page: second }).include('.studio-install-sheet').analyze()).violations,
  ).toEqual([]);
  await second.getByRole('button', { name: 'Show me how' }).click();
  await expect(
    second.getByText('We copied your scripts. In the app, tap Paste scripts.'),
  ).toBeVisible();
  expect((await second.evaluate(() => navigator.clipboard.readText())).startsWith('T1.')).toBe(
    true,
  );
  await second.getByRole('button', { name: 'Not now' }).click();
  await second.close();
  const third = await context.newPage();
  await third.goto('/studio');
  await expect(third.getByRole('dialog', { name: 'Add to your Home Screen' })).toHaveCount(0);
  await context.close();
});

test('first standalone launch requests persistence once', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
    Object.defineProperty(navigator.storage, 'persist', {
      configurable: true,
      value: async () => {
        localStorage.setItem(
          'persist.calls',
          String(Number(localStorage.getItem('persist.calls') ?? '0') + 1),
        );
        return true;
      },
    });
  });
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('persist.calls'))).toBe('1');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('persist.calls'))).toBe('1');
});

test('Android install ask waits until a take export leaves recording', async ({ page }) => {
  await page.goto('/studio#/record/quick');
  await expect(page.getByRole('heading', { name: 'Camera and mic, please' })).toBeVisible();
  await fireInstallPrompt(page);
  await expect(page.getByRole('dialog', { name: 'Install teleprompter.wtf' })).toHaveCount(0);
  await page.evaluate(() => dispatchEvent(new Event('studio-take-exported')));
  await expect(page.getByRole('dialog', { name: 'Install teleprompter.wtf' })).toBeVisible();
  await page.getByRole('button', { name: 'Install', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Install teleprompter.wtf' })).toHaveCount(0);
});

test('standalone launch uses display-mode too, and installed users never see a sheet', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query: string) =>
      query === '(display-mode: standalone)'
        ? ({ matches: true, addEventListener() {}, removeEventListener() {} } as never)
        : original(query);
    localStorage.setItem('studio.install.sessions', '5');
    Object.defineProperty(navigator.storage, 'persist', {
      configurable: true,
      value: async () => {
        localStorage.setItem('persist.calls', '1');
        return true;
      },
    });
  });
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('persist.calls'))).toBe('1');
  await fireInstallPrompt(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await context.close();
});

test('a browser tab does not request persistence for standalone', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.storage, 'persist', {
      configurable: true,
      value: async () => {
        localStorage.setItem('persist.calls', '1');
        return true;
      },
    });
  });
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('persist.calls'))).toBeNull();
});

test('Home Screen app with empty storage offers to bring scripts from Safari', async ({
  browser,
}) => {
  const source = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const safari = await source.newPage();
  await safari.goto('/studio#/settings');
  await safari.getByRole('button', { name: 'Copy transfer code' }).click();
  await expect(safari.getByRole('status')).toContainText('Transfer code copied');
  const code = await safari.evaluate(() => navigator.clipboard.readText());
  const did = await safari.evaluate(() => localStorage.getItem('tw.did'));
  await source.close();

  const context = await browser.newContext({
    userAgent: IPHONE,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
  });
  await page.goto('/studio');
  await expect(page.getByRole('heading', { name: 'Bring your scripts from Safari' })).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.studio-home').analyze()).violations).toEqual([]);
  await page.evaluate((value) => navigator.clipboard.writeText(value), code);
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('button', { name: 'Paste scripts' }).click(),
  ]);
  await expect(page.getByRole('status')).toContainText('Scripts added:');
  expect(await page.evaluate(() => localStorage.getItem('tw.did'))).toBe(did);
  await context.close();
});

test('the transfer card stays away from Safari tabs', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: IPHONE });
  const tab = await context.newPage();
  await tab.goto('/studio');
  await expect(
    tab.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await expect(tab.getByRole('heading', { name: 'Bring your scripts from Safari' })).toHaveCount(0);
  await context.close();
});

test('pasting falls back to a labelled field when the clipboard is refused', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, 'readText', {
      configurable: true,
      value: async () => {
        throw new DOMException('denied', 'NotAllowedError');
      },
    });
  });
  await page.goto('/studio#/settings');
  await page.getByRole('button', { name: 'Paste scripts' }).click();
  await expect(page.getByRole('status')).toContainText('We could not read the clipboard.');
  await page.getByLabel('Transfer code').fill('not a code');
  await page.getByRole('button', { name: 'Add scripts' }).click();
  await expect(page.getByRole('status')).toContainText('Invalid transfer code');
  expect(
    (await new AxeBuilder({ page }).include('.studio-transfer-manual').analyze()).violations,
  ).toEqual([]);
});

test('a bad code changes nothing and explains itself', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/studio#/settings');
  await expect(page.getByRole('button', { name: 'Paste scripts' })).toBeVisible();
  const did = await page.evaluate(() => localStorage.getItem('tw.did'));
  expect(did).toMatch(/^[A-Za-z0-9_-]{22}$/);
  await page.evaluate(() => navigator.clipboard.writeText('T1.not-really-a-code'));
  await page.getByRole('button', { name: 'Paste scripts' }).click();
  await expect(page.getByRole('status')).toContainText('Invalid transfer code');
  expect(await page.evaluate(() => localStorage.getItem('tw.did'))).toBe(did);
});

test('transfer analytics carry the direction and no script text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const calls: unknown[] = [];
  await page.exposeFunction('recordUmami', (call: unknown) => calls.push(call));
  await page.addInitScript(() => {
    const record = (window as unknown as { recordUmami: (call: unknown) => void }).recordUmami;
    (window as unknown as { umami: unknown }).umami = {
      track: (...args: unknown[]) => record(args),
      identify: () => undefined,
    };
  });
  await page.goto('/studio#/settings');
  await page.getByRole('button', { name: 'Copy transfer code' }).click();
  await expect(page.getByRole('status')).toContainText('Transfer code copied');
  await expect
    .poll(() => JSON.stringify(calls))
    .toContain('"transferred_scripts",{"direction":"export"}');
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('button', { name: 'Paste scripts' }).click(),
  ]);
  await expect
    .poll(() => JSON.stringify(calls))
    .toContain('"transferred_scripts",{"direction":"import"}');
  const code = await page.evaluate(() => navigator.clipboard.readText());
  const sent = JSON.stringify(calls);
  expect(sent).not.toContain(code);
  expect(sent).not.toContain('Introduce yourself');
});

test('the install ladder stops after three asks', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('studio.install.sessions', '5');
    localStorage.setItem('studio.install.shown', '3');
  });
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await fireInstallPrompt(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a dismissal under seven days old holds, and an older one releases', async ({ browser }) => {
  for (const [days, shown] of [
    [6, false],
    [8, true],
  ] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript((ago) => {
      localStorage.setItem('studio.install.sessions', '5');
      localStorage.setItem('studio.install.dismissed', String(Date.now() - ago * 86400000));
    }, days);
    await page.goto('/studio');
    await expect(
      page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
    ).toBeVisible();
    await fireInstallPrompt(page);
    await expect(page.getByRole('dialog', { name: 'Install teleprompter.wtf' })).toHaveCount(
      shown ? 1 : 0,
    );
    await context.close();
  }
});

test('the Android sheet is accessible, traps focus, and Escape counts as a dismissal', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('studio.install.sessions', '5'));
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await fireInstallPrompt(page);
  const sheet = page.getByRole('dialog', { name: 'Install teleprompter.wtf' });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByText('Full screen, works offline, one tap from your home screen.'),
  ).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Install', exact: true })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).include('.studio-install-sheet').analyze()).violations,
  ).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(sheet.getByRole('button', { name: 'Not now' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(sheet.getByRole('button', { name: 'Install', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(sheet.getByRole('button', { name: 'Not now' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  expect(
    Number(await page.evaluate(() => localStorage.getItem('studio.install.dismissed'))),
  ).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem('studio.install.shown'))).toBe('1');
});

test('an install prompt fired before Studio boots is not lost', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('studio.install.sessions', '5');
    // Hold IndexedDB back so the event lands while the shell still shows its loading state.
    const open = indexedDB.open.bind(indexedDB);
    let held = false;
    indexedDB.open = ((...args: Parameters<typeof open>) => {
      if (!held) {
        held = true;
        const event = new Event('beforeinstallprompt', { cancelable: true });
        Object.defineProperty(event, 'prompt', { value: async () => undefined });
        Object.defineProperty(event, 'userChoice', {
          value: Promise.resolve({ outcome: 'dismissed' }),
        });
        dispatchEvent(event);
      }
      return open(...args);
    }) as typeof indexedDB.open;
  });
  await page.goto('/studio');
  await expect(page.getByRole('dialog', { name: 'Install teleprompter.wtf' })).toBeVisible();
});

test('in-app browsers get no install sheet', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: `${IPHONE} Instagram 300.0` });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('studio.install.sessions', '5'));
  await page.goto('/studio');
  await expect(page.getByText("Instagram's browser can't record video.")).toBeVisible();
  await fireInstallPrompt(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await context.close();
});

test('appinstalled closes the sheet and is tracked once', async ({ page }) => {
  const calls: unknown[] = [];
  await page.exposeFunction('recordUmami', (call: unknown) => calls.push(call));
  await page.addInitScript(() => {
    localStorage.setItem('studio.install.sessions', '5');
    const record = (window as unknown as { recordUmami: (call: unknown) => void }).recordUmami;
    (window as unknown as { umami: unknown }).umami = {
      track: (...args: unknown[]) => record(args),
      identify: () => undefined,
    };
  });
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await fireInstallPrompt(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => JSON.stringify(calls)).toContain('"shown_install_prompt"');
  await expect.poll(() => JSON.stringify(calls)).toContain('"installed_app"');
});

test('waiting service worker offers a reload action', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: {},
        register: async () => ({
          waiting: { postMessage: (value: string) => sessionStorage.setItem('sw.message', value) },
          addEventListener: () => undefined,
        }),
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    });
  });
  await page.goto('/studio');
  await expect(page.getByRole('status').filter({ hasText: 'Update ready' })).toBeVisible();
  await page.goto('/studio#/record/quick');
  await expect(page.getByRole('heading', { name: 'Camera and mic, please' })).toBeVisible();
  await expect(page.getByText('Update ready')).toHaveCount(0);
  await page.goto('/studio#/');
  await page.getByRole('button', { name: 'Reload' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('sw.message'))).toBe('SKIP_WAITING');
});

test('a worker that finishes installing after registration still offers the update', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const listeners: Array<() => void> = [];
    const reg: Record<string, unknown> = {
      waiting: null,
      installing: {
        addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
      },
      addEventListener: () => undefined,
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: {},
        register: async () => reg,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    });
    (window as unknown as { finishInstall: () => void }).finishInstall = () => {
      reg.waiting = { postMessage: () => undefined };
      for (const listener of listeners) listener();
    };
  });
  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await expect(page.getByText('Update ready')).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { finishInstall: () => void }).finishInstall());
  await expect(page.getByText('Update ready')).toBeVisible();
});

test('a first install offers no update toast', async ({ page }) => {
  await page.goto('/studio');
  await waitForController(page);
  await expect(page.getByText('Update ready')).toHaveCount(0);
});
