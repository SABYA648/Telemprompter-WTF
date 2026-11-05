import { describe, expect, it } from 'vitest';
import { durationAtWpm, fitForTarget, sectionDurations } from './timing';
describe('timing', () => {
  it('calculates duration and target fit', () => {
    expect(durationAtWpm(70, 140)).toBe(30);
    expect(fitForTarget(70, 30, 140)).toBe('on_target');
    expect(fitForTarget(140, 30, 140)).toBe('over');
  });
  it('calculates section durations', () =>
    expect(sectionDurations([{ title: 'One', spokenText: 'one two' }], 120)[0]?.seconds).toBe(1));
});
