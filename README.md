# teleprompter.wtf

A free browser teleprompter and local video recorder for Reels, Shorts, YouTube and presentations. [Open Studio](https://www.teleprompter.wtf/studio) or use the [classic presenter](https://www.teleprompter.wtf/#classic-editor).

Studio records the camera with a lens-side prompter, keeps scripts and takes on the device, and saves video through the share sheet or download. The classic presenter offers manual scrolling, mirroring, keyboard controls and compact views. No account, upload, watermark or server is required for either mode.

## Development

Node.js 22.12 or later and npm are required.

```bash
npm ci
npm run dev
```

Astro builds static pages and Preact islands. Studio UI is in `src/studio`, local data and recording logic in `src/domain/studio`, and classic controls in `src/components`. There are no AI features or remote inference. Product analytics use self-hosted Umami only, with typed events that exclude user content.

## Checks

```bash
npm run check
npm run test:e2e
npx playwright test --project=media
npm run budget
```

For production SEO and Lighthouse checks, start the read-only Docker container below, then run `npm run test:seo-crawl` and `npm run test:lighthouse`.

## Docker

```bash
docker build -t teleprompter-wtf .
docker run --read-only --tmpfs /tmp:uid=101,gid=101 --tmpfs /var/cache/nginx:uid=101,gid=101 --tmpfs /var/run:uid=101,gid=101 -p 8080:8080 teleprompter-wtf
curl --fail http://127.0.0.1:8080/health
```

Build-time public settings are in `.env.example`. See [analytics](docs/analytics.md), [deployment](docs/deployment.md), [privacy](https://www.teleprompter.wtf/privacy) and [contributing](CONTRIBUTING.md).
