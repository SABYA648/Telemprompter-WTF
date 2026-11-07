import { describe, expect, it } from 'vitest';
import { pressedActions } from './gamepad';

const buttons = (...down: number[]) => Array.from({ length: 17 }, (_, i) => down.includes(i));

describe('gamepad mapping', () => {
  it('maps A, and the D-pad to speed and line moves', () => {
    expect(pressedActions(buttons(), buttons(0))).toEqual(['toggleScroll']);
    expect(pressedActions(buttons(), buttons(12, 13, 14, 15))).toEqual([
      'faster',
      'slower',
      'lineBack',
      'lineForward',
    ]);
  });
  it('fires once per press, not while held, and ignores unmapped buttons', () => {
    expect(pressedActions(buttons(0), buttons(0))).toEqual([]);
    expect(pressedActions(buttons(0), buttons())).toEqual([]);
    expect(pressedActions([], buttons(1, 2, 3, 9))).toEqual([]);
  });
});
