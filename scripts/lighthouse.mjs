// Lighthouse audit against a running production-equivalent server (default: the local
// Docker origin). Usage: npm run test:lighthouse  (set LIGHTHOUSE_BASE_URL to override).
// Writes JSON reports and a summary table to artifacts/lighthouse/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? 'http://127.0.0.1:8080';
const outDir = join(process.cwd(), 'artifacts', 'lighthouse');
mkdirSync(outDir, { recursive: true });

const routes = [
  { name: 'home', path: '/' },
  { name: 'guides-hub', path: '/guides' },
  { name: 'guide', path: '/guides/teleprompter-for-zoom' },
  { name: 'tool', path: '/tools/teleprompter-speed-calculator' },
  // The genuine 404 path returns an error status, which Lighthouse scores as an errored
  // document. The nginx production origin serves /404.html directly with status 200, so
  // audit that URL; its SEO score stays low on purpose because the page is noindex.
  { name: 'not-found', path: '/404.html' },
];

const chrome = await launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
});

const summary = [];
try {
  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2 },
      throttlingMethod: 'simulate',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    if (!result) throw new Error(`Lighthouse returned no result for ${url}`);
    const { lhr } = result;
    writeFileSync(join(outDir, `${route.name}.json`), JSON.stringify(lhr, null, 2));
    const categories = lhr.categories;
    const audits = lhr.audits;
    summary.push({
      route: route.path,
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
      lcp: audits['largest-contentful-paint'].displayValue ?? 'n/a',
      tbt: audits['total-blocking-time'].displayValue ?? 'n/a',
      cls: audits['cumulative-layout-shift'].displayValue ?? 'n/a',
    });
  }
} finally {
  await chrome.kill();
}

writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.table(summary);
