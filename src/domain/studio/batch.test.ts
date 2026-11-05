import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analytics } from '../analytics';
import {
  advanceBatch,
  endBatch,
  finishBatchEarly,
  hasBatchBadge,
  isBatchScript,
  readBatch,
  startBatch,
} from './batch';
import { resetDbForTests } from './db';

const session = new Map<string, string>();
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => session.get(key) ?? null,
  setItem: (key: string, value: string) => session.set(key, value),
  removeItem: (key: string) => session.delete(key),
});

beforeEach(() => {
  session.clear();
  resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
  vi.restoreAllMocks();
});

describe('batch mode', () => {
  it('walks the scripts in order and unlocks the badge once at the end', async () => {
    const track = vi.spyOn(analytics, 'track').mockImplementation(() => undefined);
    startBatch(['a', 'b', 'a']);
    expect(readBatch()?.ids).toEqual(['a', 'b']);
    expect(isBatchScript('a')).toBe(true);
    expect(isBatchScript('b')).toBe(false);
    expect(await advanceBatch('b', 'take-b')).toBe(false);
    expect(await advanceBatch('a', 'take-a')).toBe(true);
    expect(await advanceBatch('a', 'take-a')).toBe(false);
    expect(await hasBatchBadge()).toBe(false);
    expect(await advanceBatch('b', 'take-b')).toBe(true);
    expect(readBatch()).toMatchObject({ index: 2, takeIds: ['take-a', 'take-b'] });
    expect(await hasBatchBadge()).toBe(true);
    expect(track).toHaveBeenCalledWith('unlocked_badge', { badge_id: 'batch_day' });
    startBatch(['c', 'd']);
    await advanceBatch('c', 'take-c');
    await advanceBatch('d', 'take-d');
    expect(track.mock.calls.filter(([event]) => event === 'unlocked_badge')).toHaveLength(1);
  });

  it('gives no badge for a one-script run', async () => {
    startBatch(['a']);
    await advanceBatch('a', 'take-a');
    expect(await hasBatchBadge()).toBe(false);
  });

  it('ends early into a summary only when a take was kept', async () => {
    startBatch(['a', 'b', 'c']);
    expect(finishBatchEarly()).toBeNull();
    expect(readBatch()).toBeNull();
    startBatch(['a', 'b', 'c']);
    await advanceBatch('a', 'take-a');
    expect(finishBatchEarly()).toMatchObject({ ids: ['a'], index: 1, takeIds: ['take-a'] });
    endBatch();
    expect(readBatch()).toBeNull();
  });

  it('treats damaged session state as no batch', () => {
    session.set('studio.batch', '{bad');
    expect(readBatch()).toBeNull();
    session.set('studio.batch', JSON.stringify({ ids: 'a', index: 0, takeIds: [] }));
    expect(readBatch()).toBeNull();
    expect(isBatchScript('a')).toBe(false);
  });
});
