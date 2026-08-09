import { chromium } from '@playwright/test';

/* global caches, setTimeout, window */

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';
const scriptCanary = 'SCRIPT_SECRET_CANARY_74fd9a52c861';
const voiceCanary = 'VOICE_SECRET_CANARY_28ac6e194bf0';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const network = [];
  page.on('request', (request) => {
    network.push({
      method: request.method(),
      url: request.url(),
      body: request.postData() ?? '',
    });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(`Browser console: ${message.text()}`);
  });
  page.on('pageerror', (error) => console.error(`Browser page error: ${error.message}`));
  page.on('requestfailed', (request) =>
    console.error(`Browser request failed: ${request.url()} (${request.failure()?.errorText})`),
  );
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const info = await fetch('/models/whisper-tiny-v1/model-info.json').then((response) =>
      response.json(),
    );
    const cache = await caches.open('teleprompter-wtf-model-whisper-tiny-v1');
    const runtimeFiles = ['ort-wasm-simd-threaded.jsep.wasm', 'ort-wasm-simd-threaded.jsep.mjs'];
    const seedUrls = [
      ...info.files.map((item) => `/models/whisper-tiny-v1/${item.file}`),
      ...runtimeFiles.map((file) => `/models/runtime/${file}`),
    ];
    for (const url of seedUrls) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Model asset unavailable: ${url}`);
      await cache.put(url, response);
    }

    const fixture = await fetch('/test-fixtures/local-precision.wav');
    const RealAudioContext = window.AudioContext;
    const decoder = new RealAudioContext({ sampleRate: 16000 });
    const decoded = await decoder.decodeAudioData(await fixture.arrayBuffer());
    const sourceAudio = decoded.getChannelData(0);
    const audio = new Float32Array(16000 * 7);
    for (let index = 0; index < audio.length; index += 1) {
      audio[index] = sourceAudio[index % sourceAudio.length] ?? 0;
    }
    await decoder.close();

    class FakeNode {
      connect() {
        return this;
      }
      disconnect() {}
    }
    class FakeAnalyser extends FakeNode {
      fftSize = 1024;
      smoothingTimeConstant = 0;
      getFloatTimeDomainData(values) {
        values.fill(0.06);
      }
    }
    class FakeAudioContext {
      sampleRate = 16000;
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
        const node = new FakeNode();
        Object.defineProperty(node, 'onaudioprocess', {
          set(handler) {
            setTimeout(() => handler({ inputBuffer: { getChannelData: () => audio } }), 1200);
          },
        });
        return node;
      }
      async resume() {}
      async close() {}
    }
    Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
    });
    window.__precisionResult = { ready: null, measurement: null, error: null };
    window.addEventListener('teleprompter:precision-ready', (event) => {
      window.__precisionResult.ready = event.detail;
    });
    window.addEventListener('teleprompter:precision-measurement', (event) => {
      window.__precisionResult.measurement = event.detail;
    });
    window.addEventListener('teleprompter:precision-error', (event) => {
      window.__precisionResult.error = event.detail;
    });
  });

  const script = `${scriptCanary}\n\n${voiceCanary}\n\n${Array.from({ length: 20 }, (_, index) => `Preparation paragraph ${index + 1} keeps the opening clearly separated.`).join('\n\n')}\n\nThe teleprompter follows your voice and keeps every word on this device.\n\nThis closing paragraph confirms that local alignment can find a later point in the script.`;
  await page.getByLabel('Teleprompter script').fill(script);
  await page.getByRole('button', { name: /Start teleprompter/ }).click();
  await page.getByRole('button', { name: /Voice tracking/ }).click();
  await page.getByRole('button', { name: 'Use Private Precision' }).click();
  await page.waitForFunction(
    () => window.__precisionResult?.measurement || window.__precisionResult?.error,
    undefined,
    {
      timeout: 120_000,
    },
  );
  const result = await page.evaluate(() => ({
    ...window.__precisionResult,
    userAgent: navigator.userAgent,
  }));
  if (result.error || !result.measurement || result.measurement.confidence < 0.4) {
    throw new Error(`Recognition alignment sanity check failed: ${JSON.stringify(result)}`);
  }
  const origin = new URL(baseUrl).origin;
  const serializedNetwork = JSON.stringify(network);
  const externalRequests = network.filter((request) => new URL(request.url).origin !== origin);
  const uploads = network.filter((request) => !['GET', 'HEAD'].includes(request.method));
  if (
    externalRequests.length ||
    uploads.length ||
    serializedNetwork.includes(scriptCanary) ||
    serializedNetwork.includes(voiceCanary)
  ) {
    throw new Error('Local inference privacy boundary failed');
  }
  console.log(
    JSON.stringify(
      {
        ...result,
        network: {
          requests: network.length,
          externalRequests: externalRequests.length,
          uploads: uploads.length,
          canariesSeen: false,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
