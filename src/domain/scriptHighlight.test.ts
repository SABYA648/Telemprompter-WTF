import { describe, expect, it } from 'vitest';
import { highlightWindowAround, segmentScript, wordSegments } from './scriptHighlight';

describe('script highlight segmentation', () => {
  it('preserves gaps and word offsets', () => {
    const script = 'Hello, world.\n\nNext line.';
    const segments = segmentScript(script);
    expect(wordSegments(segments).map((word) => word.text)).toEqual([
      'Hello',
      'world',
      'Next',
      'line',
    ]);
    expect(segments.some((segment) => segment.kind === 'gap' && segment.text.includes(','))).toBe(
      true,
    );
    expect(segments.map((segment) => segment.text).join('')).toBe(script);
  });

  it('builds a trail and live window around a character', () => {
    const script = 'One two three four five six seven eight';
    const segments = segmentScript(script);
    const five = script.indexOf('five');
    const window = highlightWindowAround(segments, five, 2, 2);
    expect(script.slice(window.trailStart, window.liveStart)).toContain('three');
    expect(script.slice(window.liveStart, window.liveEnd)).toContain('five');
    expect(script.slice(window.liveStart, window.liveEnd)).toContain('six');
  });
});
