import type { ComponentChildren } from 'preact';
import { Icon } from './Icons';

/** The speed control shared by the camera tray and Practice: a gauge glyph and the number
 * between − and +, with "WPM" for screen readers only. */
export function SpeedRow({
  wpm,
  onChange,
  min = 80,
  max = 240,
  children,
}: {
  wpm: number;
  onChange: (wpm: number) => void;
  min?: number;
  max?: number;
  children?: ComponentChildren;
}) {
  return (
    <div class="studio-stepper" role="group" aria-label="Speed">
      <button
        onClick={() => onChange(Math.max(min, wpm - 5))}
        disabled={wpm <= min}
        aria-label="Slower"
      >
        −
      </button>
      <span class="studio-stepper__value">
        <Icon name="gauge" size={16} />
        {wpm}
        <span class="studio-visually-hidden"> WPM</span>
      </span>
      <button
        onClick={() => onChange(Math.min(max, wpm + 5))}
        disabled={wpm >= max}
        aria-label="Faster"
      >
        +
      </button>
      {children}
    </div>
  );
}
