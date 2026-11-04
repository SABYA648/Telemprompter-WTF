# Product case study

An engineering and product record of teleprompter.wtf: the problem, the thesis, the decisions, and how quality and growth are measured. Written for the public launch of version 1.0.0. It contains no usage numbers because none exist yet; the measurement system described here is how they will be produced.

## Problem

Using a teleprompter should take seconds. In practice, the category adds friction at exactly the wrong moment, when someone is about to present:

- Accounts and sign-in walls in front of a basic utility
- Paywalls gating core features like speed control or mirroring
- Fixed-speed auto-scroll that cannot adapt when a speaker pauses or ad-libs
- Voice-following products that route audio or scripts through remote processing, which is a poor default for unpublished material

The defensible core of the problem statement: a teleprompter is text rendering plus scrolling, and nothing about that job requires a server, an account, or a third party seeing the script.

## Product thesis

Build an instant browser utility that:

1. Works the moment the page loads, with no account and no install
2. Follows the speaker's voice entirely on the device, in two tiers of increasing capability and cost
3. Keeps scripts, audio, recognition, and recordings off every server, by architecture rather than by policy
4. Stays free and open source, with distribution through organic search instead of a sales funnel

## Principles

- **Instant use.** Paste, press Start, present. Manual mode has no dependency on microphone, model, recording, analytics, or network availability.
- **Progressive disclosure.** Advanced features (voice tracking, recording, Picture in Picture) appear only when requested and never sit on the critical rendering path.
- **Local-first.** Scripts persist in origin-local storage. Voice processing happens in the browser. Recordings save to the local disk. There is no upload endpoint to breach or misconfigure.
- **No required account.** Accounts exist for sync or payment; this product needs neither, so the account system and its data liability were not built.
- **Performance as a feature.** Static HTML, minimal JavaScript, and fingerprinted immutable assets. The default page requests no model, runtime, analytics, or permission.
- **SEO as distribution.** A free tool with no marketing budget grows by being the best answer to a search. Twenty indexable static routes target distinct intents, with structured data, canonicals, and a sitemap.

## Architecture decisions

- **Astro static-first.** The site builds to plain HTML served by Nginx. Content pages ship nearly no JavaScript; interactivity is isolated.
- **Preact islands.** The editor, presenter, media, and consent UI are independent islands. A failure in one cannot take down the page.
- **Local state only.** Scripts, settings, and consent choices live in versioned browser-local storage with safe migration and corruption handling.
- **Docker and Nginx.** A multi-stage build verifies checksummed model assets, compiles the static site, and serves it from an unprivileged Nginx image with a read-only filesystem option and a `/health` healthcheck. Model files sit same-origin under `/models/` with one-year immutable caching and byte-range support.

## Tradeoffs, stated honestly

- **Beta precision.** Measured alignment confidence on the bundled fixture is 0.794 to 0.804 (details in [docs/local-precision.md](docs/local-precision.md)). Low-confidence results hold scroll position instead of jumping; chunks are dropped when the worker is busy rather than queued, so the presenter never stutters to catch up.
- **Browser media API limits.** Recording formats, Picture in Picture behavior, and background audio rules differ across browsers and are constrained further on mobile. The product capability-detects and degrades instead of promising uniform behavior.

## Quality system

- **Playwright end-to-end suites** covering the app, privacy and analytics, SEO metadata, advanced features, responsive layout and accessibility, and visual regression.
- **Privacy canaries.** E2E tests inject known script and voice canary strings and assert they never appear in any outgoing URL or request body.
- **Lighthouse artifacts** and Core Web Vitals monitoring for performance.
- **Content lint.** `npm run content:lint` checks public copy, built metadata, JSON-LD, and internal links on every build.
- **Docker validation.** Container builds and end-to-end tests run against the served image, not just the dev server.

## Growth measurement

Distribution is organic search; measurement is GA4 plus Search Console, both operating inside the privacy contract in [docs/analytics.md](docs/analytics.md).

- **Acquisition:** Search Console impressions, clicks, CTR, and position per query and landing page.
- **Activation:** `started_teleprompter` per landing page and per content cluster, via the funnel exploration in [docs/growth-analytics.md](docs/growth-analytics.md).
- **Completion and adoption:** `finished_teleprompter`, voice mode mix, recording and Picture in Picture usage, and `private_precision_fell_back` reasons.
- **Retention:** GA4 new versus returning users. No custom user ID is collected, by design, so retention numbers are directional.

Monetization is deferred until organic usage is validated; the scenario model for that future decision is in [docs/monetization-readiness.md](docs/monetization-readiness.md).
