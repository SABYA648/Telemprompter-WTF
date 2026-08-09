# Future opportunities

A parking lot of ideas deliberately not built for launch. Nothing here is committed, scheduled, or promised. Each entry lists why it is out of scope for version 1.0.0.

- **Cloud sync:** requires accounts and server-side script storage, both of which contradict the local-first privacy architecture.
- **Accounts:** the product needs no identity to function; accounts add friction and a data liability with no launch-time benefit.
- **Script templates:** editorial inventory that dilutes the paste-and-present flow; revisit only if retention data shows script-writing is the bottleneck.
- **AI writing assist:** a remote inference dependency for content generation; conflicts with the local-first stance and adds cost per user before usage is validated.
- **Notifications and reminders:** require either a backend or persistent permission grants; a no-account utility has no defensible reason to interrupt users.
- **Advertising:** deferred until organic usage validates the product; see [docs/monetization-readiness.md](docs/monetization-readiness.md).
- **Service-worker PWA installability:** the site ships a valid web manifest but no service worker. A caching worker adds stale-deployment risk for no user-facing gain at launch, so full install prompting is deliberately skipped. Revisit only if home-screen usage data justifies it.

Revisit this file after retention data exists. The default answer remains no until a metric shows a real user problem.
