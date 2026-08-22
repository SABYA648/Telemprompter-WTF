import { describe, expect, it } from 'vitest';
import { PaceCoach } from './paceCoach';

describe('PaceCoach', () => {
  it('cues slower when spoken progress is ahead of the target WPM', () => {
    const coach = new PaceCoach(120);
    const started = 1_000_000;
    expect(coach.observe(0, started)).toBe('ok');
    expect(coach.observe(4, started + 700)).toBe('ok');
    expect(coach.observe(8, started + 1400)).toBe('ok');
    expect(coach.observe(16, started + 3000)).toBe('slower');
  });

  it('cues faster when spoken progress lags the target WPM', () => {
    const coach = new PaceCoach(140);
    const started = 1_000_000;
    expect(coach.observe(0, started)).toBe('ok');
    expect(coach.observe(1, started + 1200)).toBe('ok');
    expect(coach.observe(2, started + 2400)).toBe('ok');
    expect(coach.observe(4, started + 4800)).toBe('faster');
  });

  it('resets after a skip-ahead jump instead of treating it as a sprint', () => {
    const coach = new PaceCoach(120);
    const started = 1_000_000;
    coach.observe(0, started);
    coach.observe(3, started + 800);
    expect(coach.observe(40, started + 1600)).toBe('ok');
    expect(coach.observe(41, started + 2200)).toBe('ok');
  });
});
