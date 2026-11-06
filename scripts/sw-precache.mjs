import { createHash } from 'node:crypto';

export const PRECACHE_PAGES = ['studio/index.html', 'offline/index.html'];
export const PRECACHE_BASE = [
  '/studio',
  '/offline',
  '/site.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];
/**
 * On-demand chunks too large to download for every visitor. They load only when used (MP4
 * conversion and trim) and the runtime cache-first `/_astro/*` rule keeps them after that.
 */
export const PRECACHE_SKIP = /^\/_astro\/mediabunny\.[\w-]+\.js$/;
const ORIGIN = 'https://example.invalid';
const FONT_URL = /url\(\s*["']?([^"')]+\.(?:woff2?|ttf))(?:[?#][^"')]*)?["']?\s*\)/gi;
const attribute = (tag, name) =>
  tag
    .match(new RegExp(`\\b${name}=(?:"([^"]+)"|'([^']+)'|([^\\s"'>]+))`, 'i'))
    ?.slice(1)
    .find(Boolean);
const sameOrigin = (url) => url.startsWith('/') && !url.startsWith('//');
const resolve = (url, from) => new URL(url, `${ORIGIN}${from}`).pathname;

/** Same-origin assets a built page loads: scripts, preloads, stylesheets, islands and fonts. */
export function htmlRefs(html) {
  const refs = new Set();
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    const rel = attribute(tag, 'rel')?.toLowerCase();
    const isFontPreload = rel === 'preload' && attribute(tag, 'as')?.toLowerCase() === 'font';
    const url = /^<script/i.test(tag)
      ? attribute(tag, 'src')
      : rel === 'modulepreload' || rel === 'stylesheet' || isFontPreload
        ? attribute(tag, 'href')
        : undefined;
    if (url && sameOrigin(url)) refs.add(url);
  }
  // Astro's client:only island stores its module entrypoints in element attributes.
  for (const match of html.matchAll(/(?:component-url|renderer-url)=["'](\/_astro\/[^"']+)["']/g))
    if (match[1]) refs.add(match[1]);
  for (const url of cssRefs(html, '/')) refs.add(url);
  return [...refs];
}

/** Module and stylesheet paths a built chunk can load, including Vite's preload dependency map. */
export function moduleRefs(js, from) {
  const refs = new Set();
  for (const match of js.matchAll(/["'`]((?:\.\.?\/|\/?_astro\/)[^"'`\s]+\.(?:js|css))["'`]/g)) {
    const url = match[1] ?? '';
    refs.add(url.startsWith('_astro/') ? `/${url}` : resolve(url, from));
  }
  return [...refs];
}

export function cssRefs(css, from) {
  const refs = new Set();
  for (const match of css.matchAll(FONT_URL)) {
    const url = match[1] ?? '';
    if (!/^(?:[a-z]+:|\/\/)/i.test(url)) refs.add(resolve(url, from));
  }
  return [...refs];
}

/**
 * Walk the built pages and everything they reach. `read` resolves a dist-relative path to its text
 * and rejects when it is missing. A page's direct references must exist; references found inside
 * chunks are only followed when they do, because minified code can hold look-alike strings.
 */
export async function collectPrecache(read) {
  const urls = new Set(PRECACHE_BASE);
  const pending = [];
  const add = (url) => {
    if (urls.has(url)) return;
    urls.add(url);
    pending.push(url);
  };
  for (const page of PRECACHE_PAGES) {
    for (const url of htmlRefs(await read(page))) {
      if (/\.(?:js|css)$/.test(url)) await read(url.slice(1));
      add(url);
    }
  }
  while (pending.length) {
    const url = pending.pop() ?? '';
    if (!/\.(?:js|css)$/.test(url)) continue;
    const source = await read(url.slice(1));
    const children = url.endsWith('.css') ? cssRefs(source, url) : moduleRefs(source, url);
    for (const child of children) {
      if (urls.has(child) || PRECACHE_SKIP.test(child)) continue;
      try {
        await read(child.slice(1));
      } catch (error) {
        if (url.endsWith('.css')) throw error;
        continue;
      }
      add(child);
    }
  }
  return [...urls].sort();
}

export function precacheVersion(precache) {
  return createHash('sha256').update(JSON.stringify(precache)).digest('hex').slice(0, 12);
}

export function renderServiceWorker({ template, shareHandler, precache, version }) {
  for (const marker of ["'__PRECACHE__'", '__VERSION__', '// __SHARE_HANDLER__'])
    if (!template.includes(marker)) throw new Error(`Service worker template lacks ${marker}`);
  return template
    .replace("'__PRECACHE__'", () => JSON.stringify(precache))
    .replace('__VERSION__', () => version)
    .replace('// __SHARE_HANDLER__', () => shareHandler.replace(/^export /gm, ''));
}
