import { expect, test, type Page } from '@playwright/test';

const sampleScript = Array.from(
  { length: 30 },
  (_, index) => `Line ${index + 1}. Speak clearly and keep a comfortable pace for this local test.`,
).join('\n\n');

async function openFreshEditor(page: Page) {
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
}

test('Document Picture in Picture path opens a synchronized compact view', async ({ page }) => {
  await page.addInitScript(() => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    document.documentElement.append(frame);
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: { requestWindow: async () => frame.contentWindow },
    });
  });
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: 'Picture in Picture' }).click();
  await expect(page.getByRole('button', { name: 'Close compact view' })).toBeVisible();
});

test('local screen recording exposes stop, preview, and save UI', async ({ page }) => {
  await page.addInitScript(() => {
    const canvas = document.createElement('canvas');
    const stream = canvas.captureStream(1);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: async () => stream,
        getUserMedia: async () => stream,
      },
    });
    class FakeMediaRecorder {
      static isTypeSupported(type: string) {
        return type.includes('webm');
      }
      state = 'inactive';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(stream: MediaStream, options: MediaRecorderOptions) {
        void stream;
        void options;
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['local recording'], { type: 'video/webm' }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, 'MediaRecorder', {
      value: FakeMediaRecorder,
      configurable: true,
    });
  });
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: 'Record' }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByRole('button', { name: 'Stop recording' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop and preview' }).click();
  await expect(page.getByRole('button', { name: 'Save recording' })).toBeVisible();
  await expect(page.getByText('Nothing was uploaded.')).toBeVisible();
});

test('compact view failure leaves the main presenter usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'pictureInPictureEnabled', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: undefined,
    });
    window.open = () => null;
  });
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: 'Pop out' }).click();
  await expect(
    page.getByText('The compact presenter could not open. Your main presenter still works.'),
  ).toBeAttached();
  await expect(page.getByRole('button', { name: 'Exit presenter' })).toBeVisible();
});

test('recording cancellation shows a local error and preserves presenter controls', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: async () => {
          throw new DOMException('cancelled', 'NotAllowedError');
        },
        getUserMedia: async () => {
          throw new DOMException('cancelled', 'NotAllowedError');
        },
      },
    });
  });
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: 'Record' }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await expect(page.getByText('Recording was cancelled or permission was blocked.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit presenter' })).toBeAttached();
});

test('production script keeps VO on the reading line and cues on the rail', async ({ page }) => {
  const productionScript = `## 0:00–0:04 — Hook

**VISUAL**
Fast cuts of a broken button.

**VOICEOVER**
Your AI can fix the bug in seconds.

**ON SCREEN**
Feedback is still stuck in screenshots.
`;
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(productionScript);
  await expect(page.locator('.script-stats').getByText(/spoken/)).toBeVisible();
  await expect(page.getByText(/1 beat/)).toBeVisible();
  await expect(
    page.getByText('Production script detected. Visual cues stay off the reading line.'),
  ).toBeVisible();
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByText('Your AI can fix the bug in seconds.')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Production cues' })).toBeVisible();
  await expect(page.getByTestId('guide-beat')).toContainText('Hook');
  await expect(page.getByText(/Fast cuts of a broken button/)).toBeVisible();
});

async function seedState(page: Page, preferences: Record<string, unknown>, script: string) {
  await page.addInitScript(
    ({ prefs, text }) => {
      window.localStorage.setItem(
        'teleprompter-wtf.state',
        JSON.stringify({
          version: 3,
          script: text,
          preferences: prefs,
          privacyConsent: { decided: true, usageAnalytics: false },
          savedAt: Date.now(),
        }),
      );
    },
    { prefs: preferences, text: script },
  );
}

test('a speaker running behind the plan gets a pick up cue', async ({ page }) => {
  const longScript = Array.from(
    { length: 60 },
    (_, index) =>
      `Paragraph ${index} covers its own distinct subject and closes on a deliberate remark.`,
  ).join('\n\n');
  // One minute for a script that needs far longer, with no voice, so the plan runs away immediately.
  await seedState(page, { targetDurationSeconds: 60, paceCues: true }, longScript);
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
  await page.getByRole('button', { name: /Start teleprompter/ }).click();

  await expect(page.locator('.focus-guide--push')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.pace-chip')).toHaveText('Pick up');
  await expect(page.getByTestId('pace-drift')).toBeVisible();
});

test('pace cues stay off when the setting is off', async ({ page }) => {
  const longScript = Array.from(
    { length: 60 },
    (_, index) =>
      `Paragraph ${index} covers its own distinct subject and closes on a deliberate remark.`,
  ).join('\n\n');
  await seedState(page, { targetDurationSeconds: 60, paceCues: false }, longScript);
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
  await page.getByRole('button', { name: /Start teleprompter/ }).click();

  await page.waitForTimeout(12_000);
  await expect(page.locator('.focus-guide--push')).toHaveCount(0);
  await expect(page.locator('.pace-chip')).toHaveCount(0);
});

test('manual presentation does not request camera or microphone', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => {
          (window as typeof window & { mediaCalls: number }).mediaCalls++;
          return Promise.reject(new Error('unexpected'));
        },
      },
    });
    (window as typeof window & { mediaCalls: number }).mediaCalls = 0;
  });
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.waitForTimeout(2000);
  expect(
    await page.evaluate(() => (window as typeof window & { mediaCalls: number }).mediaCalls),
  ).toBe(0);
});
