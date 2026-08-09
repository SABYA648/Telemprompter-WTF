# Private Precision Beta implementation

Decision date: 9 August 2026.

Private Precision ships labeled Beta. Alignment precision varies by device, accent, and environment, and the honest limitations at the end of this document are part of the product, not footnotes.

## Selection

Private Precision Beta uses the stable Transformers.js 3.7.5 browser runtime with `onnx-community/whisper-tiny` at pinned revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`. The multilingual quantized encoder and merged decoder run through ONNX Runtime Web in a dedicated Worker using single-threaded WASM.

Remote models are disabled. `env.localModelPath` points to `/models/`, and the ONNX Runtime WASM path points to `/models/runtime/`. The browser download manager accepts only the fixed same-origin manifest. Cache Storage keeps the versioned files after explicit user action. Inference fetches consult that cache before same-origin network fetches.

## Why this path

The selected Transformers.js path provides a maintained browser pipeline, multilingual Whisper support, quantized weights, Worker integration, and an explicit switch that rejects remote model loading. The official project documents both browser WASM and WebGPU paths. The current quantized WASM profile is smaller and has a broader compatibility target than bundling the additional weight formats needed for a WebGPU-first profile.

whisper.cpp was also evaluated. Its official browser documentation reports a 74 MB Tiny model and estimates two to three times real-time CPU processing on a modern browser. That is a credible path, but the selected ONNX file set is smaller and integrates with the existing TypeScript worker without cross-origin isolation.

## Assets

| Asset group                          |      Bytes |
| ------------------------------------ | ---------: |
| Quantized encoder                    | 10,124,990 |
| Quantized merged decoder             | 30,719,241 |
| Tokenizer and configuration          |  4,389,420 |
| Total model download                 | 45,233,651 |
| ONNX Runtime WASM, served separately | 21,596,019 |
| ONNX Runtime WASM loader             |     44,484 |
| **Total cold first-use transfer**    | 66,874,154 |

The true cold first-use cost of enabling Private Precision Beta is 66,874,154 bytes (about 67 MB): the 12 pinned model files plus the ONNX Runtime WASM and its loader. All 14 files are fetched up front in the explicit, user-initiated download and stored in the versioned Cache Storage entry. Measured cold activation against the production Docker build transferred exactly 66,874,154 bytes (9 Aug 2026).

`scripts/fetch-local-model.mjs` pins every model file, expected byte count, and SHA-256 checksum. It writes to `public/models/whisper-tiny-v1/`. The model is derived from OpenAI Whisper, whose code and weights are MIT licensed. Transformers.js and its examples are Apache-2.0 licensed. See `docs/model-licenses.md` for redistribution notes.

## Warm-cache behavior

First use downloads everything above once. On repeat use:

- All 14 files (model weights, tokenizer and config files, ONNX Runtime WASM and loader) live in the same versioned Cache Storage entry after the explicit download. Changing the model revision changes the cache key, so stale weights are never silently reused.
- Inference fetches consult that cache before any network request, so warm-cache activation transfers zero model or runtime bytes. Measured against the production Docker build: a second activation in the same browser profile performed no model or runtime network transfer (9 Aug 2026).
- Removing the model from the voice panel clears the Cache Storage entry and makes the next use a cold download again.

## Runtime architecture

1. The user explicitly downloads the model.
2. The browser verifies expected byte counts and stores assets in a versioned Cache Storage entry.
3. Explicit activation requests microphone permission.
4. Smart Pace continues to provide local cadence and silence state; it always runs alongside as fallback.
5. Six-second PCM windows are transferred to a dedicated inference Worker.
6. Chunks are dropped when the Worker is still busy with a previous window. There is no queue buildup: the presenter never pauses to catch up on stale audio.
7. Temporary recognition text is returned to the main thread and immediately aligned against a bounded script region.
8. High-confidence alignment gently corrects scroll position. Low confidence holds position instead of jumping and leaves Smart Pace in control.
9. Leaving presenter mode stops tracks, closes AudioContext, terminates the Worker, and drops recognition state.

No recognition text is persisted or logged. No remote inference fallback exists. Any failure (unsupported browser, runtime error, memory pressure, sustained low alignment) falls back to Smart Pace, so the presentation never stops.

## Measurements

Asset byte counts above were measured from the pinned files. On 9 August 2026, the complete production Docker path ran four times in headless Chromium 151.0.7922.34 on an Apple Silicon Mac using the single-threaded WASM fallback. Cold Worker initialization from a populated browser cache took 1,206 to 1,459 ms. Inference over the six-second window took 3,263 to 4,070 ms and aligned the bundled spoken fixture to the known script with 0.794 to 0.804 confidence. The fixture says: "The teleprompter follows your voice and keeps every word on this device."

The check drove the production UI, the real Worker, pinned model files, and ONNX Runtime. Only microphone input was substituted with the bundled local WAV fixture because a headless browser cannot grant a physical microphone interactively. WebGPU was not exercised. The headless target did not expose a reliable per-Worker memory measurement, so no memory number is claimed.

These numbers describe one machine and one clean audio fixture. Real-world accuracy varies with microphone quality, room noise, accent, and speaking style, which is why the feature is Beta and why Smart Pace runs underneath it.

## Sources

- [Transformers.js repository](https://github.com/huggingface/transformers.js)
- [Transformers.js WebGPU guide](https://github.com/huggingface/transformers.js/blob/main/packages/transformers/docs/source/guides/webgpu.md)
- [Pinned Whisper Tiny model](https://huggingface.co/onnx-community/whisper-tiny/tree/ff4177021cc41f7db950912b73ea4fdf7d01d8e7)
- [whisper.cpp browser documentation](https://github.com/ggml-org/whisper.cpp/blob/master/examples/whisper.wasm/README.md)
- [OpenAI Whisper license](https://github.com/openai/whisper/blob/main/LICENSE)
