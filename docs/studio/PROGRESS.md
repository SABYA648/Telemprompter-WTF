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

## M8 Creator workflow - 2026-11-05

Shipped:

- Public `/templates`, `/templates/[slug]` (20), `/hooks` and `/hooks/[niche]` (8) pages built from the merged content packs, with Article or CollectionPage plus BreadcrumbList schema, one primary Studio CTA each, header and footer links in the 8.2 order, homepage links and `llms.txt` entries. Each template links to its two related templates, its hooks niche, and the previous and next template. "Record this hook" opens Record on a new script; Copy reports failure instead of throwing.
- In Studio: a Template picker (search, duration and format filters) behind a disclosure on Scripts and through `#/scripts/new?template=<id>`; a Hook picker in the editor with Shuffle (always a different hook) and Insert at the cursor; the Ideas inbox with add, delete, "Make script" with a chosen template, and the share-target landing (`?shared=1` and `?shared=error`); Up next with add, move up, move down and remove, plus Home's Up next rows with Record, "Record next" (`#/record/next`) and quick actions (+ Script, + Idea, Templates, Practice); status filter options with live counts; caption, hashtag, YouTube title and description counters from `platformFacts.ts` with over-limit text.
- Practice (9.7): prompter under the lens, an optional mirrored front camera that is off by default, a WPM stepper, tap to pause, and a summary of duration, average WPM over active time, pauses and target fit, with a Record link. Streak credit at 80% is unchanged.
- Section mode: "Record one section" plus the section picker (locked while recording) starts the prompter at the section's cue line, tags takes with `sectionIndex`, stops at the section end, and rewinds to the section on Retake. Takes are grouped by script, then by section with the section title. "Save starred takes" shares one script's starred takes as one multi-file share in section order, with section numbers in the file names.
- Batch mode (J6): Start batch from Up next, `started_take` with mode `batch`, Keep then a 5-second "Next up" card, End batch, a summary, Save all as one multi-file share, and the `batch_day` badge once.
- Send to phone (11.7, J3): an `S1.` link with a lazy-loaded QR code (error correction L, 280 px) up to 1,500 characters, otherwise the "Too long for a QR code" note; Copy link and Share link. `#/receive/S1...` shows the title, word count and duration, "Save and record", and the iOS "Copy transfer code" hint with a manual-copy fallback. Shared links drop the sender's queue position and take history.
- Fixes found while finishing: Studio now resyncs the route when the hash changes between first render and listener setup (a test caught Record staying on screen after navigation); Record opens on "Opening camera" instead of flashing the priming sheet for returning users; the footer nav wraps so the extra links no longer overflow at 768 to 850 px; the section-end timer resets after each take.

Files: `src/pages/templates/*`, `src/pages/hooks/*`, `src/studio/{CreatorTools,SendReceive,BatchScreen,PracticeScreen,TakesScreen,RecordScreen,StudioApp}.tsx`, `src/domain/studio/{queue,batch,ideasRepo,practice,exportTake,transfer,handoff}.ts`, layout, homepage, styles, `scripts/lighthouse.mjs`, unit tests and `tests/creator-workflow.spec.ts`, `tests/media.spec.ts`.

Acceptance, all with the fake camera in the `media` project:

- Template to script to kept take: `template to script to kept take`, plus the public `Use this template` path in `creator-workflow.spec.ts`.
- Idea to script: `idea becomes a script with a chosen template`.
- Section takes carry `sectionIndex`: two media tests, one of which reaches the section end with no Stop tap, then checks the Takes section heading and the starred-take download name.
- `#/receive/S1...` creates a script: `S1 link previews and saves a new script`, plus QR, too-long and bad-link tests.
- Batch over 2 scripts gives 2 kept takes and a summary, then Save all exports both and the queue is empty.

Gates (Node 22): `npm run check` pass (content lint 62 pages, unit 251/251), `npm run test:e2e` 126/126, `npx playwright test --project=media` 13/13, `npm run budget` pass (Studio 56.1 KB / 130 KB, largest content page 27.8 KB / 60 KB). SEO crawl against `serve dist`: pass, 60 sitemap URLs. Lighthouse mobile against `serve dist` with Playwright's Chromium: `/templates`, `/templates/30-second-reel-script`, `/hooks` and `/hooks/fitness` all 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO, LCP 1.4 s, TBT 0 ms, CLS 0; `/` 100/100/100/100.

Deviations: D-030 (Practice component and WPM-based progress), D-031 (Up next after Keep, `updatedAt`, `#/record/next`), D-032 (no `/record/*` links before M10, previous and next template links, new script for hooks), D-033 (batch never starts a take on a timer, End batch), D-034 (lazy content packs). The Lighthouse and SEO runs used a static `serve` of `dist`, not the nginx Docker image.

Known issues:

- One full e2e run in three saw chrome-headless-shell crash with SIGSEGV while creating a new context in a PWA test, on a different test each time. Those tests pass on rerun and alone, and the final full run was clean. I did not establish whether this predates M8.
- Section end is detected from the prompter position, so a take for a very short first section can end early if the cue line already sits near the next heading.
- Batch state is per tab (`sessionStorage`); closing the tab mid-batch keeps the takes but drops the batch summary.

Owner manual checks:

- On a phone, scan a Send to phone QR code from a desktop, then "Save and record". On iPhone, also try "Copy transfer code" and Paste scripts in the Home Screen app.
- Record a section take and confirm it stops at the section end, then share starred takes as one multi-file share to Photos or Files.
- Run a two-script batch and use Save all on a phone share sheet.

Next: M9.

## M8 mobile UI hotfix - 2026-11-05

- Rebuilt Scripts library cards so titles and metadata use the full card width at 320, 360 and 390 CSS px. Long titles remain readable; compact 44 px action chips sit below the details. Delete is visually distinct, requires confirmation, and announces completion. Up next and Recently deleted rows also wrap their controls cleanly.
- Mapped every Studio route to one active navigation item, including Scripts subroutes, Practice and Record. The camera view reserves space for the Record tab and keeps its controls clear of the navigation.
- Gates with Node 22: `npm run check` passed (266/266 unit tests, typecheck, lint, content lint, formatting, build and budget; Studio 56.7 KB gzip / 130 KB). Playwright passed across all spec files in bounded groups: 118/118 Chromium and 14/14 fake camera tests. Targeted card and navigation checks passed at 320, 360 and 390 px; browser PNG captures were inspected at 360×800 and 390×844, including the delete confirmation state.
- The initial single Playwright command was terminated by the runner after 30 passing tests (exit 143); every spec file passed on the subsequent grouped runs. Physical phone checks remain with the owner.
- Follow-up P1 gate, 2026-11-05: The review sheet now ends above the 56 px bottom nav (plus safe area), and Practice reserves that same space below its scrollable actions. The Record tab preserves the current script route during an active take. At 320×640, 360×800 and 390×844, browser tests confirmed Finish practice and Restart can be scrolled above the nav and tapped; fake-camera tests confirmed Keep is above the nav, and a Record-tab tap mid-take leaves the take and recorded status on the intended script.
- Follow-up results with Node 26: `npm run typecheck` passed (0 errors, 0 warnings, 3 hints); focused ESLint passed; `npm test` passed (43 files, 267 tests); `npm run build` passed (63 pages). Focused Playwright runs passed 4/4 Chromium and 4/4 fake-camera tests; the full relevant `studio-ui`, `creator-workflow` and `media` specs passed 41/41 (24 Chromium, 17 fake-camera). Physical phone checks remain with the owner.

## M9 Habit system - 2026-11-06

Shipped:

- Today card (H3, 14.3): the date-seeded prompt from the 120-entry pack, the same for everyone on a local date, with "Write it", "Another hook" (always a different hook) and "Record". The prompt's hook replaces the template's hook line and the angle becomes a note, so nothing is read twice. `viewed_today_prompt` is sent once per day per session.
- Streak freezes (H1, Appendix B `StreakState`): one freeze per 7 real streak days, at most 2, spent automatically on missed local days before today. Frozen days count in the run and the best, but earn nothing. Existing D-027 records migrate on first read. The copy is supportive and always shows the best streak, and today's recording takes precedence over the freeze message. Events: `extended_streak`, `lost_streak`, `used_streak_freeze`.
- Weekly goal and ring (H4): 3, 5 or 7 distinct scripts with a kept take per Monday-start local week, set in Settings (`set_weekly_goal`), with `reached_weekly_goal` once per week. Stats: videos, takes, minutes recorded, words read (snapshotted at Keep from where the prompter stopped, or from the section) and average WPM.
- Badges (H7) with fixed labels: all 11 ids, unlocked idempotently (serialized, so a simultaneous Keep and export cannot double-unlock) and re-checked after practice credit. The celebration card stays until "Nice" and has no motion under `prefers-reduced-motion`. `batch_day` now follows H7 (five scripts kept in one local day).
- Share cards (H8): an on-device 1080x1920 PNG with a fixed heading, the big number, a fixed label and the wordmark, never script text. Shared through Web Share with a file and the `/?utm_source=share_card` link, with a download fallback. Cards cover streak, weekly, recap, challenge and badge.
- 30-day challenge (H9, 14.4): `#/challenge` (virtual page `/studio/challenge`) with Join, a progress bar, today's assignment with Write it and Record (source `challenge`), the 30-day list, and completion after kept takes on 30 different local days since joining, with no deadline. Events: `joined_challenge` and `completed_challenge`, plus the `challenge_30` badge.
- Monday recap (H10): last week's videos, minutes, best streak and goal status, with a share card.
- `asks.ts` (4.3): a single session ask in `sessionStorage`, shared by the install sheet, the reminder, the milestone share card and the rating, in ladder order and never while recording. Install keeps 3 shows and a 7-day cooldown. The reminder gets a 7-day "Not now". Each share milestone (streak 3, 7, 30, weekly goal, challenge) is offered once. Storage cleanup (over 80% of quota or more than 20 unexported takes) is a guardrail outside the slot.
- `experiments.ts`: at most 2 live experiments, assigned deterministically from the device id hash, stored in `kv`, and mirrored as `exp_priming_copy` and `exp_countdown` session data. The first two are the priming copy, and a default countdown of 0 against 3 for newly created settings only. Session data now also reports real `takes_bucket` and `streak_bucket` values.
- Quick rating (H11): "How did recording feel today?" after the third kept take, 1 to 5 in one tap or Skip, stored once.
- Settings > Habit: the weekly goal plus 9 switches (streaks, goal, today's prompt, stats, badges, challenge, recap, share cards, rating). Each one removes its feature from Home.
- Home layout for 320 to 390 px: one summary card (ring plus streak), then the celebration, one ask, the Today card and the recap above Up next, with "Your progress" (stats, badge chips, challenge entry, manual shares) after the quick actions. Home habit data refreshes when a tab becomes visible again. The privacy page now describes the coarse session labels and on-device habit data.

Files: `src/domain/studio/{streak,habits,asks,experiments,shareCard,settings,transfer,batch,exportTake}.ts` and their tests, `src/domain/analytics.ts`, `src/studio/{HabitUI,StudioApp,RecordScreen,PracticeScreen,InstallSheet,ReminderCard,SettingsScreen,BatchScreen}.tsx`, `router.ts`, `tabs.ts`, `src/styles/studio.css`, `src/pages/privacy.astro`, `tests/habits.spec.ts`, `tests/habit.spec.ts`, `tests/media.spec.ts`, `tests/creator-workflow.spec.ts`.

Acceptance:

- Freezes: `streak.test.ts` covers earning on the seventh day, the cap of 2, auto-apply across a 2-day gap, loss when the gap exceeds the freezes (best kept), no spend on today, no earning from frozen days, and the 400-date cap. `habits.test.ts` covers D-027 migration with a persisted spent freeze.
- Monday 00:00 local: unit tests at Sunday 23:59:59 and Monday 00:00:00 in local time and in `America/New_York`, plus the browser test "the weekly goal resets at Monday 00:00 local time".
- Idempotent badges: three simultaneous `unlockBadge` calls unlock once, repeated rule runs track `unlocked_badge` once per id, and the media test confirms one real Keep celebrates "First take" once.
- Ask ladder: `asks.test.ts` covers one ask per session, the session claim, the install limit of 3 and the 7-day cooldown boundary, the reminder rule, the rating once (including Skip), ladder order with switched-off steps, and each share milestone once. The browser test shows only the reminder when three asks are eligible, then the share card in a new session, then the rating.
- Playwright clock: day 1 gives 1 and day 2 gives 2 with real fake-camera takes. The freeze test is adapted per D-041: six seeded days, then a real take on day 7 shows "1 freeze ready". Skipping day 8 shows the 8-day streak and the freeze message on day 9 before recording, and 9 after.
- Share card: the browser download is a PNG over 10 KB, with IHDR 1080x1920.

Gates (Node 26.7): `npm run check` pass (typecheck 0 errors, lint, content lint 62 pages, format, unit 305/305, build, budget). `npm run test:e2e` first full run 149/150; the failure was "practice credits the streak after 80 percent" (Home showed no streak card). It passed 12 of 12 times repeated alone, and the immediate full rerun passed 150/150 (130 Chromium, 20 fake camera). `npx playwright test --project=media` 20/20. `npm run budget`: Studio 65.7 KB gzip / 130 KB, largest content page 27.9 KB / 60 KB. The privacy copy changed after both e2e builds, so `npm run check` was rerun (pass) and the SEO, visual, app, tools and analytics specs were rerun on the fresh build: 35/35. Screenshots at 320, 360 and 390 px were checked by eye. Lighthouse and the Docker crawl were not run for M9.

Deviations: D-035 to D-042. D-041 adapts the freeze clock test to H1. D-038 extends the one-sheet rule to all Home asks. D-039 sends the share link as share text instead of painting it. The analytics `setting` enum still has no `habit` group, so the habit switches send no `changed_studio_setting` (the goal sends `set_weekly_goal`).

Known issues:

- The practice-credit browser test failed once under the full parallel run and has not reproduced. If it recurs, look at the Home read racing the practice write.
- Coverage was unmeasured at M9 sign-off; resolved in the review fix-up below.
- Share sheets with files and a real Instagram story upload cannot be driven in headless Chromium. CI covers the download path and a stubbed `navigator.share`.
- Experiment arms are visible in Umami only once the server stores session data (Umami 2.18.0 or later, section 18).

Owner manual checks:

- On iPhone and Android: share a streak card to Instagram Stories and Photos, and confirm the image is full screen and the link arrives in the share text.
- Leave Studio open overnight and return: the Home streak and week update without a reload, and a skipped day after 7 streak days shows the freeze message.
- Turn each Habit switch off and confirm Home stays clean at your phone width.
- In Umami, confirm sessions carry `exp_priming_copy`, `exp_countdown`, `takes_bucket` and `streak_bucket`.

Next: M10.

## M9 review fix-up - 2026-11-06

- Share asks now use the persisted best run to recover streak milestones passed while away, offer unshown streak cards in 3, 7, 30 order, and show the earned milestone number on the card. A unit test reaches day 7, returns on day 9 and confirms the day-7 card is offered once.
- Monday recap calculates its best streak only within the previous local Monday-to-Sunday week, including freeze days. Unit and browser tests seed an older 30-day run and one day last week and confirm the recap says 1 day.
- Studio populates the takes and streak bucket mirrors before the first Umami identity call, then re-identifies when Keep or a return to the tab changes either bucket. A fake-camera browser test spies on `umami.identify` before and after Keep.
- Studio initializes analytics once even when a boot read fails, ignores bucket refreshes until initialization, and catches visibility refresh errors. A browser test confirms Umami identifies in memory storage after IndexedDB open fails.
- Rating buttons use a 3 px grid gap. A 320 px Playwright bounds test confirms all five buttons are at least 48 px wide and stay inside the viewport.
- D-043 adds exact-version `@vitest/coverage-v8@4.1.10` as a development-only dependency. `npm run test:coverage` enforces 80% line coverage for `src/domain/studio` and measures **89.44% (1008/1127 lines)**. It is outside `npm run check`; no client bytes are added.
- Gates with Node 26: `npm run check` passed (307/307 unit tests, typecheck, lint, content lint, formatting, build and budget); `npm run test:coverage` passed at 89.44%; `npm run budget` passed (Studio 65.9 KB gzip / 130 KB). The full `npm run test:e2e` run passed 151/153; one transfer assertion assumed a stored `current: 2` remained unchanged despite only one active date, and Chromium crashed before another PWA case. The assertion now expects the correctly recalculated `current: 1` with `best: 2`. After the final build, the specs passed in smaller groups: 32/32 PWA, 56/56 and 44/44 other Chromium, and `npx playwright test --project=media` 21/21; **153/153 total**.

## M9 independent approval - 2026-11-06

Hermes reran the gates on `ec770bbc5fac43d2255b46731137f2c933059341` with Node 26: `npm ci`, `npm run check` (307/307 unit), `npm run test:coverage` (89.44% lines, 1008/1127, threshold 80%), `npm run test:e2e` (154/154), media (21/21), and `npm run budget` all passed. Docker read-only image size: 85,398,663 bytes; `/health`, `/studio`, `sw.js`, and manifest returned 200, `/private-voice-tracking` returned 301, CSP and Permissions-Policy were present, and `sw.js` sent `no-cache`. Container SEO crawl passed. Mobile Lighthouse on `/`: Performance 99, Accessibility 100, Best Practices 100, SEO 100 (LCP 1.8 s, TBT 110 ms, CLS 0); other sampled indexable routes scored Performance 95-100 and Accessibility/Best Practices/SEO 100. iPhone 15 and Pixel 7 emulation across `/`, `/studio`, `/templates`, `/hooks`, a guide and a tool: 12/12 no console errors or horizontal overflow. Fix-round re-review: P0=0, P1=0 (one P2 about the failure injection test's strength). PR #8 remains open and unmerged; no production deploy. Next: M10.
