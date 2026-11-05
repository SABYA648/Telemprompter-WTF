export function minutesLeft(
  availableBytes: number,
  videoBitsPerSecond: number,
  audioBitsPerSecond = 128000,
): number {
  return Math.max(
    0,
    Math.floor((availableBytes * 8) / (videoBitsPerSecond + audioBitsPerSecond) / 60),
  );
}
export async function storageEstimate(): Promise<{ usage: number; quota: number }> {
  try {
    const result = await navigator.storage?.estimate?.();
    return { usage: result?.usage ?? 0, quota: result?.quota ?? 0 };
  } catch {
    return { usage: 0, quota: 0 };
  }
}
export function formatBytes(bytes: number): string {
  return bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;
}
