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

## M6 PWA - 2026-11-05

Shipped:

- Committed generated PNG icons (192, 512, maskable 512 with 20% padding, opaque 180 touch icon) and the manifest exactly as in 11.8. Added the head tags to both layouts and a noindex `/offline` route.
- `npm run build` now also runs `scripts/build-sw.mjs`. It parses the built pages, follows their module graph and CSS fonts, and writes a deterministic `dist/sw.js` with a sha256 `VERSION`. A missing page asset fails the build.
- Service worker: network-first navigation with a 3 s timeout, then the cached page, then `/offline`. Cache-first `/_astro`, `/icons` and `/fonts`. Cross-origin and non-GET requests pass through. `POST /share-target` stores an idea with the existing schema and answers 303. `SKIP_WAITING` is supported.
- Production-only registration from StudioApp, with the "Update ready" toast and Reload button.
- Pure install-state model and ask ladder, with accessible Android and iOS sheets. They respect one ask per session, three in total and the 7-day cooldown, and never open during a recording. An install prompt fired before Studio finishes booting is kept.
- `T1.` transfer code export and import from Settings, the iOS sheet and the Home Screen "Bring your scripts from Safari" card. It enforces the 1 MB decoded limit, including against decompression bombs, validates every row before writing any, lets the newest `updatedAt` win, carries no takes and keeps the device id.
- `persist()` on first standalone launch, plus nginx and `_headers` updates for `sw.js`, the manifest, icons and the `/share-target` fallback.
- Fixed a key-capture race in Settings that made one browser test fail about 1 run in 15: the listener now attaches in the same commit as the prompt.

Files: `public/site.webmanifest`, `public/icons`, `public/_headers`, `nginx.conf`, `scripts/build-sw.mjs`, `scripts/sw-precache.mjs`, `scripts/generate-icons.mjs`, `src/sw`, `src/domain/studio` install, transfer and storage modules, `src/studio` InstallSheet and PwaControls, `src/pages/offline.astro`, both layouts, `tests/pwa.spec.ts`, `tests/media.spec.ts`.

Gates: check pass, unit 216/216, e2e 98/98, media 7/7, budget 45.1 KB Studio / 27.8 KB largest content page, lighthouse not run. Docker: image built and run; `/sw.js` sends `Cache-Control: no-cache`; `/site.webmanifest` is valid JSON sent as `application/manifest+json` with `max-age=3600`; `POST /share-target` answers 303 to `/studio#/inbox`; all 20 precache URLs answer 200. Beyond the required gates, `tests/pwa.spec.ts` passed 32/32 against the running image and `npm run test:seo-crawl` passed.

Acceptance:

- Manifest: `tests/pwa.spec.ts` deep-equals the whole 11.8 object, and separately asserts `id`, `start_url`, `scope`, `display`, `icons`, `shortcuts` and `share_target`.
- Offline: the same spec confirms registration on `/studio`, then with `context.setOffline(true)` confirms the reload renders the shell and a real never-visited guide shows `/offline`.
- Share target: `src/sw/share-target.test.ts` covers the pure functions, `src/sw/service-worker.test.ts` runs the rendered worker, and the browser test submits a real multipart form.
- Transfer: the browser test exports, imports in a fresh context, and confirms scripts, ideas, settings, streak and device id. `src/domain/studio/transfer.test.ts` covers the limits and validation.
- Recording: the media test records real takes with a fake camera and fires the install prompt mid-take. It failed as expected when the recording-start signal was temporarily removed.

Deviations: D-020 to D-026.

Known issues:

- The update flow is tested with a stubbed registration and with `SKIP_WAITING` in the worker unit test. No test deploys two real builds and walks a live update.
- Install prompts, `appinstalled` and share sheets cannot be driven in headless Chromium. Tests use synthetic events and a form POST to the same endpoint.
- `VERSION` hashes the precache list, as 11.8 specifies, so replacing an icon under the same file name does not refresh installed copies until the list changes.
- The 3 s navigation timeout is verified with fake timers, not a slow real network.
- `#/inbox` is read-only until the M8 Ideas inbox.

Owner manual checks:

- Android Chrome: confirm the install prompt appears after the first export or second session, the app installs with the correct icon and name, each of the three shortcuts opens its screen, and sharing text and a link from another app lands in `#/inbox` with the idea saved.
- iPhone and iPad Safari: follow J13. Export a take, tap "Show me how", add to the Home Screen, open the app, tap "Paste scripts", and confirm the scripts arrive. Check the touch icon and the status bar over the dark shell.
- On both phones: open the installed app in airplane mode and confirm Studio loads and a never-visited guide shows the offline page. Check that recording still works offline, and confirm that a real later deployment shows "Update ready" and that Reload picks it up.
- After deployment: confirm the production proxy keeps `/sw.js` at `no-cache` and passes `POST /share-target` through.

Next: M7.

## M7 Launch: positioning, habit kernel and QA - 2026-11-05

Shipped:

- Repositioned the homepage with the Appendix A creator hero, visible 390x844 Record CTA, classic-editor path, trust chips, three launch blocks, FAQ and shipped-feature schema. Updated navigation, the mobile returning-visitor bar and all public launch pages, documentation, `llms.txt` and changelog.
- Added the no-freeze local-day streak kernel for kept takes and practice runs reaching 80%, with a Home badge and Settings switch. Added a daily `.ics` reminder with a floating local time, alarm and conditional calendar URL, plus Settings and the second-active-day or post-install ask.
- Added save nudges to the take library and detail screen, and the owner device QA checklist.
- Verified acceptance: the homepage CTA is above the fold at 390x844; `.ics` unit tests check daily repeat, alarm, floating time and iOS standalone URL omission; streak unit tests cover same day, next day, gap, timezone change and both DST boundaries. Playwright clock tests cover day transitions, the Settings switch and practice credit. Visual capture and accessibility scans passed.

Files: homepage, shared layout and styles, public pages, `src/domain/studio/streak.ts`, `ics.ts`, Studio Home, Practice, Settings, take screens, browser and unit tests, docs, README and changelog.

Gates: check pass, unit 221/221, e2e 102/102, media 7/7, budget 46.9 KB Studio / 27.8 KB largest content page, SEO crawl pass against the read-only Docker image, Lighthouse on `/`: Performance 98, Accessibility 100, SEO 100, LCP 1.8 s, TBT 120 ms, CLS 0. Docker container removed after testing.

Deviations: D-027 uses local calendar date keys and a timed 140 WPM practice run for the M7 streak kernel. D-028 defers navigation and `llms.txt` links to M8 and M10 routes until they exist. Per the orchestration instruction, no PR was opened and nothing was merged or pushed to main.

Known issues:

- Real-device behavior for iOS calendar import, camera formats, install prompts, app switching and saved-file uploads still needs owner QA.
- The practice screen measures progress from a fixed 140 WPM reading timer. It does not verify spoken words.
- One Lighthouse run saw a 1.5 s unattributed browser task on a guide and scored its Performance 73. The immediate repeat scored 100 with TBT 10 ms; the homepage stayed within every M7 budget in both runs.

Owner manual checks:

- Run every device and browser row in `docs/studio/DEVICE-QA.md` before merging the launch PR, especially iPhone and Android recording, save to Photos or Gallery, Instagram and YouTube uploads, offline install and `.ics` import.

Next: M8.

## M7 reviewer fix-up - 2026-11-05

Shipped:

- Recognized standalone display on a fresh launch so the reminder ask appears before two active days. Added a browser check for a new standalone app with zero active days.
- Paused practice progress while the document is hidden and added a browser check that a hidden interval beyond the credit threshold earns no streak on return.
- Described the `.ics` action as a file download, tracked that observed action separately from calendar import, and added a Settings switch to turn off the Home ask. Updated the privacy page to name the complete transfer payload and the sensitivity of shared codes and links.
- Added a real fake-camera Keep-to-Home-badge integration check.

Decision: D-029 defines reminder download and ask semantics; calendar import remains an owner device QA check.

Gates: `npm run check` pass (221/221 unit tests); `npm run test:e2e` pass (105/105); separate media project pass (8/8); `npm run budget` pass (47.1 KB Studio / 27.8 KB largest content page). Docker resource gates remain with the orchestrator.

Next: M8 after M7 PR review and owner device QA.

## M7 independent approval and PR - 2026-11-05

Gates rerun by Hermes with Node 22: `npm ci`, `npm run check` (221/221 unit), `npm run test:e2e` (105/105), media (8/8), `npm run budget` (Studio 47.1 KB / 130 KB). Docker read-only image 84,325,731 bytes: `/health` and `/studio` 200, `/private-voice-tracking` 301, manifest valid, CSP and Permissions-Policy present, `/sw.js` no-cache. Container SEO crawl passed. Mobile Lighthouse homepage 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO (LCP 1.8 s, TBT 60 ms, CLS 0). iPhone 15 and Pixel 7 emulation across `/`, `/studio`, `/features`, `/compatibility`, `/privacy`: no console errors or horizontal overflow. Targeted fix review: P0=0, P1=0.

PR: [#8](https://github.com/SABYA648/Telemprompter-WTF/pull/8) from `codex/creator-studio` into `main`, open and unmerged. The owner must complete [DEVICE-QA.md](DEVICE-QA.md) and explicitly approve before any merge or production deployment. M8 proceeds on the integration branch.
