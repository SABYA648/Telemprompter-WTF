import { DEFAULT_PREFERENCES, sanitizePreferences } from './settings';
import type { AnalyticsConsent, PersistedStateV3, PrivacyConsent } from './types';

export const LOCAL_STATE_KEY = 'teleprompter-wtf.state';
export const LOCAL_STATE_VERSION = 3;

export function defaultPrivacyConsent(): PrivacyConsent {
  return { decided: false, usageAnalytics: false };
}

export function defaultState(): PersistedStateV3 {
  return {
    version: LOCAL_STATE_VERSION,
    script: '',
    preferences: { ...DEFAULT_PREFERENCES },
    privacyConsent: defaultPrivacyConsent(),
    savedAt: 0,
  };
}

// Embedded practice workspaces (guides, 404) persist under their own namespace so they
// never read or overwrite the primary script on the homepage.
export function embedStorageKey(embedId: string): string {
  const safe = embedId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${LOCAL_STATE_KEY}:embed:${safe || 'workspace'}`;
}

// Embeds start from an authored sample script and a contextual preset. They default to
// manual scrolling so opening a presenter from a guide never surprises anyone with a
// microphone prompt; every voice mode stays available inside the presenter.
export function embedInitialState(
  initialScript = '',
  preset?: Partial<PersistedStateV3['preferences']>,
): PersistedStateV3 {
  const base = defaultState();
  return {
    ...base,
    script: initialScript,
    preferences: sanitizePreferences({ ...base.preferences, voiceMode: 'manual', ...preset }),
  };
}

function validConsent(value: unknown): AnalyticsConsent {
  return value === 'allowed' || value === 'denied' ? value : 'unknown';
}

function sanitizePrivacyConsent(input: unknown): PrivacyConsent {
  if (!input || typeof input !== 'object') return defaultPrivacyConsent();
  const source = input as Record<string, unknown>;
  return {
    decided: source.decided === true,
    usageAnalytics: source.usageAnalytics === true,
  };
}

export function migrateState(input: unknown): PersistedStateV3 {
  if (!input || typeof input !== 'object') return defaultState();
  const candidate = input as Record<string, unknown>;
  let privacyConsent: PrivacyConsent;
  if (candidate.version === 2 || candidate.version === 3) {
    // Version 2 carried an experienceDiagnostics flag for Microsoft Clarity. The integration
    // was removed, so the migration keeps the analytics choice and drops that flag.
    privacyConsent = sanitizePrivacyConsent(candidate.privacyConsent);
  } else {
    const legacyConsent = validConsent(candidate.analyticsConsent);
    privacyConsent = {
      decided: legacyConsent !== 'unknown',
      usageAnalytics: legacyConsent === 'allowed',
    };
  }

  return {
    version: LOCAL_STATE_VERSION,
    script: typeof candidate.script === 'string' ? candidate.script : '',
    preferences: sanitizePreferences(
      candidate.preferences && typeof candidate.preferences === 'object'
        ? (candidate.preferences as Partial<PersistedStateV3['preferences']>)
        : undefined,
    ),
    privacyConsent,
    savedAt:
      typeof candidate.savedAt === 'number' && Number.isFinite(candidate.savedAt)
        ? candidate.savedAt
        : 0,
  };
}

export function loadLocalState(
  storage: Pick<Storage, 'getItem'> = localStorage,
  key: string = LOCAL_STATE_KEY,
): PersistedStateV3 {
  try {
    const raw = storage.getItem(key);
    return raw ? migrateState(JSON.parse(raw) as unknown) : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveLocalState(
  state: Omit<PersistedStateV3, 'version' | 'savedAt'>,
  storage: Pick<Storage, 'setItem'> = localStorage,
  key: string = LOCAL_STATE_KEY,
): PersistedStateV3 {
  const safeState: PersistedStateV3 = {
    version: LOCAL_STATE_VERSION,
    script: state.script,
    preferences: sanitizePreferences(state.preferences),
    privacyConsent: sanitizePrivacyConsent(state.privacyConsent),
    savedAt: Date.now(),
  };
  storage.setItem(key, JSON.stringify(safeState));
  return safeState;
}

export function clearLocalState(
  storage: Pick<Storage, 'removeItem'> & Partial<Storage> = localStorage,
  key: string = LOCAL_STATE_KEY,
): void {
  storage.removeItem(key);
  // Clearing the primary workspace also clears every embedded workspace namespace.
  if (
    key === LOCAL_STATE_KEY &&
    typeof storage.length === 'number' &&
    typeof storage.key === 'function'
  ) {
    const prefix = `${LOCAL_STATE_KEY}:`;
    const namespaced: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const candidate = storage.key(index);
      if (candidate && candidate.startsWith(prefix)) namespaced.push(candidate);
    }
    namespaced.forEach((candidate) => storage.removeItem(candidate));
  }
}
