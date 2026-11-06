import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  collectPrecache,
  cssRefs,
  htmlRefs,
  moduleRefs,
  precacheVersion,
  renderServiceWorker,
} from '../../scripts/sw-precache.mjs';

describe('built asset parsing', () => {
  it('reads scripts, module preloads, stylesheets, font preloads and islands from a page', () => {
    const refs = htmlRefs(`
      <script type="module" src="/_astro/entry.js"></script>
      <script defer src="https://analytics.sabya.pm/script.js"></script>
      <script src="//cdn.example/a.js"></script>
      <link rel="modulepreload" href="/_astro/chunk.js">
      <link rel=stylesheet href=/_astro/style.css>
      <link rel="preload" as="font" href="/fonts/a.woff2">
      <link rel="preload" as="image" href="/og.png">
      <link rel="canonical" href="/studio">
      <link rel="icon" href="/favicon.svg">
      <astro-island component-url="/_astro/App.js" renderer-url="/_astro/client.js"></astro-island>
      <style>@font-face{src:url(/fonts/inline.woff2) format("woff2")}</style>
    `);
    expect(refs.sort()).toEqual(
      [
        '/_astro/App.js',
        '/_astro/chunk.js',
        '/_astro/client.js',
        '/_astro/entry.js',
        '/_astro/style.css',
        '/fonts/a.woff2',
        '/fonts/inline.woff2',
      ].sort(),
    );
  });
  it('follows relative imports and the Vite preload map', () => {
    expect(
      moduleRefs(
        'import"./a.js";import("../b.js");const d=["_astro/c.js","_astro/d.css"];"/_astro/e.js";"nope.js"',
        '/_astro/entry.js',
      ).sort(),
    ).toEqual(['/_astro/a.js', '/_astro/c.js', '/_astro/d.css', '/_astro/e.js', '/b.js'].sort());
  });
  it('finds fonts in stylesheets and skips remote and non-font URLs', () => {
    expect(
      cssRefs(
        `@font-face{src:url('/fonts/a.woff2') format('woff2'),url(b.ttf?v=1),url("https://x.example/c.woff")}
         .x{background:url(/img.png)}`,
        '/_astro/style.css',
      ).sort(),
    ).toEqual(['/_astro/b.ttf', '/fonts/a.woff2']);
  });
});

describe('precache collection', () => {
  const files: Record<string, string> = {
    'studio/index.html':
      '<link rel="stylesheet" href="/_astro/s.css"><astro-island component-url="/_astro/App.js"></astro-island>',
    'offline/index.html': '<link rel="stylesheet" href="/_astro/s.css">',
    '_astro/s.css': '@font-face{src:url(/fonts/a.woff2)}',
    '_astro/App.js': 'import("./lazy.js");const fake="./looks-like-a-module.js"',
    '_astro/lazy.js': 'const d=["_astro/late.css"]',
    '_astro/late.css': '',
    'fonts/a.woff2': '',
  };
  const read = async (path: string) => {
    const file = files[path];
    if (file === undefined) throw new Error(`missing ${path}`);
    return file;
  };
  it('adds the shell, the manifest, the icons and the whole reachable graph, sorted', async () => {
    const precache = await collectPrecache(read);
    expect(precache).toEqual([...precache].sort());
    for (const url of [
      '/studio',
      '/offline',
      '/site.webmanifest',
      '/favicon.svg',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/maskable-512.png',
      '/icons/apple-touch-icon.png',
      '/_astro/App.js',
      '/_astro/lazy.js',
      '/_astro/late.css',
      '/_astro/s.css',
      '/fonts/a.woff2',
    ])
      expect(precache).toContain(url);
    expect(precache).not.toContain('/_astro/looks-like-a-module.js');
  });
  it('leaves the on-demand MP4 conversion chunk to the runtime cache', async () => {
    const withMedia: Record<string, string> = {
      ...files,
      '_astro/App.js': 'import("./mediabunny.Ab-1.js");import("./lazy.js")',
      '_astro/mediabunny.Ab-1.js': 'export const big=1',
    };
    const precache = await collectPrecache(async (path: string) => {
      const file = withMedia[path];
      if (file === undefined) throw new Error(`missing ${path}`);
      return file;
    });
    expect(precache).toContain('/_astro/lazy.js');
    expect(precache).not.toContain('/_astro/mediabunny.Ab-1.js');
  });
  it('fails the build when a page points at a missing asset', async () => {
    const broken = async (path: string) => {
      if (path === '_astro/App.js') throw new Error('missing');
      return read(path);
    };
    await expect(collectPrecache(broken)).rejects.toThrow('missing');
  });
  it('produces the same list and version on every run', async () => {
    const first = await collectPrecache(read);
    const second = await collectPrecache(read);
    expect(second).toEqual(first);
    expect(precacheVersion(second)).toBe(precacheVersion(first));
  });
  it('versions by the first 12 characters of the sha256 of the list', () => {
    const list = ['/a', '/b'];
    expect(precacheVersion(list)).toBe(
      createHash('sha256').update('["/a","/b"]').digest('hex').slice(0, 12),
    );
    expect(precacheVersion(['/a', '/c'])).not.toBe(precacheVersion(list));
  });
});

describe('service worker rendering', () => {
  const template = "const P = '__PRECACHE__';\nconst V = '__VERSION__';\n// __SHARE_HANDLER__\n";
  it('injects the list, the version and the handler without its export keyword', () => {
    expect(
      renderServiceWorker({
        template,
        shareHandler: 'export function a() {}\nexport function b() {}\n',
        precache: ['/$&', '/b'],
        version: 'abc',
      }),
    ).toBe('const P = ["/$&","/b"];\nconst V = \'abc\';\nfunction a() {}\nfunction b() {}\n\n');
  });
  it('refuses a template that lost a placeholder', () => {
    expect(() =>
      renderServiceWorker({ template: 'nothing', shareHandler: '', precache: [], version: 'x' }),
    ).toThrow('template lacks');
  });
});
