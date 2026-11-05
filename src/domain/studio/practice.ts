import { durationAtWpm } from './timing';

export type PracticeFit = 'under' | 'on_target' | 'over' | 'no_target';

export interface PracticeSummary {
  percent: number;
  seconds: number;
  averageWpm: number;
  /** Compares the pace of this run, projected to the whole script, against the target. */
  fit: PracticeFit;
  projectedSeconds: number;
}

export function practicePercent(wordsPassed: number, spokenWords: number): number {
  return spokenWords > 0 ? Math.min(100, Math.floor((wordsPassed / spokenWords) * 100)) : 0;
}

export function practiceSummary(
  wordsPassed: number,
  spokenWords: number,
  activeSeconds: number,
  targetSeconds: number,
): PracticeSummary {
  const averageWpm = activeSeconds > 0 ? Math.round(wordsPassed / (activeSeconds / 60)) : 0;
  const projectedSeconds = durationAtWpm(spokenWords, averageWpm);
  let fit: PracticeFit = 'no_target';
  if (targetSeconds > 0 && averageWpm > 0) {
    if (projectedSeconds < targetSeconds * 0.9) fit = 'under';
    else if (projectedSeconds > targetSeconds * 1.1) fit = 'over';
    else fit = 'on_target';
  }
  return {
    percent: practicePercent(wordsPassed, spokenWords),
    seconds: Math.round(activeSeconds),
    averageWpm,
    fit,
    projectedSeconds,
  };
}

export function paceBucket(wpm: number) {
  if (wpm < 120) return 'under_120' as const;
  if (wpm < 150) return '120_150' as const;
  return wpm < 180 ? ('150_180' as const) : ('180_plus' as const);
}
