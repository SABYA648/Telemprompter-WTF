import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analytics } from '../analytics';
import { resetDbForTests } from './db';
import { exportTakes, sizeBucket, takeFilename } from './exportTake';
import { getTake, saveChunk, saveTake } from './takesRepo';
import type { StudioTake } from './types';

const take = (partial: Partial<StudioTake>): StudioTake =>
  ({
    id: 'take-1',
    scriptId: 'script-1',
    sectionIndex: null,
    number: 1,
    createdAt: new Date(2026, 10, 5).getTime(),
    mimeType: 'video/mp4',
    container: 'mp4',
    sizeBytes: 3,
    ...partial,
  }) as StudioTake;

const withVideo = async (...rows: StudioTake[]) => {
  for (const row of rows) {
    await saveTake(row);
    await saveChunk({ takeId: row.id, seq: 0, blob: new Blob(['abc'], { type: 'video/mp4' }) });
  }
  return rows;
};

beforeEach(() => {
  resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
  vi.stubGlobal('dispatchEvent', vi.fn());
  vi.spyOn(analytics, 'track').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('takeFilename', () => {
  it('names the section so a set of section takes sorts and stays unique', () => {
    expect(takeFilename('My Reel', take({}))).toBe('my-reel-take1-20261105.mp4');
    expect(takeFilename('My Reel', take({ sectionIndex: 1 }))).toBe(
      'my-reel-section2-take1-20261105.mp4',
    );
  });
});

describe('exportTakes', () => {
  it('shares every file at once in the given order, then marks and tracks them', async () => {
    const share = vi.fn<(data: { files: File[] }) => Promise<void>>().mockResolvedValue();
    vi.stubGlobal('navigator', { canShare: () => true, share });
    const rows = await withVideo(
      take({ id: 'a', sectionIndex: 0 }),
      take({ id: 'b', sectionIndex: 1 }),
    );
    expect(await exportTakes(rows, { 'script-1': 'My Reel' })).toBe('share');
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0]![0].files.map((file) => file.name)).toEqual([
      'my-reel-section1-take1-20261105.mp4',
      'my-reel-section2-take1-20261105.mp4',
    ]);
    expect((await getTake('a'))?.exportedAt).toBeTruthy();
    expect(analytics.track).toHaveBeenCalledTimes(2);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });

  it('keeps duplicate file names apart', async () => {
    const share = vi.fn<(data: { files: File[] }) => Promise<void>>().mockResolvedValue();
    vi.stubGlobal('navigator', { canShare: () => true, share });
    await exportTakes(await withVideo(take({ id: 'a' }), take({ id: 'b' })));
    expect(share.mock.calls[0]![0].files.map((file) => file.name)).toEqual([
      'take1-20261105.mp4',
      'take1-20261105-2.mp4',
    ]);
  });

  it('does not mark takes when the share sheet is dismissed', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' });
    vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn().mockRejectedValue(abort) });
    expect(await exportTakes(await withVideo(take({ id: 'a' })))).toBe('cancel');
    expect((await getTake('a'))?.exportedAt ?? null).toBeNull();
    expect(analytics.track).not.toHaveBeenCalled();
  });

  it('returns cancel for nothing and refuses an empty recording', async () => {
    expect(await exportTakes([])).toBe('cancel');
    await expect(exportTakes([take({ id: 'empty' })])).rejects.toThrow('No recorded video');
  });

  it('buckets sizes', () => {
    expect([1e6, 2e7, 1e8, 3e8].map(sizeBucket)).toEqual([
      'under_10mb',
      '10_50mb',
      '50_200mb',
      '200mb_plus',
    ]);
  });
});
