import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, expect, it, vi } from 'vitest';
import { getDb, resetDbForTests } from './db';
import {
  assignArm,
  EXPERIMENTS,
  experimentArms,
  MAX_LIVE_EXPERIMENTS,
  storedArm,
} from './experiments';
import { loadSettings } from './settings';

const store = new Map<string, string>();
beforeEach(async () => {
  await resetDbForTests();
  globalThis.indexedDB = new IDBFactory();
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});
it('runs at most two live experiments', () => {
  expect(EXPERIMENTS.length).toBeLessThanOrEqual(MAX_LIVE_EXPERIMENTS);
  expect(MAX_LIVE_EXPERIMENTS).toBe(2);
});
it('assigns deterministically from the device id and splits devices across both arms', () => {
  expect(assignArm('AAAAAAAAAAAAAAAAAAAAAA', 'countdown')).toBe(
    assignArm('AAAAAAAAAAAAAAAAAAAAAA', 'countdown'),
  );
  const ids = Array.from({ length: 400 }, (_, i) => `device-${i}`.padEnd(22, 'x'));
  const variants = ids.filter((id) => assignArm(id, 'priming_copy') === 'variant').length;
  expect(variants).toBeGreaterThan(150);
  expect(variants).toBeLessThan(250);
});
it('stores arms in kv, keeps them stable and mirrors only the arm for session data', async () => {
  store.set('tw.did', 'BBBBBBBBBBBBBBBBBBBBBB');
  const first = await experimentArms();
  expect(Object.keys(first)).toEqual(['priming_copy', 'countdown']);
  expect(first.countdown).toBe(assignArm('BBBBBBBBBBBBBBBBBBBBBB', 'countdown'));
  store.set('tw.did', 'CCCCCCCCCCCCCCCCCCCCCC');
  expect(await experimentArms()).toEqual(first);
  expect(storedArm('countdown')).toBe(first.countdown);
  expect([...store.values()]).not.toContain('experiment.countdown');
});
it('applies the countdown arm only to newly created settings', async () => {
  const db = await getDb();
  await db.put('kv', 'variant', 'experiment.countdown');
  await db.put('kv', 'control', 'experiment.priming_copy');
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const settings = await loadSettings();
  expect(settings.recording.countdownSeconds).toBe(0);
  await db.put(
    'kv',
    { ...settings, recording: { ...settings.recording, countdownSeconds: 5 } },
    'settings',
  );
  expect((await loadSettings()).recording.countdownSeconds).toBe(5);
});
