# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Consent-gated self-hosted Umami (`https://analytics.sabya.pm/script.js`) for page views and the existing product event taxonomy, loaded only after the visitor allows analytics.

## [1.0.0] - 2026-08-09

First public release of teleprompter.wtf.

### Added

- Core teleprompter: paste plain text, press Start, and present. Manual elapsed-time scrolling with play, pause, resume, restart, speed control, progress, remaining-time estimation, mirror, vertical flip, focus guide, fullscreen, and keyboard shortcuts. No login, no account, no upload.
- Smart Pace: local microphone signal analysis (Web Audio, room calibration, adaptive thresholds, speech activity, and silence timing) that follows speaking rhythm without transcription and downloads no model.
- Private Precision Beta: optional local speech alignment using a pinned quantized Whisper Tiny ONNX model (`onnx-community/whisper-tiny`, revision `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`) running in a dedicated Web Worker through ONNX Runtime Web. Smart Pace always runs alongside as fallback, so any failure degrades to cadence tracking instead of stopping the presentation.
- Browser-local recording: screen and camera capture through `getDisplayMedia` / `getUserMedia` and MediaRecorder, saved locally only. No upload endpoint exists.
- Picture in Picture: Document Picture in Picture preferred, with canvas-backed video Picture in Picture and an ordinary pop-out as fallbacks.
- Guides, tools, and SEO architecture: 20 indexable static routes, Article and Breadcrumb structured data, canonical sitemap, robots.txt, and a curated llms.txt.
- Docker deployment: multi-stage build producing an unprivileged Nginx image with a read-only filesystem option and a `/health` healthcheck.
- Privacy-first analytics: optional, consent-gated GA4 with a typed event allowlist, content-shaped property filtering, IP anonymization, and no advertising signals. E2E canary tests assert that script and voice content never appears on the wire.

### Notes

- Private Precision ships as Beta. Precision varies by device, accent, and environment, and first use downloads about 67 MB of model and runtime assets that are kept in the browser. See [docs/local-precision.md](docs/local-precision.md) for measured behavior and honest limitations.
