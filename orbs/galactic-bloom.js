// Galactic Bloom: a space-themed, Euclidean-gated harmonic sequencer
// Visual intent: Milky Way/galaxy; Behavior: on incoming pulse (-1), advance
// an internal Euclidean pattern and, when an active step occurs, trigger
// Harmony-like chords using the Circle-of-Fifths engine and center instrument.

import { handleCirclePulse as handleCircleFifthsPulse, initCircleNode as initCircleFifthsNode, CIRCLE_FIFTHS_TYPE } from './circle-fifths.js';

export const GALACTIC_BLOOM_TYPE = 'galactic_bloom';
const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function wrapIndex(value, length = 12) {
  const n = Math.max(1, Math.floor(length || 1));
  return ((Math.floor(value) % n) + n) % n;
}

// Melodic progression patterns - define note order/movement, not scale
export const MELODIC_PATTERNS = {
  ascending: { name: 'Ascending', getNote: (dotIndex, totalDots) => dotIndex % 12 },
  descending: { name: 'Descending', getNote: (dotIndex, totalDots) => (11 - dotIndex) % 12 },
  pendulum: { name: 'Pendulum', getNote: (dotIndex, totalDots) => {
    const cycle = Math.floor(dotIndex / 12) % 2;
    return cycle === 0 ? dotIndex % 12 : (11 - (dotIndex % 12)) % 12;
  }},
  spiral: { name: 'Spiral Up', getNote: (dotIndex, totalDots) => (dotIndex * 7) % 12 },
  cascade: { name: 'Cascade Down', getNote: (dotIndex, totalDots) => (dotIndex * 5) % 12 },
  random: { name: 'Random Walk', getNote: (dotIndex, totalDots) => Math.floor(Math.random() * 12) },
  octaves: { name: 'Octave Jumps', getNote: (dotIndex, totalDots) => {
    const baseNote = dotIndex % 3;
    return (baseNote * 4) % 12;
  }},
  thirds: { name: 'Circle of Thirds', getNote: (dotIndex, totalDots) => (dotIndex * 3) % 12 },
  fourths: { name: 'Circle of Fourths', getNote: (dotIndex, totalDots) => (dotIndex * 5) % 12 },
  fifths: { name: 'Circle of Fifths', getNote: (dotIndex, totalDots) => (dotIndex * 7) % 12 },
  whole_tone: { name: 'Whole Tone', getNote: (dotIndex, totalDots) => (dotIndex * 2) % 12 },
  major_triad: { name: 'Major Triad Arp', getNote: (dotIndex, totalDots) => [0, 4, 7][dotIndex % 3] },
  minor_triad: { name: 'Minor Triad Arp', getNote: (dotIndex, totalDots) => [0, 3, 7][dotIndex % 3] },
  dom7_arp: { name: 'Dominant 7th Arp', getNote: (dotIndex, totalDots) => [0, 4, 7, 10][dotIndex % 4] },
  maj7_arp: { name: 'Major 7th Arp', getNote: (dotIndex, totalDots) => [0, 4, 7, 11][dotIndex % 4] },
  min7_arp: { name: 'Minor 7th Arp', getNote: (dotIndex, totalDots) => [0, 3, 7, 10][dotIndex % 4] },
  pentatonic: { name: 'Pentatonic Walk', getNote: (dotIndex, totalDots) => [0, 2, 4, 7, 9][dotIndex % 5] },
  blues: { name: 'Blues Walk', getNote: (dotIndex, totalDots) => [0, 3, 5, 6, 7, 10][dotIndex % 6] },
  lydian: { name: 'Lydian Mode', getNote: (dotIndex, totalDots) => [0, 2, 4, 6, 7, 9, 11][dotIndex % 7] },
  dorian: { name: 'Dorian Mode', getNote: (dotIndex, totalDots) => [0, 2, 3, 5, 7, 9, 10][dotIndex % 7] },
  zigzag: { name: 'Zigzag (±2/±1)', getNote: (dotIndex, totalDots) => {
    // Alternates +2, -1 steps cumulatively
    const pos = Math.floor((dotIndex + 1) / 2);
    const neg = Math.floor(dotIndex / 2);
    const sum = (pos * 2) + (neg * -1);
    return ((sum % 12) + 12) % 12;
  }},
  golden: { name: 'Golden Steps', getNote: (dotIndex, totalDots) => {
    // Cumulative Fibonacci increments modulo 12
    let a = 1, b = 1, acc = 0;
    for (let i = 0; i < dotIndex; i++) {
      acc += a;
      const next = a + b;
      a = b;
      b = next;
    }
    return ((acc % 12) + 12) % 12;
  }},
  tritone_bounce: { name: 'Tritone Bounce', getNote: (dotIndex, totalDots) => (dotIndex % 2 === 0 ? 0 : 6) },
  saw_repeat: { name: 'Saw x2 Repeat', getNote: (dotIndex, totalDots) => Math.floor(dotIndex / 2) % 12 },
  fractured: { name: 'Fractured Bloom', getNote: (dotIndex, totalDots) => {
    const leaps = [0, 7, 2, 10, 5, 9, 1, 8, 3, 11, 4, 6];
    return leaps[(dotIndex * 5 + Math.floor(dotIndex / 3)) % leaps.length];
  }},
  nebula: { name: 'Nebula Drift', getNote: (dotIndex, totalDots) => {
    const cloud = [0, 2, 7, 9, 4, 11, 5, 3, 10, 6, 1, 8];
    const wave = Math.floor((Math.sin(dotIndex * 1.7) + 1) * 2.5);
    return cloud[(dotIndex + wave) % cloud.length];
  }},
  sparse_orbit: { name: 'Sparse Orbit', getNote: (dotIndex, totalDots) => [0, 7, 10, 2, 5, 9][dotIndex % 6] },
};

export const GALACTIC_PRESETS = {
  bloom: {
    label: 'Bloom',
    values: {
      numSpokes: 5,
      numDots: 11,
      melodicPattern: 'fractured',
      noteProbability: 0.72,
      velMin: 0.34,
      velMax: 0.96,
      quantizedOffsetDenom: 17,
      freeOffset: 7,
      speedOffset: 5,
      spinRPS: 0.18,
      galacticRotationIndex: 5,
      spinSpeedScale: 0.9,
      swingAmount: 0.18,
      mutationAmount: 0.65,
      burstChance: 0.08,
      burstLimit: 1,
      minTriggerMs: 55,
      maxNotesPerSecond: 10,
      rotateOnTrigger: true,
    },
  },
  sparse: {
    label: 'Sparse',
    values: {
      numSpokes: 3,
      numDots: 8,
      melodicPattern: 'sparse_orbit',
      noteProbability: 0.42,
      velMin: 0.22,
      velMax: 0.82,
      quantizedOffsetDenom: 13,
      freeOffset: 8,
      speedOffset: -3,
      spinRPS: 0.09,
      galacticRotationIndex: 7,
      spinSpeedScale: 0.7,
      swingAmount: 0.24,
      mutationAmount: 0.45,
      burstChance: 0.02,
      burstLimit: 1,
      minTriggerMs: 90,
      maxNotesPerSecond: 6,
      rotateOnTrigger: true,
    },
  },
  cascade: {
    label: 'Cascade',
    values: {
      numSpokes: 7,
      numDots: 14,
      melodicPattern: 'nebula',
      noteProbability: 0.64,
      velMin: 0.26,
      velMax: 1,
      quantizedOffsetDenom: 23,
      freeOffset: 6,
      speedOffset: 8,
      spinRPS: 0.26,
      galacticRotationIndex: 4,
      spinSpeedScale: 1.15,
      swingAmount: 0.12,
      mutationAmount: 0.78,
      burstChance: 0.12,
      burstLimit: 2,
      minTriggerMs: 45,
      maxNotesPerSecond: 13,
      rotateOnTrigger: true,
    },
  },
  storm: {
    label: 'Storm',
    values: {
      numSpokes: 9,
      numDots: 16,
      melodicPattern: 'random',
      noteProbability: 0.55,
      velMin: 0.18,
      velMax: 1,
      quantizedOffsetDenom: 29,
      freeOffset: 9,
      speedOffset: 10,
      spinRPS: 0.34,
      galacticRotationIndex: 3,
      spinSpeedScale: 1.35,
      swingAmount: 0.32,
      mutationAmount: 0.95,
      burstChance: 0.18,
      burstLimit: 2,
      minTriggerMs: 38,
      maxNotesPerSecond: 16,
      rotateOnTrigger: true,
    },
  },
};

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
  const n = clamp(Math.floor(ap.numDots || 6), 1, 16);
  const qDen = Math.max(1, Math.floor(ap.quantizedOffsetDenom || 12));
  const freeAmt = clamp(ap.freeOffset ?? 3, 0, 10) / 10;
  const speedOffset = clamp(ap.speedOffset ?? 0, -10, 10) / 10;
  const mutation = clamp(ap.mutationAmount ?? 0.5, 0, 1);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n; // 0..1 radial ordering
    const arm = (i % Math.max(1, Math.floor(ap.numSpokes || 3))) / Math.max(1, Math.floor(ap.numSpokes || 3));
    const spiral = t * TAU * (1.25 + mutation * 1.4);
    const rJitter = (Math.random() - 0.5) * 0.16 * mutation;
    const r = clamp(0.12 + 0.78 * t + rJitter, 0.1, 0.92);
    const qStep = TAU / qDen;
    let ang = Math.floor((i % qDen)) * qStep + arm * qStep * mutation + spiral * 0.18;
    ang += (Math.random() - 0.5) * qStep * freeAmt * 2;
    const grad = (r - 0.5) * 2; // -1..1
    const direction = Math.random() < (0.12 + mutation * 0.26) ? -1 : 1;
    const speedWobble = 1 + (Math.random() - 0.5) * mutation * 0.8;
    const speed = direction * Math.max(0.08, (1 + speedOffset * grad) * speedWobble);
    dots.push({
      r,
      baseAngle: wrapAngle(ang),
      speed,
      noteOffset: Math.floor(Math.random() * 12),
      probability: clamp((ap.noteProbability ?? 0.7) + (Math.random() - 0.5) * mutation * 0.5, 0.08, 1),
      velocityBias: clamp(0.75 + (Math.random() - 0.5) * mutation, 0.15, 1.15),
      mutateFlip: Math.random() < mutation * 0.35,
    });
  }
  node._galDots = dots;
}

function normalizeGalacticArrays(node) {
  const ap = node.audioParams || {};
  const spokes = Math.max(1, Math.floor(ap.numSpokes || 3));
  if (!Array.isArray(ap.spokeEnabled) || ap.spokeEnabled.length !== spokes) {
    ap.spokeEnabled = Array(spokes).fill(true);
  }
  if (!Array.isArray(ap.spokeAngles) || ap.spokeAngles.length !== spokes) {
    const step = TAU / spokes;
    ap.spokeAngles = Array.from({ length: spokes }, (_, i) => wrapAngle(-Math.PI / 2 + i * step + (ap.spokeRotate || 0)));
  }
}

function getNowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

export function canTriggerGalacticNote(node, nowMs = getNowMs()) {
  if (!node) return false;
  const ap = node.audioParams || {};
  const minTriggerMs = clamp(ap.minTriggerMs ?? 55, 10, 500);
  const maxNotesPerSecond = Math.max(1, Math.floor(ap.maxNotesPerSecond ?? 10));
  const times = Array.isArray(node._galTriggerTimes) ? node._galTriggerTimes : [];
  const recent = times.filter((time) => nowMs - time < 1000);
  node._galTriggerTimes = recent;
  if (recent.length >= maxNotesPerSecond) return false;
  const last = Number.isFinite(node._galLastTriggerAt) ? node._galLastTriggerAt : -Infinity;
  if (nowMs - last < minTriggerMs) return false;
  recent.push(nowMs);
  node._galLastTriggerAt = nowMs;
  return true;
}

export function applyGalacticPreset(node, presetName = 'bloom', { randomize = false } = {}) {
  if (!node) return;
  node.audioParams = node.audioParams || {};
  const preset = GALACTIC_PRESETS[presetName] || GALACTIC_PRESETS.bloom;
  Object.assign(node.audioParams, preset.values);
  node.audioParams.galacticPreset = presetName;
  normalizeGalacticArrays(node);
  if (randomize) mutateGalacticBloom(node, node.audioParams.mutationAmount ?? 0.65);
  else buildDots(node);
}

export function mutateGalacticBloom(node, amount = 0.75) {
  if (!node) return;
  node.audioParams = node.audioParams || {};
  const ap = node.audioParams;
  const amt = clamp(amount, 0, 1);
  const spokes = Math.max(1, Math.floor(ap.numSpokes || 3));
  const step = TAU / spokes;
  ap.globalOffset = wrapAngle((ap.globalOffset || 0) + (Math.random() - 0.5) * TAU * (0.35 + amt));
  ap.spokeRotate = wrapAngle((ap.spokeRotate || 0) + (Math.random() - 0.5) * step * (0.5 + amt));
  ap.spokeAngles = Array.from({ length: spokes }, (_, i) => {
    const drift = (Math.random() - 0.5) * step * (0.25 + amt * 0.9);
    return wrapAngle(-Math.PI / 2 + i * step + ap.spokeRotate + drift);
  });
  ap.spokeEnabled = Array.from({ length: spokes }, () => Math.random() > 0.08 * amt);
  if (!ap.spokeEnabled.some(Boolean)) ap.spokeEnabled[Math.floor(Math.random() * spokes)] = true;
  node._galPhase = Math.random() * TAU;
  node.galaxyStep = Math.floor(Math.random() * 128);
  node.patternIndex = Math.floor(Math.random() * 12);
  buildDots(node);
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
  ap.spinRPS = ap.spinRPS ?? 0.18; // rotations per second for continuous mode
  ap.spinSyncEnabled = ap.spinSyncEnabled ?? true; // follow BPM when available
  ap.galacticRotationIndex = ap.galacticRotationIndex ?? 5; // Slower default than the old 1/4 option
  ap.spinSpeedScale = ap.spinSpeedScale ?? 0.9; // extra scaling for fine-tune (0.25..4)
  // Per-step probability and velocity range
  ap.noteProbability = ap.noteProbability ?? 0.72; // 0..1
  ap.velMin = ap.velMin ?? 0.34; // 0..1
  ap.velMax = ap.velMax ?? 0.96; // 0..1
  // Spokes/dots/offsets
  ap.galacticPreset = ap.galacticPreset ?? 'bloom';
  ap.numSpokes = ap.numSpokes ?? 5;
  ap.numDots = ap.numDots ?? 11;
  ap.melodicPattern = ap.melodicPattern ?? 'fractured';
  ap.quantizedOffsetDenom = ap.quantizedOffsetDenom ?? 17;
  ap.freeOffset = ap.freeOffset ?? 7; // 0-10 steps
  ap.speedOffset = ap.speedOffset ?? 5; // -10..10 steps
  ap.globalOffset = ap.globalOffset ?? 0.0; // radians
  ap.spokeRotate = ap.spokeRotate ?? 0.0; // radians
  ap.swingAmount = ap.swingAmount ?? 0.18;
  ap.mutationAmount = ap.mutationAmount ?? 0.65;
  ap.burstChance = ap.burstChance ?? 0.08;
  ap.burstLimit = ap.burstLimit ?? 1;
  ap.minTriggerMs = ap.minTriggerMs ?? 55;
  ap.maxNotesPerSecond = ap.maxNotesPerSecond ?? 10;
  ap.rotateOnTrigger = ap.rotateOnTrigger ?? true;
  // Per-spoke enable toggles (match number of spokes)
  if (!Array.isArray(ap.spokeEnabled) || ap.spokeEnabled.length !== ap.numSpokes) {
    ap.spokeEnabled = Array(ap.numSpokes).fill(true);
  }
  // Per-spoke absolute angles (0..2π). Default to evenly spaced starting from top (-π/2)
  if (!Array.isArray(ap.spokeAngles) || ap.spokeAngles.length !== ap.numSpokes) {
    const arr = [];
    const step = TAU / ap.numSpokes;
    for (let i = 0; i < ap.numSpokes; i++) arr.push(wrapAngle(-Math.PI / 2 + i * step + ap.spokeRotate));
    ap.spokeAngles = arr;
  }

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

  // Circle initialization above owns the embedded instrument, but it also sets
  // circle sequencer defaults. Restore Galactic behavior afterward.
  ap.ignoreGlobalSync = false;
  ap.spinSyncEnabled = true;
  ap.randomChordProbability = 0;
  ap.chordSpreadProb = 0.0;
  ap.chordType = 'auto';
  mutateGalacticBloom(newNode, ap.mutationAmount);
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
  const stepAngle = TAU / spokes;
  const stepBase = TAU / Math.max(5, Math.floor((ap.quantizedOffsetDenom || 17) * 0.9));
  const stepSwing = ((currentNode.galaxyStep || 0) % 2 === 0 ? 1 : -1) * clamp(ap.swingAmount ?? 0.18, 0, 0.75);
  const dPhi = stepBase * (1 + stepSwing);
  currentNode.galaxyStep = ((currentNode.galaxyStep || 0) + 1) % 4096;

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
  const segIndex = Math.floor(wrapAngle(newPhase + (ap.spokeRotate||0)) / (TAU/segs));
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
  const baseBurst = Math.max(1, Math.floor(ap.burstLimit ?? 1));
  const maxPerTick = Math.min(8, baseBurst + (Math.random() < (ap.burstChance ?? 0.16) ? baseBurst : 0));
  let count = 0;
  const selectedPattern = MELODIC_PATTERNS[ap.melodicPattern] || MELODIC_PATTERNS.fractured;
  const nowMs = getNowMs();
  
  // For each dot, check if it crossed any spoke
  for (let d = 0; d < dots.length; d++) {
    if (count >= maxPerTick) break;
    const dot = dots[d];
    
    // Calculate dot angle at previous and current phase (dots rotate)
    const dotA0 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * prevPhase;
    const dotA1 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * newPhase;
    const dot0 = wrapAngle(dotA0);
    const dot1 = wrapAngle(dotA1);
    
    // Check if this dot crossed any spoke
    for (let s = 0; s < spokes; s++) {
      if (ap.spokeEnabled && ap.spokeEnabled[s] === false) continue;
      
      // Spoke is stationary
      const spokeAngle = wrapAngle(ap.spokeAngles ? ap.spokeAngles[s] : ((ap.spokeRotate || 0) + s * stepAngle));
      
      // Check if rotating dot crossed this stationary spoke
      const crossed = dot1 >= dot0 ? (spokeAngle > dot0 && spokeAngle <= dot1) : (spokeAngle > dot0 || spokeAngle <= dot1);
      
      if (crossed) {
        // probability gate per crossing
        const p = clamp((apBefore.noteProbability ?? 0.72) * (dot.probability ?? 1), 0, 1);
        if (Math.random() > p) continue;
        
        // intensity
        const vmin = clamp(apBefore.velMin ?? 0.34, 0, 1);
        const vmax = Math.max(vmin, clamp(apBefore.velMax ?? 0.96, 0, 1));
        const vel = clamp((vmin + Math.random() * (vmax - vmin)) * (dot.velocityBias ?? 1), 0, 1);
        apBefore.pulseIntensity = vel;
        
        const phraseStep = (currentNode.patternIndex || 0) + d + (dot.mutateFlip ? s : 0);
        const dotSegment = selectedPattern.getNote(phraseStep, dots.length);
        currentNode.segmentIndex = wrapIndex(dotSegment + (dot.noteOffset || 0), segs);
        if (!canTriggerGalacticNote(currentNode, nowMs)) continue;
        handleCircleFifthsPulse(currentNode, incomingConnection, deps);
        count++;
        break; // Only trigger once per dot per tick
      }
    }
  }
  apBefore.randomChordProbability = prevProb;
  apBefore.pulseIntensity = prevIntensity;
  if (count > 0 && ap.rotateOnTrigger !== false) {
    currentNode.patternIndex = ((currentNode.patternIndex || 0) + 1 + Math.floor(Math.random() * 2)) % 4096;
  }
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
    const step = TAU / spokes;
    for (let i = 0; i < spokes; i++) arr.push(wrapAngle(-Math.PI / 2 + i * step + (ap.spokeRotate||0)));
    ap.spokeAngles = arr;
  }
  let spinRPS = Math.max(0, ap.spinRPS ?? 0.25);
  let usingSyncedRotation = false;
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
      usingSyncedRotation = true;
    }
  }
  const speedScale = usingSyncedRotation ? 1 : Math.max(0.05, Math.min(4, ap.spinSpeedScale ?? 1));
  const swing = Math.sin((node._galPhase || 0) * 0.5) * clamp(ap.swingAmount ?? 0.18, 0, 0.75);
  const dPhi = TAU * (spinRPS * speedScale) * Math.max(0, deltaTime) * (1 + swing);
  if (dPhi <= 0) return;

  const prevPhase = node._galPhase || 0;
  const newPhase = prevPhase + dPhi;
  node._galPhase = newPhase;

  // Visual glow target (do not flash every frame; set time only on crossings)
  const segs = node.segments || 12;
  const segIndex = Math.floor(wrapAngle(newPhase + (ap.spokeRotate || 0)) / (TAU / segs));
  node.segmentIndex = segIndex;

  if (!audioActive) return; // only visualize when transport paused

  // Trigger for each dot crossing a spoke between prevPhase and newPhase
  const prevProb = ap.randomChordProbability;
  ap.randomChordProbability = 0; // single notes
  let count = 0;
  const baseBurst = Math.max(1, Math.floor(ap.burstLimit ?? 1));
  const maxPerTick = Math.min(12, baseBurst + (Math.random() < (ap.burstChance ?? 0.16) ? baseBurst : 0));
  const nowMs = getNowMs();
  
  // For each rotating dot, check if it crossed any stationary spoke
  for (let d = 0; d < dots.length; d++) {
    if (count >= maxPerTick) break;
    const dot = dots[d];
    
    // Calculate dot angle at previous and current phase (dots rotate)
    const dotA0 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * prevPhase;
    const dotA1 = dot.baseAngle + (ap.globalOffset || 0) + dot.speed * newPhase;
    const dot0 = wrapAngle(dotA0);
    const dot1 = wrapAngle(dotA1);
    
    let crossedSpoke = null;
    // Check if this rotating dot crossed any stationary spoke
    for (let s = 0; s < spokes; s++) {
      if (ap.spokeEnabled[s] === false) continue;
      
      // Spoke is stationary
      const spokeAngle = wrapAngle(ap.spokeAngles ? ap.spokeAngles[s] : ((ap.spokeRotate || 0) + s * TAU / spokes));
      
      // Check if rotating dot crossed this stationary spoke
      const crossed = dot1 >= dot0 ? (spokeAngle > dot0 && spokeAngle <= dot1) : (spokeAngle > dot0 || spokeAngle <= dot1);
      
      if (crossed) {
        crossedSpoke = { spokeIndex: s, angle: spokeAngle };
        break; // Use first crossed spoke
      }
    }
    
    if (crossedSpoke) {
      // probability
      const p = clamp((ap.noteProbability ?? 0.72) * (dot.probability ?? 1), 0, 1);
      if (Math.random() > p) continue;
      
      // intensity
      const vmin = clamp(ap.velMin ?? 0.34, 0, 1);
      const vmax = Math.max(vmin, clamp(ap.velMax ?? 0.96, 0, 1));
      const vel = clamp((vmin + Math.random() * (vmax - vmin)) * (dot.velocityBias ?? 1), 0, 1);
      const prevIntensity = ap.pulseIntensity;
      ap.pulseIntensity = vel;
      
      // Each dot has its own musical content - use melodic pattern for note progression
      const selectedPattern = MELODIC_PATTERNS[ap.melodicPattern] || MELODIC_PATTERNS.fractured;
      const numDots = dots.length;
      
      // Get note from melodic pattern - this determines the harmonic progression/melody
      const phraseStep = (node.patternIndex || 0) + d + (dot.mutateFlip ? crossedSpoke.spokeIndex : 0);
      const dotSegment = selectedPattern.getNote(phraseStep, numDots);
      node.segmentIndex = wrapIndex(dotSegment + (dot.noteOffset || 0), segs);
      node.lastGlowSeg = node.segmentIndex;
      node.lastGlowAt = nowMs;
      if (Array.isArray(node._spokeGlow)) node._spokeGlow[crossedSpoke.spokeIndex] = nowMs;
      if (!canTriggerGalacticNote(node, nowMs)) {
        ap.pulseIntensity = prevIntensity;
        continue;
      }
      
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
  if (count > 0 && ap.rotateOnTrigger !== false) {
    node.patternIndex = ((node.patternIndex || 0) + 1 + Math.floor(Math.random() * 2)) % 4096;
  }
  ap.randomChordProbability = prevProb;
}
