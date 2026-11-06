import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import noindexRoutes from '../src/content/noindexRoutes.json' with { type: 'json' };

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const publicContentRoots = [
  'src/pages',
  'src/content',
  'README.md',
  'CONTRIBUTING.md',
  'docs',
  'public/llms.txt',
];
const forbidden = [
  ['em dash', /—/],
  ['Lorem Ipsum', /lorem ipsum/i],
  ['unresolved placeholder', /xxxxxxxxx/i],
  ['generic filler', /in today['’]s fast-paced digital world/i],
  ['generic filler', /unlock your potential/i],
  ['generic filler', /take your .+ to the next level/i],
];

async function filesAt(path) {
  const full = resolve(root, path);
  const details = await stat(full);
  if (details.isFile()) return [full];
  const entries = await readdir(full, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => filesAt(join(path, entry.name))));
  return nested.flat();
}

for (const path of publicContentRoots) {
  for (const file of await filesAt(path)) {
    if (!['.astro', '.ts', '.tsx', '.md', '.txt'].includes(extname(file))) continue;
    const value = await readFile(file, 'utf8');
    for (const [label, pattern] of forbidden) {
      if (pattern.test(value)) failures.push(`${relative(root, file)}: ${label}`);
    }
  }
}

execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });

const htmlFiles = (await filesAt('dist')).filter(
  (file) => extname(file) === '.html' && !file.endsWith('/404.html'),
);
const titles = new Map();
const descriptions = new Map();
const hrefs = [];
const inbound = new Map();
const paragraphs = [];
const newGuides = new Set([
  'instagram-teleprompter',
  'capcut-teleprompter',
  'how-to-film-talking-head-reels',
  'how-to-batch-record-videos',
  'how-to-write-a-30-second-video-script',
  'teleprompter-remote-control',
  'best-camera-settings-for-reels',
  'external-microphone-for-phone-video',
]);
const clean = (value) =>
  value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const words = (value) => clean(value).match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
const shingles = (value) => {
  const tokens = words(value.toLowerCase());
  const result = new Set();
  for (let i = 0; i <= tokens.length - 12; i++) result.add(tokens.slice(i, i + 12).join(' '));
  return result;
};
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const page = relative(resolve(root, 'dist'), file);
  const route =
    page === 'index.html' ? '/' : `/${page.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
  const isNoindexRoute = noindexRoutes.includes(route);
  const main = html.match(/<main id="main-content">([\s\S]*?)<\/main>/)?.[1] ?? '';
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]?.trim();
  if (!title) failures.push(`${page}: missing title`);
  if (!description) failures.push(`${page}: missing meta description`);
  if (!/<link rel="canonical" href="https:\/\/www\.teleprompter\.wtf\//.test(html))
    failures.push(`${page}: missing canonical`);
  if (!isNoindexRoute && !/<h1(?:\s|>)/.test(html)) failures.push(`${page}: missing H1`);
  const hasNoindex = /<meta name="robots" content="noindex,follow"/i.test(html);
  if (isNoindexRoute && !hasNoindex) failures.push(`${page}: missing noindex,follow`);
  if (hasNoindex && !isNoindexRoute) failures.push(`${page}: accidental noindex`);
  if (title) {
    if (titles.has(title)) failures.push(`${page}: duplicate title with ${titles.get(title)}`);
    titles.set(title, page);
  }
  if (description) {
    if (descriptions.has(description))
      failures.push(`${page}: duplicate description with ${descriptions.get(description)}`);
    descriptions.set(description, page);
  }
  if (!isNoindexRoute) {
    if (title && (title.length < 30 || title.length > 65))
      failures.push(`${page}: title length ${title.length} outside 30-65`);
    if (description && (description.length < 120 || description.length > 160))
      failures.push(`${page}: description length ${description.length} outside 120-160`);
    const guideSlug = route.match(/^\/guides\/([^/]+)$/)?.[1];
    if (
      guideSlug &&
      ![...newGuides].some((slug) => slug !== guideSlug && main.includes(`href="/guides/${slug}"`))
    )
      failures.push(`${page}: missing related creator guide`);
    const minimum =
      route === '/record' || route === '/templates' || route === '/hooks'
        ? 300
        : route.startsWith('/record/')
          ? 600
          : route.startsWith('/templates/')
            ? 400
            : route.startsWith('/hooks/')
              ? 300
              : /^\/tools\/(script-length-checker|caption-counter|hook-generator)$/.test(route)
                ? 400
                : guideSlug && newGuides.has(guideSlug)
                  ? 1000
                  : 0;
    const count = words(main).length;
    if (minimum && count < minimum)
      failures.push(`${page}: ${count} content words below ${minimum}`);
    if (/^\/(record\/|templates\/|hooks\/)/.test(route)) {
      const ctas = (main.match(/data-analytics-cta=/g) ?? []).length;
      if (ctas !== 1) failures.push(`${page}: expected one primary Studio CTA, found ${ctas}`);
    }
    const editorial = main
      .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/g, '')
      .replace(/<section class="teleprompter-embed"[^>]*>[\s\S]*?<\/section>/g, '')
      .replace(/<article class="creator-card"[^>]*>[\s\S]*?<\/article>/g, '');
    for (const match of editorial.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) {
      const value = clean(match[1]).toLowerCase();
      const set = shingles(value);
      if (set.size) paragraphs.push({ page, value, set });
    }
  }
  for (const match of main.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = match[1].replace(/\/$/, '') || '/';
    if (!inbound.has(target)) inbound.set(target, new Set());
    inbound.get(target).add(route);
  }
  for (const match of html.matchAll(/href="(\/[^"]*)"/g))
    hrefs.push([page, new URL(match[1], 'https://www.teleprompter.wtf').pathname]);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch {
      failures.push(`${page}: invalid JSON-LD`);
    }
  }
}

for (let i = 0; i < paragraphs.length; i++) {
  const a = paragraphs[i];
  for (let j = i + 1; j < paragraphs.length; j++) {
    const b = paragraphs[j];
    if (a.page === b.page) continue;
    let shared = 0;
    for (const shingle of a.set) if (b.set.has(shingle)) shared++;
    if (shared / (a.set.size + b.set.size - shared) > 0.5)
      failures.push(`${a.page} and ${b.page}: duplicate paragraphs (12-word Jaccard > 0.5)`);
  }
}
const newRoutes = [
  '/record',
  ...['instagram-reels', 'youtube-shorts', 'tiktok', 'youtube', 'linkedin-video'].map(
    (slug) => `/record/${slug}`,
  ),
  ...['script-length-checker', 'caption-counter', 'hook-generator'].map((slug) => `/tools/${slug}`),
  ...newGuides,
].map((slug) => (slug.startsWith('/') ? slug : `/guides/${slug}`));
for (const route of newRoutes) {
  const sources = inbound.get(route) ?? new Set();
  const hub = route.startsWith('/guides/')
    ? '/guides'
    : route.startsWith('/tools/')
      ? '/tools'
      : route.startsWith('/record/')
        ? '/record'
        : '/';
  if (!sources.has(hub)) failures.push(`${route}: missing hub link from ${hub}`);
  const contextual = [...sources].filter((source) => source !== hub && source !== route);
  if (contextual.length < 3)
    failures.push(`${route}: ${contextual.length} contextual inbound pages, need 3 plus hub`);
}

for (const [page, href] of hrefs) {
  if (!href || href.startsWith('/_astro/')) continue;
  const direct = href === '/' ? 'dist/index.html' : `dist${href}`;
  const target = href === '/' ? direct : `dist${href}.html`;
  const alternate = href === '/' ? direct : `dist${href}/index.html`;
  try {
    await stat(resolve(root, direct));
  } catch {
    try {
      await stat(resolve(root, target));
    } catch {
      try {
        await stat(resolve(root, alternate));
      } catch {
        failures.push(`${page}: broken internal link ${href}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Content lint failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}
console.log(`Content lint passed for ${htmlFiles.length} indexable HTML pages.`);
