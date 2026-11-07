import { isInAppBrowser } from './inAppBrowser';

export type InstallState =
  'in_app_browser' | 'installed' | 'promptable' | 'ios_manual' | 'unsupported';
export type InstallPlatform = 'android' | 'ios' | 'desktop';

const DAY_MS = 86400000;
export const INSTALL_COOLDOWN_MS = 7 * DAY_MS;
export const INSTALL_MAX_ASKS = 3;

/** iPadOS Safari reports a Macintosh user agent, so touch support tells the two apart. */
function isIos(userAgent: string, maxTouchPoints: number): boolean {
  return (
    /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  );
}
export function installState(input: {
  userAgent: string;
  standalone: boolean;
  iosStandalone: boolean;
  promptable: boolean;
  maxTouchPoints?: number;
}): InstallState {
  if (input.standalone || input.iosStandalone) return 'installed';
  if (isInAppBrowser(input.userAgent)) return 'in_app_browser';
  if (input.promptable) return 'promptable';
  if (
    isIos(input.userAgent, input.maxTouchPoints ?? 0) &&
    /Safari/i.test(input.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(input.userAgent)
  )
    return 'ios_manual';
  return 'unsupported';
}
export function installPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (/Android/i.test(userAgent)) return 'android';
  return isIos(userAgent, maxTouchPoints) ? 'ios' : 'desktop';
}
/** The ask ladder (4.3): after an export or a second session, three asks, seven-day cooldown. */
export function installAskAllowed(input: {
  exports: number;
  sessions: number;
  shown: number;
  dismissedAt: number;
  now: number;
  shownThisSession: boolean;
  recording: boolean;
}): boolean {
  return (
    !input.recording &&
    !input.shownThisSession &&
    input.shown < INSTALL_MAX_ASKS &&
    (input.exports > 0 || input.sessions >= 2) &&
    (!input.dismissedAt || input.now - input.dismissedAt >= INSTALL_COOLDOWN_MS)
  );
}
export function isStandaloneDisplay(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}
