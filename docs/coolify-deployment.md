# Coolify deployment

## Deployment type

Use this repository's `Dockerfile`.

Do not switch to Nixpacks. The multi-stage image already builds the static site and serves it from unprivileged Nginx.

## Internal port

`8080`

## Health check

Path: `/health`

Expected: HTTP `200` with body `ok`

## Domains

Primary: `https://www.teleprompter.wtf`

Apex: `https://teleprompter.wtf`

Configure Coolify/Traefik (and any DNS/CDN redirect rule in front of it) so the apex permanently redirects with **301 or 308** to the equivalent `www` URL, preserving the path and query string. Do not use 302 or 307: those are temporary redirects and needlessly leave duplicate URLs in the crawl queue.

`https://teleprompter.wtf/anything?x=1` → `https://www.teleprompter.wtf/anything?x=1`

The container also enforces the canonical host as a fallback, but the CDN/edge redirect must be permanent because it can respond before traffic reaches the container.

The container redirects `/route/` and `/route/index.html` to `/route` with 308. Do not add a CDN rule that bypasses those origin redirects.

## Environment variables

Optional build args / environment variables:

```text
PUBLIC_GA_MEASUREMENT_ID=
PUBLIC_UMAMI_WEBSITE_ID=c5952a2b-b192-46fe-8a3d-04ad673ffd6d
PUBLIC_UMAMI_SCRIPT_URL=https://analytics.sabya.pm/script.js
PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_BING_SITE_VERIFICATION=
```

No Clarity variable. No secrets are required for a working deploy.

## Storage

None. The container is stateless. No persistent volume is required.

## Recommended Coolify settings

- Build pack: Dockerfile
- Port: `8080`
- Healthcheck path: `/health`
- Read-only root filesystem: supported (compose example uses tmpfs for `/tmp`, `/var/cache/nginx`, and `/var/run`)
- HTTPS / TLS: terminate at Coolify
