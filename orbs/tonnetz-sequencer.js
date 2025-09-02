// Tonnetz Sequencer module: hexagonal harmonic network sequencer
// Based on Tonnetz (tone network) theory for intuitive harmonic navigation

export const TONNETZ_TYPE = 'tonnetz_sequencer';

// Define the Tonnetz grid structure - hexagonal layout with triangular cells
export const TONNETZ_GRID = {
  // Each position [x, y] maps to a note class (0-11, C=0)
  // Layout follows standard Tonnetz: horizontally = fifths, diagonally = thirds
  positions: new Map([
    // Center area (key of C major/A minor region)
    [[0, 0], 0],   // C
    [[1, 0], 7],   // G  
    [[-1, 0], 5],  // F
    [[0, 1], 4],   // E
    [[1, 1], 11],  // B
    [[-1, 1], 9],  // A
    [[0, -1], 8],  // Ab
    [[1, -1], 3],  // Eb
    [[-1, -1], 1], // Db
    
    // Extended positions for richer harmonic space
    [[2, 0], 2],   // D
    [[-2, 0], 10], // Bb
    [[0, 2], 1],   // Db
    [[2, 1], 6],   // F#
    [[-2, 1], 4],  // E
    [[2, -1], 10], // Bb
    [[-2, -1], 6], // F#
    [[1, 2], 8],   // Ab
    [[-1, 2], 3],  // Eb
    [[1, -2], 5],  // F
    [[-1, -2], 0], // C
  ])
};

// Define triangular cells (triads) within the hexagonal grid
export const TONNETZ_TRIADS = [
  // Major triads (pointing up)
  { vertices: [[0, 0], [1, 0], [0, 1]], type: 'major', root: 0 },    // C major
  { vertices: [[1, 0], [2, 0], [1, 1]], type: 'major', root: 7 },    // G major  
  { vertices: [[-1, 0], [0, 0], [-1, 1]], type: 'major', root: 5 },  // F major
  { vertices: [[0, -1], [1, -1], [0, 0]], type: 'major', root: 8 },  // Ab major
  
  // Minor triads (pointing down)
  { vertices: [[0, 0], [0, 1], [-1, 1]], type: 'minor', root: 9 },   // A minor
  { vertices: [[1, 0], [1, 1], [0, 1]], type: 'minor', root: 4 },    // E minor
  { vertices: [[-1, 0], [-1, 1], [-2, 1]], type: 'minor', root: 2 }, // D minor
  { vertices: [[0, -1], [0, 0], [-1, 0]], type: 'minor', root: 1 },  // C# minor
];

export const TONNETZ_PRESETS = {
  'Classical': { 
    sequencingMode: 'triad', 
    chordProbability: 0.8,
    harmonicSpread: 0.3,
    velocityJitter: 0.1,
    stepSize: 1,
    transformProbability: 0.2,
    returnProbability: 0.1
  },
  'Jazz': { 
    sequencingMode: 'neo_riemannian', 
    chordProbability: 0.9,
    harmonicSpread: 0.6,
    velocityJitter: 0.3,
    stepSize: 2,
    transformProbability: 0.6,
    returnProbability: 0.2
  },
  'Minimal': { 
    sequencingMode: 'hexagon_walk', 
    chordProbability: 0.4,
    harmonicSpread: 0.1,
    velocityJitter: 0.05,
    stepSize: 1,
    transformProbability: 0.1,
    returnProbability: 0.3
  },
  'Experimental': { 
    sequencingMode: 'random_walk',
    chordProbability: 0.7,
    harmonicSpread: 0.8,
    velocityJitter: 0.4,
    stepSize: 3,
    transformProbability: 0.8,
    returnProbability: 0.05
  },
};

// Initialize Tonnetz sequencer node
export function initTonnetzNode(newNode, deps) {
  const {
    samplerWaveformTypes,
    SAMPLER_DEFINITIONS,
    addNode,
    DEFAULT_PULSE_INTENSITY,
    DEFAULT_SUBDIVISION_INDEX,
    DEFAULT_TRIGGER_INTERVAL,
  } = deps;

  newNode.gridSize = 5; // 5x5 hexagonal grid
  newNode.currentPos = { x: 0, y: 0 }; // Start at center (C)
  newNode.initialPos = { x: 0, y: 0 }; // Remember starting position for sequence restart
  newNode.patternIndex = 0;
  newNode.sequenceStartTime = Date.now(); // Track sequence timing
  newNode.audioParams = newNode.audioParams || {};
  
  const ap = newNode.audioParams;
  ap.pulseIntensity = ap.pulseIntensity ?? DEFAULT_PULSE_INTENSITY;
  ap.ignoreGlobalSync = true;
  ap.syncSubdivisionIndex = DEFAULT_SUBDIVISION_INDEX;
  ap.triggerInterval = DEFAULT_TRIGGER_INTERVAL;
  
  // Tonnetz-specific parameters
  ap.sequenceMode = ap.sequenceMode || 'triad';
  ap.direction = ap.direction || 'chromatic_mediant';
  ap.triadPattern = ap.triadPattern || 'major,minor';
  ap.stepPattern = ap.stepPattern || '1';
  ap.transformations = ap.transformations || 'P,L,R'; // Neo-Riemannian
  ap.chordProbability = ap.chordProbability ?? 0.7;
  ap.chordSize = ap.chordSize || 3;
  ap.velocityJitter = ap.velocityJitter ?? 0.2;
  ap.harmonicSpread = ap.harmonicSpread ?? 0.3;
  ap.preset = ap.preset || 'Classical';
  
  // Sequence control parameters
  ap.sequenceLength = ap.sequenceLength || 8; // How many steps before restart
  
  // Apply preset if set
  if (TONNETZ_PRESETS[ap.preset]) {
    Object.assign(ap, TONNETZ_PRESETS[ap.preset]);
    // Map sequencingMode to sequenceMode for compatibility
    if (ap.sequencingMode) {
      ap.sequenceMode = ap.sequencingMode;
    }
  }

  // Embed a center instrument (similar to circle of fifths)
  let subtype = null;
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
  
  subtype = subtype || 'sampler_marimba';
  const embedded = addNode(newNode.x, newNode.y, 'sound', subtype, null);
  if (embedded) {
    ap.centerAttachedNodeId = embedded.id;
    embedded.isEmbeddedInTonnetzId = newNode.id;
    try {
      embedded.audioParams = embedded.audioParams || {};
      embedded.audioParams.scaleIndex = 0; // lock center instrument to project root degree
    } catch {}
  }
}

// Handle pulse to Tonnetz sequencer
export function handleTonnetzPulse(currentNode, incomingConnection, deps) {
  // console.log('🎵 handleTonnetzPulse called for node', currentNode.id);
  const {
    findNodeById,
    triggerNodeEffect,
    MIN_SCALE_INDEX,
    MAX_SCALE_INDEX,
  } = deps;

  // Accept pulse input from any handle (more flexible)
  if (!incomingConnection) {
    console.log('Tonnetz: No incoming connection');
    return true;
  }
  const isTargetSideA = incomingConnection.nodeAId === currentNode.id;
  const handleAtSequencer = isTargetSideA ? incomingConnection.nodeAHandle : incomingConnection.nodeBHandle;
  console.log('Tonnetz pulse: received on handle', handleAtSequencer, '- processing...');

  currentNode.animationState = 1;
  const ap = currentNode.audioParams || {};
  console.log('Tonnetz audioParams:', ap);
  
  // Get current position and calculate note/chord
  const pos = currentNode.currentPos || { x: 0, y: 0 };
  console.log('Tonnetz current position:', pos);
  const noteClass = getTonnetzNote(pos.x, pos.y);
  console.log('Calculated note class:', noteClass);
  
  // Determine if chord or single note
  const chordProb = ap.chordProbability ?? 0.7;
  const isChord = Math.random() < chordProb;
  
  let notes = [];
  if (isChord) {
    // Find triad containing current position
    const triad = findTriadAtPosition(pos.x, pos.y);
    if (triad) {
      notes = triad.vertices.map(([x, y]) => getTonnetzNote(x, y));
      
      // Apply harmonic spread (voice leading)
      if (ap.harmonicSpread > 0) {
        notes = notes.map((note, idx) => {
          if (idx === 0) return note; // Keep root
          return Math.random() < ap.harmonicSpread ? note + 12 : note; // Octave up
        });
      }
    } else {
      notes = [noteClass];
    }
  } else {
    notes = [noteClass];
  }
  
  // Remove duplicates and convert to scale indices
  const uniqueNotes = [...new Set(notes)];
  const scaleIndices = uniqueNotes.map(noteClass => 
    Math.max(MIN_SCALE_INDEX, Math.min(MAX_SCALE_INDEX, noteClass))
  );

  const pulseIntensity = ap.pulseIntensity ?? 1.0;

  const fire = (neighborNode) => {
    const baseIndex = neighborNode?.audioParams && typeof neighborNode.audioParams.scaleIndex === 'number' ? neighborNode.audioParams.scaleIndex : 0;
    const basePulse = { 
      intensity: pulseIntensity, 
      color: currentNode.color ?? null, 
      particleMultiplier: isChord ? 0.7 : 0.9 
    };
    
    // Visual feedback
    try {
      if (deps && typeof deps.highlightTonnetzPosition === 'function') {
        deps.highlightTonnetzPosition(currentNode.id, pos, scaleIndices, pulseIntensity);
      }
    } catch {}
    
    scaleIndices.forEach((scaleIndex) => {
      // Velocity jitter
      const jitterAmt = Math.max(0, Math.min(1, ap.velocityJitter || 0));
      const velMul = 1 + (Math.random() * 2 - 1) * jitterAmt;
      const notePulse = { 
        ...basePulse, 
        intensity: Math.max(0.05, Math.min(1.5, basePulse.intensity * velMul)) 
      };
      
      const override = { scaleIndexOverride: scaleIndex };
      triggerNodeEffect(neighborNode, notePulse, null, 0.3, override);
    });
  };

  // Fire to embedded instrument
  const targetId = ap.centerAttachedNodeId || null;
  console.log('Looking for embedded instrument:', targetId);
  if (targetId) {
    const neighbor = findNodeById(targetId);
    console.log('Found embedded instrument:', neighbor ? neighbor.id : 'null');
    if (neighbor) {
      console.log('Firing to instrument with notes:', scaleIndices);
      fire(neighbor);
    }
  } else {
    console.log('No embedded instrument found!');
  }

  // Update position based on sequence mode
  const oldPos = { ...currentNode.currentPos };
  advanceTonnetzPosition(currentNode, ap);
  console.log('Tonnetz position moved from', oldPos, 'to', currentNode.currentPos);
  
  return true;
}

// Get note class (0-11) for Tonnetz coordinates
function getTonnetzNote(x, y) {
  // Tonnetz formula: note = (7*x + 4*y) mod 12
  // This gives us the standard Tonnetz layout
  return ((7 * x + 4 * y) % 12 + 12) % 12;
}

// Find triad containing the given position
function findTriadAtPosition(x, y) {
  return TONNETZ_TRIADS.find(triad => 
    triad.vertices.some(([vx, vy]) => vx === x && vy === y)
  );
}

// Advance position based on sequence mode
function advanceTonnetzPosition(node, ap) {
  const mode = ap.sequenceMode || 'triad';
  const dir = ap.direction || 'chromatic_mediant';
  const pIndex = Number.isFinite(node.patternIndex) ? node.patternIndex : 0;
  
  console.log('advanceTonnetzPosition called:', { mode, dir, pIndex, currentPos: node.currentPos });
  
  let newPos = { ...node.currentPos };
  
  switch (mode) {
    case 'triad':
      newPos = advanceTriadMode(node.currentPos, dir, pIndex, ap);
      break;
    case 'neo_riemannian':
      newPos = advanceNeoRiemannian(node.currentPos, ap.transformations, pIndex);
      break;
    case 'hexagon_walk':
      newPos = advanceHexagonWalk(node.currentPos, dir, pIndex, ap);
      break;
    case 'random_walk':
      newPos = advanceRandomWalk(node.currentPos, ap);
      break;
    default:
      // Default to simple chromatic_mediant
      newPos = advanceTriadMode(node.currentPos, dir, pIndex, ap);
  }
  
  // Bounds checking with wrapping - keep movement interesting
  const gridLimit = 3;
  const gridSize = gridLimit * 2 + 1; // -3 to +3 = 7 positions
  
  // Wrap coordinates using modulo (ensures continuous movement)
  newPos.x = ((newPos.x + gridLimit) % gridSize) - gridLimit;
  newPos.y = ((newPos.y + gridLimit) % gridSize) - gridLimit;
  
  // Handle negative modulo properly
  if (newPos.x < -gridLimit) newPos.x += gridSize;
  if (newPos.y < -gridLimit) newPos.y += gridSize;
  
  console.log('Position after bounds checking:', newPos);
  
  node.currentPos = newPos;
  
  // Handle sequence length and restart
  const sequenceLength = ap.sequenceLength || 8;
  const newPatternIndex = (pIndex + 1) % sequenceLength;
  
  // If we've completed a full sequence, restart from initial position
  if (newPatternIndex === 0) {
    console.log('Sequence complete! Restarting from initial position');
    node.currentPos = node.initialPos || { x: 0, y: 0 };
    node.sequenceStartTime = Date.now(); // Track when sequence started for tempo
  }
  
  node.patternIndex = newPatternIndex;
  
  // Also store in audioParams for UI consistency
  if (!node.audioParams) node.audioParams = {};
  node.audioParams.currentPosition = node.currentPos;
}

// Movement algorithms
function advanceTriadMode(pos, direction, patternIndex, ap) {
  const pattern = (ap.triadPattern || 'major,minor').split(',');
  const currentTriadType = pattern[patternIndex % pattern.length];
  
  console.log('advanceTriadMode:', { pos, direction, patternIndex, currentTriadType, pattern });
  
  // Move to adjacent triad of specified type
  let newPos;
  switch (direction) {
    case 'chromatic_mediant':
      newPos = currentTriadType === 'major' 
        ? { x: pos.x + 1, y: pos.y } 
        : { x: pos.x, y: pos.y + 1 };
      break;
    case 'parallel_leading':
      newPos = currentTriadType === 'major'
        ? { x: pos.x - 1, y: pos.y + 1 }
        : { x: pos.x + 1, y: pos.y - 1 };
      break;
    default:
      // Add some variation to prevent getting stuck in single axis movement
      const moves = [
        { x: pos.x + 1, y: pos.y },     // Move right (perfect fifth up)
        { x: pos.x, y: pos.y + 1 },     // Move up (major third up)  
        { x: pos.x - 1, y: pos.y + 1 }, // Move diagonally (parallel movement)
        { x: pos.x + 1, y: pos.y - 1 }, // Move other diagonal
      ];
      newPos = moves[patternIndex % moves.length];
  }
  
  console.log('advanceTriadMode result:', newPos);
  return newPos;
}

function advanceNeoRiemannian(pos, transformations, patternIndex) {
  const transforms = (transformations || 'P,L,R').split(',');
  const transform = transforms[patternIndex % transforms.length].trim();
  
  // Neo-Riemannian transformations on Tonnetz
  switch (transform) {
    case 'P': // Parallel (major↔minor)
      return { x: pos.x, y: pos.y + 1 };
    case 'L': // Leading-tone exchange
      return { x: pos.x - 1, y: pos.y + 1 };
    case 'R': // Relative (major to relative minor)
      return { x: pos.x + 1, y: pos.y - 1 };
    default:
      return { x: pos.x + 1, y: pos.y };
  }
}

function advanceHexagonWalk(pos, direction, patternIndex, ap) {
  const steps = (ap.stepPattern || '1').split(',').map(s => parseInt(s, 10) || 1);
  const step = steps[patternIndex % steps.length];
  const clockwise = direction === 'clockwise';
  
  // Hexagonal directions (6 directions)
  const directions = [
    { x: 1, y: 0 },   // East
    { x: 1, y: -1 },  // Northeast  
    { x: 0, y: -1 },  // Northwest
    { x: -1, y: 0 },  // West
    { x: -1, y: 1 },  // Southwest
    { x: 0, y: 1 },   // Southeast
  ];
  
  const dirIndex = (patternIndex + (clockwise ? step : -step)) % directions.length;
  const delta = directions[dirIndex];
  
  return { x: pos.x + delta.x, y: pos.y + delta.y };
}

function advanceRandomWalk(pos, ap) {
  const chaos = ap.chaos || 0.5;
  const maxStep = Math.ceil(chaos * 2);
  
  return {
    x: pos.x + Math.floor(Math.random() * (2 * maxStep + 1)) - maxStep,
    y: pos.y + Math.floor(Math.random() * (2 * maxStep + 1)) - maxStep
  };
}

// Build center instrument panel (similar to circle of fifths)
export function buildTonnetzCenterInstrumentPanel(node, deps) {
  const {
    document,
    fmSynthPresets,
    analogWaveformPresets, 
    samplerWaveformTypes,
    SAMPLER_DEFINITIONS,
    addNode,
    findNodeById,
    stopNodeAudio,
    createAudioNodesForNode,
    updateNodeAudioParams,
    saveState,
    draw,
  } = deps;

  const container = document.createElement('div');
  container.classList.add('panel-subsection');
  const title = document.createElement('p');
  title.innerHTML = '<strong>Center Instrument</strong>';
  title.style.marginTop = '8px';
  container.appendChild(title);

  const ensureEmbedded = () => {
    let t = node.audioParams?.centerAttachedNodeId ? findNodeById(node.audioParams.centerAttachedNodeId) : null;
    if (!t) {
      t = addNode(node.x, node.y, 'sound', 'sampler_marimba', null);
      node.audioParams = node.audioParams || {};
      node.audioParams.centerAttachedNodeId = t?.id || null;
      if (t) t.isEmbeddedInTonnetzId = node.id;
    }
    return t;
  };

  // Engine selection
  const engineLabel = document.createElement('label');
  engineLabel.textContent = 'Engine:';
  engineLabel.style.marginRight = '6px';
  const engineSelect = document.createElement('select');
  [
    { v: 'sampler', t: 'Sampler' },
    { v: 'fm', t: 'FM Synth' },
    { v: 'analog', t: 'Analog' },
  ].forEach((o) => {
    const opt = document.createElement('option');
    opt.value = o.v;
    opt.textContent = o.t;
    engineSelect.appendChild(opt);
  });
  container.appendChild(engineLabel);
  container.appendChild(engineSelect);

  // Preset selection  
  const presetLabel = document.createElement('label');
  presetLabel.textContent = 'Preset:';
  presetLabel.style.margin = '0 6px 0 12px';
  const presetSelect = document.createElement('select');
  container.appendChild(presetLabel);
  container.appendChild(presetSelect);

  const fillPresets = (engine) => {
    presetSelect.innerHTML = '';
    let list = [];
    if (engine === 'sampler') {
      if (samplerWaveformTypes && samplerWaveformTypes.length)
        list = samplerWaveformTypes.map((s) => s.type).filter((t) => String(t || '').startsWith('sampler_'));
      else if (SAMPLER_DEFINITIONS) list = SAMPLER_DEFINITIONS.map((d) => 'sampler_' + d.id);
    } else if (engine === 'fm') {
      list = (fmSynthPresets || []).map((p) => p.type);
    } else if (engine === 'analog') {
      list = (analogWaveformPresets || []).map((p) => p.type);
    }
    if (!list || list.length === 0) list = engine === 'fm' ? ['fm_bell'] : engine === 'analog' ? ['sine'] : ['sampler_marimba'];
    list.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t.replace(/^sampler_/, '');
      presetSelect.appendChild(opt);
    });
  };

  // Initialize engine/preset
  (function initEngine() {
    const t = node.audioParams?.centerAttachedNodeId ? findNodeById(node.audioParams.centerAttachedNodeId) : null;
    let engine = 'sampler';
    let preset = 'sampler_marimba';
    if (t && t.audioParams && t.audioParams.waveform) {
      const wf = String(t.audioParams.waveform);
      if (wf.startsWith('sampler_')) {
        engine = 'sampler';
        preset = wf;
      } else if ((fmSynthPresets || []).some((p) => p.type === wf)) {
        engine = 'fm';
        preset = wf;
      } else {
        engine = 'analog';
        preset = wf;
      }
    }
    engineSelect.value = engine;
    fillPresets(engine);
    const found = Array.from(presetSelect.options).some((o) => (o.value === preset) && (o.selected = true));
    if (!found && presetSelect.options.length) presetSelect.selectedIndex = 0;
  })();

  const applyPreset = () => {
    const t = ensureEmbedded();
    const wf = presetSelect.value || 'sampler_marimba';
    try { stopNodeAudio(t); } catch {}
    t.type = 'sound';
    t.audioParams = t.audioParams || {};
    t.audioParams.waveform = wf;
    t.audioNodes = createAudioNodesForNode(t);
    if (t.audioNodes) updateNodeAudioParams(t);
    saveState();
    draw();
  };

  engineSelect.addEventListener('change', () => {
    fillPresets(engineSelect.value);
    applyPreset();
  });
  presetSelect.addEventListener('change', applyPreset);

  return container;
}