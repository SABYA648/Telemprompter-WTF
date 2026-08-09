import { describe, expect, it } from 'vitest';
import { calculateProgress, calculateScrollDelta } from './scrollController';

describe('scroll math', () => {
  it('uses elapsed time instead of frame increments', () => {
    expect(calculateScrollDelta(60, 16.6667)).toBeCloseTo(1, 4);
    expect(calculateScrollDelta(60, 8.3333)).toBeCloseTo(0.5, 4);
  });

  it('caps large elapsed gaps after an inactive tab', () => {
    expect(calculateScrollDelta(80, 5_000)).toBe(8);
  });

  it('calculates bounded progress', () => {
    expect(calculateProgress(50, 100)).toBe(0.5);
    expect(calculateProgress(-10, 100)).toBe(0);
    expect(calculateProgress(120, 100)).toBe(1);
    expect(calculateProgress(0, 0)).toBe(1);
  });
});
