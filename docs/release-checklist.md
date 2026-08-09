# Release checklist

Version 1.0.0 release gate. Part one is enforced by the repository; part two is the production owner's manual runbook.

## Automated, completed by the repository

- Typecheck, lint, format check, content lint, unit tests, and production build via `npm run check`.
- Playwright end-to-end suites: app, privacy and analytics (including script and voice canaries and GA payload assertions), SEO metadata, advanced features, responsive and accessibility, visual.
- Local inference verification (`npm run test:inference`) against the production Docker build with privacy canaries.
- Docker image build, container end-to-end tests, and `/health` healthcheck.
- Lighthouse runs against the container-served origin; artifacts retained under `artifacts/lighthouse/`.
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
