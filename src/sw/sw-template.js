const PRECACHE = '__PRECACHE__';
const VERSION = '__VERSION__';
const CACHE = `tw-${VERSION}`;
const NAVIGATION_TIMEOUT_MS = 3000;
// __SHARE_HANDLER__

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith('tw-') && name !== CACHE) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function openStudioDb() {
  return new Promise((resolve, reject) => {
    // No version: a later app schema must not make a share fail with a VersionError.
    const request = indexedDB.open('teleprompter-wtf');
    request.onupgradeneeded = () => {
      const db = request.result;
      const scripts = db.createObjectStore('scripts', { keyPath: 'id' });
      scripts.createIndex('updatedAt', 'updatedAt');
      scripts.createIndex('status', 'status');
      scripts.createIndex('order', 'order');
      const takes = db.createObjectStore('takes', { keyPath: 'id' });
      takes.createIndex('scriptId', 'scriptId');
      takes.createIndex('createdAt', 'createdAt');
      takes.createIndex('status', 'status');
      const chunks = db.createObjectStore('chunks', { keyPath: ['takeId', 'seq'] });
      chunks.createIndex('takeId', 'takeId');
      const ideas = db.createObjectStore('ideas', { keyPath: 'id' });
      ideas.createIndex('createdAt', 'createdAt');
      db.createObjectStore('kv');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeShare(request) {
  const form = await request.formData();
  const idea = sharedIdea(
    { title: form.get('title'), text: form.get('text'), url: form.get('url') },
    crypto.randomUUID(),
    Date.now(),
  );
  if (!idea) return 'empty';
  const db = await openStudioDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('ideas', 'readwrite');
      tx.objectStore('ideas').put(idea);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return 'stored';
}
async function shareTarget(request) {
  let outcome = 'failed';
  try {
    outcome = await storeShare(request);
  } catch {
    /* The landing screen reports the failure. */
  }
  return Response.redirect(shareRedirect(outcome), 303);
}
function withTimeout(pending, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([pending, timeout]).finally(() => clearTimeout(timer));
}
async function remember(cache, request, response) {
  if (!response.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    /* A full cache must not fail a response the network already delivered. */
  }
}
async function navigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await withTimeout(fetch(request), NAVIGATION_TIMEOUT_MS);
    await remember(cache, request, response);
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match('/offline')) ||
      Response.error()
    );
  }
}
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await remember(cache, request, response);
  return response;
}
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    await remember(cache, request, response);
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(shareTarget(event.request));
    return;
  }
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') event.respondWith(navigation(event.request));
  else if (
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  )
    event.respondWith(cacheFirst(event.request));
  // Unhashed precached files: keep them fresh online and available offline.
  else if (url.pathname === '/site.webmanifest' || url.pathname === '/favicon.svg')
    event.respondWith(networkFirst(event.request));
});
