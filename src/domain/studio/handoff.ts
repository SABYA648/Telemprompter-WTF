import { createScript, getScript, saveScript } from './scriptsRepo';
export async function openInStudio(text: string, opts: { embedId?: string } = {}): Promise<void> {
  const id = opts.embedId ? `guide-${opts.embedId}` : 'quick';
  if (text.trim()) {
    const existing = await getScript(id);
    await (existing
      ? saveScript({
          ...existing,
          body: text,
          title: id === 'quick' ? 'Quick script' : existing.title,
          deletedAt: null,
        })
      : createScript({ id, title: id === 'quick' ? 'Quick script' : 'Guide script', body: text }));
  }
  location.href = text.trim() ? `/studio#/record/${id}` : '/studio#/';
}
/** Open a new script on Record without replacing the visitor's quick script. */
export async function recordNewScript(title: string, body: string): Promise<void> {
  const script = await createScript({ title, body });
  location.href = `/studio#/record/${script.id}`;
}
