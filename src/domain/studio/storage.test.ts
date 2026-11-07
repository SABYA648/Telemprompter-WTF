import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb, resetDbForTests } from './db';
import { persistOnFirstStandaloneLaunch } from './storage';

describe('persistOnFirstStandaloneLaunch', () => {
  const persist = vi.fn(async () => true);
  beforeEach(() => {
    persist.mockClear();
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('navigator', { storage: { persist } });
  });
  afterEach(async () => {
    await resetDbForTests();
    vi.unstubAllGlobals();
  });
  it('asks once, on the first standalone launch only', async () => {
    expect(await persistOnFirstStandaloneLaunch(false)).toBe(false);
    expect(persist).not.toHaveBeenCalled();
    expect(await persistOnFirstStandaloneLaunch(true)).toBe(true);
    expect(await persistOnFirstStandaloneLaunch(true)).toBe(false);
    expect(persist).toHaveBeenCalledTimes(1);
  });
  it('still asks when the browser already asked after a kept take', async () => {
    await (await getDb()).put('kv', true, 'storage.persistRequested');
    expect(await persistOnFirstStandaloneLaunch(true)).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });
  it('does not wait for the answer and survives a refusal', async () => {
    persist.mockImplementationOnce(() => new Promise<boolean>(() => undefined));
    await expect(persistOnFirstStandaloneLaunch(true)).resolves.toBe(true);
    await resetDbForTests();
    vi.stubGlobal('indexedDB', new IDBFactory());
    persist.mockRejectedValueOnce(new Error('denied'));
    await expect(persistOnFirstStandaloneLaunch(true)).resolves.toBe(true);
  });
  it('does nothing where the API is missing', async () => {
    vi.stubGlobal('navigator', {});
    expect(await persistOnFirstStandaloneLaunch(true)).toBe(false);
  });
});
