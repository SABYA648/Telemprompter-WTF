import { describe, expect, it, vi } from 'vitest';
import {
  availableCameraControls,
  applyCameraControl,
  clampControl,
  lockExposureAndFocus,
} from './cameraControls';
const fixtures = {
  android: {
    zoom: { min: 1, max: 10, step: 0.5 },
    torch: true,
    focusMode: ['continuous', 'manual'],
    exposureMode: ['continuous', 'single-shot'],
  },
  ios: {},
  uvc: {
    zoom: { min: 1, max: 3, step: 0.2 },
    brightness: { min: 0, max: 255, step: 1 },
    contrast: { min: 0, max: 255, step: 1 },
    saturation: { min: 0, max: 255, step: 1 },
  },
};
describe('capability-driven camera controls', () => {
  it('shows Android-like controls only', () => {
    expect(availableCameraControls(fixtures.android)).toEqual([
      'zoom',
      'torch',
      'focusMode',
      'exposureMode',
    ]);
    expect(lockExposureAndFocus(fixtures.android)).toEqual({
      focusMode: 'manual',
      exposureMode: 'single-shot',
    });
  });
  it('shows no pro controls on an iOS-like track', () => {
    expect(availableCameraControls(fixtures.ios)).toEqual([]);
  });
  it('shows UVC webcam color controls', () => {
    expect(availableCameraControls(fixtures.uvc)).toEqual([
      'zoom',
      'brightness',
      'contrast',
      'saturation',
    ]);
    expect(clampControl(7, fixtures.uvc.zoom)).toBe(3);
  });
  it('applies advanced constraints', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    await applyCameraControl({ applyConstraints } as unknown as MediaStreamTrack, 'zoom', 2);
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ zoom: 2 }] });
  });
});
