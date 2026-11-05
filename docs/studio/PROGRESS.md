# Studio progress

## M0 Baseline, archive and logs - 2026-11-04

Shipped:

- Created the integration branch from `origin/main`, seeded the decision log, and pushed the pre-removal archive tag.
- Installed the lockfile dependencies and verified that the matching Chromium, headless shell and FFmpeg were already installed.

Files: `docs/studio/PROGRESS.md`, `docs/studio/DECISIONS.md`.

Baseline:

- `npm ci`: passed. npm reported 33 dependency vulnerabilities (18 moderate, 14 high, 1 critical).
- `npm run check`: passed; 17 unit test files and 123 of 123 tests passed.
- Initial baseline browser runs passed 61/62 and 60/62; the hydration race was resolved and revalidated in M1.
- Docker CLI is present but the daemon is unavailable at the local socket; image size and Docker gates could not be measured.

Gates: check pass, unit 123/123, e2e 60/62 on gate rerun (baseline 61/62), media not applicable, budget not applicable, lighthouse not run.

Deviations: none.

Known issues:

- Docker daemon unavailable.

Owner manual checks: none for this milestone.

Next: M1.

## M1 Remove voice follow; manual scrolling only - 2026-11-04

Shipped:

- Removed the voice-follow implementation, model assets and build steps. Retained the manual scroll engine, pacing cues and highlights.
- Updated public copy and category guides, and configured the old route to redirect to the voice-activated category guide.
- Made the editor inert until restored state is applied and added explicit hydration waits before test input. The initial failed trace and mount effect showed that early input could be overwritten during hydration.
- Added a browser test verifying the presenter scrolls for two seconds with zero camera or microphone requests. The acceptance text search returned no matches.

Files: presenter and editor components, domain modules, site copy, Nginx, Dockerfile, tests and documentation.

Gates: check pass, unit 68/68, e2e 57/57 in each of three consecutive runs, media not applicable, budget not applicable, lighthouse not run. Docker skipped: daemon unavailable. Image sizes and HTTP checks were not measured.

Deviations: none.

Known issues:

- Docker redirect and image build remain unverified until a daemon is available.

Owner manual checks:

- With Docker available, build and run the image, verify `/` returns 200 and `/private-voice-tracking` returns 301, and compare image sizes if the archived image can be built.

Next: M2.

## M2 Analytics reset: Umami only, always on - 2026-11-04

Shipped:

- Replaced consent-gated analytics with the sitewide Umami script, browser-local device identity, bounded queue, typed and validated taxonomy v2, normalized virtual page views and throttled errors.
- Removed the consent components, Google analytics configuration and second build and server. Updated the privacy page, CSP, optional proxy instructions and owner analytics documentation.
- Added identity, queue, error and taxonomy unit coverage and a browser stub test for first-load script request, identity, CTA properties, invalid properties and Google requests.

Files: analytics domain and tests, Umami component, layout, environment and server configuration, privacy page, browser tests and analytics documentation.

Gates: check pass, unit 62/62, e2e 50/50, media not applicable, budget not applicable, lighthouse not run. Docker skipped: daemon unavailable. The script endpoint returned HTTP 200 to `curl`; the local Chromium environment reported a certificate-authority error for the direct request, so the browser tests stub the script.

Deviations: D-015 seeds future content and settings IDs until their schemas exist; D-016 defines an interim word bucket and empty-streak bucket; D-017 derives safe virtual page titles from routes.

Known issues:

- Live Umami event receipt was not verified in Chromium because of the local certificate-authority error.
- Docker build and header behavior remain unverified while the daemon is unavailable.

Owner manual checks:

- Confirm Umami is version 2.18.0 or later and decide whether to enable the optional proxy.
- In a normal production browser, verify the script loads without a certificate error and that page views, device identity and a CTA event arrive in Umami.
- With Docker available, build and run the image and check the Nginx headers and redirect.

Next: M3.

## M3 Studio foundation - 2026-11-05

Shipped:

- Added the noindex Studio page, dark mobile shell and desktop rail. Browser checks at 390x844, 360x740, 768x1024 and 1440x900 found no horizontal overflow, and Studio home, library and editor passed automated accessibility scans.
- Created every version 1 IndexedDB store, a memory fallback with a visible warning, one-time classic quick-script migration, a starter script, and a library with search, status filters, duplicate, 30-day soft delete and restore. Browser tests covered create, edit, reload, search, delete and restore; unit tests covered the data layer and migration.
- Added the editor's cue toolbar, spoken-word and duration stats, target fit badges, section timing, readability and placeholder hints, and ordered 400 ms autosave. Unit tests covered all markup syntax, unknown brackets, nested emphasis, English, Hindi and Japanese words, and timing. A browser test checked deletion during a pending save.
- Added the homepage Record video handoff, Studio header link and normalized virtual page views. A browser test verified that the homepage script opens in the Studio editor as the quick script.
- Excluded Studio from the sitemap and marked it `noindex,follow`; content lint, SEO crawl and the browser sitemap check passed. The budget script measures Astro island entrypoints and static imports, with Studio at 21.4 KB gzip against 90 KB and the largest content page at 27.7 KB against 60 KB.
- Refreshed the editor and presenter screenshots from the existing visual test.

Files: `src/studio`, `src/domain/studio`, `src/content/studio`, `src/layouts/StudioLayout.astro`, `src/pages/studio.astro`, `src/styles/studio.css`, homepage handoff, SEO and budget scripts, tests and screenshots.

Gates: check pass, unit 87/87, e2e 58/58, media not applicable, budget 21.4 KB Studio / 27.7 KB largest content page, SEO crawl pass, lighthouse not run. No M3 Docker gate was specified.

Deviations: D-018 uses a same-origin handoff to the classic presenter for the M3 Present action.

Known issues:

- Record, Practice, Takes and Settings show planned placeholder screens until their later milestones.

Owner manual checks:

- On a physical phone, write a script in Studio, reload, and confirm it remains in the local library.

Next: M4.

## M4 Record core - 2026-11-05

Shipped:

- Added capability-driven recording support: MIME preference and bitrate selection, camera-constraint fallback, clear permission/busy/insecure failures, and an in-app-browser replacement notice.
- Replaced the Studio Record placeholder with a camera preview, countdown, lens-side WPM prompter, cue and pause handling, font controls, tap/scrub behavior, section chips, target timing and focused keyboard controls.
- Added a local MediaRecorder lifecycle with chunk persistence, interruption/reload recovery, wake-lock handling, review actions, keep/retake/discard/star, Web Share/download export, take detail/list screens and a storage meter.
- Added quick record settings for camera direction, resolution, countdown, safe zones and grid; the homepage handoff now opens the quick script in Record and retains an explicit editor path.
- Added typed Studio analytics for the live recording journey and coverage for media selection, bitrates, constraints, error mapping, scroll math, chunk ordering, filenames, storage estimates, in-app detection and browser recording/recovery flows.

Files: `src/domain/studio` media, camera, recorder, storage and take modules; `src/studio/RecordScreen.tsx`, `src/studio/TakesScreen.tsx`; Studio shell/styles, handoff, browser and unit tests.

Gates: `npm run check` pass (100/100 unit tests); `npm run test:e2e` pass (62/62); `npx playwright test --project=media` pass (4/4); Studio budget 32.5 KB gzip / 130 KB. No M4 Docker gate was specified.

Deviations: none.

Known issues:

- A physical device is still required to validate real camera selection, local file saving and wake-lock behavior across the supported browser matrix.

Owner manual checks:

- On an iOS Safari or Android Chrome phone, allow camera and microphone, record a short script, keep it, reload Studio, play the saved take and export it. Repeat once after opening the site inside a social-app browser to confirm the open-in-browser guidance.

Next: M5.

## M5 Pro settings, readiness, layouts and keys - 2026-11-05

Shipped:

- Added the Appendix B settings model, defaults selected on first use, sanitization, ordered IndexedDB writes, and a one-time import of M4 quick preferences. Camera, microphone, recording, prompter and remote key sections are available under `#/settings/:section`, with the Record quick sheet using the same object.
- Wired camera, resolution, frame rate and microphone changes to media reacquisition. Added capability-filtered pro camera controls, processing modes, device pickers, a five-second mic check and RMS/peak/clip meter.
- Added deterministic darkness, backlight, room-noise, clipping, quiet-mic, storage, battery and orientation checks; platform-specific approximate safe zones; grid, level and screen light overlays; landscape dock override; desktop distance presets and two-pane editor; mirror text; and the self-hosted Atkinson Hyperlegible font with its OFL license.
- Added unit tests for settings, camera capability fixtures, readiness, keys and the audio meter. Added browser tests for media constraints, remote keys and settings reload. The browser tests could not execute in this sandbox, so their assertions remain pending.

Files: `src/domain/studio` settings, camera controls, readiness, keymap and audio modules; `src/studio` Record and Settings screens; `src/content/studio/platformFacts.ts`; `src/styles/studio.css`; `public/fonts/atkinson-hyperlegible`; unit and browser tests.

Gates: check pass, unit 121/121, e2e 65/65, media 6/6, budget 41.1 KB Studio / 27.8 KB largest content page, lighthouse not run.

Deviations: D-019 migrates M4 quick preferences into the new object. The full Camera Settings screen also now captures the live track capabilities before filtering resolution and frame-rate choices, so its capability gating matches Quick settings.

Known issues:

- Camera exposure, focus, orientation and audio capability behavior depend on the physical device and browser.

Owner manual checks:

- On iPhone Safari and Android Chrome, switch cameras and microphones, test 4K and high frame rates where offered, verify front-preview mirroring against the saved file, and confirm level permission, external mic quality and mic check playback.
- Rotate a phone through both landscape angles and verify the dock and controls stay on opposite sides. Check screen light, safe zones, readiness warnings and wake lock while recording.
- On a desktop webcam, verify the two-pane editor, distance presets, clicker keys, F5 interception, and setting persistence after reload.

Next: M6 after M5 browser gates and commit/push can run in a writable, browser-capable environment.
