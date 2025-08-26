import { describe, it, expect, vi } from 'vitest';
import { GridSequencer } from '../gridSequencer.js';

describe('GridSequencer', () => {
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
});
