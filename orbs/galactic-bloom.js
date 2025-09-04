// Galactic Bloom: a space-themed, Euclidean-gated harmonic sequencer
// Visual intent: Milky Way/galaxy; Behavior: on incoming pulse (-1), advance
// an internal Euclidean pattern and, when an active step occurs, trigger
// Harmony-like chords using the Circle-of-Fifths engine and center instrument.

import { handleCirclePulse as handleCircleFifthsPulse, initCircleNode as initCircleFifthsNode, CIRCLE_FIFTHS_TYPE } from './circle-fifths.js';

export const GALACTIC_BLOOM_TYPE = 'galactic_bloom';

// Simple Bjorklund Euclidean pattern generator.
export function euclideanPattern(steps, pulses) {
  steps = Math.max(1, Math.floor(steps || 1));
  pulses = Math.max(0, Math.min(steps, Math.floor(pulses || 0)));
  if (pulses === 0) return Array(steps).fill(false);
  if (pulses === steps) return Array(steps).fill(true);
  // Distribute pulses as evenly as possible
  const pattern = [];
  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      pattern.push(true);
    } else {
      pattern.push(false);
    }
  }
  return pattern;
}

function rotateArray(arr, rotate) {
  if (!arr || !arr.length) return arr;
  const n = arr.length;
  const k = ((rotate % n) + n) % n;
  if (k === 0) return arr.slice();
  return arr.slice(n - k).concat(arr.slice(0, n - k));
}

// Build dot layout with quantized and free offsets + speed gradient.
function buildDots(node) {
  const ap = node.audioParams || {};
  const dots = [];
  const n = Math.max(1, Math.floor(ap.numDots || 6));
  const qDen = Math.max(1, Math.floor(ap.quantizedOffsetDenom || 12));
  const freeAmt = Math.max(0, Math.min(1, ap.freeOffset ?? 0.3));
  const speedOffset = Math.max(-1, Math.min(1, ap.speedOffset ?? 0));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n; // 0..1 radial ordering
    const r = 0.12 + 0.78 * t; // keep within ring
    const qStep = (Math.PI * 2) / qDen;
    let ang = Math.floor((i % qDen)) * qStep;
    ang += (Math.random() - 0.5) * qStep * freeAmt * 2;
    const grad = (r - 0.5) * 2; // -1..1
    const speed = 1 + speedOffset * grad;
    dots.push({ r, baseAngle: ang, speed });
  }
  node._galDots = dots;
}

// Initialize Galactic Bloom node. We embed a center instrument similar to the
// Circle-of-Fifths node and set Euclidean parameters.
export function initGalacticNode(newNode, deps) {
  const {
    DEFAULT_PULSE_INTENSITY,
    DEFAULT_SUBDIVISION_INDEX,
    DEFAULT_TRIGGER_INTERVAL,
    samplerWaveformTypes,
    SAMPLER_DEFINITIONS,
    addNode,
  } = deps;

  newNode.segments = 12; // for visualization arc indexing
  newNode.segmentIndex = 0;
  newNode.patternIndex = 0; // shared with circle engine if used
  newNode.galaxyStep = 0;   // Euclidean step index
  newNode.barIndex = 0;     // 8-bar trigger index
  newNode.audioParams = newNode.audioParams || {};
  const ap = newNode.audioParams;
  ap.pulseIntensity = ap.pulseIntensity ?? DEFAULT_PULSE_INTENSITY;
  ap.ignoreGlobalSync = false;
  ap.syncSubdivisionIndex = ap.syncSubdivisionIndex ?? DEFAULT_SUBDIVISION_INDEX;
  ap.triggerInterval = ap.triggerInterval ?? DEFAULT_TRIGGER_INTERVAL;
  ap.advanceOnPulse = ap.advanceOnPulse ?? false;
  // Harmony shaping reused from circle engine
  ap.randomChordProbability = ap.randomChordProbability ?? 0.6;
  // For Galactic Bloom we default to single notes (no explicit chords)
  ap.randomChordProbability = 0;
  ap.velocityJitter = ap.velocityJitter ?? 0.1;
  ap.chordSpreadProb = 0.0;
  ap.chordType = 'auto';
  // Simple visual spin speed (rad/s) for dot animation
  ap.spinSpeed = ap.spinSpeed ?? 0.4;
  ap.spinRPS = ap.spinRPS ?? 0.25; // rotations per second for continuous mode
  ap.spinSyncEnabled = ap.spinSyncEnabled ?? true; // follow BPM when available
  ap.galacticRotationIndex = ap.galacticRotationIndex ?? 3; // Default to "1/4" option
  ap.spinSpeedScale = ap.spinSpeedScale ?? 1.0; // extra scaling for fine-tune (0.25..4)
  // Per-step probability and velocity range
  ap.noteProbability = ap.noteProbability ?? 1.0; // 0..1
  ap.velMin = ap.velMin ?? 0.6; // 0..1
  ap.velMax = ap.velMax ?? 1.0; // 0..1
  // Spokes/dots/offsets
  ap.numSpokes = ap.numSpokes ?? 3;
  ap.numDots = ap.numDots ?? 6;
  ap.quantizedOffsetDenom = ap.quantizedOffsetDenom ?? 12;
  ap.freeOffset = ap.freeOffset ?? 0.3;
  ap.speedOffset = ap.speedOffset ?? 0.0; // -1..1
  ap.globalOffset = ap.globalOffset ?? 0.0; // radians
  ap.spokeRotate = ap.spokeRotate ?? 0.0; // radians
  // Per-spoke enable toggles (match number of spokes)
  if (!Array.isArray(ap.spokeEnabled) || ap.spokeEnabled.length !== ap.numSpokes) {
    ap.spokeEnabled = Array(ap.numSpokes).fill(true);
  }
  // Per-spoke absolute angles (0..2π). Default to evenly spaced starting from top (-π/2)
  if (!Array.isArray(ap.spokeAngles) || ap.spokeAngles.length !== ap.numSpokes) {
    const arr = [];
    const step = (Math.PI * 2) / ap.numSpokes;
    for (let i = 0; i < ap.numSpokes; i++) arr.push(((-Math.PI / 2 + i * step + ap.spokeRotate) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
    ap.spokeAngles = arr;
  }

  // Prebuild dots
  buildDots(newNode);

  // Embed an instrument in the center (reuse circle init to ensure same semantics)
  try {
    // We call the circle init to benefit from its robust instrument embedding
    // and center instrument wiring. This sets centerAttachedNodeId, etc.
    initCircleFifthsNode(newNode, {
      DEFAULT_PULSE_INTENSITY,
      DEFAULT_SUBDIVISION_INDEX,
      DEFAULT_TRIGGER_INTERVAL,
      samplerWaveformTypes,
      SAMPLER_DEFINITIONS,
      addNode,
    });
  } catch {
    // Fallback: if circle init fails for any reason, ensure at least a sampler is embedded
    let subtype = 'sampler_marimba';
    try {
      if (samplerWaveformTypes && samplerWaveformTypes.length) {
        const arr = samplerWaveformTypes.filter((s) => String(s.type || '').startsWith('sampler_'));
        if (arr.length) subtype = arr[Math.floor(Math.random() * arr.length)].type;
      }
      if (!subtype && SAMPLER_DEFINITIONS && SAMPLER_DEFINITIONS.length) {
        const def = SAMPLER_DEFINITIONS[Math.floor(Math.random() * SAMPLER_DEFINITIONS.length)];
        subtype = 'sampler_' + def.id;
      }
    } catch {}
    const embedded = addNode(newNode.x, newNode.y, 'sound', subtype, null);
    if (embedded) {
      ap.centerAttachedNodeId = embedded.id;
      embedded.isEmbeddedInCircleId = newNode.id; // reuse existing flag semantics
      embedded.audioParams = embedded.audioParams || {};
      embedded.audioParams.scaleIndex = 0; // lock to project root degree
    }
  }
}

// Handle incoming pulse: gate Circle-of-Fifths behavior with Euclidean rhythm
export function handleGalacticPulse(currentNode, incomingConnection, deps) {
  // Require left input (-1), same as circle-of-fifths
  if (!incomingConnection) return true;
  const isTargetSideA = incomingConnection.nodeAId === currentNode.id;
  const handleAtSequencer = isTargetSideA ? incomingConnection.nodeAHandle : incomingConnection.nodeBHandle;
  if (handleAtSequencer !== -1) return true;

  const ap = currentNode.audioParams || {};
  if (!Array.isArray(currentNode._galDots)) buildDots(currentNode);
  const dots = currentNode._galDots || [];
  const spokes = Math.max(1, Math.floor(ap.numSpokes || 3));
  const stepAngle = (Math.PI * 2) / spokes;
  const dPhi = (Math.PI * 2) / 16; // rotation per incoming pulse - 16 pulses per full rotation

  // Trigger bars
  const barIdx = Math.max(0, Math.floor(currentNode.barIndex || 0)) % 8;
  const bars = (ap.triggerBars) || [];
  const barOk = bars[barIdx] !== false;
  currentNode.barIndex = (barIdx + 1) % 8;

  const prevPhase = currentNode._galPhase || 0;
  const newPhase = prevPhase + dPhi;
  currentNode._galPhase = newPhase;

  // Visual glow target
  const segs = currentNode.segments || 12;
  const segIndex = Math.floor(((newPhase + (ap.spokeRotate||0)) % (Math.PI*2)) / ((Math.PI*2)/segs));
  currentNode.segmentIndex = segIndex;
  currentNode.lastGlowSeg = segIndex;
  currentNode.lastGlowAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

  if (!barOk) return true; // bar gate

  // Delegate actual harmonic triggering to the Circle-of-Fifths engine
  // Force single-note behavior by temporarily zeroing chord probability
  const apBefore = currentNode.audioParams || {};
  const prevProb = apBefore.randomChordProbability;
  const prevIntensity = apBefore.pulseIntensity;
  apBefore.randomChordProbability = 0; // single notes

  // Trigger for each rotating dot crossing a stationary spoke
  const maxPerTick = Math.min(8, Math.max(1, Math.floor(dots.length / 4)));
  let count = 0;
  const mod = (x) => ((x % (Math.PI*2)) + (Math.PI*2)) % (Math.PI*2);
  
  // For each dot, check if it crossed any spoke
  for (let d = 0; d < dots.length; d++) {
    if (count >= maxPerTick) break;
    const dot = dots[d];
    
    // Calculate dot angle at previous and current phase (dots rotate)
    const dotA0 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * prevPhase;
    const dotA1 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * newPhase;
    const dot0 = mod(dotA0);
    const dot1 = mod(dotA1);
    
    // Check if this dot crossed any spoke
    for (let s = 0; s < spokes; s++) {
      if (ap.spokeEnabled && ap.spokeEnabled[s] === false) continue;
      
      // Spoke is stationary
      const spokeAngle = mod(ap.spokeAngles ? ap.spokeAngles[s] : ((ap.spokeRotate || 0) + s * stepAngle));
      
      // Check if rotating dot crossed this stationary spoke
      const crossed = dot1 >= dot0 ? (spokeAngle > dot0 && spokeAngle <= dot1) : (spokeAngle > dot0 || spokeAngle <= dot1);
      
      if (crossed) {
        // probability gate per crossing
        const p = Math.max(0, Math.min(1, apBefore.noteProbability ?? 1));
        if (Math.random() > p) continue;
        
        // intensity
        const vmin = Math.max(0, Math.min(1, apBefore.velMin ?? 0.6));
        const vmax = Math.max(vmin, Math.min(1, apBefore.velMax ?? 1.0));
        const vel = vmin + Math.random() * (vmax - vmin);
        apBefore.pulseIntensity = vel;
        
        // Each dot can have its own musical content - for now use dot index to vary the note
        // Map dot index to degree bucket for different harmonic content per dot
        const dotSegment = d % segs;
        currentNode.segmentIndex = dotSegment;
        handleCircleFifthsPulse(currentNode, incomingConnection, deps);
        count++;
        break; // Only trigger once per dot per tick
      }
    }
  }
  apBefore.randomChordProbability = prevProb;
  apBefore.pulseIntensity = prevIntensity;
  return true;
}

export function rebuildGalacticDots(node) {
  buildDots(node);
}

// Continuous rotation update: advances phase every frame and triggers on spoke crossings
export function updateGalacticBloom(node, deltaTime, deps, { audioActive = true, secondsPerBeat = 0, isGlobalSyncEnabled = false, subdivisionOptions = [] } = {}) {
  if (!node || node.type !== GALACTIC_BLOOM_TYPE) return;
  const ap = node.audioParams || {};
  if (!Array.isArray(node._galDots)) buildDots(node);
  const dots = node._galDots || [];
  const spokes = Math.max(1, Math.floor(ap.numSpokes || 3));
  if (!Array.isArray(node._spokeGlow) || node._spokeGlow.length !== spokes) {
    node._spokeGlow = Array(spokes).fill(0);
  }
  if (!Array.isArray(ap.spokeEnabled) || ap.spokeEnabled.length !== spokes) {
    ap.spokeEnabled = Array(spokes).fill(true);
  }
  if (!Array.isArray(ap.spokeAngles) || ap.spokeAngles.length !== spokes) {
    const arr = [];
    const step = (Math.PI * 2) / spokes;
    for (let i = 0; i < spokes; i++) arr.push(((-Math.PI / 2 + i * step + (ap.spokeRotate||0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
    ap.spokeAngles = arr;
  }
  const stepAngle = (Math.PI * 2) / spokes; // used as fallback for activeSeg only
  let spinRPS = Math.max(0, ap.spinRPS ?? 0.25);
  if (isGlobalSyncEnabled && !ap.ignoreGlobalSync && ap.spinSyncEnabled) {
    // Custom rotation options for galactic bloom
    const galacticRotationOptions = [
      { label: "1/16", value: 0.25 },
      { label: "1/8", value: 0.5 },
      { label: "1/5", value: 0.8 },
      { label: "1/4", value: 1 },
      { label: "1/3", value: 4/3 },
      { label: "1/2", value: 2 },
      { label: "1", value: 4 },
      { label: "2", value: 8 },
      { label: "3", value: 12 },
      { label: "4", value: 16 },
      { label: "5", value: 20 },
      { label: "6", value: 24 },
      { label: "7", value: 28 },
      { label: "8", value: 32 },
      { label: "9", value: 36 },
      { label: "10", value: 40 }
    ];
    const idx = Math.max(0, Math.min(galacticRotationOptions.length - 1, ap.galacticRotationIndex ?? 3));
    const rotBeats = galacticRotationOptions[idx] && typeof galacticRotationOptions[idx].value === 'number' ? galacticRotationOptions[idx].value : 4; // default 4 beats/rotation
    if (secondsPerBeat > 0 && rotBeats > 0) {
      spinRPS = 1 / (secondsPerBeat * rotBeats);
    }
  }
  const speedScale = Math.max(0.05, Math.min(4, ap.spinSpeedScale ?? 1));
  const dPhi = 2 * Math.PI * (spinRPS * speedScale) * Math.max(0, deltaTime);
  if (dPhi <= 0) return;

  const prevPhase = node._galPhase || 0;
  const newPhase = prevPhase + dPhi;
  node._galPhase = newPhase;

  // Visual glow target (do not flash every frame; set time only on crossings)
  const segs = node.segments || 12;
  const segIndex = Math.floor(((newPhase + (ap.spokeRotate || 0)) % (Math.PI * 2)) / ((Math.PI * 2) / segs));
  node.segmentIndex = segIndex;

  if (!audioActive) return; // only visualize when transport paused

  // Trigger for each dot crossing a spoke between prevPhase and newPhase
  const prevProb = ap.randomChordProbability;
  ap.randomChordProbability = 0; // single notes
  const segAngle = (Math.PI * 2) / segs;
  let count = 0;
  const maxPerTick = Math.min(12, Math.max(1, Math.floor(dots.length / 3)));
  const mod = (x) => ((x % (Math.PI*2)) + (Math.PI*2)) % (Math.PI*2);
  const nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  
  // For each rotating dot, check if it crossed any stationary spoke
  for (let d = 0; d < dots.length; d++) {
    if (count >= maxPerTick) break;
    const dot = dots[d];
    
    // Calculate dot angle at previous and current phase (dots rotate)
    const dotA0 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * prevPhase;
    const dotA1 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * newPhase;
    const dot0 = mod(dotA0);
    const dot1 = mod(dotA1);
    
    let crossedSpoke = null;
    // Check if this rotating dot crossed any stationary spoke
    for (let s = 0; s < spokes; s++) {
      if (ap.spokeEnabled[s] === false) continue;
      
      // Spoke is stationary
      const spokeAngle = mod(ap.spokeAngles ? ap.spokeAngles[s] : ((ap.spokeRotate || 0) + s * (Math.PI * 2) / spokes));
      
      // Check if rotating dot crossed this stationary spoke
      const crossed = dot1 >= dot0 ? (spokeAngle > dot0 && spokeAngle <= dot1) : (spokeAngle > dot0 || spokeAngle <= dot1);
      
      if (crossed) {
        crossedSpoke = { spokeIndex: s, angle: spokeAngle };
        break; // Use first crossed spoke
      }
    }
    
    if (crossedSpoke) {
      // probability
      const p = Math.max(0, Math.min(1, ap.noteProbability ?? 1));
      if (Math.random() > p) continue;
      
      // intensity
      const vmin = Math.max(0, Math.min(1, ap.velMin ?? 0.6));
      const vmax = Math.max(vmin, Math.min(1, ap.velMax ?? 1.0));
      const vel = vmin + Math.random() * (vmax - vmin);
      const prevIntensity = ap.pulseIntensity;
      ap.pulseIntensity = vel;
      
      // Each dot has its own musical content - use dot index for different harmonic content
      const dotSegment = d % segs;
      node.segmentIndex = dotSegment;
      node.lastGlowSeg = node.segmentIndex;
      node.lastGlowAt = nowMs;
      if (Array.isArray(node._spokeGlow)) node._spokeGlow[crossedSpoke.spokeIndex] = nowMs;
      
      try {
        // Trigger directly through the Circle-of-Fifths engine (single-note)
        handleCircleFifthsPulse(
          node,
          { nodeAId: node.id, nodeAHandle: -1, nodeBId: node.id, nodeBHandle: 0, length: 0, id: -1, directional: true },
          deps,
        );
      } catch {}
      ap.pulseIntensity = prevIntensity;
      count++;
    }
  }
  ap.randomChordProbability = prevProb;
}
