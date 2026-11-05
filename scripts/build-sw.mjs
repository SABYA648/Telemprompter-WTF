import { readFile, writeFile } from 'node:fs/promises';
import { collectPrecache, precacheVersion, renderServiceWorker } from './sw-precache.mjs';

const dist = new URL('../dist/', import.meta.url);
const source = (path) => readFile(new URL(`../src/sw/${path}`, import.meta.url), 'utf8');
const precache = await collectPrecache((path) => readFile(new URL(path, dist), 'utf8'));
const version = precacheVersion(precache);
await writeFile(
  new URL('sw.js', dist),
  renderServiceWorker({
    template: await source('sw-template.js'),
    shareHandler: await source('share-target.js'),
    precache,
    version,
  }),
);
console.log(`Service worker ${version}: ${precache.length} URLs`);
