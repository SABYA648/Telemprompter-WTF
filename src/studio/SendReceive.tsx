import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { createScript } from '../domain/studio/scriptsRepo';
import { decodeSingleScript, encodeSingleScript, exportTransfer } from '../domain/studio/transfer';
import { parseMarkup } from '../domain/studio/markup';
import { durationAtWpm } from '../domain/studio/timing';
import type { StudioScript } from '../domain/studio/types';

const QR_MAX_URL = 1500;

export function SendToPhone({ script }: { script: StudioScript }) {
  const [url, setUrl] = useState('');
  const [svg, setSvg] = useState('');
  const [message, setMessage] = useState('');
  const qrTracked = useRef(false);
  useEffect(() => {
    let active = true;
    setSvg('');
    void encodeSingleScript(script)
      .then(async (code) => {
        if (!active) return;
        const link = `${location.origin}/studio#/receive/${code}`;
        setUrl(link);
        if (link.length > QR_MAX_URL) return;
        const { default: qr } = await import('qrcode-generator');
        if (!active) return;
        const image = qr(0, 'L');
        image.addData(link);
        image.make();
        setSvg(image.createSvgTag({ cellSize: 6, margin: 4, scalable: true }));
        if (!qrTracked.current) {
          qrTracked.current = true;
          analytics.track('sent_to_phone', { method: 'qr' });
        }
      })
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : 'Could not make link.'),
      );
    return () => {
      active = false;
    };
  }, [script.id, script.updatedAt]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Link copied.');
      analytics.track('sent_to_phone', { method: 'link' });
    } catch {
      setMessage('We could not copy the link. Allow clipboard access and try again.');
    }
  };
  return (
    <section class="studio-card" aria-label="Send to phone">
      <h2>Send to phone</h2>
      <p>
        Open this script on your phone. The link contains the script, so share it only with someone
        you trust.
      </p>
      {svg && (
        <img
          class="studio-qr"
          src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
          width="280"
          height="280"
          alt="QR code for this script"
        />
      )}
      {url.length > QR_MAX_URL && <p>Too long for a QR code. Share or copy the link instead.</p>}
      <div class="studio-actions">
        <button class="studio-button" disabled={!url} onClick={() => void copy()}>
          Copy link
        </button>
        {'share' in navigator && (
          <button
            class="studio-button studio-button--quiet"
            disabled={!url}
            onClick={() =>
              void navigator
                .share({ url })
                .then(() => analytics.track('sent_to_phone', { method: 'link' }))
                .catch(() => undefined)
            }
          >
            Share link
          </button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export function ReceiveScreen({ code }: { code: string }) {
  const [script, setScript] = useState<StudioScript | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const savedId = useRef('');
  useEffect(() => {
    void decodeSingleScript(code)
      .then(setScript)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Invalid link'));
  }, [code]);
  const persist = async (): Promise<string | null> => {
    if (!script) return null;
    if (savedId.current) return savedId.current;
    const content: Partial<StudioScript> = { ...script };
    delete content.id;
    const created = await createScript({
      ...content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    analytics.track('created_script', { source: 'received' });
    analytics.track('received_script', { method: 'link' });
    savedId.current = created.id;
    return created.id;
  };
  const save = async () => {
    try {
      const id = await persist();
      if (id) location.hash = `#/record/${id}`;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not save this script.');
    }
  };
  const copyTransfer = async () => {
    let value = '';
    try {
      await persist();
      value = await exportTransfer();
      await navigator.clipboard.writeText(value);
      setManualCode('');
      setMessage('Transfer code copied. Open the Home Screen app and tap Paste scripts.');
    } catch (cause) {
      setManualCode(value);
      setMessage(
        value
          ? 'We could not copy automatically. Copy the code below.'
          : cause instanceof Error
            ? cause.message
            : 'Could not make a transfer code.',
      );
    }
  };
  const words = script ? parseMarkup(script.body).spokenWordCount : 0;
  return (
    <section class="studio-screen">
      <h1>Receive script</h1>
      {error && (
        <>
          <p role="alert">{error}</p>
          <a class="studio-button studio-button--quiet" href="#/scripts">
            All scripts
          </a>
        </>
      )}
      {script && (
        <>
          <div class="studio-card">
            <h2>{script.title}</h2>
            <p>
              {words} words · about {durationAtWpm(words, 140)} seconds at 140 WPM
            </p>
          </div>
          <div class="studio-actions">
            <button class="studio-button" onClick={() => void save()}>
              Save and record
            </button>
          </div>
          <div class="studio-card">
            <h2>Using the Home Screen app?</h2>
            <p>
              On iPhone, a scanned QR code opens Safari, which keeps its own storage. Copy a
              transfer code, then open the Home Screen app and tap Paste scripts.
            </p>
            <button class="studio-button studio-button--quiet" onClick={() => void copyTransfer()}>
              Copy transfer code
            </button>
            {manualCode && (
              <label class="studio-transfer-manual">
                Transfer code
                <textarea readOnly value={manualCode} rows={3} />
              </label>
            )}
            {message && <p role="status">{message}</p>}
          </div>
        </>
      )}
    </section>
  );
}
