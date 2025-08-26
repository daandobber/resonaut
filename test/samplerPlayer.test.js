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
      state: 'running',
      resume: vi.fn(),
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
      state: 'running',
      resume: vi.fn(),
      destination: destinationNode,
    };

    playWithToneSampler(buffer, 100, 200, 0, 0.1, 0.2, 0.5);

    expect(gainNode.connect).toHaveBeenCalledWith(destinationNode);
  });

  it('clamps start time to currentTime when scheduled in the past', () => {
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
      currentTime: 1,
      createBufferSource,
      createGain,
      state: 'running',
      resume: vi.fn(),
    };

    playWithToneSampler(buffer, 100, 100, 0.5, 0.1, 0.2, 0.5, {});

    expect(source.start).toHaveBeenCalledWith(1, 0, buffer.duration);
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 1);
  });

  it('returns when AudioContext is missing', () => {
    delete globalThis.audioContext;
    expect(() =>
      playWithToneSampler({}, 100, 100, 0, 0.1, 0.2, 0.5),
    ).not.toThrow();
  });

  it('returns when buffer is missing', () => {
    const gainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const createBufferSource = vi.fn(() => ({}));
    const createGain = vi.fn(() => gainNode);
    globalThis.audioContext = {
      currentTime: 0,
      createBufferSource,
      createGain,
      state: 'running',
      resume: vi.fn(),
      destination: {},
    };
    playWithToneSampler(null, 100, 100, 0, 0.1, 0.2, 0.5);
    expect(createBufferSource).not.toHaveBeenCalled();
  });

  it('defaults playbackRate to 1 when baseFreq is invalid', () => {
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
      state: 'running',
      resume: vi.fn(),
      destination: {},
    };

    playWithToneSampler(buffer, 0, 200, 0, 0.1, 0.2, 0.5);

    expect(source.playbackRate.value).toBe(1);
  });

  it('resumes audioContext when suspended', async () => {
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
    const resume = vi.fn(() => Promise.resolve());
    globalThis.audioContext = {
      currentTime: 0,
      createBufferSource,
      createGain,
      state: 'suspended',
      resume,
      destination: {},
    };

    playWithToneSampler(buffer, 100, 100, 0, 0.1, 0.2, 0.5);

    expect(resume).toHaveBeenCalled();
    await Promise.resolve();
  });
});
