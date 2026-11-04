# Studio progress

## M0 Baseline, archive and logs - 2026-11-04

Shipped:

- Created the integration branch from `origin/main`, seeded the decision log, and pushed the pre-removal archive tag.
- Installed the lockfile dependencies and verified that the matching Chromium, headless shell and FFmpeg were already installed.

Files: `docs/studio/PROGRESS.md`, `docs/studio/DECISIONS.md`.

Baseline:

- `npm ci`: passed. npm reported 33 dependency vulnerabilities (18 moderate, 14 high, 1 critical).
- `npm run check`: passed; 17 unit test files and 123 of 123 tests passed.
- Initial baseline browser runs passed 61/62 and 60/62; the hydration race was resolved and revalidated in M1.
- Docker CLI is present but the daemon is unavailable at the local socket; image size and Docker gates could not be measured.

Gates: check pass, unit 123/123, e2e 60/62 on gate rerun (baseline 61/62), media not applicable, budget not applicable, lighthouse not run.

Deviations: none.

Known issues:

- Docker daemon unavailable.

Owner manual checks: none for this milestone.

Next: M1.

## M1 Remove voice follow; manual scrolling only - 2026-11-04

Shipped:

- Removed the voice-follow implementation, model assets and build steps. Retained the manual scroll engine, pacing cues and highlights.
- Updated public copy and category guides, and configured the old route to redirect to the voice-activated category guide.
- Made the editor inert until restored state is applied and added explicit hydration waits before test input. The initial failed trace and mount effect showed that early input could be overwritten during hydration.
- Added a browser test verifying the presenter scrolls for two seconds with zero camera or microphone requests. The acceptance text search returned no matches.

Files: presenter and editor components, domain modules, site copy, Nginx, Dockerfile, tests and documentation.

Gates: check pass, unit 68/68, e2e 57/57 in each of three consecutive runs, media not applicable, budget not applicable, lighthouse not run. Docker skipped: daemon unavailable. Image sizes and HTTP checks were not measured.

Deviations: none.

Known issues:

- Docker redirect and image build remain unverified until a daemon is available.

Owner manual checks:

- With Docker available, build and run the image, verify `/` returns 200 and `/private-voice-tracking` returns 301, and compare image sizes if the archived image can be built.

Next: M2.
