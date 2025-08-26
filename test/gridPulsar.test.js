import { describe, it, expect, vi } from 'vitest';
import { GridPulsar } from '../pulsar.js';

describe('GridPulsar', () => {
  it('emits pulses for active cells as sequencer steps', () => {
    const grid = new GridPulsar(0, 0, 2, 2, { sync: false });
    const cb0 = vi.fn();
    const cb1 = vi.fn();
    grid.on(0, cb0);
    grid.on(1, cb1);
    grid.toggle(0, 1, true);
    grid.toggle(1, 0, true);

    grid.step();
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb0).not.toHaveBeenCalled();

    grid.step();
    expect(cb0).toHaveBeenCalledOnce();
    expect(cb1).toHaveBeenCalledOnce();
  });

  it('wraps around after last column', () => {
    const grid = new GridPulsar(0, 0, 1, 2, { sync: false });
    const cb = vi.fn();
    grid.on(0, cb);
    grid.toggle(0, 0, true);

    grid.step();
    expect(cb).toHaveBeenCalledOnce();

    grid.step();
    grid.step();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
