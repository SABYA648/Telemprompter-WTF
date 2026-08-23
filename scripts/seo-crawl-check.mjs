const base = process.env.SEO_CRAWL_BASE_URL ?? 'http://127.0.0.1:8080';
const sm = await (await fetch(`${base}/sitemap-0.xml`)).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace('https://www.teleprompter.wtf', base),
);
console.log(`sitemap URLs: ${urls.length}`);
const titles = new Map(),
  descs = new Map(),
  canonicals = new Set();
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
  const problems = [];
  if (res.status !== 200) problems.push(`status ${res.status}`);
  if (!title) problems.push('no title');
  if (!desc) problems.push('no description');
  if (!canon?.startsWith('https://www.teleprompter.wtf')) problems.push(`bad canonical ${canon}`);
  if (h1count !== 1) problems.push(`h1 count ${h1count}`);
  if (noindex) problems.push('NOINDEX');
  if (localhost) problems.push('localhost reference');
  if (problems.length) {
    fail++;
    console.log(`FAIL ${path}: ${problems.join(', ')}`);
  }
  if (title) {
    if (titles.has(title)) {
      fail++;
      console.log(`DUP TITLE ${path} and ${titles.get(title)}: ${title}`);
    }
    titles.set(title, path);
  }
  if (desc) {
    if (descs.has(desc)) {
      fail++;
      console.log(`DUP DESC ${path} and ${descs.get(desc)}`);
    }
    descs.set(desc, path);
  }
  canonicals.add(canon);
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  for (const m of jsonld) {
    try {
      JSON.parse(m[1]);
    } catch {
      fail++;
      console.log(`FAIL ${path}: invalid JSON-LD`);
    }
  }
}
// robots.txt
const robots = await (await fetch(`${base}/robots.txt`)).text();
console.log('--- robots.txt ---');
console.log(robots.trim());
if (!/Sitemap: https:\/\/www\.teleprompter\.wtf\/sitemap-index\.xml/.test(robots)) {
  fail++;
  console.log('FAIL robots sitemap line');
}
// image sitemap
const imgSmRes = await fetch(`${base}/sitemap-images.xml`);
const imgSm = await imgSmRes.text();
if (imgSmRes.status !== 200) {
  fail++;
  console.log(`FAIL /sitemap-images.xml: status ${imgSmRes.status}`);
} else {
  const pageLocs = [...imgSm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const imageLocs = [...imgSm.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]);
  console.log(`image sitemap: ${pageLocs.length} pages, ${imageLocs.length} images`);
  for (const loc of imageLocs) {
    const res = await fetch(loc.replace('https://www.teleprompter.wtf', base));
    const type = res.headers.get('content-type') ?? '';
    if (res.status !== 200 || !type.includes('image/webp')) {
      fail++;
      console.log(`FAIL image sitemap image ${loc}: status ${res.status}, content-type ${type}`);
    }
  }
  for (const loc of pageLocs) {
    const res = await fetch(loc.replace('https://www.teleprompter.wtf', base));
    if (res.status !== 200) {
      fail++;
      console.log(`FAIL image sitemap page ${loc}: status ${res.status}`);
    }
  }
}

// guides RSS feed
const guideUrls = urls.filter((u) => /^\/guides\/[^/]+$/.test(u.replace(base, '')));
const feedRes = await fetch(`${base}/guides/feed.xml`);
const feed = await feedRes.text();
if (feedRes.status !== 200) {
  fail++;
  console.log(`FAIL /guides/feed.xml: status ${feedRes.status}`);
} else {
  const itemCount = (feed.match(/<item>/g) || []).length;
  if (itemCount !== guideUrls.length) {
    fail++;
    console.log(`FAIL feed item count ${itemCount} != guide page count ${guideUrls.length}`);
  }
}

// homepage hero and og image
const home = await (await fetch(`${base}/`)).text();
const imgTags = (html) => [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
const heroImgs = imgTags(home).filter((t) =>
  t.includes('src="/illustrations/teleprompter-hero.webp"'),
);
if (heroImgs.length !== 1) {
  fail++;
  console.log(`FAIL homepage hero img count ${heroImgs.length}`);
} else {
  for (const attr of ['width="1024"', 'height="683"', 'loading="eager"', 'fetchpriority="high"']) {
    if (!heroImgs[0].includes(attr)) {
      fail++;
      console.log(`FAIL homepage hero img missing ${attr}`);
    }
  }
}
const ogImage = home.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
if (ogImage !== 'https://www.teleprompter.wtf/illustrations/teleprompter-og.webp') {
  fail++;
  console.log(`FAIL homepage og:image ${ogImage}`);
} else {
  const res = await fetch(ogImage.replace('https://www.teleprompter.wtf', base));
  const type = res.headers.get('content-type') ?? '';
  if (res.status !== 200 || !type.includes('image/webp')) {
    fail++;
    console.log(`FAIL og:image fetch: status ${res.status}, content-type ${type}`);
  }
}

// guide page embeds and illustrations
for (const url of guideUrls) {
  const path = url.replace(base, '');
  const html = await (await fetch(url)).text();
  const embedCount = (html.match(/data-teleprompter-embed/g) || []).length;
  if (embedCount !== 1) {
    fail++;
    console.log(`FAIL ${path}: data-teleprompter-embed count ${embedCount}`);
  }
  for (const tag of imgTags(html).filter((t) => t.includes('src="/illustrations/guides/'))) {
    const problems = [];
    for (const attr of ['width="1024"', 'height="683"', 'loading="lazy"']) {
      if (!tag.includes(attr)) problems.push(`missing ${attr}`);
    }
    if (!tag.match(/alt="([^"]+)"/)) problems.push('missing or empty alt');
    if (problems.length) {
      fail++;
      console.log(`FAIL ${path} guide illustration: ${problems.join(', ')}`);
    }
  }
}

// 404 contract
const nfRes = await fetch(`${base}/this-page-definitely-does-not-exist`);
const nfHtml = await nfRes.text();
const nfProblems = [];
if (nfRes.status !== 404) nfProblems.push(`status ${nfRes.status}`);
if (!/noindex/i.test(nfHtml)) nfProblems.push('no noindex');
if (!nfHtml.includes('data-teleprompter-embed')) nfProblems.push('no teleprompter embed');
const nfImg = imgTags(nfHtml).find((t) => t.includes('src="/illustrations/lost-script-404.webp"'));
if (!nfImg) {
  nfProblems.push('no lost-script-404 img');
} else {
  if (!nfImg.includes('width="1024"')) nfProblems.push('lost-script img missing width="1024"');
  if (!nfImg.includes('height="683"')) nfProblems.push('lost-script img missing height="683"');
}
if (nfProblems.length) {
  fail++;
  console.log(`FAIL 404 contract: ${nfProblems.join(', ')}`);
}

console.log(fail === 0 ? 'SEO CRAWL PASS' : `SEO CRAWL FAILURES: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
