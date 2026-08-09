import { useMemo, useState } from 'preact/hooks';
import {
  durationSeconds,
  formatDuration,
  paceInterpretation,
  requiredWpm,
} from '../domain/calculations';

type Mode = 'find-pace' | 'find-time';

export default function SpeedCalculator(): preact.JSX.Element {
  const [mode, setMode] = useState<Mode>('find-pace');
  const [words, setWords] = useState(750);
  const [minutes, setMinutes] = useState(5);
  const [wpm, setWpm] = useState(130);
  const calculatedWpm = useMemo(() => requiredWpm(words, minutes * 60), [words, minutes]);
  const calculatedTime = useMemo(() => durationSeconds(words, wpm), [words, wpm]);

  return (
    <section class="tool-card" aria-labelledby="calculator-heading">
      <div class="tool-tabs" role="tablist" aria-label="Calculation type">
        <button
          role="tab"
          aria-selected={mode === 'find-pace'}
          onClick={() => setMode('find-pace')}
        >
          Find my pace
        </button>
        <button
          role="tab"
          aria-selected={mode === 'find-time'}
          onClick={() => setMode('find-time')}
        >
          Find my time
        </button>
      </div>

      <div class="calculator-grid">
        <div class="calculator-fields">
          <label>
            Script length
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
          {mode === 'find-pace' ? (
            <label>
              Available time
              <span class="input-with-unit">
                <input
                  type="number"
                  min="0.1"
                  max="600"
                  step="0.5"
                  inputMode="decimal"
                  value={minutes}
                  onInput={(event) => setMinutes(Math.max(0, Number(event.currentTarget.value)))}
                />
                <span>minutes</span>
              </span>
            </label>
          ) : (
            <label>
              Speaking pace
              <span class="input-with-unit">
                <input
                  type="number"
                  min="40"
                  max="400"
                  inputMode="numeric"
                  value={wpm}
                  onInput={(event) => setWpm(Math.max(0, Number(event.currentTarget.value)))}
                />
                <span>WPM</span>
              </span>
            </label>
          )}
        </div>

        <output class="calculator-result" id="calculator-heading" aria-live="polite">
          {mode === 'find-pace' ? (
            <>
              <span>Your required pace</span>
              <strong>
                {Math.round(calculatedWpm)} <small>WPM</small>
              </strong>
              <p>
                {calculatedWpm
                  ? paceInterpretation(calculatedWpm)
                  : 'Enter a script length and duration.'}
              </p>
            </>
          ) : (
            <>
              <span>Your estimated time</span>
              <strong>{formatDuration(calculatedTime)}</strong>
              <p>Allow a little extra time for pauses, emphasis, and audience reaction.</p>
            </>
          )}
        </output>
      </div>
    </section>
  );
}
