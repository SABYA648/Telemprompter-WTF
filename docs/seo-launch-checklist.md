# SEO launch checklist

SEO-specific launch checks. The full production release gate, including automated checks and the remaining owner steps (GA build variable, real-device sessions, PageSpeed), lives in [docs/release-checklist.md](release-checklist.md).

## Deployment

- Confirm `https://www.teleprompter.wtf` is the public origin.
- Confirm HTTP redirects to HTTPS at the deployment edge.
- Route `teleprompter.wtf` to `www.teleprompter.wtf` with a permanent redirect, preserving path and query.
- Confirm no staging domain is indexable.
- Inspect a rendered canonical on the homepage, a guide, a tool, and the voice-tracking page.
- Verify the production 404 returns status 404 with the custom page body.

## Discovery

- Open `/robots.txt` and confirm the sitemap URL.
- Open `/sitemap-index.xml` and inspect its canonical URLs.
- Open `/llms.txt` and verify curated links.
- Configure `PUBLIC_GOOGLE_SITE_VERIFICATION` only with a real Search Console token.
- Configure `PUBLIC_BING_SITE_VERIFICATION` only with a real Bing Webmaster Tools token.
- Verify Google Search Console and submit the sitemap.
- Verify Bing Webmaster Tools and submit the sitemap.

## Rendering and schema

- Test representative URLs with mobile rendering.
- Validate homepage and guide JSON-LD with Rich Results Test or Schema Markup Validator.
- Inspect title, description, H1, Open Graph tags, and body text in rendered HTML.
- Confirm internal links resolve without redirects or 404 responses.

## Privacy and measurement

- Verify GA4 is absent before the Usage analytics opt-in.
- Verify GA4 loads only after opt-in and that Reject loads nothing.
- Test consent withdrawal and confirm relevant first-party cookies are removed where browser policy permits.

## Performance and monitoring

- Run PageSpeed Insights against the homepage, a guide, a tool, privacy, and private voice tracking.
- Confirm no model or inference runtime request occurs on the default homepage.
- Monitor Core Web Vitals from real-user data after sufficient traffic exists.
- Monitor indexing status and excluded canonical URLs.
- Review search queries monthly for accidental intent overlap.
- Update guide dates only after material content changes.
