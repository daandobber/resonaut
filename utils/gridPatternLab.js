// Pattern operations shared by the canvas player and the editor. No audio or DOM dependencies.
const wrap = (value, length) => ((value % length) + length) % length;
export const GRID_DIRECTIONS = ['forward', 'reverse', 'pingpong', 'random'];
export const GRID_PRESETS = {
  steady: { name: 'Steady', description: 'A four-on-the-floor foundation with offbeat accents.' },
  broken: { name: 'Broken', description: 'Syncopated kicks, backbeats and scattered hats.' },
  orbit: { name: 'Orbit', description: 'Interlocking Euclidean rhythms across the rows.' },
  sparse: { name: 'Space', description: 'A few carefully spaced triggers; room for long sounds.' },
};

export function copyGrid(grid, rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => !!grid?.[r]?.[c]));
}

export function euclideanRow(steps, hits, rotation = 0) {
  steps = Math.max(1, Math.min(32, Math.round(Number(steps) || 1)));
  hits = Math.max(0, Math.min(steps, Math.round(Number(hits) || 0)));
  rotation = Math.round(Number(rotation) || 0);
  return Array.from({ length: steps }, (_, i) => (wrap(i - rotation, steps) * hits) % steps < hits);
}

export function makeGridPreset(key, rows, cols) {
  const patterns = {
    steady: [[0, 4, 8, 12], [4, 12], [2, 6, 10, 14], [0, 10]],
    broken: [[0, 3, 10], [4, 12], [0, 2, 5, 6, 8, 10, 13, 14], [7, 15]],
  };
  return Array.from({ length: rows }, (_, r) => {
    if (key === 'orbit') return euclideanRow(cols, Math.max(1, Math.round(cols * [3 / 8, 1 / 4, 5 / 8, 1 / 8][r % 4])), r);
    if (key === 'sparse') return euclideanRow(cols, r % 2 ? 1 : Math.max(1, Math.round(cols / 8)), r * 3);
    return Array.from({ length: cols }, (_, c) => (patterns[key] || patterns.steady)[r % 4].includes(c % 16));
  });
}

export function rotateGrid(grid, amount) {
  return grid.map(row => row.map((_, i) => !!row[wrap(i - amount, row.length)]));
}

// Move existing hits rather than flooding a patch with extra triggers.
export function mutateGrid(grid, random = Math.random) {
  return grid.map(row => {
    const result = row.map(Boolean);
    const hits = row.flatMap((active, i) => active ? [i] : []);
    const rests = row.flatMap((active, i) => active ? [] : [i]);
    if (hits.length && rests.length) {
      result[hits[Math.floor(random() * hits.length)]] = false;
      result[rests[Math.floor(random() * rests.length)]] = true;
    }
    return result;
  });
}

export function getGridRowSettings(node, row) {
  const settings = node.audioParams?.gridLab?.rows?.[row];
  return {
    mute: !!settings?.mute,
    solo: !!settings?.solo,
    probability: Number.isFinite(settings?.probability) ? Math.max(0, Math.min(1, settings.probability)) : 1,
  };
}

export function isGridRowAudible(node, row) {
  const settings = getGridRowSettings(node, row);
  const hasSolo = Array.from({ length: node.rows || 4 }, (_, i) => getGridRowSettings(node, i).solo).some(Boolean);
  return !settings.mute && (!hasSolo || settings.solo);
}

// Resolve once per cell: every cable from a row receives the same probability decision.
export function getGridTriggerRows(node, column, random = Math.random) {
  const rows = [];
  for (let r = 0; r < (node.rows || 4); r++) {
    if (!node.grid?.[r]?.[column] || !isGridRowAudible(node, r)) continue;
    const probability = getGridRowSettings(node, r).probability;
    if (probability > 0 && (probability === 1 || random() < probability)) rows.push(r);
  }
  return rows;
}

// Playback direction is runtime state, deliberately excluded from saved pattern slots.
const playback = new WeakMap();
export function resetGridPlayback(node) {
  node.column = -1;
  playback.delete(node);
}

export function nextGridColumn(node, random = Math.random) {
  const cols = Math.max(1, node.cols || 8);
  const direction = node.audioParams?.gridLab?.direction || 'forward';
  const current = Number.isInteger(node.column) ? node.column : -1;
  let state = playback.get(node);
  if (!state || state.direction !== direction || state.cols !== cols) {
    state = { direction, cols, delta: 1 };
    playback.set(node, state);
  }
  if (direction === 'random') return Math.min(cols - 1, Math.floor(random() * cols));
  if (current < 0) return direction === 'reverse' ? cols - 1 : 0;
  if (direction === 'reverse') return wrap(current - 1, cols);
  if (direction === 'pingpong') {
    if (cols === 1) return 0;
    if (current >= cols - 1) state.delta = -1;
    if (current <= 0) state.delta = 1;
    return Math.max(0, Math.min(cols - 1, current + state.delta));
  }
  return wrap(current + 1, cols);
}

export function gridLabSettings(node) {
  node.audioParams ??= {};
  node.audioParams.gridLab ??= {};
  return node.audioParams.gridLab;
}

export function setGridRowSettings(node, row, patch) {
  const lab = gridLabSettings(node);
  lab.rows ??= [];
  lab.rows[row] = { ...getGridRowSettings(node, row), ...patch };
}

export function storeGridSlot(node, index) {
  if (!Number.isInteger(index) || index < 0 || index > 3) return false;
  const lab = gridLabSettings(node);
  lab.slots ??= [];
  lab.slots[index] = {
    grid: copyGrid(node.grid, node.rows || 4, node.cols || 8),
    rows: Array.from({ length: node.rows || 4 }, (_, r) => getGridRowSettings(node, r)),
    direction: lab.direction || 'forward',
  };
  return true;
}

export function recallGridSlot(node, index) {
  const slot = node.audioParams?.gridLab?.slots?.[index];
  if (!slot) return false;
  const lab = gridLabSettings(node);
  // Keep the current dimensions so connected row/column outputs stay in place.
  node.grid = copyGrid(slot.grid, node.rows || 4, node.cols || 8);
  lab.rows = (slot.rows || []).map(row => ({ ...row }));
  lab.direction = GRID_DIRECTIONS.includes(slot.direction) ? slot.direction : 'forward';
  resetGridPlayback(node);
  return true;
}
