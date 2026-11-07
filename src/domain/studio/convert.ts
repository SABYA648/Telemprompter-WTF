/**
 * MP4 conversion and trim (M11). `mediabunny` is loaded only after feature detection passes and
 * the user starts a conversion, so it never reaches the Studio entry or a browser without
 * WebCodecs H.264 and AAC encoders.
 */

export const UNSUPPORTED_MESSAGE =
  "This browser can't make MP4 files on the device. Try Chrome or Edge on a computer, or save the WebM.";

export interface TrimRange {
  startMs: number;
  endMs: number;
}

const AVC_CODECS = ['avc1.640033', 'avc1.640028', 'avc1.4d0028', 'avc1.42e01f'];
const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);

/** True only when this browser can encode H.264 video at the take's size and AAC audio. */
export async function mp4EncodingSupported(width: number, height: number): Promise<boolean> {
  const scope = globalThis as {
    VideoEncoder?: { isConfigSupported(config: unknown): Promise<{ supported?: boolean }> };
    AudioEncoder?: { isConfigSupported(config: unknown): Promise<{ supported?: boolean }> };
  };
  if (!scope.VideoEncoder?.isConfigSupported || !scope.AudioEncoder?.isConfigSupported)
    return false;
  try {
    let video = false;
    for (const codec of AVC_CODECS) {
      const result = await scope.VideoEncoder.isConfigSupported({
        codec,
        width: even(width || 1280),
        height: even(height || 720),
        bitrate: 8_000_000,
      });
      if (result.supported) {
        video = true;
        break;
      }
    }
    if (!video) return false;
    const audio = await scope.AudioEncoder.isConfigSupported({
      codec: 'mp4a.40.2',
      sampleRate: 48_000,
      numberOfChannels: 2,
      bitrate: 128_000,
    });
    return Boolean(audio.supported);
  } catch {
    return false;
  }
}

export class ConversionCanceled extends Error {
  override name = 'AbortError';
}

/** Re-encode a take to MP4 (H.264/AAC), optionally keeping only `trim`. */
export async function convertToMp4(
  blob: Blob,
  options: {
    trim?: TrimRange | undefined;
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<Blob> {
  const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output } =
    await import('mediabunny');
  if (options.signal?.aborted) throw new ConversionCanceled('Conversion canceled');
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  const conversion = await Conversion.init({
    input,
    output,
    video: { codec: 'avc' },
    audio: { codec: 'aac' },
    ...(options.trim
      ? { trim: { start: options.trim.startMs / 1000, end: options.trim.endMs / 1000 } }
      : {}),
    showWarnings: false,
  });
  // Never hand back a silent or picture-less MP4 because one track could not be encoded.
  if (!conversion.isValid || conversion.discardedTracks.length) throw new Error('unsupported');
  const cancel = () => void conversion.cancel();
  options.signal?.addEventListener('abort', cancel, { once: true });
  conversion.onProgress = (fraction) => options.onProgress?.(Math.min(1, Math.max(0, fraction)));
  try {
    await conversion.execute();
  } catch (error) {
    if (options.signal?.aborted) throw new ConversionCanceled('Conversion canceled');
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', cancel);
  }
  if (!target.buffer) throw new Error('Conversion produced no file');
  return new Blob([target.buffer], { type: 'video/mp4' });
}

const WINDOW_MS = 50;
const PADDING_MS = 300;
const THRESHOLD = 10 ** (-40 / 20); // -40 dBFS as linear RMS

/**
 * "Suggest trim": the first and last 50 ms windows whose RMS is above -40 dBFS on any channel,
 * widened by 0.3 s and kept inside the take. Null when the whole take is quieter than that.
 */
export function suggestTrim(
  channels: readonly Float32Array[],
  sampleRate: number,
): TrimRange | null {
  const length = channels[0]?.length ?? 0;
  if (!length || !(sampleRate > 0)) return null;
  const size = Math.max(1, Math.round((sampleRate * WINDOW_MS) / 1000));
  const durationMs = (length / sampleRate) * 1000;
  let first = -1;
  let last = -1;
  for (let window = 0; window * size < length; window++) {
    const from = window * size;
    const to = Math.min(length, from + size);
    const loud = channels.some((data) => {
      let sum = 0;
      for (let i = from; i < to; i++) sum += (data[i] ?? 0) ** 2;
      return Math.sqrt(sum / (to - from)) > THRESHOLD;
    });
    if (loud) {
      if (first < 0) first = window;
      last = window;
    }
  }
  if (first < 0) return null;
  const windowMs = (size / sampleRate) * 1000;
  return {
    startMs: Math.round(Math.max(0, first * windowMs - PADDING_MS)),
    endMs: Math.round(Math.min(durationMs, (last + 1) * windowMs + PADDING_MS)),
  };
}

/** Decode the take's audio on the device and suggest a trim. Null if it can't be decoded. */
export async function suggestTrimFor(blob: Blob): Promise<TrimRange | null> {
  const Context =
    globalThis.AudioContext ??
    (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;
  const context = new Context();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: audio.numberOfChannels }, (_, i) =>
      audio.getChannelData(i),
    );
    return suggestTrim(channels, audio.sampleRate);
  } catch {
    return null;
  } finally {
    void context.close();
  }
}
