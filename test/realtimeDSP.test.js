import { describe, it, expect } from 'vitest';
import { BitCrusherDSP, GranularDSP } from '../utils/dsp.worklet.js';

describe('audio-thread processors', () => {
  it('keeps crusher stereo channels and sample-hold phase across blocks', () => {
    const dsp = new BitCrusherDSP({ bits: 8, normFreq: 0.5 });
    const outL = new Float32Array(3), outR = new Float32Array(3);
    dsp.process(new Float32Array([0.25, 0.5, 0.75]), new Float32Array([-0.25, -0.5, -0.75]), outL, outR);
    expect([...outL]).toEqual([0, 0.5, 0.5]);
    expect([...outR]).toEqual([0, -0.5, -0.5]);
    dsp.process(new Float32Array([0.25, 0.5, 0.75]), undefined, outL, outR);
    expect([...outL]).toEqual([0.25, 0.25, 0.75]);
    expect([...outR]).toEqual([0.25, 0.25, 0.75]);
  });
  it('passes dry granular audio exactly without generating inaudible grains', () => {
    const dsp = new GranularDSP(48000, { gMix: 0 });
    const left = Float32Array.from({ length: 128 }, (_, i) => Math.sin(i) * 0.3);
    const right = Float32Array.from(left, n => -n);
    const outL = new Float32Array(128), outR = new Float32Array(128);
    for (let block = 0; block < 1000; block++) dsp.process(left, right, outL, outR);
    expect(outL.every((n, i) => n === left[i])).toBe(true);
    expect(outR.every((n, i) => n === right[i])).toBe(true);
    expect(dsp.grains).toHaveLength(0);
  });
  it('keeps interpolation and output bounded across repeated ring-buffer wraps', () => {
    const dsp = new GranularDSP(1000, { gMix: 1, gPitch: 1, gTexture: 0, gDensity: 1 });
    dsp.left.set(Float32Array.from({length: dsp.size}, (_, i) => Math.sin(i) * 0.4));
    dsp.right.set(Float32Array.from(dsp.left, n => -n));
    dsp.mix = 1;
    dsp.grains.push({ pos: dsp.size - 0.5, age: 1, duration: 300, pitch: 4, amp: 1 });
    const input = new Float32Array(128).fill(0.4), output = new Float32Array(128), right = new Float32Array(128);
    for (let block = 0; block < 100; block++) {
      dsp.process(input, input, output, right);
      expect([...output, ...right].every(n => Number.isFinite(n) && Math.abs(n) <= 0.40001)).toBe(true);
      expect(dsp.grains.every(g => g.pos >= 0 && g.pos < dsp.size)).toBe(true);
    }
  });
  it('keeps granular settings local to each orb', () => {
    const a = new GranularDSP(48000, { gMix: 0 }), b = new GranularDSP(48000, { gMix: 0.8 });
    a.setParams({gMix: 0.2, gPitch: 1});
    expect(b.params.gMix).toBe(0.8);
    expect(b.params.gPitch).toBe(0.5);
  });
});
