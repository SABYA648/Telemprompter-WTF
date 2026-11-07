import { afterEach, describe, expect, it, vi } from 'vitest';
import { analytics } from '../analytics';
import { makeShareCard, shareCardUrl, shareProgressCard } from './shareCard';

function fakeCanvas() {
  const painted: string[] = [];
  const gradient = { addColorStop: vi.fn() };
  const context = {
    fillRect: vi.fn(),
    fillText: (text: string) => painted.push(text),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    textAlign: '',
    textBaseline: '',
    font: '',
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (callback: (blob: Blob) => void) =>
      callback(new Blob([new Uint8Array(12000)], { type: 'image/png' })),
  };
  const link = { href: '', download: '', click: vi.fn() };
  vi.stubGlobal('document', {
    createElement: (tag: string) => (tag === 'canvas' ? canvas : link),
  });
  vi.stubGlobal('location', { origin: 'https://www.teleprompter.wtf' });
  return { canvas, painted, link };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('local progress cards', () => {
  it('paints 1080x1920 with fixed copy and never an arbitrary label', async () => {
    const { canvas, painted } = fakeCanvas();
    const blob = await makeShareCard('weekly', 3, 'private script text' as 'Videos this week');
    expect(canvas).toMatchObject({ width: 1080, height: 1920 });
    expect(blob.type).toBe('image/png');
    expect(painted).not.toContain('private script text');
    expect(painted).toEqual(['Weekly recap', '3', 'Videos this week', 'teleprompter.wtf']);
    expect(shareCardUrl()).toBe('https://www.teleprompter.wtf/?utm_source=share_card');
  });
  it('clamps the big number to a whole count', async () => {
    const { painted } = fakeCanvas();
    await makeShareCard('streak', Number.NaN, 'Day streak');
    await makeShareCard('streak', 12.6, 'Day streak');
    expect(painted.filter((t) => /^\d+$/.test(t))).toEqual(['0', '13']);
  });
  it('shares a PNG file with the tagged link, or downloads it', async () => {
    const track = vi.spyOn(analytics, 'track').mockImplementation(() => undefined);
    const { link } = fakeCanvas();
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { canShare: () => true, share });
    expect(await shareProgressCard('streak', 7, 'Day streak')).toBe('share');
    const data = share.mock.calls[0]?.[0] as ShareData;
    expect(data.files?.[0]?.type).toBe('image/png');
    expect(data.files?.[0]?.name).toBe('teleprompter-wtf-streak.png');
    expect(data.text).toBe('https://www.teleprompter.wtf/?utm_source=share_card');
    expect(track).toHaveBeenCalledWith('shared_progress_card', { card: 'streak' });

    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })),
    });
    expect(await shareProgressCard('streak', 7, 'Day streak')).toBe('cancel');

    vi.stubGlobal('navigator', {});
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() });
    expect(await shareProgressCard('badge', 2, 'Badges earned')).toBe('download');
    expect(link.download).toBe('teleprompter-wtf-badge.png');
    expect(link.click).toHaveBeenCalled();
    expect(track).toHaveBeenCalledTimes(2);
  });
});
