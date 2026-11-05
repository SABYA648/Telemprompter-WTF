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
import { videoBitrate } from '../domain/studio/mime';
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
import { defaultSettings, loadSettings, saveSettings } from '../domain/studio/settings';
import { handleMappedKey } from '../domain/studio/keymap';
import { AudioMeter } from '../domain/studio/audioMeter';
import {
  ReadinessTracker,
  storageReadiness,
  batteryReadiness,
  orientationReadiness,
} from '../domain/studio/readiness';
import ProCameraControls from './ProCameraControls';
import { SAFE_ZONES, PLATFORM_FACTS_VERIFIED_ON } from '../content/studio/platformFacts';
import { SettingsFields } from './SettingsScreen';
import type { StudioSettings, KeyAction } from '../domain/studio/types';

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
  const [settings, setSettings] = useState<StudioSettings>(
    defaultSettings(deviceClass() !== 'desktop'),
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<'priming' | 'opening' | 'ready' | 'error'>(
    'priming',
  );
  const [reason, setReason] = useState<CameraReason>('unknown');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [level, setLevel] = useState({ rms: 0, peak: 0, hold: 0 });
  const readiness = useRef(new ReadinessTracker());
  const micCheckRecorder = useRef<MediaRecorder | null>(null);
  const [micCheckUrl, setMicCheckUrl] = useState('');
  useEffect(
    () => () => {
      if (micCheckUrl) URL.revokeObjectURL(micCheckUrl);
      if (micCheckRecorder.current?.state !== 'inactive') micCheckRecorder.current?.stop();
    },
    [micCheckUrl],
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const sectionEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [touchLocked, setTouchLocked] = useState(false);
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
  const keepAwakeRef = useRef(settings.recording.keepScreenAwake);
  keepAwakeRef.current = settings.recording.keepScreenAwake;
  const dragY = useRef<number | null>(null);
  const mobile = deviceClass() !== 'desktop';
  const windowLines = settings.prompter.windowLines;
  const inApp = isInAppBrowser(navigator.userAgent);
  const effectiveDock =
    settings.prompter.dock === 'auto' && mobile && matchMedia('(orientation: landscape)').matches
      ? angle === 90
        ? 'left'
        : 'right'
      : settings.prompter.dock;
  const parsed = script ? parseMarkup(script.body) : null;
  const hasScript = Boolean(parsed?.spokenWordCount);
  const targetMs = (script?.targetSeconds ?? 0) * 1000;
  const capabilities = stream?.getVideoTracks()[0]?.getCapabilities?.();
  const updateSettings = (next: StudioSettings, key: string) => {
    setSettings(next);
    void saveSettings(next);
    setting(key);
    if (
      [
        'camera_device_id',
        'camera_facing',
        'camera_aspect',
        'camera_resolution',
        'camera_frame_rate',
        'mic_device_id',
        'mic_processing',
        'mic_echo_cancellation',
        'mic_noise_suppression',
        'mic_auto_gain_control',
        'mic_channel_count',
      ].includes(key) &&
      !recorder.current
    ) {
      setSettingsOpen(false);
      stream?.getTracks().forEach((t) => t.stop());
      void requestCamera(next);
    }
  };
  const setSpeed = (value: number) => {
    const next = Math.max(80, Math.min(240, value));
    setWpm(next);
    updateSettings(
      { ...settings, prompter: { ...settings.prompter, wpm: next, fitToTarget: false } },
      'prompter_wpm',
    );
  };
  const setFontSize = (value: number) => {
    const next = Math.max(16, Math.min(96, value));
    setFont(next);
    updateSettings(
      { ...settings, prompter: { ...settings.prompter, fontSizePx: next } },
      'prompter_font_size_px',
    );
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
        loadSettings(),
      ]);
      if (!active) return;
      setScript(item ?? null);
      setSettings(saved);
      setWpm(
        item?.targetSeconds && saved.prompter.fitToTarget
          ? fitWpm(parseMarkup(item.body).spokenWordCount, item.targetSeconds)
          : saved.prompter.wpm,
      );
      setFont(saved.prompter.fontSizePx);
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
      if (await db.get('kv', 'camera.primed')) void requestCamera(settings);
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
      void navigator.mediaDevices.enumerateDevices().then(setDevices);
    };
    onDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', onDevices);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', onDevices);
  }, [stream]);
  useEffect(() => {
    if (permission !== 'ready') return;
    const visible = () => {
      if (document.visibilityState === 'visible') {
        if (keepAwakeRef.current)
          void wake().then((lock) => {
            wakeLock.current = lock;
          });
      } else if (mobile) recorder.current?.stop('interruption');
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
    if (permission !== 'ready') return;
    if (settings.recording.keepScreenAwake) {
      void wake().then((lock) => {
        wakeLock.current = lock;
      });
    } else {
      void wakeLock.current?.release();
      wakeLock.current = undefined;
    }
  }, [permission, settings.recording.keepScreenAwake]);
  useEffect(() => {
    if (!hasScript || !scroller.current || permission !== 'ready') return;
    const el = scroller.current;
    const measure = () => {
      const content = el.querySelector<HTMLElement>('.prompter-content');
      if (!content) return;
      cueOffset.current = el.clientHeight * settings.prompter.cuePosition;
      linePx.current = fontRef.current * settings.prompter.lineHeight;
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
        if (marker !== null && settings.prompter.autoPauseMarkers) {
          consumed.current.add(marker);
          controller.current?.pause();
          setNotice('Paused at marker. Tap to continue.');
        }
        if (
          recorder.current &&
          settings.recording.stopAtSectionEnd &&
          selectedSection !== null &&
          !sectionEndTimer.current
        ) {
          const end =
            sections.current[selectedSection + 1] ?? el.scrollHeight - el.clientHeight * 0.7;
          if (snapshot.scrollTop + cueOffset.current >= end)
            sectionEndTimer.current = setTimeout(() => recorder.current?.stop('section_end'), 800);
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
      if (sectionEndTimer.current) {
        clearTimeout(sectionEndTimer.current);
        sectionEndTimer.current = null;
      }
      observer.disconnect();
      controller.current?.destroy();
      controller.current = null;
    };
  }, [
    permission,
    script?.body,
    settings.prompter.cuePosition,
    settings.prompter.lineHeight,
    settings.prompter.autoPauseMarkers,
    settings.recording.stopAtSectionEnd,
    selectedSection,
  ]);
  useEffect(() => {
    const content = scroller.current?.querySelector<HTMLElement>('.prompter-content');
    if (content)
      controller.current?.setSpeed(
        pixelsPerSecond(wpm, pixelsPerWord(content.scrollHeight, parsed?.spokenWordCount ?? 1)),
      );
  }, [wpm, parsed?.spokenWordCount]);
  useEffect(() => {
    setWpm(
      script?.targetSeconds && settings.prompter.fitToTarget
        ? fitWpm(parsed?.spokenWordCount ?? 0, script.targetSeconds)
        : settings.prompter.wpm,
    );
  }, [
    settings.prompter.wpm,
    settings.prompter.fitToTarget,
    script?.targetSeconds,
    parsed?.spokenWordCount,
  ]);
  useEffect(() => setFont(settings.prompter.fontSizePx), [settings.prompter.fontSizePx]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const ms = recorder.current?.elapsed() ?? 0;
      setElapsed(ms);
    }, 250);
    return () => clearInterval(timer);
  }, [recording, targetMs]);
  useEffect(
    () => () => {
      if (sectionEndTimer.current) clearTimeout(sectionEndTimer.current);
    },
    [],
  );
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
  const requestCamera = async (options: StudioSettings) => {
    setPermission('opening');
    const started = performance.now();
    try {
      const config: CameraOptions = {
        ...options.camera,
        audioDeviceId: options.mic.deviceId,
        processing: options.mic.processing,
        echoCancellation: options.mic.echoCancellation,
        noiseSuppression: options.mic.noiseSuppression,
        autoGainControl: options.mic.autoGainControl,
        channelCount: options.mic.channelCount,
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
      readiness.current = new ReadinessTracker();
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
    if (!recording)
      updateSettings(
        {
          ...settings,
          camera: {
            ...settings.camera,
            facing: settings.camera.facing === 'user' ? 'environment' : 'user',
            deviceId: null,
          },
        },
        'camera_facing',
      );
  };
  const micCheck = async () => {
    const audio = stream?.getAudioTracks()[0];
    if (!audio) {
      setNotice('No microphone is available.');
      return;
    }
    const source = new MediaStream([audio.clone()]);
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((v) =>
      MediaRecorder.isTypeSupported(v),
    );
    try {
      const rec = new MediaRecorder(source, mime ? { mimeType: mime } : undefined);
      micCheckRecorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        source.getTracks().forEach((t) => t.stop());
        if (micCheckUrl) URL.revokeObjectURL(micCheckUrl);
        setMicCheckUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
        setNotice('Mic check ready. Play it back.');
      };
      rec.start();
      setNotice('Recording mic check for 5 seconds...');
      setTimeout(() => {
        if (rec.state !== 'inactive') rec.stop();
      }, 5000);
    } catch {
      source.getTracks().forEach((t) => t.stop());
      setNotice('Mic check is unavailable.');
    }
  };
  useEffect(() => {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    let meter: AudioMeter;
    try {
      meter = new AudioMeter(new MediaStream([track]));
    } catch {
      return;
    }
    let hold = 0,
      holdUntil = 0;
    const timer = setInterval(() => {
      const { rms, peak } = meter.read(),
        now = performance.now();
      if (peak >= hold || now > holdUntil) {
        hold = peak;
        holdUntil = now + 1500;
      }
      setLevel({ rms, peak, hold });
      const found = readiness.current.audio(rms, peak, now, recording, scrolling);
      setChips((prev) =>
        [
          ...new Set([
            ...prev.filter(
              (m) =>
                !['Room sounds noisy', 'Too loud: move the mic back', 'Mic is very quiet'].includes(
                  m,
                ),
            ),
            ...found.map((c) => c.message),
          ]),
        ].slice(-4),
      );
    }, 250);
    return () => {
      clearInterval(timer);
      meter.close();
    };
  }, [stream, recording, scrolling]);
  useEffect(() => {
    if (!stream || recording) return;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 18;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const sample = () => {
      if (!video.current?.videoWidth || !ctx) return;
      ctx.drawImage(video.current, 0, 0, 32, 18);
      const found = readiness.current.frame(ctx.getImageData(0, 0, 32, 18).data, 32, 18);
      setChips((prev) =>
        [
          ...new Set([
            ...prev.filter(
              (m) => !['Add light in front of you', 'Bright light behind you'].includes(m),
            ),
            ...found.map((c) => c.message),
          ]),
        ].slice(-4),
      );
    };
    const timer = setInterval(sample, 1000);
    return () => clearInterval(timer);
  }, [stream, recording]);
  useEffect(() => {
    if (!stream) return;
    let active = true;
    const checks = async () => {
      const found = orientationReadiness(settings.camera.aspect, innerWidth > innerHeight);
      try {
        const estimate = await navigator.storage?.estimate?.();
        if (estimate?.quota && estimate.usage !== undefined)
          found.push(
            ...storageReadiness(
              estimate.quota - estimate.usage,
              videoBitrate(
                settings.camera.resolution,
                settings.camera.frameRate,
                settings.recording.quality,
              ) + settings.mic.audioBitrate,
            ),
          );
      } catch {
        /* unavailable */
      }
      try {
        const battery = await (
          navigator as Navigator & {
            getBattery?: () => Promise<{ level: number; charging: boolean }>;
          }
        ).getBattery?.();
        if (battery) found.push(...batteryReadiness(battery.level, battery.charging));
      } catch {
        /* unavailable */
      }
      if (active)
        setChips((prev) =>
          [
            ...new Set([
              ...prev.filter(
                (m) =>
                  !m.startsWith('Rotate to') &&
                  !m.startsWith('Battery low') &&
                  !m.startsWith('Not enough space') &&
                  !m.startsWith('Less than 10 minutes'),
              ),
              ...found.map((c) => c.message),
            ]),
          ].slice(-4),
        );
    };
    void checks();
    addEventListener('resize', checks);
    return () => {
      active = false;
      removeEventListener('resize', checks);
    };
  }, [stream, settings.camera.aspect, settings.mic.audioBitrate]);
  const begin = async () => {
    if (!stream || recording || starting.current || recorder.current) return;
    try {
      const estimate = await navigator.storage?.estimate?.();
      if (estimate?.quota && estimate.usage !== undefined) {
        const warnings = storageReadiness(
          estimate.quota - estimate.usage,
          videoBitrate(
            settings.camera.resolution,
            settings.camera.frameRate,
            settings.recording.quality,
          ) + settings.mic.audioBitrate,
        );
        if (warnings.some((w) => w.blocks)) {
          setChips(warnings.map((w) => w.message));
          setNotice(warnings[0]?.message ?? 'Not enough space for a new take.');
          return;
        }
      }
    } catch {
      /* estimate unavailable */
    }

    if (chips.some((c) => c.startsWith('Not enough space'))) {
      setNotice(
        'Not enough space for a new take. Save and delete old takes, or lower the quality.',
      );
      return;
    }
    starting.current = true;
    setNotice('');
    setChips([]);
    timeline.current = [];
    if (settings.recording.countdownSeconds) {
      for (let n = settings.recording.countdownSeconds; n > 0; n--) {
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
        facing: settings.camera.facing === 'user' ? 'front' : 'back',
        resolution: settings.camera.resolution,
        frameRate: videoSettings?.frameRate ?? 30,
        quality: settings.recording.quality,
        format: settings.recording.format,
        audioBitrate: settings.mic.audioBitrate,
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
        aspect: settings.camera.aspect === '16:9' ? '16_9' : '9_16',
        resolution: settings.camera.resolution,
        fps: [24, 25, 30, 50, 60].includes(Math.round(videoSettings?.frameRate ?? 30))
          ? (Math.round(videoSettings?.frameRate ?? 30) as 24 | 25 | 30 | 50 | 60)
          : 'other',
        facing: settings.camera.facing === 'user' ? 'front' : 'back',
        mode: hasScript ? 'full' : 'free',
        countdown: settings.recording.countdownSeconds,
        has_target: Boolean(targetMs),
      });
      if (hasScript && settings.recording.autoStartScroll) {
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
  useEffect(() => {
    if (!recording || !targetMs || !settings.recording.autoStopAtTarget) return;
    const timer = setInterval(() => {
      if ((recorder.current?.elapsed() ?? 0) >= targetMs + 3000) stop('target');
    }, 250);
    return () => clearInterval(timer);
  }, [recording, targetMs, settings.recording.autoStopAtTarget]);
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
    const run = (action: KeyAction) => {
      switch (action) {
        case 'toggleScroll':
          if (scrolling) controller.current?.pause();
          else controller.current?.start();
          break;
        case 'faster':
          setSpeed(wpmRef.current + 5);
          break;
        case 'slower':
          setSpeed(wpmRef.current - 5);
          break;
        case 'lineForward':
          if (scroller.current) scroller.current.scrollTop += linePx.current;
          break;
        case 'lineBack':
          if (scroller.current) scroller.current.scrollTop -= linePx.current;
          break;
        case 'sectionForward':
          if (scroller.current)
            scroller.current.scrollTop =
              sections.current.find((v) => v > scroller.current!.scrollTop + 1) ??
              scroller.current.scrollTop;
          break;
        case 'sectionBack':
          if (scroller.current)
            scroller.current.scrollTop =
              [...sections.current].reverse().find((v) => v < scroller.current!.scrollTop - 1) ?? 0;
          break;
        case 'toggleRecord':
          if (recording) stop('remote');
          else void begin();
          break;
        case 'restart':
          controller.current?.restart();
          consumed.current.clear();
          break;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        else if (review) setReview(null);
        return;
      }
      if (settingsOpen || review) return;
      if (handleMappedKey(e, settings.keys, run) && !usedRemote.current) {
        usedRemote.current = true;
        analytics.track('used_remote_key', { device: 'keyboard' });
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [settings, scrolling, recording, settingsOpen, review, stream]);
  useEffect(() => {
    if (!settingsOpen && !review) return;
    const dialog = document.querySelector<HTMLElement>('.record-sheet');
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>(
        'button,select,input,a[href],video[controls],audio[controls]',
      ) ?? []),
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
        <button class="studio-button" onClick={() => void requestCamera(settings)}>
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
        <button class="studio-button" onClick={() => void requestCamera(settings)}>
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
      class={`record-screen dock-${effectiveDock} ${script ? 'has-editor' : ''} ${recording && elapsed > 2000 ? 'controls-dim' : ''}`}
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
        class={`record-preview ${settings.camera.facing === 'user' ? 'mirrored' : ''}`}
        playsInline
        muted
        autoPlay
        onPointerUp={(event) => {
          const track = stream?.getVideoTracks()[0];
          const cap = track?.getCapabilities?.() as MediaTrackCapabilities & {
            pointsOfInterest?: unknown;
          };
          if (!track || !cap?.pointsOfInterest) return;
          const box = event.currentTarget.getBoundingClientRect();
          void track
            .applyConstraints({
              advanced: [
                {
                  pointsOfInterest: [
                    {
                      x: (event.clientX - box.left) / box.width,
                      y: (event.clientY - box.top) / box.height,
                    },
                  ],
                } as MediaTrackConstraintSet,
              ],
            })
            .catch(() => setNotice('Your camera ignored that setting.'));
        }}
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
      {settings.camera.grid === 'thirds' && <div class="record-thirds" aria-label="Thirds grid" />}
      {settings.camera.safeZone !== 'off' && (
        <div
          class="record-safe-zone"
          style={{
            top: `${SAFE_ZONES[settings.camera.safeZone].top}%`,
            bottom: `${SAFE_ZONES[settings.camera.safeZone].bottom}%`,
            left: `${SAFE_ZONES[settings.camera.safeZone].left}%`,
            right: `${SAFE_ZONES[settings.camera.safeZone].right}%`,
          }}
        >
          {settings.camera.safeZone.replace('_', ' ')} safe zone · approximate, apps change their UI
          · verified {PLATFORM_FACTS_VERIFIED_ON}
        </div>
      )}
      {hasScript && (
        <div
          class="prompter-window"
          style={{
            '--prompter-width': `${settings.prompter.widthPct}%`,
            background: `rgba(0,0,0,${settings.prompter.scrimOpacity})`,
            color: settings.prompter.textColor,
            height: `${font * settings.prompter.lineHeight * windowLines}px`,
          }}
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
          {(settings.prompter.showElapsed || settings.prompter.showRemaining) && (
            <span class="record-timer">
              {settings.prompter.showElapsed ? formatTime(elapsed) : ''}
              {targetMs && settings.prompter.showRemaining
                ? ` / ${formatTime(Math.max(0, targetMs - elapsed))}`
                : ''}
            </span>
          )}
          {settings.prompter.cueStyle !== 'off' && (
            <div
              class={`prompter-cue-band cue-${settings.prompter.cueStyle}`}
              style={{ top: `${settings.prompter.cuePosition * 100}%` }}
            />
          )}
          <div
            ref={scroller}
            class={`prompter-scroll mirror-${settings.prompter.mirrorText}`}
            style={{
              textAlign: settings.prompter.align,
              fontFamily:
                settings.prompter.fontFamily === 'readable'
                  ? 'Atkinson Hyperlegible'
                  : settings.prompter.fontFamily === 'serif'
                    ? 'Georgia, serif'
                    : 'system-ui',
              fontSize: `${font}px`,
              lineHeight: settings.prompter.lineHeight,
            }}
          >
            <div
              class="prompter-content"
              style={{
                paddingTop: `${font * settings.prompter.lineHeight * windowLines * settings.prompter.cuePosition}px`,
                paddingBottom: `${font * settings.prompter.lineHeight * windowLines * (1 - settings.prompter.cuePosition)}px`,
              }}
            >
              {parsed?.tokens.map((token, index) =>
                token.type === 'paragraphBreak' ? (
                  <br key={index} />
                ) : token.type === 'section' ? (
                  <h2 data-section key={index}>
                    {token.value}
                  </h2>
                ) : token.type === 'pause' && settings.prompter.showCues ? (
                  <span data-pause key={index} class="prompter-chip">
                    Pause
                  </span>
                ) : token.type === 'cue' && settings.prompter.showCues ? (
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
      {settings.camera.screenLight !== 'off' && settings.camera.facing === 'user' && (
        <div
          class={`record-screen-light light-${settings.camera.screenLight}`}
          aria-label="Screen light"
        />
      )}
      {settings.camera.level && <LevelOverlay />}
      <div
        class="record-level-meter"
        role="meter"
        aria-label="Microphone level"
        aria-valuemin={-60}
        aria-valuemax={0}
        aria-valuenow={Math.max(-60, Math.round(20 * Math.log10(level.rms || 0.000001)))}
      >
        <span
          style={{
            width: `${Math.min(100, Math.max(0, ((20 * Math.log10(level.rms || 0.000001) + 60) / 60) * 100))}%`,
          }}
        />
        <i
          style={{
            left: `${Math.min(100, Math.max(0, ((20 * Math.log10(level.hold || 0.000001) + 60) / 60) * 100))}%`,
          }}
        />
      </div>
      {level.peak >= Math.pow(10, -1 / 20) && <span class="record-clip">CLIP</span>}
      {!!chips.length && (
        <div class="readiness-chips" aria-live="polite">
          {chips.map((message) => (
            <span>{message}</span>
          ))}
        </div>
      )}
      {countdown !== null && (
        <div class="record-countdown" aria-live="assertive">
          {countdown}
        </div>
      )}
      <div class="record-controls">
        <div class="record-speed">
          <button onClick={() => setSpeed(wpm - 5)} aria-label="Slower">
            −
          </button>
          <span>{wpm} WPM</span>
          <button onClick={() => setSpeed(wpm + 5)} aria-label="Faster">
            +
          </button>
          <button onClick={() => setFontSize(font - 2)} aria-label="Smaller text">
            A−
          </button>
          <button onClick={() => setFontSize(font + 2)} aria-label="Larger text">
            A+
          </button>
          {parsed?.sections.length ? (
            <select
              aria-label="Section"
              onChange={(e) => {
                const index = Number((e.target as HTMLSelectElement).value);
                setSelectedSection(Number.isFinite(index) ? index : null);
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
            onClick={() => {
              const value = fitWpm(parsed?.spokenWordCount ?? 0, script?.targetSeconds ?? 0);
              setWpm(value);
              updateSettings(
                { ...settings, prompter: { ...settings.prompter, fitToTarget: true } },
                'prompter_fit_to_target',
              );
            }}
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
          {recording &&
            settings.recording.pauseButton &&
            typeof MediaRecorder.prototype.pause === 'function' && (
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
          {settings.recording.touchLock && recording && (
            <button onClick={() => setTouchLocked(true)}>Lock touch</button>
          )}
          <button onClick={() => setSettingsOpen(true)} aria-label="Quick settings">
            Settings
          </button>
        </div>
      </div>
      {touchLocked && (
        <div class="record-touch-lock">
          <p>Touch locked</p>
          <button onClick={() => setTouchLocked(false)}>Unlock touch</button>
        </div>
      )}
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
            {(['camera', 'mic', 'recording', 'prompter'] as const).map((section) => (
              <details open>
                <summary>
                  {section === 'mic'
                    ? 'Microphone'
                    : section.charAt(0).toUpperCase() + section.slice(1)}
                </summary>
                <SettingsFields
                  section={section}
                  settings={settings}
                  devices={devices}
                  {...(capabilities ? { capabilities } : {})}
                  onChange={updateSettings}
                  locked={recording}
                  audioCapabilities={stream?.getAudioTracks()[0]?.getCapabilities?.()}
                />
              </details>
            ))}
            {devices.find(
              (d) =>
                d.deviceId === settings.mic.deviceId &&
                /bluetooth|airpods|buds|headset|hands-free/i.test(d.label),
            ) && <p>Bluetooth mics lower quality and add delay. A wired or USB mic is better.</p>}
            <button onClick={() => void micCheck()}>Mic check · record 5 seconds</button>
            {micCheckUrl && <audio controls src={micCheckUrl} aria-label="Mic check playback" />}
            {settings.camera.level && (
              <button
                onClick={() => {
                  if (typeof DeviceOrientationEvent === 'undefined') return;
                  const orientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
                    requestPermission?: () => Promise<string>;
                  };
                  void orientation
                    .requestPermission?.()
                    .then((result) =>
                      setNotice(result === 'granted' ? 'Level ready' : 'Level access was denied.'),
                    );
                }}
              >
                Enable level sensor
              </button>
            )}
            <ProCameraControls
              stream={stream}
              settings={settings}
              onChange={updateSettings}
              onNotice={setNotice}
            />
            <a href="#/settings">All settings</a>
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

function LevelOverlay() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const update = (e: DeviceOrientationEvent) => setAngle(e.gamma ?? 0);
    addEventListener('deviceorientation', update);
    return () => removeEventListener('deviceorientation', update);
  }, []);
  return (
    <div class="record-level-overlay" aria-label={`Level ${Math.round(angle)} degrees`}>
      <span style={{ transform: `rotate(${-angle}deg)` }}>● ───────── ●</span>
    </div>
  );
}
