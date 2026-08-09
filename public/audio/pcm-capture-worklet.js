class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.parts = [];
    this.length = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    this.parts.push(new Float32Array(channel));
    this.length += channel.length;
    if (this.length >= 4096) {
      const output = new Float32Array(this.length);
      let offset = 0;
      for (const part of this.parts) {
        output.set(part, offset);
        offset += part.length;
      }
      this.parts = [];
      this.length = 0;
      this.port.postMessage(output, [output.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-capture', PcmCaptureProcessor);
