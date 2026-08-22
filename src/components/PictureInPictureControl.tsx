import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { detectBrowserCapabilities } from '../domain/capabilities';

interface Props {
  script: string;
  progress: number;
  playing: boolean;
  onTogglePlay: () => void;
}

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

type PipWindow = Window &
  typeof globalThis & {
    documentPictureInPicture?: DocumentPictureInPicture;
  };

const visibleText = (script: string, progress: number): string => {
  const paragraphs = script.split(/\n\s*\n/).filter(Boolean);
  const index = Math.min(
    paragraphs.length - 1,
    Math.max(0, Math.floor(progress * paragraphs.length)),
  );
  return [paragraphs[index - 1], paragraphs[index], paragraphs[index + 1]]
    .filter(Boolean)
    .join('\n\n');
};

export default function PictureInPictureControl({
  script,
  progress,
  playing,
  onTogglePlay,
}: Props): preact.JSX.Element {
  const [activeMode, setActiveMode] = useState<'document' | 'video' | 'popout' | null>(null);
  const [message, setMessage] = useState('');
  const capabilities = useRef(detectBrowserCapabilities()).current;
  const childWindowRef = useRef<Window | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef({ script, progress, playing });
  latestRef.current = { script, progress, playing };

  useEffect(() => () => close(), []);

  const renderChild = (child: Window) => {
    const text = child.document.querySelector('[data-pip-script]');
    const state = child.document.querySelector('[data-pip-state]');
    const toggle = child.document.querySelector<HTMLButtonElement>('[data-pip-toggle]');
    if (text) text.textContent = visibleText(latestRef.current.script, latestRef.current.progress);
    if (state) state.textContent = latestRef.current.playing ? 'Playing' : 'Paused';
    if (toggle) toggle.textContent = latestRef.current.playing ? 'Pause' : 'Resume';
  };

  const setUpChild = (child: Window, mode: 'document' | 'popout') => {
    child.document.title = 'teleprompter.wtf presenter';
    child.document.body.innerHTML = '';
    const style = child.document.createElement('style');
    style.textContent =
      'html,body{margin:0;min-height:100%;background:#080a0d;color:#f8f1e4;font-family:system-ui,sans-serif}body{box-sizing:border-box;padding:8vh 7vw;display:grid;align-content:center}.brand{position:fixed;top:18px;left:20px;color:#ffb45d;font-weight:800}.state{position:fixed;top:18px;right:20px;color:#b8c4c8;font-size:13px}.script{font-size:clamp(30px,5vw,62px);line-height:1.5;white-space:pre-wrap;max-width:24ch;margin:auto}.focus{position:fixed;left:0;right:0;top:50%;border-top:1px solid #8a3226;pointer-events:none}.toggle{position:fixed;right:18px;bottom:18px;min-width:72px;min-height:40px;border:1px solid #615f57;border-radius:7px;color:#fff;background:#252622;font:700 13px system-ui}';
    const brand = child.document.createElement('div');
    brand.className = 'brand';
    brand.textContent = 'teleprompter.wtf';
    const state = child.document.createElement('div');
    state.className = 'state';
    state.dataset.pipState = 'true';
    const text = child.document.createElement('div');
    text.className = 'script';
    text.dataset.pipScript = 'true';
    const focus = child.document.createElement('div');
    focus.className = 'focus';
    const toggle = child.document.createElement('button');
    toggle.className = 'toggle';
    toggle.dataset.pipToggle = 'true';
    toggle.addEventListener('click', onTogglePlay);
    child.document.head.append(style);
    child.document.body.append(brand, state, text, focus, toggle);
    childWindowRef.current = child;
    setActiveMode(mode);
    renderChild(child);
    timerRef.current = setInterval(() => renderChild(child), 250);
    child.addEventListener('pagehide', () => close());
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#080a0d';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffb45d';
    context.font = '700 22px system-ui';
    context.fillText('teleprompter.wtf', 30, 42);
    context.fillStyle = '#f8f1e4';
    context.font = '600 34px system-ui';
    const words = visibleText(latestRef.current.script, latestRef.current.progress).split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const next = `${line} ${word}`.trim();
      if (context.measureText(next).width > canvas.width - 80) {
        lines.push(line);
        line = word;
      } else line = next;
      if (lines.length >= 5) break;
    }
    if (line && lines.length < 6) lines.push(line);
    lines.forEach((current, index) => context.fillText(current, 40, 110 + index * 54));
  };

  const open = async () => {
    setMessage('');
    try {
      const documentPip = (window as PipWindow).documentPictureInPicture;
      if (capabilities.documentPictureInPicture && documentPip) {
        const child = await documentPip.requestWindow({ width: 640, height: 420 });
        setUpChild(child, 'document');
        analytics.track('opened_picture_in_picture', { pip_mode: 'document' });
        return;
      }

      if (capabilities.videoPictureInPicture && capabilities.canvasCapture) {
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 540;
        canvasRef.current = canvas;
        drawCanvas();
        const stream = canvas.captureStream(10);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        videoRef.current = video;
        await video.play();
        await video.requestPictureInPicture();
        setActiveMode('video');
        timerRef.current = setInterval(drawCanvas, 100);
        video.addEventListener('leavepictureinpicture', () => close());
        analytics.track('opened_picture_in_picture', { pip_mode: 'video' });
        return;
      }

      const child = window.open('', 'teleprompter-wtf-popout', 'popup,width=640,height=420');
      if (!child) throw new Error('popout-blocked');
      setUpChild(child, 'popout');
      analytics.track('opened_picture_in_picture', { pip_mode: 'popout' });
    } catch {
      setMessage('The compact presenter could not open. Your main presenter still works.');
    }
  };

  const close = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (document.pictureInPictureElement && document.exitPictureInPicture) {
      void document.exitPictureInPicture().catch(() => undefined);
    }
    const media = videoRef.current?.srcObject;
    if (media instanceof MediaStream) media.getTracks().forEach((track) => track.stop());
    videoRef.current = null;
    canvasRef.current = null;
    if (childWindowRef.current && !childWindowRef.current.closed) childWindowRef.current.close();
    childWindowRef.current = null;
    setActiveMode(null);
  };

  const label =
    capabilities.documentPictureInPicture || capabilities.videoPictureInPicture
      ? 'Picture in Picture'
      : 'Pop out';

  return (
    <div class="pip-control">
      <button class="control-button" onClick={() => (activeMode ? close() : void open())}>
        {activeMode ? 'Close compact view' : label}
      </button>
      {activeMode && (
        <button class="sr-only" onClick={onTogglePlay}>
          {playing ? 'Pause compact presenter' : 'Play compact presenter'}
        </button>
      )}
      {message && (
        <span class="sr-only" role="status">
          {message}
        </span>
      )}
    </div>
  );
}
