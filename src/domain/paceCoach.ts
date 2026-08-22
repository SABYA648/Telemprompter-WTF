export type PaceHint = 'ok' | 'faster' | 'slower';

const SAMPLE_WINDOW_MS = 8000;
const MIN_SPAN_MS = 2800;
const MIN_WORDS = 4;
const MIN_SAMPLES = 4;
const FAST_RATIO = 1.18;
const SLOW_RATIO = 0.82;
const CLEAR_LOW = 0.9;
const CLEAR_HIGH = 1.1;
const JUMP_TOKENS = 14;

/**
 * Compare spoken token progress against the chosen speaking WPM and return a
 * stable faster / slower cue. Large skip-ahead jumps reset the window so a
 * recovered place in the script is not read as a sprint.
 */
export class PaceCoach {
  private samples: { at: number; token: number }[] = [];
  private hint: PaceHint = 'ok';
  private targetWpm: number;

  constructor(targetWpm: number) {
    this.targetWpm = Math.max(60, targetWpm);
  }

  setTargetWpm(targetWpm: number): void {
    this.targetWpm = Math.max(60, targetWpm);
  }

  reset(): void {
    this.samples = [];
    this.hint = 'ok';
  }

  observe(tokenIndex: number, now = Date.now()): PaceHint {
    const last = this.samples.at(-1);
    if (last && Math.abs(tokenIndex - last.token) > JUMP_TOKENS) {
      this.samples = [{ at: now, token: tokenIndex }];
      this.hint = 'ok';
      return this.hint;
    }
    if (last && tokenIndex === last.token) return this.hint;

    this.samples.push({ at: now, token: tokenIndex });
    const cutoff = now - SAMPLE_WINDOW_MS;
    this.samples = this.samples.filter((sample) => sample.at >= cutoff);

    if (this.samples.length < MIN_SAMPLES) return this.hint;
    const first = this.samples[0];
    if (!first) return this.hint;
    const spanMs = now - first.at;
    const words = tokenIndex - first.token;
    if (spanMs < MIN_SPAN_MS || words < MIN_WORDS) return this.hint;

    const spokenWpm = (words / spanMs) * 60_000;
    const ratio = spokenWpm / this.targetWpm;
    let next: PaceHint = 'ok';
    if (ratio >= FAST_RATIO) next = 'slower';
    else if (ratio <= SLOW_RATIO) next = 'faster';

    if (this.hint !== 'ok' && next === 'ok') {
      if (ratio > CLEAR_LOW && ratio < CLEAR_HIGH) this.hint = 'ok';
      return this.hint;
    }
    this.hint = next;
    return this.hint;
  }
}
