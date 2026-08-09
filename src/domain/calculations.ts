export function countWords(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/u).filter(Boolean).length;
}

export function durationSeconds(wordCount: number, wordsPerMinute: number): number {
  if (!Number.isFinite(wordCount) || !Number.isFinite(wordsPerMinute)) return 0;
  if (wordCount <= 0 || wordsPerMinute <= 0) return 0;
  return (wordCount / wordsPerMinute) * 60;
}

export function requiredWpm(wordCount: number, durationInSeconds: number): number {
  if (!Number.isFinite(wordCount) || !Number.isFinite(durationInSeconds)) return 0;
  if (wordCount <= 0 || durationInSeconds <= 0) return 0;
  return wordCount / (durationInSeconds / 60);
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0 min';
  const rounded = Math.max(1, Math.round(totalSeconds));
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

export function paceInterpretation(wpm: number): string {
  if (wpm < 100) return 'Very deliberate. Useful for emphasis or complex material.';
  if (wpm < 130) return 'Calm and clear. A comfortable presentation pace.';
  if (wpm <= 160) return 'Conversational. Natural for most videos and talks.';
  if (wpm <= 190) return 'Brisk. Rehearse to keep the delivery easy to follow.';
  return 'Very fast. Consider shortening the script or allowing more time.';
}
