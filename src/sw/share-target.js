const IDEA_TEXT_LIMIT = 10000;
const TITLE_LIMIT = 200;
const URL_LIMIT = 2048;

/** Build a bounded idea from the fields supplied by the system share sheet. */
export function sharedIdea(fields, id, now) {
  const clean = (value, limit) => (typeof value === 'string' ? value.trim().slice(0, limit) : '');
  const title = clean(fields.title, TITLE_LIMIT);
  // A cut-off URL points somewhere else, so an overlong one is dropped rather than truncated.
  const candidate = clean(fields.url, Infinity);
  let url = '';
  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.href.length <= URL_LIMIT
    )
      url = parsed.href;
  } catch {
    /* A shared string need not be a URL. */
  }
  // The title, URL and separators share the idea's limit so a stored idea always fits a transfer.
  const body = clean(fields.text, IDEA_TEXT_LIMIT - title.length - url.length - 2);
  const text = [title, body, url].filter(Boolean).join('\n');
  return text ? { id, text, createdAt: now } : null;
}

/** Where the share sheet lands: `stored`, `empty` (nothing usable was shared) or `failed`. */
export function shareRedirect(outcome) {
  if (outcome === 'stored') return '/studio#/inbox?shared=1';
  if (outcome === 'failed') return '/studio#/inbox?shared=error';
  return '/studio#/inbox';
}
