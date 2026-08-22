import { useEffect, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { clearLocalState } from '../domain/localState';
import { isLocalModelReady, removeLocalModel } from '../domain/modelManager';

export default function PrivacyActions(): preact.JSX.Element {
  const [message, setMessage] = useState('');
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    void isLocalModelReady().then(setModelReady);
  }, []);

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

  const removeModel = async () => {
    await removeLocalModel();
    setModelReady(false);
    setMessage('Downloaded voice model removed from this browser.');
    analytics.track('removed_voice_model');
  };

  return (
    <div class="privacy-action">
      <button class="button button--quiet" onClick={clear}>
        Clear local data
      </button>
      {modelReady && (
        <button class="button button--quiet" onClick={() => void removeModel()}>
          Remove voice model
        </button>
      )}
      <p class="form-note" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
