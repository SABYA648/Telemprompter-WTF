import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { defaultPrivacyConsent, loadLocalState, saveLocalState } from '../domain/localState';
import type { PrivacyConsent } from '../domain/types';

function applyConsent(consent: PrivacyConsent): void {
  if (consent.usageAnalytics) analytics.allow();
  else analytics.deny();
}

function persistConsent(consent: PrivacyConsent): void {
  const current = loadLocalState();
  saveLocalState({
    script: current.script,
    preferences: current.preferences,
    privacyConsent: consent,
  });
  applyConsent(consent);
  window.dispatchEvent(new CustomEvent('teleprompter:consent-change', { detail: consent }));
}

export default function PrivacyChoices(): preact.JSX.Element | null {
  const [consent, setConsent] = useState(defaultPrivacyConsent());
  const [open, setOpen] = useState(false);
  const actionRef = useRef<HTMLButtonElement>(null);
  const available = analytics.available;

  useEffect(() => {
    if (!available) return;
    const saved = loadLocalState().privacyConsent;
    setConsent(saved);
    setOpen(!saved.decided);
    applyConsent(saved);
    const onLocalDataCleared = () => {
      const clean = defaultPrivacyConsent();
      applyConsent(clean);
      setConsent(clean);
      setOpen(true);
    };
    window.addEventListener('teleprompter:local-data-cleared', onLocalDataCleared);
    return () => window.removeEventListener('teleprompter:local-data-cleared', onLocalDataCleared);
  }, []);

  useEffect(() => {
    if (open) actionRef.current?.focus();
  }, [open]);

  if (!available) return null;

  const choose = (usageAnalytics: boolean) => {
    const next = { decided: true, usageAnalytics };
    setConsent(next);
    setOpen(false);
    persistConsent(next);
  };

  return (
    <>
      {open && (
        <section class="privacy-choices" aria-labelledby="privacy-choices-title">
          <div class="privacy-choices__intro">
            <p class="eyebrow">Your choice</p>
            <h2 id="privacy-choices-title">Optional analytics</h2>
            <p>
              Help improve teleprompter.wtf with privacy-safe usage analytics? Self-hosted Umami
              measures page views and product events after you allow it. Optional Google Analytics 4
              is included only when that build is configured. The teleprompter works the same either
              way. Your script and voice are never included.
              {consent.decided &&
                (consent.usageAnalytics
                  ? ' Analytics are currently on.'
                  : ' Analytics are currently off.')}
            </p>
          </div>
          <div class="privacy-choices__actions">
            <button
              ref={actionRef}
              class="button button--primary button--small"
              onClick={() => choose(true)}
            >
              Allow analytics
            </button>
            <button class="button button--small button--quiet" onClick={() => choose(false)}>
              No thanks
            </button>
            <a href="/privacy">Privacy details</a>
          </div>
        </section>
      )}
      {!open && (
        <button class="privacy-preference" onClick={() => setOpen(true)}>
          Privacy choices
        </button>
      )}
    </>
  );
}
