# Deployment and security headers

## Static hosting

Run `npm ci`, `npm run models:fetch`, and `npm run build`, then publish `dist/` at `https://teleprompter.wtf`. The site uses clean extensionless canonical URLs. Configure the host to serve generated `index.html` files for those routes and return `404.html` with status 404 for missing routes.

`public/_headers` is copied into the build for compatible hosts. Equivalent Nginx behavior is included in `nginx.conf`.

## Complete Docker image

```bash
docker build -t teleprompter-wtf .
docker run --read-only \
  --tmpfs /tmp:uid=101,gid=101 \
  --tmpfs /var/cache/nginx:uid=101,gid=101 \
  --tmpfs /var/run:uid=101,gid=101 \
  -p 8080:8080 teleprompter-wtf
curl --fail http://127.0.0.1:8080/health.txt
```

Or use `docker compose up --build -d`.

The multi-stage build uses clean npm installation, fetches and checks all pinned model files, runs the static build, and copies only generated output into an unprivileged Nginx image. There is no Node runtime, database, or inference server in the final stage.

The full model adds 45,233,651 bytes of weights and tokenizer/configuration files. ONNX Runtime WASM adds 21,596,019 bytes, plus a 44,484-byte loader. These assets are present in the image but do not download during a normal page visit.

## Optional build variables

```text
PUBLIC_GA_MEASUREMENT_ID=
PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_BING_SITE_VERIFICATION=
```

All are public identifiers compiled into the static output. None is a secret. An empty or invalid GA measurement ID fails closed: the build then contains no analytics code at all.

## Canonical redirects

Terminate TLS at the CDN, load balancer, or reverse proxy. Redirect HTTP to HTTPS and `www.teleprompter.wtf` to `teleprompter.wtf` at that edge. Application canonicals and sitemap URLs always use `https://teleprompter.wtf`.

Add HSTS only after the production domain and intended subdomains are permanently HTTPS capable:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Do not enable HSTS on local HTTP deployments. Consider browser preload only after understanding its operational commitment.

## Caching and ranges

- Fingerprinted `/_astro/` assets use one-year immutable caching.
- Versioned `/models/` files use one-year immutable caching and advertise byte ranges.
- HTML uses immediate revalidation.
- robots, sitemap, and llms files use a short one-hour cache.
- Text assets are compressed. Model binaries are excluded from gzip.

## Permissions Policy

The policy allows same-origin microphone, camera, display capture, Picture in Picture, and fullscreen because shipped features use them. It denies geolocation, payment, USB, and MIDI. Feature detection and a user action are still required before any permission request.

## Content Security Policy

The CSP limits application, worker, model, media Blob, and GA4 destinations. GA4 domains are permitted by policy but the GA script is not injected before consent. The site does not enable cross-origin isolation, which avoids unnecessary conflicts with analytics and compact-window behavior.

Astro currently emits inline bootstrap code and styles, so `unsafe-inline` remains limited to script and style directives. A deployment that adds hashes or nonces can tighten those directives further.

## Operator checks

After deployment, verify health, homepage, one guide, one tool, privacy, robots, sitemap, llms, model byte ranges, cache headers, CSP, and 404 status. Then run Playwright and Lighthouse against the container-served origin. External Search Console, Bing, and GA4 dashboard steps are listed in `docs/seo-launch-checklist.md`, and the full owner runbook is in `docs/release-checklist.md`.
