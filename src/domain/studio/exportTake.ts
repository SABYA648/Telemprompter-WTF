import { analytics } from '../analytics';
import { onExportedTake } from './habits';
import { getTake, saveTake, takeBlob } from './takesRepo';
import type { StudioTake } from './types';
export function takeFilename(title: string | null, take: StudioTake): string {
  const slug = (title ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '');
  const date = new Date(take.createdAt);
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const section = (take.sectionIndex ?? null) === null ? '' : `section${take.sectionIndex! + 1}-`;
  return `${slug ? `${slug}-` : ''}${section}take${take.number}-${day}.${take.container}`;
}
function uniqueFilename(name: string, used: Set<string>): string {
  let candidate = name;
  const dot = name.lastIndexOf('.');
  for (let copy = 2; used.has(candidate); copy++)
    candidate = `${name.slice(0, dot)}-${copy}${name.slice(dot)}`;
  used.add(candidate);
  return candidate;
}
export function sizeBucket(bytes: number) {
  if (bytes < 1e7) return 'under_10mb' as const;
  if (bytes < 5e7) return '10_50mb' as const;
  return bytes < 2e8 ? ('50_200mb' as const) : ('200mb_plus' as const);
}
/** Hand one file to the share sheet when it accepts files, otherwise download it. */
export async function shareOrDownload(file: File): Promise<'share' | 'download' | 'cancel'> {
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file] });
      return 'share';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancel';
      throw error;
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'download';
}
/** Record that a file made from this take left the app (the take itself or an MP4 of it). */
export async function markTakeExported(take: StudioTake): Promise<void> {
  const latest = await getTake(take.id);
  if (latest) await saveTake({ ...latest, exportedAt: Date.now() });
  await onExportedTake();
}
export async function exportTake(
  take: StudioTake,
  title: string | null,
  emergencyBlob?: Blob,
): Promise<'share' | 'download' | 'cancel'> {
  const blob = emergencyBlob ?? (await takeBlob(take));
  if (!blob.size) throw new Error('No recorded video to export');
  const file = new File([blob], takeFilename(title, take), { type: take.mimeType });
  const method = await shareOrDownload(file);
  if (method === 'cancel') return method;
  if (!emergencyBlob) {
    const latest = await getTake(take.id);
    if (latest) await saveTake({ ...latest, exportedAt: Date.now() });
  }
  await onExportedTake();
  return method;
}

/** Save several takes as one multi-file share, in the order given, then record the export. */
export async function exportTakes(
  takes: StudioTake[],
  titles: Record<string, string> = {},
): Promise<'share' | 'download' | 'cancel'> {
  if (!takes.length) return 'cancel';
  const used = new Set<string>();
  const files = await Promise.all(
    takes.map(async (take) => {
      const blob = await takeBlob(take);
      if (!blob.size) throw new Error('No recorded video to export');
      const name = takeFilename(titles[take.scriptId ?? ''] ?? null, take);
      return { name, blob, type: take.mimeType };
    }),
  ).then((rows) =>
    rows.map(({ name, blob, type }) => new File([blob], uniqueFilename(name, used), { type })),
  );
  let method: 'share' | 'download' = 'download';
  if (navigator.canShare?.({ files }) && navigator.share) {
    try {
      await navigator.share({ files });
      method = 'share';
    } catch (error) {
      const name = (error as Error).name;
      if (name === 'AbortError') return 'cancel';
      // Reading large takes can outlast the tap that allowed the share; downloads still work.
      if (name !== 'NotAllowedError') throw error;
    }
  }
  if (method === 'download') {
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  }
  for (const take of takes) {
    const latest = await getTake(take.id);
    if (latest) await saveTake({ ...latest, exportedAt: Date.now() });
    analytics.track('exported_take', {
      method,
      container: take.container,
      size_bucket: sizeBucket(take.sizeBytes),
    });
  }
  dispatchEvent(new Event('studio-take-exported'));
  await onExportedTake();
  return method;
}
