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
  const uniqueLine = 'The recovery paragraph mentions purple lanterns and cedar smoke.';
  const script = [
    'Opening remarks stay near the start of this rehearsal.',
    'A middle section talks about calm breathing and a steady camera.',
    uniqueLine,
    'Closing thoughts thank the crew and end the take.',
  ].join('\n\n');
  await page.addInitScript((transcript) => {
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      processLocally = false;
      timer: ReturnType<typeof setInterval> | undefined;
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
        const emit = () => {
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
        };
        emit();
        this.timer = setInterval(emit, 400);
      }
      stop() {
        clearInterval(this.timer);
        this.onend?.(new Event('end'));
      }
      abort() {
        clearInterval(this.timer);
        this.onend?.(new Event('end'));
      }
    }
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
  }, uniqueLine);
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(script);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('button', { name: /Following your voice/ })).toBeVisible({
    timeout: 4000,
  });
  await expect
    .poll(async () => (await page.locator('.script-word--live').allTextContents()).join(' '))
    .toMatch(/purple|lanterns|cedar|recovery|Closing|thoughts/i);
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
  // This scenario intentionally streams and persists the complete 67 MB first-use payload.
  // Give constrained production-equivalent Docker runners enough time without weakening
  // the timeout for the rest of the browser suite.
  test.slow();
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

// ---------------------------------------------------------------------------------------------
// Follow-along sync and pace cues
// ---------------------------------------------------------------------------------------------

const followScript = [
  'Opening remarks settle the room before the demonstration begins in earnest.',
  'The recovery paragraph mentions purple lanterns and cedar smoke drifting over the harbour.',
  'A middle section talks about calm breathing and a steady camera on the tripod.',
  'The closing argument thanks the crew and hands the stage back to the compere.',
].join('\n\n');

interface EmitWindow {
  __emitSpeech?: (text: string, isFinal?: boolean) => void;
}

/**
 * A speech recognizer the test drives by hand. Results accumulate the way the real API's list
 * does, so the delta path in browserSpeech is exercised rather than bypassed.
 */
async function installControllableSpeech(page: Page) {
  await page.addInitScript(() => {
    const instances: { onresult: ((event: unknown) => void) | null }[] = [];
    const results: unknown[] = [];

    class FakeSpeechRecognition {
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
        instances.push(this);
        this.onstart?.(new Event('start'));
        this.onspeechstart?.(new Event('speechstart'));
      }
      stop() {
        this.onend?.(new Event('end'));
      }
      abort() {
        this.onend?.(new Event('end'));
      }
    }

    (window as typeof window & EmitWindow).__emitSpeech = (text: string, isFinal = true) => {
      results.push({ isFinal, length: 1, 0: { transcript: text, confidence: 0.95 } });
      const list: Record<number, unknown> & { length: number } = { length: results.length };
      results.forEach((result, index) => {
        list[index] = result;
      });
      for (const instance of instances) {
        instance.onresult?.({ resultIndex: results.length - 1, results: list });
      }
    };

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
  });
}

const say = (page: Page, text: string) =>
  page.evaluate((line) => (window as typeof window & EmitWindow).__emitSpeech?.(line), text);

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

test('the live word tracks each spoken line across a long script', async ({ page }) => {
  await installControllableSpeech(page);
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(followScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('button', { name: /Following your voice/ })).toBeVisible({
    timeout: 8000,
  });

  // Deliberately out of order: the second line is spoken before the third, and the aligner has to
  // land on each one rather than drifting forward at a fixed rate.
  for (const [line, expected] of [
    [
      'The recovery paragraph mentions purple lanterns and cedar smoke drifting',
      /lanterns|cedar|smoke|drifting|harbour/i,
    ],
    [
      'A middle section talks about calm breathing and a steady camera',
      /breathing|steady|camera|tripod/i,
    ],
    ['The closing argument thanks the crew and hands the stage back', /crew|hands|stage|compere/i],
  ] as const) {
    await say(page, line);
    await expect
      .poll(async () => (await page.locator('.script-word--live').allTextContents()).join(' '), {
        timeout: 8000,
      })
      .toMatch(expected);
  }
});

test('following scrolls continuously rather than jumping between positions', async ({ page }) => {
  await installControllableSpeech(page);
  await openFreshEditor(page);
  await page.getByLabel('Teleprompter script').fill(followScript);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await expect(page.getByRole('button', { name: /Following your voice/ })).toBeVisible({
    timeout: 8000,
  });

  await say(page, 'The recovery paragraph mentions purple lanterns and cedar smoke drifting');

  const scroller = page.locator('[data-testid="presenter-scroll"]');
  const samples: number[] = [];
  for (let sample = 0; sample < 30; sample += 1) {
    samples.push(await scroller.evaluate((element) => element.scrollTop));
    await page.waitForTimeout(100);
  }

  const total = (samples[samples.length - 1] ?? 0) - (samples[0] ?? 0);
  expect(total).toBeGreaterThan(0);

  let largestStep = 0;
  for (let index = 1; index < samples.length; index += 1) {
    largestStep = Math.max(
      largestStep,
      Math.abs((samples[index] ?? 0) - (samples[index - 1] ?? 0)),
    );
  }
  // A snap-driven reader puts almost all of its travel into one or two frames. A servo spreads it.
  expect(largestStep).toBeLessThan(total * 0.5);
});

test('a speaker running behind the plan gets a pick up cue', async ({ page }) => {
  const longScript = Array.from(
    { length: 60 },
    (_, index) =>
      `Paragraph ${index} covers its own distinct subject and closes on a deliberate remark.`,
  ).join('\n\n');
  // One minute for a script that needs far longer, with no voice, so the plan runs away immediately.
  await seedState(
    page,
    { voiceMode: 'manual', targetDurationSeconds: 60, paceCues: true },
    longScript,
  );
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
  await seedState(
    page,
    { voiceMode: 'manual', targetDurationSeconds: 60, paceCues: false },
    longScript,
  );
  await page.goto('/');
  await page.locator('.editor-shell[data-hydrated]').waitFor();
  await page.getByRole('button', { name: /Start teleprompter/ }).click();

  await page.waitForTimeout(12_000);
  await expect(page.locator('.focus-guide--push')).toHaveCount(0);
  await expect(page.locator('.pace-chip')).toHaveCount(0);
});
