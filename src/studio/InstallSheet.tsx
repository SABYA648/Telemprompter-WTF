import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { exportTransfer } from '../domain/studio/transfer';
import {
  installAskAllowed,
  installPlatform,
  installState,
  isStandaloneDisplay,
  type InstallState,
} from '../domain/studio/install';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
// Chrome can fire this before Studio finishes booting and the sheet mounts.
let earlyPrompt: InstallPromptEvent | null = null;
let onPrompt: ((event: InstallPromptEvent) => void) | null = null;
addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  earlyPrompt = event as InstallPromptEvent;
  onPrompt?.(earlyPrompt);
});
const read = (store: () => Storage, key: string): string | null => {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
};
const write = (store: () => Storage, key: string, value: string): void => {
  try {
    store().setItem(key, value);
  } catch {
    /* The ask ladder falls back to one session's memory. */
  }
};
const local = () => localStorage;
const session = () => sessionStorage;
const count = (key: string) => Number(read(local, key) ?? '0') || 0;
const platform = () => installPlatform(navigator.userAgent, navigator.maxTouchPoints);

export default function InstallSheet({ recording }: { recording: boolean }) {
  const [state, setState] = useState<InstallState>('unsupported');
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(earlyPrompt);
  const [open, setOpen] = useState(false);
  const [copyNote, setCopyNote] = useState('');
  const [exports, setExports] = useState(0);
  const [afterExport, setAfterExport] = useState(false);
  const blocking = recording && !afterExport;
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open || blocking) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector('button')?.focus();
    return () => returnFocus.current?.focus?.();
  }, [open, blocking]);
  useEffect(() => {
    if (!read(session, 'studio.install.session')) {
      write(session, 'studio.install.session', '1');
      write(local, 'studio.install.sessions', String(count('studio.install.sessions') + 1));
    }
    const exported = () => {
      write(local, 'studio.install.exports', String(count('studio.install.exports') + 1));
      setExports(count('studio.install.exports'));
      setAfterExport(true);
    };
    const started = () => setAfterExport(false);
    const installed = () => {
      setOpen(false);
      setState('installed');
      earlyPrompt = null;
      setPrompt(null);
      analytics.track('installed_app', { platform: platform() });
    };
    onPrompt = setPrompt;
    addEventListener('studio-take-exported', exported);
    addEventListener('studio-take-started', started);
    addEventListener('appinstalled', installed);
    setExports(count('studio.install.exports'));
    return () => {
      onPrompt = null;
      removeEventListener('studio-take-exported', exported);
      removeEventListener('studio-take-started', started);
      removeEventListener('appinstalled', installed);
    };
  }, []);
  useEffect(() => {
    const next = installState({
      userAgent: navigator.userAgent,
      standalone: isStandaloneDisplay(),
      iosStandalone: false,
      promptable: Boolean(prompt),
      maxTouchPoints: navigator.maxTouchPoints,
    });
    setState(next);
    if (
      (next === 'promptable' || next === 'ios_manual') &&
      installAskAllowed({
        exports,
        sessions: count('studio.install.sessions'),
        shown: count('studio.install.shown'),
        dismissedAt: count('studio.install.dismissed'),
        now: Date.now(),
        shownThisSession: Boolean(read(session, 'studio.install.shownSession')),
        recording: blocking,
      })
    ) {
      setOpen(true);
      write(session, 'studio.install.shownSession', '1');
      write(local, 'studio.install.shown', String(count('studio.install.shown') + 1));
      analytics.track('shown_install_prompt', { platform: platform() });
    }
  }, [prompt, exports, blocking]);
  const dismiss = () => {
    setOpen(false);
    write(local, 'studio.install.dismissed', String(Date.now()));
    analytics.track('dismissed_install_prompt', { platform: platform() });
  };
  if (!open || blocking) return null;
  return (
    <div class="studio-install-backdrop" role="presentation">
      <section
        ref={dialog}
        class="studio-install-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            dismiss();
            return;
          }
          if (event.key !== 'Tab') return;
          const buttons = [...(dialog.current?.querySelectorAll('button') ?? [])];
          if (event.shiftKey && document.activeElement === buttons[0]) {
            event.preventDefault();
            buttons.at(-1)?.focus();
          } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
            event.preventDefault();
            buttons[0]?.focus();
          }
        }}
      >
        <h2 id="install-title">
          {state === 'ios_manual' ? 'Add to your Home Screen' : 'Install teleprompter.wtf'}
        </h2>
        {state === 'ios_manual' ? (
          <>
            <p>
              Open the Share menu, then tap Add to Home Screen. The app opens full screen and keeps
              your takes safer.
            </p>
            <button
              class="studio-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(await exportTransfer());
                  analytics.track('transferred_scripts', { direction: 'export' });
                  setCopyNote('We copied your scripts. In the app, tap Paste scripts.');
                } catch {
                  setCopyNote(
                    'We could not copy your scripts. In Settings, tap Copy transfer code to try again.',
                  );
                }
              }}
            >
              Show me how
            </button>
            {copyNote && <p role="status">{copyNote}</p>}
          </>
        ) : (
          <>
            <p>Full screen, works offline, one tap from your home screen.</p>
            <button
              class="studio-button"
              onClick={async () => {
                if (!prompt) return;
                await prompt.prompt();
                const choice = await prompt.userChoice;
                if (choice.outcome === 'accepted') setOpen(false);
                else dismiss();
                earlyPrompt = null;
                setPrompt(null);
              }}
            >
              Install
            </button>
          </>
        )}
        <button class="studio-button studio-button--quiet" onClick={dismiss}>
          Not now
        </button>
      </section>
    </div>
  );
}
