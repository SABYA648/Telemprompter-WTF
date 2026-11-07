import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const SCRIPT = [
  '# Hook',
  'Stop scrolling for one second and listen to this.',
  '# Story',
  'I tried waking up early for a month and here is what changed for me.',
  '# Call to action',
  'Follow for the full routine tomorrow.',
].join('\n');

async function stubUmami(page: Page) {
  await page.route('https://analytics.sabya.pm/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.__tracks = []; window.umami = { track: (e, p) => window.__tracks.push([e, p]), identify() {} };',
    }),
  );
}
const tracks = (page: Page) =>
  page.evaluate(
    () => (window as typeof window & { __tracks?: Array<[unknown, unknown]> }).__tracks ?? [],
  );

/** A kept take with a scroll timeline across three sections, stored like a real one. */
async function seedTake(page: Page, overrides: Record<string, unknown> = {}) {
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Script', { exact: true }).fill(SCRIPT);
  await expect(page.getByText('Saved')).toBeVisible();
  await page.evaluate(async (extra) => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['takes', 'chunks'], 'readwrite');
    tx.objectStore('takes').put({
      id: 'seed-m11',
      scriptId: 'quick',
      sectionIndex: null,
      number: 1,
      status: 'ready',
      mimeType: 'video/webm',
      container: 'webm',
      width: 1080,
      height: 1920,
      frameRate: 30,
      facing: 'front',
      durationMs: 45_000,
      sizeBytes: 4,
      chunkCount: 1,
      kept: true,
      starred: false,
      exportedAt: null,
      createdAt: Date.now(),
      wordsPerLine: 4,
      timeline: [
        { t: 100, line: 0, section: 0 },
        { t: 4_000, line: 1, section: 0 },
        { t: 12_500, line: 3, section: 1 },
        { t: 30_000, line: 6, section: 2 },
      ],
      trim: null,
      ...extra,
    });
    tx.objectStore('chunks').put({
      takeId: 'seed-m11',
      seq: 0,
      blob: new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])], { type: 'video/webm' }),
    });
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  }, overrides);
}

/** Visible accent-filled controls outside the tab bar, as in the M12 check. */
const accentActions = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('a, button, summary, [role="button"]')]
      .filter((el) => !el.closest('.studio-tabs'))
      .filter((el) => el.checkVisibility({ visibilityProperty: true }))
      .filter((el) => getComputedStyle(el).backgroundColor === 'rgb(240, 71, 42)')
      .map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim()),
  );

test('the operator window mirrors play and pause from the main window', async ({ page }) => {
  await stubUmami(page);
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Script', { exact: true }).fill(SCRIPT);
  await expect(page.getByText('Saved')).toBeVisible();
  // Present, Operator window and Print share one Present sheet in the ... menu.
  await page.getByLabel('More script actions').click();
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  const [operator] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Operator window' }).click(),
  ]);
  await expect(operator).toHaveURL(/\/studio#\/prompter-window$/);
  const view = operator.getByRole('main', { name: 'Operator window' });
  // The editor answers the window's hello with the script being edited.
  await expect(view).toContainText('Stop scrolling for one second');
  await expect(view).toHaveAttribute('data-playing', 'false');
  await expect(operator.getByRole('navigation', { name: 'Studio navigation' })).toHaveCount(0);
  expect(await tracks(page)).toContainEqual(['opened_operator_window', {}]);

  await page.locator('.studio-editor').getByRole('link', { name: 'Practice' }).click();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(view).toHaveAttribute('data-playing', 'true');
  await expect(operator.getByRole('status')).toContainText('WPM');
  await expect
    .poll(() => operator.locator('.studio-operator__scroll').evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(view).toHaveAttribute('data-playing', 'false');
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(view).toHaveAttribute('data-playing', 'true');

  // Mirror modes and full screen live in the window itself.
  await operator.getByRole('button', { name: 'Mirror: off' }).click();
  await expect(operator.locator('.studio-operator__scroll')).toHaveClass(/mirror-horizontal/);
  await expect(operator.getByRole('button', { name: 'Full screen' })).toBeVisible();
});

test('a gamepad A press toggles practice and the D-pad changes speed', async ({ page }) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
    const pad = { index: 0, connected: true, mapping: 'standard', buttons, axes: [] };
    const w = window as typeof window & { __polls: number };
    w.__polls = 0;
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => {
        w.__polls += 1;
        return [pad];
      },
    });
    (window as typeof window & { __press: (i: number, down: boolean) => void }).__press = (
      i,
      down,
    ) => {
      buttons[i]!.pressed = down;
    };
  });
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Script', { exact: true }).fill(SCRIPT);
  await expect(page.getByText('Saved')).toBeVisible();
  await page.goto('/studio#/practice/quick');
  await expect(page.getByText('140 WPM')).toBeVisible();
  // Press only once the Practice screen's poll loop is running, or the first press is missed.
  const polls = () => page.evaluate(() => (window as never as { __polls: number }).__polls);
  const seen = await polls();
  await expect.poll(polls).toBeGreaterThan(seen + 1);
  // The app polls the pad once per animation frame, so hold each state for two full frames
  // instead of a fixed timeout; a loaded machine can stretch 80ms past a single frame.
  const press = async (button: number) => {
    for (const down of [true, false])
      await page.evaluate(
        ([i, d]) =>
          new Promise<void>((resolve) => {
            (window as never as { __press: (i: number, d: boolean) => void }).__press(i, d);
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
        [button, down] as const,
      );
  };
  await press(12);
  await expect(page.getByText('145 WPM')).toBeVisible();
  await press(13);
  await press(13);
  await expect(page.getByText('135 WPM')).toBeVisible();
  await press(0);
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  // Wait for practice time to tick (Finish appears) so the pause reads as Resume, not a fresh start.
  await expect(page.getByRole('button', { name: 'Finish practice' })).toBeVisible();
  await press(0);
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
});

test('MP4 conversion and trim stay behind feature detection and never load mediabunny', async ({
  page,
}) => {
  await page.addInitScript(() => {
    // CI browsers lack an H.264 encoder; remove WebCodecs so the unsupported path is certain.
    delete (window as { VideoEncoder?: unknown }).VideoEncoder;
    delete (window as { AudioEncoder?: unknown }).AudioEncoder;
  });
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await stubUmami(page);
  await seedTake(page);
  await page.goto('/studio#/takes/seed-m11');
  await expect(page.getByRole('heading', { name: 'Take 1' })).toBeVisible();
  await page.getByLabel('More take actions').click();
  await page.getByRole('button', { name: 'Convert to MP4' }).click();
  const sheet = page.getByRole('dialog', { name: 'Convert to MP4' });
  await expect(sheet).toContainText("This browser can't make MP4 files on the device.");
  await expect(sheet.getByRole('button', { name: 'Convert to MP4' })).toHaveCount(0);
  expect(await tracks(page)).toContainEqual(['converted_take', { result: 'unsupported' }]);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);

  await page.getByLabel('More take actions').click();
  await page.getByRole('button', { name: 'Trim' }).click();
  const trim = page.getByRole('dialog', { name: 'Trim' });
  await expect(trim).toContainText("This browser can't make MP4 files on the device.");
  await expect(trim.getByRole('button', { name: 'Suggest trim' })).toHaveCount(0);
  expect(requested.filter((url) => /mediabunny/.test(url))).toEqual([]);
});

test('chapters and captions export from the scroll timeline', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await stubUmami(page);
  await seedTake(page);
  await page.goto('/studio#/takes/seed-m11');
  await page.getByLabel('More take actions').click();
  await page.getByRole('button', { name: 'Chapters' }).click();
  const chapters = page.getByRole('dialog', { name: 'YouTube chapters' });
  await expect(chapters).toContainText('Timed from your scroll, not from speech.');
  await expect(chapters.getByLabel('Chapters')).toHaveValue(
    '00:00 Hook\n00:12 Story\n00:30 Call to action',
  );
  expect(await accentActions(page)).toEqual(['Copy chapters']);
  await chapters.getByRole('button', { name: 'Copy chapters' }).click();
  await expect(chapters.getByRole('status')).toContainText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '00:00 Hook\n00:12 Story\n00:30 Call to action',
  );
  expect(await tracks(page)).toContainEqual(['exported_chapters', {}]);
  await chapters.getByRole('button', { name: 'Close' }).click();

  await page.getByLabel('More take actions').click();
  await page.getByRole('button', { name: 'Captions' }).click();
  const captions = page.getByRole('dialog', { name: 'Captions' });
  await expect(captions).toContainText('Timed from your scroll, not from speech.');
  await expect(captions.getByLabel('Caption preview')).toContainText(
    '00:00:00,000 --> 00:00:04,000',
  );
  const download = page.waitForEvent('download');
  await captions.getByRole('button', { name: 'Download SRT' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/take1-\d{8}\.srt$/);
  const srt = await readFile((await file.path())!, 'utf8');
  expect(srt.startsWith('1\n00:00:00,000 --> 00:00:04,000\nStop scrolling for one\n')).toBe(true);
  expect(srt).toContain('00:00:30,000 --> 00:00:45,000');
  expect(await tracks(page)).toContainEqual(['exported_captions', {}]);
});

test('chapters explain why they are unavailable', async ({ page }) => {
  await seedTake(page, {
    timeline: [
      { t: 0, line: 0, section: 0 },
      { t: 5_000, line: 3, section: 1 },
      { t: 30_000, line: 6, section: 2 },
    ],
  });
  await page.goto('/studio#/takes/seed-m11');
  await page.getByLabel('More take actions').click();
  await page.getByRole('button', { name: 'Chapters' }).click();
  await expect(page.getByRole('dialog', { name: 'YouTube chapters' })).toContainText(
    'Each chapter needs at least 10 seconds. "Hook" ran 5 seconds.',
  );
});

test('take detail keeps one accent action and fits 360 and 390 px', async ({ page }) => {
  await seedTake(page);
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/studio#/takes/seed-m11');
    await expect(page.getByRole('heading', { name: 'Take 1' })).toBeVisible();
    expect(await accentActions(page)).toHaveLength(1);
    await page.getByLabel('More take actions').click();
    const items = page.locator('.studio-overflow[open] .studio-overflow__menu button');
    await expect(items).toHaveText(['Chapters', 'Captions', 'Convert to MP4', 'Trim', 'Delete']);
    for (const box of await items.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
    )) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await items.filter({ hasText: 'Trim' }).click();
    const sheet = page.getByRole('dialog', { name: 'Trim' });
    await expect(sheet).not.toContainText('Checking this browser');
    // The sheet's own action (when this browser can encode) is the only accent on screen.
    expect((await accentActions(page)).length).toBeLessThanOrEqual(1);
    await expect(page.locator('.studio-take-actions')).toBeHidden();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await sheet.getByRole('button', { name: 'Close' }).click();
  }
});

test('imports a .docx and a .md script from the library + sheet', async ({ page }) => {
  await stubUmami(page);
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: 'New script' }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Import', exact: true }).click(),
  ]);
  await chooser.setFiles('tests/fixtures/script.docx');
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Morning Routine Reel');
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(
    /^# Hook\n\nStop scrolling\. This changed my mornings & my focus\./,
  );
  expect(await tracks(page)).toContainEqual(['created_script', { source: 'import' }]);

  // Import lives in the library's "+" sheet only, not the editor's ... menu.
  await page.getByLabel('More script actions').click();
  await expect(page.getByRole('button', { name: /^Import/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: 'New script' }).click();
  const [mdChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Import', exact: true }).click(),
  ]);
  await mdChooser.setFiles({
    name: 'launch.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Launch day\n\n## Hook\nRead **this** [now](https://x.test).'),
  });
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Launch day');
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(
    '# Hook\nRead **this** now.',
  );
});

test('a broken .docx shows an honest message', async ({ page }) => {
  await page.goto('/studio#/scripts');
  await page.getByRole('button', { name: 'New script' }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Import', exact: true }).click(),
  ]);
  await chooser.setFiles({
    name: 'bad.docx',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('nope'),
  });
  await expect(page.getByRole('status')).toContainText("We couldn't read that Word file.");
});

test('print shows only the script', async ({ page }) => {
  await page.goto('/studio#/scripts/quick');
  await page.getByLabel('Script', { exact: true }).fill(SCRIPT);
  await expect(page.getByText('Saved')).toBeVisible();
  await page.getByLabel('More script actions').click();
  await page.getByRole('button', { name: 'Present', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Print or PDF' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Present' })).toHaveCount(0);
  await expect(page.locator('.studio-print')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.studio-print')).toBeVisible();
  await expect(page.locator('.studio-print h1')).toBeVisible();
  await expect(page.locator('.studio-print')).toContainText('Call to action');
  await expect(page.locator('.studio-tabs')).toBeHidden();
  await expect(page.getByLabel('Script', { exact: true })).toBeHidden();
});
