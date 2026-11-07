export function randomId(): string {
  return crypto.randomUUID?.() ?? `script-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
