# Contributing

Thanks for helping make teleprompter.wtf dependable.

## Before opening a change

1. Search existing issues and keep the proposal focused.
2. Never post a private script, recording, analytics identifier, or other sensitive material.
3. Preserve the core promises: no login, no ads, no backend requirement, and no script content leaving the browser.

## Development workflow

```bash
npm ci
npm run dev
```

Create a focused branch, make the smallest coherent change, and add meaningful tests. Before requesting review, run:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

Changes to presenter behavior should be checked with a keyboard and touch-sized viewport. Test at 320 px wide and at least one desktop size. Changes to script handling must keep content out of URLs, logs, analytics, and network requests.

## Code style

- Keep domain logic independent from Preact when practical.
- Use strict TypeScript and semantic HTML.
- Prefer local CSS and platform APIs over large dependencies.
- Add analytics only through `src/domain/analytics.ts`, using low-cardinality properties.
- Do not render user script content through raw HTML.
- Do not add future-feature controls until the functionality exists.

## Pull requests

Explain the user problem, the implementation, tests run, and any privacy or accessibility effect. Include before/after screenshots for visual changes. By contributing, you agree that your work is licensed under MIT.
