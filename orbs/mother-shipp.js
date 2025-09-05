// Mother Shipp: 8-gun Euclidean pulse sequencer driven by external clock
// Visual: a large mothership with 8 turrets that flash and fire on steps.

export const MOTHER_SHIPP_TYPE = 'mother_shipp';

export const DEFAULT_MOTHER_SHIPP_PARAMS = {
  // Global track length (steps the ship advances through)
  trackLength: 16,
  // Per-gun loop configs (length/pulses/offset)
  guns: Array.from({ length: 8 }, (_, i) => ({
    loopLength: 16,
    pulses: (i % 4) + 2, // 2..5 pulses by default, varied
    offset: i,           // staggered offsets for motion
  })),
  // Probabilistic accenting (not used for routing, but kept for future)
  accentProb: 0.25,
  // Visual settings
  glowHoldMs: 180,
  ignoreGlobalSync: true,
};

// Basic Euclidean generator: returns a boolean array of length `steps` with `pulses` distributed.
export function euclid(steps, pulses) {
  steps = Math.max(1, Math.floor(steps || 1));
  pulses = Math.max(0, Math.min(steps, Math.floor(pulses || 0)));
  if (pulses === 0) return Array(steps).fill(false);
  if (pulses === steps) return Array(steps).fill(true);
  const out = [];
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      out.push(true);
    } else {
      out.push(false);
    }
  }
  return out;
}

function rotatePattern(arr, k) {
  if (!arr || arr.length === 0) return [];
  const n = arr.length;
  const r = ((k % n) + n) % n;
  if (r === 0) return arr.slice();
  return arr.slice(n - r).concat(arr.slice(0, n - r));
}

// Build final track pattern of length `trackLength` from a loop of `loopLength` with `pulses` and `offset`.
// Matches the Midibox ERG description semantics summarized in the user brief.
export function buildMotherShippTrack(trackLength, loopLength, pulses, offset) {
  const tl = Math.max(1, Math.floor(trackLength || 1));
  const ll = Math.max(1, Math.floor(loopLength || 1));
  const base = euclid(ll, pulses || 0);
  const rotated = rotatePattern(base, offset || 0);
  // If loop shorter than track -> repeat rotated loop to fill track
  // If loop longer than track -> truncate rotated loop to track length
  const out = new Array(tl);
  if (ll <= tl) {
    for (let i = 0; i < tl; i++) out[i] = !!rotated[i % ll];
  } else {
    for (let i = 0; i < tl; i++) out[i] = !!rotated[i];
  }
  return out;
}

function ensurePatterns(node) {
  const ap = node.audioParams || (node.audioParams = {});
  const params = { ...DEFAULT_MOTHER_SHIPP_PARAMS, ...ap };
  const guns = Array.isArray(params.guns) && params.guns.length === 8
    ? params.guns
    : DEFAULT_MOTHER_SHIPP_PARAMS.guns;
  const tl = Math.max(1, params.trackLength || 16);
  const tracks = [];
  for (let i = 0; i < 8; i++) {
    const g = guns[i] || guns[0];
    tracks[i] = buildMotherShippTrack(tl, g.loopLength, g.pulses, g.offset);
  }
  node._ms_tracks = tracks;
  node._ms_trackLen = tl;
}

export function initMotherShippNode(newNode) {
  newNode.width = newNode.width || 520;
  newNode.height = newNode.height || 340;
  newNode.segments = 8; // 8 guns
  newNode.segmentIndex = 0;
  if (!newNode.audioParams) newNode.audioParams = {};
  // Merge defaults without overwriting explicit values
  Object.keys(DEFAULT_MOTHER_SHIPP_PARAMS).forEach((k) => {
    if (newNode.audioParams[k] === undefined) newNode.audioParams[k] = DEFAULT_MOTHER_SHIPP_PARAMS[k];
  });
  newNode._ms_step = 0;
  newNode._ms_gunGlow = Array(8).fill(0);
  newNode._ms_spin = 0;
  ensurePatterns(newNode);
}

// On any incoming pulse, advance one step and fire guns whose patterns are active.
export function handleMotherShippPulse(currentNode, incomingConnection, deps) {
  const { connections, findNodeById, DELAY_FACTOR, createVisualPulse, propagateTrigger, DEFAULT_PULSE_INTENSITY } = deps || {};
  if (!currentNode) return true;
  if (!Array.isArray(currentNode._ms_tracks)) ensurePatterns(currentNode);
  const tl = currentNode._ms_trackLen || 16;
  const step = currentNode._ms_step = (currentNode._ms_step + 1) % tl;
  const tracks = currentNode._ms_tracks || [];
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const ap = currentNode.audioParams || {};
  const glowHold = Math.max(50, Math.min(2000, ap.glowHoldMs || DEFAULT_MOTHER_SHIPP_PARAMS.glowHoldMs));

  for (let gun = 0; gun < 8; gun++) {
    if (tracks[gun] && tracks[gun][step]) {
      // Flash gun glow
      if (!Array.isArray(currentNode._ms_gunGlow)) currentNode._ms_gunGlow = Array(8).fill(0);
      currentNode._ms_gunGlow[gun] = now + glowHold;

      // Emit on connector handle = gun index
      if (Array.isArray(connections)) {
        connections.forEach((c) => {
          const matchA = (c.nodeAId === currentNode.id && c.nodeAHandle === gun);
          const matchB = (!c.directional && c.nodeBId === currentNode.id && c.nodeBHandle === gun);
          if (matchA || matchB) {
            const targetId = c.nodeAId === currentNode.id ? c.nodeBId : c.nodeAId;
            const neighbor = findNodeById && findNodeById(targetId);
            if (neighbor) {
              const travelTime = (DELAY_FACTOR ? c.length * DELAY_FACTOR : 0);
              try {
                createVisualPulse && createVisualPulse(c.id, travelTime, currentNode.id, Infinity, 'trigger', null, ap.pulseIntensity ?? DEFAULT_PULSE_INTENSITY);
              } catch {}
              try {
                propagateTrigger && propagateTrigger(
                  neighbor,
                  travelTime,
                  (now % 1e9) + Math.random(),
                  currentNode.id,
                  Infinity,
                  { type: 'trigger', data: { gun } },
                  c,
                );
              } catch {}
            }
          }
        });
      }
    }
  }
  return true;
}

export function updateMotherShipp(node, deltaTime) {
  if (!node || node.type !== MOTHER_SHIPP_TYPE) return;
  // Gentle breathing/rotation for ambient motion
  node._ms_spin = (node._ms_spin || 0) + Math.max(0, deltaTime) * 0.3;
}

