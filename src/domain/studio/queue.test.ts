import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests } from './db';
import { moveInQueue, setUpNext, upNext } from './queue';
import { blankScript, createScript, listScripts, softDelete } from './scriptsRepo';

beforeEach(() => {
  resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
});

describe('Up next queue', () => {
  it('orders queued scripts and ignores unqueued or deleted ones', () => {
    const scripts = [
      { ...blankScript(1), id: 'late', order: 2 },
      { ...blankScript(2), id: 'first', order: 1 },
      { ...blankScript(3), id: 'none', order: 0 },
      { ...blankScript(4), id: 'gone', order: 3, deletedAt: 9 },
    ];
    expect(upNext(scripts).map((script) => script.id)).toEqual(['first', 'late']);
  });

  it('stores order, clears removed scripts and leaves updatedAt alone', async () => {
    await createScript({ id: 'a', updatedAt: 10 });
    await createScript({ id: 'b', updatedAt: 20 });
    await createScript({ id: 'c', updatedAt: 30 });
    await setUpNext(['b', 'a', 'b']);
    let scripts = await listScripts();
    expect(upNext(scripts).map((script) => script.id)).toEqual(['b', 'a']);
    expect(scripts.find((script) => script.id === 'b')?.updatedAt).toBe(20);
    await setUpNext(['a']);
    scripts = await listScripts();
    expect(upNext(scripts).map((script) => script.id)).toEqual(['a']);
    expect(scripts.find((script) => script.id === 'b')?.order).toBe(0);
  });

  it('drops a deleted script from the queue view', async () => {
    await createScript({ id: 'a' });
    await createScript({ id: 'b' });
    await setUpNext(['a', 'b']);
    await softDelete('a');
    expect(upNext(await listScripts(true)).map((script) => script.id)).toEqual(['b']);
  });

  it('moves up and down and stops at both ends', () => {
    expect(moveInQueue(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveInQueue(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveInQueue(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveInQueue(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});
