import { useEffect, useRef, useState, useLayoutEffect } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { ReminderCard } from './ReminderCard';
import { openCamera } from '../domain/studio/camera';
import ProCameraControls from './ProCameraControls';
import { assignKey } from '../domain/studio/keymap';
import { KEY_ACTIONS, loadSettings, saveSettings } from '../domain/studio/settings';
import type { KeyAction, StudioSettings } from '../domain/studio/types';

type Section = 'camera' | 'mic' | 'recording' | 'prompter' | 'keys' | 'reminders' | 'habit';
const sections: [Section, string][] = [
  ['camera', 'Camera'],
  ['mic', 'Microphone'],
  ['recording', 'Recording'],
  ['prompter', 'Prompter'],
  ['keys', 'Remote and keys'],
  ['reminders', 'Reminders'],
  ['habit', 'Habit'],
];
const labels: Record<string, string> = {
  deviceId: 'Device',
  facing: 'Facing',
  aspect: 'Aspect',
  resolution: 'Resolution',
  frameRate: 'Frame rate',
  mirrorPreview: 'Mirror preview',
  grid: 'Grid',
  safeZone: 'Safe zones',
  level: 'Level',
  screenLight: 'Screen light',
  processing: 'Voice processing',
  echoCancellation: 'Echo cancellation',
  noiseSuppression: 'Noise suppression',
  autoGainControl: 'Auto gain control',
  channelCount: 'Channels',
  audioBitrate: 'Audio quality',
  format: 'Format',
  quality: 'Quality',
  countdownSeconds: 'Countdown',
  autoStopAtTarget: 'Auto-stop at target',
  autoStartScroll: 'Start scroll with recording',
  stopAtSectionEnd: 'Stop at section end',
  pauseButton: 'Pause button',
  keepScreenAwake: 'Keep screen awake',
  touchLock: 'Touch lock',
  wpm: 'Speed',
  fitToTarget: 'Fit to target',
  fontSizePx: 'Font size',
  lineHeight: 'Line height',
  widthPct: 'Width',
  align: 'Alignment',
  fontFamily: 'Font',
  textColor: 'Text color',
  scrimOpacity: 'Scrim opacity',
  windowLines: 'Window lines',
  dock: 'Prompter dock',
  cuePosition: 'Cue position',
  cueStyle: 'Cue style',
  autoPauseMarkers: 'Auto-pause at pause markers',
  showCues: 'Show cue chips',
  mirrorText: 'Mirror text',
  showElapsed: 'Show elapsed',
  showRemaining: 'Show remaining',
};
const options: Record<string, [string, string][]> = {
  facing: [
    ['user', 'Front'],
    ['environment', 'Back'],
  ],
  aspect: [
    ['9:16', '9:16'],
    ['16:9', '16:9'],
  ],
  resolution: [
    ['720p', '720p'],
    ['1080p', '1080p'],
    ['2160p', '4K · uses more battery and storage'],
  ],
  frameRate: [24, 25, 30, 50, 60].map((v) => [String(v), `${v} fps`]),
  grid: [
    ['off', 'Off'],
    ['thirds', 'Thirds'],
  ],
  safeZone: [
    ['off', 'Off'],
    ['instagram', 'Instagram'],
    ['youtube_shorts', 'YouTube Shorts'],
    ['tiktok', 'TikTok'],
  ],
  screenLight: [
    ['off', 'Off'],
    ['soft', 'Soft'],
    ['bright', 'Bright'],
  ],
  processing: [
    ['standard', 'Standard'],
    ['raw', 'Raw'],
    ['custom', 'Custom'],
  ],
  channelCount: [
    ['1', 'Mono'],
    ['2', 'Stereo'],
  ],
  audioBitrate: [
    ['128000', '128 kbps'],
    ['192000', '192 kbps'],
    ['256000', '256 kbps'],
  ],
  format: [
    ['auto', 'Auto'],
    ['mp4', 'MP4'],
    ['webm', 'WebM'],
  ],
  quality: [
    ['standard', 'Standard'],
    ['high', 'High'],
    ['max', 'Max'],
  ],
  countdownSeconds: [0, 3, 5, 10].map((v) => [String(v), `${v} seconds`]),
  align: [
    ['left', 'Left'],
    ['center', 'Center'],
  ],
  fontFamily: [
    ['system', 'System'],
    ['readable', 'Readable · Atkinson Hyperlegible'],
    ['serif', 'Serif'],
  ],
  textColor: [
    ['#ffffff', 'White'],
    ['#f6f0e4', 'Cream'],
    ['#ffe066', 'Yellow'],
  ],
  dock: [
    ['auto', 'Auto'],
    ['top', 'Top'],
    ['left', 'Left'],
    ['right', 'Right'],
    ['center', 'Center'],
  ],
  cueStyle: [
    ['band', 'Band'],
    ['arrow', 'Arrow'],
    ['line', 'Line'],
    ['off', 'Off'],
  ],
  mirrorText: [
    ['off', 'Off'],
    ['horizontal', 'Horizontal'],
    ['vertical', 'Vertical'],
    ['both', 'Both'],
  ],
};
const ranges: Record<string, [number, number, number, string]> = {
  wpm: [80, 240, 5, ' WPM'],
  fontSizePx: [16, 96, 1, ' px'],
  lineHeight: [1.1, 1.8, 0.05, ''],
  widthPct: [30, 100, 1, '%'],
  scrimOpacity: [0, 0.9, 0.05, ''],
  windowLines: [2, 12, 1, ' lines'],
  cuePosition: [0.15, 0.6, 0.01, ''],
};
const fields: Record<Exclude<Section, 'keys' | 'reminders' | 'habit'>, string[]> = {
  camera: [
    'deviceId',
    'facing',
    'aspect',
    'resolution',
    'frameRate',
    'mirrorPreview',
    'grid',
    'safeZone',
    'level',
    'screenLight',
  ],
  mic: [
    'deviceId',
    'processing',
    'echoCancellation',
    'noiseSuppression',
    'autoGainControl',
    'channelCount',
    'audioBitrate',
  ],
  recording: [
    'format',
    'quality',
    'countdownSeconds',
    'autoStopAtTarget',
    'autoStartScroll',
    'stopAtSectionEnd',
    'pauseButton',
    'keepScreenAwake',
    'touchLock',
  ],
  prompter: [
    'wpm',
    'fitToTarget',
    'fontSizePx',
    'lineHeight',
    'widthPct',
    'align',
    'fontFamily',
    'textColor',
    'scrimOpacity',
    'windowLines',
    'dock',
    'cuePosition',
    'cueStyle',
    'autoPauseMarkers',
    'showCues',
    'mirrorText',
    'showElapsed',
    'showRemaining',
  ],
};
export function SettingsFields({
  section,
  settings,
  onChange,
  devices = [],
  capabilities,
  locked = false,
  audioCapabilities,
}: {
  section: Exclude<Section, 'keys' | 'reminders' | 'habit'>;
  settings: StudioSettings;
  onChange: (next: StudioSettings, key: string) => void;
  devices?: MediaDeviceInfo[];
  capabilities?: MediaTrackCapabilities | undefined;
  locked?: boolean | undefined;
  audioCapabilities?: MediaTrackCapabilities | undefined;
}) {
  const group = settings[section];
  return (
    <div class="studio-settings-fields">
      {fields[section].map((key) => {
        const value = (group as unknown as Record<string, unknown>)[key];
        if (
          section === 'mic' &&
          ['echoCancellation', 'noiseSuppression', 'autoGainControl'].includes(key) &&
          settings.mic.processing !== 'custom'
        )
          return null;
        if (
          key === 'pauseButton' &&
          (typeof MediaRecorder === 'undefined' || !MediaRecorder.prototype.pause)
        )
          return null;
        let choices = options[key];
        if (key === 'deviceId')
          choices = [
            ['', section === 'camera' ? 'Auto' : 'Default'],
            ...devices
              .filter((d) => d.kind === (section === 'camera' ? 'videoinput' : 'audioinput'))
              .map((d): [string, string] => [d.deviceId, d.label || d.kind]),
          ];
        if (key === 'resolution' && capabilities) {
          const max = Math.max(capabilities.width?.max ?? 0, capabilities.height?.max ?? 0);
          choices = choices?.filter(
            ([v]) =>
              v === '720p' ||
              (v === '1080p' && max >= 1080) ||
              (v === '2160p' && max >= 2160) ||
              v === value,
          );
        }
        if (key === 'frameRate' && capabilities?.frameRate) {
          choices = choices?.filter(
            ([v]) =>
              (Number(v) >= (capabilities.frameRate?.min ?? 0) &&
                Number(v) <= (capabilities.frameRate?.max ?? Infinity)) ||
              Number(v) === value,
          );
        }
        if (
          key === 'channelCount' &&
          section === 'mic' &&
          (!audioCapabilities?.channelCount?.max || audioCapabilities.channelCount.max < 2)
        )
          choices = choices?.filter(([v]) => v === '1');
        if (key === 'format')
          choices = choices?.filter(
            ([v]) =>
              v === 'auto' ||
              (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(`video/${v}`)),
          );
        const update = (v: unknown) =>
          onChange(
            {
              ...settings,
              [section]: {
                ...group,
                [key]: v,
                ...(section === 'prompter' && key === 'wpm' ? { fitToTarget: false } : {}),
              },
            } as StudioSettings,
            `${section}_${key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())}`,
          );
        return (
          <label key={key} class="studio-setting-field">
            <span>
              {key === 'deviceId' ? (section === 'camera' ? 'Camera' : 'Microphone') : labels[key]}
            </span>
            {typeof value === 'boolean' ? (
              <input
                type="checkbox"
                checked={value}
                disabled={locked && (section === 'camera' || section === 'mic')}
                onChange={(e) => update((e.target as HTMLInputElement).checked)}
              />
            ) : choices ? (
              <select
                aria-label={
                  key === 'deviceId'
                    ? section === 'camera'
                      ? 'Camera'
                      : 'Microphone'
                    : labels[key]
                }
                value={value as string | number}
                disabled={locked && (section === 'camera' || section === 'mic')}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  update(
                    key === 'deviceId'
                      ? v || null
                      : ['frameRate', 'channelCount', 'audioBitrate', 'countdownSeconds'].includes(
                            key,
                          )
                        ? Number(v)
                        : v,
                  );
                }}
              >
                {choices.map(([v, label]) => (
                  <option value={v}>{label}</option>
                ))}
              </select>
            ) : ranges[key] ? (
              <>
                <input
                  aria-label={
                    key === 'deviceId'
                      ? section === 'camera'
                        ? 'Camera'
                        : 'Microphone'
                      : labels[key]
                  }
                  type="range"
                  min={ranges[key]![0]}
                  max={ranges[key]![1]}
                  step={ranges[key]![2]}
                  value={value as number}
                  onInput={(e) => update(Number((e.target as HTMLInputElement).value))}
                />
                <output>
                  {String(value)}
                  {ranges[key]![3]}
                </output>
              </>
            ) : null}
          </label>
        );
      })}
      {section === 'camera' && (
        <p>Safe zones are approximate. If lights flicker, switch between 25/50 and 30/60 fps.</p>
      )}
      {section === 'mic' && (
        <p>
          {settings.mic.processing === 'raw' ? 'Raw is for external mics in a quiet room.' : ''}
        </p>
      )}
    </div>
  );
}
export default function SettingsScreen({ section }: { section?: string | undefined }) {
  const [settings, setSettings] = useState<StudioSettings | null>(null),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [capture, setCapture] = useState<KeyAction | null>(null),
    [notice, setNotice] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequest = useRef(0);
  const [capabilities, setCapabilities] = useState<MediaTrackCapabilities | undefined>(undefined);
  const [micCheckUrl, setMicCheckUrl] = useState('');
  const [audioCapabilities, setAudioCapabilities] = useState<MediaTrackCapabilities | undefined>(
    undefined,
  );
  const selected = sections.some(([id]) => id === section) ? (section as Section) : null;
  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);
  useEffect(() => {
    const update = () =>
      void navigator.mediaDevices
        ?.enumerateDevices?.()
        .then(setDevices)
        .catch(() => undefined);
    update();
    navigator.mediaDevices?.addEventListener?.('devicechange', update);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', update);
  }, []);
  // Attached in the same commit as the "Press a key" prompt, so no key can slip past it.
  useLayoutEffect(() => {
    if (!capture || !settings) return;
    const listener = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setCapture(null);
        return;
      }
      const next = { ...settings, keys: assignKey(settings.keys, capture, e.key) };
      void saveSettings(next).then(() => setSettings(next));
      setCapture(null);
    };
    addEventListener('keydown', listener, true);
    return () => removeEventListener('keydown', listener, true);
  }, [capture, settings]);
  useEffect(
    () => () => {
      stream?.getTracks().forEach((t) => t.stop());
    },
    [stream],
  );
  useEffect(
    () => () => {
      if (micCheckUrl) URL.revokeObjectURL(micCheckUrl);
    },
    [micCheckUrl],
  );
  const cameraCheck = async (selectedSettings = settings) => {
    if (!selectedSettings) return;
    const request = ++cameraRequest.current;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setCapabilities(undefined);
    try {
      const next = await openCamera({
        ...selectedSettings.camera,
        audioDeviceId: selectedSettings.mic.deviceId,
        processing: selectedSettings.mic.processing,
        echoCancellation: selectedSettings.mic.echoCancellation,
        noiseSuppression: selectedSettings.mic.noiseSuppression,
        autoGainControl: selectedSettings.mic.autoGainControl,
        channelCount: selectedSettings.mic.channelCount,
      });
      if (request !== cameraRequest.current) {
        next.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = next;
      setCapabilities(next.getVideoTracks()[0]?.getCapabilities?.());
      setStream(next);
    } catch {
      if (request === cameraRequest.current)
        setNotice('Camera unavailable. Check permission and try again.');
    }
  };
  const micCheck = async () => {
    if (!settings) return;
    let source: MediaStream | undefined;
    try {
      source = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          ...(settings.mic.deviceId ? { deviceId: { ideal: settings.mic.deviceId } } : {}),
          echoCancellation:
            settings.mic.processing === 'raw'
              ? false
              : settings.mic.processing === 'custom'
                ? settings.mic.echoCancellation
                : true,
          noiseSuppression:
            settings.mic.processing === 'raw'
              ? false
              : settings.mic.processing === 'custom'
                ? settings.mic.noiseSuppression
                : true,
          autoGainControl:
            settings.mic.processing === 'raw'
              ? false
              : settings.mic.processing === 'custom'
                ? settings.mic.autoGainControl
                : true,
        },
      });
      setAudioCapabilities(source.getAudioTracks()[0]?.getCapabilities?.());
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((v) =>
        MediaRecorder.isTypeSupported(v),
      );
      const rec = new MediaRecorder(source, mime ? { mimeType: mime } : undefined),
        chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        source?.getTracks().forEach((t) => t.stop());
        setMicCheckUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
        setNotice('Mic check ready. Play it back.');
      };
      rec.start();
      setNotice('Recording mic check for 5 seconds...');
      setTimeout(() => {
        if (rec.state !== 'inactive') rec.stop();
      }, 5000);
    } catch {
      source?.getTracks().forEach((t) => t.stop());
      setNotice('Mic check unavailable. Check microphone permission.');
    }
  };
  const change = (next: StudioSettings, key: string) => {
    if (
      streamRef.current &&
      [
        'camera_device_id',
        'camera_facing',
        'camera_aspect',
        'camera_resolution',
        'camera_frame_rate',
        'mic_device_id',
        'mic_processing',
        'mic_channel_count',
        'mic_echo_cancellation',
        'mic_noise_suppression',
        'mic_auto_gain_control',
      ].includes(key)
    ) {
      void cameraCheck(next);
    }
    if (key === 'camera_level' && next.camera.level) {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        const orientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<string>;
        };
        void orientation.requestPermission?.().then((result) => {
          if (result !== 'granted') setNotice('Level access was denied.');
        });
      }
    }
    setSettings(next);
    void saveSettings(next);
    analytics.track('changed_studio_setting', {
      setting: key as 'camera_facing',
      group: key.split('_')[0] as 'camera',
    });
  };
  if (!settings) return <section class="studio-screen">Loading settings...</section>;
  if (!selected)
    return (
      <section class="studio-screen">
        <h1>Settings</h1>
        <nav class="studio-settings-nav">
          {sections.map(([id, label]) => (
            <a class="studio-card" href={`#/settings/${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </section>
    );
  return (
    <section class="studio-screen">
      <a href="#/settings">← Settings</a>
      <h1>{sections.find(([id]) => id === selected)?.[1]}</h1>
      {selected === 'habit' ? (
        <div class="studio-settings-fields">
          <label class="studio-setting-field">
            Weekly goal
            <select
              value={settings.habit.weeklyGoal}
              onChange={(event) => {
                const weeklyGoal = Number((event.target as HTMLSelectElement).value) as 3 | 5 | 7;
                const next = { ...settings, habit: { ...settings.habit, weeklyGoal } };
                setSettings(next);
                void saveSettings(next);
                analytics.track('set_weekly_goal', { goal: weeklyGoal });
              }}
            >
              <option value="3">3 videos</option>
              <option value="5">5 videos</option>
              <option value="7">7 videos</option>
            </select>
          </label>
          <p class="studio-muted">
            A video is a script with at least one kept take, counted Monday to Sunday.
          </p>
          {(
            [
              ['streaksEnabled', 'Show streaks and freezes'],
              ['goalsEnabled', 'Show weekly goal'],
              ['dailyPromptEnabled', "Show today's prompt"],
              ['statsEnabled', 'Show recording stats'],
              ['badgesEnabled', 'Show badges and celebrations'],
              ['challengeEnabled', 'Show 30-day challenge'],
              ['recapEnabled', 'Show Monday recap'],
              ['shareCardsEnabled', 'Offer share cards'],
              ['ratingEnabled', 'Ask how recording feels'],
            ] as const
          ).map(([key, label]) => (
            <label class="studio-setting-field studio-setting-field--check" key={key}>
              <input
                type="checkbox"
                checked={settings.habit[key]}
                onChange={(event) => {
                  const next = {
                    ...settings,
                    habit: { ...settings.habit, [key]: (event.target as HTMLInputElement).checked },
                  };
                  setSettings(next);
                  void saveSettings(next);
                }}
              />{' '}
              {label}
            </label>
          ))}
        </div>
      ) : selected === 'reminders' ? (
        <ReminderCard always />
      ) : selected === 'keys' ? (
        <div class="studio-settings-fields">
          {KEY_ACTIONS.map((action) => (
            <div class="studio-setting-field">
              <span>
                {action.replace(/[A-Z]/g, (c) => ' ' + c.toLowerCase())}:{' '}
                {settings.keys[action].map((k) => (k === ' ' ? 'Space' : k)).join(', ')}
              </span>
              <button onClick={() => setCapture(action)}>Assign key</button>
            </div>
          ))}
          {capture && <p role="status">Press a key for {capture}. Escape cancels.</p>}
        </div>
      ) : (
        <SettingsFields
          section={selected}
          settings={settings}
          onChange={change}
          devices={devices}
          capabilities={selected === 'camera' ? capabilities : undefined}
          audioCapabilities={audioCapabilities ?? stream?.getAudioTracks()[0]?.getCapabilities?.()}
        />
      )}
      {selected === 'prompter' && (
        <div class="studio-actions">
          {(
            [
              ['Laptop', 28],
              ['Desk monitor', 40],
              ['Across the room', 72],
            ] as const
          ).map(([label, size]) => (
            <button
              onClick={() =>
                change(
                  { ...settings, prompter: { ...settings.prompter, fontSizePx: size } },
                  'prompter_font_size_px',
                )
              }
            >
              {label} · {size} px
            </button>
          ))}
        </div>
      )}
      {selected === 'camera' && (
        <>
          <button onClick={() => void cameraCheck()}>Open camera controls</button>
          <ProCameraControls
            stream={stream}
            settings={settings}
            onChange={change}
            onNotice={setNotice}
          />
        </>
      )}
      {selected === 'mic' && (
        <button onClick={() => void micCheck()}>Mic check · record 5 seconds</button>
      )}
      {micCheckUrl && <audio controls src={micCheckUrl} aria-label="Mic check playback" />}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
export { sections };
