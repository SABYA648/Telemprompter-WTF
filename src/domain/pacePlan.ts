import { durationSeconds } from './calculations';

/**
 * Live pace cues.
 *
 * A speaker cannot act on "you are at 118 words per minute". They can act on "you are running
 * behind". So the signal is drift against the plan in seconds, not rate: how far ahead of or behind
 * schedule the delivery is at the word currently being spoken. Rate is what causes drift, and drift
 * is what the speaker actually has to fix.
 *
 * Everything here is hysteresis. A cue that flickers is worse than no cue, because it takes the eye
 * off the line at random. A state has to hold before it is shown, has to clear before it is
 * withdrawn, and cannot change twice in quick succession.
 */

export type CueState = 'steady' | 'push' | 'ease';

export interface CueReading {
  state: CueState;
  /** Positive means ahead of plan and free to slow down. Negative means behind. */
  driftSeconds: number;
  /** How far past the threshold the drift is, 0 to 1, for scaling the cue's strength. */
  magnitude: number;
}

export interface CueInput {
  /** Seconds the plan says should have elapsed by the current word. */
  plannedSeconds: number;
  /** Seconds actually spent speaking, excluding pauses. */
  elapsedSeconds: number;
  /** Planned length of the whole delivery, used to scale the thresholds. */
  totalSeconds: number;
  at: number;
}

export const CUE = {
  /** Drift must exceed the larger of this and a share of the total before a cue appears. */
  minimumDriftSeconds: 4,
  driftShareOfTotal: 0.03,
  /** Cues clear well before they appear, so a recovering speaker is not nagged. */
  clearFraction: 0.6,
  /** How long a state must hold before it is shown. */
  enterHoldMs: 3_000,
  /** How long the drift must sit inside the clear band before the cue is withdrawn. */
  exitHoldMs: 1_500,
  /** No two changes closer together than this, whatever the drift does. */
  minimumSwitchMs: 4_000,
} as const;

/** Planned length of the delivery: an explicit target if set, otherwise the speaking rate implies one. */
export function plannedTotalSeconds(
  wordCount: number,
  speakingWpm: number,
  targetDurationSeconds: number,
): number {
  if (Number.isFinite(targetDurationSeconds) && targetDurationSeconds > 0) {
    return targetDurationSeconds;
  }
  return durationSeconds(wordCount, speakingWpm);
}

/** Seconds the plan allows for reaching `wordIndex`. */
export function plannedSecondsAtWord(
  wordIndex: number,
  wordCount: number,
  totalSeconds: number,
): number {
  if (wordCount <= 0 || totalSeconds <= 0) return 0;
  const clamped = Math.min(wordCount, Math.max(0, wordIndex));
  return (clamped / wordCount) * totalSeconds;
}

export function driftThresholds(totalSeconds: number): { enter: number; clear: number } {
  const enter = Math.max(CUE.minimumDriftSeconds, totalSeconds * CUE.driftShareOfTotal);
  return { enter, clear: enter * CUE.clearFraction };
}

export class PaceCueEngine {
  private state: CueState = 'steady';
  private candidate: CueState = 'steady';
  private candidateSince: number | null = null;
  private lastChangeAt = Number.NEGATIVE_INFINITY;

  reset(): void {
    this.state = 'steady';
    this.candidate = 'steady';
    this.candidateSince = null;
    this.lastChangeAt = Number.NEGATIVE_INFINITY;
  }

  update(input: CueInput): CueReading {
    const { enter, clear } = driftThresholds(input.totalSeconds);
    const drift = input.plannedSeconds - input.elapsedSeconds;

    // Ahead of plan means there is time in hand, so the advice is to ease off.
    const wanted: CueState =
      drift > enter
        ? 'ease'
        : drift < -enter
          ? 'push'
          : Math.abs(drift) < clear
            ? 'steady'
            : this.state;

    if (wanted !== this.candidate) {
      this.candidate = wanted;
      this.candidateSince = input.at;
    }

    const hold = wanted === 'steady' ? CUE.exitHoldMs : CUE.enterHoldMs;
    const held = this.candidateSince === null ? 0 : input.at - this.candidateSince;
    const sinceChange = input.at - this.lastChangeAt;

    if (wanted !== this.state && held >= hold && sinceChange >= CUE.minimumSwitchMs) {
      this.state = wanted;
      this.lastChangeAt = input.at;
    }

    const magnitude =
      this.state === 'steady'
        ? 0
        : Math.min(1, Math.max(0, (Math.abs(drift) - clear) / Math.max(1e-6, enter * 2)));

    return { state: this.state, driftSeconds: drift, magnitude };
  }
}

/** A signed clock label such as "+0:12" or "-1:05". Empty when the drift is not worth showing. */
export function formatDrift(driftSeconds: number): string {
  if (!Number.isFinite(driftSeconds) || Math.abs(driftSeconds) < 3) return '';
  const sign = driftSeconds > 0 ? '+' : '-';
  const total = Math.round(Math.abs(driftSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')}`;
}
