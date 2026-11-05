import { gzipSync } from 'node:zlib';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

const root = resolve('dist');
async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) =>
        entry.isDirectory()
          ? pages(resolve(dir, entry.name))
          : entry.name.endsWith('.html')
            ? [resolve(dir, entry.name)]
            : [],
      ),
    )
  ).flat();
}
let failed = false;
for (const page of await pages(root)) {
  const html = await readFile(page, 'utf8');
  const entrypoints = [...html.matchAll(/<(?:script|link|astro-island)\b[^>]*>/g)].flatMap(
    ([tag]) =>
      [...tag.matchAll(/\b(?:src|href|component-url|renderer-url)="(\/_astro\/[^"]+\.js)"/g)].map(
        (match) => match[1],
      ),
  );
  const visited = new Set();
  let bytes = 0;
  async function addModule(href) {
    if (visited.has(href)) return;
    visited.add(href);
    const file = resolve(root, `.${href}`);
    const source = await readFile(file);
    bytes += gzipSync(source).length;
    const code = source.toString('utf8');
    for (const match of code.matchAll(/\b(?:from|import)\s*["'](\.[^"']+\.js)["']/g)) {
      await addModule(`/${relative(root, resolve(dirname(file), match[1]))}`);
    }
  }
  for (const href of entrypoints) await addModule(href);
  const pagePath = page.slice(root.length).replace(/\/index\.html$/, '/') || '/';
  const max = pagePath === '/studio/' || pagePath === '/studio.html' ? 90 * 1024 : 60 * 1024;
  console.log(
    `${pagePath}: ${(bytes / 1024).toFixed(1)} KB gzip (max ${(max / 1024).toFixed(0)} KB)`,
  );
  if (bytes > max) failed = true;
}
if (failed) process.exitCode = 1;
