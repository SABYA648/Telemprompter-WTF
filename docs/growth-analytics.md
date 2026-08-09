# Growth analytics

A practical GA4 Explorations guide for the site owner. Everything here uses the event taxonomy in [docs/analytics.md](docs/analytics.md) plus standard GA4 dimensions. No exploration contains user content, and none requires any setup beyond the custom dimensions listed in that document.

In GA4, open Explore and create a Blank or Funnel exploration as noted. Date range suggestion: last 28 days, compared with the previous period.

## 1. Organic landing pages

Question answered: which pages bring organic visitors, and do those visitors start and finish the teleprompter?

Technique: Free form.

- Rows: Landing page
- Columns: Session source/medium (filter to organic sources), Country, Device category
- Values: Sessions, Active users, Engaged sessions, Views, Event count for `teleprompter_start`, Event count for `teleprompter_complete`

Steps: create a Free form exploration, add the dimensions and metrics, add a filter for Session medium matches `organic`, and sort by Sessions descending. Read the ratio of `teleprompter_start` to Sessions per landing page as a rough activation rate.

## 2. Content-to-teleprompter funnel

Question answered: which content actually converts readers into presenters, and where do they drop off?

Technique: Funnel exploration.

Steps, in order:

1. Page view on a content page (Page path matches `/guides/` or `/tools/` or `/features`)
2. `use_teleprompter_cta`
3. `teleprompter_start`
4. `teleprompter_complete`

Breakdown dimension: `content_cluster` (custom dimension; requires the manual GA4 registration step). Add Landing page and Device category as additional breakdowns. A step with a large drop indicates either weak CTA placement (step 1 to 2) or a product problem after arrival (step 3 to 4).

## 3. Voice feature adoption

Question answered: do visitors choose Manual, Smart Pace, or Private Precision Beta, and does the chosen mode affect completion?

Technique: Free form.

- Rows: `voice_mode` (custom dimension)
- Values: Event count for `teleprompter_start`, Event count for `teleprompter_complete`, Event count for `teleprompter_exit`, Event count for `private_precision_fallback`

Read completion per start by mode. A high `private_precision_fallback` count relative to `teleprompter_start` with `voice_mode = private_precision` suggests device or environment friction worth investigating; the `reason` parameter on `private_precision_fallback` (alignment_low, runtime_error, unsupported, memory, user_switch) shows why.

## 4. Retention

Question answered: do people come back, and which content produces returning users?

Technique: Free form.

- Rows: New vs returning (built-in dimension)
- Values: Active users, Sessions, Engaged sessions, Event count for `teleprompter_start`

Add Landing page as a secondary dimension to see which pages produce returning users. Returning-user share and repeat teleprompter starts are the primary health signals.

Privacy tradeoff, stated once: the product deliberately sends no custom user ID. Retention here relies entirely on GA4 standard first-party behavior, which undercounts users who clear storage or switch devices. Treat these numbers as directional, not exact. That is the accepted cost of the no-accounts, no-identifiers design.

## 5. Future publisher economics

Question answered: if ads are ever tested, which pages would carry them and what would the traffic be worth?

There is no ad data today. No ad code exists, no ad slots exist, and no ad impression or revenue event is emitted by the application. Nothing in this exploration measures advertising.

Once an ad platform is linked later, GA4 surfaces its impressions and revenue as standard metrics that can be joined against Landing page, `page_type`, and `content_cluster` here. Until then, the scenario model in [docs/monetization-readiness.md](docs/monetization-readiness.md) is the only revenue view, and it is arithmetic on assumptions, not measurement.

## What Search Console answers that GA4 does not

GA4 sees only visitors who arrived. Search Console covers the acquisition side before the click:

- Query impressions, clicks, CTR, and average position
- Indexing status and coverage per page
- Core Web Vitals from real-user field data

The owner workflow that combines both is documented in [docs/release-checklist.md](docs/release-checklist.md) and [docs/seo-metrics.md](docs/seo-metrics.md).
