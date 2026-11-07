import type { StudioScript } from './types';

const TOKENS = /Instagram|FBAN|FBAV|FB_IAB|musical_ly|TikTok|BytedanceWebview|Line\/|Snapchat/i;
export function isInAppBrowser(userAgent: string): boolean {
  return TOKENS.test(userAgent);
}

type HandoffScript = Pick<StudioScript, 'title' | 'body' | 'targetSeconds' | 'aspect'>;
export function browserHandoffUrl(origin: string, script: HandoffScript | null): string {
  const payload = script
    ? `?handoff=${encodeURIComponent(
        JSON.stringify({
          title: script.title,
          body: script.body,
          targetSeconds: script.targetSeconds,
          aspect: script.aspect,
        }),
      )}`
    : '';
  return `${origin}/studio#/record/quick${payload}`;
}
export function browserHandoffScript(hash: string): HandoffScript | null {
  const value = new URLSearchParams(hash.split('?')[1] ?? '').get('handoff');
  if (!value || value.length > 100_000) return null;
  try {
    const item: unknown = JSON.parse(value);
    if (!item || typeof item !== 'object') return null;
    const script = item as Record<string, unknown>;
    if (
      typeof script.title !== 'string' ||
      typeof script.body !== 'string' ||
      script.title.length > 200 ||
      script.body.length > 80_000 ||
      typeof script.targetSeconds !== 'number' ||
      !Number.isFinite(script.targetSeconds) ||
      script.targetSeconds < 0 ||
      script.targetSeconds > 3600 ||
      (script.aspect !== '9:16' && script.aspect !== '16:9')
    )
      return null;
    return script as HandoffScript;
  } catch {
    return null;
  }
}
