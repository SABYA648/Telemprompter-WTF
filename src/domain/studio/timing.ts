import { countWords } from './words';

/** The prompter's speed range, shared by Settings, the camera tray and Practice. */
export const MIN_WPM = 80;
export const MAX_WPM = 240;

export function durationAtWpm(words: number, wpm: number): number {
  return wpm > 0 ? Math.ceil((words / wpm) * 60) : 0;
}

/** The speed, in steps of 5, that reads `words` in `targetSeconds`. Null when there is no
 * target or that speed falls outside 80 to 240 WPM, so the caller keeps the saved speed. */
export function fitWpm(words: number, targetSeconds: number): number | null {
  if (!(targetSeconds > 0) || words <= 0) return null;
  const wpm = Math.round((words * 60) / targetSeconds / 5) * 5;
  return wpm >= MIN_WPM && wpm <= MAX_WPM ? wpm : null;
}

/** The one speed a script opens at, in the camera, Practice, the editor and the library. */
export function scriptWpm(
  words: number,
  targetSeconds: number,
  prompter: { wpm: number; fitToTarget: boolean },
): number {
  return (prompter.fitToTarget ? fitWpm(words, targetSeconds) : null) ?? prompter.wpm;
}

/** How long a script runs at the speed it opens at. */
export function scriptSeconds(
  words: number,
  targetSeconds: number,
  prompter: { wpm: number; fitToTarget: boolean },
): number {
  return durationAtWpm(words, scriptWpm(words, targetSeconds, prompter));
}

export function fitForTarget(
  words: number,
  targetSeconds: number,
  wpm: number,
): 'under' | 'on_target' | 'over' | 'no_target' {
  if (!targetSeconds) return 'no_target';
  const duration = durationAtWpm(words, wpm);
  if (duration < targetSeconds * 0.9) return 'under';
  if (duration > targetSeconds * 1.1) return 'over';
  return 'on_target';
}

export function sectionDurations(
  sections: Array<{ title: string; spokenText: string }>,
  wpm: number,
) {
  return sections.map((section) => ({
    ...section,
    seconds: durationAtWpm(countWords(section.spokenText), wpm),
  }));
}
