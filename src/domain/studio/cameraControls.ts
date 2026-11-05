import type { AdvancedCameraValues } from './types';
export type CameraCapabilities = Partial<Record<keyof AdvancedCameraValues, unknown>> &
  MediaTrackCapabilities;
export const CAMERA_CONTROLS: (keyof AdvancedCameraValues)[] = [
  'zoom',
  'torch',
  'focusMode',
  'focusDistance',
  'exposureMode',
  'exposureCompensation',
  'exposureTime',
  'iso',
  'whiteBalanceMode',
  'colorTemperature',
  'brightness',
  'contrast',
  'saturation',
  'sharpness',
];
export function availableCameraControls(
  capabilities: CameraCapabilities,
): (keyof AdvancedCameraValues)[] {
  return CAMERA_CONTROLS.filter(
    (key) =>
      Object.hasOwn(capabilities, key) &&
      capabilities[key] !== undefined &&
      (key !== 'torch' || capabilities[key] === true),
  );
}
export function supportedValues(capability: unknown): string[] {
  return Array.isArray(capability)
    ? capability.filter((v): v is string => typeof v === 'string')
    : [];
}
export function clampControl(value: number, capability: unknown): number {
  const range = capability as { min?: number; max?: number; step?: number } | undefined;
  const min = range?.min ?? value,
    max = range?.max ?? value,
    step = range?.step ?? 0;
  const clamped = Math.min(max, Math.max(min, value));
  return step > 0 ? Math.min(max, min + Math.round((clamped - min) / step) * step) : clamped;
}
export async function applyCameraControl(
  track: MediaStreamTrack,
  key: keyof AdvancedCameraValues,
  value: string | number | boolean,
): Promise<void> {
  await track.applyConstraints({ advanced: [{ [key]: value } as MediaTrackConstraintSet] });
}
export function lockExposureAndFocus(capabilities: CameraCapabilities): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of ['focusMode', 'exposureMode'] as const) {
    const modes = supportedValues(capabilities[key]);
    if (modes.includes('manual')) result[key] = 'manual';
    else if (modes.includes('single-shot')) result[key] = 'single-shot';
  }
  return result;
}
