import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { analytics, type EntryContext, type SettingName } from '../domain/analytics';
import { countWords, durationSeconds, formatDuration } from '../domain/calculations';
import { detectBrowserCapabilities } from '../domain/capabilities';
import {
  clearLocalState,
  defaultState,
  loadLocalState,
  saveLocalState,
} from '../domain/localState';
import { SETTING_LIMITS } from '../domain/settings';
import type { PresenterPreferences, PrivacyConsent } from '../domain/types';
import Presenter from './Presenter';

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export default function TeleprompterApp(): preact.JSX.Element {
  const initial = defaultState();
  const [script, setScript] = useState(initial.script);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [privacyConsent, setPrivacyConsent] = useState<PrivacyConsent>(initial.privacyConsent);
  const [presenting, setPresenting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved only on this device');
  const [notice, setNotice] = useState('');
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryContextRef = useRef<EntryContext>('new_script');
  const words = useMemo(() => countWords(script), [script]);
  const duration = useMemo(
    () => durationSeconds(words, preferences.speakingWpm),
    [words, preferences.speakingWpm],
  );

  useEffect(() => {
    const saved = loadLocalState();
    let preferences = saved.preferences;
    // One-shot experience refresh: older installs defaulted to Manual. Promote them to
    // Smart Pace once so the product asks to listen by default. Precision stays put.
    const experienceKey = 'teleprompter-wtf.experience-v2-smart';
    try {
      if (!localStorage.getItem(experienceKey)) {
        if (preferences.voiceMode === 'manual') {
          preferences = { ...preferences, voiceMode: 'smart' };
        }
        localStorage.setItem(experienceKey, '1');
      }
    } catch {
      // Storage can be unavailable; the in-memory default still prefers Smart Pace.
    }
    setScript(saved.script);
    setPreferences(preferences);
    setPrivacyConsent(saved.privacyConsent);
    setSaveStatus(saved.savedAt ? 'Restored from this device' : 'Saved only on this device');
    // Derived once at app start: a non-empty restored script means this session continues
    // earlier work. It is a one-off enum, never a persistent identifier.
    entryContextRef.current = saved.script.trim() ? 'restored_script' : 'new_script';
    setHydrated(true);

    const onConsent = (event: Event) => {
      setPrivacyConsent((event as CustomEvent<PrivacyConsent>).detail);
    };
    const onCleared = () => {
      const clean = defaultState();
      setScript(clean.script);
      setPreferences(clean.preferences);
      setPrivacyConsent(clean.privacyConsent);
      setSaveStatus('Local data cleared');
    };
    window.addEventListener('teleprompter:consent-change', onConsent);
    window.addEventListener('teleprompter:local-data-cleared', onCleared);
    return () => {
      window.removeEventListener('teleprompter:consent-change', onConsent);
      window.removeEventListener('teleprompter:local-data-cleared', onCleared);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus('Saving on this device…');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        saveLocalState({ script, preferences, privacyConsent });
        setSaveStatus('Saved only on this device');
      } catch {
        setSaveStatus('Could not save. Browser storage may be unavailable.');
      }
    }, 350);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [script, preferences, privacyConsent, hydrated]);

  const updatePreferences = (next: PresenterPreferences, setting?: SettingName) => {
    setPreferences(next);
    // Continuous slider drags call this without a setting; only discrete selections
    // (and slider commits) carry one, so setting_change stays low cardinality.
    if (setting) analytics.track('setting_change', { setting });
  };

  const clearScript = () => {
    if (
      script.trim() &&
      !window.confirm('Clear this script? This cannot be undone after autosave.')
    ) {
      return;
    }
    setScript('');
    setNotice('Script cleared.');
    analytics.track('script_clear');
  };

  const clearEverything = () => {
    if (
      !window.confirm(
        'Delete your saved script and all teleprompter.wtf preferences on this device?',
      )
    ) {
      return;
    }
    clearLocalState();
    const clean = defaultState();
    setScript(clean.script);
    setPreferences(clean.preferences);
    setPrivacyConsent(clean.privacyConsent);
    setNotice('Local script and preferences cleared.');
    setSaveStatus('Local data cleared');
    window.dispatchEvent(new CustomEvent('teleprompter:local-data-cleared'));
  };

  const importText = async (file: File | undefined) => {
    if (!file) return;
    setNotice('');
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setNotice('Choose a plain-text .txt file.');
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setNotice('That file is larger than 5 MB. Please use a smaller plain-text file.');
      return;
    }
    try {
      const text = (await file.text()).replace(/\r\n?/g, '\n');
      if (text.includes('\u0000')) throw new Error('Binary content');
      setScript(text);
      setNotice('Text file imported.');
      analytics.track('script_import', { source_type: 'txt' });
    } catch {
      setNotice('That file could not be read as plain text.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  const share = async () => {
    const url = 'https://www.teleprompter.wtf';
    const capabilities = detectBrowserCapabilities();
    try {
      if (capabilities.webShare) {
        await navigator.share({
          title: 'teleprompter.wtf',
          text: 'A free, private online teleprompter.',
          url,
        });
        setNotice('Thanks for sharing.');
      } else if (capabilities.clipboard) {
        await navigator.clipboard.writeText(url);
        setNotice('Link copied to clipboard.');
      } else {
        setNotice(`Share this link: ${url}`);
      }
      analytics.track('share_tool', { method: capabilities.webShare ? 'native' : 'clipboard' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setNotice(`Share this link: ${url}`);
    }
  };

  const start = () => {
    if (!script.trim()) return;
    setPresenting(true);
  };

  const stopPresenting = () => {
    setPresenting(false);
    requestAnimationFrame(() => startButtonRef.current?.focus());
  };

  return (
    <>
      <section
        class="editor-shell"
        aria-labelledby="editor-title"
        data-hydrated={hydrated || undefined}
      >
        <div class="editor-heading">
          <div>
            <p class="eyebrow">Your script</p>
            <h2 id="editor-title">Ready when you are.</h2>
          </div>
          <div class="script-stats" aria-live="polite">
            <span>
              <b>{words.toLocaleString()}</b> {words === 1 ? 'word' : 'words'}
            </span>
            <span>
              <b>{formatDuration(duration)}</b> at {preferences.speakingWpm} WPM
            </span>
          </div>
        </div>

        <label class="sr-only" for="script-editor">
          Teleprompter script
        </label>
        <textarea
          id="script-editor"
          class="script-editor"
          value={script}
          onInput={(event) => setScript(event.currentTarget.value)}
          placeholder={'Paste or type your script here.\n\nParagraph breaks will be preserved.'}
          spellcheck
          autocapitalize="sentences"
        />

        <div class="editor-meta">
          <span class="save-status">
            <i aria-hidden="true" />
            {saveStatus}
          </span>
          <label class="wpm-control">
            Speaking pace
            <select
              value={preferences.speakingWpm}
              onChange={(event) =>
                updatePreferences(
                  { ...preferences, speakingWpm: Number(event.currentTarget.value) },
                  'speakingWpm',
                )
              }
            >
              {Array.from(
                {
                  length:
                    (SETTING_LIMITS.speakingWpm.max - SETTING_LIMITS.speakingWpm.min) / 10 + 1,
                },
                (_, index) => SETTING_LIMITS.speakingWpm.min + index * 10,
              ).map((wpm) => (
                <option value={wpm}>{wpm} WPM</option>
              ))}
            </select>
          </label>
        </div>

        <div class="editor-actions">
          <button
            ref={startButtonRef}
            class="button button--primary button--start"
            disabled={!script.trim()}
            onClick={start}
          >
            Start teleprompter <span aria-hidden="true">→</span>
          </button>
          <div class="secondary-actions">
            <input
              ref={importRef}
              class="sr-only"
              id="txt-import"
              type="file"
              aria-label="Import TXT file"
              accept=".txt,text/plain"
              onChange={(event) => void importText(event.currentTarget.files?.[0])}
            />
            <button class="text-button" onClick={() => importRef.current?.click()}>
              Import TXT
            </button>
            <button class="text-button" onClick={clearScript}>
              Clear script
            </button>
            <button class="text-button" onClick={() => void share()}>
              Share
            </button>
          </div>
        </div>
        <p class="editor-notice" role="status" aria-live="polite">
          {notice}
        </p>

        <details class="local-data-details">
          <summary>Privacy & local data</summary>
          <p>
            Your script is stored only in this browser. It is never added to a URL or sent to us.
          </p>
          <button class="text-button text-button--danger" onClick={clearEverything}>
            Clear local data
          </button>
        </details>
      </section>

      {presenting && (
        <Presenter
          script={script}
          preferences={preferences}
          entryContext={entryContextRef.current}
          onPreferencesChange={updatePreferences}
          onExit={stopPresenting}
        />
      )}
    </>
  );
}
