import { describe, expect, it } from 'vitest';
import { INSTALL_COOLDOWN_MS, installAskAllowed, installPlatform, installState } from './install';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

describe('install state', () => {
  const ios = { userAgent: IPHONE, standalone: false, iosStandalone: false, promptable: false };
  it('prioritizes installed, in-app, promptable, iOS manual, then unsupported', () => {
    expect(installState(ios)).toBe('ios_manual');
    expect(installState({ ...ios, promptable: true })).toBe('promptable');
    expect(installState({ ...ios, iosStandalone: true })).toBe('installed');
    expect(installState({ ...ios, standalone: true, promptable: true })).toBe('installed');
    expect(installState({ ...ios, userAgent: `${IPHONE} Instagram`, promptable: true })).toBe(
      'in_app_browser',
    );
    expect(installState({ ...ios, userAgent: 'Firefox' })).toBe('unsupported');
    expect(installState({ ...ios, userAgent: ANDROID })).toBe('unsupported');
    expect(installState({ ...ios, userAgent: ANDROID, promptable: true })).toBe('promptable');
  });
  it('offers the Safari steps only in Safari', () => {
    for (const browser of ['CriOS/120.0', 'FxiOS/120.0', 'EdgiOS/120.0'])
      expect(installState({ ...ios, userAgent: `${IPHONE} ${browser}` })).toBe('unsupported');
  });
  it('recognizes iPadOS Safari by touch, not by its desktop user agent', () => {
    expect(installState({ ...ios, userAgent: MAC, maxTouchPoints: 5 })).toBe('ios_manual');
    expect(installState({ ...ios, userAgent: MAC, maxTouchPoints: 0 })).toBe('unsupported');
    expect(installPlatform(MAC, 5)).toBe('ios');
    expect(installPlatform(MAC)).toBe('desktop');
  });
  it('names the platform for analytics', () => {
    expect(installPlatform(IPHONE)).toBe('ios');
    expect(installPlatform(ANDROID)).toBe('android');
    expect(installPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('desktop');
  });
});

describe('install ask ladder', () => {
  const base = {
    exports: 0,
    sessions: 1,
    shown: 0,
    dismissedAt: 0,
    now: 10 * 86400000,
    shownThisSession: false,
    recording: false,
  };
  it('asks after export or second session, with cooldown and session cap', () => {
    expect(installAskAllowed(base)).toBe(false);
    expect(installAskAllowed({ ...base, exports: 1 })).toBe(true);
    expect(installAskAllowed({ ...base, sessions: 2 })).toBe(true);
    expect(installAskAllowed({ ...base, sessions: 2, shownThisSession: true })).toBe(false);
    expect(installAskAllowed({ ...base, sessions: 2, shown: 2 })).toBe(true);
    expect(installAskAllowed({ ...base, sessions: 2, shown: 3 })).toBe(false);
  });
  it('never asks during recording, whatever else has earned it', () => {
    expect(installAskAllowed({ ...base, exports: 5, sessions: 9, recording: true })).toBe(false);
  });
  it('holds a dismissal for exactly seven days', () => {
    const ask = (dismissedAt: number) => installAskAllowed({ ...base, sessions: 2, dismissedAt });
    expect(ask(base.now - INSTALL_COOLDOWN_MS + 1)).toBe(false);
    expect(ask(base.now - INSTALL_COOLDOWN_MS)).toBe(true);
    expect(INSTALL_COOLDOWN_MS).toBe(7 * 86400000);
  });
});
