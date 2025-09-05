import { lerp } from './mathUtils.js';

const CRANK_RADAR_PIVOT_OFFSET_FACTOR = 1.15;
const CRANK_RADAR_HANDLE_LENGTH_FACTOR = 0.5;
const SPACERADAR_ANGLE_OFFSET = -Math.PI / 2;

function getCrankRadarHandleGripPos(n) {
  const pivotRadius = n.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
  const handleLength = n.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
  const angle = (n.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
  const pivotX = n.x + Math.cos(angle) * pivotRadius;
  const pivotY = n.y + Math.sin(angle) * pivotRadius;
  const handleAngle = angle + Math.PI / 2;
  return {
    x: pivotX + Math.cos(handleAngle) * handleLength,
    y: pivotY + Math.sin(handleAngle) * handleLength,
  };
}

function getConnectionPoint(node, useHandle) {
  if (
    typeof useHandle === 'number' &&
    (node.type === 'grid_sequencer' || node.type === 'pulsar_grid' || node.type === 'circle_fifths' || node.type === 'galactic_bloom' || node.type === 'mother_shipp')
  ) {
    // Grid and Pulsar grid are rectangular; Circle-of-fifths is circular.
    if (node.type === 'circle_fifths' || node.type === 'galactic_bloom') {
      // Handle -1: left input; 0: center/right output
      const offset = 12;
      if (useHandle < 0) {
        return { x: node.x - offset, y: node.y };
      }
      return { x: node.x + offset, y: node.y };
    }
    if (node.type === 'mother_shipp') {
      // Left input (-1) and 8 turret outputs (0..7) at barrel tips
      const offset = 12;
      if (useHandle < 0) return { x: node.x - offset, y: node.y };
      const w = node.width || 520;
      const h = node.height || 340;
      const a = Math.max(40, (w * 0.42));
      const b = Math.max(30, (h * 0.36));
      const gunIdx = Math.max(0, Math.min(7, Math.floor(useHandle)));
      const gy = (idx) => node.y + (-1.5 + idx) * (b * 0.18);
      if (gunIdx < 4) {
        const gx = node.x - a * 0.85;
        const tipX = gx + a * 0.55;
        return { x: tipX, y: gy(gunIdx) };
      } else {
        const j = gunIdx - 4;
        const gx = node.x + a * 0.30;
        const tipX = gx + a * 0.55;
        return { x: tipX, y: gy(j) };
      }
    }
    const rectX = node.x - node.width / 2;
    const rectY = node.y - node.height / 2;
    // Special handle -1 for grid_sequencer left input
    if (node.type === 'grid_sequencer' && useHandle < 0) {
      const cyMid = rectY + node.height / 2;
      const cxLeft = rectX - 10;
      return { x: cxLeft, y: cyMid };
    }
    // Column handles for grid_sequencer (useHandle >= 1000)
    if (node.type === 'grid_sequencer' && useHandle >= 1000) {
      const colIndex = useHandle - 1000;
      const cols = node.cols || 8; // GRID_SEQUENCER_DEFAULT_COLS
      const border = 10; // GRID_SEQUENCER_DRAG_BORDER
      const innerX = rectX + border;
      const innerW = node.width - border * 2;
      const cx = innerX + (colIndex + 0.5) * innerW / cols;
      const cyBottom = rectY + node.height + 10;
      return { x: cx, y: cyBottom };
    }
    // Row handles for grid_sequencer (useHandle >= 0)
    const rows = node.rows || 4;
    const cy = rectY + (useHandle + 0.5) * node.height / rows;
    const cx =
      node.type === 'grid_sequencer'
        ? rectX + node.width + 10
        : rectX - 10; // matches drawing offset for connector dots
    return { x: cx, y: cy };
  }
  if (useHandle && node.type === 'crank_radar') {
    return getCrankRadarHandleGripPos(node);
  }
  if (node.type === 'motor_orb' || node.type === 'clockwork_orb') {
    const angle = node.angle || 0;
    return {
      x: node.x + Math.cos(angle) * node.radius,
      y: node.y + Math.sin(angle) * node.radius,
    };
  }
  return { x: node.x, y: node.y };
}

export const ONE_WAY_TYPE = 'one_way';

export function drawArrow(ctx, x, y, angle, size) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - Math.PI / 6) * size, y - Math.sin(angle - Math.PI / 6) * size);
  ctx.lineTo(x - Math.cos(angle + Math.PI / 6) * size, y - Math.sin(angle + Math.PI / 6) * size);
  ctx.closePath();
  ctx.fill();
}

export function getArrowPosition(nA, nB, conn, t = 0.5) {
  const pA = getConnectionPoint(nA, conn.nodeAHandle);
  const pB = getConnectionPoint(nB, conn.nodeBHandle);
  const midX = (pA.x + pB.x) / 2 + conn.controlPointOffsetX;
  const midY = (pA.y + pB.y) / 2 + conn.controlPointOffsetY;
  const x = lerp(lerp(pA.x, midX, t), lerp(midX, pB.x, t), t);
  const y = lerp(lerp(pA.y, midY, t), lerp(midY, pB.y, t), t);
  return { x, y };
}
