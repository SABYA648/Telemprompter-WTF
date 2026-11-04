import type { BrowserCapabilities } from './types';

export function detectBrowserCapabilities(): BrowserCapabilities {
  const nav = navigator as Navigator & {
    share?: (data?: ShareData) => Promise<void>;
    clipboard?: Clipboard;
    mediaDevices?: MediaDevices;
  };
  const doc = document as Document & { pictureInPictureEnabled?: boolean };
  const pipWindow = window as Window &
    typeof globalThis & {
      documentPictureInPicture?: { requestWindow: (options?: object) => Promise<Window> };
    };
  const canvas = document.createElement('canvas') as HTMLCanvasElement & {
    captureStream?: (frameRate?: number) => MediaStream;
  };

  return {
    fullscreen: typeof document.documentElement.requestFullscreen === 'function',
    webShare: typeof nav.share === 'function',
    clipboard: typeof nav.clipboard?.writeText === 'function',
    pictureInPicture: doc.pictureInPictureEnabled === true,
    displayCapture: typeof nav.mediaDevices?.getDisplayMedia === 'function',
    documentPictureInPicture: Boolean(pipWindow.documentPictureInPicture?.requestWindow),
    videoPictureInPicture: doc.pictureInPictureEnabled === true,
    canvasCapture: typeof canvas.captureStream === 'function',
    mediaRecorder: typeof MediaRecorder === 'function',
    camera: typeof nav.mediaDevices?.getUserMedia === 'function',
  };
}
