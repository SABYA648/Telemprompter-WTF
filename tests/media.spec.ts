import { expect, test } from '@playwright/test';

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
          kept: boolean;
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
  await page.getByRole('button', { name: 'Allow camera and mic' }).click();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
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

test('recovers persisted chunks after a reload during recording', async ({ page }) => {
  await page.goto('/studio#/record/quick');
  await page.getByRole('button', { name: 'Allow camera and mic' }).click();
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
  await page.getByRole('button', { name: 'Allow camera and mic' }).click();
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
  await page.getByRole('button', { name: 'Allow camera and mic' }).click();
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
  await page.getByRole('button', { name: 'Allow camera and mic' }).click();
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
  await page.getByRole('button', { name: 'Allow camera and mic' }).click();
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
  const allow = page.getByRole('button', { name: 'Allow camera and mic' });
  const start = page.getByRole('button', { name: 'Start recording' });
  await expect(allow.or(start)).toBeVisible();
  if (await allow.isVisible()) await allow.click();
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
