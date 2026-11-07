import { useEffect, useState } from 'preact/hooks';
import {
  endBatch,
  finishBatchEarly,
  hasBatchBadge,
  readBatch,
  startBatch,
} from '../domain/studio/batch';
import { upNext } from '../domain/studio/queue';
import { listScripts } from '../domain/studio/scriptsRepo';
import { getTake } from '../domain/studio/takesRepo';
import { exportTakes } from '../domain/studio/exportTake';
import type { StudioScript, StudioTake } from '../domain/studio/types';

export default function BatchScreen() {
  const [scripts, setScripts] = useState<StudioScript[]>([]);
  const [state, setState] = useState(readBatch());
  const [seconds, setSeconds] = useState(5);
  const [message, setMessage] = useState('');
  const [badge, setBadge] = useState(false);
  useEffect(() => {
    void listScripts().then(setScripts);
    void hasBatchBadge().then(setBadge);
  }, []);
  const queue = upNext(scripts);
  const titleOf = (id: string) => scripts.find((script) => script.id === id)?.title ?? 'Script';
  const complete = Boolean(state && state.index >= state.ids.length);
  const betweenTakes = Boolean(state && !complete && state.takeIds.length);
  useEffect(() => {
    if (!state || !betweenTakes) return;
    if (seconds === 0) {
      location.hash = `#/record/${state.ids[state.index]}`;
      return;
    }
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [state?.index, seconds, betweenTakes]);
  const saveAll = async () => {
    if (!state) return;
    const takes = (await Promise.all(state.takeIds.map(getTake))).filter(
      (take): take is StudioTake => Boolean(take),
    );
    const titles = Object.fromEntries(scripts.map((script) => [script.id, script.title]));
    try {
      const method = await exportTakes(takes, titles);
      if (method !== 'cancel') setMessage('Takes saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save takes.');
    }
  };
  return (
    <section class="studio-screen">
      <h1>Batch recording</h1>
      {!state && (
        <>
          <p>Queue at least two scripts in Up next to record them in order.</p>
          <ol>
            {queue.map((script) => (
              <li>{script.title}</li>
            ))}
          </ol>
          <div class="studio-actions">
            <button
              class="studio-button"
              disabled={queue.length < 2}
              onClick={() => {
                const next = startBatch(queue.map((script) => script.id));
                setState(next);
                location.hash = `#/record/${next.ids[0]}`;
              }}
            >
              Start batch
            </button>
            <a class="studio-button studio-button--quiet" href="#/scripts">
              All scripts
            </a>
          </div>
        </>
      )}
      {state && !complete && (
        <div class="studio-card">
          <h2>Next up: {titleOf(state.ids[state.index] ?? '')}</h2>
          <p aria-live="polite">
            Script {state.index + 1} of {state.ids.length}.{' '}
            {betweenTakes ? `Opening it in ${seconds} seconds.` : ''}
          </p>
          <div class="studio-actions">
            <button
              class="studio-button"
              onClick={() => {
                location.hash = `#/record/${state.ids[state.index]}`;
              }}
            >
              Record next now
            </button>
            <button
              class="studio-button studio-button--quiet"
              onClick={() => setState(finishBatchEarly())}
            >
              End batch
            </button>
          </div>
        </div>
      )}
      {state && complete && (
        <div class="studio-card">
          <h2>Batch complete</h2>
          <p>
            {state.takeIds.length} kept takes from {state.ids.length} scripts.
          </p>
          <ol>
            {state.ids.map((id) => (
              <li>{titleOf(id)}</li>
            ))}
          </ol>
          {badge && state.takeIds.length >= 5 && <p>Batch day badge unlocked.</p>}
          <div class="studio-actions">
            <button class="studio-button" onClick={() => void saveAll()}>
              Save all
            </button>
            <button
              class="studio-button studio-button--quiet"
              onClick={() => {
                endBatch();
                setState(null);
                location.hash = '#/takes';
              }}
            >
              Done
            </button>
          </div>
          {message && <p role="status">{message}</p>}
        </div>
      )}
    </section>
  );
}
