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

function applyEnvelope(param, attack, decay, sustain, release, time, velocity = 1) {
  param.cancelScheduledValues(time);
  param.setValueAtTime(0, time);
  const peakTime = time + attack;
  param.linearRampToValueAtTime(velocity, peakTime);
  const sustainTime = peakTime + decay;
  param.linearRampToValueAtTime(velocity * sustain, sustainTime);
  return (stopTime) => {
    param.cancelScheduledValues(stopTime);
    param.setValueAtTime(param.value, stopTime);
    param.linearRampToValueAtTime(0, stopTime + release);
  };
}

export function createToneFmSynthOrb(node) {
  const p = node.audioParams;
  if (typeof audioContext === 'undefined') {
    console.warn('AudioContext not ready for FM synth');
    return null;
  }
  const carrier = audioContext.createOscillator();
  carrier.type = sanitizeWaveformType(p.carrierWaveform);
  // Ensure the carrier starts at an audible pitch; this will be updated
  // later when notes are triggered.
  carrier.frequency.value = 440;
  const modulator = audioContext.createOscillator();
  modulator.type = sanitizeWaveformType(p.modulatorWaveform);

  const modGain = audioContext.createGain();
  modGain.gain.value = 0;
  modulator.connect(modGain);
  modGain.connect(carrier.frequency);

  const ampGain = audioContext.createGain();
  ampGain.gain.value = 0;
  carrier.connect(ampGain);

  const reverbSendGain = audioContext.createGain();
  reverbSendGain.gain.value = p.reverbSend ?? 0.1;
  const delaySendGain = audioContext.createGain();
  delaySendGain.gain.value = p.delaySend ?? 0.1;
  ampGain.connect(reverbSendGain);
  ampGain.connect(delaySendGain);

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    delaySendGain.connect(globalThis.masterDelaySendGain);
  }
  let mistSendGain = null;
  if (globalThis.mistEffectInput) {
    mistSendGain = audioContext.createGain();
    mistSendGain.gain.value = 0;
    ampGain.connect(mistSendGain);
    mistSendGain.connect(globalThis.mistEffectInput);
  }
  let crushSendGain = null;
  if (globalThis.crushEffectInput) {
    crushSendGain = audioContext.createGain();
    crushSendGain.gain.value = 0;
    ampGain.connect(crushSendGain);
    crushSendGain.connect(globalThis.crushEffectInput);
  }
  // Route the FM synth output to the master bus if available, otherwise
  // connect directly to the destination so the synth can still be heard
  // even when the global master gain has not been initialised yet.
  if (globalThis.masterGain) {
    ampGain.connect(globalThis.masterGain);
  } else {
    ampGain.connect(audioContext.destination);
  }

  try { carrier.start(); } catch {}
  try { modulator.start(); } catch {}

  const triggerStart = (time, velocity = 1) => {
    const baseFreq = carrier.frequency.value || 440;
    modulator.frequency.setValueAtTime(baseFreq * (p.modulatorRatio ?? 1), time);
    const stopAmpEnv = applyEnvelope(
      ampGain.gain,
      p.carrierEnvAttack ?? 0.01,
      p.carrierEnvDecay ?? 0.3,
      p.carrierEnvSustain ?? 0,
      p.carrierEnvRelease ?? 0.3,
      time,
      velocity
    );
    const stopModEnv = applyEnvelope(
      modGain.gain,
      p.modulatorEnvAttack ?? 0.01,
      p.modulatorEnvDecay ?? 0.2,
      p.modulatorEnvSustain ?? 0,
      p.modulatorEnvRelease ?? 0.2,
      time,
      p.modulatorDepthScale ?? 2
    );
    triggerStart.stopAmpEnv = stopAmpEnv;
    triggerStart.stopModEnv = stopModEnv;
  };

  const triggerStop = (time) => {
    if (triggerStart.stopAmpEnv) triggerStart.stopAmpEnv(time);
    if (triggerStart.stopModEnv) triggerStart.stopModEnv(time);
  };

  return {
    oscillator1: carrier,
    modulatorOsc1: modulator,
    modulatorGain1: modGain,
    gainNode: ampGain,
    reverbSendGain,
    delaySendGain,
    mistSendGain,
    crushSendGain,
    triggerStart,
    triggerStop,
  };
}
