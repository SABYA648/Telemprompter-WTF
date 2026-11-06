import { describe, expect, it } from 'vitest';
import { nextMirror, projectedProgress } from './operator';

describe('operator window', () => {
  const state = { body: 'x', progress: 0.25, wpm: 120, playing: true };
  it('projects the position forward at the sender WPM while playing', () => {
    // 120 WPM is 2 words a second; 3 seconds over 60 words adds 10%.
    expect(projectedProgress(state, 60, 3)).toBeCloseTo(0.35);
    expect(projectedProgress(state, 60, 100)).toBe(1);
    expect(projectedProgress({ ...state, playing: false }, 60, 3)).toBe(0.25);
    expect(projectedProgress(state, 0, 3)).toBe(0.25);
  });
  it('cycles the mirror modes', () => {
    expect(nextMirror('off')).toBe('horizontal');
    expect(nextMirror('horizontal')).toBe('vertical');
    expect(nextMirror('vertical')).toBe('both');
    expect(nextMirror('both')).toBe('off');
  });
});
