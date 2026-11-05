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
  return `${slug ? `${slug}-` : ''}take${take.number}-${day}.${take.container}`;
}
export async function exportTake(
  take: StudioTake,
  title: string | null,
  emergencyBlob?: Blob,
): Promise<'share' | 'download' | 'cancel'> {
  const blob = emergencyBlob ?? (await takeBlob(take));
  if (!blob.size) throw new Error('No recorded video to export');
  const file = new File([blob], takeFilename(title, take), { type: take.mimeType });
  let method: 'share' | 'download' = 'download';
  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file] });
      method = 'share';
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancel';
      throw error;
    }
  } else {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  if (!emergencyBlob) {
    const latest = await getTake(take.id);
    if (latest) await saveTake({ ...latest, exportedAt: Date.now() });
  }
  return method;
}
