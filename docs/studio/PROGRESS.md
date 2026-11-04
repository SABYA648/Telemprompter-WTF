# Studio progress

## M0 Baseline, archive and logs - 2026-11-04

Shipped:

- Created the integration branch from `origin/main`, seeded the decision log, and pushed the pre-removal archive tag.
- Installed the lockfile dependencies and verified that the matching Chromium, headless shell and FFmpeg were already installed.

Files: `docs/studio/PROGRESS.md`, `docs/studio/DECISIONS.md`.

Baseline:

- `npm ci`: passed. npm reported 33 dependency vulnerabilities (18 moderate, 14 high, 1 critical).
- `npm run check`: passed; 17 unit test files and 123 of 123 tests passed.
- `npm run test:e2e`: 61 of 62 passed. Existing failure: `tests/app.spec.ts:50:1`, "appearance settings update font size and mirror mode". The Start teleprompter button remained disabled and the click timed out after 30 seconds.
- Gate rerun on the same unchanged baseline: 60 of 62 passed. `tests/privacy-analytics.spec.ts:73:1`, "no Microsoft Clarity integration remains", and `tests/tools-responsive-a11y.spec.ts:45:1`, "presenter and appearance dialog pass automated accessibility scans", timed out on the same disabled Start button. The original appearance test passed on this rerun.
- Docker CLI is present but the daemon is unavailable at the local socket; image size and Docker gates could not be measured.

Gates: check pass, unit 123/123, e2e 60/62 on gate rerun (baseline 61/62), media not applicable, budget not applicable, lighthouse not run.

Deviations: none.

Known issues:

- The three intermittent baseline browser failures above are allowed by the milestone contract when they recur unchanged.
- Docker daemon unavailable.

Owner manual checks: none for this milestone.

Next: M1.
