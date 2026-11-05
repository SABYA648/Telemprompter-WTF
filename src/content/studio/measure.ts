/**
 * Word counting for content validation. Mirrors the Studio rules in 11.6
 * (what is spoken) and 11.6 words.ts (Intl.Segmenter word-like segments).
 */

export const CUE_NAMES = ['pause', 'breathe', 'smile', 'look up', 'slow', 'fast', 'cut'] as const;

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

export function countWords(text: string): number {
  let count = 0;
  for (const part of segmenter.segment(text)) if (part.isWordLike) count += 1;
  return count;
}

export function countWhitespaceWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

/** The text a speaker reads aloud, per the markup table. */
export function spokenText(body: string): string {
  const lines: string[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('# ')) continue;
    if (line.startsWith('//')) continue;
    lines.push(line);
  }
  return lines
    .join('\n')
    .replace(/\[(?:b-roll|note):[^\]]*\]/gi, ' ')
    .replace(/\[(?:pause|breathe|smile|look up|slow|fast|cut)\]/gi, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/\{([^}]+)\}/g, '$1');
}

export function spokenWordCount(body: string): number {
  return countWords(spokenText(body));
}

export function secondsAt(words: number, wpm = 140): number {
  return (words / wpm) * 60;
}

/** Inclusive band for a target at a pace: target +/- 20%. */
export function targetBand(targetSeconds: number, wpm = 140): [number, number] {
  const words = (targetSeconds / 60) * wpm;
  return [Math.ceil(words * 0.8), Math.floor(words * 1.2)];
}

/** Count every string value reachable in a value (for unique-word bounds). */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === 'object')
    for (const item of Object.values(value)) collectStrings(item, out);
  return out;
}
