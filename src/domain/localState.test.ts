import { describe, expect, it } from 'vitest';
import {
  LOCAL_STATE_KEY,
  clearLocalState,
  defaultState,
  loadLocalState,
  migrateState,
  saveLocalState,
} from './localState';
import { DEFAULT_PREFERENCES } from './settings';

function fakeStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: (key: string) => (key === LOCAL_STATE_KEY ? value : null),
    setItem: (key: string, next: string) => {
      if (key === LOCAL_STATE_KEY) value = next;
    },
    removeItem: (key: string) => {
      if (key === LOCAL_STATE_KEY) value = null;
    },
    read: () => value,
  };
}

describe('local state', () => {
  it('migrates partial and unversioned data into version 3', () => {
    const migrated = migrateState({
      script: 'Hello locally',
      preferences: { fontSize: 70, mirror: true },
      analyticsConsent: 'allowed',
    });
    expect(migrated.version).toBe(3);
    expect(migrated.script).toBe('Hello locally');
    expect(migrated.preferences.fontSize).toBe(70);
    expect(migrated.preferences.mirror).toBe(true);
    expect(migrated.preferences.lineHeight).toBe(DEFAULT_PREFERENCES.lineHeight);
    expect(migrated.privacyConsent).toEqual({
      decided: true,
      usageAnalytics: true,
    });
  });

  it('migrates version 2 data and drops experienceDiagnostics', () => {
    const migrated = migrateState({
      version: 2,
      script: 'Versioned script',
      preferences: { fontSize: 64 },
      privacyConsent: {
        decided: true,
        usageAnalytics: true,
        experienceDiagnostics: true,
      },
      savedAt: 1234,
    });
    expect(migrated.version).toBe(3);
    expect(migrated.script).toBe('Versioned script');
    expect(migrated.privacyConsent).toEqual({
      decided: true,
      usageAnalytics: true,
    });
    expect(migrated.privacyConsent).not.toHaveProperty('experienceDiagnostics');
    expect(migrated.savedAt).toBe(1234);
  });

  it('handles corrupt stored JSON safely', () => {
    const storage = fakeStorage('{not-json');
    expect(loadLocalState(storage)).toEqual(defaultState());
  });

  it('saves only the versioned schema and clears it', () => {
    const storage = fakeStorage();
    saveLocalState(
      {
        script: 'Private words',
        preferences: DEFAULT_PREFERENCES,
        privacyConsent: {
          decided: true,
          usageAnalytics: false,
        },
      },
      storage,
    );
    expect(JSON.parse(storage.read() ?? '{}')).toMatchObject({
      version: 3,
      script: 'Private words',
      privacyConsent: {
        decided: true,
        usageAnalytics: false,
      },
    });
    clearLocalState(storage);
    expect(storage.read()).toBeNull();
  });
});
