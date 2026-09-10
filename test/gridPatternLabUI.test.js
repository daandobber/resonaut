// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGridPatternLab } from '../gridPatternLabUI.js';
import { copyGrid, getGridTriggerRows } from '../utils/gridPatternLab.js';

afterEach(() => document.body.replaceChildren());

describe('Pattern Lab editor', () => {
  function setup() {
    const node = { id: 7, rows: 4, cols: 8, grid: copyGrid([], 4, 8), audioParams: {} };
    const save = vi.fn();
    const editor = buildGridPatternLab(node, { onChange: save });
    document.body.append(editor);
    const click = key => document.getElementById(`grid-lab-7-${key}`).click();
    return { node, save, editor, click };
  }

  it('edits steps, saves and recalls patterns, and commits one undo entry per action', () => {
    const { node, save, editor, click } = setup();
    expect(editor.querySelector('[aria-label="Recall pattern A"]').disabled).toBe(true);
    click('cell-0-0');
    click('store-0');
    click('clear');
    expect(node.grid.flat().some(Boolean)).toBe(false);
    click('recall-0');
    expect(node.grid[0][0]).toBe(true);
    expect(save).toHaveBeenCalledTimes(4);
    expect(editor.querySelector('[role="status"]').textContent).toContain('Pattern A recalled');
  });

  it('connects mute, solo and chance controls to trigger decisions', () => {
    const { node, click } = setup();
    click('cell-0-0'); click('cell-1-0');
    click('solo-0');
    expect(getGridTriggerRows(node, 0)).toEqual([0]);
    const chance = document.getElementById('grid-lab-7-chance-0');
    chance.value = '0';
    chance.dispatchEvent(new Event('change', { bubbles: true }));
    expect(getGridTriggerRows(node, 0)).toEqual([]);
    click('solo-0'); click('mute-1');
    expect(getGridTriggerRows(node, 0)).toEqual([]);
  });

  it('retains keyboard focus when an edit refreshes the controls', () => {
    const { click } = setup();
    document.getElementById('grid-lab-7-cell-0-0').focus();
    click('cell-0-0');
    expect(document.activeElement.id).toBe('grid-lab-7-cell-0-0');
    expect(document.activeElement.getAttribute('aria-pressed')).toBe('true');
  });

  it('applies presets to multiple selected grids at their own dimensions', () => {
    const nodes = [8, 16].map((cols, id) => ({ id, rows: 4, cols, grid: copyGrid([], 4, cols), audioParams: {} }));
    const save = vi.fn();
    document.body.append(buildGridPatternLab(nodes[0], { getSelectedNodes: () => nodes, onChange: save }));
    document.getElementById('grid-lab-0-preset-orbit').click();
    expect(nodes.map(n => n.grid[0].length)).toEqual([8, 16]);
    expect(nodes.every(n => n.grid.flat().some(Boolean))).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
