# Monetization readiness

This document is explicitly future looking. **There are no ads today.** The application contains no ad code, no ad slots, and no ad network requests, and no analytics event emits ad impressions or revenue. Nothing on this page describes current behavior.

## Why this exists

The current analytics exist to answer a product question first: do people find the tool organically, start it, finish scripts, and return? If that answer is yes at meaningful volume, an advertising experiment becomes worth evaluating. This document defines the arithmetic for that evaluation in advance, so a future decision is made against a written model instead of optimism.

## Scenario model

The only formula used here:

```text
Estimated monthly ad revenue = monetizable pageviews / 1000 x assumed page RPM
```

Page RPM is revenue per thousand pageviews. Both inputs are assumptions:

- **Monetizable pageviews** come from GA4 once traffic exists, restricted to pages that would actually carry ads.
- **Assumed page RPM** is a guess until real ad data exists. Geography, page type, device category, traffic quality, seasonality, and the ad implementation itself all move actual RPM, often by several multiples in either direction.

This is a scenario model, not a forecast. It answers "what would revenue be if these assumptions held," not "what will revenue be."

The helper script prints the table:

```bash
npm run revenue:estimate -- --pageviews=100000 --rpm=1,3,5
```

or directly:

```bash
node scripts/revenue-estimate.mjs --pageviews=100000 --rpm=1,3,5
```

## What is already prepared for later analysis

No ad-specific instrumentation was added. The following existing pieces happen to be the right inputs:

- Clean, consent-gated GA4 with a typed event vocabulary and no user content, so traffic quality metrics are not polluted.
- Canonical page paths and static routes, so page-level analysis maps one to one onto URLs.
- `page_type` and `content_cluster` event parameters, so any future ad performance can be compared across page categories.
- The funnel and adoption explorations in [docs/growth-analytics.md](docs/growth-analytics.md), which establish whether usage justifies the experiment at all.

## Explicitly out of scope for launch

- Linking an ad platform (for example AdSense) to GA4 or to the site. That is a separate future release with its own privacy, consent, and layout review.
- Any ad placeholder, reserved slot, or layout shift accommodation in current pages.
- Any revenue claim in user-facing copy. There is no revenue data to claim.
