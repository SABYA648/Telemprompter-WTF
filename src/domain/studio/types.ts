export type Aspect = '9:16' | '16:9';
export type ScriptStatus = 'idea' | 'draft' | 'ready' | 'recorded' | 'posted';

export interface StudioScript {
  id: string;
  title: string;
  body: string;
  status: ScriptStatus;
  templateId: string | null;
  targetSeconds: number;
  aspect: Aspect;
  caption: string;
  hashtags: string;
  youtubeTitle: string;
  youtubeDescription: string;
  order: number;
  plannedFor: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  lastRecordedAt: number | null;
  takeCount: number;
}

export type TakeStatus = 'recording' | 'ready' | 'recovered' | 'failed';
export interface TimelineMark {
  t: number;
  line: number;
  section: number;
}
export interface StudioTake {
  id: string;
  scriptId: string | null;
  sectionIndex: number | null;
  number: number;
  status: TakeStatus;
  mimeType: string;
  container: 'mp4' | 'webm';
  width: number;
  height: number;
  frameRate: number;
  facing: 'front' | 'back' | 'external';
  durationMs: number;
  sizeBytes: number;
  chunkCount: number;
  kept: boolean;
  wordsRead?: number; // snapshot at Keep so later script edits do not rewrite stats
  wordsPerLine?: number; // prompter line height over pixels per word, for SRT cues (M11)
  starred: boolean;
  exportedAt: number | null;
  createdAt: number;
  timeline: TimelineMark[];
  trim: { startMs: number; endMs: number } | null;
}
export interface TakeChunk {
  takeId: string;
  seq: number;
  blob: Blob;
}
export interface StudioIdea {
  id: string;
  text: string;
  createdAt: number;
}

export interface StudioStore {
  scripts: StudioScript[];
  kv: Record<string, unknown>;
}

export type KeyAction =
  | 'toggleScroll'
  | 'faster'
  | 'slower'
  | 'lineForward'
  | 'lineBack'
  | 'sectionForward'
  | 'sectionBack'
  | 'toggleRecord'
  | 'restart';
export interface AdvancedCameraValues {
  zoom: number;
  torch: boolean;
  focusMode: string;
  focusDistance: number;
  exposureMode: string;
  exposureCompensation: number;
  exposureTime: number;
  iso: number;
  whiteBalanceMode: string;
  colorTemperature: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
}
export interface StudioSettings {
  version: 1;
  camera: {
    deviceId: string | null;
    facing: 'user' | 'environment';
    aspect: Aspect;
    resolution: '720p' | '1080p' | '2160p';
    frameRate: 24 | 25 | 30 | 50 | 60;
    mirrorPreview: boolean;
    grid: 'off' | 'thirds';
    safeZone: 'off' | 'instagram' | 'youtube_shorts' | 'tiktok';
    level: boolean;
    screenLight: 'off' | 'soft' | 'bright';
    advanced: Record<string, Partial<AdvancedCameraValues>>;
  };
  mic: {
    deviceId: string | null;
    processing: 'standard' | 'raw' | 'custom';
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    channelCount: 1 | 2;
    audioBitrate: 128000 | 192000 | 256000;
  };
  recording: {
    format: 'auto' | 'mp4' | 'webm';
    quality: 'standard' | 'high' | 'max';
    countdownSeconds: 0 | 3 | 5 | 10;
    autoStopAtTarget: boolean;
    autoStartScroll: boolean;
    stopAtSectionEnd: boolean;
    pauseButton: boolean;
    keepScreenAwake: boolean;
    touchLock: boolean;
  };
  prompter: {
    wpm: number;
    fitToTarget: boolean;
    fontSizePx: number;
    lineHeight: number;
    widthPct: number;
    align: 'left' | 'center';
    fontFamily: 'system' | 'readable' | 'serif';
    textColor: '#ffffff' | '#f6f0e4' | '#ffe066';
    scrimOpacity: number;
    windowLines: number;
    dock: 'auto' | 'top' | 'left' | 'right' | 'center';
    cuePosition: number;
    cueStyle: 'band' | 'arrow' | 'line' | 'off';
    autoPauseMarkers: boolean;
    showCues: boolean;
    mirrorText: 'off' | 'horizontal' | 'vertical' | 'both';
    showElapsed: boolean;
    showRemaining: boolean;
  };
  keys: Record<KeyAction, string[]>;
  reminders: { fileDownloaded: boolean; askEnabled: boolean; time: string };
  habit: {
    weeklyGoal: 3 | 5 | 7;
    streaksEnabled: boolean;
    dailyPromptEnabled: boolean;
    goalsEnabled: boolean;
    badgesEnabled: boolean;
    challengeEnabled: boolean;
    ratingEnabled: boolean;
    statsEnabled: boolean;
    recapEnabled: boolean;
    shareCardsEnabled: boolean;
  };
}
