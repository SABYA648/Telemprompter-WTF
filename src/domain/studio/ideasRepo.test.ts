import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { beforeEach, expect, it, vi } from 'vitest';
import { resetDbForTests } from './db';
import { createIdea, deleteIdea, listIdeas } from './ideasRepo';

beforeEach(() => {
  resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
});

it('stores trimmed ideas, newest first, and deletes them', async () => {
  const now = vi.spyOn(Date, 'now');
  now.mockReturnValue(100);
  const older = await createIdea('  First thought  ');
  now.mockReturnValue(200);
  const newer = await createIdea('Second thought');
  now.mockRestore();
  expect(older.text).toBe('First thought');
  expect((await listIdeas()).map((idea) => idea.id)).toEqual([newer.id, older.id]);
  await deleteIdea(newer.id);
  expect((await listIdeas()).map((idea) => idea.id)).toEqual([older.id]);
});

it('refuses an empty idea and caps long text', async () => {
  await expect(createIdea('   ')).rejects.toThrow('Write an idea first.');
  expect((await createIdea('x'.repeat(10001))).text).toHaveLength(10000);
});
