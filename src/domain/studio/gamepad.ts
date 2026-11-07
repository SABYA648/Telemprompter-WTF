import type { KeyAction } from './types';

/** Standard-mapping buttons: A toggles, D-pad up and down change speed, left and right move a line. */
export const GAMEPAD_ACTIONS: Readonly<Record<number, KeyAction>> = {
  0: 'toggleScroll',
  12: 'faster',
  13: 'slower',
  14: 'lineBack',
  15: 'lineForward',
};

/** Actions for buttons that went down since the last poll, so a held button fires once. */
export function pressedActions(
  previous: readonly boolean[],
  next: readonly boolean[],
): KeyAction[] {
  const actions: KeyAction[] = [];
  for (const [index, action] of Object.entries(GAMEPAD_ACTIONS))
    if (next[Number(index)] && !previous[Number(index)]) actions.push(action);
  return actions;
}

/**
 * Polls connected gamepads once per frame while any is connected. Browsers expose a pad only
 * after a button press, so the loop starts on `gamepadconnected` as well as on mount.
 */
export function watchGamepads(run: (action: KeyAction) => void): () => void {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return () => undefined;
  const previous = new Map<number, boolean[]>();
  let frame = 0;
  const poll = () => {
    frame = 0;
    const pads = [...navigator.getGamepads()].filter((pad): pad is Gamepad => Boolean(pad));
    for (const pad of pads) {
      const buttons = pad.buttons.map((button) => button.pressed);
      const actions = pressedActions(previous.get(pad.index) ?? [], buttons);
      previous.set(pad.index, buttons);
      // Ignore presses while typing, matching the keyboard map.
      if (document.activeElement?.matches('input,textarea,select,[contenteditable]')) continue;
      actions.forEach(run);
    }
    if (pads.length) frame = requestAnimationFrame(poll);
  };
  const start = () => {
    if (!frame) frame = requestAnimationFrame(poll);
  };
  addEventListener('gamepadconnected', start);
  start();
  return () => {
    removeEventListener('gamepadconnected', start);
    if (frame) cancelAnimationFrame(frame);
  };
}
