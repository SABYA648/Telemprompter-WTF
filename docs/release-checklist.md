# Release checklist

Version 1.0.0 release gate. Part one is enforced by the repository; part two is the production owner's manual runbook.

The latest local production-equivalent evidence is recorded in
[`release-evidence-2026-08-23.md`](release-evidence-2026-08-23.md).

## Automated, completed by the repository

- Illustration pack integrity (hashes, dimensions, masters kept out of `public`) via `npm run assets:verify`.
- Typecheck, lint, format check, content lint, unit tests, and production build via `npm run check`.
- Playwright end-to-end suites: app, privacy and analytics (including script and voice canaries and GA payload assertions), SEO metadata, advanced features, embedded guide teleprompters, the working 404, responsive and accessibility, visual.
- Local inference verification (`npm run test:inference`) against the production-served build with privacy canaries.
- Docker image build, container end-to-end tests, and `/health` healthcheck.
- SEO crawl (`npm run test:seo-crawl`) across canonical URLs, the page and image sitemaps, the guides RSS feed, guide embed markers, hero and social image contracts, and the real 404 status.
- Lighthouse (`npm run test:lighthouse`) against the container-served origin on the homepage, guides hub, a representative guide, a tool page, and the 404 document; artifacts retained under `artifacts/lighthouse/`.
- Sitemap, robots.txt, and llms.txt validated as part of the build and content lint.
- CI runs quality, end-to-end, and Docker jobs on every change via GitHub Actions.

## Manual production-owner steps

- Set the real `PUBLIC_GA_MEASUREMENT_ID` at build time (absent means no GA code at all).
- Build and deploy the production Docker image.
- Configure the domain and TLS at the deployment edge; add HSTS only once HTTPS is permanent.
- Verify the HTTP-to-HTTPS and `www`-to-apex redirects.
- Verify live `/robots.txt`, `/sitemap-index.xml`, and `/llms.txt`.
- Verify the Google Search Console property and submit the sitemap.
- Verify Bing Webmaster Tools and submit the sitemap.
- Check GA4 Realtime with one real opted-in session.
- Run one real microphone session with Smart Pace.
- Run one real Private Precision Beta session (download, enable, present, observe fallback behavior).
- Run one real mobile session (manual presenter at minimum).
- Inspect PageSpeed Insights on production after deploy.
