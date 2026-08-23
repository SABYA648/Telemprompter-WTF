# Local release evidence: 2026-08-23

This record verifies the Kimi design handoff using the production Dockerfile and the unprivileged
Nginx runtime. It is local release evidence only; no Coolify or production deployment was performed.

## Source and scope

- Teleprompter base revision reviewed: `d15790e3346dc3bdfd871b9c355ed5312bb303a0` (`main`, initially equal to `origin/main`).
- Read-only CompressImage.fun reference: `6a6d8b4b9c31defcfd9309bbf084dbd7f2915bb7` (`main`, equal to `origin/main`).
- The final review changes make embed hydration state declarative, give the intentional 67 MB model-download test a Docker-safe timeout, remove a Lighthouse type-check hint, and enforce at least five related stories for every public calculator in the SEO crawl.
- Clean production build used `PUBLIC_GA_MEASUREMENT_ID=G-TEST123` so consent-gated GA behavior could be exercised. The normal Umami build arguments remained unchanged.

## Production-equivalent Docker commands

```sh
docker build --pull --no-cache --build-arg PUBLIC_GA_MEASUREMENT_ID=G-TEST123 -t teleprompter-wtf:review-final .

docker run -d --name teleprompter-review-final \
  --read-only \
  --tmpfs /tmp:uid=101,gid=101 \
  --tmpfs /var/cache/nginx:uid=101,gid=101 \
  --tmpfs /var/run:uid=101,gid=101 \
  -p 127.0.0.1:18081:8080 \
  teleprompter-wtf:review-final

# Playwright image prepared with a clean npm ci, then attached to the runtime network namespace.
docker run -d --name teleprompter-review-qa-final \
  --network container:teleprompter-review-final \
  teleprompter-review-qa:installed-d15790e sleep infinity

docker exec -e PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
  teleprompter-review-qa-final sh -lc 'cd /work && npx playwright test --reporter=line --retries=0'

docker exec -e SEO_CRAWL_BASE_URL=http://127.0.0.1:8080 \
  teleprompter-review-qa-final sh -lc 'cd /work && npm run test:seo-crawl'

docker exec -e PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
  teleprompter-review-qa-final sh -lc 'cd /work && npm run test:inference'

docker exec \
  -e CHROME_PATH=/ms-playwright/chromium-1234/chrome-linux/chrome \
  -e LIGHTHOUSE_BASE_URL=http://127.0.0.1:8080 \
  teleprompter-review-qa-final sh -lc 'cd /work && npm run test:lighthouse'
```

The runtime was healthy with a read-only root filesystem and three writable tmpfs mounts. The clean
review image was `sha256:67e923390ae482f058f0445863ec11d9983097aac714813d9ce0fe24b3afd42b`
and 57,003,418 bytes. A current-tree rebuild after the evidence and crawler-only changes produced
`sha256:71ca8612eb2e7ce93ff51f868b187dd78f9dc6c31c18556e85ee9d418890ea25`;
its runtime config and compiled application layers were identical to the clean review image. That
candidate was healthy under the same read-only/tmpfs contract, and its affected SEO crawl passed.

## Results

- Clean dependency install: 700 packages installed, 701 audited, 0 vulnerabilities.
- Illustration integrity: 9 of 9 assets passed dimensions, byte count, and SHA-256 validation.
- Static quality: 0 type errors, 0 warnings, 4 browser-API deprecation hints; ESLint, Prettier, and content lint passed.
- Unit tests: 13 files, 64 tests passed.
- Production build: 32 generated pages; 31 canonical indexable HTML pages.
- Production-container E2E: 57 passed, 1 intentionally skipped. The skip is the non-analytics-build duplicate consent scenario; the Docker image includes the test analytics IDs and the equivalent configured-build consent tests passed.
- SEO crawl: 31 sitemap URLs; 19 image-sitemap pages and 19 image entries; 21 guide pages each with one working teleprompter; 2 public calculator tools with at least 5 related stories each; genuine 404 contract passed.
- Local inference: initialization 4,345 ms; fixture inference 5,598 ms; confidence 0.794; 32 same-origin requests; 0 external requests; 0 uploads; neither privacy canary appeared on the network.
- Bounded load: 200 of 200 homepage requests returned HTTP 200 at concurrency 16.
- Browser QA: desktop 1440 px and mobile 390 px had no horizontal overflow, no console warnings or errors, correct hero/guide/404 artwork, working homepage and guide presenters, a hydrated 404 tool, and 404 `noindex`.

## Lighthouse mobile results

| Route                                  | Performance | Accessibility | Best practices | SEO |   LCP |    TBT |   CLS |
| -------------------------------------- | ----------: | ------------: | -------------: | --: | ----: | -----: | ----: |
| `/`                                    |          94 |           100 |            100 | 100 | 1.7 s | 280 ms |     0 |
| `/guides`                              |         100 |           100 |            100 | 100 | 1.3 s |  70 ms |     0 |
| `/guides/teleprompter-for-zoom`        |          99 |           100 |            100 | 100 | 1.3 s | 110 ms |     0 |
| `/tools/teleprompter-speed-calculator` |         100 |           100 |            100 | 100 | 1.4 s |  40 ms |     0 |
| `/404.html`                            |         100 |           100 |            100 |  69 | 1.7 s |  10 ms | 0.004 |

The 404 SEO score is intentionally lower because that page is correctly `noindex`.

## Payload, privacy, and security

- Largest application payloads: precision worker 852 KiB (loaded only for Private Precision), main teleprompter island 60 KiB, shared CSS 40 KiB, Preact runtime 12 KiB.
- The nine WebP illustrations are 34,440 to 52,768 bytes each. The hero is 47,986 bytes and the 1200 by 630 social image is 51,592 bytes.
- Normal visits do not fetch the 66,874,154-byte optional model/runtime package. Its download is explicit, same-origin, cacheable, removable, and covered by the browser and real-inference tests.
- The Nginx runtime returned CSP, `nosniff`, strict referrer policy, COOP, and an allow-listed permissions policy. A model range request returned HTTP 206 with the correct 100-byte range and immutable one-year caching.
- Analytics remained absent before consent and after rejection. Script and voice canaries never appeared in outgoing requests. The runtime exposes no upload endpoint.

## Remaining deployment-only checks

Real microphone acoustics, camera/screen capture permissions, physical teleprompter glass, iOS/Android browser behavior, edge redirects, TLS/HSTS, Search Console, Bing Webmaster Tools, GA Realtime, and public PageSpeed Insights require owner-controlled devices or the deployed HTTPS origin. They were not represented as local passes.

## Verdict

**READY FOR COOLIFY DEPLOYMENT**, subject to the final source sync, current-revision Docker rebuild,
green post-push CI, and the deployment-only checks above. This evidence does not authorize deployment.
