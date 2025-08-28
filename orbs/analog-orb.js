import * as Tone from 'tone'
import { sanitizeWaveformType } from "../utils/oscillatorUtils.js";

export const DEFAULT_ANALOG_ORB_PARAMS = {
  osc1Waveform: 'sawtooth',
  osc1Octave: 0,
  osc1Level: 0.7,
  osc2Enabled: true,
  osc2Waveform: 'square',
  osc2Octave: -1,
  osc2Detune: 0,
  osc2Level: 0.7,
  noiseLevel: 0,
  filterType: 'lowpass',
  filterCutoff: 4000,
  filterResonance: 1.0,
  ampEnvAttack: 0.02,
  ampEnvDecay: 0.3,
  ampEnvSustain: 0.6,
  ampEnvRelease: 0.4,
  reverbSend: 0.1,
  delaySend: 0.1,
  visualStyle: 'prorb_default',
  ignoreGlobalSync: false,
};

export function createAnalogOrb(node) {
  const p = node.audioParams;
  const createSource = (wave, detune = 0) => {
    return new Tone.Oscillator({ type: sanitizeWaveformType(wave), detune });
  };
  const audioNodes = {
    osc1: createSource(p.osc1Waveform),
    osc1Gain: new Tone.Gain(p.osc1Level ?? 1.0),
    osc2: createSource(p.osc2Waveform, p.osc2Detune),
    osc2Gain: new Tone.Gain(p.osc2Enabled ? (p.osc2Level ?? 1.0) : 0),
    noise: new Tone.Noise('white'),
    noiseGain: new Tone.Gain(p.noiseLevel ?? 0),
    filter: new Tone.Filter(p.filterCutoff, p.filterType),
    ampEnvControl: new Tone.Gain(0),
    mainGain: new Tone.Gain(0),
    reverbSendGain: new Tone.Gain(p.reverbSend),
    delaySendGain: new Tone.Gain(p.delaySend),
  };

  audioNodes.osc1.connect(audioNodes.osc1Gain);
  audioNodes.osc1Gain.connect(audioNodes.filter);

  audioNodes.osc2.connect(audioNodes.osc2Gain);
  audioNodes.osc2Gain.connect(audioNodes.filter);

  try { audioNodes.noise.start(); } catch {}
  audioNodes.noise.connect(audioNodes.noiseGain);
  audioNodes.noiseGain.connect(audioNodes.filter);

  audioNodes.filter.type = p.filterType;
  audioNodes.filter.frequency.value = p.filterCutoff;
  audioNodes.filter.Q.value = p.filterResonance;
  audioNodes.filter.connect(audioNodes.ampEnvControl);

  audioNodes.ampEnvControl.gain.value = 1.0;
  audioNodes.ampEnvControl.connect(audioNodes.mainGain);


  audioNodes.mainGain.gain.value = 0.0;
  audioNodes.reverbSendGain.gain.value = p.reverbSend;
  audioNodes.delaySendGain.gain.value = p.delaySend;
  audioNodes.mainGain.connect(audioNodes.reverbSendGain);
  audioNodes.mainGain.connect(audioNodes.delaySendGain);

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    audioNodes.reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    audioNodes.delaySendGain.connect(globalThis.masterDelaySendGain);
  }
  // Always create sends; connect if inputs exist
  audioNodes.mistSendGain = new Tone.Gain(0);
  audioNodes.crushSendGain = new Tone.Gain(0);
  audioNodes.mainGain.connect(audioNodes.mistSendGain);
  audioNodes.mainGain.connect(audioNodes.crushSendGain);
  try {
    if (globalThis.mistEffectInput) {
      audioNodes.mistSendGain.connect(globalThis.mistEffectInput);
      console.log('[PATCH][ANALOG] mist send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][ANALOG] mist send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}
  try {
    if (globalThis.crushEffectInput) {
      audioNodes.crushSendGain.connect(globalThis.crushEffectInput);
      console.log('[PATCH][ANALOG] crush send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][ANALOG] crush send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}

  audioNodes.orbitoneOscillators = [];
  audioNodes.orbitoneOsc1Gains = [];
  audioNodes.orbitoneOsc2s = [];
  audioNodes.orbitoneOsc2Gains = [];
  audioNodes.orbitoneNoises = [];
  audioNodes.orbitoneNoiseGains = [];
  audioNodes.orbitoneIndividualGains = [];
  if (p.orbitonesEnabled && p.orbitoneCount > 0) {
    const waveform1 = sanitizeWaveformType(p.osc1Waveform || 'sine');
    const waveform2 = sanitizeWaveformType(p.osc2Waveform || 'sine');
    for (let i = 0; i < p.orbitoneCount; i++) {
      const o1 = new Tone.Oscillator({ type: waveform1 });
      const o2 = new Tone.Oscillator({ type: waveform2, detune: p.osc2Detune });
      const noise = new Tone.Noise('white');
      const g1 = new Tone.Gain(p.osc1Level ?? 1.0);
      const g2 = new Tone.Gain(p.osc2Enabled ? (p.osc2Level ?? 1.0) : 0);
      const nG = new Tone.Gain(p.noiseLevel ?? 0);
      const mix = new Tone.Gain(0);
      o1.connect(g1);
      g1.connect(mix);
      o2.connect(g2);
      g2.connect(mix);
      noise.connect(nG);
      nG.connect(mix);
      mix.connect(audioNodes.filter);
      try { o1.start(); } catch {}
      try { o2.start(); } catch {}
      try { noise.start(); } catch {}
      audioNodes.orbitoneOscillators.push(o1);
      audioNodes.orbitoneOsc1Gains.push(g1);
      audioNodes.orbitoneOsc2s.push(o2);
      audioNodes.orbitoneOsc2Gains.push(g2);
      audioNodes.orbitoneNoises.push(noise);
      audioNodes.orbitoneNoiseGains.push(nG);
      audioNodes.orbitoneIndividualGains.push(mix);
    }
  }
  if (globalThis.masterGain) {
    audioNodes.mainGain.connect(globalThis.masterGain);
  }

  try { audioNodes.osc1.start(); } catch {}
  try { audioNodes.osc2.start(); } catch {}

  return {
    oscillator1: audioNodes.osc1,
    osc1Gain: audioNodes.osc1Gain,
    oscillator2: audioNodes.osc2,
    osc2Gain: audioNodes.osc2Gain,
    lowPassFilter: audioNodes.filter,
    ampEnvControl: audioNodes.ampEnvControl,
    gainNode: audioNodes.mainGain,
    reverbSendGain: audioNodes.reverbSendGain,
    delaySendGain: audioNodes.delaySendGain,
    mistSendGain: audioNodes.mistSendGain,
    crushSendGain: audioNodes.crushSendGain,
    noise: audioNodes.noise,
    noiseGain: audioNodes.noiseGain,
    orbitoneOscillators: audioNodes.orbitoneOscillators,
    orbitoneOsc1Gains: audioNodes.orbitoneOsc1Gains,
    orbitoneOsc2s: audioNodes.orbitoneOsc2s,
    orbitoneOsc2Gains: audioNodes.orbitoneOsc2Gains,
    orbitoneNoises: audioNodes.orbitoneNoises,
    orbitoneNoiseGains: audioNodes.orbitoneNoiseGains,
    orbitoneIndividualGains: audioNodes.orbitoneIndividualGains,
  };
}
