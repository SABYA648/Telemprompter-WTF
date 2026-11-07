import { describe, expect, it } from 'vitest';
import {
  durationAtWpm,
  fitForTarget,
  fitWpm,
  scriptSeconds,
  scriptWpm,
  sectionDurations,
} from './timing';
describe('timing', () => {
  it('calculates duration and target fit', () => {
    expect(durationAtWpm(70, 140)).toBe(30);
    expect(fitForTarget(70, 30, 140)).toBe('on_target');
    expect(fitForTarget(140, 30, 140)).toBe('over');
  });
  it('calculates section durations', () =>
    expect(sectionDurations([{ title: 'One', spokenText: 'one two' }], 120)[0]?.seconds).toBe(1));
  it('fits a target only inside 80 to 240 WPM', () => {
    expect(fitWpm(60, 30)).toBe(120);
    expect(fitWpm(150, 60)).toBe(150);
    expect(fitWpm(40, 30)).toBe(80);
    expect(fitWpm(120, 30)).toBe(240);
    // 30 words over 30 seconds needs 60 WPM, below the floor, so nothing is fitted.
    expect(fitWpm(30, 30)).toBeNull();
    expect(fitWpm(1000, 10)).toBeNull();
    expect(fitWpm(100, 0)).toBeNull();
    expect(fitWpm(0, 30)).toBeNull();
  });
  it('opens a script at one speed everywhere', () => {
    const fit = { wpm: 140, fitToTarget: true };
    const saved = { wpm: 140, fitToTarget: false };
    expect(scriptWpm(150, 60, fit)).toBe(150);
    expect(scriptWpm(150, 60, saved)).toBe(140);
    // A fit outside the range keeps the saved speed, so camera and Practice agree.
    expect(scriptWpm(30, 30, fit)).toBe(140);
    expect(scriptWpm(30, 0, fit)).toBe(140);
    expect(scriptSeconds(30, 30, fit)).toBe(13);
    expect(scriptSeconds(150, 60, fit)).toBe(60);
  });
});
