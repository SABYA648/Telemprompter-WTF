export type TextAlignment = 'left' | 'center';
export type AnalyticsConsent = 'unknown' | 'allowed' | 'denied';

export interface PrivacyConsent {
  decided: boolean;
  usageAnalytics: boolean;
}

export interface PresenterPreferences {
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  alignment: TextAlignment;
  baseScrollSpeed: number;
  mirror: boolean;
  verticalFlip: boolean;
  focusLine: boolean;
  focusPosition: number;
  speakingWpm: number;
  /** Planned length of the delivery in seconds. Zero means the speaking rate sets the plan. */
  targetDurationSeconds: number;
  /** Show the live speed-up and slow-down signal at the focus line. */
  paceCues: boolean;
}

export interface PersistedStateV1 {
  version: 1;
  script: string;
  preferences: PresenterPreferences;
  analyticsConsent: AnalyticsConsent;
  savedAt: number;
}

export interface PersistedStateV2 {
  version: 2;
  script: string;
  preferences: PresenterPreferences;
  privacyConsent: PrivacyConsent & { experienceDiagnostics: boolean };
  savedAt: number;
}

export interface PersistedStateV3 {
  version: 3;
  script: string;
  preferences: PresenterPreferences;
  privacyConsent: PrivacyConsent;
  savedAt: number;
}

export interface ScrollSnapshot {
  isPlaying: boolean;
  progress: number;
  scrollTop: number;
  maxScroll: number;
}

export interface ScrollController {
  start(): void;
  pause(): void;
  restart(): void;
  setSpeed(pixelsPerSecond: number): void;
  setFollowTarget(scrollTop: number | null, trust: number, feedForward: number): void;
  setLineHeight(pixels: number): void;
  notifyLayoutChange(): void;
  destroy(): void;
}

export interface BrowserCapabilities {
  fullscreen: boolean;
  webShare: boolean;
  clipboard: boolean;
  pictureInPicture: boolean;
  displayCapture: boolean;
  documentPictureInPicture: boolean;
  videoPictureInPicture: boolean;
  canvasCapture: boolean;
  mediaRecorder: boolean;
  camera: boolean;
}
