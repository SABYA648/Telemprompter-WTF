import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  analytics,
  durationBucket,
  progressBucket,
  scriptSizeBucket,
  voiceModeParam,
  type EntryContext,
  type SettingName,
} from '../domain/analytics';
import { countWords, durationSeconds, formatDuration } from '../domain/calculations';
import {
  compileScriptGuide,
  cueSummary,
  firstCueLine,
  sectionAtSpokenOffset,
} from '../domain/scriptGuide';
import { detectBrowserCapabilities } from '../domain/capabilities';
import {
  estimateFocusCharacterIndex,
  highlightWindowAround,
  scrollOffsetForCharacter,
  segmentScript,
  type HighlightWindow,
} from '../domain/scriptHighlight';
import { SETTING_LIMITS, clamp, speedToPixelsPerSecond } from '../domain/settings';
import { TimeBasedScrollController } from '../domain/scrollController';
import type { PresenterPreferences } from '../domain/types';
import PictureInPictureControl from './PictureInPictureControl';
import RecordingControl from './RecordingControl';
import SettingControls from './SettingControls';
import VoiceTrackingControls from './VoiceTrackingControls';

interface Props {
  script: string;
  preferences: PresenterPreferences;
  entryContext: EntryContext;
  onPreferencesChange: (next: PresenterPreferences, setting?: SettingName) => void;
  onExit: () => void;
}

const INTERACTION_HIDE_DELAY = 2800;
// A session counts as complete when the scroll reaches at least 95% of the script or hits
// the explicit end-of-script state reported by the scroll controller.
const COMPLETE_PROGRESS_THRESHOLD = 0.95;

export default function Presenter({
  script,
  preferences,
  entryContext,
  onPreferencesChange,
  onExit,
}: Props): preact.JSX.Element {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const presenterRef = useRef<HTMLElement>(null);
  const controllerRef = useRef<TimeBasedScrollController | null>(null);
  const settingsPanelRef = useRef<HTMLElement>(null);
  const shortcutsPanelRef = useRef<HTMLElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const shortcutsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsDoneRef = useRef<HTMLButtonElement>(null);
  const shortcutsDoneRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsOpenRef = useRef(false);
  const shortcutsOpenRef = useRef(false);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [voiceListening, setVoiceListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const [highlight, setHighlight] = useState<HighlightWindow>({
    trailStart: 0,
    liveStart: 0,
    liveEnd: 0,
  });
  const voiceMultiplierRef = useRef(1);
  const scriptElementRef = useRef<HTMLDivElement>(null);
  const precisionAnchorRef = useRef<number | null>(null);
  const guide = useMemo(
    () => compileScriptGuide(script, preferences.speakingWpm),
    [script, preferences.speakingWpm],
  );
  const displayScript = guide.kind === 'guided' ? guide.spokenText : script;
  const segments = useMemo(() => segmentScript(displayScript), [displayScript]);
  const segmentsRef = useRef(segments);
  const focusPositionRef = useRef(preferences.focusPosition);
  segmentsRef.current = segments;
  focusPositionRef.current = preferences.focusPosition;
  settingsOpenRef.current = settingsOpen;
  shortcutsOpenRef.current = shortcutsOpen;
  const capabilities = useRef(detectBrowserCapabilities()).current;
  const words = guide.kind === 'guided' ? guide.spokenWordCount : countWords(script);
  const estimatedTotal = durationSeconds(words, preferences.speakingWpm);
  const remaining = estimatedTotal * (1 - progress);
  const activeSection = sectionAtSpokenOffset(
    guide,
    precisionAnchorRef.current ?? highlight.liveStart,
  );
  const visualCue = cueSummary(activeSection, 'visual');
  const screenCue = cueSummary(activeSection, 'screen');

  const syncHighlightFromScroll = () => {
    const scroller = scrollerRef.current;
    const scriptElement = scriptElementRef.current;
    if (!scroller || !scriptElement || !displayScript.length) return;
    // Precision anchors temporarily own the live word when speech recognition is confident.
    // Otherwise the focus-line caret estimate keeps Smart Pace and the reader visually aligned.
    const center =
      precisionAnchorRef.current ??
      estimateFocusCharacterIndex(
        scroller,
        scriptElement,
        focusPositionRef.current,
        displayScript.length,
      );
    setHighlight(highlightWindowAround(segmentsRef.current, center));
  };
  const syncHighlightRef = useRef(syncHighlightFromScroll);
  syncHighlightRef.current = syncHighlightFromScroll;

  const revealControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing && !settingsOpen && !shortcutsOpen) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), INTERACTION_HIDE_DELAY);
    }
  };

  useLayoutEffect(() => {
    document.body.classList.add('presenting');
    const background = document.querySelectorAll<HTMLElement>(
      '.site-header, .site-footer, .home-hero__copy, .editor-shell, .home-content, .privacy-choices, .privacy-preference',
    );
    background.forEach((element) => {
      element.inert = true;
    });
    presenterRef.current?.focus();
    const element = scrollerRef.current;
    if (!element) return;

    const markComplete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      analytics.track('finished_teleprompter');
    };
    const controller = new TimeBasedScrollController({
      element,
      pixelsPerSecond: speedToPixelsPerSecond(preferences.baseScrollSpeed),
      onUpdate: (snapshot) => {
        setPlaying(snapshot.isPlaying);
        setProgress(snapshot.progress);
        progressRef.current = snapshot.progress;
        if (snapshot.progress >= COMPLETE_PROGRESS_THRESHOLD) markComplete();
        syncHighlightRef.current();
      },
      onComplete: markComplete,
    });
    controllerRef.current = controller;
    const startTimer = setTimeout(() => controller.start(), 350);
    analytics.track('started_teleprompter', {
      voice_mode: voiceModeParam(preferences.voiceMode),
      script_size_bucket: scriptSizeBucket(words),
      entry_context: entryContext,
      script_kind: guide.kind === 'guided' ? 'production' : 'plain',
    });

    return () => {
      clearTimeout(startTimer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      controller.destroy();
      controllerRef.current = null;
      document.body.classList.remove('presenting');
      background.forEach((element) => {
        element.inert = false;
      });
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setSpeed(
      speedToPixelsPerSecond(preferences.baseScrollSpeed) * voiceMultiplierRef.current,
    );
  }, [preferences.baseScrollSpeed]);

  const updateVoiceMultiplier = (multiplier: number) => {
    voiceMultiplierRef.current = multiplier;
    controllerRef.current?.setSpeed(
      speedToPixelsPerSecond(preferences.baseScrollSpeed) * multiplier,
    );
  };

  const applyAlignment = (characterIndex: number, confidence: number, tokenEnd?: number) => {
    const scroller = scrollerRef.current;
    const scriptElement = scriptElementRef.current;
    if (!scroller || !displayScript.length) return;
    const focused =
      scriptElement &&
      scrollOffsetForCharacter(scroller, scriptElement, characterIndex, focusPositionRef.current);
    const target =
      typeof focused === 'number'
        ? focused
        : (characterIndex / displayScript.length) *
          Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const strength = confidence >= 0.7 ? 0.48 : 0.22;
    if (controllerRef.current) {
      controllerRef.current.moveToward(target, strength);
    } else {
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = Math.min(max, Math.max(0, target));
    }
    const center =
      typeof tokenEnd === 'number' && tokenEnd > characterIndex
        ? Math.round((characterIndex + tokenEnd) / 2)
        : characterIndex;
    precisionAnchorRef.current = center;
    setHighlight(highlightWindowAround(segmentsRef.current, center, 6, 3));
  };

  const handleVoiceActivity = (activity: { listening: boolean; speechActive: boolean }) => {
    setVoiceListening(activity.listening);
    setSpeechActive(activity.speechActive);
    if (!activity.listening) precisionAnchorRef.current = null;
    else requestAnimationFrame(() => syncHighlightRef.current());
  };

  useEffect(() => {
    controllerRef.current?.notifyLayoutChange();
  }, [
    preferences.fontSize,
    preferences.lineHeight,
    preferences.textWidth,
    preferences.focusPosition,
  ]);

  useEffect(() => {
    const onFullscreen = () => {
      const next = Boolean(document.fullscreenElement);
      setFullscreen(next);
      analytics.track(next ? 'entered_fullscreen' : 'exited_fullscreen');
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  useEffect(() => {
    if (settingsOpen) settingsDoneRef.current?.focus();
  }, [settingsOpen]);

  useEffect(() => {
    if (shortcutsOpen) shortcutsDoneRef.current?.focus();
  }, [shortcutsOpen]);

  useEffect(() => {
    const onResize = () => controllerRef.current?.notifyLayoutChange();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    revealControls();
  }, [playing, settingsOpen, shortcutsOpen]);

  const togglePlay = (controlSource: 'button' | 'keyboard' = 'button') => {
    if (playing) {
      controllerRef.current?.pause();
      analytics.track('paused_teleprompter', { control_source: controlSource });
      setControlsVisible(true);
    } else {
      if (progress >= 0.999) controllerRef.current?.restart();
      controllerRef.current?.start();
      analytics.track('resumed_teleprompter', { control_source: controlSource });
      revealControls();
    }
  };

  const updatePreference = <K extends keyof PresenterPreferences>(
    key: K,
    value: PresenterPreferences[K],
  ) => onPreferencesChange({ ...preferences, [key]: value }, key);

  const changeSpeed = (amount: number) => {
    updatePreference(
      'baseScrollSpeed',
      clamp(
        preferences.baseScrollSpeed + amount,
        SETTING_LIMITS.baseScrollSpeed.min,
        SETTING_LIMITS.baseScrollSpeed.max,
      ),
    );
  };

  const changeFont = (amount: number) => {
    updatePreference(
      'fontSize',
      clamp(
        preferences.fontSize + amount,
        SETTING_LIMITS.fontSize.min,
        SETTING_LIMITS.fontSize.max,
      ),
    );
  };

  const toggleFullscreen = async () => {
    if (!capabilities.fullscreen) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setControlsVisible(true);
    }
  };

  const exit = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // The presenter can still close if the browser refuses to exit fullscreen.
      }
    }
    // Exit only fires when the session did not complete, so it never doubles with
    // teleprompter_complete.
    if (!completedRef.current) {
      analytics.track('left_teleprompter_early', {
        progress_bucket: progressBucket(progressRef.current),
        duration_bucket: durationBucket((Date.now() - startedAtRef.current) / 1000),
        voice_mode: voiceModeParam(preferences.voiceMode),
      });
    }
    onExit();
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    requestAnimationFrame(() => settingsButtonRef.current?.focus());
  };

  const closeShortcuts = () => {
    setShortcutsOpen(false);
    requestAnimationFrame(() => shortcutsButtonRef.current?.focus());
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (event.key === 'Escape') {
        if (settingsOpenRef.current) closeSettings();
        else if (shortcutsOpenRef.current) closeShortcuts();
        else void exit();
        return;
      }

      if (event.key === 'Tab') {
        const panel = settingsOpenRef.current
          ? settingsPanelRef.current
          : shortcutsOpenRef.current
            ? shortcutsPanelRef.current
            : presenterRef.current;
        const focusable = panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable?.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first || !panel?.contains(document.activeElement))
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
        return;
      }

      if (target?.matches('input, textarea, select, button')) return;

      const key = event.key.toLowerCase();
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay('keyboard');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        changeSpeed(1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        changeSpeed(-1);
      } else if (event.key === '[') {
        changeFont(-2);
      } else if (event.key === ']') {
        changeFont(2);
      } else if (key === 'f') {
        void toggleFullscreen();
      } else if (key === 'm') {
        updatePreference('mirror', !preferences.mirror);
      } else if (event.key === 'Home') {
        event.preventDefault();
        controllerRef.current?.restart();
        analytics.track('restarted_teleprompter', { control_source: 'keyboard' });
      }
      revealControls();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [playing, preferences, settingsOpen, shortcutsOpen]);

  const restart = () => {
    controllerRef.current?.restart();
    analytics.track('restarted_teleprompter', { control_source: 'button' });
    revealControls();
  };

  return (
    <section
      ref={presenterRef}
      class={`presenter ${controlsVisible || !playing ? 'presenter--controls' : ''} ${voiceListening ? 'presenter--listening' : ''} ${speechActive ? 'presenter--speaking' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Teleprompter presenter"
      tabIndex={-1}
      autoFocus
      onPointerMove={revealControls}
      onPointerDown={revealControls}
    >
      <div class="presenter__progress" aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {preferences.focusLine && (
        <div
          class="focus-guide"
          style={{ top: `${preferences.focusPosition}%` }}
          aria-hidden="true"
        >
          <span />
        </div>
      )}

      {guide.kind === 'guided' && activeSection && (
        <aside class="guide-rail" aria-label="Production cues">
          {(visualCue || screenCue) && (
            <>
              {visualCue && (
                <p class="guide-rail__cue">
                  <span>Visual</span>
                  {firstCueLine(visualCue)}
                </p>
              )}
              {screenCue && <p class="guide-rail__super">{firstCueLine(screenCue)}</p>}
            </>
          )}
        </aside>
      )}

      <div
        ref={scrollerRef}
        class="presenter__scroll"
        data-testid="presenter-scroll"
        tabIndex={0}
        aria-label="Script scroll area"
      >
        <div
          class="presenter__script-wrap"
          style={{
            '--focus-position': `${preferences.focusPosition}vh`,
            '--text-width': `${preferences.textWidth}%`,
          }}
        >
          <div
            ref={scriptElementRef}
            class="presenter__script"
            style={{
              fontSize: `${preferences.fontSize}px`,
              lineHeight: preferences.lineHeight,
              textAlign: preferences.alignment,
              transform: `scale(${preferences.mirror ? -1 : 1}, ${preferences.verticalFlip ? -1 : 1})`,
            }}
          >
            {segments.map((segment) => {
              if (segment.kind === 'gap') {
                return <span key={`g-${segment.start}`}>{segment.text}</span>;
              }
              const isLive =
                segment.start >= highlight.liveStart && segment.end <= highlight.liveEnd;
              const isTrail =
                !isLive &&
                segment.start >= highlight.trailStart &&
                segment.start < highlight.liveStart;
              const className = isLive
                ? 'script-word script-word--live'
                : isTrail
                  ? 'script-word script-word--trail'
                  : 'script-word';
              return (
                <span
                  key={`w-${segment.start}`}
                  class={className}
                  data-script-word="true"
                  data-start={segment.start}
                  data-end={segment.end}
                >
                  {segment.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <header class="presenter__topbar">
        <div class="presenter__brand">
          teleprompter<span>.wtf</span>
        </div>
        <div class="presenter__readout" aria-live="polite">
          <span>{Math.round(progress * 100)}%</span>
          <span>about {formatDuration(remaining)} left</span>
          {guide.kind === 'guided' && activeSection && (
            <span data-testid="guide-beat">
              {activeSection.timecodeLabel ? `${activeSection.timecodeLabel} · ` : ''}
              {activeSection.title}
              {activeSection.fit === 'tight' ? ' · tight' : ''}
            </span>
          )}
        </div>
        <button class="control-button control-button--exit" onClick={() => void exit()}>
          Exit presenter
        </button>
      </header>

      <div class="presenter__controls">
        <button class="control-button control-button--primary" onClick={togglePlay}>
          {playing ? 'Pause' : progress >= 1 ? 'Play again' : 'Resume'}
          <kbd>Space</kbd>
        </button>
        <div class="speed-stepper" aria-label="Scroll speed">
          <button class="control-button" onClick={() => changeSpeed(-1)} aria-label="Slower">
            −
          </button>
          <output aria-live="polite">
            <b>{preferences.baseScrollSpeed}</b>
            <span>Speed</span>
          </output>
          <button class="control-button" onClick={() => changeSpeed(1)} aria-label="Faster">
            +
          </button>
        </div>
        <button class="control-button" onClick={restart}>
          Restart
        </button>
        <VoiceTrackingControls
          script={displayScript}
          mode={preferences.voiceMode}
          onModeChange={(voiceMode) => updatePreference('voiceMode', voiceMode)}
          onMultiplier={updateVoiceMultiplier}
          onAlignment={applyAlignment}
          onVoiceActivity={handleVoiceActivity}
        />
        <RecordingControl />
        <PictureInPictureControl
          script={displayScript}
          progress={progress}
          playing={playing}
          onTogglePlay={togglePlay}
        />
        <button
          ref={settingsButtonRef}
          class="control-button"
          onClick={() => {
            analytics.track('opened_appearance_panel');
            setSettingsOpen(true);
          }}
        >
          Appearance
        </button>
        <button
          ref={shortcutsButtonRef}
          class="control-button"
          onClick={() => {
            analytics.track('opened_shortcuts_panel');
            setShortcutsOpen(true);
          }}
        >
          Shortcuts
        </button>
        {capabilities.fullscreen && (
          <button class="control-button" onClick={() => void toggleFullscreen()}>
            {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        )}
      </div>

      {settingsOpen && (
        <div class="presenter__scrim" onClick={closeSettings}>
          <section
            ref={settingsPanelRef}
            class="settings-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appearance-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Presenter settings</p>
                <h2 id="appearance-title">Appearance</h2>
              </div>
              <button ref={settingsDoneRef} class="control-button" onClick={closeSettings}>
                Done
              </button>
            </div>
            <SettingControls preferences={preferences} onChange={onPreferencesChange} />
          </section>
        </div>
      )}

      {shortcutsOpen && (
        <div class="presenter__scrim" onClick={closeShortcuts}>
          <section
            ref={shortcutsPanelRef}
            class="shortcuts-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Keyboard</p>
                <h2 id="shortcuts-title">Shortcuts</h2>
              </div>
              <button ref={shortcutsDoneRef} class="control-button" onClick={closeShortcuts}>
                Done
              </button>
            </div>
            <dl class="shortcut-list">
              <div>
                <dt>
                  <kbd>Space</kbd>
                </dt>
                <dd>Play or pause</dd>
              </div>
              <div>
                <dt>
                  <kbd>↑</kbd> <kbd>↓</kbd>
                </dt>
                <dd>Faster or slower</dd>
              </div>
              <div>
                <dt>
                  <kbd>[</kbd> <kbd>]</kbd>
                </dt>
                <dd>Smaller or larger text</dd>
              </div>
              <div>
                <dt>
                  <kbd>F</kbd>
                </dt>
                <dd>Toggle fullscreen</dd>
              </div>
              <div>
                <dt>
                  <kbd>M</kbd>
                </dt>
                <dd>Mirror horizontally</dd>
              </div>
              <div>
                <dt>
                  <kbd>Home</kbd>
                </dt>
                <dd>Return to the beginning</dd>
              </div>
              <div>
                <dt>
                  <kbd>Esc</kbd>
                </dt>
                <dd>Close or exit presenter</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}
