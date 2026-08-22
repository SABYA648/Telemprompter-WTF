# Security policy

## Supported version

The current production branch is supported with security fixes.

## Reporting a vulnerability

Please use GitHub’s private vulnerability reporting for [SABYA648/Telemprompter-WTF](https://github.com/SABYA648/Telemprompter-WTF/security/advisories/new). Do not open a public issue for an unpatched vulnerability.

Include reproduction steps, affected browsers or deployments, impact, and a minimal proof of concept. Never include real private scripts, credentials, or analytics identifiers. You should receive an acknowledgement within seven days. Disclosure timing will be coordinated after a fix is available.

## Security model

The application is static and has no authentication, script-upload endpoint, recording endpoint, transcription endpoint, or database. Scripts render as text and can persist only in origin-scoped browser storage. Voice audio and temporary recognition fragments are ephemeral. Optional model weights are same-origin, pinned, checksummed, and cached only after explicit download. Optional product analytics are consent gated. Self-hosted Umami is the default tracker. Optional GA4 uses a fixed event vocabulary that excludes user content.

Operators remain responsible for TLS, timely container updates, access logging and retention at their hosting edge, and setting HSTS only on domains that are fully HTTPS-ready.
