export type ReadinessChip = { id: string; message: string; blocks?: boolean };
export function frameReadiness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ReadinessChip[] {
  if (!width || !height || data.length < width * height * 4) return [];
  let total = 0,
    center = 0,
    edge = 0,
    cn = 0,
    en = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4,
        l = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
      total += l;
      if (x >= width * 0.25 && x < width * 0.75 && y >= height * 0.25 && y < height * 0.75) {
        center += l;
        cn++;
      } else {
        edge += l;
        en++;
      }
    }
  const chips: ReadinessChip[] = [];
  if (total / (width * height) < 55)
    chips.push({ id: 'dark', message: 'Add light in front of you' });
  if (cn && en && edge / en > 150 && center / cn < (0.6 * edge) / en)
    chips.push({ id: 'backlit', message: 'Bright light behind you' });
  return chips;
}
export const dbfs = (amplitude: number) => (amplitude > 0 ? 20 * Math.log10(amplitude) : -Infinity);
export class ReadinessTracker {
  darkSamples = 0;
  noiseReadings: boolean[] = [];
  noiseLastAt = -Infinity;
  quietSince = 0;
  peaks: number[] = [];
  frame(data: Uint8ClampedArray, width: number, height: number): ReadinessChip[] {
    const chips = frameReadiness(data, width, height);
    this.darkSamples = chips.some((c) => c.id === 'dark') ? this.darkSamples + 1 : 0;
    return chips.filter((c) => c.id !== 'dark' || this.darkSamples >= 2);
  }
  audio(
    rms: number,
    peak: number,
    now: number,
    recording: boolean,
    scrolling: boolean,
  ): ReadinessChip[] {
    const chips: ReadinessChip[] = [];
    if (!recording && this.noiseReadings.length < 3 && now - this.noiseLastAt >= 1000) {
      this.noiseLastAt = now;
      this.noiseReadings.push(dbfs(rms) > -45);
      if (this.noiseReadings.length === 3 && this.noiseReadings.every(Boolean))
        chips.push({ id: 'noise', message: 'Room sounds noisy' });
    }
    this.peaks = this.peaks.filter((t) => now - t <= 2000);
    if (dbfs(peak) >= -1) this.peaks.push(now);
    if (this.peaks.length > 3) chips.push({ id: 'clip', message: 'Too loud: move the mic back' });
    if (recording && scrolling && dbfs(rms) < -50) {
      if (!this.quietSince) this.quietSince = now;
      if (now - this.quietSince >= 4000) chips.push({ id: 'quiet', message: 'Mic is very quiet' });
    } else this.quietSince = 0;
    return chips.filter((c) => (recording ? c.id === 'clip' || c.id === 'quiet' : true));
  }
}
export function storageReadiness(
  remainingBytes: number,
  bitrateBitsPerSecond: number,
): ReadinessChip[] {
  const minutes = (remainingBytes * 8) / Math.max(1, bitrateBitsPerSecond) / 60;
  return minutes < 3
    ? [
        {
          id: 'storage',
          message:
            'Not enough space for a new take. Save and delete old takes, or lower the quality.',
          blocks: true,
        },
      ]
    : minutes < 10
      ? [{ id: 'storage', message: 'Less than 10 minutes of recording space left' }]
      : [];
}
export function batteryReadiness(level: number, charging: boolean): ReadinessChip[] {
  return level < 0.15 && !charging ? [{ id: 'battery', message: 'Battery low' }] : [];
}
export function orientationReadiness(aspect: '9:16' | '16:9', landscape: boolean): ReadinessChip[] {
  return (aspect === '16:9') !== landscape
    ? [
        {
          id: 'orientation',
          message: aspect === '9:16' ? 'Rotate to portrait' : 'Rotate to landscape',
        },
      ]
    : [];
}
