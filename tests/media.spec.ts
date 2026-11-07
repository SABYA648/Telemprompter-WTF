import { expect, test } from '@playwright/test';

async function openRecordFromEditor(page: import('@playwright/test').Page) {
  // The editor has no Record button of its own; the nav's center Record records this script.
  await page
    .getByRole('navigation', { name: 'Studio navigation' })
    .getByRole('link', { name: 'Record this script' })
    .click();
}

async function recordAndKeep(page: import('@playwright/test').Page) {
  // The priming sheet appears once; later scripts in a session open straight on the camera.
  const allow = page.getByRole('button', { name: 'Allow camera' });
  const start = page.getByRole('button', { name: 'Start recording' });
  await expect(allow.or(start)).toBeVisible();
  if (await allow.isVisible()) await allow.click();
  await expect(start).toBeVisible();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page
    .getByRole('dialog', { name: 'Quick settings' })
    .getByRole('button', { name: 'Close' })
    .click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  const review = page.getByRole('dialog', { name: 'Review take' });
  await expect(review).toBeVisible();
  await review.getByRole('button', { name: 'Keep', exact: true }).click();
}

test('Studio identifies persisted buckets before boot and updates identity after Keep', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 10, 6, 12));
  await page.route('https://analytics.sabya.pm/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.__identifies = []; window.umami = { identify: (id, data) => window.__identifies.push(data), track: () => {} };`,
    }),
  );
  await page.goto('/studio#/scripts/quick');
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction(['kv', 'takes'], 'readwrite');
    tx.objectStore('kv').put({ activeDates: ['2026-11-05'] }, 'streak');
    tx.objectStore('takes').put({
      id: 'seed-identity',
      scriptId: 'quick',
      kept: true,
      durationMs: 30000,
      wordsRead: 10,
      createdAt: new Date(2026, 10, 5, 12).getTime(),
      exportedAt: null,
    });
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.goto('/studio#/record/quick');
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __identifies: Array<Record<string, string>> })
            .__identifies?.[0],
      ),
    )
    .toMatchObject({
      takes_bucket: '1',
      streak_bucket: '1',
    });
  await recordAndKeep(page);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as typeof window & { __identifies: Array<Record<string, string>> }
        ).__identifies?.at(-1),
      ),
    )
    .toMatchObject({
      takes_bucket: '2_5',
      streak_bucket: '2_6',
    });
});

test('the live camera is full-bleed with no tab bar, and the X is the exit, at phone widths', async ({
  page,
}) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/studio#/record/quick');
    const allow = page.getByRole('button', { name: 'Allow camera' });
    const start = page.getByRole('button', { name: 'Start recording' });
    await expect(allow.or(start)).toBeVisible();
    if (await allow.isVisible()) {
      // The permission screen still has the tab bar.
      await expect(page.locator('.studio-tabs')).toHaveCount(1);
      await allow.click();
    }
    await expect(start).toBeVisible();
    // One red record action: the shutter. No nav Record under it.
    await expect(page.locator('.studio-tabs')).toHaveCount(0);
    const screen = (await page.locator('.record-screen').boundingBox())!;
    expect(screen.y + screen.height).toBe(800);
    const controls = (await page.locator('.record-controls').boundingBox())!;
    expect(controls.y + controls.height).toBeLessThanOrEqual(800);
    // The safe-zone frame peeks with no visible caption, clear of the shutter row, then rests off.
    await page.getByRole('button', { name: 'Quick settings' }).click();
    await page.getByLabel('Safe zones').selectOption('instagram');
    await page
      .getByRole('dialog', { name: 'Quick settings' })
      .getByRole('button', { name: 'Close' })
      .click();
    const frame = page.locator('.record-safe-zone');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveText('');
    await expect(frame).toHaveAttribute('aria-hidden', 'true');
    const zone = (await frame.boundingBox())!;
    const row = (await page.locator('.record-main-controls').boundingBox())!;
    expect(zone.y + zone.height).toBeLessThanOrEqual(row.y);
    await expect(frame).toHaveCount(0, { timeout: 8000 });
    // One shutter row of five slots: close, flip, shutter, Aa, settings. Nothing else at rest.
    await expect(page.locator('.record-main-controls > *')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Slower' })).toHaveCount(0);
    const shutter = (await start.boundingBox())!;
    expect(Math.abs(shutter.x + shutter.width / 2 - width / 2)).toBeLessThanOrEqual(2);
    // Speed, text size and fit live in the Aa tray, fully on screen and uncovered.
    await page.getByRole('button', { name: 'Prompter controls' }).click();
    const tray = page.getByRole('group', { name: 'Prompter controls' });
    const trayBox = (await tray.boundingBox())!;
    expect(trayBox.x + trayBox.width).toBeLessThanOrEqual(width);
    const covered = await tray.evaluate(
      (element) =>
        [...element.querySelectorAll('button')].filter((button) => {
          const rect = button.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return !(hit === button || button.contains(hit));
        }).length,
    );
    expect(covered).toBe(0);
    for (const name of ['Smaller text', 'Larger text', 'Fit speed to target length']) {
      const button = page.getByRole('button', { name });
      await expect(button).toBeVisible();
      await expect(button.locator('svg')).toHaveCount(1);
      expect(((await button.textContent()) ?? '').trim()).toBe('');
      const box = (await button.boundingBox())!;
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    }
    const before = Number((await tray.textContent())!.match(/(\d+) WPM/)![1]);
    await page.getByRole('button', { name: 'Faster' }).click();
    await expect(tray).toContainText(`${before + 5} WPM`);
    // A hand-picked speed ends the fit, so the timer's target loses its fit tint.
    await expect(page.locator('.record-timer .is-fit')).toHaveCount(0);
    await page.getByRole('button', { name: 'Prompter controls' }).click();
    await expect(tray).toHaveCount(0);
    // The quick script opens on real words, not fill-in blanks.
    await expect(page.locator('.prompter-scroll')).not.toContainText('{');
    await expect(page.locator('.prompter-scroll')).not.toContainText("I'm name");
    await page.getByRole('link', { name: 'Close recording' }).click();
    await expect(page).toHaveURL(/#\/scripts\/quick$/);
    await expect(page.locator('.studio-tabs')).toHaveCount(1);
  }
});

for (const viewport of [
  { width: 320, height: 640 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`active take stays on its script and review actions clear nav at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/studio#/scripts/new');
    await page.getByLabel('Title', { exact: true }).fill('Mobile recording target');
    await page.getByLabel('Script', { exact: true }).fill('This take belongs to my new script.');
    await expect(page.getByText('Saved')).toBeVisible();
    const scriptId = page.url().split('#/scripts/')[1];
    await openRecordFromEditor(page);
    const allow = page.getByRole('button', { name: 'Allow camera' });
    const start = page.getByRole('button', { name: 'Start recording' });
    await expect(allow.or(start)).toBeVisible();
    if (await allow.isVisible()) await allow.click();
    await page.getByRole('button', { name: 'Quick settings' }).click();
    await page.getByLabel('Countdown').selectOption('0');
    await page
      .getByRole('dialog', { name: 'Quick settings' })
      .getByRole('button', { name: 'Close' })
      .click();
    await start.click();
    await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
    // No tab bar while recording, so nothing under the shutter can reload the route.
    await expect(page.locator('.studio-tabs')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`#\\/record\\/${scriptId}$`));
    await page.waitForTimeout(700);
    await page.getByRole('button', { name: 'Stop recording' }).click();
    const review = page.getByRole('dialog', { name: 'Review take' });
    await expect(review).toBeVisible();
    const keep = review.getByRole('button', { name: 'Keep', exact: true });
    await keep.scrollIntoViewIfNeeded();
    const target = (await keep.boundingBox())!;
    expect(target.y + target.height).toBeLessThanOrEqual(viewport.height);
    expect(
      await keep.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return hit === element || element.contains(hit);
      }),
    ).toBe(true);
    await keep.click();
    await expect.poll(async () => (await storedTakes(page))[0]?.kept).toBe(true);
    expect((await storedTakes(page))[0]?.scriptId).toBe(scriptId);
    const statuses = await page.evaluate(
      () =>
        new Promise<Array<{ id: string; status: string }>>((resolve, reject) => {
          const open = indexedDB.open('teleprompter-wtf');
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const rows = open.result.transaction('scripts').objectStore('scripts').getAll();
            rows.onerror = () => reject(rows.error);
            rows.onsuccess = () => resolve(rows.result);
          };
        }),
    );
    expect(statuses.find((script) => script.id === scriptId)?.status).toBe('recorded');
    expect(statuses.find((script) => script.id === 'quick')?.status).not.toBe('recorded');
  });
}

test('practice camera preview is optional and stops with the toggle', async ({ page }) => {
  await page.goto('/studio#/practice/quick');
  await expect(page.locator('video')).toHaveCount(0);
  await page.getByLabel('Camera preview').check();
  const video = page.locator('video');
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.srcObject !== null))
    .toBe(true);
  await page.getByLabel('Camera preview').uncheck();
  await expect(page.locator('video')).toHaveCount(0);
});

test('the nav Record in the editor opens Record on the edited script', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  await page.getByLabel('Title', { exact: true }).fill('Nav record target');
  await page.getByLabel('Script', { exact: true }).fill('These are the words I just edited.');
  await expect(page.getByText('Saved')).toBeVisible();
  const scriptId = page.url().split('#/scripts/')[1];
  await openRecordFromEditor(page);
  await expect(page).toHaveURL(new RegExp(`#\\/record\\/${scriptId}$`));
  const allow = page.getByRole('button', { name: 'Allow camera' });
  const start = page.getByRole('button', { name: 'Start recording' });
  await expect(allow.or(start)).toBeVisible();
  if (await allow.isVisible()) await allow.click();
  await expect(start).toBeVisible();
  await expect(page.locator('.prompter-scroll')).toContainText(
    'These are the words I just edited.',
  );
  // The live camera has no tab bar. Away from the editor, the center button is plain Record
  // again, and it opens the most recently edited script.
  await expect(page.locator('.studio-tabs')).toHaveCount(0);
  await page.goto('/studio#/takes');
  await expect(
    page
      .getByRole('navigation', { name: 'Studio navigation' })
      .getByRole('link', { name: 'Record', exact: true }),
  ).toHaveAttribute('href', `#/record/${scriptId}`);
});

test('template to script to kept take', async ({ page }) => {
  await page.goto('/studio#/scripts/new?template=30-second-reel-script');
  await expect(page.getByLabel('Script', { exact: true })).toHaveValue(/# Hook/);
  await openRecordFromEditor(page);
  await recordAndKeep(page);
  await expect.poll(async () => (await storedTakes(page))[0]?.kept).toBe(true);
});

const longSection = Array(150).fill('word').join(' ');

test('section recording stops at the section end, groups takes and saves in order', async ({
  page,
}) => {
  await page.goto('/studio#/scripts/new');
  await page
    .getByLabel('Script', { exact: true })
    .fill(`# First\nHello there my friend today.\n# Second\n${longSection}`);
  await expect(page.getByText('Saved')).toBeVisible();
  await openRecordFromEditor(page);
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await page.getByRole('button', { name: 'Prompter controls' }).click();
  await page.getByLabel('Record one section').check();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page
    .getByRole('dialog', { name: 'Quick settings' })
    .getByRole('button', { name: 'Close' })
    .click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  // No Stop tap here: reaching the second section ends the take.
  const review = page.getByRole('dialog', { name: 'Review take' });
  await expect(review).toBeVisible({ timeout: 20_000 });
  await review.getByRole('button', { name: 'Keep', exact: true }).click();
  await review.getByRole('button', { name: 'Star' }).click();
  await expect(review.getByRole('button', { name: 'Unstar' })).toBeVisible();
  await expect.poll(async () => (await storedTakes(page))[0]?.sectionIndex).toBe(0);
  await page.goto('/studio#/takes');
  await expect(page.getByRole('heading', { name: 'Section 1: First' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save starred takes' }).click();
  expect((await download).suggestedFilename()).toMatch(/section1-take1-\d+\./);
  await expect(page.getByRole('status')).toContainText('Starred takes saved.');
});

test('section recording saves its section index', async ({ page }) => {
  await page.goto('/studio#/scripts/new');
  await page
    .getByLabel('Script', { exact: true })
    .fill(`# First\nHello there.\n# Second\n${longSection}`);
  await expect(page.getByText('Saved')).toBeVisible();
  await openRecordFromEditor(page);
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await page.getByRole('button', { name: 'Prompter controls' }).click();
  await page.getByLabel('Record one section').check();
  await page.getByLabel('Section', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page
    .getByRole('dialog', { name: 'Quick settings' })
    .getByRole('button', { name: 'Close' })
    .click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByRole('dialog', { name: 'Review take' })).toBeVisible();
  const takes = await page.evaluate(
    () =>
      new Promise<Array<{ sectionIndex: number | null }>>((resolve) => {
        const open = indexedDB.open('teleprompter-wtf');
        open.onsuccess = () => {
          const request = open.result.transaction('takes').objectStore('takes').getAll();
          request.onsuccess = () => resolve(request.result);
        };
      }),
  );
  expect(takes[0]?.sectionIndex).toBe(1);
});

test('two-script batch produces two kept takes and summary', async ({ page }) => {
  for (const [title, body] of [
    ['Batch first', 'First batch script.'],
    ['Batch second', 'Second batch script.'],
  ] as const) {
    await page.goto('/studio#/scripts/new');
    // The same-document hash change leaves the previous editor up until the new script exists.
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Untitled script');
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Script', { exact: true }).fill(body);
    await expect(page.getByText('Saved')).toBeVisible();
  }
  await page.goto('/studio#/scripts');
  await page.getByLabel('More actions for Batch first').click();
  await page.getByRole('button', { name: 'Add to Up next: Batch first' }).click();
  await page.getByLabel('More actions for Batch second').click();
  await page.getByRole('button', { name: 'Add to Up next: Batch second' }).click();
  await page.goto('/studio#/batch');
  await page.getByRole('button', { name: 'Start batch' }).click();
  await recordAndKeep(page);
  await expect(page.getByRole('heading', { name: /Next up/ })).toBeVisible();
  await page.getByRole('button', { name: 'Record next now' }).click();
  await recordAndKeep(page);
  await expect(page.getByRole('heading', { name: 'Batch complete' })).toBeVisible();
  await expect(page.getByText('2 kept takes from 2 scripts.')).toBeVisible();
  await expect(page.getByText('Batch day badge unlocked.')).toHaveCount(0);
  const takes = (await storedTakes(page)).filter((take) => take.kept);
  expect(takes).toHaveLength(2);
  const downloads: string[] = [];
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  await page.getByRole('button', { name: 'Save all' }).click();
  await expect(page.getByText('Takes saved.')).toBeVisible();
  await expect.poll(() => downloads.length).toBe(2);
  await expect
    .poll(async () => (await storedTakes(page)).every((take) => take.exportedAt))
    .toBe(true);
  // Recorded scripts have left the queue, so the next session starts clean.
  await page.getByRole('button', { name: 'Done' }).click();
  await page.goto('/studio#/batch');
  await expect(page.getByRole('button', { name: 'Start batch' })).toBeDisabled();
});

async function storedTakes(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      new Promise<
        Array<{
          id: string;
          mimeType: string;
          durationMs: number;
          chunkCount: number;
          sizeBytes: number;
          status: string;
          scriptId: string | null;
          kept: boolean;
          sectionIndex: number | null;
          exportedAt: number | null;
          container: 'mp4' | 'webm';
          wordsPerLine?: number;
          timeline: Array<{ t: number; line: number; section: number }>;
        }>
      >((resolve, reject) => {
        const open = indexedDB.open('teleprompter-wtf');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const rows = open.result.transaction('takes').objectStore('takes').getAll();
          rows.onerror = () => reject(rows.error);
          rows.onsuccess = () => resolve(rows.result);
        };
      }),
  );
}

async function storedChunkCount(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('teleprompter-wtf');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const count = open.result.transaction('chunks').objectStore('chunks').count();
          count.onerror = () => reject(count.error);
          count.onsuccess = () => resolve(count.result);
        };
      }),
  );
}

test('records, reviews, keeps, lists, and downloads a real media file', async ({ page }) => {
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('3');
  await page
    .getByRole('dialog', { name: 'Quick settings' })
    .getByRole('button', { name: 'Close' })
    .click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByText('3', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  const before = await page.locator('.prompter-scroll').evaluate((node) => node.scrollTop);
  await page.waitForTimeout(2500);
  const after = await page.locator('.prompter-scroll').evaluate((node) => node.scrollTop);
  expect(after).toBeGreaterThan(before);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  const review = page.getByRole('dialog', { name: 'Review take' });
  await expect(review).toBeVisible();
  await expect
    .poll(() => review.locator('video').evaluate((video: HTMLVideoElement) => video.readyState))
    .toBeGreaterThanOrEqual(2);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  const [take] = await storedTakes(page);
  expect(take).toMatchObject({ kept: true, status: 'ready' });
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('heading', { name: 'Takes' })).toBeVisible();
  await page.getByRole('link', { name: /Take 1/ }).click();
  await expect(page.getByRole('heading', { name: 'Take 1' })).toBeVisible();
  await expect(page.locator('.take-player')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download/ }).click();
  const download = await downloadPromise;
  const extension = take!.mimeType.includes('mp4') ? '.mp4' : '.webm';
  expect(download.suggestedFilename()).toMatch(/\.(mp4|webm)$/);
  expect(download.suggestedFilename().endsWith(extension)).toBe(true);
  const path = await download.path();
  const { readFile } = await import('node:fs/promises');
  const file = await readFile(path!);
  expect(file.length).toBeGreaterThan(20_000);
  if (extension === '.mp4') expect(file.toString('ascii', 4, 8)).toBe('ftyp');
  else expect([...file.subarray(0, 4)]).toEqual([0x1a, 0x45, 0xdf, 0xa3]);
  await page.getByRole('button', { name: 'Star' }).click();
  await expect(page.getByRole('button', { name: 'Unstar' })).toBeVisible();
});

test('keeping a take earns the Home streak badge', async ({ page }) => {
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  const review = page.getByRole('dialog', { name: 'Review take' });
  await expect(review).toBeVisible();
  await review.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect.poll(async () => (await storedTakes(page))[0]?.kept).toBe(true);
  await review.getByRole('button', { name: 'Done' }).click();
  await page.goto('/studio#/');
  await expect(page.getByText('1-day streak')).toBeVisible();
});

test('recovers persisted chunks after a reload during recording', async ({ page }) => {
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page
    .getByRole('dialog', { name: 'Quick settings' })
    .getByRole('button', { name: 'Close' })
    .click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(2700);
  await expect.poll(() => storedChunkCount(page)).toBeGreaterThanOrEqual(1);
  await page.reload();
  await expect(page.getByText('We recovered a take from your last session.')).toBeVisible();
  await page.getByRole('link', { name: 'View take' }).click();
  await expect(page.getByRole('link', { name: /Take 1.*Recovered/ })).toBeVisible();
  const [recovered] = await storedTakes(page);
  expect(recovered).toMatchObject({ status: 'recovered' });
  expect(recovered!.durationMs).toBeGreaterThanOrEqual(1000);
  expect(recovered!.chunkCount).toBeGreaterThanOrEqual(1);
  expect(recovered!.sizeBytes).toBeGreaterThan(0);
  await page.getByRole('link', { name: /Take 1/ }).click();
  await expect(page.locator('.take-player')).toBeVisible();
});

test('denial maps to the permission screen and camera_failed event', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        throw new DOMException('Denied', 'NotAllowedError');
      },
    });
    (
      window as typeof window & {
        umami?: { track: (name: string, data: unknown) => void; identify: () => void };
      }
    ).umami = {
      track: (name, data) => {
        if (name === 'camera_failed')
          (window as typeof window & { cameraEvent?: unknown }).cameraEvent = data;
      },
      identify: () => {},
    };
  });
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await expect(page.getByRole('heading', { name: 'Camera access is off' })).toBeVisible();
  expect(
    await page.evaluate(() => (window as typeof window & { cameraEvent?: unknown }).cameraEvent),
  ).toEqual({ reason: 'permission_blocked' });
});

test('in-app browser replaces Record with an opening notice', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 Instagram 123' });
  const page = await context.newPage();
  await page.goto('/studio#/record/quick');
  await expect(
    page.getByRole('heading', { name: "Instagram's browser can't record video" }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start recording' })).toHaveCount(0);
  await page.goto('/studio#/scripts/quick');
  await expect(
    page.getByText("Instagram's browser can't record video.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy link with script' })).toBeVisible();
  await context.close();
});

test('quick camera and mic controls reacquire with selected constraints', async ({ page }) => {
  await page.addInitScript(() => {
    const media = navigator.mediaDevices;
    const original = media.getUserMedia.bind(media);
    const capabilities = MediaStreamTrack.prototype.getCapabilities;
    MediaStreamTrack.prototype.getCapabilities = function () {
      const c = capabilities.call(this);
      return this.kind === 'video'
        ? {
            ...c,
            width: { min: 640, max: 3840 },
            height: { min: 480, max: 2160 },
            frameRate: { min: 24, max: 60 },
          }
        : c;
    };
    const enumerate = media.enumerateDevices.bind(media);
    Object.defineProperty(media, 'getUserMedia', {
      configurable: true,
      value: (constraints: MediaStreamConstraints) => {
        ((window as typeof window & { mediaCalls?: MediaStreamConstraints[] }).mediaCalls ??=
          []).push(constraints);
        return original(constraints);
      },
    });
    Object.defineProperty(media, 'enumerateDevices', {
      configurable: true,
      value: async () => [
        ...(await enumerate()),
        {
          kind: 'videoinput',
          deviceId: 'fake-camera-two',
          groupId: 'fake',
          label: 'Second camera',
          toJSON() {
            return this;
          },
        },
        {
          kind: 'audioinput',
          deviceId: 'fake-mic-two',
          groupId: 'fake',
          label: 'USB microphone',
          toJSON() {
            return this;
          },
        },
      ],
    });
  });
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  const calls = () =>
    page.evaluate(
      () => (window as typeof window & { mediaCalls?: MediaStreamConstraints[] }).mediaCalls ?? [],
    );
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Resolution').selectOption('720p');
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  expect(
    (await calls()).some(
      (c) => (c.video as MediaTrackConstraints)?.height && JSON.stringify(c.video).includes('720'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Frame rate').selectOption('25');
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  expect((await calls()).some((c) => JSON.stringify(c.video).includes('25'))).toBe(true);
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByRole('combobox', { name: 'Camera', exact: true }).selectOption('fake-camera-two');
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  expect((await calls()).some((c) => JSON.stringify(c.video).includes('fake-camera-two'))).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page
    .getByRole('combobox', { name: 'Microphone', exact: true })
    .selectOption('fake-mic-two');
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  expect((await calls()).some((c) => JSON.stringify(c.audio).includes('fake-mic-two'))).toBe(true);
});

test('remote keys scroll, toggle, and prevent F5 reload', async ({ page }) => {
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  const before = await page.locator('.prompter-scroll').evaluate((el) => el.scrollTop);
  await page.keyboard.press('PageDown');
  expect(await page.locator('.prompter-scroll').evaluate((el) => el.scrollTop)).toBeGreaterThan(
    before,
  );
  await page.keyboard.press('b');
  await expect(page.locator('.prompter-scroll')).toBeVisible();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog', { name: 'Quick settings' })).toHaveCount(0);
  await page.keyboard.press('F5');
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(1100);
  await page.keyboard.press('F5');
  await expect(page.getByRole('dialog', { name: 'Review take' })).toBeVisible();
});

test('the install sheet waits for the export and never interrupts a recording', async ({
  page,
}) => {
  const sheet = page.getByRole('dialog', { name: 'Install teleprompter.wtf' });
  const review = page.getByRole('dialog', { name: 'Review take' });
  const recordTake = async () => {
    await page.getByRole('button', { name: 'Start recording' }).click();
    await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
    await page.waitForTimeout(700);
  };
  const keepAndDownload = async () => {
    await page.getByRole('button', { name: 'Stop recording' }).click();
    await expect(review).toBeVisible();
    await expect(sheet).toHaveCount(0);
    await review.getByRole('button', { name: 'Keep', exact: true }).click();
    const download = page.waitForEvent('download');
    await review.getByRole('button', { name: /^Download/ }).click();
    await download;
  };
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog', { name: 'Quick settings' })).toHaveCount(0);

  await recordTake();
  await keepAndDownload();
  // The export earned the ask, but the browser has not offered its prompt yet.
  await expect(sheet).toHaveCount(0);
  await review.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('heading', { name: 'Takes' })).toBeVisible();
  await page.evaluate(() => {
    location.hash = '/record/quick';
  });
  const allow = page.getByRole('button', { name: 'Allow camera' });
  const start = page.getByRole('button', { name: 'Start recording' });
  await expect(allow.or(start)).toBeVisible();
  if (await allow.isVisible()) {
    // The priming screen can vanish between the visibility check and the click.
    await allow.click({ timeout: 1500 }).catch(() => undefined);
  }
  await expect(start).toBeVisible();

  await recordTake();
  // The browser's prompt arrives mid-take: the earlier export must not uncover the sheet.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.defineProperty(event, 'prompt', { value: async () => undefined });
    Object.defineProperty(event, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    });
    dispatchEvent(event);
  });
  await page.waitForTimeout(300);
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();

  await keepAndDownload();
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Not now' }).click();
  await expect(sheet).toHaveCount(0);
});

test('local clock moves a kept-take streak from day one to day two', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 1, 12));
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  await page.goto('/studio#/');
  await expect(page.getByText('1-day streak')).toBeVisible();
  await page.clock.setFixedTime(new Date(2026, 10, 2, 12));
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  await page.goto('/studio#/');
  await expect(page.getByText('2-day streak')).toBeVisible();
});

test('a freeze earned on day 7 covers a skipped day and the streak continues', async ({ page }) => {
  // H1 earns a freeze every 7 streak days, so seed six days and earn it with a real take.
  await page.clock.setFixedTime(new Date(2026, 10, 2, 12));
  await page.goto('/studio#/');
  await expect(
    page.getByRole('heading', { name: 'Record your first video in 60 seconds' }),
  ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('teleprompter-wtf');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(
            {
              current: 6,
              best: 6,
              activeDates: [
                '2026-10-27',
                '2026-10-28',
                '2026-10-29',
                '2026-10-30',
                '2026-10-31',
                '2026-11-01',
              ],
            },
            'streak',
          );
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  await page.goto('/studio#/');
  await expect(page.getByText('7-day streak', { exact: true })).toBeVisible();
  // The chip expands for details; a day saved by a freeze opens it on its own.
  await page.locator('.studio-streak summary').click();
  await expect(page.getByText('Best 7 days · 1 freeze ready')).toBeVisible();
  // Day 8 is skipped. On day 9 the freeze has covered it before anything is recorded.
  await page.clock.setFixedTime(new Date(2026, 10, 4, 12));
  await page.reload();
  await expect(page.getByText('8-day streak', { exact: true })).toBeVisible();
  await expect(page.getByText('A streak freeze kept your 8-day streak alive.')).toBeVisible();
  await expect(page.getByText('Best 8 days · 0 freezes ready')).toBeVisible();
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  await page.goto('/studio#/');
  await expect(page.getByText('9-day streak', { exact: true })).toBeVisible();
  await expect(page.getByText('Recorded today. See you tomorrow.')).toBeVisible();
});

test('a real kept take celebrates the first badge once, as a toast right after Keep', async ({
  page,
}) => {
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  const toast = page.locator('.studio-toast');
  await expect(toast).toContainText('First take badge unlocked');
  // It sits low, above the shutter and nav, never over a header control, and takes no taps.
  const box = (await toast.boundingBox())!;
  expect(box.y).toBeGreaterThan(page.viewportSize()!.height / 2);
  await expect(page.locator('.studio-toast-region')).toHaveCSS('pointer-events', 'none');
  await expect(toast).toHaveCount(0, { timeout: 8000 });
  await page.goto('/studio#/');
  await expect(page.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(toast).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Your progress' })).toContainText('1 badge');
});

/** Seeds kept takes so the next real Keep is the third. */
async function seedKeptTakes(page: import('@playwright/test').Page, count: number) {
  await page.goto('/studio#/scripts/quick');
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible();
  await page.evaluate(async (n) => {
    const request = indexedDB.open('teleprompter-wtf');
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction('takes', 'readwrite');
    for (let i = 0; i < n; i++)
      tx.objectStore('takes').put({
        id: `seed-rating-${i}`,
        scriptId: 'quick',
        kept: true,
        durationMs: 30000,
        wordsRead: 70,
        createdAt: Date.now(),
        exportedAt: null,
      });
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  }, count);
}

test('the recording rating follows the third kept take, once a day, and fits 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await seedKeptTakes(page, 2);
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  const review = page.getByRole('dialog', { name: 'Review take' });
  const rating = review.getByRole('region', { name: 'Rate recording' });
  await expect(
    rating.getByRole('heading', { name: 'How did recording feel today?' }),
  ).toBeVisible();
  const buttons = rating.locator('.studio-rating button');
  await expect(buttons).toHaveCount(5);
  for (const button of await buttons.all()) {
    await button.scrollIntoViewIfNeeded();
    const bounds = (await button.boundingBox())!;
    expect(bounds.width).toBeGreaterThanOrEqual(48);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  }
  // Dismissing it is "not today": the next kept take today does not ask again.
  await rating.getByRole('button', { name: 'Not now' }).click();
  await expect(rating).toHaveCount(0);
  await review.getByRole('button', { name: 'Done' }).click();
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  await expect(page.getByRole('dialog', { name: 'Review take' })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
});

test('a rating answered after Keep is stored once and reported', async ({ page }) => {
  await seedKeptTakes(page, 2);
  await page.goto('/studio#/record/quick');
  await recordAndKeep(page);
  const rating = page.getByRole('region', { name: 'Rate recording' });
  await rating.getByRole('button', { name: 'Rate 4 out of 5' }).click();
  await expect(page.getByText('Thanks for sharing.')).toBeVisible();
  const stored = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open('teleprompter-wtf');
        open.onsuccess = () => {
          const get = open.result.transaction('kv').objectStore('kv').get('asks.rating');
          get.onsuccess = () => resolve(get.result);
        };
      }),
  );
  expect(stored).toBe(4);
  // Answered means done: Home never asks it.
  await page.goto('/studio#/');
  await expect(page.getByRole('heading', { name: "Today's prompt" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Rate recording' })).toHaveCount(0);
});

test('a real kept take exports scroll-timed captions and offers MP4 only when encodable', async ({
  page,
}) => {
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera' }).click();
  await page.getByRole('button', { name: 'Quick settings' }).click();
  await page.getByLabel('Countdown').selectOption('0');
  await page
    .getByRole('dialog', { name: 'Quick settings' })
    .getByRole('button', { name: 'Close' })
    .click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await page
    .getByRole('dialog', { name: 'Review take' })
    .getByRole('button', { name: 'Keep', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
  const [take] = await storedTakes(page);
  expect(take?.wordsPerLine).toBeGreaterThan(0);
  expect(take?.timeline.length).toBeGreaterThan(0);
  await page.goto(`/studio#/takes/${take!.id}`);
  await page.getByLabel('More take actions').click();
  await page.getByRole('button', { name: 'Captions' }).click();
  const captions = page.getByRole('dialog', { name: 'Captions' });
  await expect(captions.getByLabel('Caption preview')).toContainText('00:00:00,000 --> ');
  await captions.getByRole('button', { name: 'Close' }).click();
  const supported = await page.evaluate(async () => {
    if (typeof AudioEncoder === 'undefined') return false;
    return Boolean(
      (
        await AudioEncoder.isConfigSupported({
          codec: 'mp4a.40.2',
          sampleRate: 48_000,
          numberOfChannels: 2,
          bitrate: 128_000,
        })
      ).supported,
    );
  });
  await page.getByLabel('More take actions').click();
  const convert = page.getByRole('button', { name: 'Convert to MP4' });
  if (take!.container === 'mp4') {
    await expect(convert).toHaveCount(0);
    return;
  }
  await convert.click();
  const sheet = page.getByRole('dialog', { name: 'Convert to MP4' });
  // Without an AAC encoder (Playwright's Chromium) the sheet says so instead of offering it.
  if (supported) await expect(sheet.getByRole('button', { name: 'Convert to MP4' })).toBeVisible();
  else await expect(sheet).toContainText("This browser can't make MP4 files on the device.");
});

for (const width of [360, 390]) {
  test(`the live camera fills the screen, warns under the prompter and has one accent at ${width}px`, async ({
    page,
  }) => {
    // A low battery is a readiness warning the test can raise on demand.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'getBattery', {
        configurable: true,
        value: async () => ({ level: 0.1, charging: false }),
      });
    });
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/studio#/record/quick');
    const allow = page.getByRole('button', { name: 'Allow camera' });
    const start = page.getByRole('button', { name: 'Start recording' });
    await expect(allow.or(start)).toBeVisible();
    if (await allow.isVisible()) await allow.click();
    await expect(start).toBeVisible();
    // Full-bleed like Reels: the preview covers the whole screen.
    const preview = page.locator('.record-preview');
    expect(await preview.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
    const video = (await preview.boundingBox())!;
    expect(video.width).toBe(width);
    expect(video.height).toBe(800);
    // The warning is a glyph and one word in the meter row, never over a prompter line.
    const chip = page.locator('.readiness-chips > span[title="Battery low"]');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('Battery');
    await expect(chip.locator('svg')).toHaveCount(1);
    const prompter = (await page.locator('.prompter-window').boundingBox())!;
    for (const box of await page
      .locator('.readiness-chips > span')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect))) {
      const apart =
        box.y >= prompter.y + prompter.height ||
        box.y + box.height <= prompter.y ||
        box.x >= prompter.x + prompter.width ||
        box.x + box.width <= prompter.x;
      expect(apart).toBe(true);
    }
    await expect(page.getByText('CLIP', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/^Fits /)).toHaveCount(0);
    /** Saturated colors on the camera, apart from the shutter and the danger red. */
    const saturated = () =>
      page.evaluate(() => {
        const hits: string[] = [];
        const check = (el: Element, style: CSSStyleDeclaration, where: string) => {
          for (const prop of ['backgroundColor', 'color', 'borderTopColor'] as const) {
            const m = style[prop].match(/[\d.]+/g)?.map(Number);
            if (!m || (m[3] ?? 1) < 0.05) continue;
            if (prop === 'borderTopColor' && style.borderTopWidth === '0px') continue;
            const [r, g, b] = m.map((v) => v / 255) as [number, number, number];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const l = (max + min) / 2;
            const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
            if (s < 0.35 || l < 0.12) continue;
            if (style[prop] === 'rgb(255, 77, 77)') continue;
            hits.push(`${el.className || el.tagName}${where} ${prop} ${style[prop]}`);
          }
        };
        for (const el of document.querySelectorAll('.record-screen *')) {
          if (!el.checkVisibility({ visibilityProperty: true }) || el.closest('.record-button'))
            continue;
          check(el, getComputedStyle(el), '');
          for (const pseudo of ['::before', '::after']) {
            const style = getComputedStyle(el, pseudo);
            if (style.content !== 'none' && style.content !== 'normal') check(el, style, pseudo);
          }
        }
        return hits;
      });
    expect(await saturated()).toEqual([]);
    // The tray speaks in glyphs: a gauge for speed and Aa for text, no word labels.
    await page.getByRole('button', { name: 'Prompter controls' }).click();
    const tray = page.getByRole('group', { name: 'Prompter controls' });
    await expect(tray.getByText('Speed', { exact: true })).toHaveCount(0);
    await expect(tray.getByText('Text', { exact: true })).toHaveCount(0);
    await expect(tray.getByRole('group', { name: 'Speed' }).locator('svg')).not.toHaveCount(0);
    await expect(tray.getByRole('group', { name: 'Text size' }).locator('svg')).not.toHaveCount(0);
    await expect(tray.locator('.record-tray__value').first()).toHaveText(/^\d+ WPM$/);
    const fit = tray.getByRole('button', { name: 'Fit speed to target length' });
    expect(await fit.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      'rgba(0, 0, 0, 0)',
    );
    expect(await saturated()).toEqual([]);
  });
}

for (const width of [360, 390]) {
  test(`the safe-zone guide peeks below the prompter panel, never across a line, at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/studio#/record/quick');
    const allow = page.getByRole('button', { name: 'Allow camera' });
    const start = page.getByRole('button', { name: 'Start recording' });
    await expect(allow.or(start)).toBeVisible();
    if (await allow.isVisible()) await allow.click();
    await expect(start).toBeVisible();
    await page.getByRole('button', { name: 'Quick settings' }).click();
    await page.getByLabel('Safe zones').selectOption('instagram');
    await page
      .getByRole('dialog', { name: 'Quick settings' })
      .getByRole('button', { name: 'Close' })
      .click();
    const guide = page.locator('.record-safe-zone');
    await expect(guide).toBeVisible();
    const panel = (await page.locator('.prompter-window').boundingBox())!;
    const zone = (await guide.boundingBox())!;
    const intersects =
      zone.x < panel.x + panel.width &&
      zone.x + zone.width > panel.x &&
      zone.y < panel.y + panel.height &&
      zone.y + zone.height > panel.y;
    expect(intersects).toBe(false);
    expect(zone.y).toBeGreaterThanOrEqual(panel.y + panel.height + 8 - 1);
    const row = (await page.locator('.record-main-controls').boundingBox())!;
    expect(zone.y + zone.height).toBeLessThanOrEqual(row.y);
  });
}
