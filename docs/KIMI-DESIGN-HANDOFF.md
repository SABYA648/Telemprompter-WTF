# Kimi implementation prompt: CompressImage.fun design philosophy for Teleprompter.wtf

Copy everything below this line into Kimi. The folder names in the prompt are deliberate.

---

You are the principal product designer, frontend engineer, growth/SEO lead, accessibility specialist, QA engineer, and release engineer for Teleprompter.wtf.

Two local folders are available:

- `teleprompter` - the writable Teleprompter.wtf target repository.
- `compress image` - the read-only CompressImage.fun reference repository.

Do not rename these folders. You already know their locations and repository identities.

An original Codex-generated Teleprompter.wtf illustration pack is present under `teleprompter/public/illustrations`, with non-shipping PNG masters under `teleprompter/design/illustrations/masters`. Use it as supplied. Do not ask another image model to reinterpret, redraw, upscale, restyle, or replace it.

## 1. Sync GitHub before implementation

For both `teleprompter` and `compress image`:

1. Read repository instructions, product briefs, README files, package manifests, deployment documentation, and test scripts.
2. Inspect the worktree, branch, remote, upstream tracking, and recent commits.
3. Preserve every existing owner change. Never reset, discard, overwrite, or silently stash work.
4. Fetch the latest GitHub state.
5. If the worktree is clean and the current branch can be updated safely, fast-forward it to its upstream branch.
6. If a repository is dirty or diverged, stop that sync and report the exact condition rather than forcing it.
7. Record the final synced commit hash for both repositories.

The reference revision used to prepare this pack was `compress image` commit `6a6d8b4b9c31defcfd9309bbf084dbd7f2915bb7`. Use a newer upstream commit when available. Keep `compress image` read-only.

## 2. Validate the supplied artwork

Read `teleprompter/public/illustrations/manifest.json` and verify every listed non-public master and WebP derivative before changing UI code. Masters intentionally live outside `public` so they do not add about 18 MB to the production payload.

The public asset family is:

- `/illustrations/teleprompter-hero.webp`
- `/illustrations/lost-script-404.webp`
- `/illustrations/guides/video-creator.webp`
- `/illustrations/guides/speech-stage.webp`
- `/illustrations/guides/remote-meeting.webp`
- `/illustrations/guides/mobile-teleprompter.webp`
- `/illustrations/guides/mirrored-glass.webp`
- `/illustrations/guides/script-pacing.webp`
- `/illustrations/teleprompter-og.webp`

Validate file presence, dimensions, hashes, colour profile, browser decoding, payload, crop safety, and appearance at actual mobile and desktop sizes. If repository conventions require another asset directory, move the package mechanically and update all references without changing filenames or art direction.

Do not replace these assets with stock photography, emoji, generic AI artwork, third-party illustrations, or Kimi-generated approximations. Use deterministic image tooling for smaller derivatives and never upscale the supplied masters.

Keep all page copy and controls in semantic HTML. Do not bake headings, labels, SEO copy, or buttons into images. Animate CSS wrappers or separate decorative layers, not the raster pixels.

## 3. Study `compress image` as a system

Inspect its implementation and release evidence, not only screenshots. Study:

- Split hero composition, navigation, typography, spacing, colour, surfaces, borders, depth, focus states, and responsive behavior.
- The product-specific generated hero metaphor and restrained motion.
- Tool-first information architecture.
- Full working tools embedded inside guides.
- Five relevant stories exposed on every tool.
- Useful animated 404 containing a working tool while preserving HTTP 404.
- Tool directory, guide architecture, internal linking, schema, page/image sitemaps, RSS, robots.txt, and llms.txt.
- Privacy-preserving analytics, accessibility, reduced motion, SEO crawl, visual QA, Lighthouse, E2E, security, Docker validation, and truthful release evidence.

Transfer the philosophy and quality bar. Do not copy the CompressImage.fun logo, copy, image-processing metaphors, exact measurements, or brand identity.

## 4. Experience direction

Teleprompter.wtf must feel focused, expressive, fast, trustworthy, private, spacious, and editorial. It should be memorable without becoming distracting for a speaker.

The real teleprompter must remain the primary action. Do not bury it behind signup, onboarding, marketing sections, interstitials, or intrusive banners.

Use warm cream paper, near-black ink, and coral red as the existing identity, with the artwork's indigo, periwinkle, pale-blue, and amber depth. Avoid generic 3D SaaS blobs, excessive glassmorphism, fake UI screenshots, stock photos, and neon cyberpunk styling.

Use subtle floating, flowing-script, cue-pulse, or breathing motion where it clarifies the teleprompter metaphor. Respect `prefers-reduced-motion`; no essential information or control may depend on animation.

## 5. Homepage

Create a polished split hero containing:

- One direct H1 explaining the free online teleprompter.
- A concise benefit-led explanation.
- Immediate access to the actual script-input workspace.
- `/illustrations/teleprompter-hero.webp` as the principal visual.
- Short, truthful promises: no login, no ads, no watermark, and scripts stay on the device.
- No fake ratings, review counts, usage numbers, awards, or customer logos.

Render the hero with explicit `1024x683` dimensions. If it is the LCP image, make it the only eager/fetch-priority image and do not lazy-load it. Keep the camera, glass, and script ribbons visible across responsive crops. Use the manifest alt text when the image communicates product meaning; otherwise use empty alt and accessible adjacent copy.

Include the image in the image sitemap and appropriate visible-content-matching structured data.

## 6. Core teleprompter quality

Audit existing behavior before editing it. Preserve valid capabilities and harden the complete flow:

- Paste, edit, autosave, safely restore, import supported plain text, reset, and delete.
- Start, pause, resume, restart, seek, and clear state feedback.
- Speed, font size, line height, text width, alignment, focus position, contrast, mirror, and vertical flip.
- Countdown, fullscreen, compact/Picture-in-Picture fallbacks, keyboard controls, and touch controls.
- Smart Pace, browser speech behavior, Private Precision Beta, recording, and capability fallbacks without weakening existing privacy boundaries.
- Long, empty, corrupt, malformed, and rapidly edited scripts.
- Duplicate actions, interrupted initialization, permission denial, missing browser APIs, model failure, and accidental data loss.

Manual mode must remain independent from microphone, model download, recording, analytics, and network availability. Do not weaken existing product truth or invent unsupported capabilities.

## 7. Working teleprompter in every useful guide

Every guide must contain a contextual instance of the real teleprompter, not a screenshot or link-only CTA.

Examples:

- YouTube/video: creator preset and section-by-section script structure.
- Speech/presentation: comfortable speaking pace and stage-reading layout.
- Mobile: phone-friendly controls and orientation.
- Mirrored glass: mirror mode immediately visible.
- Pacing: speed, word-count, and reading-time controls.
- Remote meeting: narrow camera-adjacent reading column.

The embed must be fully functional, nonintrusive, accessible, and introduced by one sentence explaining its relevance. Prefer lazy hydration below the fold, but explicitly prevent users from interacting with unhydrated controls. Never collect script content in analytics and never mount multiple full runtimes unnecessarily.

Map guide art by coherent topic cluster:

- `video-creator.webp`: YouTube, recording, courses, podcasts, and short-form video.
- `speech-stage.webp`: speeches, keynotes, presentations, teaching, sermons, and webinars.
- `remote-meeting.webp`: calls, remote interviews, Zoom, and laptop-camera workflows.
- `mobile-teleprompter.webp`: iPhone, Android, phone, and tablet workflows.
- `mirrored-glass.webp`: beam-splitter glass, mirror mode, flips, and optical alignment.
- `script-pacing.webp`: formatting, WPM, timing, pauses, and natural delivery.

Guide images must use explicit `1024x683` dimensions, lazy loading below the fold, contextual alt text, and image-sitemap inclusion. Do not reuse an image on an unrelated story just to fill space.

## 8. Useful animated 404

Rebuild the 404 around `/illustrations/lost-script-404.webp` and a “lost your place” concept.

It must:

- Preserve a genuine HTTP 404 response.
- Be `noindex,follow` or the repository's equally safe noindex policy.
- Contain a compact but fully working teleprompter.
- Link clearly to the homepage, full tool, and guides.
- Work with keyboard and touch.
- Animate only decorative wrapper elements or cue paths.
- Provide an intentional reduced-motion state.
- Never animate or expose a visitor's actual script text.

Automate the real status, metadata, embedded-tool, keyboard, touch, responsive, and reduced-motion checks.

## 9. Story and search architecture

Inventory every distinct public tool or meaningful teleprompter workflow. Each must expose at least five genuinely useful, search-demand-supported stories.

Use current keyword and SERP research. Never fabricate search volume. Validate intent, demand, competition, and whether Teleprompter.wtf can provide a meaningfully better answer and tool.

Seeds to validate include online/free teleprompter, YouTube, speeches, video calls, iPhone, Android, laptop/browser, reading without looking away, speed/WPM, mirrored text, presentations, interviews, recording, courses, webinars, podcasts, short-form video, eye contact, script formatting, keyboard shortcuts, and privacy-first teleprompting.

Do not publish thin permutations, doorway pages, location spam, or stories that differ only by a keyword.

Every story needs one intent, a direct answer near the beginning, original guidance, contextual presets/examples, the working tool, a relevant supplied illustration when applicable, descriptive internal links, carefully selected related stories, accurate metadata, and visible-content-matching structured data. Do not fabricate authors, statistics, testimonials, ratings, or expertise.

## 10. SEO, AEO, GEO, and image discovery

- Give each indexable page one purpose, canonical, title, description, and H1.
- Use semantic headings and concise answer summaries that can be quoted accurately.
- Validate Organization, WebSite, WebApplication/SoftwareApplication, Article, Breadcrumb, and only genuinely applicable schema.
- Maintain page and image sitemaps, robots.txt, RSS, canonical handling, and llms.txt.
- Build a coherent internal-link graph across product, tools, guide clusters, methodology, compatibility, privacy, about, and support pages.
- Use descriptive links without keyword stuffing.
- Keep 404s, private workspaces, drafts, search variants, and noncanonical states out of the index.
- Add dimensions, useful alt text, efficient formats, and zero avoidable layout shift.
- Do not create fake FAQ schema, ratings, reviews, prices, AI citations, or ranking guarantees.

Use `/illustrations/teleprompter-og.webp` as the homepage Open Graph and Twitter image. It is already `1200x630`; do not crop it again. Add correct absolute metadata URLs and verify the response.

## 11. Privacy and analytics

Treat scripts, voice, and recordings as sensitive content. Never transmit or log raw script text, document contents, clipboard contents, filenames, transcripts, microphone labels, user-entered search text, arbitrary errors, recordings, or voice samples.

Keep the existing allow-listed analytics boundary. Use sanitized event names and bucketed properties for ranges such as script length, speed, font size, duration, device category, and feature mode. Test privacy claims by intercepting actual browser requests. Consent must remain opt-in and fail closed.

## 12. Accessibility and responsive behavior

Meet WCAG 2.2 AA expectations: full keyboard operation, visible focus, correct labels and live feedback, sufficient contrast, no colour-only meaning, suitable touch targets, correct fullscreen focus/Escape behavior, no unexpected scrolling before Start, and reduced-motion support.

Verify no horizontal overflow at 375, 390, 768, 1024, 1440, and 1920 pixels. Test long scripts, enlarged text, long headings, translated-length copy, permission denial, validation errors, offline/failure states, and slow hydration.

## 13. Image performance contract

- Keep supplied masters in `design/illustrations/masters`; never move them into the shipping `public` tree.
- Generate smaller variants only with deterministic image tooling.
- Never upscale or generatively modify an asset.
- Keep important content inside manifest crop-safe boundaries.
- Use `srcset` and `sizes` only where measured payload reduction justifies it.
- Lazy-load every non-LCP guide image.
- Confirm all references return 200 from the production-equivalent build.
- Add content/SEO checks for missing assets, dimensions, invalid alt treatment, image sitemap coverage, and social-card dimensions.

## 14. Engineering and performance

Reuse the current Astro/Preact architecture where sound. Do not add a large framework solely for the redesign. Prefer shared tokens and components over page-specific duplication. Keep long-script scrolling smooth and lazy-load page-specific code. Do not ship the full teleprompter runtime to pages that do not use it unless measurement proves the cost acceptable.

Preserve current URLs or add explicit redirects. Avoid unnecessary trackers, external fonts, and blocking dependencies. Keep local and production code paths identical and follow repository Docker/security/deployment policy.

## 15. Required production-equivalent validation

Run the repository's complete local Docker release gate. At minimum cover:

- Clean dependency install and vulnerability audit.
- Type check, lint, format check, content lint, unit/integration tests, and production build.
- Core teleprompter E2E, every embedded-guide pattern, hydration/slow-load cases, useful 404, keyboard, touch, privacy, and analytics sanitization.
- SEO crawl across canonical URLs, metadata, schema, headings, robots, page/image sitemaps, RSS, llms.txt, and real 404 status.
- Accessibility and responsive checks.
- Visual QA of every asset and key UI state at mobile and desktop widths.
- Broken/missing-image checks.
- Lighthouse on homepage, main tool, guide hub, representative guide, and 404.
- Bundle and image payload inspection.
- Security headers/CSP, Docker health and isolation, and bounded load testing where applicable.
- Repository sweep for placeholders, machine paths, secrets, fake identifiers, accidental artifacts, and misleading claims.

Fix every in-scope failure and rerun affected checks. Never present an unrun or failing check as passed.

## 16. Git and release conduct

Make small, reviewable commits only in `teleprompter`. Keep `compress image` read-only and preserve unrelated work. Fetch upstream again before pushing. If upstream moved, integrate it safely without force-pushing, then rerun affected checks.

Push the validated Teleprompter.wtf branch according to repository policy. Do not deploy to Coolify, production, or another host without separate explicit owner authorization. Do not change production secrets, DNS, TLS, domains, volumes, or running services.

## 17. Required handoff

Report synced hashes for both folders; final target branch/commit; design and functional changes; principles transferred; Teleprompter-specific decisions retained; final asset inventory and page mapping; dimensions, formats, hashes, and sizes; tool/workflow and story counts; exact Docker commands; test totals and failures fixed; SEO crawl totals; Lighthouse performance, accessibility, best-practices, SEO, LCP, TBT, and CLS; bundle/image payloads; privacy/security evidence; remaining limitations; Git status/push result; and an explicit deployment-readiness verdict.

Success means Teleprompter.wtf shares CompressImage.fun's philosophy-expressive, tool-first, useful everywhere, private, searchable, accessible, and thoroughly validated-without becoming a reskin or losing its teleprompter-specific product truth.
