import { useEffect, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { getDb } from '../domain/studio/db';
import { exportTransfer, importTransfer } from '../domain/studio/transfer';
import { installPlatform, isStandaloneDisplay } from '../domain/studio/install';
import type { StudioIdea } from '../domain/studio/types';

export function ServiceWorkerUpdate({ hidden }: { hidden: boolean }) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let alive = true;
    const onControllerChange = () => {
      if (sessionStorage.getItem('studio.sw.reload')) {
        sessionStorage.removeItem('studio.sw.reload');
        location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (!alive) return;
        const check = () => {
          if (reg.waiting && navigator.serviceWorker.controller) setRegistration(reg);
        };
        const watch = () => reg.installing?.addEventListener('statechange', check);
        check();
        watch();
        reg.addEventListener('updatefound', watch);
      })
      .catch((error) => analytics.error('studio', error));
    return () => {
      alive = false;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);
  // Reloading would end a take, so the offer waits until the user leaves the Record screen.
  if (!registration || hidden) return null;
  return (
    <div class="studio-update" role="status">
      Update ready{' '}
      <button
        class="studio-button"
        onClick={() => {
          sessionStorage.setItem('studio.sw.reload', '1');
          registration.waiting?.postMessage('SKIP_WAITING');
        }}
      >
        Reload
      </button>
    </div>
  );
}
function PasteScripts() {
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const run = async (value: string) => {
    try {
      const result = await importTransfer(value);
      sessionStorage.setItem('studio.transfer.result', `Scripts added: ${result.scripts}`);
      location.hash = '/scripts';
      location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid transfer code');
    }
  };
  const paste = async () => {
    let value: string;
    try {
      value = await navigator.clipboard.readText();
    } catch {
      setManual(true);
      setMessage('We could not read the clipboard. Paste the transfer code below.');
      return;
    }
    await run(value);
  };
  return (
    <>
      <button class="studio-button" onClick={() => void paste()}>
        Paste scripts
      </button>
      {manual && (
        <form
          class="studio-transfer-manual"
          onSubmit={(event) => {
            event.preventDefault();
            void run(code);
          }}
        >
          <label>
            Transfer code
            <textarea
              rows={3}
              value={code}
              onInput={(event) => setCode(event.currentTarget.value)}
            />
          </label>
          <button class="studio-button" type="submit">
            Add scripts
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </>
  );
}
export function TransferControls() {
  const [message, setMessage] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(await exportTransfer());
      analytics.track('transferred_scripts', { direction: 'export' });
      setMessage('Transfer code copied. Open Studio in the Home Screen app and tap Paste scripts.');
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === 'Transfer exceeds 1 MB'
          ? error.message
          : 'We could not copy the transfer code. Allow clipboard access and try again.',
      );
    }
  };
  return (
    <section class="studio-card" aria-labelledby="transfer-title">
      <h2 id="transfer-title">Move scripts to the Home Screen app</h2>
      <p>
        Safari and the installed app keep separate storage. Transfer scripts, ideas and settings;
        video takes stay on this device.
      </p>
      <div class="studio-actions">
        <button class="studio-button studio-button--quiet" onClick={() => void copy()}>
          Copy transfer code
        </button>
        <PasteScripts />
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export function StandaloneTransferCard({ empty }: { empty: boolean }) {
  if (
    !empty ||
    !isStandaloneDisplay() ||
    installPlatform(navigator.userAgent, navigator.maxTouchPoints) !== 'ios'
  )
    return null;
  return (
    <section class="studio-card">
      <h2>Bring your scripts from Safari</h2>
      <p>Open Studio in Safari, copy your transfer code, then paste it here.</p>
      <PasteScripts />
    </section>
  );
}
const SHARE_NOTES: Record<string, string> = {
  '1': 'Idea saved.',
  error: 'We could not save that share. Try sharing it again.',
};
export function SharedInbox() {
  const [ideas, setIdeas] = useState<StudioIdea[]>([]);
  const [note, setNote] = useState('');
  useEffect(() => {
    const shared = new URLSearchParams(location.hash.split('?')[1] ?? '').get('shared') ?? '';
    if (SHARE_NOTES[shared]) {
      setNote(SHARE_NOTES[shared]);
      if (shared === '1') analytics.track('captured_idea', { source: 'share_target' });
      // A reload of this landing must not count the same share twice.
      history.replaceState(null, '', '#/inbox');
    }
    void getDb()
      .then((db) => db.getAll('ideas'))
      .then((items) => setIdeas((items as StudioIdea[]).sort((a, b) => b.createdAt - a.createdAt)));
  }, []);
  return (
    <section class="studio-screen">
      <h1>Shared ideas</h1>
      <p>Saved on this device.</p>
      {note && <p role="status">{note}</p>}
      <div class="studio-list">
        {ideas.map((idea) => (
          <article class="studio-card" key={idea.id}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{idea.text}</p>
          </article>
        ))}
      </div>
      {!ideas.length && <p>No shared ideas yet.</p>}
    </section>
  );
}
