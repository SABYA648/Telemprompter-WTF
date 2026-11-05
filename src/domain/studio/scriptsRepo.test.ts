import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScript,
  getScript,
  listScripts,
  migrateQuickScript,
  restoreScript,
  softDelete,
} from './scriptsRepo';
import { resetDbForTests } from './db';

const storage = new Map<string, string>();
beforeEach(() =>
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    clear: () => storage.clear(),
  }),
);
afterEach(async () => {
  await resetDbForTests();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('teleprompter-wtf');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });
  storage.clear();
  vi.unstubAllGlobals();
});
describe('scripts repository', () => {
  it('creates, soft deletes and restores a script', async () => {
    const script = await createScript({ title: 'Test' });
    expect((await listScripts()).map((item) => item.id)).toContain(script.id);
    await softDelete(script.id);
    expect(await listScripts()).toEqual([]);
    await restoreScript(script.id);
    expect((await getScript(script.id))?.deletedAt).toBeNull();
  });
  it('imports the legacy quick script only once', async () => {
    localStorage.setItem('teleprompter-wtf.state', JSON.stringify({ script: 'Old local script' }));
    await migrateQuickScript();
    expect((await getScript('quick'))?.body).toBe('Old local script');
    localStorage.setItem(
      'teleprompter-wtf.state',
      JSON.stringify({ script: 'Changed old script' }),
    );
    await migrateQuickScript();
    expect((await getScript('quick'))?.body).toBe('Old local script');
  });
});

describe('library recovery', () => {
  it('keeps a prior quick script when migrating and does not reseed after deletion', async () => {
    const { ensureFirstScript, purgeDeletedScripts } = await import('./scriptsRepo');
    await createScript({ id: 'quick', title: 'My script', body: 'New work' });
    localStorage.setItem('teleprompter-wtf.state', JSON.stringify({ script: 'Old work' }));
    await migrateQuickScript();
    expect((await getScript('quick'))?.body).toBe('New work');
    await ensureFirstScript();
    await softDelete('quick');
    expect(await ensureFirstScript()).toBeUndefined();
    expect(await purgeDeletedScripts(Date.now() + 31 * 86400000)).toBe(1);
    expect(await getScript('quick')).toBeUndefined();
  });
  it('duplicates all editable fields with a fresh identity', async () => {
    const { duplicateScript } = await import('./scriptsRepo');
    const original = await createScript({ body: 'Keep this text', status: 'ready' });
    const copy = await duplicateScript(original.id);
    expect(copy?.id).not.toBe(original.id);
    expect(copy).toMatchObject({ body: 'Keep this text', status: 'ready', deletedAt: null });
  });
  it('revives a deleted quick script when the homepage sends new text', async () => {
    const { openInStudio } = await import('./handoff');
    await createScript({ id: 'quick', body: 'Old text' });
    await softDelete('quick');
    const location = { href: '' };
    vi.stubGlobal('location', location);
    await openInStudio('New text');
    expect(await getScript('quick')).toMatchObject({ body: 'New text', deletedAt: null });
    expect(location.href).toBe('/studio#/scripts/quick');
  });
});
