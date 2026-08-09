/// <reference lib="webworker" />

import { env, pipeline } from '@huggingface/transformers';
import { installModelFetchInterceptor, LOCAL_MODEL_ID } from '../domain/modelManager';

type TranscriptionResult = { text: string } | Array<{ text: string }>;
type Transcriber = (
  audio: Float32Array,
  options: Record<string, unknown>,
) => Promise<TranscriptionResult>;
let transcriber: Transcriber | null = null;
let initialization: Promise<void> | null = null;

const scope = self as DedicatedWorkerGlobalScope;

const resample = (audio: Float32Array, sourceRate: number): Float32Array => {
  if (sourceRate === 16000) return audio;
  const length = Math.max(1, Math.round((audio.length * 16000) / sourceRate));
  const output = new Float32Array(length);
  const ratio = sourceRate / 16000;
  for (let index = 0; index < length; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(audio.length - 1, left + 1);
    const mix = sourceIndex - left;
    output[index] = (audio[left] ?? 0) * (1 - mix) + (audio[right] ?? 0) * mix;
  }
  return output;
};

async function initialize(): Promise<void> {
  if (transcriber) return;
  if (initialization) return initialization;
  initialization = initializePipeline();
  return initialization;
}

async function initializePipeline(): Promise<void> {
  const startedAt = performance.now();
  await installModelFetchInterceptor();
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = '/models/';
  const wasm = env.backends.onnx.wasm;
  if (wasm) {
    wasm.wasmPaths = '/models/runtime/';
    wasm.numThreads = 1;
  }
  const createPipeline = pipeline as unknown as (
    task: string,
    model: string,
    options: Record<string, unknown>,
  ) => Promise<Transcriber>;
  transcriber = await createPipeline('automatic-speech-recognition', LOCAL_MODEL_ID, {
    device: 'wasm',
    dtype: 'q8',
  });
  scope.postMessage({ type: 'ready', milliseconds: Math.round(performance.now() - startedAt) });
}

scope.onmessage = async (event: MessageEvent) => {
  const message = event.data as
    | { type: 'init' }
    | { type: 'audio'; audio: Float32Array; sampleRate: number }
    | { type: 'dispose' };
  if (message.type === 'dispose') {
    transcriber = null;
    initialization = null;
    scope.close();
    return;
  }
  try {
    await initialize();
    if (message.type !== 'audio' || !transcriber) return;
    const startedAt = performance.now();
    const audio = resample(message.audio, message.sampleRate);
    const result = await transcriber(audio, {
      chunk_length_s: 6,
      stride_length_s: 0,
      return_timestamps: false,
    });
    const text = Array.isArray(result) ? result.map((item) => item.text).join(' ') : result.text;
    scope.postMessage({
      type: 'fragment',
      text,
      milliseconds: Math.round(performance.now() - startedAt),
    });
  } catch {
    scope.postMessage({ type: 'error', category: 'local-inference-failed' });
  }
};

export {};
