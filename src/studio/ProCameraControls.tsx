import type { StudioSettings, AdvancedCameraValues } from '../domain/studio/types';
import {
  availableCameraControls,
  clampControl,
  lockExposureAndFocus,
  supportedValues,
  type CameraCapabilities,
} from '../domain/studio/cameraControls';
export default function ProCameraControls({
  stream,
  settings,
  onChange,
  onNotice,
}: {
  stream: MediaStream | null;
  settings: StudioSettings;
  onChange: (next: StudioSettings, key: string) => void;
  onNotice: (text: string) => void;
}) {
  const track = stream?.getVideoTracks()[0],
    capabilities = track?.getCapabilities?.() as CameraCapabilities | undefined;
  if (!track || !capabilities) return null;
  const device = track.getSettings().deviceId ?? settings.camera.deviceId ?? 'default';
  const values = settings.camera.advanced[device] ?? {};
  const applyMany = async (changes: Partial<AdvancedCameraValues>) => {
    try {
      await track.applyConstraints({ advanced: [changes as MediaTrackConstraintSet] });
      onChange(
        {
          ...settings,
          camera: {
            ...settings.camera,
            advanced: { ...settings.camera.advanced, [device]: { ...values, ...changes } },
          },
        },
        'camera_advanced',
      );
    } catch {
      onNotice('Your camera ignored that setting.');
    }
  };
  const apply = (key: keyof AdvancedCameraValues, value: string | number | boolean) =>
    applyMany({ [key]: value });
  const controls = availableCameraControls(capabilities);
  if (!controls.length) return null;
  return (
    <details>
      <summary>Pro camera controls</summary>
      <div class="studio-settings-fields">
        {controls.map((key) => {
          const cap = capabilities[key],
            modes = supportedValues(cap),
            range = cap as { min?: number; max?: number; step?: number };
          return (
            <label class="studio-setting-field">
              <span>{key.replace(/[A-Z]/g, (c) => ' ' + c.toLowerCase())}</span>
              {key === 'torch' ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[key])}
                  onChange={(e) => void apply(key, (e.target as HTMLInputElement).checked)}
                />
              ) : modes.length ? (
                <select
                  value={String(values[key] ?? '')}
                  onChange={(e) => void apply(key, (e.target as HTMLSelectElement).value)}
                >
                  <option value="">Device default</option>
                  {modes.map((mode) => (
                    <option value={mode}>{mode}</option>
                  ))}
                </select>
              ) : typeof range?.min === 'number' && typeof range.max === 'number' ? (
                <input
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step || 0.01}
                  value={Number(
                    values[key] ??
                      track.getSettings()[key as keyof MediaTrackSettings] ??
                      range.min,
                  )}
                  onInput={(e) =>
                    void apply(key, clampControl(Number((e.target as HTMLInputElement).value), cap))
                  }
                />
              ) : null}
            </label>
          );
        })}
        {Object.keys(lockExposureAndFocus(capabilities)).length > 0 && (
          <button
            onClick={() => {
              const modes = lockExposureAndFocus(capabilities);
              const current = track.getSettings() as MediaTrackSettings &
                Partial<AdvancedCameraValues>;
              const locked: Partial<AdvancedCameraValues> = { ...modes };
              for (const key of ['focusDistance', 'exposureTime', 'iso'] as const)
                if (capabilities[key] !== undefined && typeof current[key] === 'number')
                  locked[key] = current[key];
              void applyMany(locked);
            }}
          >
            Lock exposure and focus
          </button>
        )}
      </div>
    </details>
  );
}
