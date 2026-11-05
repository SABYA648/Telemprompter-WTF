export const MIME_ORDER = [
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
] as const;
export function preferredMime(
  supported: (mime: string) => boolean,
  format: 'auto' | 'mp4' | 'webm' = 'auto',
): string | null {
  return (
    MIME_ORDER.find((mime) => (format === 'auto' || mime.includes(format)) && supported(mime)) ??
    null
  );
}
export function containerFor(mime: string): 'mp4' | 'webm' {
  return mime.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}
export type Quality = 'standard' | 'high' | 'max';
const BITRATES = {
  '720p': { low: [3.5, 5, 8], high: [5, 7.5, 10] },
  '1080p': { low: [8, 12, 16], high: [12, 18, 24] },
  '2160p': { low: [25, 40, 50], high: [40, 60, 75] },
} as const;
export function videoBitrate(
  resolution: keyof typeof BITRATES,
  fps: number,
  quality: Quality,
): number {
  const row = BITRATES[resolution][fps >= 50 ? 'high' : 'low'];
  return (row[{ standard: 0, high: 1, max: 2 }[quality]] ?? 0) * 1_000_000;
}
