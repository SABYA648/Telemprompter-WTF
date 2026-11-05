export type CameraReason =
  | 'permission_blocked'
  | 'not_found'
  | 'in_use'
  | 'overconstrained'
  | 'insecure_context'
  | 'in_app_browser'
  | 'unsupported'
  | 'unknown';
export type CameraOptions = {
  deviceId?: string | null;
  facing: 'user' | 'environment';
  resolution: '720p' | '1080p' | '2160p';
  frameRate: number;
  aspect: '9:16' | '16:9';
  audioDeviceId?: string | null;
};
const HEIGHT = { '720p': 720, '1080p': 1080, '2160p': 2160 };
export function cameraConstraints(options: CameraOptions, step = 0): MediaStreamConstraints {
  const portrait = options.aspect === '9:16';
  const size = step < 2 ? HEIGHT[options.resolution] : 720;
  const video: MediaTrackConstraints = {
    ...(step < 3
      ? options.deviceId
        ? { deviceId: { exact: options.deviceId } }
        : { facingMode: { ideal: options.facing } }
      : {}),
    width: { ideal: portrait ? size : Math.round((size * 16) / 9) },
    height: { ideal: portrait ? Math.round((size * 16) / 9) : size },
    aspectRatio: { ideal: portrait ? 9 / 16 : 16 / 9 },
    ...(step < 1 ? { frameRate: { ideal: options.frameRate } } : {}),
  };
  return {
    video,
    audio:
      step >= 4
        ? false
        : {
            ...(options.audioDeviceId ? { deviceId: { ideal: options.audioDeviceId } } : {}),
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
  };
}
export function cameraErrorReason(error: unknown): CameraReason {
  const name = (error as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permission_blocked';
  if (name === 'NotFoundError') return 'not_found';
  if (name === 'NotReadableError' || name === 'AbortError') return 'in_use';
  if (name === 'OverconstrainedError') return 'overconstrained';
  return 'unknown';
}
export async function openCamera(options: CameraOptions): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia)
    throw Object.assign(new Error('Insecure context'), { reason: 'insecure_context' });
  let last: unknown;
  for (let step = 0; step <= 4; step++) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(options, step));
      if (step === 4) {
        try {
          const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          for (const track of audio.getAudioTracks()) stream.addTrack(track);
        } catch {
          /* video remains usable */
        }
      }
      return stream;
    } catch (error) {
      last = error;
      const reason = cameraErrorReason(error);
      if (reason !== 'overconstrained' && reason !== 'in_use') break;
    }
  }
  throw last;
}
