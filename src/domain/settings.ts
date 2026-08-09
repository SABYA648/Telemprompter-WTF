import type { PresenterPreferences } from './types';

export const SETTING_LIMITS = {
  fontSize: { min: 28, max: 112, step: 2 },
  lineHeight: { min: 1.15, max: 2, step: 0.05 },
  textWidth: { min: 45, max: 100, step: 5 },
  baseScrollSpeed: { min: 1, max: 10, step: 1 },
  focusPosition: { min: 25, max: 75, step: 5 },
  speakingWpm: { min: 80, max: 220, step: 5 },
} as const;

export const DEFAULT_PREFERENCES: PresenterPreferences = {
  fontSize: 56,
  lineHeight: 1.5,
  textWidth: 75,
  alignment: 'left',
  baseScrollSpeed: 4,
  mirror: false,
  verticalFlip: false,
  focusLine: true,
  focusPosition: 42,
  speakingWpm: 130,
  voiceMode: 'manual',
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sanitizePreferences(
  input: Partial<PresenterPreferences> | null | undefined,
): PresenterPreferences {
  const source = input ?? {};
  const numberOr = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return {
    fontSize: clamp(
      numberOr(source.fontSize, DEFAULT_PREFERENCES.fontSize),
      SETTING_LIMITS.fontSize.min,
      SETTING_LIMITS.fontSize.max,
    ),
    lineHeight: clamp(
      numberOr(source.lineHeight, DEFAULT_PREFERENCES.lineHeight),
      SETTING_LIMITS.lineHeight.min,
      SETTING_LIMITS.lineHeight.max,
    ),
    textWidth: clamp(
      numberOr(source.textWidth, DEFAULT_PREFERENCES.textWidth),
      SETTING_LIMITS.textWidth.min,
      SETTING_LIMITS.textWidth.max,
    ),
    baseScrollSpeed: clamp(
      numberOr(source.baseScrollSpeed, DEFAULT_PREFERENCES.baseScrollSpeed),
      SETTING_LIMITS.baseScrollSpeed.min,
      SETTING_LIMITS.baseScrollSpeed.max,
    ),
    focusPosition: clamp(
      numberOr(source.focusPosition, DEFAULT_PREFERENCES.focusPosition),
      SETTING_LIMITS.focusPosition.min,
      SETTING_LIMITS.focusPosition.max,
    ),
    speakingWpm: clamp(
      numberOr(source.speakingWpm, DEFAULT_PREFERENCES.speakingWpm),
      SETTING_LIMITS.speakingWpm.min,
      SETTING_LIMITS.speakingWpm.max,
    ),
    alignment: source.alignment === 'center' ? 'center' : 'left',
    mirror: source.mirror === true,
    verticalFlip: source.verticalFlip === true,
    focusLine: source.focusLine !== false,
    voiceMode:
      source.voiceMode === 'smart' || source.voiceMode === 'precision'
        ? source.voiceMode
        : 'manual',
  };
}

export function speedToPixelsPerSecond(speed: number): number {
  const safeSpeed = clamp(
    speed,
    SETTING_LIMITS.baseScrollSpeed.min,
    SETTING_LIMITS.baseScrollSpeed.max,
  );
  return 8 + safeSpeed * 8;
}
