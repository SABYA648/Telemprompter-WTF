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

Configure Coolify/Traefik so the apex permanently redirects (301 or 308) to the equivalent `www` URL, preserving path and query string:

`https://teleprompter.wtf/anything?x=1` → `https://www.teleprompter.wtf/anything?x=1`

Do not add an application-level apex redirect. Canonical tags, sitemap, robots, schema, and Open Graph already emit `www`.

## Environment variables

Optional build args / environment variables:

```text
PUBLIC_GA_MEASUREMENT_ID=
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
