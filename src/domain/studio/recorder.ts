import { randomId } from './ids';
import { containerFor, preferredMime, videoBitrate, type Quality } from './mime';
import { deleteTake, listTakes, saveChunk, saveTake } from './takesRepo';
import type { StudioTake, TimelineMark } from './types';
export type StopReason = 'user' | 'target' | 'section_end' | 'interruption' | 'error' | 'remote';
export interface RecorderOptions {
  stream: MediaStream;
  scriptId: string | null;
  sectionIndex?: number | null;
  facing: StudioTake['facing'];
  resolution: '720p' | '1080p' | '2160p';
  frameRate: number;
  quality: Quality;
  audioBitrate?: number;
  format?: 'auto' | 'mp4' | 'webm';
  timeline: TimelineMark[];
  onStop: (take: StudioTake, reason: StopReason, blob: Blob) => void;
  onError?: (error: unknown) => void;
}
export class StudioRecorder {
  readonly take: StudioTake;
  private recorder: MediaRecorder;
  private writeQueue: Promise<void> = Promise.resolve();
  private seq = 0;
  private size = 0;
  private memoryChunks: Blob[] = [];
  private startTime = 0;
  private pausedAt = 0;
  private pausedTotal = 0;
  private stoppedElapsed = 0;
  private writeFailed = false;
  private reason: StopReason = 'user';
  private completed = false;
  private constructor(
    private options: RecorderOptions,
    recorder: MediaRecorder,
    take: StudioTake,
  ) {
    this.recorder = recorder;
    this.take = take;
  }
  static async start(options: RecorderOptions): Promise<StudioRecorder> {
    const mime = preferredMime(MediaRecorder.isTypeSupported.bind(MediaRecorder), options.format);
    if (!mime)
      throw Object.assign(new Error('No supported recording format'), {
        reason: 'mime_unsupported',
      });
    const recorder = new MediaRecorder(options.stream, {
      mimeType: mime,
      videoBitsPerSecond: videoBitrate(options.resolution, options.frameRate, options.quality),
      audioBitsPerSecond: options.audioBitrate ?? 128000,
    });
    const actualMime = recorder.mimeType || mime;
    const settings = options.stream.getVideoTracks()[0]?.getSettings() ?? {};
    const number =
      (await listTakes()).filter(
        (t) => t.scriptId === options.scriptId && t.sectionIndex === (options.sectionIndex ?? null),
      ).length + 1;
    const take: StudioTake = {
      id: randomId(),
      scriptId: options.scriptId,
      sectionIndex: options.sectionIndex ?? null,
      number,
      status: 'recording',
      mimeType: actualMime,
      container: containerFor(actualMime),
      width: settings.width ?? 0,
      height: settings.height ?? 0,
      frameRate: settings.frameRate ?? options.frameRate,
      facing: options.facing,
      durationMs: 0,
      sizeBytes: 0,
      chunkCount: 0,
      kept: false,
      starred: false,
      exportedAt: null,
      createdAt: Date.now(),
      timeline: [],
      trim: null,
    };
    await saveTake(take);
    const session = new StudioRecorder(options, recorder, take);
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) session.enqueue(event.data);
    });
    recorder.addEventListener('stop', () => {
      void session.finalize();
    });
    recorder.addEventListener('error', (event) => {
      options.onError?.(event);
      session.stop('error');
    });
    options.stream.getVideoTracks().forEach((track) => {
      track.addEventListener('ended', () => session.stop('interruption'));
      track.addEventListener('mute', () => session.stop('interruption'));
    });
    try {
      recorder.start(1000);
      session.startTime = performance.now();
    } catch (error) {
      await deleteTake(take.id);
      throw error;
    }
    return session;
  }
  private enqueue(blob: Blob) {
    const seq = this.seq++;
    this.size += blob.size;
    this.memoryChunks.push(blob);
    this.writeQueue = this.writeQueue
      .then(() => saveChunk({ takeId: this.take.id, seq, blob }))
      .catch((error) => {
        this.writeFailed = true;
        this.options.onError?.(error);
        this.stop('error');
      });
  }
  elapsed(): number {
    return Math.max(0, (this.pausedAt || performance.now()) - this.startTime - this.pausedTotal);
  }
  pause() {
    if (this.recorder.state === 'recording') {
      this.recorder.pause();
      this.pausedAt = performance.now();
    }
  }
  resume() {
    if (this.recorder.state === 'paused') {
      this.pausedTotal += performance.now() - this.pausedAt;
      this.pausedAt = 0;
      this.recorder.resume();
    }
  }
  get state() {
    return this.recorder.state;
  }
  stop(reason: StopReason = 'user') {
    if (this.recorder.state === 'inactive') return;
    this.reason = reason;
    this.stoppedElapsed = this.elapsed();
    this.recorder.stop();
  }
  private async finalize() {
    if (this.completed) return;
    this.completed = true;
    await this.writeQueue;
    let next: StudioTake = {
      ...this.take,
      status:
        this.writeFailed || this.seq === 0
          ? 'failed'
          : this.reason === 'interruption'
            ? 'recovered'
            : 'ready',
      durationMs: Math.round(this.stoppedElapsed),
      sizeBytes: this.size,
      chunkCount: this.seq,
      mimeType: this.recorder.mimeType || this.take.mimeType,
      container: containerFor(this.recorder.mimeType || this.take.mimeType),
      timeline: [...this.options.timeline],
    };
    try {
      await saveTake(next);
    } catch (error) {
      this.options.onError?.(error);
      next = { ...next, status: 'failed' };
    }
    this.options.onStop(next, this.reason, new Blob(this.memoryChunks, { type: next.mimeType }));
  }
}
