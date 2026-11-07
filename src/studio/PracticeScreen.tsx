import { useEffect, useRef, useState } from 'preact/hooks';
import { getScript } from '../domain/studio/scriptsRepo';
import { parseMarkup } from '../domain/studio/markup';
import {
  paceBucket,
  practicePercent,
  practiceSummary,
  type PracticeFit,
} from '../domain/studio/practice';
import { loadSettings, scriptTargetSeconds } from '../domain/studio/settings';
import { MAX_WPM, MIN_WPM, scriptWpm } from '../domain/studio/timing';
import { markActiveDay } from '../domain/studio/streak';
import { refreshBadges } from '../domain/studio/habits';
import { analytics, progressBucket } from '../domain/analytics';
import type { KeyAction, StudioScript } from '../domain/studio/types';
import { watchGamepads } from '../domain/studio/gamepad';
import { PrompterBroadcast, operatorRequested } from '../domain/studio/operator';
import { Icon } from './Icons';
import { SpeedRow } from './SpeedRow';

const FIT_COPY: Record<PracticeFit, string> = {
  under: 'Under target',
  on_target: 'On target',
  over: 'Over target',
  no_target: 'No target set',
};

export default function PracticeScreen({ id }: { id: string }) {
  const [script, setScript] = useState<StudioScript | null>(null);
  const [running, setRunning] = useState(false);
  const [wpm, setWpm] = useState(140);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [wordsPassed, setWordsPassed] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [finished, setFinished] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const reported = useRef(false);
  const credited = useRef(false);
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;
  useEffect(() => {
    // Practice opens at the camera's speed, fit to target included, so both agree.
    void Promise.all([getScript(id), loadSettings()]).then(([value, saved]) => {
      setScript(value ?? null);
      setWpm(
        value
          ? scriptWpm(
              parseMarkup(value.body).spokenWordCount,
              scriptTargetSeconds(value),
              saved.prompter,
            )
          : saved.prompter.wpm,
      );
    });
  }, [id]);
  useEffect(() => {
    if (!cameraOn) return;
    let active = true;
    let stream: MediaStream | null = null;
    setCameraError('');
    const fail = () => {
      setCameraError('Camera unavailable. You can practice without it.');
      setCameraOn(false);
    };
    if (!navigator.mediaDevices?.getUserMedia) {
      fail();
      return;
    }
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((value) => {
        if (!active) {
          value.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = value;
        if (video.current) video.current.srcObject = value;
      })
      .catch(() => {
        if (active) fail();
      });
    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn]);
  useEffect(() => {
    if (!running) return;
    const advance = (seconds: number) => {
      setActiveSeconds((old) => old + seconds);
      setWordsPassed((old) => old + (seconds * wpmRef.current) / 60);
    };
    let last: number | null = document.visibilityState === 'visible' ? performance.now() : null;
    const onVisibilityChange = () => {
      const now = performance.now();
      if (document.visibilityState === 'visible') last = now;
      else {
        if (last !== null) advance((now - last) / 1000);
        last = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || last === null) return;
      const now = performance.now();
      advance((now - last) / 1000);
      last = now;
    }, 100);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [running]);
  const words = script ? parseMarkup(script.body) : null;
  const spokenWords = words?.spokenWordCount ?? 0;
  const percent = practicePercent(wordsPassed, spokenWords);
  const progress = spokenWords ? Math.min(1, wordsPassed / spokenWords) : 0;
  const broadcast = useRef<PrompterBroadcast | null>(null);
  useEffect(() => {
    if (!operatorRequested()) return;
    broadcast.current = new PrompterBroadcast();
    return () => {
      broadcast.current?.close();
      broadcast.current = null;
    };
  }, []);
  useEffect(() => {
    if (script) broadcast.current?.send({ body: script.body, progress, wpm, playing: running });
  }, [script?.body, progress, wpm, running]);
  const summary = practiceSummary(
    Math.min(wordsPassed, spokenWords),
    spokenWords,
    activeSeconds,
    script ? scriptTargetSeconds(script) : 0,
  );
  useEffect(() => {
    if (scroller.current)
      scroller.current.scrollTop =
        ((scroller.current.scrollHeight - scroller.current.clientHeight) * percent) / 100;
  }, [percent]);
  useEffect(() => {
    if (spokenWords > 0 && percent >= 80 && !credited.current) {
      credited.current = true;
      void markActiveDay().then(() => refreshBadges());
    }
    if (percent >= 100) {
      setRunning(false);
      setFinished(true);
    }
  }, [percent, spokenWords]);
  useEffect(() => {
    if (!finished || reported.current) return;
    reported.current = true;
    analytics.track('completed_practice', {
      progress_bucket: progressBucket(percent / 100),
      pace_bucket: paceBucket(summary.averageWpm),
    });
  }, [finished]);
  const toggle = () => {
    if (finished || !spokenWords) return;
    if (running) setPauses((count) => count + 1);
    setRunning(!running);
  };
  const usedGamepad = useRef(false);
  const gamepadAction = useRef<(action: KeyAction) => void>(() => undefined);
  gamepadAction.current = (action) => {
    // One line is the share of the script that fits in one line of the practice prompter.
    const el = scroller.current;
    const lineWords =
      el && spokenWords
        ? (spokenWords * parseFloat(getComputedStyle(el).lineHeight || '0')) /
          Math.max(1, el.scrollHeight)
        : 0;
    if (action === 'toggleScroll') toggle();
    else if (action === 'faster') setWpm(Math.min(MAX_WPM, wpm + 5));
    else if (action === 'slower') setWpm(Math.max(MIN_WPM, wpm - 5));
    else if (action === 'lineForward')
      setWordsPassed((old) => Math.min(spokenWords, old + (lineWords || 6)));
    else if (action === 'lineBack') setWordsPassed((old) => Math.max(0, old - (lineWords || 6)));
    else return;
    if (!usedGamepad.current) {
      usedGamepad.current = true;
      analytics.track('used_remote_key', { device: 'gamepad' });
    }
  };
  useEffect(() => watchGamepads((action) => gamepadAction.current(action)), []);
  if (!script)
    return (
      <section class="studio-screen">
        <h1>Practice</h1>
        <p>Script not found.</p>
      </section>
    );
  return (
    <section class={`studio-screen studio-practice${cameraOn ? ' has-camera' : ''}`}>
      {cameraOn && <video ref={video} autoPlay muted playsInline class="studio-practice-camera" />}
      <h1 class="studio-practice-title">
        <span class="studio-visually-hidden">Practice: </span>
        {script.title || 'Untitled script'}
      </h1>
      <div
        class="studio-practice-prompter"
        ref={scroller}
        onClick={toggle}
        data-testid="practice-prompter"
      >
        <p class="studio-practice-script">{words?.spokenText}</p>
      </div>
      <div class="studio-practice-controls">
        {cameraError && <p role="status">{cameraError}</p>}
        {finished && (
          <section class="studio-card" aria-label="Practice summary">
            <h2>Practice summary</h2>
            <ul class="studio-practice-summary">
              <li>Duration: {summary.seconds} seconds</li>
              <li>Average pace: {summary.averageWpm} WPM</li>
              <li>Pauses: {pauses}</li>
              <li>Target fit: {FIT_COPY[summary.fit]}</li>
              <li>{percent}% of the script</li>
            </ul>
            <a class="studio-button" href={`#/record/${script.id}`}>
              Record this script
            </a>
          </section>
        )}
        <progress value={percent} max="100" aria-label="Practice progress" />
        <p class="studio-practice-status" aria-live="polite">
          <span class="studio-visually-hidden">{percent}% complete.</span>
          {percent >= 80 ? ' Practice counted for today.' : ''}
        </p>
        <SpeedRow wpm={wpm} onChange={setWpm} />
        {/* The camera's shutter row: close, camera, play (the one accent), restart, finish.
            Camera, Restart and Done carry an 11px word; Done shows only once it can act. */}
        <div class="studio-practice-row">
          <a href={`#/scripts/${script.id}`} aria-label="Close practice">
            <Icon name="close" />
          </a>
          <button
            role="switch"
            aria-checked={cameraOn}
            aria-label="Camera preview"
            class={cameraOn ? 'studio-captioned is-on' : 'studio-captioned'}
            onClick={() => setCameraOn(!cameraOn)}
          >
            <span class="studio-captioned__disc">
              <Icon name="camera" />
            </span>
            <span class="studio-captioned__label" aria-hidden="true">
              Camera
            </span>
          </button>
          <button
            class={finished ? 'studio-practice-play' : 'studio-practice-play is-primary'}
            disabled={!spokenWords || finished}
            onClick={toggle}
            aria-label={running ? 'Pause' : activeSeconds ? 'Resume' : 'Start practice'}
          >
            <Icon name={running ? 'pause' : 'play'} size={30} />
          </button>
          <button
            class="studio-captioned"
            aria-label="Restart"
            onClick={() => {
              setRunning(false);
              setActiveSeconds(0);
              setWordsPassed(0);
              setPauses(0);
              setFinished(false);
              reported.current = false;
              credited.current = false;
            }}
          >
            <span class="studio-captioned__disc">
              <Icon name="restart" />
            </span>
            <span class="studio-captioned__label" aria-hidden="true">
              Restart
            </span>
          </button>
          {activeSeconds > 0 && !finished ? (
            <button
              class="studio-captioned"
              aria-label="Finish practice"
              onClick={() => {
                setRunning(false);
                setFinished(true);
              }}
            >
              <span class="studio-captioned__disc">
                <Icon name="check" />
              </span>
              <span class="studio-captioned__label" aria-hidden="true">
                Done
              </span>
            </button>
          ) : (
            <span class="studio-practice-row__spacer" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
}
