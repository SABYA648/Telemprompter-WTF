import { useMemo, useState } from 'preact/hooks';
import { durationSeconds, formatDuration } from '../domain/calculations';

const PACES = [100, 120, 130, 150, 180] as const;

export default function WordsToMinutes(): preact.JSX.Element {
  const [words, setWords] = useState(1000);
  const rows = useMemo(
    () => PACES.map((wpm) => ({ wpm, duration: durationSeconds(words, wpm) })),
    [words],
  );

  return (
    <section class="tool-card words-tool" aria-labelledby="words-result-heading">
      <label class="standalone-number">
        How many words?
        <span class="input-with-unit">
          <input
            type="number"
            min="1"
            max="100000"
            inputMode="numeric"
            value={words}
            onInput={(event) => setWords(Math.max(0, Number(event.currentTarget.value)))}
          />
          <span>words</span>
        </span>
      </label>

      <div class="pace-table-wrap">
        <table class="pace-table">
          <caption id="words-result-heading">Estimated speaking times</caption>
          <thead>
            <tr>
              <th scope="col">Delivery</th>
              <th scope="col">Pace</th>
              <th scope="col">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ wpm, duration }) => (
              <tr>
                <th scope="row">
                  {wpm === 100
                    ? 'Deliberate'
                    : wpm === 120
                      ? 'Relaxed'
                      : wpm === 130
                        ? 'Conversational'
                        : wpm === 150
                          ? 'Brisk'
                          : 'Fast'}
                </th>
                <td>{wpm} WPM</td>
                <td>
                  <strong>{formatDuration(duration)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="form-note">
        These are estimates. Pauses, demonstrations, and audience interaction add time.
      </p>
    </section>
  );
}
