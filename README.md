# teleprompter.wtf

A free browser teleprompter for scripts, presentations and recordings. Paste your text, set the scrolling speed and present without an account.

[Open the teleprompter](https://www.teleprompter.wtf) | [Source code](https://github.com/SABYA648/Telemprompter-WTF)

The classic presenter includes manual scrolling, keyboard controls, mirroring, fullscreen, compact views, local script autosave and plain-text import. Where supported, it can record a screen or camera locally. The browser chooses a supported recording format; recordings are saved by the user and are not uploaded by the app.

## Development

Node.js 22.12 or later and npm are required.

```bash
npm ci
npm run dev
```

Astro builds static pages and Preact islands. Domain logic is in `src/domain`, interactive components in `src/components`, and page content in `src/pages` and `src/content`.

## Checks

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs asset verification, type checking, linting, content checks, formatting, unit tests and a production build. The browser tests cover the editor, presenter, media controls, responsive layout, accessibility and metadata.

## Configuration

Build-time public settings are listed in `.env.example`. Umami records page views and typed product events using an anonymous device identifier. See [analytics documentation](docs/analytics.md) and the [privacy policy](https://www.teleprompter.wtf/privacy).

## Docker

The multi-stage Dockerfile builds the static site and serves it with unprivileged Nginx.

```bash
docker build -t teleprompter-wtf .
docker run --read-only --tmpfs /tmp:uid=101,gid=101 --tmpfs /var/cache/nginx:uid=101,gid=101 --tmpfs /var/run:uid=101,gid=101 -p 8080:8080 teleprompter-wtf
curl --fail http://127.0.0.1:8080/health
```

See [deployment documentation](docs/deployment.md) and [contribution guidelines](CONTRIBUTING.md).
