/**
 * Centralized product facts and authority boundaries for teleprompter.wtf.
 *
 * All public pages, metadata, schema, llms.txt, guides, and documentation must
 * agree with the facts defined in this module.
 */

export const PRODUCT_NAME = 'teleprompter.wtf';
export const CANONICAL_ORIGIN = 'https://www.teleprompter.wtf';
export const GITHUB_REPO_URL = 'https://github.com/SABYA648/Telemprompter-WTF';

export const POSITIONING_STATEMENT =
  'A free online teleprompter that follows your pace while your script and voice stay on your device.';

export const CORE_PILLARS = [
  'Immediate use: paste your script and present with zero account or onboarding.',
  'Three distinct presentation modes: reliable manual scrolling, lightweight local Smart Pace, and optional Private Precision Beta.',
  'Local privacy boundary: scripts, audio, recognition fragments, and recordings remain entirely on your device.',
  'Prompter-rig ready: horizontal mirroring, vertical flip, fullscreen, and compact presenter views.',
  'Completely free: no subscription, no paywalls, no watermark, no ads, and 100% open source.',
] as const;

export interface ModeDefinition {
  id: 'manual' | 'smart' | 'precision';
  name: string;
  badge?: string;
  headline: string;
  summary: string;
  mechanism: string;
  networkRequirement: string;
  downloadBytes: number;
  transcribesSpeech: boolean;
  requiresMicrophone: boolean;
  primaryUseCase: string;
}

export const MODES: Record<'manual' | 'smart' | 'precision', ModeDefinition> = {
  manual: {
    id: 'manual',
    name: 'Manual',
    headline: 'Steady, predictable elapsed-time scrolling',
    summary:
      'Continuous, smooth scroll based on elapsed time rather than frame rate. Adjustable speed (1-10) with instant keyboard and touch controls.',
    mechanism:
      'Calculates scroll delta from performance timestamps and user-selected speed setting.',
    networkRequirement: 'Works completely offline after initial page load.',
    downloadBytes: 0,
    transcribesSpeech: false,
    requiresMicrophone: false,
    primaryUseCase:
      'Scripted speeches, rehearsed presentations, and environments without microphone access.',
  },
  smart: {
    id: 'smart',
    name: 'Smart Pace',
    badge: 'Default · Zero download',
    headline: 'Local microphone energy and cadence following',
    summary:
      'Matches scroll speed to your natural speaking rhythm. Automatically slows and pauses during pauses. Fully local with zero transcription and zero model download.',
    mechanism:
      'Samples local microphone audio via Web Audio AnalyserNode. Measures RMS energy against an adaptive room noise floor to detect speech activity and apply a dynamic scroll multiplier.',
    networkRequirement: 'Zero network requests. Fully local in-browser Web Audio.',
    downloadBytes: 0,
    transcribesSpeech: false,
    requiresMicrophone: true,
    primaryUseCase:
      'Conversational delivery, YouTube videos, webinars, and natural speaking across any language.',
  },
  precision: {
    id: 'precision',
    name: 'Private Precision',
    badge: 'Beta · Optional on-device model',
    headline: 'On-device speech recognition for script-position alignment',
    summary:
      'Downloads an optional local speech model (about 67 MB on first use) to recognize spoken phrases on your device and gently align the scroll to your exact place in the known script.',
    mechanism:
      'Runs a quantized multilingual Whisper Tiny ONNX model inside a dedicated Web Worker via ONNX Runtime Web WASM. Audio chunks (6s PCM) are transcribed locally to temporary text fragments and matched against bounded script tokens. Automatically falls back to Smart Pace on low confidence, busy worker, or runtime error.',
    networkRequirement:
      'One-time download of ~67 MB from same-origin /models/ on explicit user request; cached in versioned browser Cache Storage. Zero network requests during presentation.',
    downloadBytes: 66_874_154, // Exactly 45,233,651 model bytes + 21,640,503 runtime WASM & loader
    transcribesSpeech: true,
    requiresMicrophone: true,
    primaryUseCase: 'Longer scripted takes where speakers may jump ahead, repeat lines, or ad-lib.',
  },
};

export const PRIVACY_BOUNDARY = {
  scriptStorage: 'Stored locally in browser localStorage for autosave; never transmitted.',
  microphoneAudio: 'Processed in-memory by Web Audio / Web Worker; never uploaded or saved.',
  recognitionFragments: 'Temporary in-memory text compared to script; immediately discarded.',
  recordings:
    'Generated locally via MediaRecorder as in-memory Blobs; saved only by explicit user file download.',
  modelCache: 'Versioned browser Cache Storage on same-origin /models/; removable at any time.',
  analytics:
    'Optional GA4, strictly consent-gated (opt-in). Excludes script text, audio, fragments, filenames, and raw transcripts.',
} as const;

export const BROWSER_SUPPORT_SUMMARY = {
  desktopChrome:
    'Full support: Manual, Smart Pace, Private Precision, Document PiP, Video PiP, Local Recording (WebM/VP8), Fullscreen.',
  desktopEdge:
    'Full support: Manual, Smart Pace, Private Precision, Document PiP, Video PiP, Local Recording (WebM/VP8), Fullscreen.',
  desktopFirefox:
    'Supported: Manual, Smart Pace, Private Precision, Video PiP, Pop-out, Local Recording (WebM/VP8), Fullscreen. (Document PiP not supported by browser).',
  desktopSafari:
    'Supported: Manual, Smart Pace, Private Precision, Video PiP, Pop-out, Local Recording (MP4/H264), Fullscreen. (Document PiP not supported by browser).',
  iosSafari:
    'Supported: Manual, Smart Pace, Private Precision (with sufficient RAM), Pop-out. Fullscreen supported on iPadOS; iPhone restricts element fullscreen.',
  androidChrome:
    'Full support: Manual, Smart Pace, Private Precision (device RAM permitting), Fullscreen, Video PiP, Local Recording.',
} as const;

export const COMPETITOR_COMPARISONS = [
  {
    name: 'Miracue',
    similarity:
      'Free browser teleprompter with local on-device voice following and a ~65 MB model.',
    differentiation:
      'teleprompter.wtf is 100% open source, requires zero account or login for all features (Miracue gates folders and shoot-day tools behind Studio accounts), provides a zero-download instant Smart Pace mode alongside an optional model, has built-in local screen/camera recording, and includes direct local data-clearance controls.',
  },
  {
    name: 'Speakflow',
    similarity: 'Browser teleprompter with voice-following Flow mode.',
    differentiation:
      'Speakflow restricts free voice flow to 2 minutes per take and places watermarks on free recordings, charging $15-$99/month for full access. teleprompter.wtf is completely free without time limits or watermarks.',
  },
  {
    name: 'PromptSmart',
    similarity: 'VoiceTrack speech-recognition teleprompting.',
    differentiation:
      'PromptSmart is a paid subscription service ($9.99-$19.99/mo) focused primarily on native desktop/mobile apps and requiring user accounts. teleprompter.wtf runs instantly in the browser without signups or fees.',
  },
  {
    name: 'Teleprompter.com',
    similarity: 'Web and mobile teleprompter with video recording.',
    differentiation:
      'Teleprompter.com watermarks all free recordings and charges $19.99/month for watermark removal and 4K export, while storing scripts in the cloud. teleprompter.wtf records locally with no watermarks and keeps scripts on-device.',
  },
  {
    name: 'BIGVU',
    similarity: 'Teleprompter and video recording platform.',
    differentiation:
      'BIGVU is a commercial cloud AI video suite with heavy free-tier watermarking and 9-minute limits. teleprompter.wtf is a focused, private, watermark-free tool.',
  },
] as const;
