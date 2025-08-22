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
    chain: [
      { source: 3, target: 2 },
      { source: 2, target: 1 },
      { source: 1, target: 0 },
    ],
  },
  {
    label: 'Alg 2',
    chain: [
      { source: 3, target: 2 },
      { source: 2, target: 0 },
      { source: 1, target: 0 },
    ],
  },
  {
    label: 'Alg 3',
    chain: [
      { source: 3, target: 1 },
      { source: 1, target: 0 },
      { source: 2, target: 0 },
    ],
  },
  {
    label: 'Alg 4',
    chain: [
      { source: 3, target: 0 },
      { source: 2, target: 0 },
      { source: 1, target: 0 },
    ],
  },
];

export function createToneFmSynthOrb(node) {
  const p = node.audioParams;

  // Create carrier oscillator
  const carrierOsc = new Tone.Oscillator({
    type: sanitizeWaveformType(p.carrierWaveform),
    frequency: 440,
  });
  const carrierEnv = new Tone.Envelope({
    attack: p.carrierEnvAttack ?? 0.01,
    decay: p.carrierEnvDecay ?? 0.3,
    sustain: p.carrierEnvSustain ?? 0,
    release: p.carrierEnvRelease ?? 0.3,
  });
  const carrierGain = new Tone.Gain(0);
  carrierEnv.connect(carrierGain.gain);
  carrierOsc.connect(carrierGain);

  // Helper to create a modulator operator
  function createMod(prefix) {
    const osc = new Tone.Oscillator({
      type: sanitizeWaveformType(p[`${prefix}Waveform`]) || 'sine',
      frequency: 440,
    });
    const env = new Tone.Envelope({
      attack: p[`${prefix}EnvAttack`] ?? p.modulatorEnvAttack ?? p.carrierEnvAttack ?? 0.01,
      decay: p[`${prefix}EnvDecay`] ?? p.modulatorEnvDecay ?? p.carrierEnvDecay ?? 0.3,
      sustain: p[`${prefix}EnvSustain`] ?? p.modulatorEnvSustain ?? 1,
      release: p[`${prefix}EnvRelease`] ?? p.modulatorEnvRelease ?? p.carrierEnvRelease ?? 0.3,
    });
    const envGain = new Tone.Gain(0);
    env.connect(envGain.gain);
    osc.connect(envGain);
    const depthGain = new Tone.Gain((p[`${prefix}DepthScale`] ?? 0) * 10);
    envGain.connect(depthGain);
    return { osc, env, envGain, depthGain };
  }

  const mod1 = createMod('modulator');
  const mod2 = createMod('modulator2');
  const mod3 = createMod('modulator3');

  // Filter and effects chain
  const filter = new Tone.Filter(p.filterCutoff ?? 20000, p.filterType ?? 'lowpass');
  filter.Q.value = p.filterResonance ?? 1;
  carrierGain.connect(filter);

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

  // Apply algorithm routing
  const modulators = [null, mod1, mod2, mod3];
  function applyAlgorithm(index = 0) {
    const alg = fmAlgorithms[index] || fmAlgorithms[0];
    // Disconnect existing
    [mod1, mod2, mod3].forEach(m => m.depthGain.disconnect());
    alg.chain.forEach(({ source, target }) => {
      modulators[source].depthGain.connect(
        target === 0 ? carrierOsc.frequency : modulators[target].osc.frequency,
      );
    });
  }
  applyAlgorithm(p.algorithm ?? 0);

  // Start oscillators
  carrierOsc.start();
  mod1.osc.start();
  mod2.osc.start();
  mod3.osc.start();

  const triggerStart = (time, velocity = 1) => {
    const baseFreq = carrierOsc.frequency.value;
    mod1.osc.frequency.setValueAtTime(baseFreq * (p.modulatorRatio ?? 1), time);
    mod2.osc.frequency.setValueAtTime(baseFreq * (p.modulator2Ratio ?? 1), time);
    mod3.osc.frequency.setValueAtTime(baseFreq * (p.modulator3Ratio ?? 1), time);
    carrierEnv.triggerAttack(time, velocity);
    mod1.env.triggerAttack(time);
    mod2.env.triggerAttack(time);
    mod3.env.triggerAttack(time);
  };

  const triggerStop = (time) => {
    carrierEnv.triggerRelease(time);
    mod1.env.triggerRelease(time);
    mod2.env.triggerRelease(time);
    mod3.env.triggerRelease(time);
  };

  carrierOsc.detune.value = p.detune ?? 0;

  return {
    oscillator1: carrierOsc,
    carrierEnv,
    modulatorOsc1: mod1.osc,
    modulatorGain1: mod1.depthGain,
    modulatorEnv1: mod1.env,
    modulatorOsc2: mod2.osc,
    modulatorGain2: mod2.depthGain,
    modulatorEnv2: mod2.env,
    modulatorOsc3: mod3.osc,
    modulatorGain3: mod3.depthGain,
    modulatorEnv3: mod3.env,
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

