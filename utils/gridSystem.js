/**
 * Grid-Based Coordinate System
 * Provides snap-to-grid functionality for canvas-based node placement
 */

// Canvas constraints
export const CANVAS_CONFIG = {
  MAX_WIDTH: 10240,
  MAX_HEIGHT: 10240,
  GRID_CELL_SIZE: 128, // Size of each grid cell in world units
};

// Derived grid properties
export const GRID_PROPERTIES = {
  COLS: Math.floor(CANVAS_CONFIG.MAX_WIDTH / CANVAS_CONFIG.GRID_CELL_SIZE) + 1,
  ROWS: Math.floor(CANVAS_CONFIG.MAX_HEIGHT / CANVAS_CONFIG.GRID_CELL_SIZE) + 1,
};

/**
 * Snap a coordinate to the nearest grid line intersection.
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {{x: number, y: number}} Snapped coordinates
 */
export function snapToGrid(x, y) {
  const cellX = Math.round(x / CANVAS_CONFIG.GRID_CELL_SIZE);
  const cellY = Math.round(y / CANVAS_CONFIG.GRID_CELL_SIZE);
  
  return {
    x: cellX * CANVAS_CONFIG.GRID_CELL_SIZE,
    y: cellY * CANVAS_CONFIG.GRID_CELL_SIZE,
  };
}

/**
 * Check if coordinates are snapped to grid (within tolerance)
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} tolerance - Tolerance in pixels (default: 1)
 * @returns {boolean}
 */
export function isSnappedToGrid(x, y, tolerance = 1) {
  const snapped = snapToGrid(x, y);
  return Math.abs(x - snapped.x) < tolerance && Math.abs(y - snapped.y) < tolerance;
}

/**
 * Get grid cell indices for coordinates
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {{gridX: number, gridY: number}} Grid cell indices
 */
export function getGridCell(x, y) {
  const gridX = Math.round(x / CANVAS_CONFIG.GRID_CELL_SIZE);
  const gridY = Math.round(y / CANVAS_CONFIG.GRID_CELL_SIZE);
  
  return {
    gridX: Math.max(0, Math.min(GRID_PROPERTIES.COLS - 1, gridX)),
    gridY: Math.max(0, Math.min(GRID_PROPERTIES.ROWS - 1, gridY)),
  };
}

/**
 * Get world coordinates for a grid cell
 * @param {number} gridX - Grid X index
 * @param {number} gridY - Grid Y index
 * @returns {{x: number, y: number}} World coordinates at grid intersection
 */
export function getCellCenter(gridX, gridY) {
  return {
    x: gridX * CANVAS_CONFIG.GRID_CELL_SIZE,
    y: gridY * CANVAS_CONFIG.GRID_CELL_SIZE,
  };
}

/**
 * Clamp coordinates within canvas bounds
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {{x: number, y: number}} Clamped coordinates
 */
export function clampToCanvas(x, y) {
  return {
    x: Math.max(0, Math.min(CANVAS_CONFIG.MAX_WIDTH, x)),
    y: Math.max(0, Math.min(CANVAS_CONFIG.MAX_HEIGHT, y)),
  };
}

/**
 * Snap and clamp coordinates in one operation
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @returns {{x: number, y: number}} Snapped and clamped coordinates
 */
export function snapAndClamp(x, y) {
  const snapped = snapToGrid(x, y);
  return clampToCanvas(snapped.x, snapped.y);
}

/**
 * Get all valid grid cell positions (useful for visualization)
 * @returns {Array<{x: number, y: number}>} Array of all grid intersections
 */
export function getAllGridCells() {
  const cells = [];
  for (let gridY = 0; gridY < GRID_PROPERTIES.ROWS; gridY++) {
    for (let gridX = 0; gridX < GRID_PROPERTIES.COLS; gridX++) {
      cells.push(getCellCenter(gridX, gridY));
    }
  }
  return cells;
}

/**
 * Get grid cells in a rectangular region
 * @param {number} minX - World min X
 * @param {number} minY - World min Y
 * @param {number} maxX - World max X
 * @param {number} maxY - World max Y
 * @returns {Array<{x: number, y: number}>} Grid cells within region
 */
export function getGridCellsInRegion(minX, minY, maxX, maxY) {
  const cells = [];
  const minGrid = getGridCell(minX, minY);
  const maxGrid = getGridCell(maxX, maxY);
  
  for (let gridY = minGrid.gridY; gridY <= maxGrid.gridY; gridY++) {
    for (let gridX = minGrid.gridX; gridX <= maxGrid.gridX; gridX++) {
      cells.push(getCellCenter(gridX, gridY));
    }
  }
  return cells;
}

/**
 * Distance between coordinates in grid cells
 * @param {number} x1 - First X coordinate
 * @param {number} y1 - First Y coordinate
 * @param {number} x2 - Second X coordinate
 * @param {number} y2 - Second Y coordinate
 * @returns {number} Distance in grid cells (Chebyshev distance)
 */
export function gridDistance(x1, y1, x2, y2) {
  const grid1 = getGridCell(x1, y1);
  const grid2 = getGridCell(x2, y2);
  return Math.max(
    Math.abs(grid1.gridX - grid2.gridX),
    Math.abs(grid1.gridY - grid2.gridY)
  );
}
