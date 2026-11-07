import { preferredMime } from './mime';
export function mediaSupport(): {
  camera: boolean;
  recorder: boolean;
  mime: string | null;
  secure: boolean;
} {
  const secure = window.isSecureContext;
  const camera = Boolean(navigator.mediaDevices?.getUserMedia);
  const recorder = typeof MediaRecorder !== 'undefined';
  return {
    camera,
    recorder,
    secure,
    mime: recorder ? preferredMime(MediaRecorder.isTypeSupported.bind(MediaRecorder)) : null,
  };
}
