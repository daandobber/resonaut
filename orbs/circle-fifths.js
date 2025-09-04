// Circle of Fifths module: encapsulates init, pulse handling, and center-instrument UI

import { showTonePanel } from './analog-orb-ui.js';
import { showAlienPanel } from './alien-orb.js';

export const CIRCLE_FIFTHS_TYPE = 'circle_fifths';

export const ZODIAC_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

export const ZODIAC_PRESETS = {
  Aries:        { sequenceMode:'step',   direction:'clockwise',       stepPattern:'2,1,1' },
  Taurus:       { sequenceMode:'degree', direction:'clockwise',       degreePattern:'1', holdRoot:true },
  Gemini:       { sequenceMode:'step',   direction:'clockwise',       stepPattern:'1,1,2' },
  Cancer:       { sequenceMode:'step',   direction:'counterclockwise',stepPattern:'2,1,2' },
  Leo:          { sequenceMode:'step',   direction:'clockwise',       stepPattern:'2,2,1' },
  Virgo:        { sequenceMode:'degree', direction:'clockwise',       degreePattern:'1,2,3,4' },
  Libra:        { sequenceMode:'step',   direction:'counterclockwise',stepPattern:'1,2,1,2' },
  Scorpio:      { sequenceMode:'degree', direction:'clockwise',       degreePattern:'1,4,2,5' },
  Sagittarius:  { sequenceMode:'step',   direction:'clockwise',       stepPattern:'3,1' },
  Capricorn:    { sequenceMode:'degree', direction:'counterclockwise',degreePattern:'1,2,1,2,3,2' },
  Aquarius:     { sequenceMode:'step',   direction:'counterclockwise',stepPattern:'2,2,1' },
  Pisces:       { sequenceMode:'degree', direction:'clockwise',       degreePattern:'1,2,3,2,1' },
};

export function applyZodiacPresetToCircle(node, sign) {
  if (!node || node.type !== CIRCLE_FIFTHS_TYPE) return;
  const ap = (node.audioParams = node.audioParams || {});
  const cfg = ZODIAC_PRESETS[sign] || ZODIAC_PRESETS['Aries'];
  ap.sequenceMode = cfg.sequenceMode;
  ap.direction = cfg.direction;
  if (cfg.stepPattern) ap.stepPattern = cfg.stepPattern;
  if (cfg.degreePattern !== undefined) ap.degreePattern = cfg.degreePattern;
  ap.holdRoot = !!cfg.holdRoot;
  node.patternIndex = 0;
}

// Initialize circle node and embed starting instrument
export function initCircleNode(newNode, deps) {
  const {
    samplerWaveformTypes,
    SAMPLER_DEFINITIONS,
    addNode,
  } = deps;

  newNode.segments = 12;
  newNode.segmentIndex = 0;
  newNode.patternIndex = 0;
  newNode.audioParams = newNode.audioParams || {};
  const ap = newNode.audioParams;
  ap.pulseIntensity = ap.pulseIntensity ?? deps.DEFAULT_PULSE_INTENSITY;
  ap.ignoreGlobalSync = true;
  ap.syncSubdivisionIndex = deps.DEFAULT_SUBDIVISION_INDEX;
  ap.triggerInterval = deps.DEFAULT_TRIGGER_INTERVAL;
  ap.chordSize = ap.chordSize || 3;
  ap.randomChordProbability = ap.randomChordProbability === undefined ? 0.6 : ap.randomChordProbability;
  // New: performance nuances
  ap.velocityJitter = ap.velocityJitter === undefined ? 0.2 : ap.velocityJitter; // 0..1 amount of random velocity
  ap.chordType = ap.chordType || 'auto'; // 'auto'|'triad'|'seventh'|'sus2'|'sus4'|'power'|'random'
  ap.chordSpreadProb = ap.chordSpreadProb === undefined ? 0.0 : ap.chordSpreadProb; // 0..1 chance to lift chord tones +7 deg
  ap.direction = ap.direction || 'clockwise';
  ap.stepPattern = ap.stepPattern || '1';
  ap.sequenceMode = ap.sequenceMode || 'step';
  ap.degreePattern = ap.degreePattern || '';
  ap.patternSource = ap.patternSource || 'zodiac';
  ap.zodiacSign = ap.zodiacSign || 'Aries';
  if (ap.patternSource === 'zodiac') applyZodiacPresetToCircle(newNode, ap.zodiacSign);

  // Embed a sampler instrument
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
    embedded.isEmbeddedInCircleId = newNode.id;
    try {
      embedded.audioParams = embedded.audioParams || {};
      embedded.audioParams.scaleIndex = 0; // lock center instrument to project root degree
    } catch {}
  }
}

// Handle incoming pulse to circle. Returns true if consumed.
export function handleCirclePulse(currentNode, incomingConnection, deps) {
  const {
    findNodeById,
    triggerNodeEffect,
    MIN_SCALE_INDEX,
    MAX_SCALE_INDEX,
    DELAY_FACTOR,
  } = deps;

  // Require left input (-1)
  if (!incomingConnection) return true;
  const isTargetSideA = incomingConnection.nodeAId === currentNode.id;
  const handleAtSequencer = isTargetSideA ? incomingConnection.nodeAHandle : incomingConnection.nodeBHandle;
  if (handleAtSequencer !== -1) return true;

  currentNode.animationState = 1;
  const segments = currentNode.segments || 12;
  const k = ((currentNode.segmentIndex || 0) % segments + segments) % segments;
  const ap = currentNode.audioParams || {};

  // Determine degree
  let stepDegree = 0;
  if ((ap.patternSource || 'zodiac') === 'zodiac' && ap.holdRoot) {
    stepDegree = 0;
  } else if ((ap.sequenceMode || 'step') === 'degree' && typeof ap.degreePattern === 'string' && ap.degreePattern.trim().length > 0) {
    const arr = ap.degreePattern
      .split(/[^\d]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    const patt = arr && arr.length > 0 ? arr : [1];
    const idx = Number.isFinite(currentNode.patternIndex) ? currentNode.patternIndex : 0;
    const deg1 = patt[idx % patt.length];
    stepDegree = Math.max(0, deg1 - 1);
  } else {
    const baseDeg = [0, 4, 1, 5, 2, 6, 3];
    stepDegree = baseDeg[k % 7] + (k >= 7 ? 7 : 0);
  }

  // Note vs chord: rely solely on probability dial (UI). Mode selector removed.
  const chordProb = ap.randomChordProbability === undefined ? 0.6 : ap.randomChordProbability;
  const isChord = Math.random() < chordProb;
  const chordSize = Math.max(2, Math.min(4, ap.chordSize || 3));

  // Resolve chord offsets based on chordType setting
  const pickChordOffsets = () => {
    const type = (ap.chordType || 'auto');
    const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const typeEff = type === 'random'
      ? choose(['triad','seventh','sus2','sus4','power'])
      : type;
    switch (typeEff) {
      case 'triad':   return [0, 2, 4];
      case 'seventh': return [0, 2, 4, 6];
      case 'sus2':    return [0, 1, 4];
      case 'sus4':    return [0, 3, 4];
      case 'power':   return [0, 4]; // fifth dyad
      case 'auto':
      default:
        return chordSize === 4 ? [0, 2, 4, 6] : [0, 2, 4];
    }
  };
  let degOffsets = isChord ? pickChordOffsets() : [0];
  // Optional voicing spread: randomly lift upper chord tones by one octave (7 scale steps)
  if (isChord && ap.chordSpreadProb > 0) {
    degOffsets = degOffsets.map((off, idx) => {
      if (idx === 0) return off; // keep root as is
      return Math.random() < ap.chordSpreadProb ? off + 7 : off;
    });
  }
  const pulseIntensity = ap.pulseIntensity ?? 1.0;

  const fire = (neighborNode) => {
    const baseIndex = neighborNode?.audioParams && typeof neighborNode.audioParams.scaleIndex === 'number' ? neighborNode.audioParams.scaleIndex : 0;
    const basePulse = { intensity: pulseIntensity, color: currentNode.color ?? null, particleMultiplier: isChord ? 0.7 : 0.9 };
    // Calculate all scale indices first and deduplicate to prevent same note triggering multiple times
    const scaleIndices = degOffsets.map((off) => 
      Math.max(MIN_SCALE_INDEX, Math.min(MAX_SCALE_INDEX, baseIndex + stepDegree + off))
    );
    const uniqueScaleIndices = [...new Set(scaleIndices)]; // Remove duplicates
    
    // Visual: report the actual unique scale indices (more accurate for piano UI)
    try {
      if (deps && typeof deps.highlightCircleDegreeBars === 'function') {
        deps.highlightCircleDegreeBars(currentNode.id, { scaleIndices: uniqueScaleIndices }, pulseIntensity);
      }
    } catch {}
    
    uniqueScaleIndices.forEach((scaleIndex) => {
      // Per-note velocity jitter
      const jitterAmt = Math.max(0, Math.min(1, ap.velocityJitter || 0));
      const velMul = 1 + (Math.random() * 2 - 1) * jitterAmt; // 1±jitter
      const notePulse = { ...basePulse, intensity: Math.max(0.05, Math.min(1.5, basePulse.intensity * velMul)) };
      const override = {
        scaleIndexOverride: scaleIndex,
      };
      triggerNodeEffect(neighborNode, notePulse, null, 0.3, override);
    });
  };

  // Fire to embedded instrument (preferred)
  const targetId = ap.centerAttachedNodeId || null;
  if (targetId) {
    const neighbor = findNodeById(targetId);
    if (neighbor) fire(neighbor);
  }

  // Glow state
  try {
    currentNode.lastGlowSeg = Number.isFinite(currentNode.segmentIndex) ? currentNode.segmentIndex : 0;
    currentNode.lastGlowAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  } catch {}

  // Advance index
  const pIndex = Number.isFinite(currentNode.patternIndex) ? currentNode.patternIndex : 0;
  if ((ap.sequenceMode || 'step') === 'degree') {
    const arr = (typeof ap.degreePattern === 'string' ? ap.degreePattern : '')
      .split(/[^\d]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    const patt = arr && arr.length > 0 ? arr : [1];
    currentNode.patternIndex = (pIndex + 1) % patt.length;
  } else {
    const dir = ap.direction === 'counterclockwise' ? -1 : 1;
    const parts = (typeof ap.stepPattern === 'string' ? ap.stepPattern : '1')
      .match(/-?\d+/g)
      ?.map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n !== 0);
    const patt = parts && parts.length > 0 ? parts : [1];
    const rawStep = patt[pIndex % patt.length];
    const stepAbs = Math.abs(rawStep);
    const delta = rawStep < 0 ? -stepAbs : dir * stepAbs;
    const cur = Number.isFinite(currentNode.segmentIndex) ? currentNode.segmentIndex : 0;
    currentNode.segmentIndex = ((cur + delta) % segments + segments) % segments;
    currentNode.patternIndex = (pIndex + 1) % patt.length;
  }
  return true;
}

// Build center instrument UI (Engine + Preset dropdowns) and return a <div>
export function buildCenterInstrumentPanel(node, deps) {
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
    showSamplerPanel,
    showSamplerOrbMenu,
    showResonauterPanel,
    showResonauterOrbMenu,
    showAnalogOrbMenu,
    showMotorOrbMenu,
    showClockworkOrbMenu,
    showRadioOrbPanel,
    showToneFmSynthMenu,
    showPulseSynthMenu,
    showAlienOrbMenu
  } = deps;

  const container = document.createElement('div');
  container.classList.add('panel-subsection');
  const title = document.createElement('p');
  title.innerHTML = '<strong>Center Instrument</strong>';
  title.style.marginTop = '8px';
  container.appendChild(title);

  const ensureEmbedded = () => {
    let t = node.audioParams?.centerAttachedNodeId ? findNodeById(node.audioParams.centerAttachedNodeId) : null;
    
    // Return existing instrument if found
    if (t) {
      console.log('Using existing center instrument', t.id, 'for Circle of Fifths node', node.id);
      return t;
    }
    
    // If no instrument exists, this shouldn't happen if initialization worked properly
    console.warn('ensureEmbedded called but no instrument exists - this may indicate a bug');
    return null;
  };

  const engineLabel = document.createElement('label');
  engineLabel.textContent = 'Engine:';
  engineLabel.style.marginRight = '6px';
  const engineSelect = document.createElement('select');
  [
    { v: 'sampler', t: 'Sampler' },
    { v: 'fm', t: 'FM Synth' },
    { v: 'analog', t: 'Analog' },
    { v: 'pulse', t: 'Pulse Synth' },
    { v: 'alien_orb', t: 'Alien Orb' },
    { v: 'midi_orb', t: 'MIDI Orb' },
    { v: 'resonauter', t: 'Resonauter' },
  ].forEach((o) => {
    const opt = document.createElement('option');
    opt.value = o.v;
    opt.textContent = o.t;
    engineSelect.appendChild(opt);
  });
  container.appendChild(engineLabel);
  container.appendChild(engineSelect);

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
    } else if (engine === 'pulse') {
      list = ['pulse'];
    } else if (engine === 'alien_orb') {
      list = ['alien_orb'];
    } else if (engine === 'midi_orb') {
      list = ['midi_orb'];
    } else if (engine === 'resonauter') {
      list = ['resonauter'];
    }
    if (!list || list.length === 0) {
      list = engine === 'fm' ? ['fm_bell'] : 
            engine === 'analog' ? ['sine'] : 
            engine === 'pulse' ? ['pulse'] :
            engine === 'alien_orb' ? ['alien_orb'] :
            engine === 'midi_orb' ? ['midi_orb'] :
            engine === 'resonauter' ? ['resonauter'] :
            ['sampler_marimba'];
    }
    list.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t.replace(/^sampler_/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      presetSelect.appendChild(opt);
    });
  };

  (function initEngine() {
    const t = node.audioParams?.centerAttachedNodeId ? findNodeById(node.audioParams.centerAttachedNodeId) : null;
    let engine = 'sampler';
    let preset = 'sampler_marimba';
    if (t && t.type) {
      // Check the node type first, then waveform
      if (t.type === 'alien_orb') {
        engine = 'alien_orb';
        preset = 'alien_orb';
      } else if (t.type === 'midi_orb') {
        engine = 'midi_orb'; 
        preset = 'midi_orb';
      } else if (t.type === 'resonauter') {
        engine = 'resonauter';
        preset = 'resonauter';
      } else if (t.type === 'sound' && t.audioParams && (t.audioParams.engine === 'pulse' || t.audioParams.waveform === 'pulse')) {
        engine = 'pulse';
        preset = 'pulse';
      } else if (t.type === 'sound' && t.audioParams && t.audioParams.waveform) {
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
    } else if (!t) {
      // Only create an instrument if we don't have one at all during initialization
      console.log('Creating initial center instrument for Circle of Fifths node', node.id);
      const newInstrument = addNode(node.x, node.y, 'sound', 'sampler_marimba', null);
      node.audioParams = node.audioParams || {};
      node.audioParams.centerAttachedNodeId = newInstrument?.id || null;
      if (newInstrument) newInstrument.isEmbeddedInCircleId = node.id;
    }
    engineSelect.value = engine;
    fillPresets(engine);
    const found = Array.from(presetSelect.options).some((o) => (o.value === preset) && (o.selected = true));
    if (!found && presetSelect.options.length) presetSelect.selectedIndex = 0;
  })();

  const applyPreset = () => {
    const t = ensureEmbedded();
    if (!t) {
      console.error('Cannot apply preset: no center instrument found');
      return;
    }
    const wf = presetSelect.value || 'sampler_marimba';
    try { stopNodeAudio(t); } catch {}
    
    // Store old pitch and scale to preserve them
    const oldPitch = t.audioParams?.pitch;
    const oldScaleIndex = t.audioParams?.scaleIndex;
    
    // Set the node type and parameters based on selection
    if (wf === 'alien_orb') {
      t.type = 'alien_orb';
      t.audioParams = t.audioParams || {};
    } else if (wf === 'midi_orb') {
      t.type = 'midi_orb';
      t.audioParams = t.audioParams || {};
    } else if (wf === 'resonauter') {
      t.type = 'resonauter';
      t.audioParams = t.audioParams || {};
    } else if (wf === 'pulse') {
      // Pulse synth is a sound node with specific engine settings
      t.type = 'sound';
      t.audioParams = t.audioParams || {};
      t.audioParams.engine = 'pulse';
      t.audioParams.waveform = 'pulse';
    } else {
      // Regular sound node with waveform
      t.type = 'sound';
      t.audioParams = t.audioParams || {};
      
      // Apply the full preset, not just the waveform
      const analogPreset = analogWaveformPresets.find(a => a.type === wf);
      const fmPreset = fmSynthPresets.find(f => f.type === wf);
      const samplerPreset = samplerWaveformTypes.find(s => s.type === wf);
      
      if (fmPreset && fmPreset.details) {
        // FM synth
        Object.assign(t.audioParams, fmPreset.details);
        t.audioParams.engine = 'tonefm';
      } else if (analogPreset && analogPreset.details) {
        // Analog synth - need to flatten nested envelope parameters and map parameter names
        const details = { ...analogPreset.details };
        
        // Map oscillator type parameter names
        if (details.osc1Type !== undefined) {
          details.osc1Waveform = details.osc1Type;
          delete details.osc1Type;
        }
        if (details.osc2Type !== undefined) {
          details.osc2Waveform = details.osc2Type;
          delete details.osc2Type;
        }
        
        // Ensure osc2 is enabled if preset uses it
        if (details.osc2Level !== undefined && details.osc2Level > 0) {
          details.osc2Enabled = true;
        }
        
        // Flatten ampEnv nested parameters
        if (details.ampEnv) {
          if (details.ampEnv.attack !== undefined) details.ampEnvAttack = details.ampEnv.attack;
          if (details.ampEnv.decay !== undefined) details.ampEnvDecay = details.ampEnv.decay;
          if (details.ampEnv.sustain !== undefined) details.ampEnvSustain = details.ampEnv.sustain;
          if (details.ampEnv.release !== undefined) details.ampEnvRelease = details.ampEnv.release;
          delete details.ampEnv;
        }
        
        // Flatten filterEnv nested parameters
        if (details.filterEnv) {
          if (details.filterEnv.attack !== undefined) details.filterEnvAttack = details.filterEnv.attack;
          if (details.filterEnv.decay !== undefined) details.filterEnvDecay = details.filterEnv.decay;
          if (details.filterEnv.sustain !== undefined) details.filterEnvSustain = details.filterEnv.sustain;
          if (details.filterEnv.release !== undefined) details.filterEnvRelease = details.filterEnv.release;
          delete details.filterEnv;
        }
        
        // Apply flattened parameters
        Object.assign(t.audioParams, details);
        t.audioParams.engine = 'tone';
        console.log('Applied analog preset parameters:', details, 'Full audioParams:', t.audioParams);
      } else if (samplerPreset) {
        // Sampler - no engine needed
      }
      
      // Set the waveform
      t.audioParams.waveform = wf;
    }
    
    // Restore pitch and scale for all types
    if (oldPitch !== undefined) t.audioParams.pitch = oldPitch;
    if (oldScaleIndex !== undefined) t.audioParams.scaleIndex = oldScaleIndex;
    
    console.log('Before recreating audio nodes:', t.audioParams);
    t.audioNodes = createAudioNodesForNode(t);
    console.log('After creating audio nodes:', t.audioNodes);
    if (t.audioNodes) {
      updateNodeAudioParams(t);
      console.log('After updating audio params');
    }
    saveState();
    draw();
  };

  engineSelect.addEventListener('change', () => {
    fillPresets(engineSelect.value);
    applyPreset();
  });
  presetSelect.addEventListener('change', applyPreset);

  // Add synth parameter button
  const synthParamBtn = document.createElement('button');
  synthParamBtn.textContent = '⚙️ Parameters';
  synthParamBtn.classList.add('themed-button');
  synthParamBtn.style.marginLeft = '12px';
  synthParamBtn.addEventListener('click', () => {
    const t = ensureEmbedded();
    if (!t) return;
    
    // Open appropriate synth panel based on node type and engine
    if (t.type === 'sound' && t.audioParams) {
      if (t.audioParams.waveform && t.audioParams.waveform.startsWith('sampler_')) {
        // Sampler
        if (showSamplerOrbMenu) showSamplerOrbMenu(t);
      } else if (t.audioParams.engine === 'tonefm') {
        // FM synth
        if (showToneFmSynthMenu) showToneFmSynthMenu(t);
      } else if (t.audioParams.engine === 'tone') {
        // Analog synth
        if (showAnalogOrbMenu) showAnalogOrbMenu(t);
      } else if (t.audioParams.engine === 'pulse') {
        // Pulse synth
        if (showPulseSynthMenu) showPulseSynthMenu(t);
      }
    } else if (t.type === 'alien_orb') {
      if (showAlienOrbMenu) showAlienOrbMenu(t);
    } else if (t.type === 'resonauter') {
      if (showResonauterOrbMenu) showResonauterOrbMenu(t);
    } else if (t.type === 'motor_orb') {
      if (showMotorOrbMenu) showMotorOrbMenu(t);
    } else if (t.type === 'clockwork_orb') {
      if (showClockworkOrbMenu) showClockworkOrbMenu(t);
    } else if (t.type === 'radio_orb') {
      if (showRadioOrbPanel) showRadioOrbPanel(t);
    }
  });
  container.appendChild(synthParamBtn);

  return container;
}
