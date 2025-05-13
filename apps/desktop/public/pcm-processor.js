class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 512;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0]) {
      for (let i = 0; i < input[0].length; i++) {
        this._buffer.push(input[0][i]);
        if (this._buffer.length === this._bufferSize) {
          // Convert Float32 [-1, 1] to 16-bit PCM
          const pcm16 = new Int16Array(this._bufferSize);
          for (let j = 0; j < this._bufferSize; j++) {
            let s = Math.max(-1, Math.min(1, this._buffer[j]));
            pcm16[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
          this._buffer = [];
        }
      }
    }
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
