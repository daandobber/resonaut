// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createSamplerOrbAudioNodes } from '../orbs/sampler-orb.js';

describe('createSamplerOrbAudioNodes bitcrusher', () => {
  it('applies sampleCrush to wet/dry gains', () => {
    const ctx = {
      createBiquadFilter: vi.fn(() => ({
        type: '',
        frequency: { value: 0 },
        Q: { value: 0 },
        connect: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      })),
      createScriptProcessor: vi.fn(() => ({ connect: vi.fn() })),
    };
    globalThis.audioContext = ctx;
    const node = { audioParams: { sampleCrush: 0.4 } };
    const audioNodes = createSamplerOrbAudioNodes(node);
    expect(audioNodes.bitCrusherWetGain.gain.value).toBeCloseTo(0.4);
    expect(audioNodes.bitCrusherDryGain.gain.value).toBeCloseTo(0.6);
  });
});
