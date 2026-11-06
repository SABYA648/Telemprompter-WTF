import { analytics } from '../analytics';

/**
 * The operator window (`#/prompter-window`, M11) is a prompter-only view for a second screen or
 * a glass rig. The main window sends script, position, WPM and play state over a same-origin
 * BroadcastChannel; nothing leaves the device.
 */
export const PROMPTER_CHANNEL = 'tw-prompter';
export const OPERATOR_HASH = '#/prompter-window';
const OPEN_KEY = 'studio.operator';

export interface PrompterState {
  body: string;
  /** How far through the scrollable text, from 0 to 1. */
  progress: number;
  wpm: number;
  playing: boolean;
}
export type PrompterMessage = { type: 'state'; state: PrompterState } | { type: 'hello' };
export const MIRROR_MODES = ['off', 'horizontal', 'vertical', 'both'] as const;
export type MirrorMode = (typeof MIRROR_MODES)[number];

const canBroadcast = () => typeof BroadcastChannel !== 'undefined';

/** Opens (or focuses) the operator window. Returns false when the browser blocked the popup. */
export function openOperatorWindow(): boolean {
  if (!canBroadcast()) return false;
  const popup = open(
    `/studio${OPERATOR_HASH}`,
    'tw-prompter-window',
    'popup,width=1024,height=640',
  );
  if (!popup) return false;
  try {
    sessionStorage.setItem(OPEN_KEY, '1');
  } catch {
    /* Storage unavailable: this tab still broadcasts while it stays open. */
  }
  operatorOpenedHere = true;
  analytics.track('opened_operator_window');
  dispatchEvent(new Event('studio-operator-opened'));
  return true;
}
let operatorOpenedHere = false;
/** True after this tab opened an operator window, so screens without one skip the channel. */
export function operatorRequested(): boolean {
  if (operatorOpenedHere) return true;
  try {
    return sessionStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** Sends prompter state, skipping repeats, and answers an operator window that just opened. */
export class PrompterBroadcast {
  private channel: BroadcastChannel | null = null;
  private last: PrompterState | null = null;
  constructor() {
    if (!canBroadcast()) return;
    this.channel = new BroadcastChannel(PROMPTER_CHANNEL);
    this.channel.onmessage = (event: MessageEvent<PrompterMessage>) => {
      if (event.data?.type === 'hello' && this.last) this.post(this.last);
    };
  }
  send(state: PrompterState): void {
    const last = this.last;
    if (
      last &&
      last.body === state.body &&
      last.wpm === state.wpm &&
      last.playing === state.playing &&
      Math.abs(last.progress - state.progress) < 0.002
    )
      return;
    this.last = state;
    this.post(state);
  }
  private post(state: PrompterState): void {
    this.channel?.postMessage({ type: 'state', state } satisfies PrompterMessage);
  }
  close(): void {
    this.channel?.close();
    this.channel = null;
  }
}

/** Where the operator view should be `seconds` after a state arrived, while it is playing. */
export function projectedProgress(
  state: PrompterState,
  spokenWords: number,
  seconds: number,
): number {
  if (!state.playing || spokenWords <= 0) return state.progress;
  return Math.min(1, state.progress + (seconds * state.wpm) / 60 / spokenWords);
}

export function nextMirror(mode: MirrorMode): MirrorMode {
  return MIRROR_MODES[(MIRROR_MODES.indexOf(mode) + 1) % MIRROR_MODES.length] ?? 'off';
}
