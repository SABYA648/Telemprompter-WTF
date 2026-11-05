import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb, resetDbForTests } from './db';
import { blankScript } from './scriptsRepo';
import { defaultSettings, loadSettings, saveSettings } from './settings';
import { decodeTransfer, encodeTransfer, exportTransfer, importTransfer } from './transfer';
import type { StudioScript } from './types';

const DID = 'AbCdEfGhIjKlMnOpQrStUv';
const MB = 1024 * 1024;
const script = (partial: Partial<StudioScript> = {}): StudioScript => ({
  ...blankScript(1000),
  id: 'script-1',
  title: 'Exported title',
  body: 'Exported body',
  ...partial,
});
const payload = (partial: Record<string, unknown> = {}) => ({
  scripts: [script()],
  ideas: [{ id: 'idea-1', text: 'An idea', createdAt: 5 }],
  settings: defaultSettings(false),
  streak: { current: 2, activeDates: ['2026-11-05'] },
  did: DID,
  ...partial,
});
const base64url = (bytes: Uint8Array) => {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const rawCode = (text: string, flag = 0) => {
  const body = new TextEncoder().encode(text);
  const bytes = new Uint8Array(body.length + 1);
  bytes[0] = flag;
  bytes.set(body, 1);
  return `T1.${base64url(bytes)}`;
};
const deflate = async (text: string) => {
  const compressed = await new Response(
    new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw')),
  ).arrayBuffer();
  const bytes = new Uint8Array(compressed.byteLength + 1);
  bytes[0] = 1;
  bytes.set(new Uint8Array(compressed), 1);
  return `T1.${base64url(bytes)}`;
};
/** Replace all device state, as a Home Screen app with its own storage would have. */
const freshDevice = async () => {
  await resetDbForTests();
  vi.stubGlobal('indexedDB', new IDBFactory());
  values.clear();
};
const values = new Map<string, string>();

beforeEach(async () => {
  values.clear();
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('dispatchEvent', vi.fn());
  vi.stubGlobal('innerWidth', 1440);
  vi.stubGlobal('innerHeight', 900);
});
afterEach(async () => {
  await resetDbForTests();
  vi.unstubAllGlobals();
});

describe('transfer round trip', () => {
  it('restores scripts, ideas, settings, streak and the device id on a fresh device', async () => {
    values.set('tw.did', DID);
    const db = await getDb();
    await db.put('scripts', script());
    await db.put('ideas', { id: 'idea-1', text: 'An idea', createdAt: 5 });
    await db.put('kv', { current: 2, best: 2 }, 'streak');
    const settings = defaultSettings(false);
    settings.prompter.dock = 'left';
    await saveSettings(settings);
    const code = await exportTransfer();
    expect(code.startsWith('T1.')).toBe(true);
    expect(code).toMatch(/^T1\.[A-Za-z0-9_-]+$/);

    await freshDevice();
    expect(await importTransfer(code)).toEqual({ scripts: 1, ideas: 1 });
    const next = await getDb();
    expect(await next.get('scripts', 'script-1')).toMatchObject({
      title: 'Exported title',
      body: 'Exported body',
    });
    expect(await next.get('ideas', 'idea-1')).toMatchObject({ text: 'An idea' });
    expect(await next.get('kv', 'streak')).toEqual({ current: 2, best: 2 });
    expect((await loadSettings()).prompter.dock).toBe('left');
    expect(values.get('tw.did')).toBe(DID);
  });
  it('never carries takes or chunks, and resets take counts on a new device', async () => {
    values.set('tw.did', DID);
    const db = await getDb();
    await db.put('scripts', script({ takeCount: 4, lastRecordedAt: 900 }));
    await db.put('takes', { id: 'take-1', scriptId: 'script-1', createdAt: 1, status: 'ready' });
    await db.put('chunks', { takeId: 'take-1', seq: 0, blob: new Blob(['video']) });
    const code = await exportTransfer();
    expect(Object.keys(await decodeTransfer(code)).sort()).toEqual([
      'did',
      'ideas',
      'scripts',
      'settings',
      'streak',
    ]);
    await freshDevice();
    await importTransfer(code);
    const next = await getDb();
    expect(await next.getAll('takes')).toEqual([]);
    expect(await next.getAll('chunks')).toEqual([]);
    expect(await next.get('scripts', 'script-1')).toMatchObject({
      takeCount: 0,
      lastRecordedAt: null,
    });
  });
  it('ignores takes smuggled into a crafted code', async () => {
    await importTransfer(
      await encodeTransfer(payload({ takes: [{ id: 'evil', scriptId: 'x' }], chunks: ['y'] })),
    );
    expect(await (await getDb()).getAll('takes')).toEqual([]);
  });
});

describe('transfer merge', () => {
  it('lets the newest updatedAt win and keeps local take data', async () => {
    const db = await getDb();
    await db.put('scripts', script({ title: 'Older local', updatedAt: 10, takeCount: 3 }));
    await db.put('scripts', script({ id: 'newer', title: 'Newer local', updatedAt: 99 }));
    await db.put('scripts', script({ id: 'same', title: 'Same local', updatedAt: 50 }));
    const result = await importTransfer(
      await encodeTransfer(
        payload({
          scripts: [
            script({ title: 'Newer remote', updatedAt: 20, takeCount: 9 }),
            script({ id: 'newer', title: 'Older remote', updatedAt: 40 }),
            script({ id: 'same', title: 'Same remote', updatedAt: 50 }),
            script({ id: 'added', title: 'Only remote', updatedAt: 1 }),
          ],
        }),
      ),
    );
    expect(result.scripts).toBe(2);
    expect(await db.get('scripts', 'script-1')).toMatchObject({
      title: 'Newer remote',
      takeCount: 3,
    });
    expect(await db.get('scripts', 'newer')).toMatchObject({ title: 'Newer local' });
    expect(await db.get('scripts', 'same')).toMatchObject({ title: 'Same local' });
    expect(await db.get('scripts', 'added')).toMatchObject({ title: 'Only remote' });
  });
  it('merges ideas by id and counts only new ones when imported twice', async () => {
    const code = await encodeTransfer(payload());
    expect(await importTransfer(code)).toEqual({ scripts: 1, ideas: 1 });
    expect(await importTransfer(code)).toEqual({ scripts: 0, ideas: 0 });
    expect(await (await getDb()).getAll('ideas')).toHaveLength(1);
  });
  it('leaves the streak alone when the code has none', async () => {
    const db = await getDb();
    await db.put('kv', { current: 9 }, 'streak');
    await importTransfer(await encodeTransfer(payload({ streak: null })));
    expect(await db.get('kv', 'streak')).toEqual({ current: 9 });
  });
});

describe('transfer limits', () => {
  it('refuses to export more than 1 MB', async () => {
    values.set('tw.did', DID);
    await (await getDb()).put('scripts', script({ body: 'x'.repeat(MB + 1) }));
    await expect(exportTransfer()).rejects.toThrow('Transfer exceeds 1 MB');
  });
  it('accepts exactly 1 MB decoded and refuses one byte more, raw and compressed', async () => {
    const empty = JSON.stringify(payload({ scripts: [], ideas: [], padding: '' }));
    const sized = (bytes: number) =>
      JSON.stringify(
        payload({ scripts: [], ideas: [], padding: 'x'.repeat(bytes - empty.length) }),
      );
    expect(sized(MB)).toHaveLength(MB);
    await expect(decodeTransfer(rawCode(sized(MB)))).resolves.toMatchObject({ did: DID });
    await expect(decodeTransfer(await deflate(sized(MB)))).resolves.toMatchObject({ did: DID });
    await expect(decodeTransfer(rawCode(sized(MB + 1)))).rejects.toThrow('Transfer exceeds 1 MB');
    await expect(decodeTransfer(await deflate(sized(MB + 1)))).rejects.toThrow(
      'Transfer exceeds 1 MB',
    );
  });
  it('stops a decompression bomb and writes nothing', async () => {
    const bomb = await deflate(' '.repeat(20 * MB));
    expect(bomb.length).toBeLessThan(MB);
    await expect(importTransfer(bomb)).rejects.toThrow('Transfer exceeds 1 MB');
    expect(await (await getDb()).getAll('scripts')).toEqual([]);
  });
  it('refuses an oversized code before decoding it', async () => {
    const atob = vi.spyOn(globalThis, 'atob');
    await expect(decodeTransfer(`T1.${'A'.repeat(2 * MB)}`)).rejects.toThrow(
      'Transfer exceeds 1 MB',
    );
    expect(atob).not.toHaveBeenCalled();
    atob.mockRestore();
  });
});

describe('transfer codec', () => {
  it('compresses when it helps and marks raw bytes otherwise', async () => {
    const compressed = await encodeTransfer(payload({ padding: 'x'.repeat(5000) }));
    expect(atob(compressed.slice(3).replace(/-/g, '+').replace(/_/g, '/')).charCodeAt(0)).toBe(1);
    vi.stubGlobal('CompressionStream', undefined);
    const raw = await encodeTransfer(payload());
    expect(atob(raw.slice(3).replace(/-/g, '+').replace(/_/g, '/')).charCodeAt(0)).toBe(0);
    await expect(decodeTransfer(raw)).resolves.toMatchObject({ did: DID });
  });
  it('falls back to raw bytes when deflate-raw is refused', async () => {
    vi.stubGlobal(
      'CompressionStream',
      class {
        constructor() {
          throw new Error('unsupported');
        }
      },
    );
    const code = await encodeTransfer(payload({ padding: 'x'.repeat(5000) }));
    expect(atob(code.slice(3).replace(/-/g, '+').replace(/_/g, '/')).charCodeAt(0)).toBe(0);
  });
  it('explains that a compressed code cannot be read without DecompressionStream', async () => {
    const code = await encodeTransfer(payload({ padding: 'x'.repeat(5000) }));
    vi.stubGlobal('DecompressionStream', undefined);
    await expect(decodeTransfer(code)).rejects.toThrow('cannot read compressed');
  });
  it('tolerates whitespace around a pasted code and keeps Unicode intact', async () => {
    const code = await encodeTransfer(payload({ scripts: [script({ body: 'नमस्ते 日本語 🎬' })] }));
    const decoded = await decodeTransfer(`  \n${code}\n `);
    expect(decoded.scripts[0]?.body).toBe('नमस्ते 日本語 🎬');
  });
});

describe('transfer validation', () => {
  const invalid = 'Invalid transfer code';
  it.each([
    ['empty', ''],
    ['another prefix', 'S1.AAAA'],
    ['prefix only', 'T1.'],
    ['bad alphabet', 'T1.a+b/c='],
    ['impossible base64 length', 'T1.AAAAA'],
    ['unknown flag', rawCode('{}', 7)],
    ['corrupt deflate', rawCode('not deflate data', 1)],
    ['not JSON', rawCode('nope')],
    ['JSON null', rawCode('null')],
    ['an array', rawCode('[]')],
    ['invalid UTF-8', `T1.${base64url(Uint8Array.from([0, 0xff, 0xfe]))}`],
  ])('rejects %s', async (_name, code) => {
    await expect(importTransfer(code)).rejects.toThrow(invalid);
  });
  const bad = (partial: Record<string, unknown>) => rawCode(JSON.stringify(payload(partial)));
  const badScript = (partial: Record<string, unknown>) =>
    bad({ scripts: [{ ...script(), ...partial }] });
  it.each([
    ['a short device id', bad({ did: 'short' })],
    ['a device id with symbols', bad({ did: '<script>alert(1)</script>xx' })],
    ['a numeric device id', bad({ did: 12345 })],
    ['missing settings', bad({ settings: null })],
    ['scripts that are not a list', bad({ scripts: {} })],
    ['ideas that are not a list', bad({ ideas: 'x' })],
    ['a script without an id', badScript({ id: '' })],
    ['a script with an object id', badScript({ id: { evil: true } })],
    ['an overlong script id', badScript({ id: 'x'.repeat(129) })],
    ['an unknown status', badScript({ status: 'evil' })],
    ['an unknown aspect', badScript({ aspect: '1:1' })],
    ['a text timestamp', badScript({ updatedAt: 'soon' })],
    ['a negative timestamp', badScript({ createdAt: -1 })],
    ['a non-finite target', bad({ scripts: [{ ...script(), targetSeconds: null }] })],
    ['a null title', badScript({ title: null })],
    ['an overlong idea', bad({ ideas: [{ id: 'a', text: 'x'.repeat(10001), createdAt: 1 }] })],
    ['a deep streak', bad({ streak: { a: { b: { c: { d: { e: { f: 1 } } } } } } })],
    [
      'a streak with a prototype key',
      rawCode(`${JSON.stringify(payload()).slice(0, -1)},"streak":{"__proto__":1}}`),
    ],
  ])('rejects %s and writes nothing', async (_name, code) => {
    await expect(importTransfer(code)).rejects.toThrow(invalid);
    const db = await getDb();
    expect(await db.getAll('scripts')).toEqual([]);
    expect(await db.getAll('ideas')).toEqual([]);
    expect(values.get('tw.did')).toBeUndefined();
  });
  it('validates every row before it writes any of them', async () => {
    const code = bad({ scripts: [script({ id: 'good' }), { ...script(), status: 'evil' }] });
    await expect(importTransfer(code)).rejects.toThrow(invalid);
    expect(await (await getDb()).get('scripts', 'good')).toBeUndefined();
  });
  it('strips unknown fields and sanitizes settings', async () => {
    await importTransfer(
      rawCode(
        JSON.stringify(
          payload({
            scripts: [{ ...script(), evil: '<img>' }],
            ideas: [{ id: 'a', text: 'b', createdAt: 1, evil: true }],
            settings: { prompter: { wpm: 999999, dock: 'bad' }, evil: true },
          }),
        ),
      ),
    );
    const db = await getDb();
    expect(await db.get('scripts', 'script-1')).not.toHaveProperty('evil');
    expect(await db.get('ideas', 'a')).not.toHaveProperty('evil');
    const settings = await loadSettings();
    expect(settings).not.toHaveProperty('evil');
    expect(settings.prompter.wpm).toBeLessThan(999999);
    expect(settings.prompter.dock).not.toBe('bad');
  });
});
