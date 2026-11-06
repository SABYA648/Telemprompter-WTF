import { useState } from 'preact/hooks';
import { parseMarkup } from '../../domain/studio/markup';
import { durationAtWpm, fitForTarget } from '../../domain/studio/timing';
import { countWords, wordOffset } from '../../domain/studio/words';

const targets = [15, 30, 60, 90];
function partsAt(text: string, limit: number): [string, string] {
  const offset = wordOffset(text, limit);
  return [text.slice(0, offset), text.slice(offset)];
}
export default function ScriptLengthChecker(): preact.JSX.Element {
  const [script, setScript] = useState('');
  const [wpm, setWpm] = useState(140);
  const spoken = parseMarkup(script).spokenText;
  const words = countWords(spoken);
  return (
    <div class="creator-tool">
      <label for="script-input">Your script</label>
      <textarea
        id="script-input"
        rows={8}
        value={script}
        onInput={(event) => setScript(event.currentTarget.value)}
        placeholder="Paste the words you plan to say"
      />
      <label for="script-wpm">Speaking pace: {wpm} WPM</label>
      <input
        id="script-wpm"
        type="range"
        min="80"
        max="220"
        step="5"
        value={wpm}
        onInput={(event) => setWpm(Number(event.currentTarget.value))}
      />
      <p aria-live="polite">
        <strong>{words} spoken words</strong> · Estimated {durationAtWpm(words, wpm)} seconds before
        pauses
      </p>
      <h2>Target fit</h2>
      <div class="creator-tool__results">
        {targets.map((seconds) => {
          const limit = Math.floor((seconds * wpm) / 60);
          const [keep, cut] = partsAt(spoken, limit);
          return (
            <section>
              <h3>
                {seconds} seconds: {fitForTarget(words, seconds, wpm).replace('_', ' ')}
              </h3>
              <p>
                {limit} words at {wpm} WPM.{' '}
                {words > limit
                  ? `Cut about ${words - limit} words.`
                  : `${Math.max(0, limit - words)} words of room.`}
              </p>
              {cut && (
                <details>
                  <summary>Show cut point</summary>
                  <p class="creator-tool__cut">
                    {keep}
                    <mark>{cut}</mark>
                  </p>
                </details>
              )}
            </section>
          );
        })}
      </div>
      {script.trim() && (
        <button
          type="button"
          onClick={() =>
            // 13.5: the Studio data layer loads only when the visitor asks to record.
            void import('../../domain/studio/handoff').then(({ recordNewScript }) =>
              recordNewScript('My checked script', script),
            )
          }
        >
          Record this script
        </button>
      )}
    </div>
  );
}
