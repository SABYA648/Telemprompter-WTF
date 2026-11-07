import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySessionPreset,
  applySessionTarget,
  defaultSettings,
  endSessionTarget,
  loadSettings,
  sanitizeSettings,
  saveSettings,
  sessionTargetSeconds,
} from './settings';
import { getDb, resetDbForTests } from './db';
import { cameraConstraints } from './camera';
afterEach(async () => {
  applySessionPreset(null);
  await resetDbForTests();
  vi.unstubAllGlobals();
});
describe('Studio settings', () => {
  it('chooses phone and desktop defaults once', () => {
    expect(defaultSettings(true).camera.aspect).toBe('9:16');
    expect(defaultSettings(false).camera.aspect).toBe('16:9');
    expect(defaultSettings(true).prompter.fontSizePx).toBe(30);
    expect(defaultSettings(false).prompter.fontSizePx).toBe(40);
  });
  it('clamps numbers and replaces malformed values', () => {
    const s = sanitizeSettings(
      {
        version: 9,
        camera: {
          frameRate: 99,
          resolution: '8K',
          advanced: { device: { zoom: Infinity, torch: true, evil: 'text' } },
        },
        prompter: { wpm: 999, fontSizePx: -5, lineHeight: 9, dock: 'bad' },
        keys: { toggleRecord: ['F5', null, 123] },
        reminders: { time: '25:99' },
      },
      true,
    );
    expect(s.version).toBe(1);
    expect(s.camera.resolution).toBe('1080p');
    expect(s.camera.frameRate).toBe(30);
    expect(s.prompter.wpm).toBe(240);
    expect(s.prompter.fontSizePx).toBe(16);
    expect(s.prompter.lineHeight).toBe(1.8);
    expect(s.prompter.dock).toBe('auto');
    expect(s.camera.advanced.device).toEqual({ torch: true });
    expect(s.keys.toggleRecord).toEqual(['F5']);
    expect(s.reminders.time).toBe('19:00');
  });
  it('persists the whole object under settings', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('innerWidth', 390);
    vi.stubGlobal('innerHeight', 844);
    const original = await loadSettings();
    const next = {
      ...original,
      camera: { ...original.camera, resolution: '720p' as const },
      mic: { ...original.mic, processing: 'raw' as const },
    };
    vi.stubGlobal('dispatchEvent', () => true);
    await saveSettings(next);
    expect(await loadSettings()).toEqual(next);
  });
  it('keeps a preset in this tab until the visitor saves a setting', async () => {
    const values = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    });
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('innerWidth', 390);
    vi.stubGlobal('innerHeight', 844);
    vi.stubGlobal('dispatchEvent', () => true);
    const saved = await loadSettings();
    applySessionPreset({ aspect: '16:9', safeZone: 'instagram' });
    expect((await loadSettings()).camera).toMatchObject({ aspect: '16:9', safeZone: 'instagram' });
    expect(values.has('studio.sessionPreset')).toBe(true);
    await saveSettings(saved);
    expect(values.has('studio.sessionPreset')).toBe(false);
    expect((await loadSettings()).camera).toMatchObject({
      aspect: saved.camera.aspect,
      safeZone: saved.camera.safeZone,
    });
  });
  it('saves an unrelated change without making the session preset global', async () => {
    const values = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('dispatchEvent', () => true);
    const base = await loadSettings();
    await saveSettings({ ...base, camera: { ...base.camera, aspect: '16:9', safeZone: 'off' } });
    applySessionPreset({ aspect: '9:16', safeZone: 'instagram' });
    const merged = await loadSettings();
    expect(merged.camera).toMatchObject({ aspect: '9:16', safeZone: 'instagram' });
    await saveSettings({ ...merged, prompter: { ...merged.prompter, fontSizePx: 52 } });
    const raw = (await (await getDb()).get('kv', 'settings')) as typeof merged;
    expect(raw.camera).toMatchObject({ aspect: '16:9', safeZone: 'off' });
    expect(raw.prompter.fontSizePx).toBe(52);
    expect(values.has('studio.sessionPreset')).toBe(true);
    expect((await loadSettings()).camera).toMatchObject({ aspect: '9:16', safeZone: 'instagram' });
    // An explicit camera change ends the override and is saved as asked.
    const current = await loadSettings();
    await saveSettings({ ...current, camera: { ...current.camera, safeZone: 'tiktok' } });
    expect(values.has('studio.sessionPreset')).toBe(false);
    const after = (await (await getDb()).get('kv', 'settings')) as typeof merged;
    expect(after.camera).toMatchObject({ aspect: '9:16', safeZone: 'tiktok' });
  });
  it('ends a preset target when the visitor edits that script target', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    });
    applySessionTarget({ id: 'quick', seconds: 0 });
    expect(sessionTargetSeconds('quick')).toBe(0);
    endSessionTarget('other');
    expect(sessionTargetSeconds('quick')).toBe(0);
    endSessionTarget('quick');
    expect(sessionTargetSeconds('quick')).toBeNull();
    expect(values.has('studio.sessionTarget')).toBe(false);
  });
  it('imports M4 quick camera preferences once', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.stubGlobal('innerWidth', 390);
    vi.stubGlobal('innerHeight', 844);
    await (await getDb()).delete('kv', 'settings');
    await (
      await getDb()
    ).put(
      'kv',
      { facing: 'environment', resolution: '720p', grid: true, countdown: 0 },
      'record.quick',
    );
    const settings = await loadSettings();
    expect(settings.camera.facing).toBe('environment');
    expect(settings.camera.resolution).toBe('720p');
    expect(settings.camera.grid).toBe('thirds');
    expect(settings.recording.countdownSeconds).toBe(0);
  });
  it('builds matching video and audio constraints', () => {
    const s = defaultSettings(true);
    s.camera.deviceId = 'camera-2';
    s.camera.resolution = '720p';
    s.camera.frameRate = 25;
    s.mic.deviceId = 'mic-2';
    s.mic.processing = 'raw';
    s.mic.channelCount = 2;
    const c = cameraConstraints({
      ...s.camera,
      audioDeviceId: s.mic.deviceId,
      processing: s.mic.processing,
      channelCount: s.mic.channelCount,
    });
    expect(c.video).toMatchObject({ deviceId: { exact: 'camera-2' }, frameRate: { ideal: 25 } });
    expect(c.audio).toMatchObject({
      deviceId: { ideal: 'mic-2' },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
    });
  });
});
