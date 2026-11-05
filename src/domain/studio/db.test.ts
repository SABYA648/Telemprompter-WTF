import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { getDb, isMemoryStorage, resetDbForTests } from './db';

afterEach(async () => {
  await resetDbForTests();
  vi.unstubAllGlobals();
});
it('creates all v1 stores and indexes', async () => {
  const db = await getDb();
  await db.put('kv', 'value', 'test');
  expect(await db.get('kv', 'test')).toBe('value');
  const request = indexedDB.open('teleprompter-wtf', 1);
  const native = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  expect([...native.objectStoreNames]).toEqual(['chunks', 'ideas', 'kv', 'scripts', 'takes']);
  expect([...native.transaction('takes').objectStore('takes').indexNames]).toContain('status');
  native.close();
});
it('uses an in-memory store if IndexedDB cannot open', async () => {
  vi.stubGlobal('indexedDB', undefined);
  const db = await getDb();
  await db.put('kv', true, 'flag');
  expect(await db.get('kv', 'flag')).toBe(true);
  expect(isMemoryStorage()).toBe(true);
});
