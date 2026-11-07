import { expect, test } from 'vitest';
import { cameraConstraints, cameraErrorReason } from './camera';
import { containerFor, MIME_ORDER, preferredMime, videoBitrate } from './mime';
import { crossedMarker, pixelsPerSecond, pixelsPerWord } from './prompterScroll';
import { minutesLeft } from './storage';
import { takeFilename } from './exportTake';
import { orderedChunks } from './takesRepo';
import type { StudioTake } from './types';

test('MIME preference follows MP4 then WebM and the actual container', () => {
  expect(preferredMime((mime) => mime === MIME_ORDER[0] || mime === MIME_ORDER[3])).toBe(
    MIME_ORDER[0],
  );
  expect(preferredMime((mime) => mime === MIME_ORDER[3])).toBe(MIME_ORDER[3]);
  expect(preferredMime(() => false)).toBeNull();
  expect(containerFor('video/mp4;codecs=avc1')).toBe('mp4');
  expect(containerFor('video/webm')).toBe('webm');
});
test('all bitrate rows and frame rate aliases', () => {
  expect([
    videoBitrate('720p', 24, 'standard'),
    videoBitrate('720p', 30, 'high'),
    videoBitrate('720p', 60, 'max'),
  ]).toEqual([3500000, 5000000, 10000000]);
  expect([
    videoBitrate('1080p', 25, 'standard'),
    videoBitrate('1080p', 30, 'high'),
    videoBitrate('1080p', 50, 'max'),
  ]).toEqual([8000000, 12000000, 24000000]);
  expect([
    videoBitrate('2160p', 30, 'standard'),
    videoBitrate('2160p', 60, 'high'),
    videoBitrate('2160p', 60, 'max'),
  ]).toEqual([25000000, 60000000, 75000000]);
});
test('constraint ladder drops fps, resolution, and facing before video-only', () => {
  const base = {
    facing: 'user' as const,
    resolution: '1080p' as const,
    frameRate: 30,
    aspect: '9:16' as const,
    deviceId: 'camera-1',
  };
  const steps = [0, 1, 2, 3, 4].map((step) => cameraConstraints(base, step));
  expect(steps[0]!.video).toMatchObject({
    deviceId: { exact: 'camera-1' },
    width: { ideal: 1080 },
    height: { ideal: 1920 },
    frameRate: { ideal: 30 },
  });
  expect(steps[1]!.video).not.toHaveProperty('frameRate');
  expect(steps[2]!.video).toMatchObject({ width: { ideal: 720 }, height: { ideal: 1280 } });
  expect(steps[3]!.video).not.toHaveProperty('deviceId');
  expect(steps[4]!.audio).toBe(false);
});
test('maps camera failures', () => {
  for (const [name, reason] of [
    ['NotAllowedError', 'permission_blocked'],
    ['SecurityError', 'permission_blocked'],
    ['NotFoundError', 'not_found'],
    ['NotReadableError', 'in_use'],
    ['AbortError', 'in_use'],
    ['OverconstrainedError', 'overconstrained'],
    ['Other', 'unknown'],
  ])
    expect(cameraErrorReason({ name })).toBe(reason);
});
test('scroll speed and consumed pause markers', () => {
  expect(pixelsPerWord(600, 100)).toBe(6);
  expect(pixelsPerSecond(120, 6)).toBe(12);
  const consumed = new Set<number>();
  expect(crossedMarker(80, 20, [100, 200], consumed)).toBe(0);
  consumed.add(0);
  expect(crossedMarker(80, 20, [100, 200], consumed)).toBeNull();
  expect(crossedMarker(180, 20, [100, 200], consumed)).toBe(1);
});
test('chunk sequence, export filename and storage minutes', () => {
  const a = { takeId: 't', seq: 1, blob: new Blob(['b']) },
    b = { takeId: 't', seq: 0, blob: new Blob(['a']) };
  expect(orderedChunks([a, b]).map((c) => c.seq)).toEqual([0, 1]);
  const take = {
    number: 2,
    createdAt: new Date('2026-11-05T12:00:00Z').getTime(),
    container: 'webm',
  } as StudioTake;
  expect(takeFilename('My Great Script!', take)).toBe('my-great-script-take2-20261105.webm');
  expect(takeFilename(null, take)).toBe('take2-20261105.webm');
  expect(minutesLeft(91_000_000, 12_000_000, 128_000)).toBe(1);
});
