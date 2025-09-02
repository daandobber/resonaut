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

  const op1 = createOperator('carrier', 'carrier');
  const op2 = createOperator('modulator');
  const op3 = createOperator('modulator2');
  const op4 = createOperator('modulator3');

  // Filter and effects chain
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

  const operators = [null, op1, op2, op3, op4];

  function applyAlgorithm(index = 0) {
    const alg = fmAlgorithms[index] || fmAlgorithms[0];
    for (let i = 1; i <= 4; i++) {
      operators[i].modGain.disconnect();
      operators[i].outGain.disconnect();
    }
    alg.connections.forEach(({ source, target }) => {
      operators[source].modGain.connect(operators[target].osc.frequency);
    });
    alg.carriers.forEach(idx => {
      operators[idx].outGain.connect(filter);
    });
  }
  applyAlgorithm(p.algorithm ?? 0);

  // Start oscillators
  [op1, op2, op3, op4].forEach(o => o.osc.start());

  const triggerStart = (time, velocity = 1) => {
    const baseFreq = op1.osc.frequency.value;
    op2.osc.frequency.setValueAtTime(baseFreq * (p.modulatorRatio ?? 1), time);
    op3.osc.frequency.setValueAtTime(baseFreq * (p.modulator2Ratio ?? 1), time);
    op4.osc.frequency.setValueAtTime(baseFreq * (p.modulator3Ratio ?? 1), time);
    op1.env.triggerAttack(time, velocity);
    op2.env.triggerAttack(time);
    op3.env.triggerAttack(time);
    op4.env.triggerAttack(time);
  };

  const triggerStop = (time) => {
    op1.env.triggerRelease(time);
    op2.env.triggerRelease(time);
    op3.env.triggerRelease(time);
    op4.env.triggerRelease(time);
  };

  op1.osc.detune.value = p.carrierDetune ?? p.detune ?? 0;
  op2.osc.detune.value = p.modulatorDetune ?? 0;
  op3.osc.detune.value = p.modulator2Detune ?? 0;
  op4.osc.detune.value = p.modulator3Detune ?? 0;

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

  return {
    oscillator1: op1.osc,
    carrierEnv: op1.env,
    modulatorOsc1: op2.osc,
    modulatorGain1: op2.modGain,
    modulatorEnv1: op2.env,
    modulatorLfo1: op2.lfo,
    modulatorOsc2: op3.osc,
    modulatorGain2: op3.modGain,
    modulatorEnv2: op3.env,
    modulatorLfo2: op3.lfo,
    modulatorOsc3: op4.osc,
    modulatorGain3: op4.modGain,
    modulatorEnv3: op4.env,
    modulatorLfo3: op4.lfo,
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
  };
}
