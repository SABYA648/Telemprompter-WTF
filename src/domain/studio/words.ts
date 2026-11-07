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

/** Where word `index` (0-based, counted exactly like `countWords`) starts, or the text length. */
export function wordOffset(value: string, index: number): number {
  try {
    let seen = 0;
    for (const segment of new Intl.Segmenter(undefined, { granularity: 'word' }).segment(value)) {
      if (segment.isWordLike && seen++ === index) return segment.index;
    }
    return value.length;
  } catch {
    return [...value.matchAll(/\S+/g)][index]?.index ?? value.length;
  }
}

export function readabilityWarning(text: string): boolean {
  return text.split(/[.!?]+/).some((sentence) => countWords(sentence) > 25);
}
