import { analytics } from '../analytics';

export type CardKind = 'streak' | 'weekly' | 'challenge' | 'badge';
export type CardLabel =
  'Day streak' | 'Videos this week' | "Last week's videos" | 'Challenge days' | 'Badges earned';
const LABELS: CardLabel[] = [
  'Day streak',
  'Videos this week',
  "Last week's videos",
  'Challenge days',
  'Badges earned',
];
const HEADINGS: Record<CardKind, string> = {
  streak: 'Showing up daily',
  weekly: 'Weekly recap',
  challenge: '30 videos in 30 days',
  badge: 'Milestone unlocked',
};
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
const safeLabel = (label: CardLabel): CardLabel =>
  LABELS.includes(label) ? label : 'Videos this week';
const safeNumber = (n: number) =>
  Number.isFinite(n) ? Math.max(0, Math.min(9999, Math.round(n))) : 0;

/** The only link a card carries. It never includes ids, titles or script text. */
export function shareCardUrl(): string {
  return `${location.origin}/?utm_source=share_card`;
}

/** Paints a 1080x1920 PNG with fixed copy: a heading, the big number, its label and the site name. */
export async function makeShareCard(
  kind: CardKind,
  number: number,
  label: CardLabel,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const background = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, '#1b1d1a');
  background.addColorStop(0.55, '#090a09');
  background.addColorStop(1, '#2a120c');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const glow = ctx.createRadialGradient(540, 820, 40, 540, 820, 620);
  glow.addColorStop(0, 'rgba(228, 73, 46, 0.34)');
  glow.addColorStop(1, 'rgba(228, 73, 46, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = '#e4492e';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.arc(540, 820, 360, -Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
  ctx.fillStyle = '#e4492e';
  ctx.fillRect(96, 180, 120, 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 58px system-ui, sans-serif';
  ctx.fillText(HEADINGS[kind] ?? HEADINGS.weekly, 540, 340);
  ctx.fillStyle = '#f6f0e4';
  ctx.font = '800 320px system-ui, sans-serif';
  ctx.fillText(String(safeNumber(number)), 540, 935);
  ctx.font = '700 80px system-ui, sans-serif';
  ctx.fillText(safeLabel(label), 540, 1340);
  ctx.fillStyle = '#aaa89f';
  ctx.font = '500 44px system-ui, sans-serif';
  ctx.fillText('teleprompter.wtf', 540, 1760);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG unavailable'))), 'image/png'),
  );
}

/** Web Share with a file where supported, otherwise a download. A cancelled share is not tracked. */
export async function shareProgressCard(
  kind: CardKind,
  number: number,
  label: CardLabel,
): Promise<'share' | 'download' | 'cancel'> {
  const blob = await makeShareCard(kind, number, label);
  const file = new File([blob], `teleprompter-wtf-${kind}.png`, { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], text: shareCardUrl() });
      analytics.track('shared_progress_card', { card: kind });
      return 'share';
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') return 'cancel';
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  analytics.track('shared_progress_card', { card: kind });
  return 'download';
}
