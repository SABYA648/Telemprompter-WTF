import { useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { clearLocalState } from '../domain/localState';

export default function PrivacyActions(): preact.JSX.Element {
  const [message, setMessage] = useState('');
  const clear = () => {
    if (
      !window.confirm(
        'Delete your saved script and all teleprompter.wtf preferences on this device?',
      )
    ) {
      return;
    }
    clearLocalState();
    setMessage('Local script and preferences cleared on this device.');
    analytics.track('cleared_local_data');
    window.dispatchEvent(new CustomEvent('teleprompter:local-data-cleared'));
  };

  return (
    <div class="privacy-action">
      <button class="button button--quiet" onClick={clear}>
        Clear local data
      </button>
      <p class="form-note" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
