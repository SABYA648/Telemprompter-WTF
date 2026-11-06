import { getDb } from './db';
import { experimentArms } from './experiments';
import type { KeyAction, StudioSettings } from './types';
export const KEY_ACTIONS: KeyAction[] = [
  'toggleScroll',
  'faster',
  'slower',
  'lineForward',
  'lineBack',
  'sectionForward',
  'sectionBack',
  'toggleRecord',
  'restart',
];
export const DEFAULT_KEYS: StudioSettings['keys'] = {
  toggleScroll: [' ', 'Enter', 'b', '.', 'MediaPlayPause'],
  faster: ['ArrowUp'],
  slower: ['ArrowDown'],
  lineForward: ['PageDown', 'ArrowRight'],
  lineBack: ['PageUp', 'ArrowLeft'],
  sectionForward: ['n'],
  sectionBack: ['p'],
  toggleRecord: ['r', 'F5'],
  restart: ['Home'],
};
export function defaultSettings(phone: boolean): StudioSettings {
  return {
    version: 1,
    camera: {
      deviceId: null,
      facing: 'user',
      aspect: phone ? '9:16' : '16:9',
      resolution: '1080p',
      frameRate: 30,
      mirrorPreview: true,
      grid: 'off',
      safeZone: phone ? 'instagram' : 'off',
      level: false,
      screenLight: 'off',
      advanced: {},
    },
    mic: {
      deviceId: null,
      processing: 'standard',
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      audioBitrate: 128000,
    },
    recording: {
      format: 'auto',
      quality: 'high',
      countdownSeconds: 3,
      autoStopAtTarget: false,
      autoStartScroll: true,
      stopAtSectionEnd: true,
      pauseButton: true,
      keepScreenAwake: true,
      touchLock: false,
    },
    prompter: {
      wpm: 140,
      fitToTarget: true,
      fontSizePx: phone ? 30 : 40,
      lineHeight: 1.35,
      widthPct: phone ? 92 : 46,
      align: 'left',
      fontFamily: 'system',
      textColor: '#ffffff',
      scrimOpacity: 0.55,
      windowLines: phone ? 4 : 6,
      dock: 'auto',
      cuePosition: 0.3,
      cueStyle: 'band',
      autoPauseMarkers: true,
      showCues: true,
      mirrorText: 'off',
      showElapsed: true,
      showRemaining: true,
    },
    keys: structuredClone(DEFAULT_KEYS),
    reminders: { fileDownloaded: false, askEnabled: true, time: '19:00' },
    habit: {
      weeklyGoal: 5,
      streaksEnabled: true,
      dailyPromptEnabled: true,
      goalsEnabled: true,
      badgesEnabled: true,
      challengeEnabled: true,
      ratingEnabled: true,
      statsEnabled: true,
      recapEnabled: true,
      shareCardsEnabled: true,
    },
  };
}
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const choice = <T extends string | number>(v: unknown, values: readonly T[], fallback: T): T =>
  values.includes(v as T) ? (v as T) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const num = (v: unknown, fallback: number, min: number, max: number, step = 0) => {
  const n =
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
  return step ? Math.min(max, min + Math.round((n - min) / step) * step) : n;
};
const id = (v: unknown) => (typeof v === 'string' && v.length <= 256 && v ? v : null);
export function sanitizeSettings(raw: unknown, phone: boolean): StudioSettings {
  const d = defaultSettings(phone),
    r = record(raw),
    c = record(r.camera),
    m = record(r.mic),
    t = record(r.recording),
    p = record(r.prompter),
    k = record(r.keys),
    h = record(r.habit),
    rem = record(r.reminders);
  const advanced: StudioSettings['camera']['advanced'] = {};
  for (const [device, values] of Object.entries(record(c.advanced)).slice(0, 20)) {
    if (
      !device ||
      device.length > 256 ||
      ['__proto__', 'constructor', 'prototype'].includes(device)
    )
      continue;
    const clean: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(record(values))) {
      if (key === 'torch') {
        if (typeof value === 'boolean') clean[key] = value;
        continue;
      }
      if (['focusMode', 'exposureMode', 'whiteBalanceMode'].includes(key)) {
        if (typeof value === 'string' && value.length < 50) clean[key] = value;
        continue;
      }
      if (
        [
          'zoom',
          'focusDistance',
          'exposureCompensation',
          'exposureTime',
          'iso',
          'colorTemperature',
          'brightness',
          'contrast',
          'saturation',
          'sharpness',
        ].includes(key) &&
        typeof value === 'number' &&
        Number.isFinite(value)
      )
        clean[key] = Math.max(-100000, Math.min(100000, value));
    }
    advanced[device] = clean;
  }
  const keys = structuredClone(d.keys);
  for (const action of KEY_ACTIONS)
    if (Array.isArray(k[action]))
      keys[action] = (k[action] as unknown[])
        .filter((v): v is string => typeof v === 'string' && v.length <= 32)
        .slice(0, 8);
  return {
    version: 1,
    camera: {
      deviceId: id(c.deviceId),
      facing: choice(c.facing, ['user', 'environment'], d.camera.facing),
      aspect: choice(c.aspect, ['9:16', '16:9'], d.camera.aspect),
      resolution: choice(c.resolution, ['720p', '1080p', '2160p'], d.camera.resolution),
      frameRate: choice(c.frameRate, [24, 25, 30, 50, 60], d.camera.frameRate),
      mirrorPreview: bool(c.mirrorPreview, true),
      grid: choice(c.grid, ['off', 'thirds'], 'off'),
      safeZone: choice(
        c.safeZone,
        ['off', 'instagram', 'youtube_shorts', 'tiktok'],
        d.camera.safeZone,
      ),
      level: bool(c.level, false),
      screenLight: choice(c.screenLight, ['off', 'soft', 'bright'], 'off'),
      advanced,
    },
    mic: {
      deviceId: id(m.deviceId),
      processing: choice(m.processing, ['standard', 'raw', 'custom'], 'standard'),
      echoCancellation: bool(m.echoCancellation, true),
      noiseSuppression: bool(m.noiseSuppression, true),
      autoGainControl: bool(m.autoGainControl, true),
      channelCount: choice(m.channelCount, [1, 2], 1),
      audioBitrate: choice(m.audioBitrate, [128000, 192000, 256000], 128000),
    },
    recording: {
      format: choice(t.format, ['auto', 'mp4', 'webm'], 'auto'),
      quality: choice(t.quality, ['standard', 'high', 'max'], 'high'),
      countdownSeconds: choice(t.countdownSeconds, [0, 3, 5, 10], 3),
      autoStopAtTarget: bool(t.autoStopAtTarget, false),
      autoStartScroll: bool(t.autoStartScroll, true),
      stopAtSectionEnd: bool(t.stopAtSectionEnd, true),
      pauseButton: bool(t.pauseButton, true),
      keepScreenAwake: bool(t.keepScreenAwake, true),
      touchLock: bool(t.touchLock, false),
    },
    prompter: {
      wpm: num(p.wpm, 140, 80, 240, 5),
      fitToTarget: bool(p.fitToTarget, true),
      fontSizePx: num(p.fontSizePx, d.prompter.fontSizePx, 16, 96),
      lineHeight: num(p.lineHeight, 1.35, 1.1, 1.8),
      widthPct: num(p.widthPct, d.prompter.widthPct, 30, 100),
      align: choice(p.align, ['left', 'center'], 'left'),
      fontFamily: choice(p.fontFamily, ['system', 'readable', 'serif'], 'system'),
      textColor: choice(p.textColor, ['#ffffff', '#f6f0e4', '#ffe066'], '#ffffff'),
      scrimOpacity: num(p.scrimOpacity, 0.55, 0, 0.9),
      windowLines: num(p.windowLines, d.prompter.windowLines, 2, 12),
      dock: choice(p.dock, ['auto', 'top', 'left', 'right', 'center'], 'auto'),
      cuePosition: num(p.cuePosition, 0.3, 0.15, 0.6),
      cueStyle: choice(p.cueStyle, ['band', 'arrow', 'line', 'off'], 'band'),
      autoPauseMarkers: bool(p.autoPauseMarkers, true),
      showCues: bool(p.showCues, true),
      mirrorText: choice(p.mirrorText, ['off', 'horizontal', 'vertical', 'both'], 'off'),
      showElapsed: bool(p.showElapsed, true),
      showRemaining: bool(p.showRemaining, true),
    },
    keys,
    reminders: {
      // Older settings used "enabled" for a download, though import cannot be observed.
      fileDownloaded: bool(rem.fileDownloaded, bool(rem.enabled, false)),
      askEnabled: bool(rem.askEnabled, true),
      time:
        typeof rem.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(rem.time)
          ? rem.time
          : '19:00',
    },
    habit: {
      weeklyGoal: choice(h.weeklyGoal, [3, 5, 7], 5),
      streaksEnabled: bool(h.streaksEnabled, true),
      dailyPromptEnabled: bool(h.dailyPromptEnabled, true),
      goalsEnabled: bool(h.goalsEnabled, true),
      badgesEnabled: bool(h.badgesEnabled, true),
      challengeEnabled: bool(h.challengeEnabled, true),
      ratingEnabled: bool(h.ratingEnabled, true),
      statsEnabled: bool(h.statsEnabled, true),
      recapEnabled: bool(h.recapEnabled, true),
      shareCardsEnabled: bool(h.shareCardsEnabled, true),
    },
  };
}
export function isPhone(): boolean {
  return matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600;
}
let saveQueue: Promise<void> = Promise.resolve();
export async function loadSettings(): Promise<StudioSettings> {
  const db = await getDb();
  const raw = await db.get('kv', 'settings');
  const settings = sanitizeSettings(raw, isPhone());
  if (!raw) {
    const arms = await experimentArms();
    if (arms.countdown === 'variant') settings.recording.countdownSeconds = 0;
    const previous = (await db.get('kv', 'record.quick')) as Record<string, unknown> | undefined;
    if (previous) {
      settings.camera.facing = previous.facing === 'environment' ? 'environment' : 'user';
      settings.camera.deviceId = typeof previous.deviceId === 'string' ? previous.deviceId : null;
      settings.camera.resolution =
        previous.resolution === '720p' || previous.resolution === '2160p'
          ? previous.resolution
          : '1080p';
      settings.camera.safeZone = ['off', 'instagram', 'youtube_shorts', 'tiktok'].includes(
        String(previous.safeZone),
      )
        ? (previous.safeZone as StudioSettings['camera']['safeZone'])
        : settings.camera.safeZone;
      settings.camera.grid = previous.grid ? 'thirds' : 'off';
      settings.recording.countdownSeconds = [0, 3, 5, 10].includes(Number(previous.countdown))
        ? (previous.countdown as StudioSettings['recording']['countdownSeconds'])
        : 3;
    }
    await db.put('kv', settings, 'settings');
  }
  return settings;
}
export function saveSettings(settings: StudioSettings): Promise<void> {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      await (await getDb()).put('kv', settings, 'settings');
      dispatchEvent(new CustomEvent('studio-settings-change', { detail: settings }));
    });
  return saveQueue;
}
