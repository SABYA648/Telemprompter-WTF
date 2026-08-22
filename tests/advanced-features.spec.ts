import { expect, test, type Page } from '@playwright/test';

const sampleScript = Array.from(
  { length: 30 },
  (_, index) => `Line ${index + 1}. Speak clearly and keep a comfortable pace for this local test.`,
).join('\n\n');

async function installMicrophoneMock(page: Page, denied = false) {
  await page.addInitScript((shouldDeny) => {
    const state = { stopped: false };
    (window as typeof window & { __microphoneState?: typeof state }).__microphoneState = state;
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
      getByteTimeDomainData(values: Uint8Array) {
        values.fill(136);
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
        return Object.assign(new FakeNode(), { gain: { value: 1 } });
      }
      createScriptProcessor() {
        return Object.assign(new FakeNode(), { onaudioprocess: null });
      }
      async resume() {}
      async close() {}
    }
    Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          if (shouldDeny) throw new DOMException('blocked', 'NotAllowedError');
          return {
            getTracks: () => [
              {
                stop: () => {
                  state.stopped = true;
                },
              },
            ],
          };
        },
      },
    });
    Reflect.deleteProperty(window, 'SpeechRecognition');
    Reflect.deleteProperty(window, 'webkitSpeechRecognition');
  }, denied);
}

async function openFreshEditor(page: Page) {
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
}

test('Smart Pace auto-starts on presenter open, follows pace, and cleans up', async ({ page }) => {
  await installMicrophoneMock(page);
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(
    page.getByRole('button', {
      name: /Learning room sound|Following your pace|Following your voice|Requesting microphone/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Following your pace|Following your voice/ }),
  ).toBeVisible({
    timeout: 4000,
  });
  await expect(page.locator('.script-word--live').first()).toBeVisible({ timeout: 4000 });
  await page.getByRole('button', { name: 'Exit presenter' }).click();
  expect(
    await page.evaluate(() =>
      Boolean(
        (window as typeof window & { __microphoneState?: { stopped: boolean } }).__microphoneState
          ?.stopped,
      ),
    ),
  ).toBe(true);
});

test('browser speech-to-text follows the spoken script position', async ({ page }) => {
  const spoken = 'Line 8. Speak clearly and keep a comfortable pace for this local test.';
  await page.addInitScript((transcript) => {
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      processLocally = false;
      onresult: ((event: unknown) => void) | null = null;
      onstart: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onspeechstart: ((event: Event) => void) | null = null;
      onspeechend: ((event: Event) => void) | null = null;
      onaudiostart = null;
      onaudioend = null;
      start() {
        this.onstart?.(new Event('start'));
        this.onspeechstart?.(new Event('speechstart'));
        this.onresult?.({
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: true,
              length: 1,
              0: { transcript, confidence: 0.94 },
            },
          },
        });
      }
      stop() {
        this.onend?.(new Event('end'));
      }
      abort() {
        this.onend?.(new Event('end'));
      }
    }
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeRecognition,
    });
  }, spoken);
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('button', { name: /Following your voice/ })).toBeVisible({
    timeout: 4000,
  });
  await expect(page.locator('.script-word--live').first()).toBeVisible({ timeout: 4000 });
  await expect
    .poll(async () => page.locator('.script-word--live').first().textContent())
    .toMatch(/Line|Speak|clearly|comfortable/i);
  const scrollTop = await page.locator('[data-testid="presenter-scroll"]').evaluate((node) => {
    return (node as HTMLElement).scrollTop;
  });
  expect(scrollTop).toBeGreaterThan(20);
});

test('microphone denial leaves Manual available and offers retry', async ({ page }) => {
  await installMicrophoneMock(page, true);
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('button', { name: /Microphone blocked|Voice tracking/ })).toBeVisible(
    {
      timeout: 4000,
    },
  );
  await page.getByRole('button', { name: /Microphone blocked|Voice tracking|Manual/ }).click();
  await expect(page.getByRole('button', { name: 'Use Smart Pace' })).toBeEnabled();
  await page.getByRole('button', { name: 'Use Smart Pace' }).click();
  await expect(
    page.getByText('Microphone access was blocked. Manual scrolling still works.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit presenter' })).toBeVisible();
});

test('Private Precision model download is explicit, progress reaches ready, and removal works', async ({
  page,
}) => {
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
  const requests: string[] = [];
  await page.route('**/models/**', async (route) => {
    const name = route.request().url().split('/').at(-1) ?? '';
    requests.push(name);
    await route.fulfill({
      status: 200,
      contentType: name.endsWith('.onnx') ? 'application/octet-stream' : 'application/json',
      body: Buffer.alloc(sizes[name] ?? 0),
    });
  });
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(sampleScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  expect(requests).toEqual([]);
  // Auto-started Smart Pace should not download model assets.
  await page
    .getByRole('button', { name: /Following your pace|Following your voice|Voice tracking|Manual/ })
    .click();
  expect(requests).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Private Precision, beta' })).toBeVisible();
  await expect(page.getByText(/About 67 MB first download/)).toBeVisible();
  await expect(page.getByText(/about 67 MB with its runtime/)).toBeVisible();
  await page.getByRole('button', { name: 'Download voice model' }).click();
  await expect(page.getByRole('button', { name: 'Use Private Precision' })).toBeVisible({
    timeout: 30_000,
  });
  expect(requests).toHaveLength(14);
  await page.getByRole('button', { name: 'Remove downloaded model' }).click();
  await expect(page.getByRole('button', { name: 'Download voice model' })).toBeVisible();
});

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
