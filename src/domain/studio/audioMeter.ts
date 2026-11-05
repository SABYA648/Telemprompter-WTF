export function audioLevels(samples: Float32Array): { rms: number; peak: number } {
  let squares = 0,
    peak = 0;
  for (const sample of samples) {
    squares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  return { rms: Math.sqrt(squares / Math.max(1, samples.length)), peak };
}
export class AudioMeter {
  private context: AudioContext;
  private source: MediaStreamAudioSourceNode;
  private analyser: AnalyserNode;
  private samples: Float32Array<ArrayBuffer>;
  constructor(stream: MediaStream) {
    this.context = new AudioContext();
    this.source = this.context.createMediaStreamSource(stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source.connect(this.analyser);
    this.samples = new Float32Array(this.analyser.fftSize);
  }
  read() {
    this.analyser.getFloatTimeDomainData(this.samples);
    return audioLevels(this.samples);
  }
  close() {
    this.source.disconnect();
    void this.context.close();
  }
}
