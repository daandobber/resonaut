class ContinuityMeter extends AudioWorkletProcessor {
  constructor() {
    super(); this.enabled = false; this.frames = 0; this.bad = 0;
    this.port.onmessage = ({ data }) => {
      if (data === 'arm') { this.enabled = true; this.frames = 0; this.bad = 0; }
      if (data === 'report') { this.enabled = false; this.port.postMessage({ frames: this.frames, bad: this.bad }); }
    };
  }
  process(inputs) {
    if (this.enabled) {
      for (const value of inputs[0]?.[0] || []) {
        this.frames++;
        if (Math.abs(value - 0.25) > 0.00001) this.bad++;
      }
    }
    return true; // Silent output: the diagnostic signal never reaches the speakers.
  }
}
registerProcessor('continuity-meter', ContinuityMeter);
