export function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  try {
    const segments = new Intl.Segmenter(undefined, { granularity: 'word' }).segment(trimmed);
    return [...segments].filter((segment) => segment.isWordLike).length;
  } catch {
    return trimmed.split(/\s+/).filter(Boolean).length;
  }
}

export function readabilityWarning(text: string): boolean {
  return text.split(/[.!?]+/).some((sentence) => countWords(sentence) > 25);
}
