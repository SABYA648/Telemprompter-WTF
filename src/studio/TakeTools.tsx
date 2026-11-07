import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import {
  ConversionCanceled,
  UNSUPPORTED_MESSAGE,
  convertToMp4,
  mp4EncodingSupported,
  suggestTrimFor,
  type TrimRange,
} from '../domain/studio/convert';
import {
  markTakeExported,
  shareOrDownload,
  sizeBucket,
  takeFilename,
} from '../domain/studio/exportTake';
import { parseMarkup } from '../domain/studio/markup';
import { saveTake, takeBlob } from '../domain/studio/takesRepo';
import { TIMELINE_LABEL, buildChapters, buildCues, formatSrt } from '../domain/studio/timeline';
import type { StudioScript, StudioTake } from '../domain/studio/types';
import { Icon } from './Icons';
import { Sheet } from './Sheet';

export type TakeTool = 'chapters' | 'captions' | 'convert' | 'trim';
const withExtension = (name: string, extension: string) =>
  name.replace(/\.[^.]+$/, `.${extension}`);

export function TakeToolSheet({
  tool,
  take,
  script,
  onClose,
  onChange,
}: {
  tool: TakeTool;
  take: StudioTake;
  script: StudioScript | null;
  onClose: () => void;
  onChange: (take: StudioTake) => void;
}) {
  if (tool === 'chapters')
    return (
      <Sheet title="YouTube chapters" onClose={onClose}>
        <Chapters take={take} script={script} />
      </Sheet>
    );
  if (tool === 'captions')
    return (
      <Sheet title="Captions" onClose={onClose}>
        <Captions take={take} script={script} />
      </Sheet>
    );
  return (
    <Sheet title={tool === 'trim' ? 'Trim' : 'Convert to MP4'} onClose={onClose}>
      <Mp4Tool mode={tool} take={take} title={script?.title ?? null} onChange={onChange} />
    </Sheet>
  );
}

function Chapters({ take, script }: { take: StudioTake; script: StudioScript | null }) {
  const [status, setStatus] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const result = script
    ? buildChapters(
        take.timeline,
        parseMarkup(script.body).sections.map((section) => section.title),
        take.durationMs,
      )
    : ({
        ok: false,
        reason: "Chapters come from the script's sections. This take has no script.",
      } as const);
  return (
    <>
      <p class="studio-muted">{TIMELINE_LABEL}</p>
      {result.ok ? (
        <>
          <textarea
            ref={field}
            class="studio-sheet__output"
            readOnly
            aria-label="Chapters"
            rows={Math.min(8, result.chapters.length + 1)}
            value={result.text}
          />
          <button
            class="studio-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result.text);
                setStatus('Copied. Paste them into your YouTube description.');
              } catch {
                field.current?.select();
                setStatus('Select the text and copy it.');
              }
              analytics.track('exported_chapters');
            }}
          >
            <Icon name="copy" size={20} /> Copy chapters
          </button>
        </>
      ) : (
        <p role="status">{result.reason}</p>
      )}
      {status && <p role="status">{status}</p>}
    </>
  );
}

function Captions({ take, script }: { take: StudioTake; script: StudioScript | null }) {
  const cues =
    script && take.wordsPerLine
      ? buildCues(
          take.timeline,
          parseMarkup(script.body).spokenText,
          take.wordsPerLine,
          take.durationMs,
        )
      : [];
  const reason = !script
    ? 'Captions come from the script. This take has no script.'
    : !take.wordsPerLine
      ? 'This take was kept before captions were available. Record a new take to export captions.'
      : !cues.length
        ? "The prompter didn't move during this take, so there is nothing to time."
        : '';
  const srt = formatSrt(cues);
  return (
    <>
      <p class="studio-muted">{TIMELINE_LABEL}</p>
      {reason ? (
        <p role="status">{reason}</p>
      ) : (
        <>
          <pre class="studio-sheet__output" aria-label="Caption preview">
            {formatSrt(cues.slice(0, 3))}
          </pre>
          <p class="studio-muted">
            {cues.length} {cues.length === 1 ? 'caption' : 'captions'} · SRT
          </p>
          <button
            class="studio-button"
            onClick={() => {
              const name = withExtension(takeFilename(script?.title ?? null, take), 'srt');
              const url = URL.createObjectURL(new Blob([srt], { type: 'application/x-subrip' }));
              const link = document.createElement('a');
              link.href = url;
              link.download = name;
              document.body.append(link);
              link.click();
              link.remove();
              setTimeout(() => URL.revokeObjectURL(url), 60_000);
              analytics.track('exported_captions');
            }}
          >
            <Icon name="import" size={20} /> Download SRT
          </button>
        </>
      )}
    </>
  );
}

type Mp4State = 'checking' | 'unsupported' | 'ready' | 'running' | 'done' | 'failed';
const seconds = (ms: number) => Math.round(ms / 100) / 10;

function Mp4Tool({
  mode,
  take,
  title,
  onChange,
}: {
  mode: 'convert' | 'trim';
  take: StudioTake;
  title: string | null;
  onChange: (take: StudioTake) => void;
}) {
  const [state, setState] = useState<Mp4State>('checking');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [range, setRange] = useState<TrimRange>(
    take.trim ?? { startMs: 0, endMs: take.durationMs },
  );
  const [suggesting, setSuggesting] = useState(false);
  const [output, setOutput] = useState<Blob | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    let active = true;
    void mp4EncodingSupported(take.width, take.height).then((supported) => {
      if (!active) return;
      setState(supported ? 'ready' : 'unsupported');
      if (!supported && mode === 'convert')
        analytics.track('converted_take', { result: 'unsupported' });
    });
    return () => {
      active = false;
      abort.current?.abort();
    };
  }, [take.id]);
  const validRange = range.endMs - range.startMs >= 500;
  const run = async () => {
    const controller = new AbortController();
    abort.current = controller;
    setState('running');
    setProgress(0);
    setStatus('');
    try {
      const blob = await convertToMp4(await takeBlob(take), {
        trim: mode === 'trim' ? range : undefined,
        onProgress: setProgress,
        signal: controller.signal,
      });
      setOutput(blob);
      setState('done');
      if (mode === 'trim') {
        const next = { ...take, trim: range };
        await saveTake(next);
        onChange(next);
        analytics.track('trimmed_take');
      } else analytics.track('converted_take', { result: 'success' });
    } catch (error) {
      if (error instanceof ConversionCanceled) {
        setState('ready');
        setStatus('Canceled. Your take is unchanged.');
        return;
      }
      analytics.error('studio', error);
      setState('failed');
      if (mode === 'convert') analytics.track('converted_take', { result: 'failed' });
    } finally {
      abort.current = null;
    }
  };
  const save = async () => {
    if (!output) return;
    const name = withExtension(takeFilename(title, take), 'mp4').replace(
      /\.mp4$/,
      mode === 'trim' ? '-trimmed.mp4' : '.mp4',
    );
    const method = await shareOrDownload(new File([output], name, { type: 'video/mp4' }));
    if (method === 'cancel') return;
    await markTakeExported(take);
    analytics.track('exported_take', {
      method,
      container: 'mp4',
      size_bucket: sizeBucket(output.size),
    });
    dispatchEvent(new Event('studio-take-exported'));
    setStatus('Video saved.');
  };
  if (state === 'checking') return <p role="status">Checking this browser...</p>;
  if (state === 'unsupported')
    return (
      <p role="status" class="studio-convert-unsupported">
        {UNSUPPORTED_MESSAGE}
      </p>
    );
  const max = seconds(take.durationMs);
  return (
    <>
      {mode === 'convert' ? (
        <p class="studio-muted">Makes an H.264 MP4 on this device. Nothing is uploaded.</p>
      ) : (
        <>
          <div class="studio-trim-fields">
            <label class="studio-label">
              Start (s)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max={max}
                step="0.1"
                disabled={state === 'running'}
                value={seconds(range.startMs)}
                onInput={(event) =>
                  setRange({
                    ...range,
                    startMs: Math.max(0, Number((event.target as HTMLInputElement).value) * 1000),
                  })
                }
              />
            </label>
            <label class="studio-label">
              End (s)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max={max}
                step="0.1"
                disabled={state === 'running'}
                value={seconds(range.endMs)}
                onInput={(event) =>
                  setRange({
                    ...range,
                    endMs: Math.min(
                      take.durationMs,
                      Number((event.target as HTMLInputElement).value) * 1000,
                    ),
                  })
                }
              />
            </label>
          </div>
          <button
            class="studio-button studio-button--quiet"
            disabled={suggesting || state === 'running'}
            onClick={async () => {
              setSuggesting(true);
              const suggestion = await suggestTrimFor(await takeBlob(take));
              setSuggesting(false);
              if (!suggestion) {
                setStatus("We couldn't find speech to suggest a trim. Set it by hand.");
                return;
              }
              setRange(suggestion);
              setStatus(
                `Suggested from the audio: starts at ${seconds(suggestion.startMs)} s, ends at ${seconds(suggestion.endMs)} s. Check it, then trim.`,
              );
            }}
          >
            <Icon name="idea" size={20} /> {suggesting ? 'Listening...' : 'Suggest trim'}
          </button>
          {!validRange && <p class="studio-warning">Keep at least half a second.</p>}
        </>
      )}
      {state === 'running' && (
        <>
          <progress value={progress} max={1} aria-label="Conversion progress" />
          <p aria-live="polite">{Math.round(progress * 100)}%</p>
          <button class="studio-button studio-button--quiet" onClick={() => abort.current?.abort()}>
            <Icon name="close" size={20} /> Cancel
          </button>
        </>
      )}
      {state === 'failed' && (
        <p role="status">The conversion failed. Your original take is unchanged.</p>
      )}
      {(state === 'ready' || state === 'failed') && (
        <button
          class="studio-button"
          disabled={mode === 'trim' && !validRange}
          onClick={() => void run()}
        >
          <Icon name={mode === 'trim' ? 'scissors' : 'convert'} size={20} />
          {mode === 'trim' ? 'Trim to MP4' : 'Convert to MP4'}
        </button>
      )}
      {state === 'done' && (
        <button class="studio-button" onClick={() => void save()}>
          <Icon name="share" size={20} /> {mode === 'trim' ? 'Save trimmed MP4' : 'Save MP4'}
        </button>
      )}
      {status && <p role="status">{status}</p>}
    </>
  );
}
