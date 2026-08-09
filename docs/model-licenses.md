# Local model and runtime licenses

## Whisper model

The bundled optional model is an ONNX conversion of OpenAI Whisper Tiny, fetched from `onnx-community/whisper-tiny` at pinned revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`.

OpenAI Whisper code and model weights are released under the MIT License. The upstream license is available at [github.com/openai/whisper](https://github.com/openai/whisper/blob/main/LICENSE).

## Transformers.js and ONNX Runtime Web

Transformers.js is distributed under Apache License 2.0. ONNX Runtime is distributed under the MIT License. The package lock pins the browser runtime dependency, and the build verifies copied ONNX Runtime assets with SHA-256 checksums. Container redistributors should retain the project license and dependency notices required by those licenses.

The production image ships a consolidated attribution file at `public/models/THIRD-PARTY-NOTICES.txt` (served at `/models/THIRD-PARTY-NOTICES.txt`) containing the full license texts for Whisper Tiny, ONNX Runtime Web, and Transformers.js.

## Reproducibility

Run `npm run models:fetch` and `npm run assets:prepare`. The acquisition scripts reject files with an unexpected byte count or SHA-256 checksum. Production clients never fetch weights or runtime files from a third-party host. The model host is used only during the explicit build-time acquisition step.
