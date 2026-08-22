# SEO and product metrics

What the owner monitors, weekly and monthly. Sources: Google Search Console (acquisition before the click), GA4 (behavior after the click), and the repository's own quality tooling. Setup steps are in [docs/release-checklist.md](docs/release-checklist.md); exploration recipes are in [docs/growth-analytics.md](docs/growth-analytics.md).

## Weekly

### Search Console

- Impressions, clicks, CTR, and average position, total and for the top queries
- Indexed page count and any new coverage exclusions
- Query growth: new queries appearing for the first time
- Landing-page growth: which pages gained impressions week over week

### GA4

- Organic users and sessions
- Engaged organic sessions
- Teleprompter starts (event count for `started_teleprompter`) and starts per active user
- `clicked_open_teleprompter` conversion from content pages
- `finished_teleprompter` count and the complete-per-start ratio

### Product quality

- `private_precision_fell_back` rate relative to Private Precision Beta starts, broken down by `reason`
- `smart_pace_microphone_blocked` and `smart_pace_unavailable` relative to `enabled_smart_pace` indicate permission and capability friction

## Monthly

- Returning-user share in GA4 (New vs returning dimension)
- Voice mode mix across `started_teleprompter`: manual versus Smart Pace versus Private Precision Beta
- Recording and Picture in Picture adoption (`started_recording`, `opened_picture_in_picture`)
- Browser capability mix: which advanced features fire `unavailable` fallbacks on which device categories
- Core Web Vitals from Search Console field data, plus a Lighthouse pass against production after any performance-relevant change
- Query review for accidental intent overlap between pages, per the page ownership map in [docs/seo-research.md](docs/seo-research.md)

## Rules for reading these numbers

- No vanity targets. A raw impression or pageview count without evidence it produces starts, completions, or returns is not a goal. Targets attach to outcomes: activation, completion, retention.
- Retention is the primary health signal. "Did people come back?" outranks every acquisition number, because a teleprompter that is used once and abandoned is a failed product regardless of traffic.
- Every metric above maps to a decision. If a number cannot change an action (improve a page, fix a fallback reason, adjust a CTA), it is not on this list.
