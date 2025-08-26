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
  if (typeof useHandle === 'number' && (node.type === 'grid_sequencer' || node.type === 'pulsar_grid')) {
    const rows = node.rows || 4;
    const rectX = node.x - node.width / 2;
    const rectY = node.y - node.height / 2;
    const cy = rectY + (useHandle + 0.5) * node.height / rows;
    const cx = rectX - 10;
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
