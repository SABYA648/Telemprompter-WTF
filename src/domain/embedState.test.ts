import { describe, expect, it } from 'vitest';
import {
  LOCAL_STATE_KEY,
  clearLocalState,
  defaultState,
  embedInitialState,
  embedStorageKey,
  loadLocalState,
  saveLocalState,
} from './localState';
import { DEFAULT_PREFERENCES } from './settings';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    read: (key: string) => map.get(key) ?? null,
  };
}

describe('embedded workspace state', () => {
  it('sanitizes embed ids into a namespaced storage key', () => {
    expect(embedStorageKey('guide:Teleprompter For YouTube!')).toBe(
      `${LOCAL_STATE_KEY}:embed:guide-teleprompter-for-youtube`,
    );
    expect(embedStorageKey('   ')).toBe(`${LOCAL_STATE_KEY}:embed:workspace`);
  });

  it('keeps embedded saves isolated from the primary workspace', () => {
    const storage = fakeStorage();
    const embedKey = embedStorageKey('guide-demo');
    saveLocalState({ ...defaultState(), script: 'Homepage script' }, storage);
    saveLocalState({ ...defaultState(), script: 'Guide practice script' }, storage, embedKey);
    expect(loadLocalState(storage).script).toBe('Homepage script');
    expect(loadLocalState(storage, embedKey).script).toBe('Guide practice script');
  });

  it('clearing the primary workspace also clears embedded namespaces', () => {
    const storage = fakeStorage();
    const embedKey = embedStorageKey('guide-demo');
    saveLocalState({ ...defaultState(), script: 'Primary' }, storage);
    saveLocalState({ ...defaultState(), script: 'Embed' }, storage, embedKey);
    clearLocalState(storage);
    expect(storage.read(LOCAL_STATE_KEY)).toBeNull();
    expect(storage.read(embedKey)).toBeNull();
  });

  it('clearing an embedded namespace leaves the primary workspace intact', () => {
    const storage = fakeStorage();
    const embedKey = embedStorageKey('guide-demo');
    saveLocalState({ ...defaultState(), script: 'Primary' }, storage);
    saveLocalState({ ...defaultState(), script: 'Embed' }, storage, embedKey);
    clearLocalState(storage, embedKey);
    expect(loadLocalState(storage).script).toBe('Primary');
    expect(storage.read(embedKey)).toBeNull();
  });

  it('starts embeds from the authored sample with manual voice mode by default', () => {
    const state = embedInitialState('Sample script');
    expect(state.script).toBe('Sample script');
    expect(state.preferences.voiceMode).toBe('manual');
    expect(state.savedAt).toBe(0);
  });

  it('applies presets over embed defaults and keeps saved-state-independent clamping', () => {
    const state = embedInitialState('Sample', { fontSize: 72, mirror: true, voiceMode: 'smart' });
    expect(state.preferences.fontSize).toBe(72);
    expect(state.preferences.mirror).toBe(true);
    expect(state.preferences.voiceMode).toBe('smart');
    expect(state.preferences.lineHeight).toBe(DEFAULT_PREFERENCES.lineHeight);
  });

  it('clamps out-of-range preset values', () => {
    const state = embedInitialState('Sample', { fontSize: 500 });
    expect(state.preferences.fontSize).toBe(112);
  });
});
