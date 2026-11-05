import { countWords } from './words';

export function durationAtWpm(words: number, wpm: number): number {
  return wpm > 0 ? Math.ceil((words / wpm) * 60) : 0;
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
