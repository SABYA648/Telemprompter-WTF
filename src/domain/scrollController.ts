import { nextVelocity } from './followController';
import type { ScrollController, ScrollSnapshot } from './types';

/** Snapshots drive React state, so they are sampled rather than pushed every frame. */
const EMIT_INTERVAL_MS = 120;

interface TimeScrollOptions {
  element: HTMLElement;
  pixelsPerSecond: number;
  onUpdate?: (snapshot: ScrollSnapshot) => void;
  onComplete?: () => void;
}

export function calculateScrollDelta(pixelsPerSecond: number, elapsedMilliseconds: number): number {
  if (pixelsPerSecond <= 0 || elapsedMilliseconds <= 0) return 0;
  return pixelsPerSecond * (Math.min(elapsedMilliseconds, 100) / 1000);
}

export function calculateProgress(scrollTop: number, maxScroll: number): number {
  if (maxScroll <= 0) return 1;
  return Math.min(1, Math.max(0, scrollTop / maxScroll));
}

export class TimeBasedScrollController implements ScrollController {
  private readonly element: HTMLElement;
  private speed: number;
  private readonly onUpdate?: TimeScrollOptions['onUpdate'];
  private readonly onComplete?: TimeScrollOptions['onComplete'];
  private animationFrame: number | null = null;
  private lastTimestamp: number | null = null;
  private playing = false;
  private completed = false;
  private lastKnownMax = 0;
  private followTarget: number | null = null;
  private followTrust = 0;
  private feedForward = 0;
  private lineHeightPx = 60;
  private lastEmitAt = 0;

  constructor(options: TimeScrollOptions) {
    this.element = options.element;
    this.speed = options.pixelsPerSecond;
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
    this.lastKnownMax = this.maxScroll();
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.element.addEventListener('scroll', this.emit, { passive: true });
  }

  start(): void {
    if (this.playing) return;
    this.playing = true;
    this.completed = false;
    this.lastTimestamp = null;
    this.animationFrame = requestAnimationFrame(this.tick);
    this.emit();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.lastTimestamp = null;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.emit();
  }

  restart(): void {
    this.element.scrollTop = 0;
    this.completed = false;
    this.lastTimestamp = null;
    this.followTarget = null;
    this.emit();
  }

  setSpeed(pixelsPerSecond: number): void {
    this.speed = Math.max(0, pixelsPerSecond);
    this.lastTimestamp = null;
  }

  /**
   * Point the reader at where the spoken word should sit. Pass null to release it back to plain
   * time-based scrolling, which is what Manual mode and a dropped microphone both want.
   */
  setFollowTarget(scrollTop: number | null, trust: number, feedForward: number): void {
    this.followTarget = scrollTop === null ? null : Math.max(0, scrollTop);
    this.followTrust = Number.isFinite(trust) ? Math.min(1, Math.max(0, trust)) : 0;
    this.feedForward = Number.isFinite(feedForward) ? Math.max(0, feedForward) : 0;
  }

  /** The deadband is expressed in lines, so the servo needs to know how tall one is. */
  setLineHeight(pixels: number): void {
    if (Number.isFinite(pixels) && pixels > 0) this.lineHeightPx = pixels;
  }

  moveToward(scrollTop: number, strength: number): void {
    const target = Math.min(this.maxScroll(), Math.max(0, scrollTop));
    const safeStrength = Math.min(0.85, Math.max(0, strength));
    this.element.scrollTop += (target - this.element.scrollTop) * safeStrength;
    this.lastTimestamp = null;
    this.emit();
  }

  notifyLayoutChange(): void {
    const oldMax = this.lastKnownMax;
    const ratio = calculateProgress(this.element.scrollTop, oldMax);
    requestAnimationFrame(() => {
      const nextMax = this.maxScroll();
      this.element.scrollTop = ratio * nextMax;
      this.lastKnownMax = nextMax;
      this.lastTimestamp = null;
      this.emit();
    });
  }

  destroy(): void {
    this.pause();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.element.removeEventListener('scroll', this.emit);
  }

  private maxScroll(): number {
    return Math.max(0, this.element.scrollHeight - this.element.clientHeight);
  }

  private readonly emit = (): void => {
    const maxScroll = this.maxScroll();
    this.lastKnownMax = maxScroll;
    this.onUpdate?.({
      isPlaying: this.playing,
      progress: calculateProgress(this.element.scrollTop, maxScroll),
      scrollTop: this.element.scrollTop,
      maxScroll,
    });
  };

  private readonly tick = (timestamp: number): void => {
    if (!this.playing) return;
    if (this.lastTimestamp !== null) {
      const dt = Math.min(100, timestamp - this.lastTimestamp) / 1000;
      const { velocity } = nextVelocity({
        scrollTop: this.element.scrollTop,
        targetTop: this.followTarget,
        baseVelocity: this.speed,
        feedForward: this.feedForward,
        trust: this.followTrust,
        lineHeightPx: this.lineHeightPx,
      });
      this.element.scrollTop += velocity * dt;
    }
    this.lastTimestamp = timestamp;

    const maxScroll = this.maxScroll();
    if (maxScroll > 0 && this.element.scrollTop >= maxScroll - 0.5) {
      this.element.scrollTop = maxScroll;
      this.playing = false;
      this.animationFrame = null;
      this.emit();
      if (!this.completed) {
        this.completed = true;
        this.onComplete?.();
      }
      return;
    }

    // Snapshots feed React state. Pushing one every frame re-rendered the whole script.
    if (timestamp - this.lastEmitAt >= EMIT_INTERVAL_MS) {
      this.lastEmitAt = timestamp;
      this.emit();
    }
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private readonly handleVisibility = (): void => {
    this.lastTimestamp = null;
  };
}
