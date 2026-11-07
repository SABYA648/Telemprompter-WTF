import { useEffect, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { exportTransfer, importTransfer } from '../domain/studio/transfer';
import { installPlatform, isStandaloneDisplay } from '../domain/studio/install';

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
        class="studio-button studio-button--quiet"
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
      <button class="studio-button studio-button--quiet" onClick={() => void paste()}>
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
