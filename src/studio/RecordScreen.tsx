import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics, deviceClass } from '../domain/analytics';
import {
  cameraErrorReason,
  openCamera,
  type CameraOptions,
  type CameraReason,
} from '../domain/studio/camera';
import { exportTake } from '../domain/studio/exportTake';
import { browserHandoffUrl, isInAppBrowser } from '../domain/studio/inAppBrowser';
import { mediaSupport } from '../domain/studio/mediaSupport';
import { parseMarkup } from '../domain/studio/markup';
import {
  fitWpm,
  pixelsPerSecond,
  pixelsPerWord,
  crossedMarker,
} from '../domain/studio/prompterScroll';
import { StudioRecorder, type StopReason } from '../domain/studio/recorder';
import { getScript, listScripts, saveScript } from '../domain/studio/scriptsRepo';
import { deleteTake, saveTake, takeBlob } from '../domain/studio/takesRepo';
import type { StudioScript, StudioTake, TimelineMark } from '../domain/studio/types';
import { TimeBasedScrollController } from '../domain/scrollController';
import { getDb } from '../domain/studio/db';

type Quick = {
  facing: 'user' | 'environment';
  resolution: '720p' | '1080p' | '2160p';
  countdown: 0 | 3 | 5 | 10;
  safeZone: 'off' | 'instagram' | 'youtube_shorts' | 'tiktok';
  grid: boolean;
  deviceId: string | null;
};
const DEFAULT: Quick = {
  facing: 'user',
  resolution: '1080p',
  countdown: 3,
  safeZone: 'instagram',
  grid: false,
  deviceId: null,
};
const formatTime = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const lengthBucket = (ms: number) =>
  ms < 15000
    ? 'under_15s'
    : ms < 30000
      ? '15_30s'
      : ms < 60000
        ? '30_60s'
        : ms < 90000
          ? '60_90s'
          : ms < 180000
            ? '90_180s'
            : ms < 600000
              ? '3_10m'
              : '10m_plus';
const numberBucket = (n: number) => (n === 1 ? '1' : n === 2 ? '2' : n <= 5 ? '3_5' : '6_plus');
const progressBucket = (n: number) =>
  n < 0.25 ? '0_25' : n < 0.5 ? '25_50' : n < 0.75 ? '50_75' : n < 0.95 ? '75_95' : '95_100';
function setting(name: string) {
  analytics.track('changed_studio_setting', {
    setting: name as 'camera_facing',
    group: name.split('_')[0] as 'camera',
  });
}
function wake(): Promise<WakeLockSentinel | undefined> {
  return navigator.wakeLock?.request('screen').catch(() => undefined) ?? Promise.resolve(undefined);
}
export default function RecordScreen({ id, memory }: { id: string; memory: boolean }) {
  const [script, setScript] = useState<StudioScript | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [quick, setQuick] = useState<Quick>(
    deviceClass() === 'desktop' ? { ...DEFAULT, safeZone: 'off' } : DEFAULT,
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<'priming' | 'opening' | 'ready' | 'error'>(
    'priming',
  );
  const [reason, setReason] = useState<CameraReason>('unknown');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [wpm, setWpm] = useState(140);
  const [font, setFont] = useState(deviceClass() === 'desktop' ? 40 : 30);
  const [notice, setNotice] = useState('');
  const [aspectMismatch, setAspectMismatch] = useState(false);
  const [review, setReview] = useState<StudioTake | null>(null);
  const [kept, setKept] = useState(false);
  const [reviewUrl, setReviewUrl] = useState('');
  const instantBlob = useRef<{ id: string; blob: Blob } | null>(null);
  const [mutedReview, setMutedReview] = useState(true);
  const [angle, setAngle] = useState(screen.orientation?.angle ?? 0);
  const usedRemote = useRef(false);
  const [dock, setDock] = useState<'auto' | 'left' | 'right' | 'top'>('auto');
  const video = useRef<HTMLVideoElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const controller = useRef<TimeBasedScrollController | null>(null);
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;
  const fontRef = useRef(font);
  fontRef.current = font;
  const recorder = useRef<StudioRecorder | null>(null);
  const desktopWrite = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  const starting = useRef(false);
  const timeline = useRef<TimelineMark[]>([]);
  const markers = useRef<number[]>([]);
  const sections = useRef<number[]>([]);
  const consumed = useRef(new Set<number>());
  const cueOffset = useRef(0);
  const linePx = useRef(40);
  const wakeLock = useRef<WakeLockSentinel | undefined>(undefined);
  const dragY = useRef<number | null>(null);
  const mobile = deviceClass() !== 'desktop';
  const windowLines = mobile ? 4 : 6;
  const inApp = isInAppBrowser(navigator.userAgent);
  const effectiveDock =
    dock === 'auto' && mobile && matchMedia('(orientation: landscape)').matches
      ? angle === 90
        ? 'left'
        : 'right'
      : dock;
  const parsed = script ? parseMarkup(script.body) : null;
  const hasScript = Boolean(parsed?.spokenWordCount);
  const targetMs = (script?.targetSeconds ?? 0) * 1000;
  const capabilities = stream?.getVideoTracks()[0]?.getCapabilities?.();
  const maxSide = Math.max(capabilities?.width?.max ?? 0, capabilities?.height?.max ?? 0);
  const updateQuick = (next: Quick, key: string) => {
    setQuick(next);
    void (async () => (await getDb()).put('kv', next, 'record.quick'))();
    setting(key);
  };
  const editBesidePreview = (next: StudioScript) => {
    setScript(next);
    desktopWrite.current = desktopWrite.current
      .catch(() => undefined)
      .then(() => saveScript(next))
      .catch((error) => analytics.error('studio', error));
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      const [item, saved] = await Promise.all([
        id === 'next' ? listScripts().then((items) => items[0]) : getScript(id),
        (await getDb()).get('kv', 'record.quick'),
      ]);
      if (!active) return;
      setScript(item ?? null);
      if (item?.targetSeconds)
        setWpm(fitWpm(parseMarkup(item.body).spokenWordCount, item.targetSeconds));
      if (saved)
        setQuick({
          ...DEFAULT,
          safeZone: mobile ? 'instagram' : 'off',
          ...(saved as Partial<Quick>),
        });
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (loaded && inApp) analytics.track('camera_failed', { reason: 'in_app_browser' });
  }, [loaded, inApp]);
  useEffect(() => {
    const update = () => setAngle(screen.orientation?.angle ?? 0);
    screen.orientation?.addEventListener?.('change', update);
    addEventListener('orientationchange', update);
    return () => {
      screen.orientation?.removeEventListener?.('change', update);
      removeEventListener('orientationchange', update);
    };
  }, []);
  useEffect(() => {
    if (!loaded || inApp) return;
    const support = mediaSupport();
    if (!support.camera || !support.secure || !support.recorder || !support.mime) {
      const failure: CameraReason =
        !support.secure || !support.camera ? 'insecure_context' : 'unsupported';
      setReason(failure);
      setPermission('error');
      analytics.track('camera_failed', { reason: failure });
      return;
    }
    void (async () => {
      const db = await getDb();
      if (await db.get('kv', 'camera.primed')) void requestCamera(quick);
      else {
        setPermission('priming');
        analytics.track('viewed_camera_priming');
      }
    })();
  }, [loaded]);
  useEffect(() => {
    if (stream && video.current) {
      video.current.srcObject = stream;
      void video.current.play().catch(() => undefined);
    }
  }, [stream, permission]);
  useEffect(() => {
    if (!stream) return;
    const onDevices = () => {
      void navigator.mediaDevices
        .enumerateDevices()
        .then((items) => setDevices(items.filter((d) => d.kind === 'videoinput')));
    };
    onDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', onDevices);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', onDevices);
  }, [stream]);
  useEffect(() => {
    if (permission !== 'ready') return;
    void wake().then((lock) => {
      wakeLock.current = lock;
    });
    const visible = () => {
      if (document.visibilityState === 'visible')
        void wake().then((lock) => {
          wakeLock.current = lock;
        });
      else if (mobile) recorder.current?.stop('interruption');
    };
    const pagehide = () => recorder.current?.stop('interruption');
    document.addEventListener('visibilitychange', visible);
    addEventListener('pagehide', pagehide);
    return () => {
      document.removeEventListener('visibilitychange', visible);
      removeEventListener('pagehide', pagehide);
      void wakeLock.current?.release();
      recorder.current?.stop('interruption');
      stream?.getTracks().forEach((t) => t.stop());
      controller.current?.destroy();
    };
  }, [permission, stream]);
  useEffect(() => {
    if (!hasScript || !scroller.current || permission !== 'ready') return;
    const el = scroller.current;
    const measure = () => {
      const content = el.querySelector<HTMLElement>('.prompter-content');
      if (!content) return;
      cueOffset.current = el.clientHeight * 0.3;
      linePx.current = fontRef.current * 1.35;
      const height = content.scrollHeight;
      controller.current?.setSpeed(
        pixelsPerSecond(wpmRef.current, pixelsPerWord(height, parsed?.spokenWordCount ?? 1)),
      );
      markers.current = [...el.querySelectorAll<HTMLElement>('[data-pause]')].map(
        (node) => node.offsetTop,
      );
      sections.current = [...el.querySelectorAll<HTMLElement>('[data-section]')].map(
        (node) => node.offsetTop,
      );
      controller.current?.notifyLayoutChange();
    };
    controller.current = new TimeBasedScrollController({
      element: el,
      pixelsPerSecond: 0,
      onUpdate: (snapshot) => {
        setScrolling(snapshot.isPlaying);
        const marker = crossedMarker(
          snapshot.scrollTop,
          cueOffset.current,
          markers.current,
          consumed.current,
        );
        if (marker !== null) {
          consumed.current.add(marker);
          controller.current?.pause();
          setNotice('Paused at marker. Tap to continue.');
        }
        if (recorder.current) {
          const line = Math.floor(snapshot.scrollTop / linePx.current);
          const section =
            sections.current.filter((top) => top <= snapshot.scrollTop + cueOffset.current).length -
            1;
          const last = timeline.current.at(-1);
          if (last?.line !== line || last.section !== Math.max(0, section))
            timeline.current.push({
              t: Math.round(recorder.current.elapsed()),
              line,
              section: Math.max(0, section),
            });
        }
      },
      onComplete: () => setScrolling(false),
    });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    requestAnimationFrame(measure);
    return () => {
      observer.disconnect();
      controller.current?.destroy();
      controller.current = null;
    };
  }, [permission, script?.body]);
  useEffect(() => {
    const content = scroller.current?.querySelector<HTMLElement>('.prompter-content');
    if (content)
      controller.current?.setSpeed(
        pixelsPerSecond(wpm, pixelsPerWord(content.scrollHeight, parsed?.spokenWordCount ?? 1)),
      );
  }, [wpm, parsed?.spokenWordCount]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const ms = recorder.current?.elapsed() ?? 0;
      setElapsed(ms);
    }, 250);
    return () => clearInterval(timer);
  }, [recording, targetMs]);
  useEffect(() => {
    if (!review) return;
    let active = true;
    let url = '';
    void Promise.resolve(
      instantBlob.current?.id === review.id ? instantBlob.current.blob : takeBlob(review),
    ).then((blob) => {
      url = URL.createObjectURL(blob);
      if (active) setReviewUrl(url);
      else URL.revokeObjectURL(url);
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [review?.id]);
  const requestCamera = async (options: Quick) => {
    setPermission('opening');
    const started = performance.now();
    try {
      const config: CameraOptions = {
        ...options,
        frameRate: 30,
        aspect: script?.aspect ?? (mobile ? '9:16' : '16:9'),
      };
      const next = await openCamera(config);
      const actual = next.getVideoTracks()[0]?.getSettings();
      const desired = config.aspect === '16:9' ? 16 / 9 : 9 / 16;
      setAspectMismatch(
        Boolean(
          actual?.width &&
          actual?.height &&
          Math.abs(actual.width / actual.height / desired - 1) > 0.02,
        ),
      );
      setStream(next);
      setPermission('ready');
      await (await getDb()).put('kv', true, 'camera.primed');
      const delay = performance.now() - started;
      analytics.track('granted_camera', {
        ready_bucket: delay < 1000 ? 'under_1s' : delay < 3000 ? '1_3s' : '3s_plus',
      });
    } catch (error) {
      const failed = (error as { reason?: CameraReason }).reason ?? cameraErrorReason(error);
      setReason(failed);
      setPermission('error');
      analytics.track('camera_failed', { reason: failed });
    }
  };
  const flip = () => {
    if (recording) return;
    stream?.getTracks().forEach((t) => t.stop());
    const next = {
      ...quick,
      facing: quick.facing === 'user' ? ('environment' as const) : ('user' as const),
      deviceId: null,
    };
    updateQuick(next, 'camera_facing');
    void requestCamera(next);
  };
  const begin = async () => {
    if (!stream || recording || starting.current || recorder.current) return;
    starting.current = true;
    setNotice('');
    timeline.current = [];
    if (quick.countdown) {
      for (let n = quick.countdown; n > 0; n--) {
        setCountdown(n);
        if (navigator.vibrate) navigator.vibrate(10);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    if (!mounted.current) {
      starting.current = false;
      return;
    }
    setCountdown(null);
    try {
      const videoSettings = stream.getVideoTracks()[0]?.getSettings();
      const session = await StudioRecorder.start({
        stream,
        scriptId: hasScript ? (script?.id ?? null) : null,
        facing: quick.facing === 'user' ? 'front' : 'back',
        resolution: quick.resolution,
        frameRate: videoSettings?.frameRate ?? 30,
        quality: 'high',
        timeline: timeline.current,
        onStop: (take, why, blob) => {
          instantBlob.current = { id: take.id, blob };
          recorder.current = null;
          setRecording(false);
          setElapsed(take.durationMs);
          controller.current?.pause();
          if (take.status === 'failed') {
            setNotice('Recording could not be saved to browser storage. Save this video now.');
            analytics.track('recording_failed', { reason: 'storage_full' });
            if (blob.size) setReview(take);
            return;
          }
          setReview(take);
          setKept(false);
          if (why === 'interruption')
            setNotice('Recording stopped when the app went to the background. Your take is saved.');
          analytics.track('stopped_take', {
            take_length_bucket: lengthBucket(take.durationMs),
            ended_by: why,
            progress_bucket: progressBucket(
              scroller.current
                ? scroller.current.scrollTop /
                    Math.max(1, scroller.current.scrollHeight - scroller.current.clientHeight)
                : 0,
            ),
          });
        },
        onError: (error) => {
          analytics.error('studio', error);
          const full = (error as { name?: string })?.name === 'QuotaExceededError';
          if (full)
            setNotice(
              'Not enough space for a new take. Save and delete old takes, or lower the quality.',
            );
          analytics.track('recording_failed', { reason: full ? 'storage_full' : 'recorder_error' });
        },
      });
      recorder.current = session;
      starting.current = false;
      setRecording(true);
      setPaused(false);
      analytics.track('started_take', {
        aspect: script?.aspect === '16:9' ? '16_9' : '9_16',
        resolution: quick.resolution,
        fps: [24, 25, 30, 50, 60].includes(Math.round(videoSettings?.frameRate ?? 30))
          ? (Math.round(videoSettings?.frameRate ?? 30) as 24 | 25 | 30 | 50 | 60)
          : 'other',
        facing: quick.facing === 'user' ? 'front' : 'back',
        mode: hasScript ? 'full' : 'free',
        countdown: quick.countdown,
        has_target: Boolean(targetMs),
      });
      if (hasScript) {
        controller.current?.restart();
        consumed.current.clear();
        controller.current?.start();
      }
    } catch (error) {
      starting.current = false;
      setNotice('Could not start recording. Try again.');
      analytics.track('recording_failed', {
        reason:
          (error as { reason?: 'mime_unsupported'; name?: string }).name === 'QuotaExceededError'
            ? 'storage_full'
            : ((error as { reason?: 'mime_unsupported' }).reason ?? 'recorder_error'),
      });
    }
  };
  const stop = (why: StopReason = 'user') => recorder.current?.stop(why);
  const keep = async () => {
    if (!review) return;
    const next = { ...review, kept: true };
    try {
      await saveTake(next);
    } catch (error) {
      setNotice(
        'Not enough space for a new take. Save and delete old takes, or lower the quality.',
      );
      analytics.error('studio', error);
      return;
    }
    setReview(next);
    setKept(true);
    if (script)
      await saveScript({
        ...script,
        takeCount: script.takeCount + 1,
        lastRecordedAt: Date.now(),
        status: 'recorded',
      });
    const db = await getDb();
    if (!(await db.get('kv', 'storage.persistRequested'))) {
      await db.put('kv', true, 'storage.persistRequested');
      void navigator.storage?.persist?.();
    }
    analytics.track('kept_take', {
      take_number_bucket: numberBucket(next.number),
      take_length_bucket: lengthBucket(next.durationMs),
      fit: targetMs
        ? next.durationMs < targetMs * 0.9
          ? 'under'
          : next.durationMs > targetMs * 1.1
            ? 'over'
            : 'on_target'
        : 'no_target',
    });
  };
  const discard = async () => {
    if (!review) return;
    await deleteTake(review.id);
    analytics.track('discarded_take', { take_length_bucket: lengthBucket(review.durationMs) });
    setReview(null);
    setReviewUrl('');
  };
  const save = async () => {
    if (!review) return;
    const method = await exportTake(
      review,
      script?.title ?? null,
      review.status === 'failed' ? instantBlob.current?.blob : undefined,
    );
    if (method === 'cancel') return;
    analytics.track('exported_take', {
      method,
      container: review.container,
      size_bucket:
        review.sizeBytes < 1e7
          ? 'under_10mb'
          : review.sizeBytes < 5e7
            ? '10_50mb'
            : review.sizeBytes < 2e8
              ? '50_200mb'
              : '200mb_plus',
    });
    setNotice('Video saved.');
  };
  useEffect(() => {
    const keys: Record<string, () => void> = {
      ' ': () => (scrolling ? controller.current?.pause() : controller.current?.start()),
      Enter: () => (scrolling ? controller.current?.pause() : controller.current?.start()),
      b: () => (scrolling ? controller.current?.pause() : controller.current?.start()),
      '.': () => (scrolling ? controller.current?.pause() : controller.current?.start()),
      MediaPlayPause: () => (scrolling ? controller.current?.pause() : controller.current?.start()),
      ArrowUp: () => setWpm((n) => Math.min(240, n + 5)),
      ArrowDown: () => setWpm((n) => Math.max(80, n - 5)),
      PageDown: () => {
        if (scroller.current) scroller.current.scrollTop += linePx.current;
      },
      ArrowRight: () => {
        if (scroller.current) scroller.current.scrollTop += linePx.current;
      },
      PageUp: () => {
        if (scroller.current) scroller.current.scrollTop -= linePx.current;
      },
      ArrowLeft: () => {
        if (scroller.current) scroller.current.scrollTop -= linePx.current;
      },
      n: () => {
        if (scroller.current)
          scroller.current.scrollTop =
            sections.current.find((v) => v > scroller.current!.scrollTop + 1) ??
            scroller.current.scrollTop;
      },
      p: () => {
        if (scroller.current)
          scroller.current.scrollTop =
            [...sections.current].reverse().find((v) => v < scroller.current!.scrollTop - 1) ?? 0;
      },
      r: () => (recording ? stop('remote') : void begin()),
      F5: () => (recording ? stop('remote') : void begin()),
      Home: () => {
        controller.current?.restart();
        consumed.current.clear();
      },
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches('input,textarea,select,[contenteditable]')) return;
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        return;
      }
      const run = keys[e.key];
      if (run) {
        e.preventDefault();
        run();
        if (!usedRemote.current) {
          usedRemote.current = true;
          analytics.track('used_remote_key', { device: 'keyboard' });
        }
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [scrolling, recording, settingsOpen, stream]);
  useEffect(() => {
    if (!settingsOpen && !review) return;
    const dialog = document.querySelector<HTMLElement>('.record-sheet');
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>('button,select,input,a[href],video[controls]') ??
        []),
    ];
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    addEventListener('keydown', trap);
    return () => removeEventListener('keydown', trap);
  }, [settingsOpen, review?.id]);
  if (!loaded) return <section class="studio-screen">Loading camera...</section>;
  if (inApp)
    return (
      <section class="studio-screen studio-interstitial">
        <h1>
          {/Android/i.test(navigator.userAgent)
            ? 'Open in Chrome to record'
            : "Instagram's browser can't record video"}
        </h1>
        <p>Tap the three dots, then Open in browser. Your script comes with you.</p>
        {/Android/i.test(navigator.userAgent) && (
          <button
            class="studio-button"
            onClick={() => {
              location.href = `intent://${location.host}${location.pathname}?go=record#Intent;scheme=https;package=com.android.chrome;end`;
            }}
          >
            Open in Chrome
          </button>
        )}
        <button
          class="studio-button"
          onClick={() =>
            void navigator.clipboard.writeText(browserHandoffUrl(location.origin, script))
          }
        >
          Copy link with script
        </button>
      </section>
    );
  if (permission === 'priming')
    return (
      <section class="studio-screen studio-interstitial">
        <h1>Camera and mic, please</h1>
        <p>Your video is recorded and saved on this device. Nothing is uploaded.</p>
        <button class="studio-button" onClick={() => void requestCamera(quick)}>
          Allow camera and mic
        </button>
        <a class="studio-button studio-button--quiet" href={`#/scripts/${id}`}>
          Not now
        </a>
      </section>
    );
  if (permission === 'opening')
    return (
      <section class="studio-screen studio-interstitial">
        <h1>Opening camera...</h1>
      </section>
    );
  if (permission === 'error')
    return (
      <section class="studio-screen studio-interstitial">
        <h1>
          {reason === 'permission_blocked'
            ? 'Camera access is off'
            : reason === 'in_use'
              ? 'Your camera is busy'
              : 'Camera unavailable'}
        </h1>
        <p>
          {reason === 'permission_blocked'
            ? 'Tap the aA or lock icon next to the address, open website settings, allow Camera and Microphone, then reload.'
            : reason === 'in_use'
              ? 'Close other apps or tabs using the camera, then try again.'
              : reason === 'insecure_context'
                ? 'Open this page at https://www.teleprompter.wtf to use the camera.'
                : 'Check your camera and try again.'}
        </p>
        <button class="studio-button" onClick={() => void requestCamera(quick)}>
          Try again
        </button>
        <a
          class="studio-button studio-button--quiet"
          href="/?studio-present=1"
          onClick={() => sessionStorage.setItem('studio.presentScript', script?.body ?? '')}
        >
          Use the teleprompter without camera
        </a>
      </section>
    );
  return (
    <section
      class={`record-screen dock-${effectiveDock} ${recording && elapsed > 2000 ? 'controls-dim' : ''}`}
      aria-label="Record video"
    >
      <span class="record-live" aria-live="polite">
        {countdown !== null
          ? `Recording begins in ${countdown}`
          : recording
            ? paused
              ? 'Recording paused'
              : 'Recording'
            : 'Ready to record'}
      </span>
      <video
        ref={video}
        class={`record-preview ${quick.facing === 'user' ? 'mirrored' : ''}`}
        playsInline
        muted
        autoPlay
      />
      {script && (
        <aside class="record-desktop-editor">
          <h2>Script</h2>
          <label>
            Title
            <input
              value={script.title}
              disabled={recording}
              onInput={(event) =>
                editBesidePreview({ ...script, title: (event.target as HTMLInputElement).value })
              }
            />
          </label>
          <label>
            Words
            <textarea
              value={script.body}
              disabled={recording}
              onInput={(event) =>
                editBesidePreview({ ...script, body: (event.target as HTMLTextAreaElement).value })
              }
            />
          </label>
          <a href={`#/scripts/${script.id}`}>Open full editor</a>
        </aside>
      )}
      {quick.grid && <div class="record-thirds" aria-label="Thirds grid" />}
      {quick.safeZone !== 'off' && (
        <div class="record-safe-zone">
          {quick.safeZone.replace('_', ' ')} safe zone · approximate
        </div>
      )}
      {hasScript && (
        <div
          class="prompter-window"
          style={{ height: `${font * 1.35 * windowLines}px` }}
          onPointerDown={(e) => {
            dragY.current = e.clientY;
            controller.current?.pause();
          }}
          onPointerUp={(e) => {
            if (dragY.current !== null && Math.abs(e.clientY - dragY.current) < 6) {
              if (scrolling) controller.current?.pause();
              else controller.current?.start();
            }
            dragY.current = null;
          }}
          onPointerMove={(e) => {
            if (dragY.current !== null && scroller.current) {
              scroller.current.scrollTop += dragY.current - e.clientY;
              dragY.current = e.clientY;
            }
          }}
        >
          <span class="record-timer">
            {formatTime(elapsed)}
            {targetMs ? ` / ${formatTime(targetMs)}` : ''}
          </span>
          <div class="prompter-cue-band" />
          <div
            ref={scroller}
            class="prompter-scroll"
            style={{ fontSize: `${font}px`, lineHeight: 1.35 }}
          >
            <div
              class="prompter-content"
              style={{
                paddingTop: `${font * 1.35 * windowLines * 0.3}px`,
                paddingBottom: `${font * 1.35 * windowLines * 0.7}px`,
              }}
            >
              {parsed?.tokens.map((token, index) =>
                token.type === 'paragraphBreak' ? (
                  <br key={index} />
                ) : token.type === 'section' ? (
                  <h2 data-section key={index}>
                    {token.value}
                  </h2>
                ) : token.type === 'pause' ? (
                  <span data-pause key={index} class="prompter-chip">
                    Pause
                  </span>
                ) : token.type === 'cue' ? (
                  <span key={index} class="prompter-chip">
                    {token.value}
                  </span>
                ) : token.type === 'note' ? null : (
                  <span key={index}>{token.value}</span>
                ),
              )}
            </div>
          </div>
          {targetMs > 0 && (
            <div
              class={`target-progress ${elapsed > targetMs ? 'over' : ''}`}
              style={{ width: `${Math.min(100, (elapsed / targetMs) * 100)}%` }}
            />
          )}
        </div>
      )}
      {countdown !== null && (
        <div class="record-countdown" aria-live="assertive">
          {countdown}
        </div>
      )}
      <div class="record-controls">
        <div class="record-speed">
          <button onClick={() => setWpm(Math.max(80, wpm - 5))} aria-label="Slower">
            −
          </button>
          <span>{wpm} WPM</span>
          <button onClick={() => setWpm(Math.min(240, wpm + 5))} aria-label="Faster">
            +
          </button>
          <button onClick={() => setFont(Math.max(16, font - 2))} aria-label="Smaller text">
            A−
          </button>
          <button onClick={() => setFont(Math.min(96, font + 2))} aria-label="Larger text">
            A+
          </button>
          {parsed?.sections.length ? (
            <select
              aria-label="Section"
              onChange={(e) => {
                const index = Number((e.target as HTMLSelectElement).value);
                if (scroller.current) scroller.current.scrollTop = sections.current[index] ?? 0;
              }}
            >
              <option>Sections</option>
              {parsed.sections.map((section, index) => (
                <option value={index}>{section.title}</option>
              ))}
            </select>
          ) : null}
          <button
            onClick={() => setWpm(fitWpm(parsed?.spokenWordCount ?? 0, script?.targetSeconds ?? 0))}
          >
            Fit
          </button>
        </div>
        <div class="record-main-controls">
          <a href={`#/scripts/${id}`} aria-label="Close recording">
            Close
          </a>
          <button
            class="record-button"
            disabled={countdown !== null}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            onClick={() => (recording ? stop() : void begin())}
          >
            {recording ? 'Stop' : 'Record'}
          </button>
          {recording && (
            <button
              onClick={() => {
                if (paused) {
                  recorder.current?.resume();
                  controller.current?.start();
                  setPaused(false);
                } else {
                  recorder.current?.pause();
                  controller.current?.pause();
                  setPaused(true);
                }
              }}
              aria-label={paused ? 'Resume recording' : 'Pause recording'}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button onClick={flip} disabled={recording}>
            Flip camera
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Quick settings">
            Settings
          </button>
        </div>
      </div>
      {notice && (
        <p class="record-notice" role="status">
          {notice}
        </p>
      )}
      {aspectMismatch && (
        <p class="record-aspect-warning" role="status">
          Instagram will crop this video. Keep your face and important details inside the guide.
        </p>
      )}
      {memory && (
        <p class="record-memory">Private browsing: takes are lost when you close this tab.</p>
      )}
      {settingsOpen && (
        <div class="sheet-backdrop" onClick={() => setSettingsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Quick settings"
            class="record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Quick settings</h2>
            <button onClick={() => setSettingsOpen(false)}>Close</button>
            <label>
              Camera
              <select
                value={quick.deviceId ?? ''}
                disabled={recording}
                onChange={(e) => {
                  const next = {
                    ...quick,
                    deviceId: (e.target as HTMLSelectElement).value || null,
                  };
                  stream?.getTracks().forEach((t) => t.stop());
                  updateQuick(next, 'camera_device_id');
                  void requestCamera(next);
                }}
              >
                <option value="">Auto</option>
                {devices.map((d) => (
                  <option value={d.deviceId}>{d.label || 'Camera'}</option>
                ))}
              </select>
            </label>
            <button onClick={flip} disabled={recording}>
              Flip camera
            </button>
            <label>
              Resolution
              <select
                value={quick.resolution}
                disabled={recording}
                onChange={(e) => {
                  const next = {
                    ...quick,
                    resolution: (e.target as HTMLSelectElement).value as Quick['resolution'],
                  };
                  stream?.getTracks().forEach((track) => track.stop());
                  updateQuick(next, 'camera_resolution');
                  void requestCamera(next);
                }}
              >
                <option value="720p">720p</option>
                {(maxSide >= 1080 || quick.resolution === '1080p') && (
                  <option value="1080p">1080p</option>
                )}
                {(maxSide >= 2160 || quick.resolution === '2160p') && (
                  <option value="2160p">4K · uses more battery and storage</option>
                )}
              </select>
            </label>
            <label>
              Countdown
              <select
                value={quick.countdown}
                onChange={(e) =>
                  updateQuick(
                    {
                      ...quick,
                      countdown: Number(
                        (e.target as HTMLSelectElement).value,
                      ) as Quick['countdown'],
                    },
                    'recording_countdown_seconds',
                  )
                }
              >
                {[0, 3, 5, 10].map((n) => (
                  <option value={n}>{n} seconds</option>
                ))}
              </select>
            </label>
            <label>
              Safe zones
              <select
                value={quick.safeZone}
                onChange={(e) =>
                  updateQuick(
                    {
                      ...quick,
                      safeZone: (e.target as HTMLSelectElement).value as Quick['safeZone'],
                    },
                    'camera_safe_zone',
                  )
                }
              >
                <option value="off">Off</option>
                <option value="instagram">Instagram</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={quick.grid}
                onChange={(e) =>
                  updateQuick(
                    { ...quick, grid: (e.target as HTMLInputElement).checked },
                    'camera_grid',
                  )
                }
              />{' '}
              Thirds grid
            </label>
            <label>
              Prompter dock
              <select
                value={dock}
                onChange={(e) => setDock((e.target as HTMLSelectElement).value as typeof dock)}
              >
                <option value="auto">Auto</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
              </select>
            </label>
          </section>
        </div>
      )}
      {review && (
        <div class="sheet-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Review take"
            class="record-sheet review-sheet"
          >
            <h2>Take {review.number}</h2>
            {reviewUrl && (
              <video src={reviewUrl} controls autoPlay muted={mutedReview} playsInline />
            )}
            <button onClick={() => setMutedReview(!mutedReview)}>
              {mutedReview ? 'Unmute' : 'Mute'}
            </button>
            <p>
              {formatTime(review.durationMs)} · {review.container.toUpperCase()} · {review.width} ×{' '}
              {review.height} · {Math.round(review.frameRate)} fps ·{' '}
              {(review.sizeBytes / 1e6).toFixed(1)} MB
            </p>
            {review.status === 'failed' ? (
              <div class="studio-actions">
                <p>This video is only in this tab. Save it before leaving.</p>
                <button class="studio-button" onClick={() => void save()}>
                  {mobile ? 'Save video' : `Download ${review.container.toUpperCase()}`}
                </button>
                <button class="studio-button studio-button--danger" onClick={() => void discard()}>
                  Discard
                </button>
              </div>
            ) : !kept ? (
              <div class="studio-actions">
                <button class="studio-button" onClick={() => void keep()}>
                  Keep
                </button>
                <button
                  class="studio-button studio-button--quiet"
                  onClick={() => {
                    void discard().then(() => {
                      controller.current?.restart();
                      consumed.current.clear();
                    });
                  }}
                >
                  Retake
                </button>
                <button class="studio-button studio-button--danger" onClick={() => void discard()}>
                  Discard
                </button>
              </div>
            ) : (
              <>
                <p>Save it to Photos now. Browser storage can be cleared.</p>
                <div class="studio-actions">
                  <button class="studio-button" onClick={() => void save()}>
                    {mobile ? 'Save video' : `Download ${review.container.toUpperCase()}`}
                  </button>
                  <button
                    class="studio-button studio-button--quiet"
                    onClick={() =>
                      void saveTake({ ...review, starred: !review.starred }).then(() =>
                        setReview({ ...review, starred: !review.starred }),
                      )
                    }
                  >
                    {review.starred ? 'Unstar' : 'Star'}
                  </button>
                  <button
                    class="studio-button studio-button--quiet"
                    onClick={() => {
                      setReview(null);
                      location.hash = '#/takes';
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
