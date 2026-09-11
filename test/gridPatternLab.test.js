import { describe, it, expect } from 'vitest';
import {
  copyGrid, euclideanRow, makeGridPreset, rotateGrid, mutateGrid,
  getGridTriggerRows, setGridRowSettings, nextGridColumn, resetGridPlayback,
  storeGridSlot, recallGridSlot,
} from '../utils/gridPatternLab.js';

const gridNode = (cols = 8) => ({ rows: 4, cols, column: -1, grid: copyGrid([], 4, cols), audioParams: {} });
const play = (node, count) => Array.from({ length: count }, () => (node.column = nextGridColumn(node)));

describe('Grid Pattern Lab rhythm generation', () => {
  it('evenly distributes every possible hit count, including silence and full rows', () => {
    for (let steps = 1; steps <= 32; steps++) {
      for (let hits = 0; hits <= steps; hits++) {
        const pattern = euclideanRow(steps, hits);
        expect(pattern).toHaveLength(steps);
        const indices = pattern.flatMap((hit, i) => hit ? [i] : []);
        expect(indices).toHaveLength(hits);
        if (hits > 1) {
          const gaps = indices.map((pos, i) => ((indices[(i + 1) % hits] - pos + steps) % steps));
          expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('rotates in either direction without changing the original', () => {
    const original = [[true, false, false, false]];
    expect(rotateGrid(original, 1)).toEqual([[false, true, false, false]]);
    expect(rotateGrid(original, -1)).toEqual([[false, false, false, true]]);
    expect(euclideanRow(4, 1, -1)).toEqual([false, false, false, true]);
    expect(original).toEqual([[true, false, false, false]]);
  });

  it('varies patterns while preserving each row hit count and leaving input untouched', () => {
    const original = [[true, false, true, false], [false, false], [true, true]];
    const changed = mutateGrid(original, () => 0);
    expect(changed[0]).toEqual([false, true, true, false]);
    expect(changed.map(r => r.filter(Boolean).length)).toEqual([2, 0, 2]);
    expect(original[0]).toEqual([true, false, true, false]);
  });

  it.each(['steady', 'broken', 'orbit', 'sparse'])('builds %s presets for short and long grids', key => {
    for (const cols of [1, 7, 8, 16, 32]) {
      const pattern = makeGridPreset(key, 4, cols);
      expect(pattern).toHaveLength(4);
      expect(pattern.every(row => row.length === cols)).toBe(true);
      expect(pattern.flat().some(Boolean)).toBe(true);
    }
  });
});

describe('Grid playback', () => {
  it.each([
    ['forward', [0, 1, 2, 3, 0, 1, 2]],
    ['reverse', [3, 2, 1, 0, 3, 2, 1]],
    ['pingpong', [0, 1, 2, 3, 2, 1, 0]],
  ])('plays %s and resets to the correct first step', (direction, expected) => {
    const node = gridNode(4);
    node.audioParams.gridLab = { direction };
    expect(play(node, 7)).toEqual(expected);
    resetGridPlayback(node);
    expect(play(node, 7)).toEqual(expected);
  });

  it('handles one-step ping-pong and resized grids without invalid columns', () => {
    const node = gridNode(4);
    node.audioParams.gridLab = { direction: 'pingpong' };
    play(node, 4);
    node.cols = 1;
    expect(play(node, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('supports deterministic random movement for testing', () => {
    const node = gridNode(8);
    node.audioParams.gridLab = { direction: 'random' };
    expect(nextGridColumn(node, () => 0)).toBe(0);
    expect(nextGridColumn(node, () => 0.999)).toBe(7);
  });

  it('preserves legacy playback and applies mute, solo and chance to row and column eligibility', () => {
    const node = gridNode();
    node.grid.forEach(row => { row[0] = true; });
    expect(getGridTriggerRows(node, 0)).toEqual([0, 1, 2, 3]);
    setGridRowSettings(node, 0, { mute: true });
    setGridRowSettings(node, 1, { probability: 0 });
    expect(getGridTriggerRows(node, 0, () => 0)).toEqual([2, 3]);
    setGridRowSettings(node, 2, { solo: true, probability: 0.5 });
    expect(getGridTriggerRows(node, 0, () => 0.49)).toEqual([2]);
    expect(getGridTriggerRows(node, 0, () => 0.5)).toEqual([]);
    setGridRowSettings(node, 2, { mute: true });
    expect(getGridTriggerRows(node, 0)).toEqual([]);
    expect(getGridTriggerRows(node, 1)).toEqual([]);
  });
});

describe('Pattern memory', () => {
  it('round-trips through JSON and recalls independent copies with direction and row settings', () => {
    const node = gridNode();
    node.grid = makeGridPreset('orbit', 4, 8);
    node.audioParams.gridLab = { direction: 'reverse' };
    setGridRowSettings(node, 1, { probability: 0.6, mute: true });
    storeGridSlot(node, 0);
    const saved = JSON.parse(JSON.stringify(node));
    saved.grid[0].fill(false);
    saved.audioParams.gridLab.direction = 'random';
    expect(recallGridSlot(saved, 0)).toBe(true);
    expect(saved.grid).toEqual(node.grid);
    expect(saved.audioParams.gridLab.direction).toBe('reverse');
    expect(saved.audioParams.gridLab.rows[1]).toMatchObject({ probability: 0.6, mute: true });
    saved.grid[0].fill(false);
    saved.audioParams.gridLab.rows[1].probability = 0;
    expect(saved.audioParams.gridLab.slots[0].grid).toEqual(node.grid);
    expect(saved.audioParams.gridLab.slots[0].rows[1].probability).toBe(0.6);
  });

  it('fits stored patterns to current dimensions without moving cable outputs', () => {
    const node = gridNode(4);
    node.grid[0] = [true, false, false, true];
    storeGridSlot(node, 0);
    node.cols = 6;
    recallGridSlot(node, 0);
    expect(node.cols).toBe(6);
    expect(node.grid[0]).toEqual([true, false, false, true, false, false]);
    node.cols = 2;
    recallGridSlot(node, 0);
    expect(node.grid[0]).toEqual([true, false]);
    expect(recallGridSlot(node, 1)).toBe(false);
    expect(storeGridSlot(node, 4)).toBe(false);
  });
});
