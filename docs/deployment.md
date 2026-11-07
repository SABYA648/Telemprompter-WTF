# Deployment and security headers

## Static hosting

Run `npm ci` and `npm run build`, then publish `dist/` at `https://www.teleprompter.wtf`. The site uses clean extensionless canonical URLs. Configure the host to serve generated `index.html` files for those routes and return `404.html` with status 404 for missing routes.

`public/_headers` is copied into the build for compatible hosts. Equivalent Nginx behavior is included in `nginx.conf`.

## Complete Docker image

```bash
docker build -t teleprompter-wtf .
docker run --read-only \
  --tmpfs /tmp:uid=101,gid=101 \
  --tmpfs /var/cache/nginx:uid=101,gid=101 \
  --tmpfs /var/run:uid=101,gid=101 \
  -p 8080:8080 teleprompter-wtf
curl --fail http://127.0.0.1:8080/health
```

Or use `docker compose up --build -d`.

The multi-stage build uses clean npm installation, runs the static build, and copies only generated output into an unprivileged Nginx image. There is no Node runtime, database, or inference server in the final stage.

## Optional build variables

```text
PUBLIC_UMAMI_WEBSITE_ID=c5952a2b-b192-46fe-8a3d-04ad673ffd6d
PUBLIC_UMAMI_SCRIPT_URL=https://analytics.sabya.pm/script.js
PUBLIC_UMAMI_DOMAINS=www.teleprompter.wtf
PUBLIC_UMAMI_PROXY=false
PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_BING_SITE_VERIFICATION=
```

All are public identifiers compiled into the static output. None is a secret. The domain setting limits where Umami sends data. The optional proxy remains disabled until the owner configures it.

## Canonical redirects

Terminate TLS at the CDN, load balancer, Coolify, or reverse proxy. Redirect HTTP to HTTPS and permanently redirect `teleprompter.wtf` to the equivalent `www.teleprompter.wtf` URL at that edge, preserving path and query string. Use 301 or 308, not temporary 302 or 307 responses. Application canonicals and sitemap URLs always use `https://www.teleprompter.wtf`.

The bundled Nginx redirects the trailing-slash and `/index.html` variants of static pages to their clean extensionless URL with 308. Keep these redirects enabled: a canonical tag is a hint, while a redirect eliminates duplicate crawl candidates.

See [coolify-deployment.md](coolify-deployment.md) for the Coolify-specific checklist.
Add HSTS only after the production domain and intended subdomains are permanently HTTPS capable:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Do not enable HSTS on local HTTP deployments. Consider browser preload only after understanding its operational commitment.

## Caching and ranges

- Fingerprinted `/_astro/` assets use one-year immutable caching.
- HTML uses immediate revalidation.
- robots, sitemap, and llms files use a short one-hour cache.
- Text assets are compressed.

## Permissions Policy

The policy allows same-origin microphone, camera, display capture, Picture in Picture, and fullscreen because shipped features use them. It denies geolocation, payment, USB, and MIDI. Feature detection and a user action are still required before any permission request.

## Content Security Policy

The CSP limits application, worker, media Blob and Umami destinations. Umami loads on each page. The site does not enable cross-origin isolation, which avoids unnecessary conflicts with analytics and compact-window behavior.

Astro currently emits inline bootstrap code and styles, so `unsafe-inline` remains limited to script and style directives. A deployment that adds hashes or nonces can tighten those directives further.

## Operator checks

After deployment, verify health, homepage, one guide, one tool, privacy, robots, sitemap, llms, cache headers, CSP, and 404 status. Then run Playwright and Lighthouse against the container-served origin. External Search Console, Bing, and Umami dashboard steps are listed in `docs/seo-launch-checklist.md`, and the full owner runbook is in `docs/release-checklist.md`.
