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
// D-047: these pre-M10 pages predate the 13.1 floors. They are reported, not padded; new pages
// of the same type must meet the floor.
const legacyBelowFloor = new Set([
  ...[
    'how-to-use-a-teleprompter',
    'teleprompter-for-youtube',
    'teleprompter-for-video-recording',
    'teleprompter-camera-distance-and-font-size',
    'teleprompter-for-presentations',
    'teleprompter-for-zoom',
    'teleprompter-speed',
    'what-is-a-teleprompter',
    'how-to-read-a-teleprompter-naturally',
    'how-to-maintain-eye-contact',
    'how-to-format-a-teleprompter-script',
    'voice-activated-teleprompters',
    'manual-vs-voice-activated-teleprompter',
    'teleprompter-for-phone-and-tablet',
    'teleprompter-for-online-courses',
    'teleprompter-for-podcasts',
    'teleprompter-for-short-form-video',
    'teleprompter-for-webinars',
    'teleprompter-for-interviews',
    'teleprompter-mirror-mode-glass',
    'teleprompter-keyboard-shortcuts',
  ].map((slug) => `/guides/${slug}`),
  '/tools/teleprompter-speed-calculator',
  '/tools/words-to-minutes',
]);
const legacyReport = [];
const lengthWarnings = [];
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
    if (title && /^\S+( \S+)? guide \|/.test(title))
      failures.push(`${page}: generic "{eyebrow} guide" title; author a seoTitle`);
    // 13.1 word ranges count page-owned editorial text: navigation, breadcrumbs, related lists,
    // the guide embed and island markup are shared boilerplate and are removed first (D-047).
    const editorial = main
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/g, '')
      .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/g, '')
      .replace(/<astro-island\b[^>]*>[\s\S]*?<\/astro-island>/g, '')
      .replace(
        /<section class="(?:teleprompter-embed|creator-related|related-guides)"[^>]*>[\s\S]*?<\/section>/g,
        '',
      )
      .replace(/<article class="creator-card"[^>]*>[\s\S]*?<\/article>/g, '');
    const [minimum, maximum] =
      route === '/record' || route === '/templates' || route === '/hooks'
        ? [300, 600]
        : route.startsWith('/record/')
          ? [600, 1000]
          : route.startsWith('/templates/')
            ? [400, 800]
            : route.startsWith('/hooks/')
              ? [300, 0]
              : route.startsWith('/tools/')
                ? [400, 700]
                : guideSlug
                  ? [1000, 1800]
                  : [0, 0];
    let counted = editorial;
    if (route.startsWith('/hooks/')) {
      const hooks = (editorial.match(/<li class="creator-hook"/g) ?? []).length;
      if (hooks < 25) failures.push(`${page}: ${hooks} hooks, need 25`);
      counted = editorial.replace(/<li class="creator-hook"[^>]*>[\s\S]*?<\/li>/g, '');
    }
    const count = words(counted).length;
    if (minimum && count < minimum) {
      if (legacyBelowFloor.has(route)) legacyReport.push(`${route} (${count})`);
      else failures.push(`${page}: ${count} editorial words below ${minimum}`);
    } else if (legacyBelowFloor.has(route))
      failures.push(
        `${page}: now meets the ${minimum} word floor; remove it from legacyBelowFloor`,
      );
    if (maximum && count > maximum) lengthWarnings.push(`${route} (${count} > ${maximum})`);
    if (/^\/(record\/|templates\/|hooks\/)/.test(route)) {
      const ctas = (main.match(/data-analytics-cta=/g) ?? []).length;
      if (ctas !== 1) failures.push(`${page}: expected one primary Studio CTA, found ${ctas}`);
    }
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

for (const route of legacyBelowFloor)
  if (!htmlFiles.some((file) => file.endsWith(`dist${route}/index.html`)))
    failures.push(`${route}: listed in legacyBelowFloor but not built`);
if (legacyReport.length)
  console.log(`Below the 13.1 floor, pre-M10 (D-047): ${legacyReport.join(', ')}`);
if (lengthWarnings.length)
  console.log(`Over the 13.1 upper bound (warning, D-047): ${lengthWarnings.join(', ')}`);
if (failures.length) {
  console.error(`Content lint failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}
console.log(`Content lint passed for ${htmlFiles.length} indexable HTML pages.`);
