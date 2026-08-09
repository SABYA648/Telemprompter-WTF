export interface ScriptSegment {
  text: string;
  start: number;
  end: number;
  kind: 'word' | 'gap';
}

export interface HighlightWindow {
  trailStart: number;
  liveStart: number;
  liveEnd: number;
}

const WORD_PATTERN = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;

/** Split a script into display words and intervening gaps for sync highlighting. */
export function segmentScript(script: string): ScriptSegment[] {
  const segments: ScriptSegment[] = [];
  let cursor = 0;
  for (const match of script.matchAll(WORD_PATTERN)) {
    if (match.index === undefined) continue;
    if (match.index > cursor) {
      segments.push({
        text: script.slice(cursor, match.index),
        start: cursor,
        end: match.index,
        kind: 'gap',
      });
    }
    segments.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      kind: 'word',
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < script.length) {
    segments.push({
      text: script.slice(cursor),
      start: cursor,
      end: script.length,
      kind: 'gap',
    });
  }
  return segments;
}

export function wordSegments(segments: ScriptSegment[]): ScriptSegment[] {
  return segments.filter((segment) => segment.kind === 'word');
}

/**
 * Build a soft reading window around a character offset:
 * a short spoken trail plus a live cluster of words under the focus line.
 */
export function highlightWindowAround(
  segments: ScriptSegment[],
  centerChar: number,
  trailWords = 5,
  liveWords = 4,
): HighlightWindow {
  const words = wordSegments(segments);
  if (!words.length) {
    return { trailStart: 0, liveStart: 0, liveEnd: 0 };
  }

  let index = words.findIndex((word) => centerChar >= word.start && centerChar < word.end);
  if (index < 0) {
    index = words.findIndex((word) => word.start >= centerChar);
    if (index < 0) index = words.length - 1;
  }

  const liveStartIndex = Math.max(0, index);
  const liveEndIndex = Math.min(words.length - 1, liveStartIndex + Math.max(1, liveWords) - 1);
  const trailStartIndex = Math.max(0, liveStartIndex - Math.max(0, trailWords));

  return {
    trailStart: words[trailStartIndex]?.start ?? 0,
    liveStart: words[liveStartIndex]?.start ?? 0,
    liveEnd: words[liveEndIndex]?.end ?? 0,
  };
}

/**
 * Estimate which script character sits on the focus line using caret hit-testing
 * when available, falling back to scroll progress.
 */
export function estimateFocusCharacterIndex(
  scroller: HTMLElement,
  scriptElement: HTMLElement,
  focusPositionPercent: number,
  scriptLength: number,
): number {
  if (scriptLength <= 0) return 0;

  const scrollerRect = scroller.getBoundingClientRect();
  const focusY = scrollerRect.top + (focusPositionPercent / 100) * scrollerRect.height;
  const focusX = scrollerRect.left + scrollerRect.width * 0.5;

  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };

  try {
    if (typeof doc.caretRangeFromPoint === 'function') {
      const range = doc.caretRangeFromPoint(focusX, focusY);
      if (range && scriptElement.contains(range.startContainer)) {
        const pre = document.createRange();
        pre.selectNodeContents(scriptElement);
        pre.setEnd(range.startContainer, range.startOffset);
        return Math.min(scriptLength, Math.max(0, pre.toString().length));
      }
    } else if (typeof doc.caretPositionFromPoint === 'function') {
      const position = doc.caretPositionFromPoint(focusX, focusY);
      if (position && scriptElement.contains(position.offsetNode)) {
        const pre = document.createRange();
        pre.selectNodeContents(scriptElement);
        pre.setEnd(position.offsetNode, position.offset);
        return Math.min(scriptLength, Math.max(0, pre.toString().length));
      }
    }
  } catch {
    // Fall through to progress-based estimate.
  }

  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const progress = maxScroll <= 0 ? 0 : scroller.scrollTop / maxScroll;
  return Math.min(scriptLength, Math.max(0, Math.round(progress * scriptLength)));
}
