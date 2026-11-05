import 'fake-indexeddb/auto';
import { afterEach, expect, test } from 'vitest';
import { resetDbForTests } from './db';
import { deleteTake, getTake, recoverTakes, saveChunk, saveTake, takeBlob } from './takesRepo';
import type { StudioTake } from './types';

const take = (id: string): StudioTake => ({
  id,
  scriptId: null,
  sectionIndex: null,
  number: 1,
  status: 'recording',
  mimeType: 'video/webm',
  container: 'webm',
  width: 640,
  height: 480,
  frameRate: 30,
  facing: 'front',
  durationMs: 0,
  sizeBytes: 0,
  chunkCount: 0,
  kept: false,
  starred: false,
  exportedAt: null,
  createdAt: Date.now(),
  timeline: [],
  trim: null,
});
afterEach(async () => {
  await resetDbForTests();
});

test('assembles chunks in sequence and recovers a crashed recording once', async () => {
  const id = `recovery-${crypto.randomUUID()}`;
  await saveTake(take(id));
  await saveChunk({ takeId: id, seq: 1, blob: new Blob(['second']) });
  await saveChunk({ takeId: id, seq: 0, blob: new Blob(['first']) });
  const found = await recoverTakes();
  expect(found.find((t) => t.id === id)).toMatchObject({
    status: 'recovered',
    chunkCount: 2,
    durationMs: 2000,
    sizeBytes: 11,
  });
  expect(await (await takeBlob(found.find((t) => t.id === id)!)).text()).toBe('firstsecond');
  expect((await recoverTakes()).find((t) => t.id === id)).toBeUndefined();
  await deleteTake(id);
  expect(await getTake(id)).toBeUndefined();
});

test('removes an incomplete take with no media', async () => {
  const id = `empty-${crypto.randomUUID()}`;
  await saveTake(take(id));
  await recoverTakes();
  expect(await getTake(id)).toBeUndefined();
});
