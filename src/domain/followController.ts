/**
 * Velocity control for voice-following scroll.
 *
 * Correction used to be a snap: on every alignment the scroll jumped a fraction of the way to the
 * target and then sat still until the next one. With browser speech recognition the base velocity
 * was also zero, because the only pace signal in that path reports a multiplier of zero, so all
 * motion came from those jumps. The result was a step function, which is what "not in sync" feels
 * like even when the alignment underneath is correct.
 *
 * Instead the reader is driven as a servo. Feed-forward comes from how fast the speaker is actually
 * talking, feedback closes whatever gap remains, and a deadband keeps it still when it is already
 * where it should be. Motion stays continuous and converges without overshoot.
 */

export interface ServoReading {
  /** Pixels per second to scroll this frame. */
  velocity: number;
  /** Gap left to close after the deadband is removed. Zero means settled. */
  lastError: number;
}

export interface ServoInput {
  scrollTop: number;
  /** Where the spoken word should sit, or null when there is no follow signal. */
  targetTop: number | null;
  /** Pixels per second implied by the manual speed setting. */
  baseVelocity: number;
  /** Pixels per second implied by the speaker's measured rate. */
  feedForward: number;
  /** Alignment confidence, 0 to 1. */
  trust: number;
  lineHeightPx: number;
}

export const SERVO = {
  /**
   * Per second. Proportional only, deliberately.
   *
   * With a correction of `kp * error` the remaining gap shrinks by a factor of `1 - kp * dt` each
   * frame. The caller clamps dt to 0.1 s, so `kp * dt` stays at 0.3, comfortably below 1, and the
   * approach is monotonic: it cannot overshoot and cannot oscillate, at any frame rate.
   *
   * A derivative term was tried and removed. Damping on the error signal has the wrong sign when
   * the target is stationary, and on a jump it produces a derivative kick large enough to slam the
   * velocity to its reverse limit. There is nothing for it to buy that the proportional form and
   * the deadband do not already provide.
   */
  kp: 3,
  /** No correction at all inside a third of a line, so a settled reader does not jitter. */
  deadbandLines: 0.35,
  maxForwardFactor: 3.2,
  /** Reversing faster than this reads as a yank rather than a correction. */
  maxReverse: -420,
  /** Past this gap the speaker has jumped, so the cap scales with the distance instead. */
  seekLines: 12,
  maxSeek: 2400,
} as const;

/**
 * Proportional control is memoryless, so this is a pure function of the current gap. The caller
 * owns the integration and the frame clock.
 */
export function nextVelocity(input: ServoInput): ServoReading {
  const { scrollTop, targetTop, baseVelocity, feedForward, trust, lineHeightPx } = input;

  if (targetTop === null || trust <= 0) {
    return { velocity: Math.max(0, baseVelocity), lastError: 0 };
  }

  const raw = targetTop - scrollTop;
  const deadband = Math.max(1, SERVO.deadbandLines * lineHeightPx);
  const error = Math.abs(raw) <= deadband ? 0 : raw - Math.sign(raw) * deadband;

  const correction = SERVO.kp * error;

  const safeTrust = Math.min(1, Math.max(0, trust));
  const carrier = feedForward * safeTrust + baseVelocity * (1 - safeTrust);

  const seeking = Math.abs(raw) > SERVO.seekLines * lineHeightPx;
  const maxForward = seeking
    ? Math.min(SERVO.maxSeek, Math.abs(error) * 3)
    : baseVelocity * SERVO.maxForwardFactor + 240;

  const velocity = Math.min(maxForward, Math.max(SERVO.maxReverse, carrier + correction));
  return { velocity, lastError: error };
}
