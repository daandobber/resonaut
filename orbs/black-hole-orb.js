export const BLACK_HOLE_ORB_TYPE = 'black_hole_orb';

export const DEFAULT_BLACK_HOLE_PARAMS = {
  radius: 260,
  pull: 90,
  orbitSpeed: 0.85,
  orbitAspect: 1,
  orbitRotation: 0,
  syncSubdivisionIndex: 8,
  ignoreGlobalSync: false,
  damping: 0.92,
  maxSpeed: 360,
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getOrbitSpeed(params, syncContext) {
  if (
    syncContext?.isGlobalSyncEnabled &&
    !params.ignoreGlobalSync &&
    syncContext.globalBPM > 0 &&
    Array.isArray(syncContext.subdivisionOptions)
  ) {
    const index = params.syncSubdivisionIndex ?? DEFAULT_BLACK_HOLE_PARAMS.syncSubdivisionIndex;
    const subdiv = syncContext.subdivisionOptions[index];
    if (subdiv && typeof subdiv.value === 'number' && subdiv.value > 0) {
      const cycleSeconds = (60 / syncContext.globalBPM) * subdiv.value;
      if (cycleSeconds > 0) return 1 / cycleSeconds;
    }
  }
  return params.orbitSpeed ?? DEFAULT_BLACK_HOLE_PARAMS.orbitSpeed;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function updateBlackHoleOrb(node, dt, nodes, canAffectNode, syncContext = null) {
  if (!node || !Array.isArray(nodes) || dt <= 0) return;

  const params = node.audioParams || {};
  const radius = Math.max(80, params.radius ?? DEFAULT_BLACK_HOLE_PARAMS.radius);
  const pull = params.pull ?? DEFAULT_BLACK_HOLE_PARAMS.pull;
  const orbitSpeed = getOrbitSpeed(params, syncContext);
  const swirl = orbitSpeed * radius;
  const orbitAspect = clamp(params.orbitAspect ?? DEFAULT_BLACK_HOLE_PARAMS.orbitAspect, 0.25, 2.5);
  const orbitRotation = params.orbitRotation ?? DEFAULT_BLACK_HOLE_PARAMS.orbitRotation;
  const cos = Math.cos(orbitRotation);
  const sin = Math.sin(orbitRotation);
  const damping = Math.max(0.75, Math.min(0.99, params.damping ?? DEFAULT_BLACK_HOLE_PARAMS.damping));
  const maxSpeed = Math.max(60, params.maxSpeed ?? DEFAULT_BLACK_HOLE_PARAMS.maxSpeed);
  const eventHorizon = Math.max(18, node.radius * node.size * 0.75);

  node.accretionPhase = (node.accretionPhase || 0) + dt * (0.45 + Math.abs(orbitSpeed) * 1.5);

  nodes.forEach((target) => {
    if (!target || target === node || !canAffectNode(target)) return;

    const dx = target.x - node.x;
    const dy = target.y - node.y;
    const lx = dx * cos + dy * sin;
    const ly = -dx * sin + dy * cos;
    const sx = lx / orbitAspect;
    const sy = ly * orbitAspect;
    const shapedDist = Math.hypot(sx, sy);
    if (!isFiniteNumber(shapedDist) || shapedDist < 0.001 || shapedDist > radius) return;

    const shapedNx = sx / shapedDist;
    const shapedNy = sy / shapedDist;
    let normalLocalX = shapedNx / orbitAspect;
    let normalLocalY = shapedNy * orbitAspect;
    const normalLen = Math.hypot(normalLocalX, normalLocalY) || 1;
    normalLocalX /= normalLen;
    normalLocalY /= normalLen;

    const nx = normalLocalX * cos - normalLocalY * sin;
    const ny = normalLocalX * sin + normalLocalY * cos;
    const tx = -ny;
    const ty = nx;
    const falloff = Math.pow(1 - shapedDist / radius, 1.35);
    const closePush = shapedDist < eventHorizon ? (eventHorizon - shapedDist) / eventHorizon : 0;

    target.blackHoleVx = (target.blackHoleVx || 0) * damping;
    target.blackHoleVy = (target.blackHoleVy || 0) * damping;
    target.blackHoleVx += ((tx * swirl - nx * pull) * falloff + nx * closePush * pull * 2.2) * dt;
    target.blackHoleVy += ((ty * swirl - ny * pull) * falloff + ny * closePush * pull * 2.2) * dt;

    const speed = Math.hypot(target.blackHoleVx, target.blackHoleVy);
    if (speed > maxSpeed) {
      target.blackHoleVx = (target.blackHoleVx / speed) * maxSpeed;
      target.blackHoleVy = (target.blackHoleVy / speed) * maxSpeed;
    }

    target.x += target.blackHoleVx * dt;
    target.y += target.blackHoleVy * dt;
  });
}
