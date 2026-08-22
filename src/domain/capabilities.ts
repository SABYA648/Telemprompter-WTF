import { hasBrowserSpeechRecognition } from './browserSpeech';
import type { BrowserCapabilities } from './types';

export function detectBrowserCapabilities(): BrowserCapabilities {
  const nav = navigator as Navigator & {
    share?: (data?: ShareData) => Promise<void>;
    clipboard?: Clipboard;
    mediaDevices?: MediaDevices;
    gpu?: GPU;
    deviceMemory?: number;
  };
  const doc = document as Document & { pictureInPictureEnabled?: boolean };
  const pipWindow = window as Window &
    typeof globalThis & {
      documentPictureInPicture?: { requestWindow: (options?: object) => Promise<Window> };
    };
  const canvas = document.createElement('canvas') as HTMLCanvasElement & {
    captureStream?: (frameRate?: number) => MediaStream;
  };
  const audioContext = window.AudioContext;

  return {
    fullscreen: typeof document.documentElement.requestFullscreen === 'function',
    webShare: typeof nav.share === 'function',
    clipboard: typeof nav.clipboard?.writeText === 'function',
    pictureInPicture: doc.pictureInPictureEnabled === true,
    displayCapture: typeof nav.mediaDevices?.getDisplayMedia === 'function',
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    audioWorklet: Boolean(audioContext?.prototype && 'audioWorklet' in audioContext.prototype),
    microphone: typeof nav.mediaDevices?.getUserMedia === 'function',
    speechRecognition: hasBrowserSpeechRecognition(),
    worker: typeof Worker === 'function',
    webAssembly: typeof WebAssembly === 'object',
    webGpu: Boolean(nav.gpu),
    documentPictureInPicture: Boolean(pipWindow.documentPictureInPicture?.requestWindow),
    videoPictureInPicture: doc.pictureInPictureEnabled === true,
    canvasCapture: typeof canvas.captureStream === 'function',
    mediaRecorder: typeof MediaRecorder === 'function',
    camera: typeof nav.mediaDevices?.getUserMedia === 'function',
    cacheStorage: 'caches' in window,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    hardwareConcurrency: Math.max(1, nav.hardwareConcurrency || 1),
  };
}

export type PrecisionCapability = 'recommended' | 'supported' | 'slow' | 'unavailable';

export function precisionCapability(capabilities: BrowserCapabilities): PrecisionCapability {
  if (!capabilities.worker || !capabilities.webAssembly || !capabilities.microphone) {
    return 'unavailable';
  }
  if (
    capabilities.webGpu &&
    capabilities.hardwareConcurrency >= 6 &&
    (capabilities.deviceMemory === null || capabilities.deviceMemory >= 4)
  ) {
    return 'recommended';
  }
  if (
    capabilities.hardwareConcurrency < 4 ||
    (capabilities.deviceMemory !== null && capabilities.deviceMemory < 4)
  ) {
    return 'slow';
  }
  return 'supported';
}
