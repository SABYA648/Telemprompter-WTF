import { describe, expect, it } from 'vitest';
import {
  countWords,
  durationSeconds,
  formatDuration,
  paceInterpretation,
  requiredWpm,
} from './calculations';

describe('word and duration calculations', () => {
  it('counts words across whitespace and paragraph breaks', () => {
    expect(countWords('  One\ttwo\n\nthree—four  ')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(countWords('   \n ')).toBe(0);
  });

  it('calculates speaking duration', () => {
    expect(durationSeconds(260, 130)).toBe(120);
    expect(durationSeconds(100, 0)).toBe(0);
    expect(durationSeconds(-1, 130)).toBe(0);
  });

  it('calculates required words per minute', () => {
    expect(requiredWpm(650, 300)).toBe(130);
    expect(requiredWpm(650, 0)).toBe(0);
  });

  it('formats human-readable durations', () => {
    expect(formatDuration(0)).toBe('0 min');
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(120)).toBe('2 min');
    expect(formatDuration(125)).toBe('2 min 5 sec');
  });

  it('interprets pace bands', () => {
    expect(paceInterpretation(90)).toMatch(/deliberate/i);
    expect(paceInterpretation(130)).toMatch(/conversational/i);
    expect(paceInterpretation(200)).toMatch(/very fast/i);
  });
});
