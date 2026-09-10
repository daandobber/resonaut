import { afterEach, describe, expect, it, vi } from 'vitest';
import { scheduleTransientVoice, stopTransientVoices, holdAudioParam } from '../utils/audioLifecycle.js';

afterEach(() => vi.useRealTimers());
describe('transient audio cleanup', () => {
  it('stops on the audio clock and disposes after the note even in an hour-old session', () => {
    vi.useFakeTimers();
    const owner = {}, source = { stop: vi.fn(), dispose: vi.fn() }, gain = { dispose: vi.fn() };
    scheduleTransientVoice(owner, [source], [gain], { currentTime: 3600 }, 3600.25);
    expect(source.stop).toHaveBeenCalledWith(3600.25);
    vi.advanceTimersByTime(301);
    expect(source.dispose).toHaveBeenCalledOnce();
    expect(gain.dispose).toHaveBeenCalledOnce();
    expect(owner.transientVoices.size).toBe(0);
  });
  it('releases every transient immediately when its node or project is removed', () => {
    vi.useFakeTimers();
    const owner = {}, sources = Array.from({length: 3}, () => ({ stop: vi.fn(), dispose: vi.fn() }));
    sources.forEach(source => scheduleTransientVoice(owner, [source], [], {currentTime: 100}, 104));
    stopTransientVoices(owner);
    expect(owner.transientVoices.size).toBe(0);
    vi.advanceTimersByTime(5000);
    sources.forEach(source => expect(source.dispose).toHaveBeenCalledOnce());
  });
  it('holds an envelope instead of injecting a zero-value discontinuity', () => {
    const param = { cancelAndHoldAtTime: vi.fn(), setValueAtTime: vi.fn() };
    holdAudioParam(param, 5);
    expect(param.cancelAndHoldAtTime).toHaveBeenCalledWith(5);
    expect(param.setValueAtTime).not.toHaveBeenCalled();
    const fallback = { value: 0.6, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn() };
    holdAudioParam(fallback, 5);
    expect(fallback.setValueAtTime).toHaveBeenCalledWith(0.6, 5);
  });
});
