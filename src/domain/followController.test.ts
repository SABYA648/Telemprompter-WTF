import { describe, expect, it } from 'vitest';
import { nextVelocity, SERVO, type ServoInput } from './followController';

const LINE = 60;

const input = (overrides: Partial<ServoInput> = {}): ServoInput => ({
  scrollTop: 0,
  targetTop: null,
  baseVelocity: 40,
  feedForward: 0,
  trust: 0,
  lineHeightPx: LINE,
  ...overrides,
});

describe('follow servo', () => {
  it('falls back to the manual speed when there is no follow signal', () => {
    const reading = nextVelocity(input({ targetTop: null }));
    expect(reading.velocity).toBe(40);
    expect(reading.lastError).toBe(0);
  });

  it('falls back to the manual speed when the alignment is not trusted', () => {
    const reading = nextVelocity(input({ targetTop: 500, trust: 0 }));
    expect(reading.velocity).toBe(40);
  });

  it('applies no correction inside the deadband', () => {
    const inside = SERVO.deadbandLines * LINE * 0.9;
    const reading = nextVelocity(input({ targetTop: inside, trust: 1, feedForward: 90 }));
    expect(reading.lastError).toBe(0);
    expect(reading.velocity).toBeCloseTo(90);
  });

  it('blends feed-forward and manual speed by how much the alignment is trusted', () => {
    const reading = nextVelocity(
      input({ targetTop: 0, trust: 0.5, feedForward: 100, baseVelocity: 40 }),
    );
    // Inside the deadband, so the carrier is all that is left: 100 * 0.5 + 40 * 0.5.
    expect(reading.velocity).toBeCloseTo(70);
  });

  it('closes a gap without ever overshooting past the target', () => {
    let scrollTop = 0;
    const targetTop = 300;
    const dt = 1 / 60;
    let overshot = false;

    for (let frame = 0; frame < 120; frame += 1) {
      const { velocity } = nextVelocity(input({ scrollTop, targetTop, trust: 1, feedForward: 0 }));
      scrollTop += velocity * dt;
      if (scrollTop > targetTop) overshot = true;
    }

    expect(overshot).toBe(false);
    // It settles on the edge of the deadband rather than dead centre, which is the point of it.
    const deadband = SERVO.deadbandLines * LINE;
    expect(targetTop - scrollTop).toBeLessThan(deadband * 1.2);
    expect(targetTop - scrollTop).toBeGreaterThanOrEqual(0);
  });

  it('cannot overshoot at any frame rate the caller allows', () => {
    for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.1]) {
      let scrollTop = 0;
      for (let frame = 0; frame < 400; frame += 1) {
        const { velocity } = nextVelocity(
          input({ scrollTop, targetTop: 900, trust: 1, feedForward: 0 }),
        );
        scrollTop += velocity * dt;
        expect(scrollTop).toBeLessThanOrEqual(900);
      }
    }
  });

  it('holds still once it has converged', () => {
    let scrollTop = 0;
    const dt = 1 / 60;
    const step = () => {
      const { velocity } = nextVelocity(
        input({ scrollTop, targetTop: 300, trust: 1, feedForward: 0 }),
      );
      scrollTop += velocity * dt;
    };
    for (let frame = 0; frame < 400; frame += 1) step();
    const settled = scrollTop;
    for (let frame = 0; frame < 60; frame += 1) step();
    expect(Math.abs(scrollTop - settled)).toBeLessThan(1);
  });

  it('clamps how fast it will reverse', () => {
    const reading = nextVelocity(
      input({ scrollTop: 4000, targetTop: 0, trust: 1, feedForward: 0 }),
    );
    expect(reading.velocity).toBe(SERVO.maxReverse);
  });

  it('caps forward speed near the target but allows a fast seek on a real jump', () => {
    const near = nextVelocity(
      input({ scrollTop: 0, targetTop: 2 * LINE, trust: 1, baseVelocity: 40, feedForward: 0 }),
    );
    expect(near.velocity).toBeLessThanOrEqual(40 * SERVO.maxForwardFactor + 240);

    const far = nextVelocity(
      input({ scrollTop: 0, targetTop: 4000, trust: 1, baseVelocity: 40, feedForward: 0 }),
    );
    expect(far.velocity).toBeGreaterThan(near.velocity);
    expect(far.velocity).toBeLessThanOrEqual(SERVO.maxSeek);
  });

  it('never scrolls backwards just because the manual speed is low', () => {
    const reading = nextVelocity(input({ baseVelocity: -10 }));
    expect(reading.velocity).toBe(0);
  });
});
