import { describe, it, expect } from 'vitest';
import { tapeCurve, prepareTapeBuffer, TAPE_PRESETS, reverseTapeBuffer, wrapTapePosition } from '../utils/tapeAudio.js';

const context = {
  createBuffer(numberOfChannels, length, sampleRate) {
    const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    return { numberOfChannels, length, sampleRate, duration: length / sampleRate, getChannelData: c => channels[c] };
  },
};

describe('tape signal processing', () => {
  it('reverses the actual stereo samples without overwriting the take', () => {
    const buffer = context.createBuffer(2, 4, 48000);
    buffer.getChannelData(0).set([0.1, 0.2, 0.3, 0.4]);
    buffer.getChannelData(1).set([-0.2, -0.4, -0.6, -0.8]);
    const reversed = reverseTapeBuffer(context, buffer);
    for (let c = 0; c < 2; c++) {
      expect([...reversed.getChannelData(c)]).toEqual([...buffer.getChannelData(c)].reverse());
    }
    expect(buffer.getChannelData(0)[0]).toBeCloseTo(0.1);
  });

  it('wraps forward and reverse positions inside a trimmed loop', () => {
    expect(wrapTapePosition(0.85, 0.2, 0.8)).toBeCloseTo(0.25);
    expect(wrapTapePosition(0.15, 0.2, 0.8)).toBeCloseTo(0.75);
    expect(wrapTapePosition(-1.05, 0.2, 0.8)).toBeCloseTo(0.75);
  });
  it('keeps clean audio linear and saturation bounded, symmetric and monotonic', () => {
    for (const preset of Object.values(TAPE_PRESETS)) {
      const curve = tapeCurve(preset.warmth);
      expect(curve[2048]).toBe(0);
      for (let i = 0; i < curve.length; i++) {
        expect(Number.isFinite(curve[i])).toBe(true);
        expect(Math.abs(curve[i])).toBeLessThanOrEqual(1);
        expect(curve[i]).toBeCloseTo(-curve[curve.length - 1 - i], 6);
        if (i > 0) expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1]);
      }
    }
    expect(tapeCurve(0)[3072]).toBe(0.5);
    expect(tapeCurve(0.001)[4096]).toBeCloseTo(1, 2);
  });

  it('softens both ends of a trimmed loop without changing its duration, stereo or original take', () => {
    const buffer = context.createBuffer(2, 48000, 48000);
    buffer.getChannelData(0).fill(0.7);
    buffer.getChannelData(1).fill(-0.2);
    const result = prepareTapeBuffer(context, buffer, 0.2, 0.8);
    expect(result.duration).toBe(1);
    expect(result.numberOfChannels).toBe(2);
    for (let c = 0; c < 2; c++) {
      const data = result.getChannelData(c);
      expect(Math.abs(data[9600])).toBe(0);
      expect(Math.abs(data[38399])).toBe(0);
      expect(data[10000]).toBe(buffer.getChannelData(c)[10000]);
      expect(buffer.getChannelData(c)[9600]).not.toBe(0);
    }
  });

  it('handles very short loops without overlapping fades or non-finite samples', () => {
    const buffer = context.createBuffer(1, 20, 48000);
    buffer.getChannelData(0).fill(1);
    const result = prepareTapeBuffer(context, buffer);
    expect([...result.getChannelData(0)].every(Number.isFinite)).toBe(true);
    expect(result.getChannelData(0)[0]).toBe(0);
    expect(result.getChannelData(0)[19]).toBe(0);
    expect(result.getChannelData(0)[9]).toBe(1);
  });
});
