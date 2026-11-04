# Studio decisions

- **D-001** Keep Astro 7 static output and Preact islands. Studio is one client-only island at `/studio`, using hash routing.
- **D-002** Voice follow is removed (M1). The pre-removal state is tagged `archive/voice-follow-v1` for possible revival.
- **D-003** Local-first data: IndexedDB for scripts, ideas, takes and settings. No accounts.
- **D-004** Record the camera `MediaStream` directly with `MediaRecorder`. Prefer MP4 (H.264/AAC). No canvas compositing in v1.
- **D-005** Export through the Web Share API with files, falling back to download. No platform publishing APIs.
- **D-006** PWA with a hand-written service worker: network-first HTML, cache-first hashed assets, Studio works offline.
- **D-007** No servers or new infra. Desktop-to-phone handoff uses URL fragments (QR or link). Reminders use `.ics` files. Remote control uses keyboard and Bluetooth keys.
- **D-008** Umami-only product analytics, always on, with a random device id passed to `umami.identify()`. Typed event taxonomy, enum properties only.
- **D-009** SEO is tool-first: landing pages carry a working entry point above the fold. No fabricated volumes. No named comparison pages until the owner verifies them.
- **D-010** Integration branch `codex/creator-studio`. Launch happens via a PR into `main` after M7 and owner device QA.
- **D-011** Studio speed is expressed in WPM. Pixels per second are derived from measured pixels per word.
- **D-012** No new UI frameworks. Dependencies are limited to the list in 0.4.
- **D-013** Same origin `www.teleprompter.wtf` for the site and Studio, so homepage-to-Studio handoff can use shared storage and SEO authority stays in one place.
- **D-014** The classic presenter stays for speakers (P4). Studio reuses its scroll engine.

- **D-015** Until the settings schema and content packs exist in later milestones, seed the analytics allowlists for settings, templates and niches from the approved plan. M5 and M8 must derive or reconcile those lists against their shipped schemas and content IDs so the validation cannot drift.
- **D-016** The plan names `words_bucket` without defining its boundaries. Reuse the classic script-size buckets for now. Use `0` as the session streak bucket before a streak exists. Revisit the boundaries with the Studio data layer and real usage.
- **D-017** Virtual page titles are fixed labels derived from the normalized route rather than arbitrary caller-supplied titles. This preserves the no-user-content analytics rule even if a future caller passes a script title.
