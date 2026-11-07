import type { KeyAction, StudioSettings } from './types';
export function actionForKey(keys: StudioSettings['keys'], key: string): KeyAction | null {
  for (const [action, values] of Object.entries(keys) as [KeyAction, string[]][])
    if (values.includes(key)) return action;
  return null;
}
export function handleMappedKey(
  event: Pick<KeyboardEvent, 'key' | 'target' | 'preventDefault'>,
  keys: StudioSettings['keys'],
  run: (action: KeyAction) => void,
): boolean {
  const target = event.target as HTMLElement | null;
  if (target?.matches?.('input,textarea,select,[contenteditable],[contenteditable="true"]'))
    return false;
  const action = actionForKey(keys, event.key);
  if (!action) return false;
  event.preventDefault();
  run(action);
  return true;
}
export function assignKey(
  keys: StudioSettings['keys'],
  action: KeyAction,
  key: string,
): StudioSettings['keys'] {
  const next = Object.fromEntries(
    Object.entries(keys).map(([a, values]) => [a, values.filter((v) => v !== key)]),
  ) as StudioSettings['keys'];
  next[action] = [...next[action], key].slice(-8);
  return next;
}
