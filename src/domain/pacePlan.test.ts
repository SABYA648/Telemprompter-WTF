import { describe, expect, it } from 'vitest';
import { durationSeconds } from './calculations';
import {
  CUE,
  PaceCueEngine,
  driftThresholds,
  formatDrift,
  plannedSecondsAtWord,
  plannedTotalSeconds,
  type CueState,
} from './pacePlan';

const TOTAL = 300;

/** Feed a constant drift for `ms` and report the state at the end. */
const holdDrift = (engine: PaceCueEngine, drift: number, from: number, ms: number): CueState => {
  let last: CueState = 'steady';
  for (let at = from; at <= from + ms; at += 250) {
    last = engine.update({
      plannedSeconds: drift,
      elapsedSeconds: 0,
      totalSeconds: TOTAL,
      at,
    }).state;
  }
  return last;
};

describe('plan arithmetic', () => {
  it('derives the plan from the speaking rate when no target is set', () => {
    expect(plannedTotalSeconds(600, 130, 0)).toBeCloseTo(durationSeconds(600, 130));
  });

  it('prefers an explicit target duration', () => {
    expect(plannedTotalSeconds(600, 130, 240)).toBe(240);
  });

  it('spreads the plan evenly across the script', () => {
    expect(plannedSecondsAtWord(0, 100, 300)).toBe(0);
    expect(plannedSecondsAtWord(50, 100, 300)).toBe(150);
    expect(plannedSecondsAtWord(100, 100, 300)).toBe(300);
  });

  it('clamps out-of-range word positions and degenerate scripts', () => {
    expect(plannedSecondsAtWord(500, 100, 300)).toBe(300);
    expect(plannedSecondsAtWord(-5, 100, 300)).toBe(0);
    expect(plannedSecondsAtWord(10, 0, 300)).toBe(0);
  });

  it('scales the threshold with the length of the delivery', () => {
    expect(driftThresholds(60).enter).toBe(CUE.minimumDriftSeconds);
    expect(driftThresholds(600).enter).toBeCloseTo(18);
    expect(driftThresholds(600).clear).toBeCloseTo(18 * CUE.clearFraction);
  });
});

describe('pace cue hysteresis', () => {
  it('asks the speaker to pick up only after the drift persists', () => {
    const engine = new PaceCueEngine();
    expect(holdDrift(engine, -12, 10_000, CUE.enterHoldMs - 500)).toBe('steady');
    expect(holdDrift(engine, -12, 10_000, CUE.enterHoldMs + 500)).toBe('push');
  });

  it('asks the speaker to ease off when they are ahead of plan', () => {
    const engine = new PaceCueEngine();
    expect(holdDrift(engine, 12, 10_000, CUE.enterHoldMs + 500)).toBe('ease');
  });

  it('ignores drift that never crosses the threshold', () => {
    const engine = new PaceCueEngine();
    expect(holdDrift(engine, 5, 10_000, 20_000)).toBe('steady');
  });

  it('does not flicker when the drift oscillates across the threshold', () => {
    const engine = new PaceCueEngine();
    let at = 10_000;
    const seen = new Set<CueState>();
    for (let cycle = 0; cycle < 40; cycle += 1) {
      const drift = cycle % 2 === 0 ? -12 : -2;
      for (let step = 0; step < 2; step += 1) {
        seen.add(
          engine.update({
            plannedSeconds: drift,
            elapsedSeconds: 0,
            totalSeconds: TOTAL,
            at,
          }).state,
        );
        at += 250;
      }
    }
    expect(seen.has('ease')).toBe(false);
  });

  it('refuses to change twice inside the minimum switch window', () => {
    const engine = new PaceCueEngine();
    // The switch to push lands exactly one enter-hold after the drift starts.
    expect(holdDrift(engine, -12, 10_000, CUE.enterHoldMs + 500)).toBe('push');
    const changedAt = 10_000 + CUE.enterHoldMs;

    // Reverse the drift and hold it long enough to qualify on its own, but stop just inside the
    // minimum switch window. The cue must not have moved.
    const justInside = changedAt + CUE.minimumSwitchMs - 250;
    expect(holdDrift(engine, 12, justInside - CUE.enterHoldMs, CUE.enterHoldMs)).toBe('push');

    // One step past the window it is free to change.
    expect(holdDrift(engine, 12, justInside, 500)).toBe('ease');
  });

  it('clears back to steady once the drift is comfortably inside the band', () => {
    const engine = new PaceCueEngine();
    expect(holdDrift(engine, -12, 0, CUE.enterHoldMs + 500)).toBe('push');
    expect(holdDrift(engine, 0, 30_000, CUE.exitHoldMs + 500)).toBe('steady');
  });

  it('keeps the cue up while the drift is only partly recovered', () => {
    const engine = new PaceCueEngine();
    expect(holdDrift(engine, -12, 0, CUE.enterHoldMs + 500)).toBe('push');
    // Inside the enter threshold but outside the clear band, so the advice still stands.
    expect(holdDrift(engine, -7, 30_000, 10_000)).toBe('push');
  });

  it('reports a magnitude inside the unit range that is zero when steady', () => {
    const engine = new PaceCueEngine();
    const steady = engine.update({
      plannedSeconds: 0,
      elapsedSeconds: 0,
      totalSeconds: TOTAL,
      at: 0,
    });
    expect(steady.magnitude).toBe(0);

    holdDrift(engine, -40, 0, CUE.enterHoldMs + 500);
    const strong = engine.update({
      plannedSeconds: -40,
      elapsedSeconds: 0,
      totalSeconds: TOTAL,
      at: 60_000,
    });
    expect(strong.magnitude).toBeGreaterThan(0);
    expect(strong.magnitude).toBeLessThanOrEqual(1);
    expect(strong.driftSeconds).toBe(-40);
  });

  it('starts over after a reset', () => {
    const engine = new PaceCueEngine();
    holdDrift(engine, -12, 0, CUE.enterHoldMs + 500);
    engine.reset();
    const reading = engine.update({
      plannedSeconds: -12,
      elapsedSeconds: 0,
      totalSeconds: TOTAL,
      at: 0,
    });
    expect(reading.state).toBe('steady');
  });
});

describe('formatDrift', () => {
  it('labels drift as a signed clock offset', () => {
    expect(formatDrift(12)).toBe('+0:12');
    expect(formatDrift(-8)).toBe('-0:08');
    expect(formatDrift(-65)).toBe('-1:05');
  });

  it('says nothing about drift too small to act on', () => {
    expect(formatDrift(0)).toBe('');
    expect(formatDrift(2.4)).toBe('');
    expect(formatDrift(Number.NaN)).toBe('');
  });
});
