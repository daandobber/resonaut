
import { sanitizeWaveformType } from "../utils/oscillatorUtils.js";
export const fmSynthPresets = [
  {
    type: "fmBell",
    label: "Bell",
    icon: "\uD83D\uDD14",
    details: {
      visualStyle: "fm_bell",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 1.4,
      modulatorDepthScale: 4,
      carrierEnv: { attack: 0.005, decay: 0.8, sustain: 0, release: 0.5 },
      modulatorEnv: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.2 },
    },
  },
  {
    type: "fmXylo",
    label: "Xylo",
    icon: "\uD83E\uDD41",
    details: {
      visualStyle: "fm_xylo",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 3.5,
      modulatorDepthScale: 10,
      carrierEnv: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
      modulatorEnv: { attack: 0.002, decay: 0.05, sustain: 0, release: 0.1 },
    },
  },
  {
    type: "fmGalaxy",
    label: "Galaxy Pad",
    icon: "\uD83C\uDF20",
    details: {
      visualStyle: "fm_galaxy",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 0.5,
      modulatorDepthScale: 0.1,
      carrierEnv: { attack: 1.5, decay: 2.0, sustain: 0.8, release: 3.0 },
      modulatorEnv: { attack: 2.0, decay: 1.5, sustain: 0.6, release: 2.5 },
    },
  },
  {
    type: "fmCrystal",
    label: "Crystal",
    icon: "\uD83D\uDC8E",
    details: {
      visualStyle: "fm_crystal",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 2.8,
      modulatorDepthScale: 6,
      carrierEnv: { attack: 0.01, decay: 1.0, sustain: 0.1, release: 1.0 },
      modulatorEnv: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.5 },
    },
  },
  {
    type: "fmChime",
    label: "Chime",
    icon: "\uD83C\uDFB5",
    details: {
      visualStyle: "fm_chime",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 4.2,
      modulatorDepthScale: 5,
      carrierEnv: { attack: 0.001, decay: 1.2, sustain: 0, release: 1.2 },
      modulatorEnv: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.8 },
    },
  },
  {
    type: "fmGlass",
    label: "Glass",
    icon: "\uD83C\uDF78",
    details: {
      visualStyle: "fm_glass",
      carrierWaveform: "sine",
      modulatorWaveform: "triangle",
      carrierRatio: 1,
      modulatorRatio: 1.77,
      modulatorDepthScale: 7,
      carrierEnv: { attack: 0.005, decay: 0.5, sustain: 0, release: 0.7 },
      modulatorEnv: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.3 },
    },
  },
  {
    type: "fmOrgan",
    label: "Organ",
    icon: "\uD83C\uDFB9",
    details: {
      visualStyle: "fm_organ",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 2.0,
      modulatorDepthScale: 3,
      carrierEnv: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 0.3 },
      modulatorEnv: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 0.3 },
    },
  },
  {
    type: "fmElectricPiano",
    label: "E-Piano",
    icon: "\uD83C\uDFBC",
    details: {
      visualStyle: "fm_epiano",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 1.0,
      modulatorDepthScale: 4.5,
      carrierEnv: { attack: 0.01, decay: 1.5, sustain: 0, release: 1.0 },
      modulatorEnv: { attack: 0.01, decay: 0.6, sustain: 0, release: 0.5 },
    },
  },
  {
    type: "fmEthnic",
    label: "Ethnic",
    icon: "\uD83C\uDFEE",
    details: {
      visualStyle: "fm_ethnic",
      carrierWaveform: "sine",
      modulatorWaveform: "sawtooth",
      carrierRatio: 1,
      modulatorRatio: 2.53,
      modulatorDepthScale: 5.5,
      carrierEnv: { attack: 0.02, decay: 0.4, sustain: 0, release: 0.6 },
      modulatorEnv: { attack: 0.02, decay: 0.15, sustain: 0, release: 0.3 },
    },
  },
  {
    type: "fmMetallic",
    label: "Metallic",
    icon: "\uD83D\uDD29",
    details: {
      visualStyle: "fm_metallic",
      carrierWaveform: "square",
      modulatorWaveform: "square",
      carrierRatio: 1,
      modulatorRatio: 5.1,
      modulatorDepthScale: 6.5,
      carrierEnv: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.9 },
      modulatorEnv: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.2 },
    },
  },
  {
    type: "fmHarmonic",
    label: "Harmonic",
    icon: "\u2728",
    details: {
      visualStyle: "fm_harmonic",
      carrierWaveform: "sine",
      modulatorWaveform: "triangle",
      carrierRatio: 1,
      modulatorRatio: 3.0,
      modulatorDepthScale: 3.5,
      carrierEnv: { attack: 0.1, decay: 1.0, sustain: 0.5, release: 1.0 },
      modulatorEnv: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 0.8 },
    },
  },
  {
    type: "fmVoid",
    label: "Void",
    icon: "\u26AB",
    details: {
      visualStyle: "fm_void",
      carrierWaveform: "sine",
      modulatorWaveform: "sine",
      carrierRatio: 1,
      modulatorRatio: 0.25,
      modulatorDepthScale: 2.5,
      carrierEnv: { attack: 2.0, decay: 3.0, sustain: 1.0, release: 4.0 },
      modulatorEnv: { attack: 2.5, decay: 2.5, sustain: 0.8, release: 3.5 },
    },
  },
];

export const DEFAULT_FM_SYNTH_PARAMS = {
  carrierWaveform: 'sine',
  modulatorWaveform: 'sine',
  carrierRatio: 1,
  modulatorRatio: 1,
  modulatorDepthScale: 2,
  carrierEnvAttack: 0.01,
  carrierEnvDecay: 0.3,
  carrierEnvSustain: 0,
  carrierEnvRelease: 0.3,
  modulatorEnvAttack: 0.01,
  modulatorEnvDecay: 0.2,
  modulatorEnvSustain: 0,
  modulatorEnvRelease: 0.2,
  reverbSend: 0.1,
  delaySend: 0.1,
  visualStyle: 'fm_default',
  ignoreGlobalSync: false,
};

export function createFmSynthOrb(node) {
  const p = node.audioParams;
  const audioNodes = {
    carrier: globalThis.audioContext.createOscillator(),
    modulator: globalThis.audioContext.createOscillator(),
    modGain: globalThis.audioContext.createGain(),
    ampGain: globalThis.audioContext.createGain(),
    mainGain: globalThis.audioContext.createGain(),
    reverbSendGain: globalThis.audioContext.createGain(),
    delaySendGain: globalThis.audioContext.createGain(),
  };

  audioNodes.carrier.type = sanitizeWaveformType(p.carrierWaveform);
  audioNodes.modulator.type = sanitizeWaveformType(p.modulatorWaveform);
  audioNodes.modulator.connect(audioNodes.modGain);
  audioNodes.modGain.connect(audioNodes.carrier.frequency);
  audioNodes.carrier.connect(audioNodes.ampGain);
  audioNodes.ampGain.connect(audioNodes.mainGain);

  audioNodes.mainGain.gain.value = 1.0;
  audioNodes.reverbSendGain.gain.value = p.reverbSend ?? 0.1;
  audioNodes.delaySendGain.gain.value = p.delaySend ?? 0.1;
  audioNodes.mainGain.connect(audioNodes.reverbSendGain);
  audioNodes.mainGain.connect(audioNodes.delaySendGain);

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    audioNodes.reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    audioNodes.delaySendGain.connect(globalThis.masterDelaySendGain);
  }
  if (globalThis.mistEffectInput) {
    audioNodes.mistSendGain = globalThis.audioContext.createGain();
    audioNodes.mistSendGain.gain.value = 0;
    audioNodes.mainGain.connect(audioNodes.mistSendGain);
    audioNodes.mistSendGain.connect(globalThis.mistEffectInput);
  }
  if (globalThis.crushEffectInput) {
    audioNodes.crushSendGain = globalThis.audioContext.createGain();
    audioNodes.crushSendGain.gain.value = 0;
    audioNodes.mainGain.connect(audioNodes.crushSendGain);
    audioNodes.crushSendGain.connect(globalThis.crushEffectInput);
  }

  const now = globalThis.audioContext.currentTime;
  try { audioNodes.carrier.start(now); } catch {}
  try { audioNodes.modulator.start(now); } catch {}

  return audioNodes;
}
export { createToneFmSynthOrb, DEFAULT_TONE_FM_SYNTH_PARAMS } from './tone-fm-synth-orb.js';
