// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { playWithToneSampler } from '../samplerPlayer.js';

describe('playWithToneSampler', () => {
  it('schedules buffer playback with correct rate', () => {
    const buffer = { duration: 1 };
    const source = {
      buffer: null,
      playbackRate: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const createBufferSource = vi.fn(() => source);
    const createGain = vi.fn(() => gainNode);
    globalThis.audioContext = {
      currentTime: 0,
      createBufferSource,
      createGain,
    };
    const dest = {};

    playWithToneSampler(buffer, 100, 200, 0, 0.1, 0.2, 0.5, dest);

    expect(createBufferSource).toHaveBeenCalled();
    expect(source.buffer).toBe(buffer);
    expect(source.playbackRate.value).toBeCloseTo(2);
    expect(source.start).toHaveBeenCalledWith(0, 0, buffer.duration);
    expect(gainNode.connect).toHaveBeenCalledWith(dest);
  });

  it('connects to audioContext destination by default', () => {
    const buffer = { duration: 1 };
    const source = {
      buffer: null,
      playbackRate: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const createBufferSource = vi.fn(() => source);
    const createGain = vi.fn(() => gainNode);
    const destinationNode = {};
    globalThis.audioContext = {
      currentTime: 0,
      createBufferSource,
      createGain,
      destination: destinationNode,
    };

    playWithToneSampler(buffer, 100, 200, 0, 0.1, 0.2, 0.5);

    expect(gainNode.connect).toHaveBeenCalledWith(destinationNode);
  });
});
