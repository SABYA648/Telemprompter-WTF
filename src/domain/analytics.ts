const CLASSIC_EVENTS = [
  'started_teleprompter',
  'paused_teleprompter',
  'resumed_teleprompter',
  'finished_teleprompter',
  'left_teleprompter_early',
  'restarted_teleprompter',
  'opened_appearance_panel',
  'opened_shortcuts_panel',
  'entered_fullscreen',
  'exited_fullscreen',
  'started_recording',
  'finished_recording',
  'saved_recording',
  'discarded_recording',
  'recording_start_failed',
  'opened_recording_panel',
  'opened_picture_in_picture',
  'imported_plain_text_script',
  'cleared_script',
  'cleared_local_data',
  'changed_presenter_setting',
  'pace_cue_shown',
  'shared_teleprompter_link',
  'clicked_open_teleprompter',
  'used_speed_calculator',
  'used_speaking_time_tool',
] as const;

export type SafeAnalyticsProperties = Record<string, string | number | boolean>;

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
export const SCRIPT_KINDS = ['plain', 'production'] as const;
export const CONTROL_SOURCES = ['button', 'keyboard'] as const;
export const CALCULATOR_MODES = ['find_pace', 'find_time'] as const;
export const RECORDING_FAIL_REASONS = ['permission_blocked', 'unavailable'] as const;
export const RECORDING_TYPES = ['screen', 'camera'] as const;
export const PIP_MODES = ['document', 'video', 'popout'] as const;
export const SHARE_METHODS = ['native', 'clipboard'] as const;
export const IMPORT_SOURCE_TYPES = ['txt'] as const;
export const CUE_KINDS = ['push', 'ease'] as const;
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
  'targetDurationSeconds',
  'paceCues',
] as const;
export const PAGE_TYPES = [
  'guide',
  'tool',
  'feature',
  'listing',
  'about',
  'privacy',
  'not_found',
  'voice_docs',
  'record_preset',
  'template',
  'hooks',
  'studio',
] as const;
export const CONTENT_CLUSTERS = [
  'youtube',
  'recording',
  'presentation',
  'zoom',
  'voice_tracking',
  'speed',
  'speaking_time',
  'getting_started',
  'features',
  'privacy',
  'reels',
  'shorts',
  'tiktok',
  'youtube_landscape',
  'linkedin',
  'templates',
  'hooks',
  'captions',
  'creator',
] as const;
export const CTA_LOCATIONS = ['inline', 'end', 'header', 'callout'] as const;
export type ScriptSizeBucket = (typeof SCRIPT_SIZE_BUCKETS)[number];
export type EntryContext = (typeof ENTRY_CONTEXTS)[number];
export type ProgressBucket = (typeof PROGRESS_BUCKETS)[number];
export type DurationBucket = (typeof DURATION_BUCKETS)[number];
export type ScriptKind = (typeof SCRIPT_KINDS)[number];
export type ControlSource = (typeof CONTROL_SOURCES)[number];
export type CalculatorMode = (typeof CALCULATOR_MODES)[number];
export type RecordingFailReason = (typeof RECORDING_FAIL_REASONS)[number];
export type RecordingType = (typeof RECORDING_TYPES)[number];
export type PipMode = (typeof PIP_MODES)[number];
export type ShareMethod = (typeof SHARE_METHODS)[number];
export type ImportSourceType = (typeof IMPORT_SOURCE_TYPES)[number];
export type SettingName = (typeof SETTING_NAMES)[number];
export type CueKind = (typeof CUE_KINDS)[number];
export type PageType = (typeof PAGE_TYPES)[number];
export type ContentCluster = (typeof CONTENT_CLUSTERS)[number];
export type CtaLocation = (typeof CTA_LOCATIONS)[number];

interface ClassicEventProperties {
  started_teleprompter: {
    script_size_bucket: ScriptSizeBucket;
    entry_context: EntryContext;
    script_kind: ScriptKind;
  };
  paused_teleprompter: { control_source: ControlSource };
  resumed_teleprompter: { control_source: ControlSource };
  finished_teleprompter: Record<string, never>;
  left_teleprompter_early: {
    progress_bucket: ProgressBucket;
    duration_bucket: DurationBucket;
  };
  restarted_teleprompter: { control_source: ControlSource };
  opened_appearance_panel: Record<string, never>;
  opened_shortcuts_panel: Record<string, never>;
  entered_fullscreen: Record<string, never>;
  exited_fullscreen: Record<string, never>;
  started_recording: { recording_type: RecordingType; microphone_included: boolean };
  finished_recording: { recording_type: RecordingType; duration_bucket: DurationBucket };
  saved_recording: { recording_type: RecordingType };
  discarded_recording: { recording_type: RecordingType };
  recording_start_failed: { reason: RecordingFailReason };
  opened_recording_panel: Record<string, never>;
  opened_picture_in_picture: { pip_mode: PipMode };
  imported_plain_text_script: { source_type: ImportSourceType };
  cleared_script: Record<string, never>;
  cleared_local_data: Record<string, never>;
  changed_presenter_setting: { setting: SettingName };
  pace_cue_shown: { cue: CueKind };
  shared_teleprompter_link: { method: ShareMethod };
  clicked_open_teleprompter: {
    page_type: PageType;
    content_cluster?: ContentCluster;
    cta_location: CtaLocation;
  };
  used_speed_calculator: { calculator_mode: CalculatorMode };
  used_speaking_time_tool: Record<string, never>;
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

export const ENTRIES = [
  'home',
  'landing',
  'guide',
  'template',
  'hooks',
  'tool',
  'pwa',
  'calendar',
  'share_card',
  'link',
  'direct',
] as const;
export const DISPLAYS = ['browser', 'standalone'] as const;
export const DEVICE_CLASSES = ['phone', 'tablet', 'desktop'] as const;
export const READY_BUCKETS = ['under_1s', '1_3s', '3s_plus'] as const;
export const CAMERA_REASONS = [
  'permission_blocked',
  'not_found',
  'in_use',
  'overconstrained',
  'insecure_context',
  'in_app_browser',
  'unsupported',
  'unknown',
] as const;
export const RECORDING_REASONS = [
  'mime_unsupported',
  'recorder_error',
  'storage_full',
  'interrupted',
  'unknown',
] as const;
export const ASPECTS = ['9_16', '16_9'] as const;
export const RESOLUTIONS = ['720p', '1080p', '2160p', 'other'] as const;
export const FRAME_RATES = [24, 25, 30, 50, 60, 'other'] as const;
export const FACINGS = ['front', 'back', 'external'] as const;
export const TAKE_MODES = ['full', 'section', 'batch', 'free'] as const;
export const COUNTDOWNS = [0, 3, 5, 10] as const;
export const TAKE_LENGTH_BUCKETS = [
  'under_15s',
  '15_30s',
  '30_60s',
  '60_90s',
  '90_180s',
  '3_10m',
  '10m_plus',
] as const;
export const ENDED_BY = [
  'user',
  'target',
  'section_end',
  'interruption',
  'error',
  'remote',
] as const;
export const TAKE_NUMBER_BUCKETS = ['1', '2', '3_5', '6_plus'] as const;
export const FITS = ['under', 'on_target', 'over', 'no_target'] as const;
export const EXPORT_METHODS = ['share', 'download'] as const;
export const HANDOFF_METHODS = ['qr', 'link'] as const;
export const CONTAINERS = ['mp4', 'webm'] as const;
export const SIZE_BUCKETS = ['under_10mb', '10_50mb', '50_200mb', '200mb_plus'] as const;
export const SCRIPT_SOURCES = [
  'blank',
  'template',
  'daily_prompt',
  'idea',
  'quick',
  'import',
  'received',
  'challenge',
  'duplicate',
] as const;
export const IDEA_SOURCES = ['inbox', 'share_target'] as const;
export const DIRECTIONS = ['export', 'import'] as const;
export const PACE_BUCKETS = ['under_120', '120_150', '150_180', '180_plus'] as const;
export const SETTING_GROUPS = [
  'camera',
  'mic',
  'recording',
  'prompter',
  'keys',
  'reminders',
  'data',
] as const;
export const STUDIO_SETTINGS = [
  'camera_device_id',
  'camera_facing',
  'camera_aspect',
  'camera_resolution',
  'camera_frame_rate',
  'camera_mirror_preview',
  'camera_grid',
  'camera_safe_zone',
  'camera_level',
  'camera_screen_light',
  'camera_advanced',
  'mic_device_id',
  'mic_processing',
  'mic_echo_cancellation',
  'mic_noise_suppression',
  'mic_auto_gain_control',
  'mic_channel_count',
  'mic_audio_bitrate',
  'recording_format',
  'recording_quality',
  'recording_countdown_seconds',
  'recording_auto_stop_at_target',
  'recording_auto_start_scroll',
  'recording_stop_at_section_end',
  'recording_pause_button',
  'recording_keep_screen_awake',
  'recording_touch_lock',
  'prompter_wpm',
  'prompter_fit_to_target',
  'prompter_font_size_px',
  'prompter_line_height',
  'prompter_width_pct',
  'prompter_align',
  'prompter_font_family',
  'prompter_text_color',
  'prompter_scrim_opacity',
  'prompter_window_lines',
  'prompter_dock',
  'prompter_cue_position',
  'prompter_cue_style',
  'prompter_auto_pause_markers',
  'prompter_show_cues',
  'prompter_mirror_text',
  'prompter_show_elapsed',
  'prompter_show_remaining',
  'keys_toggle_scroll',
  'keys_faster',
  'keys_slower',
  'keys_line_forward',
  'keys_line_back',
  'keys_section_forward',
  'keys_section_back',
  'keys_toggle_record',
  'keys_restart',
  'habit_weekly_goal',
  'habit_streaks_enabled',
  'habit_daily_prompt_enabled',
  'reminders_enabled',
  'reminders_time',
] as const;
export const REMOTE_DEVICES = ['keyboard', 'clicker', 'gamepad'] as const;
export const STREAK_BUCKETS = ['1', '2_6', '7_29', '30_99', '100_plus'] as const;
export const GOALS = [3, 5, 7] as const;
export const BADGE_IDS = [
  'first_take',
  'first_save',
  'takes_10',
  'takes_50',
  'takes_100',
  'streak_3',
  'streak_7',
  'streak_30',
  'streak_100',
  'batch_day',
  'challenge_30',
] as const;
export const CARDS = ['streak', 'weekly', 'challenge', 'badge'] as const;
export const PLATFORMS = ['android', 'ios', 'desktop'] as const;
export const SCORES = [1, 2, 3, 4, 5] as const;
export const STORAGE_LEVELS = [80, 95] as const;
export const ERROR_AREAS = ['site', 'studio', 'presenter'] as const;
export const ERROR_NAMES = [
  'Error',
  'TypeError',
  'RangeError',
  'DOMException',
  'NotAllowedError',
  'QuotaExceededError',
  'other',
] as const;
export const SURFACES = ['page', 'studio'] as const;
export const RESULTS = ['success', 'unsupported', 'failed'] as const;
export const NICHES = [
  'fitness',
  'personal-finance',
  'food',
  'beauty',
  'real-estate',
  'tech',
  'education',
  'small-business',
] as const;
export const TEMPLATE_IDS = [
  '30-second-reel-script',
  '3-tips-reel-script',
  'myth-vs-fact-script',
  'story-time-script',
  'before-and-after-script',
  'day-in-the-life-voiceover-script',
  'product-demo-video-script',
  'ugc-ad-script',
  'self-introduction-video-script',
  'youtube-intro-script',
  'youtube-video-script-outline',
  'tutorial-how-to-script',
  'top-5-list-script',
  'hot-take-script',
  'faq-answer-script',
  'client-result-case-study-script',
  'real-estate-listing-video-script',
  'course-launch-promo-script',
  'event-announcement-script',
  'behind-the-scenes-script',
] as const;

const STUDIO_EVENT_SCHEMA = {
  clicked_open_studio: {
    page_type: PAGE_TYPES,
    content_cluster: CONTENT_CLUSTERS,
    cta_location: CTA_LOCATIONS,
  },
  opened_studio: { entry: ENTRIES, display: DISPLAYS, device_class: DEVICE_CLASSES },
  viewed_camera_priming: {},
  granted_camera: { ready_bucket: READY_BUCKETS },
  camera_failed: { reason: CAMERA_REASONS },
  started_take: {
    aspect: ASPECTS,
    resolution: RESOLUTIONS,
    fps: FRAME_RATES,
    facing: FACINGS,
    mode: TAKE_MODES,
    countdown: COUNTDOWNS,
    has_target: 'boolean',
  },
  stopped_take: {
    take_length_bucket: TAKE_LENGTH_BUCKETS,
    ended_by: ENDED_BY,
    progress_bucket: PROGRESS_BUCKETS,
  },
  kept_take: {
    take_number_bucket: TAKE_NUMBER_BUCKETS,
    take_length_bucket: TAKE_LENGTH_BUCKETS,
    fit: FITS,
  },
  discarded_take: { take_length_bucket: TAKE_LENGTH_BUCKETS },
  exported_take: { method: EXPORT_METHODS, container: CONTAINERS, size_bucket: SIZE_BUCKETS },
  recording_failed: { reason: RECORDING_REASONS },
  recovered_take: {},
  created_script: { source: SCRIPT_SOURCES },
  edited_script: { words_bucket: SCRIPT_SIZE_BUCKETS },
  used_template: { template_id: TEMPLATE_IDS },
  inserted_hook: { niche: NICHES },
  shuffled_hooks: { niche: NICHES },
  copied_hook: { niche: NICHES, surface: SURFACES },
  captured_idea: { source: IDEA_SOURCES },
  converted_idea: {},
  sent_to_phone: { method: HANDOFF_METHODS },
  received_script: { method: HANDOFF_METHODS },
  transferred_scripts: { direction: DIRECTIONS },
  completed_practice: { progress_bucket: PROGRESS_BUCKETS, pace_bucket: PACE_BUCKETS },
  changed_studio_setting: { setting: STUDIO_SETTINGS, group: SETTING_GROUPS },
  used_remote_key: { device: REMOTE_DEVICES },
  viewed_today_prompt: {},
  started_today_prompt: {},
  extended_streak: { streak_bucket: STREAK_BUCKETS },
  lost_streak: { previous_bucket: STREAK_BUCKETS },
  used_streak_freeze: {},
  set_weekly_goal: { goal: GOALS },
  reached_weekly_goal: { goal: GOALS },
  unlocked_badge: { badge_id: BADGE_IDS },
  shared_progress_card: { card: CARDS },
  joined_challenge: {},
  completed_challenge: {},
  added_calendar_reminder: {},
  shown_install_prompt: { platform: PLATFORMS },
  dismissed_install_prompt: { platform: PLATFORMS },
  installed_app: { platform: PLATFORMS },
  rated_recording: { score: SCORES },
  storage_warning: { level: STORAGE_LEVELS },
  js_error: { area: ERROR_AREAS, name: ERROR_NAMES },
  used_script_length_checker: {},
  used_caption_counter: {},
  used_hook_generator: {},
  exported_chapters: {},
  exported_captions: {},
  converted_take: { result: RESULTS },
  trimmed_take: {},
  opened_operator_window: {},
} as const;
export const ANALYTICS_EVENTS = [...CLASSIC_EVENTS, ...Object.keys(STUDIO_EVENT_SCHEMA)] as const;
type PropsFromRules<T> = {
  [K in keyof T]: T[K] extends 'boolean' ? boolean : T[K] extends readonly (infer V)[] ? V : never;
};
type StudioEventProperties = {
  [K in keyof typeof STUDIO_EVENT_SCHEMA]: PropsFromRules<(typeof STUDIO_EVENT_SCHEMA)[K]>;
};
export type AnalyticsEventProperties = ClassicEventProperties &
  Omit<StudioEventProperties, 'clicked_open_studio'> & {
    clicked_open_studio: Omit<StudioEventProperties['clicked_open_studio'], 'content_cluster'> & {
      content_cluster?: ContentCluster;
    };
  };
export type AnalyticsEvent = keyof AnalyticsEventProperties;

export function isAllowedAnalyticsEvent(value: string): value is AnalyticsEvent {
  return (
    (ANALYTICS_EVENTS as readonly string[]).includes(value) ||
    Object.hasOwn(STUDIO_EVENT_SCHEMA, value)
  );
}

type PropertyRule = readonly (string | number)[] | 'boolean';

const CLASSIC_EVENT_SCHEMA: Record<keyof ClassicEventProperties, Record<string, PropertyRule>> = {
  started_teleprompter: {
    script_size_bucket: SCRIPT_SIZE_BUCKETS,
    entry_context: ENTRY_CONTEXTS,
    script_kind: SCRIPT_KINDS,
  },
  paused_teleprompter: { control_source: CONTROL_SOURCES },
  resumed_teleprompter: { control_source: CONTROL_SOURCES },
  finished_teleprompter: {},
  left_teleprompter_early: {
    progress_bucket: PROGRESS_BUCKETS,
    duration_bucket: DURATION_BUCKETS,
  },
  restarted_teleprompter: { control_source: CONTROL_SOURCES },
  opened_appearance_panel: {},
  opened_shortcuts_panel: {},
  entered_fullscreen: {},
  exited_fullscreen: {},
  started_recording: { recording_type: RECORDING_TYPES, microphone_included: 'boolean' },
  finished_recording: { recording_type: RECORDING_TYPES, duration_bucket: DURATION_BUCKETS },
  saved_recording: { recording_type: RECORDING_TYPES },
  discarded_recording: { recording_type: RECORDING_TYPES },
  recording_start_failed: { reason: RECORDING_FAIL_REASONS },
  opened_recording_panel: {},
  opened_picture_in_picture: { pip_mode: PIP_MODES },
  imported_plain_text_script: { source_type: IMPORT_SOURCE_TYPES },
  cleared_script: {},
  cleared_local_data: {},
  changed_presenter_setting: { setting: SETTING_NAMES },
  pace_cue_shown: { cue: CUE_KINDS },
  shared_teleprompter_link: { method: SHARE_METHODS },
  clicked_open_teleprompter: {
    page_type: PAGE_TYPES,
    content_cluster: CONTENT_CLUSTERS,
    cta_location: CTA_LOCATIONS,
  },
  used_speed_calculator: { calculator_mode: CALCULATOR_MODES },
  used_speaking_time_tool: {},
};

export function validateEventProperties(
  event: AnalyticsEvent,
  properties: SafeAnalyticsProperties,
): SafeAnalyticsProperties {
  const schema: Record<string, PropertyRule> = { ...CLASSIC_EVENT_SCHEMA, ...STUDIO_EVENT_SCHEMA }[
    event
  ];
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      const rule = schema[key];
      if (!rule) return false;
      if (rule === 'boolean') return typeof value === 'boolean';
      return (typeof value === 'string' || typeof value === 'number') && rule.includes(value);
    }),
  );
}

export function filterSafeProperties(properties: SafeAnalyticsProperties): SafeAnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        /^[a-z][a-z0-9_]{0,39}$/.test(key) &&
        (typeof value === 'boolean' ||
          (typeof value === 'number' && Number.isFinite(value)) ||
          (typeof value === 'string' && value.length <= 40)),
    ),
  );
}

type UmamiPayload = { url?: string; title?: string; [key: string]: unknown };
type Umami = {
  track: (
    event: string | ((payload: UmamiPayload) => UmamiPayload),
    data?: Record<string, unknown>,
  ) => void;
  identify?: (id: string, data: Record<string, string>) => void;
};
declare global {
  interface Window {
    umami?: Umami;
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Session-only fallback. */
  }
}
let memoryId = '';
export function deviceId(): string {
  const existing = readStorage('tw.did');
  if (existing && /^[A-Za-z0-9_-]{22}$/.test(existing)) return existing;
  if (memoryId) return memoryId;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  memoryId = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  writeStorage('tw.did', memoryId);
  return memoryId;
}
function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
export function deviceClass(): (typeof DEVICE_CLASSES)[number] {
  if (!window.matchMedia('(pointer: coarse)').matches) return 'desktop';
  return Math.min(screen.width, screen.height) < 600 ? 'phone' : 'tablet';
}
export function displayMode(): (typeof DISPLAYS)[number] {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
    ? 'standalone'
    : 'browser';
}
export function studioEntry(): (typeof ENTRIES)[number] {
  const source = new URLSearchParams(location.search).get('utm_source');
  if (source === 'pwa' || source === 'calendar' || source === 'share_card') return source;
  if (location.hash.startsWith('#/receive')) return 'link';
  try {
    const ref = new URL(document.referrer);
    if (ref.origin !== location.origin) return 'direct';
    if (ref.pathname === '/') return 'home';
    if (ref.pathname.startsWith('/record')) return 'landing';
    if (ref.pathname.startsWith('/guides')) return 'guide';
    if (ref.pathname.startsWith('/templates')) return 'template';
    if (ref.pathname.startsWith('/hooks')) return 'hooks';
    if (ref.pathname.startsWith('/tools')) return 'tool';
  } catch {
    /* No usable referrer. */
  }
  return 'direct';
}
function sessionData(): Record<string, string> {
  const cohort = readStorage('tw.cohort_week') ?? isoWeek(new Date());
  writeStorage('tw.cohort_week', cohort);
  return {
    display: displayMode(),
    device_class: deviceClass(),
    cohort_week: cohort,
    takes_bucket: '0',
    streak_bucket: '0',
    app_version: '1.0.0',
  };
}
export function normalizeStudioPath(path: string): string {
  const route = path.replace(/^.*#/, '').split('?')[0] ?? '';
  const parts = route.split('/').filter(Boolean);
  const first = parts[0] === 'studio' ? parts[1] : parts[0];
  const second = parts[0] === 'studio' ? parts[2] : parts[1];
  if (!first || first === 'home') return '/studio/home';
  if (first === 'scripts') return second ? '/studio/editor' : '/studio/scripts';
  if (first === 'takes') return second ? '/studio/take' : '/studio/takes';
  if (first === 'settings') {
    const sections = ['camera', 'mic', 'recording', 'prompter', 'keys', 'reminders', 'data'];
    return second && sections.includes(second) ? `/studio/settings/${second}` : '/studio/settings';
  }
  if (['record', 'practice', 'inbox', 'receive', 'batch', 'challenge'].includes(first))
    return `/studio/${first}`;
  return '/studio/home';
}
export class Analytics {
  private queue: Array<
    { event: AnalyticsEvent; properties: SafeAnalyticsProperties } | { url: string; title: string }
  > = [];
  private errors = 0;
  private initialized = false;
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    deviceId();
    sessionData();
    const ready = () => {
      this.identify();
      this.flush();
    };
    if (window.umami) ready();
    else
      document
        .querySelector('script[data-website-id]')
        ?.addEventListener('load', ready, { once: true });
    window.addEventListener('error', (event) => this.error('site', event.error));
    window.addEventListener('unhandledrejection', (event) => this.error('site', event.reason));
  }
  identify(): void {
    if (typeof window === 'undefined' || typeof window.umami?.identify !== 'function') return;
    window.umami.identify(deviceId(), sessionData());
  }
  track<E extends AnalyticsEvent>(
    event: E,
    ...args: Record<string, never> extends AnalyticsEventProperties[E]
      ? [properties?: AnalyticsEventProperties[E]]
      : [properties: AnalyticsEventProperties[E]]
  ): void {
    if (typeof window === 'undefined' || !isAllowedAnalyticsEvent(event)) return;
    const safe = filterSafeProperties(
      validateEventProperties(event, (args[0] ?? {}) as SafeAnalyticsProperties),
    );
    if (window.umami?.track) window.umami.track(event, safe);
    else if (this.queue.length < 50) this.queue.push({ event, properties: safe });
  }
  private flush(): void {
    if (!window.umami?.track) return;
    for (const item of this.queue.splice(0)) {
      if ('event' in item) window.umami.track(item.event, item.properties);
      else window.umami.track((payload) => ({ ...payload, url: item.url, title: item.title }));
    }
  }
  page(path: string, title: string): void {
    void title; // Titles may contain user text; use a fixed route label instead.
    if (typeof window === 'undefined') return;
    const url = normalizeStudioPath(path);
    const safeTitle = url.split('/').filter(Boolean).join(' / ');
    if (window.umami?.track)
      window.umami.track((payload) => ({ ...payload, url, title: safeTitle }));
    else if (this.queue.length < 50) this.queue.push({ url, title: safeTitle });
  }
  error(area: (typeof ERROR_AREAS)[number], error: unknown): void {
    if (this.errors >= 5) return;
    this.errors += 1;
    const raw =
      typeof error === 'string'
        ? error
        : error instanceof Error || error instanceof DOMException
          ? error.name
          : '';
    const name = (ERROR_NAMES as readonly string[]).includes(raw)
      ? (raw as (typeof ERROR_NAMES)[number])
      : 'other';
    this.track('js_error', { area, name });
  }
}
export const analytics = new Analytics();

export function isPageType(value: string | undefined): value is PageType {
  return Boolean(value && (PAGE_TYPES as readonly string[]).includes(value));
}

export function isCtaLocation(value: string | undefined): value is CtaLocation {
  return Boolean(value && (CTA_LOCATIONS as readonly string[]).includes(value));
}

export function isContentCluster(value: string | undefined): value is ContentCluster {
  return Boolean(value && (CONTENT_CLUSTERS as readonly string[]).includes(value));
}

/** Bind conversion CTAs marked with data-analytics-cta across static pages. */
export function bindOpenTeleprompterCtas(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-analytics-cta]').forEach((element) => {
    element.addEventListener('click', () => {
      const pageType = element.dataset.pageType;
      const location = element.dataset.analyticsCta;
      const cluster = element.dataset.contentCluster;
      if (!isPageType(pageType) || !isCtaLocation(location)) return;
      analytics.track('clicked_open_teleprompter', {
        page_type: pageType,
        cta_location: location,
        ...(isContentCluster(cluster) ? { content_cluster: cluster } : {}),
      });
    });
  });
}
