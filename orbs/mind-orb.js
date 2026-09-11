import { symphioseContext, symphioseNote, advanceSymphioseClock } from '../utils/symphioseMusic.js';
import * as Tone from 'tone'

export const DEFAULT_MIND_PARAMS = {
  musicalRole: 'auto',
  chordColor: 'triad',
  arpDirection: 'up',
  rhythmStyle: 'euclidean',
  progression: 'journey',
  barsPerChord: 1,
  variation: 0.2,
  moveWithHive: false,
  // Celestial Mind Sequencer parameters
  dreamDepth: 4,        // Stellar Pulses - How many star beats pulse in each cosmic cycle
  consciousnessSpan: 16, // Cosmic Orbit - How many steps the cosmic wheel takes to complete one journey
  thoughtSpeed: 1,      // Fairy Velocity - How swiftly the fairies dance through time
  memoryEcho: 0,        // Temporal Shift - How the ancient memories twist the flow of time
  wisdomCycles: 4,      // How many different patterns to cycle through
  imaginationSeed: 1,   // Dream Seed - The seed of infinite possibilities, shaping unique cosmic dreams
  focusIntensity: 1.0,  // Life Essence - The potency of life force flowing through the veins
  
  // Enchanted Forces parameters
  enchantmentPhases: [1], // Polyrhythmic phases for different veins
  spellComplexity: 1,     // Fractal Magic - The mystical complexity that transforms simple patterns into wonders
  
  // Living Mind System
  isAlive: false,          // When true, Mind autonomously seeks connections
  maxFloatingVeins: 3,     // Maximum number of searching veins when alive
  searchRadius: 300,       // How far veins can search for orbs (pixels)
  
  // Queen Mind System
  isQueen: false,          // When true, this is a Queen Mind that controls other Minds
  hiveRadius: 500,         // How far Queen can control other Minds (pixels)
  commandIntensity: 1.0,   // Multiplier for commands sent to hive Minds
  hiveFormation: 'circle', // Formation pattern: 'circle', 'line', 'swarm'
  queenSize: 1.0,          // Size multiplier (Queens are bigger)
  
  // Queen Mind Claw System
  clawsEnabled: false,     // When true, Queen uses claws to pluck vein strings
  clawLength: 80,          // Length of claw extensions from Queen body
  clawCount: 6,            // Number of claws around the Queen (like spider legs)
  stringTension: 0.5,      // Guitar string tension (0.0-1.0)
  stringResonance: 0.7,    // String resonance/sustain (0.0-1.0)
  
  // Sync system integration (like other Resonaut nodes)
  ignoreGlobalSync: false,
  syncSubdivisionIndex: 2, // Default to 1/4 notes (index 2 in subdivisionOptions)
  triggerInterval: 0.125,    // Manual timing when sync is off (seconds)
  
  // Technical params
  visualStyle: 'mind_core',
  reverbSend: 0.0,
  delaySend: 0.0,
  bpm: 120,
};

export const DEFAULT_QUEEN_MIND_PARAMS = {
  ...DEFAULT_MIND_PARAMS,
  // Queen-specific overrides
  dreamDepth: 6,
  consciousnessSpan: 16,
  focusIntensity: 1.0,
  maxFloatingVeins: 5,
  searchRadius: 400,
  isQueen: true,
  hiveRadius: 500,
  commandIntensity: 1.0,
  queenSize: 1.8,
  visualStyle: 'queen_mind_core',
  isAlive: true, // Queens are always alive and active
  clawsEnabled: false, // Start with claws disabled
  clawLength: 80,
  clawCount: 6,
  stringTension: 0.6,
  stringResonance: 0.8
};

export function createMindOrb(node) {
  const p = node.audioParams = { ...DEFAULT_MIND_PARAMS, ...node.audioParams };
  
  // Mind orbs don't produce sound directly, they generate Life units
  // We create a minimal audio chain for compatibility
  const audioNodes = {
    mainGain: new Tone.Gain(0), // Silent by default
    reverbSendGain: new Tone.Gain(p.reverbSend || 0),
    delaySendGain: new Tone.Gain(p.delaySend || 0),
  };

  // Connect to global effects (though silent)
  audioNodes.mainGain.connect(audioNodes.reverbSendGain);
  audioNodes.mainGain.connect(audioNodes.delaySendGain);

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    audioNodes.reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    audioNodes.delaySendGain.connect(globalThis.masterDelaySendGain);
  }

  // Connect to master gain (though silent)
  if (globalThis.masterGain) {
    audioNodes.mainGain.connect(globalThis.masterGain);
  }

  // Initialize advanced sequencing system
  node.lifeSystem = {
    veins: [], // Array of Vein connections (both connected and floating)
    floatingVeins: [], // Veins actively searching for targets
    sequenceStep: 0,
    patternCycle: 0,
    lifeTimer: null,
    searchTimer: null, // Timer for vein search behavior
    isGenerating: false,
    euclideanPatterns: [], // Generated euclidean patterns for each vein
    polyrhythmicCounters: [], // Individual counters for each vein's polyrhythm
    
    // Queen Mind hive system
    hiveMinds: [], // Array of regular Mind nodes under Queen's control
    hiveCommandTimer: null, // Timer for sending commands to hive
    currentFormation: p.hiveFormation || 'circle',
    commandQueue: [], // Queue of commands to send to hive minds
    
    // Queen Mind claw system
    claws: [], // Array of claw positions and animations
    stringOscillators: new Map(), // Map of vein ID to guitar string oscillators
    stringGains: new Map(), // Map of vein ID to string gain nodes
    lastPluckedVein: null,
    lastPluckTime: 0,
  };

  // Preview the same deterministic patterns that the musical clock plays.
  node.updateSequencePatterns = function() {
    const length = Math.max(4, Math.min(64, Math.round(p.consciousnessSpan ?? 16)));
    node.lifeSystem.euclideanPatterns = node.lifeSystem.veins.map((vein, index) =>
      Array.from({ length }, (_, step) => !!symphioseNote(p,
        symphioseContext(p, step), index, node.lifeSystem.veins.length)));
  };

  node.startLifeGeneration = function(isGlobalSyncEnabled, globalBPM, subdivisionOptions) {
    node.lifeSystem.isGenerating = true;
    const subdiv = subdivisionOptions?.[p.syncSubdivisionIndex ?? 2]?.value ?? 0.25;
    node.lifeSystem.stepInterval = Math.max(0.02,
      isGlobalSyncEnabled && !p.ignoreGlobalSync
        ? 60 / Math.max(30, globalBPM) * subdiv / Math.max(0.25, p.thoughtSpeed ?? 1)
        : (p.triggerInterval ?? 0.125) / Math.max(0.25, p.thoughtSpeed ?? 1));
    node.updateSequencePatterns();
  };

  node.stopLifeGeneration = function() {
    if (node.lifeSystem.lifeTimer) clearInterval(node.lifeSystem.lifeTimer);
    node.lifeSystem.lifeTimer = null;
    node.lifeSystem.isGenerating = false;
    node.lifeSystem.clockTick = null;
  };

  node.advanceLifeClock = function(now, origin = 0) {
    if (!node.lifeSystem.isGenerating || node.lifeSystem.queenController) return;
    const tick = advanceSymphioseClock(node.lifeSystem, now, node.lifeSystem.stepInterval, origin);
    if (tick !== null) node.processSequenceStep(symphioseContext(p, tick));
  };

  node.processSequenceStep = function(context = symphioseContext(p, node.lifeSystem.absoluteStep || 0), assignedRole, gainScale = 1) {
    if (node.isEnabled === false) return;
    node.lifeSystem.absoluteStep = context.tick + 1;
    node.lifeSystem.sequenceStep = context.step;
    node.lifeSystem.patternCycle = context.cycle;
    node.lifeSystem.musicalContext = context;
    node.lifeSystem.activeRole = p.musicalRole !== 'auto' ? p.musicalRole : assignedRole || 'auto';
    if (p.isQueen) {
      node.discoverHiveMinds();
      node.lifeSystem.hiveMinds.forEach((mind, index) => {
        mind.processSequenceStep(context, ['bass', 'chords', 'melody', 'rhythm'][index % 4],
          Math.min(1.5, Math.max(0, p.commandIntensity ?? 1)) * Math.max(0, p.focusIntensity ?? 1) /
          Math.sqrt(Math.max(1, node.lifeSystem.hiveMinds.length)) * 0.75);
      });
    }
    const voices = node.lifeSystem.veins.filter(v => v.targetNode && v.isActive !== false && !v.isFloating && v.targetNode.type !== 'mind');
    voices.forEach((vein, index) => {
      const phase = Math.max(1, Math.round(p.enchantmentPhases?.[index] ?? 1));
      if (context.tick % phase !== 0) return;
      const event = symphioseNote(p, context, index, voices.length, assignedRole);
      if (event) node.sendLifeUnit(vein, index, { ...event, intensity: Math.min(1.4, event.intensity * gainScale) });
    });
  };

  node.sendLifeUnit = function(vein, pulseIndex, event = { intensity: p.focusIntensity ?? 1 }) {
    if (p.isQueen && p.clawsEnabled && node.lifeSystem.stringGains.has(vein.id)) {
      node.pluckVeinString(vein.id, event.intensity);
    } else if (vein.targetNode?.triggerFromLife) {
      vein.targetNode.triggerFromLife(event.intensity, event);
    }
    vein.lastPulseTime = Date.now();
    vein.lastMusicalEvent = event;
  };

  node.addVein = function(targetNode) {
    if (!targetNode || targetNode === node) return null;
    const existing = node.lifeSystem.veins.find(v => v.targetNode?.id === targetNode.id);
    if (existing) return existing;
    const vein = {
      id: `vein_${node.id}_${targetNode.id}`,
      targetNode: targetNode,
      travelTime: 500, // ms for Life pulse to travel
      isActive: true
    };
    
    node.lifeSystem.veins.push(vein);
    p.veinTargets = node.lifeSystem.veins.map(v => v.targetNode?.id).filter(id => id != null);
    
    // Create guitar string oscillator if Queen has claws enabled
    if (p.isQueen && p.clawsEnabled) {
      node.createStringOscillator(vein.id, vein);
    }
    
    // Regenerate patterns when a new vein is added
    if (node.lifeSystem.isGenerating) {
      node.updateSequencePatterns();
    }
    
    return vein;
  };

  node.removeVein = function(veinId) {
    // Clean up guitar string oscillator if it exists
    if (node.lifeSystem.stringOscillators.has(veinId)) {
      const stringData = node.lifeSystem.stringOscillators.get(veinId);
      try {
        stringData.oscillator.stop();
        stringData.oscillator.disconnect();
        stringData.filter.disconnect();
      } catch (e) {
        console.warn('Error cleaning up string oscillator:', e);
      }
      node.lifeSystem.stringOscillators.delete(veinId);
    }
    
    if (node.lifeSystem.stringGains.has(veinId)) {
      const stringGain = node.lifeSystem.stringGains.get(veinId);
      try {
        stringGain.disconnect();
      } catch (e) {
        console.warn('Error cleaning up string gain:', e);
      }
      node.lifeSystem.stringGains.delete(veinId);
    }
    
    node.lifeSystem.veins = node.lifeSystem.veins.filter(v => v.id !== veinId);
    node.lifeSystem.floatingVeins = node.lifeSystem.floatingVeins.filter(v => v.id !== veinId);
    p.veinTargets = node.lifeSystem.veins.map(v => v.targetNode?.id).filter(id => id != null);
    node.discoverHiveMinds();
    node.updateSequencePatterns();
  };

  // === QUEEN MIND CLAW SYSTEM ===
  
  // Initialize Queen Mind claws
  node.initializeClaws = function() {
    if (!p.isQueen) return;
    
    node.lifeSystem.claws = [];
    const clawCount = p.clawCount || 6;
    const clawLength = p.clawLength || 80;
    
    for (let i = 0; i < clawCount; i++) {
      const angle = (i / clawCount) * Math.PI * 2;
      node.lifeSystem.claws.push({
        id: `claw_${i}`,
        angle: angle,
        baseLength: clawLength * 0.7, // Base segment length
        tipLength: clawLength * 0.3,  // Tip segment length
        isAnimating: false,
        animationProgress: 0,
        targetVeinId: null,
        pluckIntensity: 0,
        lastPluckTime: 0,
        baseX: 0, // Will be updated relative to Queen position
        baseY: 0,
        tipX: 0,
        tipY: 0,
      });
    }
  };
  
  // Create guitar string oscillator for a vein
  node.createStringOscillator = function(veinId, vein) {
    if (!globalThis.audioContext || !p.clawsEnabled || !p.isQueen) return;
    
    // Don't create if already exists
    if (node.lifeSystem.stringOscillators.has(veinId)) {
      return;
    }
    
    try {
      const ctx = globalThis.audioContext;
      
      // Ensure we have a valid audio output to connect to
      if (!node.audioNodes || !node.audioNodes.gainNode) {
        console.warn('No valid audio nodes available for string oscillator');
        return;
      }
      
      // Debug check the audio node type
      if (typeof node.audioNodes.gainNode.connect !== 'function') {
        console.warn('gainNode is not a valid AudioNode:', typeof node.audioNodes.gainNode);
        return;
      }
      
      // Calculate string frequency based on vein length and tension
      const veinLength = vein.targetNode ? 
        Math.sqrt(Math.pow(vein.targetNode.x - node.x, 2) + Math.pow(vein.targetNode.y - node.y, 2)) : 100;
      const tension = p.stringTension || 0.5;
      const baseFreq = 80 + (1 - Math.min(veinLength, 400) / 400) * 200; // Longer veins = lower pitch
      const stringFreq = baseFreq * (0.5 + tension * 0.5);
      
      console.log('Creating string oscillator:', veinId, 'length:', veinLength, 'freq:', stringFreq);
      
      // Use Web Audio API directly (same as the rest of the app)
      const audioCtx = globalThis.audioContext;
      
      // Create oscillator for the string
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(stringFreq, audioCtx.currentTime);
      
      // Create gain for string volume and envelope (start silent!)
      const stringGain = audioCtx.createGain();
      stringGain.gain.setValueAtTime(0, audioCtx.currentTime); // Start at 0 volume
      
      // Create simple lowpass filter to soften the sawtooth
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(stringFreq * 4, audioCtx.currentTime);
      filter.Q.setValueAtTime(2, audioCtx.currentTime);
      
      // Connect: oscillator -> filter -> gain -> destination
      oscillator.connect(filter);
      filter.connect(stringGain);
      stringGain.connect(audioCtx.destination); // Direct to speakers for testing
      
      // Start the oscillator
      oscillator.start();
      
      console.log('Web Audio string oscillator created and started');
      
      // Store the audio nodes
      node.lifeSystem.stringOscillators.set(veinId, {
        oscillator: oscillator,
        filter: filter,
        frequency: stringFreq,
      });
      node.lifeSystem.stringGains.set(veinId, stringGain);
      
    } catch (error) {
      console.warn('Failed to create string oscillator:', error);
    }
  };
  
  // Pluck a vein string with claws
  node.pluckVeinString = function(veinId, intensity = 1.0) {
    if (!p.clawsEnabled || !p.isQueen) return;
    
    const stringGain = node.lifeSystem.stringGains.get(veinId);
    if (!stringGain) {
      console.warn('No string gain found for vein:', veinId);
      return;
    }
    
    try {
      const audioCtx = globalThis.audioContext;
      const now = audioCtx.currentTime;
      const resonance = p.stringResonance || 0.7;
      const volume = Math.min(0.8, intensity * 0.4); // Much higher volume for testing
      
      console.log('Plucking string:', veinId, 'volume:', volume, 'resonance:', resonance);
      
      // Guitar string envelope using Web Audio API - return to silence
      stringGain.gain.cancelScheduledValues(now);
      stringGain.gain.setValueAtTime(0, now); // Start from silence
      stringGain.gain.linearRampToValueAtTime(volume, now + 0.005); // Quick attack
      stringGain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.3), now + 0.1); // Initial decay
      stringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + resonance * 0.5); // Fade to silence
      
      // Update claw animation for the vein
      const vein = node.lifeSystem.veins.find(v => v.id === veinId);
      if (vein) {
        node.animateClawPluck(veinId, intensity);
      }
      
      node.lifeSystem.lastPluckedVein = veinId;
      node.lifeSystem.lastPluckTime = Date.now();
      
    } catch (error) {
      console.warn('Failed to pluck string:', error);
    }
  };
  
  // Animate claw plucking motion
  node.animateClawPluck = function(veinId, intensity) {
    const vein = node.lifeSystem.veins.find(v => v.id === veinId);
    if (!vein || !vein.targetNode) return;
    
    // Find the closest claw to the vein
    const veinAngle = Math.atan2(vein.targetNode.y - node.y, vein.targetNode.x - node.x);
    let closestClaw = null;
    let minAngleDiff = Infinity;
    
    node.lifeSystem.claws.forEach(claw => {
      const angleDiff = Math.abs(veinAngle - claw.angle);
      const wrappedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
      if (wrappedDiff < minAngleDiff) {
        minAngleDiff = wrappedDiff;
        closestClaw = claw;
      }
    });
    
    if (closestClaw) {
      closestClaw.isAnimating = true;
      closestClaw.animationProgress = 0;
      closestClaw.targetVeinId = veinId;
      closestClaw.pluckIntensity = intensity;
      closestClaw.lastPluckTime = Date.now();
    }
  };
  
  // Update claw positions and animations
  node.updateClaws = function() {
    if (!p.isQueen || !p.clawsEnabled || !node.lifeSystem.claws) return;
    
    const time = Date.now() * 0.001;
    
    node.lifeSystem.claws.forEach((claw, index) => {
      // Update base claw position
      const baseAngle = claw.angle + Math.sin(time * 0.5 + index) * 0.1; // Slight idle movement
      const baseRadius = (p.queenSize || 1.8) * 15; // Distance from Queen center
      claw.baseX = node.x + Math.cos(baseAngle) * baseRadius;
      claw.baseY = node.y + Math.sin(baseAngle) * baseRadius;
      
      if (claw.isAnimating && claw.targetVeinId) {
        // Animate plucking motion
        const animSpeed = 8; // Animation speed
        claw.animationProgress += animSpeed * 0.016; // ~60fps
        
        if (claw.animationProgress >= 1) {
          claw.isAnimating = false;
          claw.animationProgress = 0;
          claw.targetVeinId = null;
        }
        
        // Find target vein position for plucking
        const targetVein = node.lifeSystem.veins.find(v => v.id === claw.targetVeinId);
        if (targetVein && targetVein.targetNode) {
          const t = claw.animationProgress;
          const easeOut = 1 - Math.pow(1 - t, 3); // Ease out cubic
          
          // Calculate pluck position along the vein
          const pluckRatio = 0.3 + Math.sin(t * Math.PI) * 0.2; // Pluck near Queen end
          const targetX = node.x + (targetVein.targetNode.x - node.x) * pluckRatio;
          const targetY = node.y + (targetVein.targetNode.y - node.y) * pluckRatio;
          
          claw.tipX = claw.baseX + (targetX - claw.baseX) * easeOut;
          claw.tipY = claw.baseY + (targetY - claw.baseY) * easeOut;
        }
      } else {
        // Idle claw position
        const tipAngle = baseAngle + Math.sin(time * 0.8 + index * 0.5) * 0.2;
        const tipRadius = baseRadius + claw.baseLength + claw.tipLength;
        claw.tipX = node.x + Math.cos(tipAngle) * tipRadius;
        claw.tipY = node.y + Math.sin(tipAngle) * tipRadius;
      }
    });
  };
  
  // === QUEEN MIND HIVE SYSTEM ===
  
  // Find and recruit Mind orbs that have direct vein connections from the Queen
  node.discoverHiveMinds = function() {
    if (!p.isQueen) return;
    const previous = node.lifeSystem.hiveMinds;
    const members = node.lifeSystem.veins.filter(v => v.isActive !== false && !v.isFloating)
      .map(v => v.targetNode).filter(m => m?.type === 'mind' && m.lifeSystem &&
        (!m.lifeSystem.queenController || m.lifeSystem.queenController === node));
    previous.filter(m => !members.includes(m)).forEach(m => {
      if (m.lifeSystem?.queenController === node) delete m.lifeSystem.queenController;
    });
    members.forEach(m => { m.lifeSystem.queenController = node; });
    node.lifeSystem.hiveMinds = members;
  };

  // Send movement commands to hive minds
  node.commandHiveFormation = function() {
    if (!p.isQueen || node.lifeSystem.hiveMinds.length === 0) return;
    
    const formation = node.lifeSystem.currentFormation;
    const hiveRadius = (p.hiveRadius || 500) * 0.6; // Formation radius is smaller than recruitment radius
    
    node.lifeSystem.hiveMinds.forEach((hiveMind, index) => {
      if (!hiveMind || hiveMind.type !== "mind") return;
      
      let targetX, targetY;
      
      switch (formation) {
        case 'circle':
          const angle = (index / node.lifeSystem.hiveMinds.length) * Math.PI * 2;
          targetX = node.x + Math.cos(angle) * hiveRadius * 0.5;
          targetY = node.y + Math.sin(angle) * hiveRadius * 0.5;
          break;
          
        case 'line':
          const spacing = 100;
          const lineLength = (node.lifeSystem.hiveMinds.length - 1) * spacing;
          targetX = node.x + (index * spacing) - (lineLength / 2);
          targetY = node.y - 80; // Line forms below the Queen
          break;
          
        case 'swarm':
          // Random positions around Queen with slight movement
          const swarmRadius = hiveRadius * 0.4;
          const time = Date.now() * 0.001;
          const swarmAngle = time * 0.5 + index * 0.8;
          targetX = node.x + Math.cos(swarmAngle) * swarmRadius * (0.7 + Math.sin(time + index) * 0.3);
          targetY = node.y + Math.sin(swarmAngle) * swarmRadius * (0.7 + Math.cos(time + index) * 0.3);
          break;
          
        case 'spiral':
          // Spiral formation expanding outward
          const spiralAngle = (index / node.lifeSystem.hiveMinds.length) * Math.PI * 2 * 2; // 2 full rotations
          const spiralRadius = hiveRadius * 0.3 * (1 + index / node.lifeSystem.hiveMinds.length);
          targetX = node.x + Math.cos(spiralAngle) * spiralRadius;
          targetY = node.y + Math.sin(spiralAngle) * spiralRadius;
          break;
          
        case 'grid':
          // Grid formation
          const gridSize = Math.ceil(Math.sqrt(node.lifeSystem.hiveMinds.length));
          const gridX = index % gridSize;
          const gridY = Math.floor(index / gridSize);
          const gridSpacing = hiveRadius * 0.3;
          targetX = node.x + (gridX - (gridSize - 1) / 2) * gridSpacing;
          targetY = node.y + (gridY - (gridSize - 1) / 2) * gridSpacing;
          break;
          
        case 'wedge':
          // V-shaped wedge formation
          const side = index % 2; // 0 for left, 1 for right
          const rowIndex = Math.floor(index / 2);
          const wedgeSpacing = 80;
          const wedgeAngle = Math.PI / 6; // 30 degrees
          targetX = node.x + (side === 0 ? -1 : 1) * Math.cos(wedgeAngle) * wedgeSpacing * (rowIndex + 1);
          targetY = node.y + Math.sin(wedgeAngle) * wedgeSpacing * (rowIndex + 1);
          break;
          
        case 'star':
          // Star formation with points
          const points = Math.min(8, Math.max(5, node.lifeSystem.hiveMinds.length));
          const starAngle = (index / points) * Math.PI * 2;
          const starRadius = hiveRadius * (index % 2 === 0 ? 0.6 : 0.3); // Alternating radii
          targetX = node.x + Math.cos(starAngle) * starRadius;
          targetY = node.y + Math.sin(starAngle) * starRadius;
          break;
          
        case 'orbit':
          // Multiple orbital rings
          const orbitLevel = Math.floor(index / 6); // 6 per ring
          const orbitIndex = index % 6;
          const orbitAngle = (orbitIndex / 6) * Math.PI * 2;
          const orbitRadius = hiveRadius * 0.25 * (1 + orbitLevel);
          const orbitTime = Date.now() * 0.0005 * (1 + orbitLevel * 0.3); // Different speeds per ring
          targetX = node.x + Math.cos(orbitAngle + orbitTime) * orbitRadius;
          targetY = node.y + Math.sin(orbitAngle + orbitTime) * orbitRadius;
          break;
          
        case 'diamond':
          // Diamond formation
          const diamondAngle = (index / node.lifeSystem.hiveMinds.length) * Math.PI * 2;
          const diamondRadius = hiveRadius * 0.4;
          // Create diamond shape by modulating radius
          const diamondMod = Math.abs(Math.cos(diamondAngle * 2));
          targetX = node.x + Math.cos(diamondAngle) * diamondRadius * (0.7 + diamondMod * 0.3);
          targetY = node.y + Math.sin(diamondAngle) * diamondRadius * (0.7 + diamondMod * 0.3);
          break;
          
        default:
          targetX = node.x;
          targetY = node.y;
      }
      
      // Move hive mind toward target position (fast formation changes)
      const moveSpeed = 3.5;
      const dx = targetX - hiveMind.x;
      const dy = targetY - hiveMind.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) { // Only move if not close enough
        hiveMind.x += (dx / distance) * moveSpeed;
        hiveMind.y += (dy / distance) * moveSpeed;
      }
    });
  };

  // Send pattern commands to hive minds (synchronize their sequences)
  node.commandHivePatterns = function() {
    // The shared clock sends phrase context; never overwrite a member's settings.
    node.discoverHiveMinds();
  };

  // Start Queen's hive control behavior
  node.startQueenBehavior = function(allNodes) {
    if (!p.isQueen) return;
    
    // Initialize claws if enabled
    if (p.clawsEnabled && (!node.lifeSystem.claws || node.lifeSystem.claws.length === 0)) {
      node.initializeClaws();
    }
    
    if (node.lifeSystem.hiveCommandTimer) return; // Already running
    
    node.lifeSystem.hiveCommandTimer = setInterval(() => {
      node.discoverHiveMinds(allNodes);
      if (p.moveWithHive) node.commandHiveFormation();
      node.commandHivePatterns();
      
      // Update claw positions and animations
      if (p.clawsEnabled) {
        node.updateClaws();
      }
    }, 150); // Update hive every 150ms
  };

  // Stop Queen's hive control
  node.stopQueenBehavior = function() {
    if (node.lifeSystem.hiveCommandTimer) {
      clearInterval(node.lifeSystem.hiveCommandTimer);
      node.lifeSystem.hiveCommandTimer = null;
    }
    
    // Release all hive minds
    node.lifeSystem.hiveMinds.forEach(hiveMind => {
      if (hiveMind && hiveMind.lifeSystem) {
        delete hiveMind.lifeSystem.queenController;
      }
    });
    node.lifeSystem.hiveMinds = [];
  };

  // Clean up all Queen Mind resources (called when node is deleted)
  node.dispose = function() {
    console.log('Disposing Queen Mind:', node.id);
    
    node.stopAliveBehavior?.();
    // Stop Queen behavior
    if (node.stopQueenBehavior) {
      node.stopQueenBehavior();
    }
    
    // Clean up all string oscillators
    if (node.lifeSystem && node.lifeSystem.stringOscillators) {
      node.lifeSystem.stringOscillators.forEach((stringData, veinId) => {
        try {
          stringData.oscillator.stop();
          stringData.oscillator.disconnect();
          stringData.filter.disconnect();
        } catch (e) {
          console.warn('Error disposing string oscillator:', e);
        }
      });
      node.lifeSystem.stringOscillators.clear();
    }
    
    // Clean up all string gains
    if (node.lifeSystem && node.lifeSystem.stringGains) {
      node.lifeSystem.stringGains.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {
          console.warn('Error disposing string gain:', e);
        }
      });
      node.lifeSystem.stringGains.clear();
    }
    
    // Clear claws
    if (node.lifeSystem && node.lifeSystem.claws) {
      node.lifeSystem.claws = [];
    }
    
    // Stop life generation
    if (node.stopLifeGeneration) {
      node.stopLifeGeneration();
    }
    
    console.log('Queen Mind disposed completely');
  };
  
  // Create floating vein (for alive minds)
  node.createFloatingVein = function() {
    const vein = {
      id: `floating_vein_${Date.now()}_${Math.random()}`,
      targetNode: null,
      isFloating: true,
      searchX: node.x + (Math.random() - 0.5) * 200, // Start search near mind
      searchY: node.y + (Math.random() - 0.5) * 200,
      searchDirection: Math.random() * Math.PI * 2, // Random initial direction
      searchSpeed: 0.5 + Math.random() * 1.0, // Floating speed
      travelTime: 500,
      isActive: true,
      lastSearchTime: Date.now(),
    };
    
    node.lifeSystem.floatingVeins.push(vein);
    return vein;
  };
  
  // Start alive mind behavior
  node.startAliveBehavior = function(findNodeById, createParticles) {
    if (node.lifeSystem.searchTimer) return;
    
    // Create initial floating veins
    const maxVeins = p.maxFloatingVeins || 3;
    for (let i = 0; i < maxVeins; i++) {
      node.createFloatingVein();
    }
    
    // Start search behavior
    node.lifeSystem.searchTimer = setInterval(() => {
      node.updateFloatingVeins(findNodeById, createParticles);
    }, 100); // Update search every 100ms
  };
  
  // Stop alive mind behavior
  node.stopAliveBehavior = function() {
    if (node.lifeSystem.searchTimer) {
      clearInterval(node.lifeSystem.searchTimer);
      node.lifeSystem.searchTimer = null;
    }
    // Convert floating veins to regular veins or remove them
    node.lifeSystem.floatingVeins = [];
  };
  
  // Update floating vein behavior
  node.updateFloatingVeins = function(findNodeById, createParticles) {
    if (!p.isAlive || !findNodeById) return;
    
    const searchRadius = p.searchRadius || 300;
    
    // Slow, scary drift behavior when no connections exist
    const hasConnections = node.lifeSystem.veins && node.lifeSystem.veins.some(v => v.targetNode && !v.isFloating);
    if (p.moveWithHive && !hasConnections && node.lifeSystem.floatingVeins.length === 0) {
      // Mind drifts slowly across canvas when completely alone - scary alien behavior
      const slowTime = Date.now() * 0.0003; // Very slow movement
      const driftRadius = 50; // Maximum drift distance from original position
      
      // Store original position if not already stored
      if (!node.originalDriftX) {
        node.originalDriftX = node.x;
        node.originalDriftY = node.y;
      }
      
      // Slow, ominous drift pattern
      const driftX = Math.sin(slowTime * 0.7 + (Number(node.id) || 0) * 0.1) * driftRadius;
      const driftY = Math.cos(slowTime * 0.5 + (Number(node.id) || 0) * 0.15) * driftRadius * 0.6;
      
      // Apply drift with bounds checking to keep it on canvas
      const canvas = typeof window !== 'undefined' && window.canvas;
      if (canvas) {
        node.x = Math.max(50, Math.min(canvas.width - 50, node.originalDriftX + driftX));
        node.y = Math.max(50, Math.min(canvas.height - 50, node.originalDriftY + driftY));
      } else {
        node.x = node.originalDriftX + driftX;
        node.y = node.originalDriftY + driftY;
      }
    } else if (hasConnections && node.originalDriftX) {
      // Stop drifting when connections are made
      delete node.originalDriftX;
      delete node.originalDriftY;
    }
    const compatibleTypes = ["sound", "alien_orb", "alien_drone", "arvo_drone", 
                             "fm_drone", "resonauter", "radio_orb"];
    
    // Get all available nodes (need access to global nodes array)
    const availableOrbs = [];
    if (typeof window !== 'undefined' && window.nodes) {
      window.nodes.forEach(n => {
        if (n === node) return; // Skip self
        if (n.isEmbeddedInCircleId != null || n.isEmbeddedInTonnetzId != null) return;
        if (compatibleTypes.includes(n.type) || (n.type && n.type.startsWith('drum_')) || (p.isQueen && n.type === 'mind')) {
          // Check if this orb is already connected to this mind
          const alreadyConnected = node.lifeSystem.veins.some(v => 
            v.targetNode && v.targetNode.id === n.id && !v.isFloating
          );
          if (!alreadyConnected) {
            availableOrbs.push(n);
          }
        }
      });
    }
    
    // Update each floating vein
    node.lifeSystem.floatingVeins.forEach((vein, index) => {
      if (!vein.isFloating) return;
      
      // Move vein in search pattern
      vein.searchX += Math.cos(vein.searchDirection) * vein.searchSpeed;
      vein.searchY += Math.sin(vein.searchDirection) * vein.searchSpeed;
      
      // Gradually change direction (organic movement)
      vein.searchDirection += (Math.random() - 0.5) * 0.3;
      
      // Keep within search radius of mind
      const distFromMind = Math.sqrt(
        Math.pow(vein.searchX - node.x, 2) + 
        Math.pow(vein.searchY - node.y, 2)
      );
      
      if (distFromMind > searchRadius) {
        // Turn back toward mind
        vein.searchDirection = Math.atan2(node.y - vein.searchY, node.x - vein.searchX) + (Math.random() - 0.5) * 0.5;
      }
      
      // Look for nearby orbs to connect to
      availableOrbs.forEach(orb => {
        const distToOrb = Math.sqrt(
          Math.pow(orb.x - vein.searchX, 2) + 
          Math.pow(orb.y - vein.searchY, 2)
        );
        
        if (distToOrb < 50 && vein.isFloating && !node.lifeSystem.veins.some(v => v.targetNode === orb)) { // Close enough to connect
          // Connect the vein
          vein.targetNode = orb;
          vein.isFloating = false;
          
          // Move from floating to regular veins
          node.lifeSystem.veins.push(vein);
          p.veinTargets = node.lifeSystem.veins.map(v => v.targetNode?.id).filter(id => id != null);
          node.lifeSystem.floatingVeins = node.lifeSystem.floatingVeins.filter(v => v.id !== vein.id);
          
          // Visual feedback
          if (createParticles) {
            createParticles(orb.x, orb.y, 30);
          }
          
          // Create a new floating vein to maintain the search
          if (node.lifeSystem.floatingVeins.length < (p.maxFloatingVeins || 3)) {
            node.createFloatingVein();
          }
          
          // Update patterns for new connection
          if (node.lifeSystem.isGenerating) {
            node.updateSequencePatterns();
          }
        }
      });
    });
  };

  return {
    gainNode: audioNodes.mainGain,
    reverbSendGain: audioNodes.reverbSendGain,
    delaySendGain: audioNodes.delaySendGain,
  };
}
