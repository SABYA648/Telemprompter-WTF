import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const artifactDir = 'artifacts/visual-qa';
const screenshotDir = 'docs/screenshots';
const sampleScript = Array.from(
  { length: 14 },
  (_, index) => `Take ${index + 1}. Look into the lens and let the next thought arrive naturally.`,
).join('\n\n');

test.beforeAll(async () => {
  await mkdir(artifactDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });
});

test('capture representative visual states', async ({ page }) => {
  test.setTimeout(90_000);
  const sizes: Record<string, number> = {
    'added_tokens.json': 34604,
    'config.json': 2243,
    'generation_config.json': 3772,
    'merges.txt': 493869,
    'normalizer.json': 52666,
    'preprocessor_config.json': 339,
    'special_tokens_map.json': 2194,
    'tokenizer.json': 2480466,
    'tokenizer_config.json': 282683,
    'vocab.json': 1036584,
    'encoder_model_quantized.onnx': 10124990,
    'decoder_model_merged_quantized.onnx': 30719241,
    'ort-wasm-simd-threaded.jsep.wasm': 21596019,
    'ort-wasm-simd-threaded.jsep.mjs': 44484,
  };
  await page.route('**/models/**', async (route) => {
    const name = route.request().url().split('/').at(-1) ?? '';
    if (!(name in sizes)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: name.endsWith('.onnx')
        ? 'application/octet-stream'
        : name.endsWith('.wasm')
          ? 'application/wasm'
          : name.endsWith('.mjs')
            ? 'text/javascript'
            : 'application/json',
      body: Buffer.alloc(sizes[name] ?? 0),
    });
  });
  await page.addInitScript(() => {
    class FakeNode {
      connect() {
        return this;
      }
      disconnect() {}
    }
    class FakeAnalyser extends FakeNode {
      fftSize = 1024;
      smoothingTimeConstant = 0;
      getFloatTimeDomainData(values: Float32Array) {
        values.fill(0.06);
      }
    }
    class FakeAudioContext {
      sampleRate = 48000;
      destination = new FakeNode();
      createMediaStreamSource() {
        return new FakeNode();
      }
      createAnalyser() {
        return new FakeAnalyser();
      }
      createGain() {
        return Object.assign(new FakeNode(), { gain: { value: 0 } });
      }
      createScriptProcessor() {
        return Object.assign(new FakeNode(), { onaudioprocess: null });
      }
      async resume() {}
      async close() {}
    }
    const canvas = document.createElement('canvas');
    const stream = canvas.captureStream(1);
    Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          return {
            getTracks: () => [
              {
                stop: () => undefined,
                kind: 'audio',
              },
            ],
            getAudioTracks: () => [{ stop: () => undefined, kind: 'audio' }],
          };
        },
        getDisplayMedia: async () => stream,
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
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['visual test'], { type: 'video/webm' }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, 'MediaRecorder', {
      value: FakeMediaRecorder,
      configurable: true,
    });
    const frame = document.createElement('iframe');
    frame.hidden = true;
    document.documentElement.append(frame);
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: { requestWindow: async () => frame.contentWindow },
    });
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Optional analytics' })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/375-consent.png`, fullPage: true });
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.screenshot({ path: `${artifactDir}/375-home-empty.png`, fullPage: true });
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.screenshot({ path: `${artifactDir}/375-home-script.png`, fullPage: true });
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(
    page.getByRole('button', {
      name: /Following your pace|Learning room sound|Requesting microphone/,
    }),
  ).toBeVisible({ timeout: 4000 });
  await expect(page.getByRole('button', { name: /Following your pace/ })).toBeVisible({
    timeout: 4000,
  });
  await expect(page.locator('.script-word--live').first()).toBeVisible({ timeout: 4000 });
  const voiceDialog = page.getByRole('dialog', { name: 'Voice tracking' });
  if (await voiceDialog.isVisible().catch(() => false)) {
    await voiceDialog.getByRole('button', { name: 'Done' }).click();
    await expect(voiceDialog).toBeHidden();
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${artifactDir}/375-presenter-playing.png` });
  await page.keyboard.press('Space');
  await page.screenshot({ path: `${artifactDir}/375-presenter-paused.png` });
  await page.getByRole('button', { name: 'Appearance' }).click();
  const appearanceDialog = page.getByRole('dialog', { name: 'Appearance' });
  await page.screenshot({ path: `${artifactDir}/375-presenter-settings.png` });
  await appearanceDialog.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: /Following your pace|Voice tracking|Manual/ }).click();
  await page.screenshot({ path: `${artifactDir}/375-voice-settings.png` });
  await expect(page.getByRole('button', { name: 'Listening' })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/375-smart-pace-listening.png` });
  await page.getByRole('button', { name: 'Use Manual' }).click();
  await page.getByRole('button', { name: 'Download voice model' }).click();
  await expect(page.getByText(/Downloading \d+%/)).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/375-private-precision-download.png` });
  await expect(page.getByRole('button', { name: 'Use Private Precision' })).toBeVisible({
    timeout: 30_000,
  });
  await page.screenshot({ path: `${artifactDir}/375-private-precision-ready.png` });
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Picture in Picture' }).click();
  await page.screenshot({ path: `${artifactDir}/375-pip-open.png` });
  await page.getByRole('button', { name: 'Close compact view' }).click();
  await page.getByRole('button', { name: 'Record' }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.screenshot({ path: `${artifactDir}/375-recording.png` });
  await page.getByRole('button', { name: 'Stop and preview' }).click();
  const recordDialog = page.getByRole('dialog', { name: 'Record' });
  await expect(recordDialog.getByRole('button', { name: 'Save recording' })).toBeVisible();
  await recordDialog.getByRole('button', { name: 'Done' }).click();
  await expect(recordDialog).toBeHidden();

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/privacy');
  await page.screenshot({ path: `${artifactDir}/768-privacy.png`, fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/guides/how-to-use-a-teleprompter');
  await page.screenshot({ path: `${artifactDir}/1440-guide.png`, fullPage: true });
  await page.goto('/tools/teleprompter-speed-calculator');
  await page.screenshot({ path: `${artifactDir}/1440-calculator.png`, fullPage: true });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const desktopEditor = page.getByLabel('Teleprompter script');
  await desktopEditor.fill(sampleScript);
  await desktopEditor.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: `${artifactDir}/1920-home-script.png`, fullPage: true });
  await page.screenshot({ path: `${screenshotDir}/editor.png` });
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.screenshot({ path: `${screenshotDir}/presenter.png` });
  await page.getByRole('button', { name: /Voice tracking/ }).click();
  await page.screenshot({ path: `${screenshotDir}/private-precision.png` });
});
