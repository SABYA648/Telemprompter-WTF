const base = process.env.SEO_CRAWL_BASE_URL ?? 'http://127.0.0.1:8080';
const sm = await (await fetch(`${base}/sitemap-0.xml`)).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://teleprompter.wtf', base));
console.log(`sitemap URLs: ${urls.length}`);
const titles = new Map(), descs = new Map(), canonicals = new Set();
let fail = 0;
for (const url of urls) {
  const res = await fetch(url);
  const html = await res.text();
  const path = url.replace(base, '');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const h1count = (html.match(/<h1[\s>]/g) || []).length;
  const noindex = /noindex/i.test(html);
  const localhost = /localhost|127\.0\.0\.1/.test(html);
  const ogtype = html.match(/<meta property="og:type" content="([^"]+)"/)?.[1];
  const problems = [];
  if (res.status !== 200) problems.push(`status ${res.status}`);
  if (!title) problems.push('no title');
  if (!desc) problems.push('no description');
  if (!canon?.startsWith('https://teleprompter.wtf')) problems.push(`bad canonical ${canon}`);
  if (h1count !== 1) problems.push(`h1 count ${h1count}`);
  if (noindex) problems.push('NOINDEX');
  if (localhost) problems.push('localhost reference');
  if (problems.length) { fail++; console.log(`FAIL ${path}: ${problems.join(', ')}`); }
  if (title) { if (titles.has(title)) { fail++; console.log(`DUP TITLE ${path} and ${titles.get(title)}: ${title}`); } titles.set(title, path); }
  if (desc) { if (descs.has(desc)) { fail++; console.log(`DUP DESC ${path} and ${descs.get(desc)}`); } descs.set(desc, path); }
  canonicals.add(canon);
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  for (const m of jsonld) { try { JSON.parse(m[1]); } catch { fail++; console.log(`FAIL ${path}: invalid JSON-LD`); } }
}
// robots.txt
const robots = await (await fetch(`${base}/robots.txt`)).text();
console.log('--- robots.txt ---'); console.log(robots.trim());
if (!/Sitemap: https:\/\/teleprompter\.wtf\/sitemap-index\.xml/.test(robots)) { fail++; console.log('FAIL robots sitemap line'); }
console.log(fail === 0 ? 'SEO CRAWL PASS' : `SEO CRAWL FAILURES: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
