import type { VoiceMode } from './types';

export const ANALYTICS_EVENTS = [
  'teleprompter_start',
  'teleprompter_pause',
  'teleprompter_resume',
  'teleprompter_complete',
  'teleprompter_exit',
  'smart_pace_enable',
  'private_precision_download_start',
  'private_precision_download_complete',
  'private_precision_enable',
  'private_precision_fallback',
  'record_start',
  'record_complete',
  'record_save',
  'pip_open',
  'share_tool',
  'script_import',
  'script_clear',
  'setting_change',
  'use_teleprompter_cta',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type SafeAnalyticsProperties = Record<string, string | number | boolean>;

export const VOICE_MODE_PARAMS = ['manual', 'smart_pace', 'private_precision'] as const;
export const SCRIPT_SIZE_BUCKETS = [
  '1_100',
  '101_300',
  '301_750',
  '751_1500',
  '1501_plus',
] as const;
export const ENTRY_CONTEXTS = ['new_script', 'restored_script'] as const;
export const PROGRESS_BUCKETS = ['0_25', '25_50', '50_75', '75_95', '95_100'] as const;
export const DURATION_BUCKETS = ['under_1m', '1_5m', '5_15m', '15m_plus'] as const;
export const SMART_PACE_RESULTS = ['started', 'mic_blocked', 'unavailable'] as const;
export const PRECISION_MODEL_IDS = ['whisper-tiny-v1'] as const;
export const FALLBACK_REASONS = [
  'alignment_low',
  'runtime_error',
  'unsupported',
  'memory',
  'user_switch',
] as const;
export const RECORDING_TYPES = ['screen', 'camera'] as const;
export const PIP_MODES = ['document', 'video', 'popout'] as const;
export const SHARE_METHODS = ['native', 'clipboard'] as const;
export const IMPORT_SOURCE_TYPES = ['txt'] as const;
export const SETTING_NAMES = [
  'fontSize',
  'lineHeight',
  'textWidth',
  'alignment',
  'baseScrollSpeed',
  'mirror',
  'verticalFlip',
  'focusLine',
  'focusPosition',
  'speakingWpm',
  'voiceMode',
] as const;
export const PAGE_TYPES = ['guide', 'tool', 'feature'] as const;
export const CONTENT_CLUSTERS = [
  'youtube',
  'recording',
  'presentation',
  'zoom',
  'voice_tracking',
  'speed',
  'speaking_time',
  'getting_started',
] as const;
export const CTA_LOCATIONS = ['inline', 'end', 'header'] as const;
// True first-use transfer of Private Precision (12 model files plus the ONNX runtime WASM and loader, all in the managed download)
// expressed as a decimal MB bucket, keeping the event low cardinality.
export const MODEL_SIZE_BUCKETS = ['65_70_mb'] as const;

export type VoiceModeParam = (typeof VOICE_MODE_PARAMS)[number];
export type ScriptSizeBucket = (typeof SCRIPT_SIZE_BUCKETS)[number];
export type EntryContext = (typeof ENTRY_CONTEXTS)[number];
export type ProgressBucket = (typeof PROGRESS_BUCKETS)[number];
export type DurationBucket = (typeof DURATION_BUCKETS)[number];
export type SmartPaceResult = (typeof SMART_PACE_RESULTS)[number];
export type PrecisionModelId = (typeof PRECISION_MODEL_IDS)[number];
export type ModelSizeBucket = (typeof MODEL_SIZE_BUCKETS)[number];
export type FallbackReason = (typeof FALLBACK_REASONS)[number];
export type RecordingType = (typeof RECORDING_TYPES)[number];
export type PipMode = (typeof PIP_MODES)[number];
export type ShareMethod = (typeof SHARE_METHODS)[number];
export type ImportSourceType = (typeof IMPORT_SOURCE_TYPES)[number];
export type SettingName = (typeof SETTING_NAMES)[number];
export type PageType = (typeof PAGE_TYPES)[number];
export type ContentCluster = (typeof CONTENT_CLUSTERS)[number];
export type CtaLocation = (typeof CTA_LOCATIONS)[number];

export const PRIVATE_PRECISION_SIZE_BUCKET: ModelSizeBucket = '65_70_mb';

export interface AnalyticsEventProperties {
  teleprompter_start: {
    voice_mode: VoiceModeParam;
    script_size_bucket: ScriptSizeBucket;
    entry_context: EntryContext;
  };
  teleprompter_pause: Record<string, never>;
  teleprompter_resume: Record<string, never>;
  teleprompter_complete: Record<string, never>;
  teleprompter_exit: {
    progress_bucket: ProgressBucket;
    duration_bucket: DurationBucket;
    voice_mode: VoiceModeParam;
  };
  smart_pace_enable: { result: SmartPaceResult };
  private_precision_download_start: { model_id: PrecisionModelId };
  private_precision_download_complete: {
    model_id: PrecisionModelId;
    size_bucket: ModelSizeBucket;
  };
  private_precision_enable: Record<string, never>;
  private_precision_fallback: { reason: FallbackReason };
  record_start: { recording_type: RecordingType; microphone_included: boolean };
  record_complete: { recording_type: RecordingType; duration_bucket: DurationBucket };
  record_save: { recording_type: RecordingType };
  pip_open: { pip_mode: PipMode };
  share_tool: { method: ShareMethod };
  script_import: { source_type: ImportSourceType };
  script_clear: Record<string, never>;
  setting_change: { setting: SettingName };
  use_teleprompter_cta: {
    page_type: PageType;
    content_cluster?: ContentCluster;
    cta_location: CtaLocation;
  };
}

export function scriptSizeBucket(wordCount: number): ScriptSizeBucket {
  if (wordCount <= 100) return '1_100';
  if (wordCount <= 300) return '101_300';
  if (wordCount <= 750) return '301_750';
  if (wordCount <= 1500) return '751_1500';
  return '1501_plus';
}

export function progressBucket(fraction: number): ProgressBucket {
  const value = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  if (value < 0.25) return '0_25';
  if (value < 0.5) return '25_50';
  if (value < 0.75) return '50_75';
  if (value < 0.95) return '75_95';
  return '95_100';
}

export function durationBucket(seconds: number): DurationBucket {
  const value = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  if (value < 60) return 'under_1m';
  if (value < 300) return '1_5m';
  if (value < 900) return '5_15m';
  return '15m_plus';
}

export function voiceModeParam(mode: VoiceMode): VoiceModeParam {
  if (mode === 'smart') return 'smart_pace';
  if (mode === 'precision') return 'private_precision';
  return 'manual';
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

export function isAllowedAnalyticsEvent(value: string): value is AnalyticsEvent {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

type PropertyRule = readonly string[] | 'boolean';

const EVENT_PROPERTY_SCHEMA: Record<AnalyticsEvent, Record<string, PropertyRule>> = {
  teleprompter_start: {
    voice_mode: VOICE_MODE_PARAMS,
    script_size_bucket: SCRIPT_SIZE_BUCKETS,
    entry_context: ENTRY_CONTEXTS,
  },
  teleprompter_pause: {},
  teleprompter_resume: {},
  teleprompter_complete: {},
  teleprompter_exit: {
    progress_bucket: PROGRESS_BUCKETS,
    duration_bucket: DURATION_BUCKETS,
    voice_mode: VOICE_MODE_PARAMS,
  },
  smart_pace_enable: { result: SMART_PACE_RESULTS },
  private_precision_download_start: { model_id: PRECISION_MODEL_IDS },
  private_precision_download_complete: {
    model_id: PRECISION_MODEL_IDS,
    size_bucket: MODEL_SIZE_BUCKETS,
  },
  private_precision_enable: {},
  private_precision_fallback: { reason: FALLBACK_REASONS },
  record_start: { recording_type: RECORDING_TYPES, microphone_included: 'boolean' },
  record_complete: { recording_type: RECORDING_TYPES, duration_bucket: DURATION_BUCKETS },
  record_save: { recording_type: RECORDING_TYPES },
  pip_open: { pip_mode: PIP_MODES },
  share_tool: { method: SHARE_METHODS },
  script_import: { source_type: IMPORT_SOURCE_TYPES },
  script_clear: {},
  setting_change: { setting: SETTING_NAMES },
  use_teleprompter_cta: {
    page_type: PAGE_TYPES,
    content_cluster: CONTENT_CLUSTERS,
    cta_location: CTA_LOCATIONS,
  },
};

export function validateEventProperties(
  event: AnalyticsEvent,
  properties: SafeAnalyticsProperties,
): SafeAnalyticsProperties {
  const schema = EVENT_PROPERTY_SCHEMA[event];
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      const rule = schema[key];
      if (!rule) return false;
      if (rule === 'boolean') return typeof value === 'boolean';
      return typeof value === 'string' && rule.includes(value);
    }),
  );
}

const PROHIBITED_PROPERTY_PATTERN =
  /(script|transcript|recognition|voice|audio|filename|file_name|microphone|clipboard|screen_title|error_message|content|text)/i;

// These taxonomy keys trip the content-word pattern above by name only. Their values are
// constrained to fixed enums or booleans by EVENT_PROPERTY_SCHEMA, so they cannot carry
// user content.
const SAFE_TAXONOMY_KEYS = new Set([
  'voice_mode',
  'script_size_bucket',
  'microphone_included',
  'content_cluster',
  'entry_context',
]);

export function filterSafeProperties(properties: SafeAnalyticsProperties): SafeAnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        /^[a-z][a-z0-9_]{0,39}$/.test(key) &&
        (!PROHIBITED_PROPERTY_PATTERN.test(key) || SAFE_TAXONOMY_KEYS.has(key)) &&
        (typeof value === 'boolean' ||
          (typeof value === 'number' && Number.isFinite(value)) ||
          (typeof value === 'string' && value.length <= 40 && !/[\s]{3,}/.test(value))),
    ),
  );
}

function clearGaCookies(): void {
  if (typeof document === 'undefined') return;
  const names = document.cookie
    .split(';')
    .map((entry) => entry.trim().split('=')[0] ?? '')
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));
  if (!names.length) return;
  const hostname = typeof location === 'undefined' ? '' : location.hostname;
  const domains = hostname ? ['', `domain=${hostname}`, `domain=.${hostname}`] : [''];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; ${domain}` : ''}`;
    }
  }
}

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;
const UMAMI_WEBSITE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_UMAMI_SCRIPT_SRC = 'https://analytics.sabya.pm/script.js';

export function parseGaMeasurementId(value = ''): string {
  return GA_MEASUREMENT_ID_PATTERN.test(value) ? value : '';
}

export function parseUmamiWebsiteId(value = ''): string {
  return UMAMI_WEBSITE_ID_PATTERN.test(value) ? value.toLowerCase() : '';
}

export function parseUmamiScriptSrc(value = ''): string {
  if (!value) return DEFAULT_UMAMI_SCRIPT_SRC;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return '';
    if (url.hostname !== 'analytics.sabya.pm') return '';
    if (url.pathname !== '/script.js') return '';
    if (url.search || url.hash) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export class Analytics {
  private readonly measurementId: string;
  private readonly umamiWebsiteId: string;
  private readonly umamiScriptSrc: string;
  private enabled = false;
  private loaded = false;
  private pendingUmami: Array<{ event: AnalyticsEvent; properties: SafeAnalyticsProperties }> = [];

  constructor(measurementId = '', umamiWebsiteId = '', umamiScriptSrc = DEFAULT_UMAMI_SCRIPT_SRC) {
    this.measurementId = parseGaMeasurementId(measurementId);
    this.umamiWebsiteId = parseUmamiWebsiteId(umamiWebsiteId);
    this.umamiScriptSrc = this.umamiWebsiteId ? parseUmamiScriptSrc(umamiScriptSrc) : '';
  }

  get available(): boolean {
    return Boolean(this.measurementId || (this.umamiWebsiteId && this.umamiScriptSrc));
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  allow(): void {
    if (!this.available) return;
    this.enabled = true;
    this.load();
  }

  deny(): void {
    this.enabled = false;
    this.pendingUmami = [];
    clearGaCookies();
    if (this.loaded && typeof document !== 'undefined') {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      document
        .querySelectorAll('script[data-teleprompter-analytics]')
        .forEach((script) => script.remove());
      delete window.gtag;
      delete window.dataLayer;
      delete window.umami;
      this.loaded = false;
    }
  }

  track<E extends AnalyticsEvent>(event: E, properties?: AnalyticsEventProperties[E]): void {
    if (!this.enabled || !this.loaded || !isAllowedAnalyticsEvent(event)) return;
    const safe = filterSafeProperties(
      validateEventProperties(event, (properties ?? {}) as SafeAnalyticsProperties),
    );
    window.gtag?.('event', event, safe);
    this.sendUmami(event, safe);
  }

  private sendUmami(event: AnalyticsEvent, properties: SafeAnalyticsProperties): void {
    if (!this.umamiWebsiteId) return;
    if (typeof window.umami?.track === 'function') {
      window.umami.track(event, properties);
      return;
    }
    this.pendingUmami.push({ event, properties });
  }

  private flushUmami(): void {
    const queued = this.pendingUmami;
    this.pendingUmami = [];
    for (const item of queued) this.sendUmami(item.event, item.properties);
  }

  private load(): void {
    if (this.loaded || typeof document === 'undefined') return;
    if (this.measurementId) this.loadGa();
    if (this.umamiWebsiteId && this.umamiScriptSrc) this.loadUmami();
    this.loaded = Boolean(this.measurementId || this.umamiWebsiteId);
  }

  private loadGa(): void {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
    script.dataset.teleprompterAnalytics = 'ga';
    document.head.append(script);
  }

  private loadUmami(): void {
    if (document.querySelector('script[data-teleprompter-analytics="umami"]')) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = this.umamiScriptSrc;
    script.dataset.websiteId = this.umamiWebsiteId;
    script.dataset.teleprompterAnalytics = 'umami';
    script.addEventListener('load', () => this.flushUmami());
    document.head.append(script);
  }
}

const umamiWebsiteId =
  import.meta.env.PUBLIC_UMAMI_WEBSITE_ID === undefined
    ? 'c5952a2b-b192-46fe-8a3d-04ad673ffd6d'
    : import.meta.env.PUBLIC_UMAMI_WEBSITE_ID;

export const analytics = new Analytics(
  import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? '',
  umamiWebsiteId,
  import.meta.env.PUBLIC_UMAMI_SCRIPT_URL ?? DEFAULT_UMAMI_SCRIPT_SRC,
);
