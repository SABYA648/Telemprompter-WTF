import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  SETTING_LIMITS,
  clamp,
  sanitizePreferences,
  speedToPixelsPerSecond,
} from './settings';

describe('presenter settings', () => {
  it('clamps numeric settings to safe limits', () => {
    const result = sanitizePreferences({
      fontSize: 500,
      lineHeight: -2,
      textWidth: 999,
      baseScrollSpeed: 0,
      focusPosition: 90,
      speakingWpm: 500,
    });

    expect(result.fontSize).toBe(SETTING_LIMITS.fontSize.max);
    expect(result.lineHeight).toBe(SETTING_LIMITS.lineHeight.min);
    expect(result.textWidth).toBe(SETTING_LIMITS.textWidth.max);
    expect(result.baseScrollSpeed).toBe(SETTING_LIMITS.baseScrollSpeed.min);
    expect(result.focusPosition).toBe(SETTING_LIMITS.focusPosition.max);
    expect(result.speakingWpm).toBe(SETTING_LIMITS.speakingWpm.max);
  });

  it('uses safe defaults for invalid values', () => {
    const result = sanitizePreferences({ fontSize: Number.NaN, alignment: 'right' as 'left' });
    expect(result.fontSize).toBe(DEFAULT_PREFERENCES.fontSize);
    expect(result.alignment).toBe('left');
    expect(result.focusLine).toBe(true);
    expect(result.voiceMode).toBe('manual');
    expect(sanitizePreferences({ voiceMode: 'precision' }).voiceMode).toBe('precision');
  });

  it('maps the speed scale monotonically', () => {
    expect(speedToPixelsPerSecond(10)).toBeGreaterThan(speedToPixelsPerSecond(1));
    expect(speedToPixelsPerSecond(999)).toBe(speedToPixelsPerSecond(10));
    expect(clamp(5, 1, 10)).toBe(5);
  });
});
