import * as Tone from 'tone';
import { sanitizeWaveformType } from '../utils/oscillatorUtils.js';

export const DEFAULT_TONE_FM_SYNTH_PARAMS = {
  carrierWaveform: 'sine',
  modulatorWaveform: 'sine',
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

export function createToneFmSynthOrb(node) {
  const p = node.audioParams;

  const fm = new Tone.FMSynth({
    harmonicity: p.modulatorRatio ?? 1,
    modulationIndex: p.modulatorDepthScale ?? 2,
    oscillator: { type: sanitizeWaveformType(p.carrierWaveform) },
    modulation: { type: sanitizeWaveformType(p.modulatorWaveform) },
    envelope: {
      attack: p.carrierEnvAttack ?? 0.01,
      decay: p.carrierEnvDecay ?? 0.3,
      sustain: p.carrierEnvSustain ?? 0,
      release: p.carrierEnvRelease ?? 0.3,
    },
    modulationEnvelope: {
      attack: p.modulatorEnvAttack ?? 0.01,
      decay: p.modulatorEnvDecay ?? 0.2,
      sustain: p.modulatorEnvSustain ?? 0,
      release: p.modulatorEnvRelease ?? 0.2,
    },
  });

  const lowPassFilter = new Tone.Filter(20000, 'lowpass');
  lowPassFilter.Q.value = 1;
  fm.connect(lowPassFilter);

  const gainNode = new Tone.Gain(1);
  lowPassFilter.connect(gainNode);

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

  const triggerStart = (time, velocity = 1) => {
    fm.triggerAttack(fm.frequency.value, time, velocity);
  };

  const triggerStop = (time) => {
    fm.triggerRelease(time);
  };

  return {
    oscillator1: fm,
    modulatorOsc1: fm.modulation,
    modulatorGain1: { gain: fm.modulationIndex },
    lowPassFilter,
    gainNode,
    reverbSendGain,
    delaySendGain,
    mistSendGain,
    crushSendGain,
    triggerStart,
    triggerStop,
  };
}
