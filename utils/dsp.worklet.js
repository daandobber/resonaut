// Self-contained module: imported by tests and loaded on the audio rendering thread.
const unit = (value, fallback) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
export class BitCrusherDSP {
  constructor({ bits = 8, normFreq = 0.25 } = {}) {
    this.step = Math.pow(0.5, Math.min(24, Math.max(1, bits)));
    this.rate = Math.max(0.001, unit(normFreq, 0.25));
    this.phase = 0; this.left = 0; this.right = 0;
  }
  process(left, right, outL, outR) {
    for (let i = 0; i < outL.length; i++) {
      this.phase += this.rate;
      if (this.phase >= 1) {
        this.phase -= 1;
        this.left = this.step * Math.floor((left?.[i] || 0) / this.step + 0.5);
        this.right = this.step * Math.floor((right?.[i] ?? left?.[i] ?? 0) / this.step + 0.5);
      }
      outL[i] = this.left; outR[i] = this.right;
    }
  }
}

export class GranularDSP {
  constructor(rate, params = {}) {
    this.rate = rate;
    this.size = Math.ceil(rate * 2);
    this.left = new Float32Array(this.size); this.right = new Float32Array(this.size);
    this.write = 0; this.counter = 0; this.grains = []; this.mix = 0;
    this.setParams(params);
  }
  setParams(p) {
    this.params = { gSize: unit(p.gSize, 0.3), gPitch: unit(p.gPitch, 0.5),
      gPos: unit(p.gPos, 0), gDensity: unit(p.gDensity, 0.5),
      gTexture: unit(p.gTexture, 0.5), gMix: unit(p.gMix, 0) };
  }
  process(left, right, outL, outR) {
    const p = this.params, length = this.size;
    const duration = Math.max(1, Math.floor((0.02 + p.gSize * 0.28) * this.rate));
    const pitch = Math.pow(2, (p.gPitch - 0.5) * 4);
    const interval = this.rate / (1 + p.gDensity * 50);
    const offset = Math.floor(p.gPos * length), power = 1 + p.gTexture * 3;
    for (let i = 0; i < outL.length; i++) {
      const dryL = left?.[i] || 0, dryR = right?.[i] ?? dryL;
      this.left[this.write] = dryL; this.right[this.write] = dryR;
      // Do not run inaudible grains when the insert is fully dry.
      if (p.gMix > 0 || this.mix > 0.0001) {
        if (this.counter >= interval && this.grains.length < 32) {
          this.counter %= interval;
          const jitter = (Math.random() - 0.5) * length * 0.05 * p.gTexture;
          this.grains.push({ pos: ((this.write - offset + jitter) % length + length) % length,
            age: 0, duration, pitch: pitch * (1 + (Math.random() - 0.5) * 0.3 * p.gTexture),
            amp: 0.7 + Math.random() * 0.6 * p.gTexture });
        }
      } else { this.grains.length = 0; }
      let wetL = 0, wetR = 0, weight = 0;
      for (let g = this.grains.length - 1; g >= 0; g--) {
        const grain = this.grains[g];
        if (grain.age >= grain.duration) { this.grains.splice(g, 1); continue; }
        const index = Math.floor(grain.pos), fraction = grain.pos - index;
        const next = (index + 1) % length;
        const envelope = Math.pow(Math.sin(Math.PI * grain.age / grain.duration), power) * grain.amp;
        wetL += (this.left[index] * (1 - fraction) + this.left[next] * fraction) * envelope;
        wetR += (this.right[index] * (1 - fraction) + this.right[next] * fraction) * envelope;
        weight += envelope;
        // Wrap the position itself: the old interpolation fraction could grow
        // to tens of thousands after crossing the end of the ring buffer.
        grain.pos = (grain.pos + grain.pitch) % length;
        grain.age++;
      }
      this.mix += (p.gMix - this.mix) * Math.min(1, 1 / (this.rate * 0.005));
      const norm = Math.max(1, weight);
      outL[i] = dryL * (1 - this.mix) + wetL / norm * this.mix;
      outR[i] = dryR * (1 - this.mix) + wetR / norm * this.mix;
      this.write = (this.write + 1) % length;
      this.counter = Math.min(interval, this.counter + 1);
    }
  }
}

if (typeof registerProcessor === 'function') {
  class ResonautDSPProcessor extends AudioWorkletProcessor {
    constructor(options) {
      super();
      const p = options.processorOptions || {};
      this.dsp = p.kind === 'granular' ? new GranularDSP(sampleRate, p.params) : new BitCrusherDSP(p);
      this.port.onmessage = event => this.dsp.setParams?.(event.data);
    }
    process(inputs, outputs) {
      const output = outputs[0];
      if (!output?.length) return true;
      this.dsp.process(inputs[0]?.[0], inputs[0]?.[1], output[0], output[1] || output[0]);
      return true;
    }
  }
  registerProcessor('resonaut-dsp', ResonautDSPProcessor);
}
