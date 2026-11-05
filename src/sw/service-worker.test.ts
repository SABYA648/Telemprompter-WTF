import { readFileSync } from 'node:fs';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb, resetDbForTests } from '../domain/studio/db';
import { renderServiceWorker } from '../../scripts/sw-precache.mjs';

const ORIGIN = 'https://www.teleprompter.wtf';
const source = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8');
const key = (request: string | { url: string }) =>
  new URL(typeof request === 'string' ? request : request.url, ORIGIN);

class FakeCache {
  entries = new Map<string, Response>();
  async put(request: string | { url: string }, response: Response) {
    this.entries.set(key(request).href, response);
  }
  async match(request: string | { url: string }, options?: { ignoreSearch?: boolean }) {
    const wanted = key(request);
    for (const [url, response] of this.entries) {
      const stored = new URL(url);
      if (url === wanted.href || (options?.ignoreSearch && stored.pathname === wanted.pathname))
        return response.clone();
    }
    return undefined;
  }
}
class SwResponse extends Response {
  static override redirect(url: string, status: number) {
    return new Response(null, { status, headers: { location: url } });
  }
}
type Listener = (event: Record<string, unknown>) => void;
function loadWorker(network: (request: unknown) => Promise<Response>) {
  const listeners = new Map<string, Listener>();
  const stores = new Map<string, FakeCache>();
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name) as FakeCache;
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
  };
  const self = {
    location: new URL(`${ORIGIN}/sw.js`),
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    clients: { claim: vi.fn(async () => undefined) },
    skipWaiting: vi.fn(),
  };
  const code = renderServiceWorker({
    template: source('./sw-template.js'),
    shareHandler: source('./share-target.js'),
    precache: ['/studio', '/offline'],
    version: 'abc123abc123',
  });
  const fetchMock = vi.fn(network);
  new Function('self', 'caches', 'fetch', 'Response', code)(self, caches, fetchMock, SwResponse);
  const dispatch = (request: Record<string, unknown>) => {
    let responded: Promise<Response> | undefined;
    (listeners.get('fetch') as Listener)({
      request,
      respondWith: (value: Promise<Response>) => {
        responded = value;
      },
    });
    return responded;
  };
  const cache = () => caches.open('tw-abc123abc123');
  return { listeners, stores, caches, self, fetchMock, dispatch, cache };
}
const page = (path: string, mode = 'navigate') => ({
  url: `${ORIGIN}${path}`,
  method: 'GET',
  mode,
});
const html = (body: string) => new Response(body, { status: 200 });

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  await resetDbForTests();
});

describe('service worker navigation', () => {
  it('prefers the network and remembers the page', async () => {
    const worker = loadWorker(async () => html('fresh'));
    const response = await worker.dispatch(page('/guides/one'));
    expect(await response?.text()).toBe('fresh');
    expect(await (await (await worker.cache()).match(page('/guides/one')))?.text()).toBe('fresh');
  });
  it('serves the cached page, ignoring tracking parameters, when the network fails', async () => {
    const worker = loadWorker(async () => {
      throw new TypeError('offline');
    });
    await (await worker.cache()).put('/studio', html('shell'));
    await (await worker.cache()).put('/offline', html('offline page'));
    const response = await worker.dispatch(page('/studio?utm_source=pwa&utm_medium=homescreen'));
    expect(await response?.text()).toBe('shell');
  });
  it('shows /offline for a page that was never visited', async () => {
    const worker = loadWorker(async () => {
      throw new TypeError('offline');
    });
    await (await worker.cache()).put('/offline', html('offline page'));
    expect(await (await worker.dispatch(page('/guides/never')))?.text()).toBe('offline page');
  });
  it('gives up on a hanging network after three seconds and not before', async () => {
    vi.useFakeTimers();
    const worker = loadWorker(() => new Promise<Response>(() => undefined));
    await (await worker.cache()).put('/studio', html('shell'));
    let settled = false;
    const response = worker.dispatch(page('/studio'));
    void response?.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(2999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
    expect(await (await response)?.text()).toBe('shell');
  });
  it('returns a server error without caching it, and survives a full cache', async () => {
    const failing = loadWorker(async () => new Response('nope', { status: 500 }));
    expect((await failing.dispatch(page('/guides/one')))?.status).toBe(500);
    expect((await failing.cache()).entries.size).toBe(0);
    const full = loadWorker(async () => html('fresh'));
    vi.spyOn(FakeCache.prototype, 'put').mockRejectedValueOnce(new Error('quota'));
    expect(await (await full.dispatch(page('/guides/one')))?.text()).toBe('fresh');
  });
});

describe('service worker assets', () => {
  it('goes cache-first for /_astro and /icons and populates the cache', async () => {
    for (const path of ['/_astro/app.js', '/icons/icon-192.png', '/fonts/a.woff2']) {
      const worker = loadWorker(async () => html(`network ${path}`));
      const request = page(path, 'cors');
      expect(await (await worker.dispatch(request))?.text()).toBe(`network ${path}`);
      expect(await (await worker.dispatch(request))?.text()).toBe(`network ${path}`);
      expect(worker.fetchMock).toHaveBeenCalledTimes(1);
    }
  });
  it('refreshes the manifest online and serves the cached copy offline', async () => {
    let online = true;
    const worker = loadWorker(async () => {
      if (!online) throw new TypeError('offline');
      return html('manifest');
    });
    const request = page('/site.webmanifest', 'cors');
    await worker.dispatch(request);
    await worker.dispatch(request);
    expect(worker.fetchMock).toHaveBeenCalledTimes(2);
    online = false;
    expect(await (await worker.dispatch(request))?.text()).toBe('manifest');
  });
  it('passes through cross-origin, non-GET and unlisted requests', () => {
    const worker = loadWorker(async () => html('network'));
    expect(
      worker.dispatch({ url: 'https://analytics.sabya.pm/script.js', method: 'GET', mode: 'cors' }),
    ).toBeUndefined();
    expect(
      worker.dispatch({ url: 'https://analytics.sabya.pm/api/send', method: 'POST', mode: 'cors' }),
    ).toBeUndefined();
    expect(
      worker.dispatch({ url: 'https://other.example/share-target', method: 'POST', mode: 'cors' }),
    ).toBeUndefined();
    expect(worker.dispatch({ url: `${ORIGIN}/x`, method: 'POST', mode: 'cors' })).toBeUndefined();
    expect(worker.dispatch({ url: `${ORIGIN}/studio`, method: 'PUT', mode: 'navigate' })).toBe(
      undefined,
    );
    expect(worker.dispatch(page('/llms.txt', 'cors'))).toBeUndefined();
    expect(worker.fetchMock).not.toHaveBeenCalled();
  });
});

describe('service worker lifecycle', () => {
  const wait = (type: string, worker: ReturnType<typeof loadWorker>) => {
    let done: Promise<unknown> = Promise.resolve();
    (worker.listeners.get(type) as Listener)({
      waitUntil: (value: Promise<unknown>) => {
        done = value;
      },
    });
    return done;
  };
  it('precaches on install, then removes only old tw caches on activate', async () => {
    const worker = loadWorker(async () => html('x'));
    const addAll = vi.fn(async () => undefined);
    (FakeCache.prototype as unknown as { addAll: unknown }).addAll = addAll;
    await wait('install', worker);
    expect(addAll).toHaveBeenCalledWith(['/studio', '/offline']);
    await worker.caches.open('tw-old');
    await worker.caches.open('other-app');
    await wait('activate', worker);
    expect(await worker.caches.keys()).toEqual(['tw-abc123abc123', 'other-app']);
    expect(worker.self.clients.claim).toHaveBeenCalled();
  });
  it('skips waiting only when asked', () => {
    const worker = loadWorker(async () => html('x'));
    (worker.listeners.get('message') as Listener)({ data: 'something else' });
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    (worker.listeners.get('message') as Listener)({ data: 'SKIP_WAITING' });
    expect(worker.self.skipWaiting).toHaveBeenCalledTimes(1);
  });
});

describe('service worker share target', () => {
  const share = (fields: Record<string, string> | Error) => ({
    url: `${ORIGIN}/share-target`,
    method: 'POST',
    mode: 'navigate',
    formData: async () => {
      if (fields instanceof Error) throw fields;
      const form = new FormData();
      for (const [name, value] of Object.entries(fields)) form.set(name, value);
      return form;
    },
  });
  it('stores an idea the app can read and redirects with 303', async () => {
    const worker = loadWorker(async () => html('x'));
    const response = await worker.dispatch(
      share({ title: 'Headline', text: 'Body', url: 'https://example.org/a' }),
    );
    expect(response?.status).toBe(303);
    expect(response?.headers.get('location')).toBe('/studio#/inbox?shared=1');
    const [idea] = (await (await getDb()).getAll('ideas')) as Array<Record<string, unknown>>;
    expect(idea).toMatchObject({ text: 'Headline\nBody\nhttps://example.org/a' });
    expect(typeof idea?.id).toBe('string');
    expect(typeof idea?.createdAt).toBe('number');
    expect(worker.fetchMock).not.toHaveBeenCalled();
  });
  it('stores nothing for an empty share and reports no save', async () => {
    const worker = loadWorker(async () => html('x'));
    const response = await worker.dispatch(share({ title: '  ', url: 'javascript:alert(1)' }));
    expect(response?.headers.get('location')).toBe('/studio#/inbox');
    expect(await (await getDb()).getAll('ideas')).toEqual([]);
  });
  it('reports a failure instead of breaking the share sheet', async () => {
    const worker = loadWorker(async () => html('x'));
    const response = await worker.dispatch(share(new Error('bad form')));
    expect(response?.status).toBe(303);
    expect(response?.headers.get('location')).toBe('/studio#/inbox?shared=error');
  });
  it('creates the same database schema as the app when it runs first', async () => {
    const schema = async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('teleprompter-wtf');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const names = [...db.objectStoreNames];
      const tx = db.transaction(names);
      const result = {
        version: db.version,
        stores: names.map((name) => {
          const store = tx.objectStore(name);
          return {
            name,
            keyPath: store.keyPath,
            indexes: [...store.indexNames].map((index) => [index, store.index(index).keyPath]),
          };
        }),
      };
      db.close();
      return result;
    };
    await loadWorker(async () => html('x')).dispatch(share({ text: 'First' }));
    const fromWorker = await schema();
    await (await getDb()).getAll('ideas');
    await resetDbForTests();
    vi.stubGlobal('indexedDB', new IDBFactory());
    await (await getDb()).getAll('ideas');
    await resetDbForTests();
    expect(await schema()).toEqual(fromWorker);
  });
});
