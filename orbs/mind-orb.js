import * as Tone from 'tone'

export const DEFAULT_MIND_PARAMS = {
  // Celestial Mind Sequencer parameters
  dreamDepth: 4,        // Stellar Pulses - How many star beats pulse in each cosmic cycle
  consciousnessSpan: 16, // Cosmic Orbit - How many steps the cosmic wheel takes to complete one journey
  thoughtSpeed: 1,      // Fairy Velocity - How swiftly the fairies dance through time
  memoryEcho: 0,        // Temporal Shift - How the ancient memories twist the flow of time
  wisdomCycles: 1,      // How many different patterns to cycle through
  imaginationSeed: 1,   // Dream Seed - The seed of infinite possibilities, shaping unique cosmic dreams
  focusIntensity: 1.0,  // Life Essence - The potency of life force flowing through the veins
  
  // Enchanted Forces parameters
  enchantmentPhases: [1], // Polyrhythmic phases for different veins
  spellComplexity: 1,     // Fractal Magic - The mystical complexity that transforms simple patterns into wonders
  
  // Living Mind System
  isAlive: false,          // When true, Mind autonomously seeks connections
  maxFloatingVeins: 3,     // Maximum number of searching veins when alive
  searchRadius: 300,       // How far veins can search for orbs (pixels)
  
  // Sync system integration (like other Resonaut nodes)
  ignoreGlobalSync: false,
  syncSubdivisionIndex: 2, // Default to 1/4 notes (index 2 in subdivisionOptions)
  triggerInterval: 0.5,    // Manual timing when sync is off (seconds)
  
  // Technical params
  visualStyle: 'mind_core',
  reverbSend: 0.0,
  delaySend: 0.0,
  bpm: 120,
};

export function createMindOrb(node) {
  const p = node.audioParams;
  
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
  };

  // Generate euclidean rhythm pattern
  node.generateEuclideanPattern = function(steps, length) {
    if (steps >= length) return new Array(length).fill(true);
    if (steps === 0) return new Array(length).fill(false);
    
    const pattern = new Array(length).fill(false);
    const interval = length / steps;
    
    for (let i = 0; i < steps; i++) {
      const pos = Math.floor(i * interval);
      pattern[pos] = true;
    }
    
    return pattern;
  };

  // Generate fractal variations of the base pattern
  node.generateFractalVariation = function(basePattern, complexity, seed) {
    const variation = [...basePattern];
    const random = (seed * 9301 + 49297) % 233280;
    const rnd = random / 233280;
    
    if (complexity > 1 && rnd > 0.7) {
      // Add fractal complexity by subdividing some beats
      for (let i = 0; i < variation.length; i++) {
        if (variation[i] && Math.random() > 0.6) {
          variation[i] = [true, false, true]; // Create triplet subdivision
        }
      }
    }
    
    return variation;
  };

  // Update patterns when parameters change
  node.updateSequencePatterns = function() {
    const dreamDepth = p.dreamDepth || 4;
    const consciousnessSpan = p.consciousnessSpan || 16;
    const spellComplexity = p.spellComplexity || 1;
    const imaginationSeed = p.imaginationSeed || 1;
    
    node.lifeSystem.euclideanPatterns = [];
    node.lifeSystem.polyrhythmicCounters = [];
    
    node.lifeSystem.veins.forEach((vein, index) => {
      // Each vein gets its own euclidean pattern
      const veinDreamDepth = Math.max(1, dreamDepth + (index % 3) - 1); // Slight variation per vein
      const basePattern = node.generateEuclideanPattern(veinDreamDepth, consciousnessSpan);
      
      // Apply fractal variations
      const fractalPattern = node.generateFractalVariation(basePattern, spellComplexity, imaginationSeed + index);
      
      node.lifeSystem.euclideanPatterns[index] = fractalPattern;
      
      // Initialize polyrhythmic counter
      const enchantmentPhase = (p.enchantmentPhases && p.enchantmentPhases[index]) || 1;
      node.lifeSystem.polyrhythmicCounters[index] = {
        counter: 0,
        phase: enchantmentPhase
      };
    });
  };

  // Start advanced sequencing with proper sync integration
  node.startLifeGeneration = function(isGlobalSyncEnabled, globalBPM, subdivisionOptions) {
    if (node.lifeSystem.isGenerating) return;
    
    node.lifeSystem.isGenerating = true;
    node.updateSequencePatterns();
    
    // Calculate timing based on Resonaut's sync system (like other nodes)
    let baseInterval;
    
    if (isGlobalSyncEnabled && !p.ignoreGlobalSync && globalBPM > 0) {
      // Use global sync with subdivision
      const secondsPerBeat = 60.0 / globalBPM;
      const subdivIndex = p.syncSubdivisionIndex || 2; // Default to 1/4 notes
      const subdiv = subdivisionOptions[subdivIndex];
      if (subdiv && typeof subdiv.value === "number") {
        baseInterval = Math.max(20, secondsPerBeat * subdiv.value * 1000); // Convert to milliseconds
      } else {
        baseInterval = Math.max(20, (p.triggerInterval || 0.5) * 1000);
      }
    } else {
      // Use manual timing when sync is off (like other nodes)
      const thoughtSpeed = p.thoughtSpeed || 1;
      baseInterval = Math.max(20, (p.triggerInterval || 0.5) * 1000 / thoughtSpeed);
    }
    
    node.lifeSystem.lifeTimer = setInterval(() => {
      node.processSequenceStep();
    }, baseInterval);
  };

  node.stopLifeGeneration = function() {
    if (node.lifeSystem.lifeTimer) {
      clearInterval(node.lifeSystem.lifeTimer);
      node.lifeSystem.lifeTimer = null;
    }
    node.lifeSystem.isGenerating = false;
  };

  // Process one step of the sequence
  node.processSequenceStep = function() {
    if (node.lifeSystem.veins.length === 0) return;
    
    const memoryEcho = p.memoryEcho || 0;
    const consciousnessSpan = p.consciousnessSpan || 16;
    
    // Calculate current step with memory echo (rotation)
    const currentStep = (node.lifeSystem.sequenceStep + memoryEcho) % consciousnessSpan;
    
    // Check each vein's pattern
    node.lifeSystem.veins.forEach((vein, veinIndex) => {
      if (veinIndex >= node.lifeSystem.euclideanPatterns.length) return;
      
      const pattern = node.lifeSystem.euclideanPatterns[veinIndex];
      const polyCounter = node.lifeSystem.polyrhythmicCounters[veinIndex];
      
      // Check polyrhythmic timing
      if (polyCounter.counter % polyCounter.phase === 0) {
        // Check if this step should trigger in the euclidean pattern
        if (pattern[currentStep]) {
          node.sendLifeUnit(vein, veinIndex);
        }
      }
      
      polyCounter.counter++;
    });
    
    node.lifeSystem.sequenceStep = (node.lifeSystem.sequenceStep + 1) % consciousnessSpan;
    
    // Handle wisdom cycles (pattern evolution)
    if (node.lifeSystem.sequenceStep === 0) {
      node.lifeSystem.patternCycle++;
      if ((p.wisdomCycles || 1) > 1) {
        node.updateSequencePatterns(); // Regenerate patterns for variation
      }
    }
  };

  node.sendLifeUnit = function(vein, pulseIndex) {
    // Trigger the target orb with focus intensity
    if (vein.targetNode && vein.targetNode.triggerFromLife) {
      vein.targetNode.triggerFromLife(p.focusIntensity || 1.0);
    }
    
    // Create visual life pulse effect in the vein
    if (vein.targetNode) {
      vein.lastPulseTime = Date.now();
    }
  };

  node.addVein = function(targetNode) {
    const vein = {
      id: `vein_${Date.now()}`,
      targetNode: targetNode,
      travelTime: 500, // ms for Life pulse to travel
      isActive: true
    };
    
    node.lifeSystem.veins.push(vein);
    
    // Regenerate patterns when a new vein is added
    if (node.lifeSystem.isGenerating) {
      node.updateSequencePatterns();
    }
    
    return vein;
  };

  node.removeVein = function(veinId) {
    node.lifeSystem.veins = node.lifeSystem.veins.filter(v => v.id !== veinId);
    node.lifeSystem.floatingVeins = node.lifeSystem.floatingVeins.filter(v => v.id !== veinId);
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
    if (!hasConnections && node.lifeSystem.floatingVeins.length === 0) {
      // Mind drifts slowly across canvas when completely alone - scary alien behavior
      const slowTime = Date.now() * 0.0003; // Very slow movement
      const driftRadius = 50; // Maximum drift distance from original position
      
      // Store original position if not already stored
      if (!node.originalDriftX) {
        node.originalDriftX = node.x;
        node.originalDriftY = node.y;
      }
      
      // Slow, ominous drift pattern
      const driftX = Math.sin(slowTime * 0.7 + node.id.hashCode() * 0.1) * driftRadius;
      const driftY = Math.cos(slowTime * 0.5 + node.id.hashCode() * 0.15) * driftRadius * 0.6;
      
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
        if (compatibleTypes.includes(n.type) || (n.type && n.type.startsWith('drum_'))) {
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
        
        if (distToOrb < 50) { // Close enough to connect
          // Connect the vein
          vein.targetNode = orb;
          vein.isFloating = false;
          
          // Move from floating to regular veins
          node.lifeSystem.veins.push(vein);
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