import { afterEach, describe, expect, it, vi } from 'vitest';
import { mp4EncodingSupported, suggestTrim } from './convert';

const RATE = 1000; // 50 samples per 50 ms window keeps the fixtures readable
function signal(ms: number, loud: Array<[number, number]>, level = 0.1): Float32Array {
  const data = new Float32Array(ms);
  for (const [from, to] of loud) for (let i = from; i < to; i++) data[i] = i % 2 ? level : -level;
  return data;
}

describe('suggest trim', () => {
  it('finds the first and last loud windows and pads them by 0.3 s', () => {
    expect(suggestTrim([signal(5000, [[1200, 3800]])], RATE)).toEqual({
      startMs: 900,
      endMs: 4100,
    });
  });
  it('keeps the padding inside the take', () => {
    expect(suggestTrim([signal(2000, [[0, 1990]])], RATE)).toEqual({ startMs: 0, endMs: 2000 });
  });
  it('uses -40 dBFS as the threshold', () => {
    // 0.01 RMS is exactly -40 dBFS, so it is not above the threshold; 0.02 is.
    expect(suggestTrim([signal(3000, [[1000, 2000]], 0.01)], RATE)).toBeNull();
    expect(suggestTrim([signal(3000, [[1000, 2000]], 0.02)], RATE)).toEqual({
      startMs: 700,
      endMs: 2300,
    });
  });
  it('listens to every channel', () => {
    expect(suggestTrim([signal(3000, []), signal(3000, [[2000, 2100]])], RATE)).toEqual({
      startMs: 1700,
      endMs: 2400,
    });
  });
  it('returns null for silence or no audio', () => {
    expect(suggestTrim([signal(3000, [])], RATE)).toBeNull();
    expect(suggestTrim([], RATE)).toBeNull();
  });
});

describe('MP4 feature detection', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('is unsupported without WebCodecs', async () => {
    vi.stubGlobal('VideoEncoder', undefined);
    vi.stubGlobal('AudioEncoder', undefined);
    expect(await mp4EncodingSupported(1080, 1920)).toBe(false);
  });
  it('needs an AVC profile and AAC', async () => {
    const video = vi.fn(async ({ codec }: { codec: string }) => ({
      supported: codec === 'avc1.4d0028',
    }));
    const audio = vi.fn(async () => ({ supported: true }));
    vi.stubGlobal('VideoEncoder', { isConfigSupported: video });
    vi.stubGlobal('AudioEncoder', { isConfigSupported: audio });
    expect(await mp4EncodingSupported(1079, 1920)).toBe(true);
    expect(video).toHaveBeenCalledWith(expect.objectContaining({ width: 1080, height: 1920 }));
    audio.mockResolvedValue({ supported: false });
    expect(await mp4EncodingSupported(1080, 1920)).toBe(false);
  });
  it('treats a throwing check as unsupported', async () => {
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: async () => {
        throw new TypeError('bad config');
      },
    });
    vi.stubGlobal('AudioEncoder', { isConfigSupported: async () => ({ supported: true }) });
    expect(await mp4EncodingSupported(0, 0)).toBe(false);
  });
});
