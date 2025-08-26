import { describe, it, expect, vi } from 'vitest';
import { GridSequencer } from '../pulsar.js';
 
describe('GridSequencer', () => {
  it('triggers callbacks for active cells on each step', () => {
    const grid = new GridSequencer(0, 0, 2, 2, { sync: false });
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

  it('wraps around after the last column', () => {
    const grid = new GridSequencer(0, 0, 1, 2, { sync: false });
    const cb = vi.fn();
    grid.on(0, cb);
    grid.toggle(0, 0, true);

    grid.step();
    expect(cb).toHaveBeenCalledOnce();

    grid.step();
    grid.step();
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('sets matrix cells using column,row order', () => {
    const grid = new GridSequencer(0, 0, 2, 2, { sync: false });
    const setCell = vi.fn();
    grid.sequencer = { matrix: { set: { cell: setCell } } };

    grid.toggle(1, 0, true);

    expect(setCell).toHaveBeenCalledWith(0, 1, 1);
  });

  it('manually advances using next()', () => {
    const grid = new GridSequencer(0, 0, 1, 2, { sync: false });
    const cb = vi.fn();
    grid.on(0, cb);
    grid.toggle(0, 1, true);

    grid.next();
    expect(cb).not.toHaveBeenCalled();

    grid.next();
    expect(cb).toHaveBeenCalledOnce();
  });

  it('forces toggle on ctrl+click and prevents dragging', () => {
    const grid = new GridSequencer(0, 0, 2, 2, { sync: false });
    const listeners = {};
    const element = {
      addEventListener: (type, fn) => {
        listeners[type] = fn;
      },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    };
    grid.sequencer = { node: element };
    grid.bindCtrlToggle();

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    listeners['pointerdown']({
      ctrlKey: true,
      clientX: 75,
      clientY: 25,
      preventDefault,
      stopPropagation,
    });

    expect(grid.grid[0][1]).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();

    listeners['pointerdown']({
      ctrlKey: false,
      clientX: 25,
      clientY: 25,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });

    expect(grid.grid[0][0]).toBe(false);
  });
});
