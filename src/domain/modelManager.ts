export const LOCAL_MODEL_ID = 'whisper-tiny-v1';
export const LOCAL_MODEL_CACHE = `teleprompter-wtf-model-${LOCAL_MODEL_ID}`;
export const LOCAL_MODEL_BYTES = 45_233_651;
// True first-use transfer: the 12 model files above plus the ONNX runtime WASM
// (21,596,019 bytes) and its loader (44,484 bytes). Everything is downloaded
// up front into Cache Storage, so repeat activation transfers nothing.
export const TOTAL_FIRST_USE_BYTES = 66_874_154;

export const LOCAL_MODEL_FILES = [
  ['added_tokens.json', 34604],
  ['config.json', 2243],
  ['generation_config.json', 3772],
  ['merges.txt', 493869],
  ['normalizer.json', 52666],
  ['preprocessor_config.json', 339],
  ['special_tokens_map.json', 2194],
  ['tokenizer.json', 2480466],
  ['tokenizer_config.json', 282683],
  ['vocab.json', 1036584],
  ['onnx/encoder_model_quantized.onnx', 10124990],
  ['onnx/decoder_model_merged_quantized.onnx', 30719241],
] as const;

// ONNX Runtime Web assets served from /models/runtime/. They ship with the
// site but are part of the explicit first-use download so that later
// activations never touch the network again.
export const LOCAL_RUNTIME_FILES = [
  ['ort-wasm-simd-threaded.jsep.wasm', 21596019],
  ['ort-wasm-simd-threaded.jsep.mjs', 44484],
] as const;

const MANAGED_FILES = [
  ...LOCAL_MODEL_FILES.map(([file, bytes]) => [`/models/${LOCAL_MODEL_ID}/${file}`, bytes]),
  ...LOCAL_RUNTIME_FILES.map(([file, bytes]) => [`/models/runtime/${file}`, bytes]),
] as const;

const contentTypeFor = (url: string): string => {
  if (url.endsWith('.onnx')) return 'application/octet-stream';
  if (url.endsWith('.wasm')) return 'application/wasm';
  if (url.endsWith('.mjs')) return 'text/javascript';
  return 'application/json';
};

export interface ModelDownloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export async function isLocalModelReady(): Promise<boolean> {
  if (!('caches' in globalThis)) return false;
  const cache = await caches.open(LOCAL_MODEL_CACHE);
  const matches = await Promise.all(MANAGED_FILES.map(([url]) => cache.match(url)));
  return matches.every(Boolean);
}

export async function downloadLocalModel(
  onProgress: (progress: ModelDownloadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!('caches' in globalThis)) throw new Error('cache-unavailable');
  const cache = await caches.open(LOCAL_MODEL_CACHE);
  let loaded = 0;
  for (const [url, expectedBytes] of MANAGED_FILES) {
    const existing = await cache.match(url);
    if (existing) {
      loaded += expectedBytes;
      onProgress({ loaded, total: TOTAL_FIRST_USE_BYTES, percent: loaded / TOTAL_FIRST_USE_BYTES });
      continue;
    }
    const response = await fetch(url, {
      cache: 'no-store',
      ...(signal ? { signal } : {}),
    });
    if (!response.ok || !response.body) throw new Error(`model-asset-${response.status}`);
    const reader = response.body.getReader();
    const parts: ArrayBuffer[] = [];
    let fileBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value.slice().buffer as ArrayBuffer);
      fileBytes += value.byteLength;
      onProgress({
        loaded: loaded + fileBytes,
        total: TOTAL_FIRST_USE_BYTES,
        percent: Math.min(1, (loaded + fileBytes) / TOTAL_FIRST_USE_BYTES),
      });
    }
    if (fileBytes !== expectedBytes) throw new Error('model-asset-size');
    await cache.put(
      url,
      new Response(new Blob(parts), {
        headers: {
          'Content-Type': contentTypeFor(url),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }),
    );
    loaded += expectedBytes;
  }
  onProgress({ loaded: TOTAL_FIRST_USE_BYTES, total: TOTAL_FIRST_USE_BYTES, percent: 1 });
}

export async function removeLocalModel(): Promise<void> {
  if (!('caches' in globalThis)) return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith('teleprompter-wtf-model-'))
      .map((name) => caches.delete(name)),
  );
}

export async function installModelFetchInterceptor(): Promise<void> {
  if (!('caches' in globalThis)) return;
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const managedPath =
      url.pathname.startsWith(`/models/${LOCAL_MODEL_ID}/`) ||
      url.pathname.startsWith('/models/runtime/');
    if (url.origin === location.origin && managedPath) {
      const cached = await caches.match(request);
      if (cached) return cached;
    }
    return originalFetch(input, init);
  };
}
