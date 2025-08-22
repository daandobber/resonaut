import * as Tone from 'tone';
import { sanitizeWaveformType } from '../utils/oscillatorUtils.js';

export const DEFAULT_TONE_FM_SYNTH_PARAMS = {
  carrierWaveform: 'sine',
  modulatorWaveform: 'sine',
  modulatorRatio: 1,
  modulatorDepthScale: 0,
  modulator2Waveform: 'sine',
  modulator2Ratio: 1,
  modulator2DepthScale: 0,
  modulator3Waveform: 'sine',
  modulator3Ratio: 1,
  modulator3DepthScale: 0,
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
  filterType: 'lowpass',
  filterCutoff: 20000,
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
    const env = new Tone.Envelope({
      attack: p[`${prefix}EnvAttack`] ?? p[`${envFallback}EnvAttack`] ?? 0.01,
      decay: p[`${prefix}EnvDecay`] ?? p[`${envFallback}EnvDecay`] ?? 0.3,
      sustain: p[`${prefix}EnvSustain`] ?? p[`${envFallback}EnvSustain`] ?? 1,
      release: p[`${prefix}EnvRelease`] ?? p[`${envFallback}EnvRelease`] ?? 0.3,
    });
    const envGain = new Tone.Gain(0);
    env.connect(envGain.gain);
    osc.connect(envGain);
    const modGain = new Tone.Gain((p[`${prefix}DepthScale`] ?? 0) * 10);
    envGain.connect(modGain);
    const outGain = new Tone.Gain(1);
    envGain.connect(outGain);
    return { osc, env, modGain, outGain };
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

  let mistSendGain = null;
  if (globalThis.mistEffectInput) {
    mistSendGain = new Tone.Gain(0);
    gainNode.connect(mistSendGain);
    mistSendGain.connect(globalThis.mistEffectInput);
  }

  let crushSendGain = null;
  if (globalThis.crushEffectInput) {
    crushSendGain = new Tone.Gain(0);
    gainNode.connect(crushSendGain);
    crushSendGain.connect(globalThis.crushEffectInput);
  }

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

  op1.osc.detune.value = p.detune ?? 0;

  return {
    oscillator1: op1.osc,
    carrierEnv: op1.env,
    modulatorOsc1: op2.osc,
    modulatorGain1: op2.modGain,
    modulatorEnv1: op2.env,
    modulatorOsc2: op3.osc,
    modulatorGain2: op3.modGain,
    modulatorEnv2: op3.env,
    modulatorOsc3: op4.osc,
    modulatorGain3: op4.modGain,
    modulatorEnv3: op4.env,
    lowPassFilter: filter,
    gainNode,
    reverbSendGain,
    delaySendGain,
    mistSendGain,
    crushSendGain,
    triggerStart,
    triggerStop,
    setAlgorithm: applyAlgorithm,
  };
}

