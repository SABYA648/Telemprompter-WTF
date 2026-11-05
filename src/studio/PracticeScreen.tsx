import { useEffect, useRef, useState } from 'preact/hooks';
import { getScript } from '../domain/studio/scriptsRepo';
import { parseMarkup } from '../domain/studio/markup';
import { durationAtWpm } from '../domain/studio/timing';
import { markActiveDay } from '../domain/studio/streak';
import type { StudioScript } from '../domain/studio/types';

export default function PracticeScreen({ id }: { id: string }) {
  const [script, setScript] = useState<StudioScript | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const credited = useRef(false);
  useEffect(() => {
    void getScript(id).then((value) => setScript(value ?? null));
  }, [id]);
  useEffect(() => {
    if (!running) return;
    let last: number | null = document.visibilityState === 'visible' ? performance.now() : null;
    const onVisibilityChange = () => {
      const now = performance.now();
      if (document.visibilityState === 'visible') last = now;
      else {
        if (last !== null) {
          const delta = (now - last) / 1000;
          setElapsed((old) => old + delta);
        }
        last = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || last === null) return;
      const now = performance.now();
      const delta = (now - last) / 1000;
      setElapsed((old) => old + delta);
      last = now;
    }, 100);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [running]);
  const words = script ? parseMarkup(script.body) : null;
  const duration = Math.max(1, durationAtWpm(words?.spokenWordCount ?? 0, 140));
  const percent = Math.min(100, Math.floor((elapsed / duration) * 100));
  useEffect(() => {
    if (words && words.spokenWordCount > 0 && percent >= 80 && !credited.current) {
      credited.current = true;
      void markActiveDay();
    }
    if (percent >= 100) setRunning(false);
  }, [percent, words?.spokenWordCount]);
  if (!script)
    return (
      <section class="studio-screen">
        <h1>Practice</h1>
        <p>Script not found.</p>
      </section>
    );
  return (
    <section class="studio-screen studio-practice">
      <a href={`#/scripts/${script.id}`}>← Editor</a>
      <h1>Practice: {script.title}</h1>
      <p>Read at 140 WPM. A practice run counts when you reach 80%.</p>
      <div class="studio-card">
        <p class="studio-practice-script">{words?.spokenText}</p>
      </div>
      <progress value={percent} max="100" aria-label="Practice progress" />
      <p aria-live="polite">
        {percent}% complete{percent >= 80 ? '. Practice counted for today.' : ''}
      </p>
      <div class="studio-actions">
        <button
          class="studio-button"
          disabled={!words?.spokenWordCount}
          onClick={() => setRunning(!running)}
        >
          {running ? 'Pause' : elapsed ? 'Resume' : 'Start practice'}
        </button>
        <button
          class="studio-button studio-button--quiet"
          onClick={() => {
            setRunning(false);
            setElapsed(0);
            credited.current = false;
          }}
        >
          Restart
        </button>
      </div>
    </section>
  );
}
