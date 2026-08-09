export type SmartPaceState =
  | 'off'
  | 'requesting'
  | 'calibrating'
  | 'listening'
  | 'paused'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface PaceReading {
  state: 'calibrating' | 'listening' | 'paused';
  multiplier: number;
  speechActive: boolean;
  noiseFloor: number;
}

interface PaceSample {
  rms: number;
  at: number;
}

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

export class VoicePaceAnalyzer {
  private readonly calibrationMs: number;
  private startedAt: number | null = null;
  private noiseFloor = 0.006;
  private multiplier = 1;
  private lastSpeechAt = 0;
  private consecutiveSpeechFrames = 0;
  private samples: PaceSample[] = [];

  constructor(calibrationMs = 1500) {
    this.calibrationMs = calibrationMs;
  }

  reset(): void {
    this.startedAt = null;
    this.noiseFloor = 0.006;
    this.multiplier = 1;
    this.lastSpeechAt = 0;
    this.consecutiveSpeechFrames = 0;
    this.samples = [];
  }

  process(rmsInput: number, at: number): PaceReading {
    const rms = Number.isFinite(rmsInput) ? Math.max(0, rmsInput) : 0;
    this.startedAt ??= at;
    this.samples.push({ rms, at });
    this.samples = this.samples.filter((sample) => at - sample.at <= 4000);

    if (at - this.startedAt < this.calibrationMs) {
      const quietSamples = this.samples.map((sample) => sample.rms);
      this.noiseFloor = Math.max(0.003, median(quietSamples) * 1.25);
      return {
        state: 'calibrating',
        multiplier: 0,
        speechActive: false,
        noiseFloor: this.noiseFloor,
      };
    }

    const threshold = Math.max(0.009, this.noiseFloor * 2.35 + 0.004);
    const spike = rms > threshold;
    this.consecutiveSpeechFrames = spike ? this.consecutiveSpeechFrames + 1 : 0;
    const speechActive = this.consecutiveSpeechFrames >= 2;
    if (speechActive) this.lastSpeechAt = at;

    const sinceSpeech = this.lastSpeechAt ? at - this.lastSpeechAt : Number.POSITIVE_INFINITY;
    const activeSamples = this.samples.filter((sample) => sample.rms > threshold).length;
    const activeRatio = this.samples.length ? activeSamples / this.samples.length : 0;
    const intensity = Math.min(1, Math.max(0, (rms - threshold) / Math.max(threshold * 3, 0.02)));

    let target = 0;
    if (speechActive || sinceSpeech < 360) {
      target = Math.min(1.35, Math.max(0.58, 0.78 + activeRatio * 0.48 + intensity * 0.12));
    } else if (sinceSpeech < 1500) {
      target = 0.48 * (1 - (sinceSpeech - 360) / 1140);
    }

    const smoothing = target < this.multiplier ? 0.09 : 0.14;
    this.multiplier += (target - this.multiplier) * smoothing;
    if (target === 0 && this.multiplier < 0.035) this.multiplier = 0;

    if (!spike && rms < threshold * 0.7) {
      this.noiseFloor = this.noiseFloor * 0.995 + rms * 0.005;
      this.noiseFloor = Math.min(0.08, Math.max(0.003, this.noiseFloor));
    }

    return {
      state: this.multiplier === 0 ? 'paused' : 'listening',
      multiplier: Math.min(1.35, Math.max(0, this.multiplier)),
      speechActive,
      noiseFloor: this.noiseFloor,
    };
  }
}

interface LocalAudioOptions {
  onPace: (reading: PaceReading) => void;
  onPcmChunk?: (audio: Float32Array, sampleRate: number) => void;
  calibrationMs?: number;
}

type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

export class LocalAudioSession {
  private readonly options: LocalAudioOptions;
  private readonly analyzer: VoicePaceAnalyzer;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private captureNode: AudioNode | null = null;
  private mutedGain: GainNode | null = null;
  private animationFrame: number | null = null;
  private pcmParts: Float32Array[] = [];
  private pcmLength = 0;

  constructor(options: LocalAudioOptions) {
    this.options = options;
    this.analyzer = new VoicePaceAnalyzer(options.calibrationMs);
  }

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('microphone-unavailable');
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    const AudioContextConstructor =
      window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AudioContextConstructor) {
      this.stop();
      throw new Error('audio-context-unavailable');
    }
    this.context = new AudioContextConstructor({ latencyHint: 'interactive' });
    await this.context.resume();
    this.source = this.context.createMediaStreamSource(this.stream);
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.25;
    this.source.connect(this.analyserNode);
    this.analyzer.reset();

    if (this.options.onPcmChunk) await this.startPcmCapture();
    this.sample();
  }

  stop(): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.captureNode?.disconnect();
    this.source?.disconnect();
    this.analyserNode?.disconnect();
    this.mutedGain?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close().catch(() => undefined);
    this.stream = null;
    this.context = null;
    this.source = null;
    this.analyserNode = null;
    this.captureNode = null;
    this.mutedGain = null;
    this.pcmParts = [];
    this.pcmLength = 0;
  }

  private readonly sample = (): void => {
    if (!this.analyserNode) return;
    const values = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(values);
    let energy = 0;
    for (const value of values) energy += value * value;
    const reading = this.analyzer.process(Math.sqrt(energy / values.length), performance.now());
    this.options.onPace(reading);
    this.animationFrame = requestAnimationFrame(this.sample);
  };

  private async startPcmCapture(): Promise<void> {
    if (!this.context || !this.source || !this.options.onPcmChunk) return;
    this.mutedGain = this.context.createGain();
    this.mutedGain.gain.value = 0;
    this.mutedGain.connect(this.context.destination);

    if (this.context.audioWorklet) {
      await this.context.audioWorklet.addModule('/audio/pcm-capture-worklet.js');
      const worklet = new AudioWorkletNode(this.context, 'pcm-capture');
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => this.collectPcm(event.data);
      this.source.connect(worklet);
      worklet.connect(this.mutedGain);
      this.captureNode = worklet;
      return;
    }

    const processor = this.context.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      this.collectPcm(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    this.source.connect(processor);
    processor.connect(this.mutedGain);
    this.captureNode = processor;
  }

  private collectPcm(part: Float32Array): void {
    if (!this.context || !this.options.onPcmChunk) return;
    this.pcmParts.push(part);
    this.pcmLength += part.length;
    const targetLength = this.context.sampleRate * 6;
    if (this.pcmLength < targetLength) return;
    const combined = new Float32Array(this.pcmLength);
    let offset = 0;
    for (const current of this.pcmParts) {
      combined.set(current, offset);
      offset += current.length;
    }
    this.pcmParts = [];
    this.pcmLength = 0;
    this.options.onPcmChunk(combined, this.context.sampleRate);
  }
}

export function microphoneErrorState(error: unknown): SmartPaceState {
  if (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'SecurityError')
  ) {
    return 'denied';
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') return 'unavailable';
  return 'error';
}
