import { expect, it } from 'vitest';
import { audioLevels } from './audioMeter';
it('computes RMS and peak from samples', () => {
  expect(audioLevels(new Float32Array([1, -1, 0, 0]))).toEqual({ rms: Math.sqrt(0.5), peak: 1 });
});
