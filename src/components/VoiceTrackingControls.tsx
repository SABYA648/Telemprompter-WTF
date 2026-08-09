import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ScriptAlignmentEngine } from '../domain/alignment';
import { analytics, PRIVATE_PRECISION_SIZE_BUCKET, type FallbackReason } from '../domain/analytics';
import { detectBrowserCapabilities, precisionCapability } from '../domain/capabilities';
import {
  downloadLocalModel,
  isLocalModelReady,
  LOCAL_MODEL_ID,
  removeLocalModel,
  TOTAL_FIRST_USE_BYTES,
} from '../domain/modelManager';
import {
  LocalAudioSession,
  microphoneErrorState,
  type PaceReading,
  type SmartPaceState,
} from '../domain/smartPace';
import type { VoiceMode } from '../domain/types';

interface Props {
  script: string;
  mode: VoiceMode;
  onModeChange: (mode: VoiceMode) => void;
  onMultiplier: (multiplier: number) => void;
  onAlignment: (characterIndex: number, confidence: number, tokenEnd?: number) => void;
  onVoiceActivity?: (activity: {
    listening: boolean;
    speechActive: boolean;
    state: SmartPaceState;
  }) => void;
}

type ModelState = 'checking' | 'missing' | 'downloading' | 'ready' | 'preparing' | 'error';

// Maps internal precision-worker error categories to the low-cardinality analytics enum.
const fallbackReason = (category: string): FallbackReason => {
  if (category.includes('align')) return 'alignment_low';
  if (category.includes('memory')) return 'memory';
  if (category.includes('unsupported')) return 'unsupported';
  if (category.includes('user')) return 'user_switch';
  return 'runtime_error';
};

const statusLabel = (state: SmartPaceState, mode: VoiceMode): string => {
  if (state === 'requesting') return 'Requesting microphone';
  if (state === 'calibrating') return 'Learning room sound';
  if (state === 'listening')
    return mode === 'precision' ? 'Following your place' : 'Following your pace';
  if (state === 'paused') return 'Waiting for speech';
  if (state === 'denied') return 'Microphone blocked';
  if (state === 'unavailable') return 'Microphone unavailable';
  if (state === 'error') return 'Voice tracking stopped';
  return 'Manual';
};

export default function VoiceTrackingControls({
  script,
  mode,
  onModeChange,
  onMultiplier,
  onAlignment,
  onVoiceActivity,
}: Props): preact.JSX.Element {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SmartPaceState>('off');
  const [modelState, setModelState] = useState<ModelState>('checking');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const doneRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sessionRef = useRef<LocalAudioSession | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerBusyRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);
  const capabilities = useRef(detectBrowserCapabilities()).current;
  const deviceRating = precisionCapability(capabilities);
  const alignment = useMemo(() => new ScriptAlignmentEngine(script), [script]);
  const isActive = state === 'calibrating' || state === 'listening' || state === 'paused';
  const [speechActive, setSpeechActive] = useState(false);

  useEffect(() => {
    void isLocalModelReady().then((ready) => setModelState(ready ? 'ready' : 'missing'));
    return () => stopVoice();
  }, []);

  useEffect(() => {
    if (open) doneRef.current?.focus();
  }, [open]);

  useEffect(() => {
    onVoiceActivity?.({
      listening: isActive,
      speechActive,
      state,
    });
  }, [isActive, speechActive, state]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleDialogKey = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const stopVoice = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    workerRef.current?.postMessage({ type: 'dispose' });
    workerRef.current?.terminate();
    workerRef.current = null;
    workerBusyRef.current = false;
    onMultiplier(1);
    setSpeechActive(false);
    setState('off');
  };

  const handlePace = (reading: PaceReading) => {
    setState(reading.state);
    setSpeechActive(reading.speechActive);
    onMultiplier(reading.multiplier);
  };

  const begin = async (nextMode: 'smart' | 'precision', options?: { auto?: boolean }) => {
    stopVoice();
    setMessage('');
    if (options?.auto) setOpen(false);
    setState('requesting');
    onModeChange(nextMode);
    if (nextMode === 'precision') {
      if (modelState !== 'ready') {
        setMessage('Download the voice model first. Smart Pace is ready without it.');
        setState('off');
        return;
      }
      setModelState('preparing');
      const worker = new Worker(new URL('../workers/precisionWorker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as
          | { type: 'ready'; milliseconds: number }
          | { type: 'fragment'; text: string; milliseconds: number }
          | { type: 'error'; category: string };
        if (data.type === 'ready') {
          setModelState('ready');
          window.dispatchEvent(
            new CustomEvent('teleprompter:precision-ready', {
              detail: { milliseconds: data.milliseconds },
            }),
          );
          return;
        }
        workerBusyRef.current = false;
        if (data.type === 'error') {
          setMessage('Private Precision could not process that audio. Smart Pace is still active.');
          analytics.track('private_precision_fallback', { reason: fallbackReason(data.category) });
          window.dispatchEvent(
            new CustomEvent('teleprompter:precision-error', {
              detail: { category: data.category },
            }),
          );
          return;
        }
        const result = alignment.align(data.text);
        window.dispatchEvent(
          new CustomEvent('teleprompter:precision-measurement', {
            detail: { confidence: result.confidence, milliseconds: data.milliseconds },
          }),
        );
        if (result.movement !== 'hold') {
          const token = alignment.tokens[result.tokenIndex];
          onAlignment(result.characterIndex, result.confidence, token?.end);
        }
      };
      worker.onerror = () => {
        workerBusyRef.current = false;
        setModelState('ready');
        setMessage('Private Precision could not start on this device. Smart Pace is still active.');
        analytics.track('private_precision_fallback', { reason: 'runtime_error' });
        window.dispatchEvent(
          new CustomEvent('teleprompter:precision-error', {
            detail: { category: 'worker-start-failed' },
          }),
        );
      };
      worker.postMessage({ type: 'init' });
    }

    const session = new LocalAudioSession({
      onPace: handlePace,
      ...(nextMode === 'precision'
        ? {
            onPcmChunk: (audio: Float32Array, sampleRate: number) => {
              if (!workerRef.current || workerBusyRef.current) return;
              workerBusyRef.current = true;
              workerRef.current.postMessage({ type: 'audio', audio, sampleRate }, [audio.buffer]);
            },
          }
        : {}),
    });
    sessionRef.current = session;
    try {
      await session.start();
      if (nextMode === 'smart') analytics.track('smart_pace_enable', { result: 'started' });
      else analytics.track('private_precision_enable');
      if (options?.auto) setOpen(false);
      else close();
    } catch (error) {
      session.stop();
      sessionRef.current = null;
      workerRef.current?.terminate();
      workerRef.current = null;
      setState(microphoneErrorState(error));
      setMessage(
        microphoneErrorState(error) === 'denied'
          ? 'Microphone access was blocked. Manual scrolling still works.'
          : 'Voice tracking could not start. Manual scrolling still works.',
      );
      if (nextMode === 'smart') {
        analytics.track('smart_pace_enable', {
          result: microphoneErrorState(error) === 'denied' ? 'mic_blocked' : 'unavailable',
        });
      }
      onModeChange('manual');
      onMultiplier(1);
      // Auto-start denial should not trap the presenter behind a dialog.
      if (!options?.auto) setOpen(true);
    }
  };

  // Default experience: request Smart Pace as soon as the presenter opens.
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    if (mode !== 'smart') return;
    if (!capabilities.microphone) return;
    autoStartAttemptedRef.current = true;
    void begin('smart', { auto: true });
  }, [mode, capabilities.microphone]);

  const chooseManual = () => {
    stopVoice();
    onModeChange('manual');
  };

  const download = async () => {
    setModelState('downloading');
    setMessage('');
    analytics.track('private_precision_download_start', { model_id: LOCAL_MODEL_ID });
    try {
      await downloadLocalModel(({ percent }) => setDownloadProgress(Math.round(percent * 100)));
      setModelState('ready');
      analytics.track('private_precision_download_complete', {
        model_id: LOCAL_MODEL_ID,
        size_bucket: PRIVATE_PRECISION_SIZE_BUCKET,
      });
    } catch {
      setModelState('error');
      setMessage('The model could not be downloaded. Check your connection and try again.');
    }
  };

  const remove = async () => {
    stopVoice();
    await removeLocalModel();
    setModelState('missing');
    setDownloadProgress(0);
    onModeChange('manual');
    setMessage('Downloaded model removed from this browser.');
  };

  const totalSizeMb = Math.round(TOTAL_FIRST_USE_BYTES / 1_000_000);
  const ratingLabel =
    deviceRating === 'recommended'
      ? 'Recommended on this device'
      : deviceRating === 'supported'
        ? 'Supported on this device'
        : deviceRating === 'slow'
          ? 'May run slowly on this device'
          : 'Unavailable on this device';

  return (
    <>
      <button
        ref={triggerRef}
        class={`control-button voice-trigger ${isActive ? 'voice-trigger--active' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={`Voice tracking. ${statusLabel(state, mode)}`}
      >
        <span aria-hidden="true">{isActive ? '●' : '○'}</span>
        {statusLabel(state, mode)}
      </button>
      {open && (
        <div class="presenter__scrim" onClick={close} onKeyDown={handleDialogKey}>
          <section
            ref={panelRef}
            class="voice-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Local microphone</p>
                <h2 id="voice-title">Voice tracking</h2>
              </div>
              <button ref={doneRef} class="control-button" onClick={close}>
                Done
              </button>
            </div>

            <div class="voice-options">
              <article
                class={mode === 'manual' ? 'voice-option voice-option--selected' : 'voice-option'}
              >
                <div>
                  <h3>Manual</h3>
                  <p>Traditional, predictable scrolling. No microphone.</p>
                </div>
                <button class="button button--quiet button--small" onClick={chooseManual}>
                  {mode === 'manual' && !isActive ? 'Selected' : 'Use Manual'}
                </button>
              </article>
              <article
                class={mode === 'smart' ? 'voice-option voice-option--selected' : 'voice-option'}
              >
                <div>
                  <p class="voice-option__tag">Default. Fully local.</p>
                  <h3>Smart Pace</h3>
                  <p>
                    Starts with you. Matches scrolling to your speaking rhythm and faintly
                    highlights the live reading zone so you stay in sync. No transcription.
                  </p>
                </div>
                <button
                  class="button button--primary button--small"
                  disabled={!capabilities.microphone || (mode === 'smart' && isActive)}
                  onClick={() => void begin('smart')}
                >
                  {mode === 'smart' && isActive ? 'Listening' : 'Use Smart Pace'}
                </button>
              </article>
              <article
                class={
                  mode === 'precision' ? 'voice-option voice-option--selected' : 'voice-option'
                }
              >
                <div>
                  <p class="voice-option__tag">More precise. Fully local.</p>
                  <h3 aria-label="Private Precision, beta">
                    Private Precision{' '}
                    <span
                      aria-hidden="true"
                      style={{
                        padding: '0.08rem 0.4rem',
                        border: '1px solid #77644e',
                        borderRadius: '999px',
                        color: '#ffb45d',
                        fontSize: '0.6rem',
                        fontWeight: 760,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        verticalAlign: 'middle',
                      }}
                    >
                      Beta
                    </span>
                  </h3>
                  <p>
                    More precise following, processed entirely on this device. Downloads a local
                    voice model (about {totalSizeMb} MB with its runtime) the first time and uses
                    more processing power. Kept in this browser for future visits. Beta: results
                    vary across devices, accents and environments.
                  </p>
                  <ul class="model-facts">
                    <li>About {totalSizeMb} MB first download</li>
                    <li>{ratingLabel}</li>
                    <li>{modelState === 'ready' ? 'Stored in this browser' : 'Not downloaded'}</li>
                  </ul>
                </div>
                {modelState === 'downloading' ? (
                  <div class="model-progress">
                    <progress value={downloadProgress} max="100">
                      {downloadProgress}%
                    </progress>
                    <span>Downloading {downloadProgress}%</span>
                  </div>
                ) : modelState === 'ready' || modelState === 'preparing' ? (
                  <div class="model-actions">
                    <button
                      class="button button--primary button--small"
                      disabled={
                        deviceRating === 'unavailable' || (mode === 'precision' && isActive)
                      }
                      onClick={() => void begin('precision')}
                    >
                      {modelState === 'preparing'
                        ? 'Preparing model'
                        : mode === 'precision' && isActive
                          ? 'Following'
                          : 'Use Private Precision'}
                    </button>
                    <button class="text-button text-button--danger" onClick={() => void remove()}>
                      Remove downloaded model
                    </button>
                  </div>
                ) : (
                  <button
                    class="button button--quiet button--small"
                    disabled={deviceRating === 'unavailable'}
                    onClick={() => void download()}
                  >
                    {modelState === 'error' ? 'Retry download' : 'Download voice model'}
                  </button>
                )}
              </article>
            </div>
            <p class="voice-privacy">
              Audio stays in this browser. Voice tracking stops when you turn it off or leave the
              presenter.
            </p>
            {message && (
              <p class="voice-message" role="status">
                {message}
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
