import { useEffect, useRef, useState } from 'preact/hooks';
import { parseMarkup } from '../domain/studio/markup';
import {
  MIRROR_MODES,
  PROMPTER_CHANNEL,
  nextMirror,
  projectedProgress,
  type MirrorMode,
  type PrompterMessage,
  type PrompterState,
} from '../domain/studio/operator';
import { Icon } from './Icons';

const MIRROR_KEY = 'studio.operator.mirror';
const SIZE_KEY = 'studio.operator.fontSize';
const MIRROR_LABEL: Record<MirrorMode, string> = {
  off: 'Mirror: off',
  horizontal: 'Mirror: left to right',
  vertical: 'Mirror: upside down',
  both: 'Mirror: both',
};
function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
const remember = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage unavailable. */
  }
};
const SIZES = ['40', '56', '72', '96', '120'] as const;

/** `#/prompter-window`: the prompter only, driven by the main window over BroadcastChannel. */
export default function OperatorWindow() {
  const [state, setState] = useState<PrompterState | null>(null);
  const [mirror, setMirror] = useState<MirrorMode>(() => stored(MIRROR_KEY, MIRROR_MODES, 'off'));
  const [size, setSize] = useState(() => stored(SIZE_KEY, SIZES, '72'));
  const scroller = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ state: PrompterState; at: number } | null>(null);
  const parsed = state ? parseMarkup(state.body) : null;
  const words = parsed?.spokenWordCount ?? 0;
  useEffect(() => {
    document.title = 'Operator window · teleprompter.wtf';
    document.body.classList.add('studio-operator-body');
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(PROMPTER_CHANNEL);
    channel.onmessage = (event: MessageEvent<PrompterMessage>) => {
      if (event.data?.type !== 'state') return;
      anchor.current = { state: event.data.state, at: performance.now() };
      setState(event.data.state);
    };
    channel.postMessage({ type: 'hello' } satisfies PrompterMessage);
    return () => channel.close();
  }, []);
  useEffect(() => {
    // Between messages, move at the sender's WPM so the text glides instead of stepping.
    let frame = 0;
    const tick = () => {
      const el = scroller.current;
      const current = anchor.current;
      if (el && current) {
        const progress = projectedProgress(
          current.state,
          words,
          (performance.now() - current.at) / 1000,
        );
        el.scrollTop = progress * Math.max(0, el.scrollHeight - el.clientHeight);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [words]);
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };
  return (
    <main
      class="studio-operator"
      data-playing={state?.playing ? 'true' : 'false'}
      aria-label="Operator window"
    >
      <h1 class="studio-visually-hidden">Operator window</h1>
      <div class="studio-operator__cue" aria-hidden="true" />
      <div
        ref={scroller}
        class={`studio-operator__scroll mirror-${mirror}`}
        style={{ fontSize: `${size}px` }}
      >
        <div class="studio-operator__text">
          {parsed ? (
            parsed.tokens.map((token, index) =>
              token.type === 'paragraphBreak' ? (
                <br key={index} />
              ) : token.type === 'section' ? (
                <h2 key={index}>{token.value}</h2>
              ) : token.type === 'pause' || token.type === 'cue' ? (
                <span key={index} class="prompter-chip">
                  {token.type === 'pause' ? 'Pause' : token.value}
                </span>
              ) : token.type === 'note' ? null : (
                <span key={index}>{token.value} </span>
              ),
            )
          ) : (
            <p class="studio-operator__waiting">
              Waiting for the main window. Open Practice or Record there.
            </p>
          )}
        </div>
      </div>
      <div class="studio-operator__controls">
        <span class="studio-operator__state" role="status">
          <Icon name={state?.playing ? 'play' : 'pause'} size={18} />
          <span class="studio-visually-hidden">{state?.playing ? 'Playing' : 'Paused'}</span>
          {state ? `${state.wpm} WPM` : ''}
        </span>
        <button
          aria-label="Smaller text"
          onClick={() => {
            const next = SIZES[Math.max(0, SIZES.indexOf(size) - 1)] ?? size;
            setSize(next);
            remember(SIZE_KEY, next);
          }}
        >
          A−
        </button>
        <button
          aria-label="Larger text"
          onClick={() => {
            const next = SIZES[Math.min(SIZES.length - 1, SIZES.indexOf(size) + 1)] ?? size;
            setSize(next);
            remember(SIZE_KEY, next);
          }}
        >
          A+
        </button>
        <button
          aria-label={MIRROR_LABEL[mirror]}
          onClick={() => {
            const next = nextMirror(mirror);
            setMirror(next);
            remember(MIRROR_KEY, next);
          }}
        >
          <Icon name="mirror" size={20} />
        </button>
        <button aria-label="Full screen" onClick={fullscreen}>
          <Icon name="fullscreen" size={20} />
        </button>
      </div>
    </main>
  );
}
