export type TextAlignment = 'left' | 'center';
export type AnalyticsConsent = 'unknown' | 'allowed' | 'denied';
export type VoiceMode = 'manual' | 'smart' | 'precision';

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
  voiceMode: VoiceMode;
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
  moveToward(scrollTop: number, strength: number): void;
  notifyLayoutChange(): void;
  destroy(): void;
}

export interface BrowserCapabilities {
  fullscreen: boolean;
  webShare: boolean;
  clipboard: boolean;
  pictureInPicture: boolean;
  displayCapture: boolean;
  webAudio: boolean;
  audioWorklet: boolean;
  microphone: boolean;
  worker: boolean;
  webAssembly: boolean;
  webGpu: boolean;
  documentPictureInPicture: boolean;
  videoPictureInPicture: boolean;
  canvasCapture: boolean;
  mediaRecorder: boolean;
  camera: boolean;
  cacheStorage: boolean;
  deviceMemory: number | null;
  hardwareConcurrency: number;
}

export interface VoiceTrackingProvider {
  readonly id: string;
  readonly available: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): void;
}
