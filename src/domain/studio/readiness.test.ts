import { describe, expect, it } from 'vitest';
import {
  frameReadiness,
  ReadinessTracker,
  storageReadiness,
  batteryReadiness,
  orientationReadiness,
} from './readiness';
function frame(width: number, height: number, luma: (x: number, y: number) => number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = luma(x, y);
      data[i + 3] = 255;
    }
  return data;
}
describe('readiness', () => {
  it('requires two dark samples', () => {
    const t = new ReadinessTracker(),
      dark = frame(32, 18, () => 20);
    expect(t.frame(dark, 32, 18)).toEqual([]);
    expect(t.frame(dark, 32, 18)).toContainEqual({
      id: 'dark',
      message: 'Add light in front of you',
    });
  });
  it('detects backlighting on synthetic frames', () => {
    const f = frame(32, 18, (x, y) => (x >= 8 && x < 24 && y >= 4.5 && y < 13.5 ? 40 : 220));
    expect(frameReadiness(f, 32, 18)).toContainEqual({
      id: 'backlit',
      message: 'Bright light behind you',
    });
  });
  it('detects loud peaks and quiet speech', () => {
    const t = new ReadinessTracker();
    for (let n = 0; n < 3; n++) t.audio(0.01, 0.95, n * 300, true, true);
    expect(t.audio(0.01, 0.95, 1000, true, true)).toContainEqual({
      id: 'clip',
      message: 'Too loud: move the mic back',
    });
    const q = new ReadinessTracker();
    q.audio(0.001, 0.001, 100, true, true);
    expect(q.audio(0.001, 0.001, 4200, true, true)).toContainEqual({
      id: 'quiet',
      message: 'Mic is very quiet',
    });
  });
  it('detects three noisy one-second samples', () => {
    const t = new ReadinessTracker();
    t.audio(0.01, 0.02, 0, false, false);
    t.audio(0.01, 0.02, 1000, false, false);
    expect(t.audio(0.01, 0.02, 2000, false, false)).toContainEqual({
      id: 'noise',
      message: 'Room sounds noisy',
    });
  });
  it('warns and blocks storage at thresholds', () => {
    expect(storageReadiness(2 * 60 * 125000, 1000000)[0]?.blocks).toBe(true);
    expect(storageReadiness(8 * 60 * 125000, 1000000)[0]?.blocks).toBeUndefined();
    expect(storageReadiness(20 * 60 * 125000, 1000000)).toEqual([]);
  });
  it('checks battery and orientation', () => {
    expect(batteryReadiness(0.1, false)[0]?.id).toBe('battery');
    expect(batteryReadiness(0.1, true)).toEqual([]);
    expect(orientationReadiness('9:16', true)[0]?.message).toBe('Rotate to portrait');
  });
});
