import * as Tone from 'tone';
import { sanitizeWaveformType } from '../utils/oscillatorUtils.js';

export const DEFAULT_TONE_FM_SYNTH_PARAMS = {
  carrierWaveform: 'sine',
  modulatorWaveform: 'sine',
  modulatorRatio: 2,
  modulatorDepthScale: 2,
  modulatorLfoRate: 0,
  modulatorLfoDepth: 0,
  modulator2Waveform: 'sine',
  modulator2Ratio: 1,
  modulator2DepthScale: 0,
  modulator2LfoRate: 0,
  modulator2LfoDepth: 0,
  modulator3Waveform: 'sine',
  modulator3Ratio: 1,
  modulator3DepthScale: 0,
  modulator3LfoRate: 0,
  modulator3LfoDepth: 0,
  algorithm: 0,
  carrierEnvAttack: 0.01,
  carrierEnvDecay: 0.3,
  carrierEnvSustain: 0,
  carrierEnvRelease: 0.3,
  modulatorEnvAttack: null,
  modulatorEnvDecay: null,
  modulatorEnvSustain: 1,
  modulatorEnvRelease: null,
  modulator2EnvAttack: null,
  modulator2EnvDecay: null,
  modulator2EnvSustain: 1,
  modulator2EnvRelease: null,
  modulator3EnvAttack: null,
  modulator3EnvDecay: null,
  modulator3EnvSustain: 1,
  modulator3EnvRelease: null,
  carrierDetune: 0,
  modulatorDetune: 0,
  modulator2Detune: 0,
  modulator3Detune: 0,
  filterType: 'lowpass',
  filterCutoff: 2000,
  filterResonance: 1,
  detune: 0,
  reverbSend: 0.1,
  delaySend: 0.1,
  visualStyle: 'fm_default',
  ignoreGlobalSync: false,
};

export const fmAlgorithms = [
  {
    label: 'Alg 1',
    connections: [
      { source: 4, target: 3 },
      { source: 3, target: 2 },
      { source: 2, target: 1 },
    ],
    carriers: [1],
  },
  {
    label: 'Alg 2',
    connections: [
      { source: 4, target: 3 },
      { source: 3, target: 2 },
    ],
    carriers: [2, 1],
  },
  {
    label: 'Alg 3',
    connections: [
      { source: 4, target: 3 },
      { source: 2, target: 1 },
    ],
    carriers: [3, 1],
  },
  {
    label: 'Alg 4',
    connections: [
      { source: 4, target: 3 },
      { source: 4, target: 2 },
      { source: 3, target: 1 },
      { source: 2, target: 1 },
    ],
    carriers: [1],
  },
  {
    label: 'Alg 5',
    connections: [
      { source: 4, target: 3 },
      { source: 3, target: 1 },
      { source: 2, target: 1 },
    ],
    carriers: [1],
  },
  {
    label: 'Alg 6',
    connections: [
      { source: 4, target: 2 },
      { source: 2, target: 1 },
      { source: 3, target: 1 },
    ],
    carriers: [1],
  },
  {
    label: 'Alg 7',
    connections: [
      { source: 4, target: 3 },
    ],
    carriers: [3, 2, 1],
  },
  {
    label: 'Alg 8',
    connections: [],
    carriers: [4, 3, 2, 1],
  },
];

export function createToneFmSynthOrb(node) {
  const p = node.audioParams;

  function createOperator(prefix, envFallback = 'carrier') {
    const osc = new Tone.Oscillator({
      type: sanitizeWaveformType(p[`${prefix}Waveform`]) || 'sine',
      frequency: 440,
    });
    osc.detune.value = p[`${prefix}Detune`] ?? (prefix === 'carrier' ? p.detune ?? 0 : 0);
    const env = new Tone.Envelope({
      attack: p[`${prefix}EnvAttack`] ?? p[`${envFallback}EnvAttack`] ?? 0.01,
      decay: p[`${prefix}EnvDecay`] ?? p[`${envFallback}EnvDecay`] ?? 0.3,
      sustain: p[`${prefix}EnvSustain`] ?? p[`${envFallback}EnvSustain`] ?? 1,
      release: p[`${prefix}EnvRelease`] ?? p[`${envFallback}EnvRelease`] ?? 0.3,
    });
    const envGain = new Tone.Gain(0);
    env.connect(envGain.gain);
    osc.connect(envGain);
    const depthBase = (p[`${prefix}DepthScale`] ?? 0) * 10;
    const modGain = new Tone.Gain(depthBase);
    envGain.connect(modGain);
    const lfo = new Tone.LFO({
      frequency: p[`${prefix}LfoRate`] ?? 0,
      min: depthBase - (p[`${prefix}LfoDepth`] ?? 0) * 10,
      max: depthBase + (p[`${prefix}LfoDepth`] ?? 0) * 10,
      phase: 90,
    });
    lfo.connect(modGain.gain);
    lfo.start();
    const outGain = new Tone.Gain(1);
    envGain.connect(outGain);
    return { osc, env, modGain, outGain, lfo };
  }

  function createVoice() {
    const voiceOp1 = createOperator('carrier', 'carrier');
    const voiceOp2 = createOperator('modulator');
    const voiceOp3 = createOperator('modulator2');
    const voiceOp4 = createOperator('modulator3');
    
    const voiceOperators = [null, voiceOp1, voiceOp2, voiceOp3, voiceOp4];
    
    // Start oscillators
    [voiceOp1, voiceOp2, voiceOp3, voiceOp4].forEach(o => o.osc.start());
    
    // Apply initial detune values
    voiceOp1.osc.detune.value = p.carrierDetune ?? p.detune ?? 0;
    voiceOp2.osc.detune.value = p.modulatorDetune ?? 0;
    voiceOp3.osc.detune.value = p.modulator2Detune ?? 0;
    voiceOp4.osc.detune.value = p.modulator3Detune ?? 0;
    
    let isActive = false;
    let currentFreq = null;
    
    return {
      operators: voiceOperators,
      isActive: () => isActive,
      getCurrentFreq: () => currentFreq,
      triggerStart: (time, frequency, velocity = 1) => {
        currentFreq = frequency;
        isActive = true;
        
        voiceOp1.osc.frequency.setValueAtTime(frequency, time);
        voiceOp2.osc.frequency.setValueAtTime(frequency * (p.modulatorRatio ?? 1), time);
        voiceOp3.osc.frequency.setValueAtTime(frequency * (p.modulator2Ratio ?? 1), time);
        voiceOp4.osc.frequency.setValueAtTime(frequency * (p.modulator3Ratio ?? 1), time);
        
        voiceOp1.env.triggerAttack(time, velocity);
        voiceOp2.env.triggerAttack(time);
        voiceOp3.env.triggerAttack(time);
        voiceOp4.env.triggerAttack(time);
      },
      triggerStop: (time) => {
        isActive = false;
        currentFreq = null;
        
        voiceOp1.env.triggerRelease(time);
        voiceOp2.env.triggerRelease(time);
        voiceOp3.env.triggerRelease(time);
        voiceOp4.env.triggerRelease(time);
      }
    };
  }

  // Create voice pool
  const voices = [];
  for (let i = 0; i < 4; i++) {
    voices.push(createVoice());
  }
  let currentVoiceIndex = 0;

  // Shared filter and effects chain
  const filter = new Tone.Filter(p.filterCutoff ?? 20000, p.filterType ?? 'lowpass');
  filter.Q.value = p.filterResonance ?? 1;

  const gainNode = new Tone.Gain(1);
  filter.connect(gainNode);

  const reverbSendGain = new Tone.Gain(p.reverbSend ?? 0.1);
  const delaySendGain = new Tone.Gain(p.delaySend ?? 0.1);
  gainNode.connect(reverbSendGain);
  gainNode.connect(delaySendGain);

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    delaySendGain.connect(globalThis.masterDelaySendGain);
  }

  // Always create effect sends so external updaters can target them
  let mistSendGain = new Tone.Gain(0);
  let crushSendGain = new Tone.Gain(0);
  // Feed from main signal
  gainNode.connect(mistSendGain);
  gainNode.connect(crushSendGain);
  // Connect to global effect inputs if available (can also be connected later by host)
  try {
    if (globalThis.mistEffectInput) {
      mistSendGain.connect(globalThis.mistEffectInput);
      console.log('[PATCH][FM] mist send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][FM] mist send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}
  try {
    if (globalThis.crushEffectInput) {
      crushSendGain.connect(globalThis.crushEffectInput);
      console.log('[PATCH][FM] crush send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][FM] crush send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}

  if (globalThis.masterGain) {
    gainNode.connect(globalThis.masterGain);
  } else {
    gainNode.connect(Tone.getContext().destination);
  }

  function applyAlgorithm(index = 0) {
    const alg = fmAlgorithms[index] || fmAlgorithms[0];
    
    // Apply algorithm to all voices
    voices.forEach(voice => {
      const operators = voice.operators;
      // Disconnect all operators
      for (let i = 1; i <= 4; i++) {
        operators[i].modGain.disconnect();
        operators[i].outGain.disconnect();
      }
      // Reconnect based on algorithm
      alg.connections.forEach(({ source, target }) => {
        operators[source].modGain.connect(operators[target].osc.frequency);
      });
      alg.carriers.forEach(idx => {
        operators[idx].outGain.connect(filter);
      });
    });
    
    // Sync parameters after algorithm change
    broadcastAllParameters();
  }
  applyAlgorithm(p.algorithm ?? 0);

  const triggerStart = (time, freqOrVelocity = 1, maybeVelocity = null) => {
    // Allow explicit frequency for external polyphonic triggers (e.g., sequencers)
    // Usage:
    //  - triggerStart(time, velocity)                  // legacy
    //  - triggerStart(time, frequency, velocity)       // preferred for chords
    let currentFreq;
    let velocity;
    if (typeof maybeVelocity === 'number') {
      currentFreq = freqOrVelocity;
      velocity = maybeVelocity;
    } else {
      velocity = freqOrVelocity;
      currentFreq = firstVoice.operators[1].osc.frequency.value;
    }

    // Find an available voice (inactive) or use round-robin
    let selectedVoice = voices.find(voice => !voice.isActive());
    if (!selectedVoice) {
      selectedVoice = voices[currentVoiceIndex];
      currentVoiceIndex = (currentVoiceIndex + 1) % voices.length;
    }

    // Trigger the selected voice with the provided/current frequency
    selectedVoice.triggerStart(time, currentFreq, velocity);
  };

  const triggerStop = (time) => {
    // Stop all active voices (for backward compatibility with monophonic behavior)
    voices.forEach(voice => {
      if (voice.isActive()) {
        voice.triggerStop(time);
      }
    });
  };

  function createOrbitone(freq) {
    const orbOp1 = createOperator('carrier', 'carrier');
    const orbOp2 = createOperator('modulator');
    const orbOp3 = createOperator('modulator2');
    const orbOp4 = createOperator('modulator3');
    
    const orbFilter = new Tone.Filter(p.filterCutoff ?? 20000, p.filterType ?? 'lowpass');
    orbFilter.Q.value = p.filterResonance ?? 1;
    
    const orbGainNode = new Tone.Gain(0);
    orbFilter.connect(orbGainNode);
    
    const orbOperators = [null, orbOp1, orbOp2, orbOp3, orbOp4];
    
    function applyOrbAlgorithm(index = 0) {
      const alg = fmAlgorithms[index] || fmAlgorithms[0];
      for (let i = 1; i <= 4; i++) {
        orbOperators[i].modGain.disconnect();
        orbOperators[i].outGain.disconnect();
      }
      alg.connections.forEach(({ source, target }) => {
        orbOperators[source].modGain.connect(orbOperators[target].osc.frequency);
      });
      alg.carriers.forEach(idx => {
        orbOperators[idx].outGain.connect(orbFilter);
      });
    }
    
    applyOrbAlgorithm(p.algorithm ?? 0);
    
    orbOp1.osc.frequency.setValueAtTime(freq, 0);
    orbOp2.osc.frequency.setValueAtTime(freq * (p.modulatorRatio ?? 1), 0);
    orbOp3.osc.frequency.setValueAtTime(freq * (p.modulator2Ratio ?? 1), 0);
    orbOp4.osc.frequency.setValueAtTime(freq * (p.modulator3Ratio ?? 1), 0);
    
    orbOp1.osc.detune.value = p.carrierDetune ?? p.detune ?? 0;
    orbOp2.osc.detune.value = p.modulatorDetune ?? 0;
    orbOp3.osc.detune.value = p.modulator2Detune ?? 0;
    orbOp4.osc.detune.value = p.modulator3Detune ?? 0;
    
    [orbOp1, orbOp2, orbOp3, orbOp4].forEach(o => o.osc.start());
    
    const orbTriggerStart = (time, velocity = 1) => {
      orbOp1.env.triggerAttack(time, velocity);
      orbOp2.env.triggerAttack(time);
      orbOp3.env.triggerAttack(time);
      orbOp4.env.triggerAttack(time);
    };
    
    const orbTriggerStop = (time) => {
      orbOp1.env.triggerRelease(time);
      orbOp2.env.triggerRelease(time);
      orbOp3.env.triggerRelease(time);
      orbOp4.env.triggerRelease(time);
    };
    
    return {
      gainNode: orbGainNode,
      triggerStart: orbTriggerStart,
      triggerStop: orbTriggerStop,
      setAlgorithm: applyOrbAlgorithm,
      operators: orbOperators,
      filter: orbFilter,
    };
  }

  // Parameter synchronization system
  function syncParameterAcrossVoices(paramPath, sourceVoiceIndex = 0) {
    const sourceVoice = voices[sourceVoiceIndex];
    if (!sourceVoice) return;
    
    try {
      // Get the value from source voice
      const pathParts = paramPath.split('.');
      let sourceObj = sourceVoice;
      for (const part of pathParts) {
        sourceObj = sourceObj[part];
        if (sourceObj === undefined || sourceObj === null) return;
      }
      
      // Extract the actual value (handle Tone.js parameters)
      let sourceValue;
      if (typeof sourceObj === 'object' && sourceObj.value !== undefined) {
        sourceValue = sourceObj.value;
      } else if (typeof sourceObj === 'number' || typeof sourceObj === 'string') {
        sourceValue = sourceObj;
      } else {
        return; // Can't sync this type of parameter
      }
      
      // Apply to all other voices
      voices.forEach((voice, index) => {
        if (index === sourceVoiceIndex) return;
        
        try {
          let target = voice;
          for (let i = 0; i < pathParts.length - 1; i++) {
            target = target[pathParts[i]];
            if (!target) return;
          }
          
          const finalProp = pathParts[pathParts.length - 1];
          if (target[finalProp] && typeof target[finalProp].value !== 'undefined') {
            target[finalProp].value = sourceValue;
          } else if (typeof target[finalProp] === 'function') {
            target[finalProp](sourceValue);
          } else if (target[finalProp] !== undefined) {
            target[finalProp] = sourceValue;
          }
        } catch (e) {
          // Silently skip parameters that can't be synced
        }
      });
    } catch (e) {
      // Silently skip if synchronization fails
    }
  }

  // Simplified parameter broadcasting - only sync essential parameters safely
  function broadcastAllParameters() {
    // Only sync parameters that are known to be safe and essential
    try {
      const sourceVoice = voices[0];
      
      // Sync waveform types (strings)
      voices.forEach((voice, index) => {
        if (index === 0) return;
        try {
          voice.operators[1].osc.type = sourceVoice.operators[1].osc.type;
          voice.operators[2].osc.type = sourceVoice.operators[2].osc.type;
          voice.operators[3].osc.type = sourceVoice.operators[3].osc.type;
          voice.operators[4].osc.type = sourceVoice.operators[4].osc.type;
        } catch (e) {}
      });
      
      // Sync detune values (but not frequency - each voice has its own frequency)
      voices.forEach((voice, index) => {
        if (index === 0) return;
        try {
          voice.operators[1].osc.detune.value = sourceVoice.operators[1].osc.detune.value;
          voice.operators[2].osc.detune.value = sourceVoice.operators[2].osc.detune.value;
          voice.operators[3].osc.detune.value = sourceVoice.operators[3].osc.detune.value;
          voice.operators[4].osc.detune.value = sourceVoice.operators[4].osc.detune.value;
        } catch (e) {}
      });
      
      // Sync modulation gain values
      voices.forEach((voice, index) => {
        if (index === 0) return;
        try {
          voice.operators[2].modGain.gain.value = sourceVoice.operators[2].modGain.gain.value;
          voice.operators[3].modGain.gain.value = sourceVoice.operators[3].modGain.gain.value;
          voice.operators[4].modGain.gain.value = sourceVoice.operators[4].modGain.gain.value;
        } catch (e) {}
      });
    } catch (e) {
      // Silently fail if sync not possible
    }
  }

  // Set up parameter monitoring on the first voice
  function setupParameterMonitoring() {
    // This would ideally intercept parameter changes, but for now we'll rely on periodic sync
    // In a more sophisticated implementation, we could use Proxy or override setter methods
  }

  setupParameterMonitoring();
  
  // Initial parameter sync
  broadcastAllParameters();

  // Expose the first voice's operators for UI compatibility
  const firstVoice = voices[0];

  return {
    // Backward compatibility - expose first voice components
    oscillator1: firstVoice.operators[1].osc,
    carrierEnv: firstVoice.operators[1].env,
    modulatorOsc1: firstVoice.operators[2].osc,
    modulatorGain1: firstVoice.operators[2].modGain,
    modulatorEnv1: firstVoice.operators[2].env,
    modulatorLfo1: firstVoice.operators[2].lfo,
    modulatorOsc2: firstVoice.operators[3].osc,
    modulatorGain2: firstVoice.operators[3].modGain,
    modulatorEnv2: firstVoice.operators[3].env,
    modulatorLfo2: firstVoice.operators[3].lfo,
    modulatorOsc3: firstVoice.operators[4].osc,
    modulatorGain3: firstVoice.operators[4].modGain,
    modulatorEnv3: firstVoice.operators[4].env,
    modulatorLfo3: firstVoice.operators[4].lfo,
    lowPassFilter: filter,
    gainNode,
    reverbSendGain,
    delaySendGain,
    mistSendGain,
    crushSendGain,
    triggerStart,
    triggerStop,
    setAlgorithm: applyAlgorithm,
    createOrbitone,
    
    // Voice pool access and parameter management
    voices,
    syncParameterAcrossVoices,
    broadcastAllParameters,
    
    // Parameter broadcasting methods for UI compatibility
    setCarrierFrequency: (freq) => {
      firstVoice.operators[1].osc.frequency.value = freq;
      // Note: Don't sync this across voices as each voice needs its own frequency
    },
    setModulatorRatio: (ratio) => {
      voices.forEach(voice => {
        const carrierFreq = voice.operators[1].osc.frequency.value;
        voice.operators[2].osc.frequency.value = carrierFreq * ratio;
      });
    },
    setModulator2Ratio: (ratio) => {
      voices.forEach(voice => {
        const carrierFreq = voice.operators[1].osc.frequency.value;
        voice.operators[3].osc.frequency.value = carrierFreq * ratio;
      });
    },
    setModulator3Ratio: (ratio) => {
      voices.forEach(voice => {
        const carrierFreq = voice.operators[1].osc.frequency.value;
        voice.operators[4].osc.frequency.value = carrierFreq * ratio;
      });
    },
    
    // Enhanced algorithm setter that applies to all voices
    setAlgorithmAll: (index) => {
      applyAlgorithm(index);
    },
    
    // Manual parameter sync trigger for UI updates
    syncParameters: () => {
      broadcastAllParameters();
    },
  };
}
