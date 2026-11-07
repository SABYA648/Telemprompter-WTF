# Contributing

Please keep changes focused and include meaningful tests for behavior. Never post private scripts, recordings or analytics identifiers in issues or pull requests.

## Core boundaries

- No AI, speech recognition, remote inference, voice auto-follow or AI product wording.
- No new runtime servers, accounts, uploads or cloud storage. Scripts and recordings stay local.
- Umami is the only analytics provider. Events must use the typed allowlist and never contain user text, titles, file names or recording content.
- Keep Astro static output, Preact islands, local CSS and the classic presenter working.
- Render script content as text, never raw HTML.

## Development

```bash
npm ci
npm run dev
npm run check
npm run test:e2e
npx playwright test --project=media
npm run budget
```

Test camera changes on real devices when possible. Check phone and desktop layouts and keyboard access. The owner device checklist is in [docs/studio/DEVICE-QA.md](docs/studio/DEVICE-QA.md).
