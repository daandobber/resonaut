import { describe, it, expect, vi, afterEach } from 'vitest';
import { GridSequencer } from '../gridSequencer.js';

describe('GridSequencer', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete globalThis.isGlobalSyncEnabled;
    delete globalThis.globalBPM;
  });

  it('emits pulses based on pattern', () => {
    vi.useFakeTimers();
    const seq = new GridSequencer(null, { rows: 2, columns: 4, interval: 100 });
    seq.setPattern([
      [true, false, false, true],
      [true, true, false, false],
    ]);
    const pulses = [];
    seq.on('pulse', (p) => pulses.push(p));
    seq.start();
    vi.advanceTimersByTime(400);
    seq.stop();
    expect(pulses).toEqual([
      { row: 0, column: 0 },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
      { row: 0, column: 3 },
    ]);
  });

  it('syncs interval to global BPM subdivisions', () => {
    vi.useFakeTimers();
    globalThis.isGlobalSyncEnabled = true;
    globalThis.globalBPM = 120; // 0.5s per beat
    const seq = new GridSequencer(null, {
      useGlobalSync: true,
      subdivision: 0.5, // eighth note
    });
    seq.start();
    expect(seq.interval).toBeCloseTo(250); // 0.25s
    seq.stop();
  });

  it('allows changing step count', () => {
    const seq = new GridSequencer(null, { rows: 1, columns: 4 });
    expect(seq.columns).toBe(4);
    seq.setSteps(6);
    expect(seq.columns).toBe(6);
    expect(seq.matrix[0]).toHaveLength(6);
  });
});
