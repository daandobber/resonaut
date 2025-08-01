import * as Tone from 'tone';
import { sanitizeWaveformType } from '../utils/oscillatorUtils.js';

export const DEFAULT_TONE_FM_SYNTH_PARAMS = {
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

export function createToneFmSynthOrb(node) {
  const p = node.audioParams;
  const synth = new Tone.FMSynth().toDestination();
  synth.volume.value = -Infinity;

  synth.set({
    oscillator: { type: sanitizeWaveformType(p.carrierWaveform) },
    modulation: { type: sanitizeWaveformType(p.modulatorWaveform) },
  });

  synth.harmonicity.value = p.modulatorRatio ?? 1;
  synth.modulationIndex.value = p.modulatorDepthScale ?? 2;

  synth.envelope.set({
    attack: p.carrierEnvAttack ?? 0.01,
    decay: p.carrierEnvDecay ?? 0.3,
    sustain: p.carrierEnvSustain ?? 0,
    release: p.carrierEnvRelease ?? 0.3,
  });

  synth.modulationEnvelope.set({
    attack: p.modulatorEnvAttack ?? 0.01,
    decay: p.modulatorEnvDecay ?? 0.2,
    sustain: p.modulatorEnvSustain ?? 0,
    release: p.modulatorEnvRelease ?? 0.2,
  });

  const reverbSendGain = new Tone.Gain(p.reverbSend ?? 0.1);
  const delaySendGain = new Tone.Gain(p.delaySend ?? 0.1);
  synth.connect(reverbSendGain);
  synth.connect(delaySendGain);
  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    delaySendGain.connect(globalThis.masterDelaySendGain);
  }
  if (globalThis.mistEffectInput) {
    const mistSendGain = new Tone.Gain(0);
    synth.connect(mistSendGain);
    mistSendGain.connect(globalThis.mistEffectInput);
    synth.mistSendGain = mistSendGain;
  }
  if (globalThis.crushEffectInput) {
    const crushSendGain = new Tone.Gain(0);
    synth.connect(crushSendGain);
    crushSendGain.connect(globalThis.crushEffectInput);
    synth.crushSendGain = crushSendGain;
  }

  synth.reverbSendGain = reverbSendGain;
  synth.delaySendGain = delaySendGain;

  synth.triggerStart = (time, velocity = 1) => {
    synth.volume.setValueAtTime(-6 * velocity, time);
    synth.triggerAttack(Tone.now(), velocity);
  };
  synth.triggerStop = (time) => {
    synth.triggerRelease(time);
  };

  return synth;
}
