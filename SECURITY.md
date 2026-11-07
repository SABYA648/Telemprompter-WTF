# Security policy

## Supported version

The current production branch is supported with security fixes.

## Reporting a vulnerability

Please use GitHub’s private vulnerability reporting for [SABYA648/Telemprompter-WTF](https://github.com/SABYA648/Telemprompter-WTF/security/advisories/new). Do not open a public issue for an unpatched vulnerability.

Include reproduction steps, affected browsers or deployments, impact, and a minimal proof of concept. Never include real private scripts, credentials, or analytics identifiers. You should receive an acknowledgement within seven days. Disclosure timing will be coordinated after a fix is available.

## Security model

The application is static and has no authentication, script-upload endpoint, recording endpoint, or database. Scripts and preferences stay in browser storage, and recordings are saved locally. Self-hosted Umami collects page views and bounded product events with a browser-local anonymous device ID; events exclude user content.

Operators remain responsible for TLS, timely container updates, access logging and retention at their hosting edge, and setting HSTS only on domains that are fully HTTPS-ready.
