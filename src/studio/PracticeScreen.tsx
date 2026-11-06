import { useEffect, useRef, useState } from 'preact/hooks';
import { getScript } from '../domain/studio/scriptsRepo';
import { parseMarkup } from '../domain/studio/markup';
import {
  paceBucket,
  practicePercent,
  practiceSummary,
  type PracticeFit,
} from '../domain/studio/practice';
import { loadSettings, sessionTargetSeconds } from '../domain/studio/settings';
import { markActiveDay } from '../domain/studio/streak';
import { refreshBadges } from '../domain/studio/habits';
import { analytics, progressBucket } from '../domain/analytics';
import type { StudioScript } from '../domain/studio/types';

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
    void getScript(id).then((value) => setScript(value ?? null));
    void loadSettings().then((value) => setWpm(value.prompter.wpm));
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
  const summary = practiceSummary(
    Math.min(wordsPassed, spokenWords),
    spokenWords,
    activeSeconds,
    script ? (sessionTargetSeconds(script.id) ?? script.targetSeconds) : 0,
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
      <div
        class="studio-practice-prompter"
        ref={scroller}
        onClick={toggle}
        data-testid="practice-prompter"
      >
        <p class="studio-practice-script">{words?.spokenText}</p>
      </div>
      <div class="studio-practice-heading">
        <a href={`#/scripts/${script.id}`}>Editor</a>
        <h1>Practice: {script.title}</h1>
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
        <p aria-live="polite">
          {percent}% complete{percent >= 80 ? '. Practice counted for today.' : ''}
        </p>
        <div class="studio-practice-strip">
          <button
            aria-label="Slower"
            disabled={wpm <= 80}
            onClick={() => setWpm(Math.max(80, wpm - 5))}
          >
            −
          </button>
          <span>{wpm} WPM</span>
          <button
            aria-label="Faster"
            disabled={wpm >= 240}
            onClick={() => setWpm(Math.min(240, wpm + 5))}
          >
            +
          </button>
          <label>
            <input
              type="checkbox"
              checked={cameraOn}
              onChange={(event) => setCameraOn(event.currentTarget.checked)}
            />{' '}
            Camera preview
          </label>
        </div>
        <div class="studio-actions">
          <button class="studio-button" disabled={!spokenWords || finished} onClick={toggle}>
            {running ? 'Pause' : activeSeconds ? 'Resume' : 'Start practice'}
          </button>
          <button
            class="studio-button studio-button--quiet"
            disabled={!activeSeconds || finished}
            onClick={() => {
              setRunning(false);
              setFinished(true);
            }}
          >
            Finish practice
          </button>
          <button
            class="studio-button studio-button--quiet"
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
            Restart
          </button>
        </div>
      </div>
    </section>
  );
}
