import { DEFAULT_REVERB_SEND, DEFAULT_DELAY_SEND } from '../utils/appConstants.js';

export function createSamplerOrbAudioNodes(node) {
  const ctx = globalThis.audioContext;
  if (!ctx) return null;
  const p = node.audioParams || {};

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = p.filterCutoff ?? 4000;
  filter.Q.value = p.filterResonance ?? 1.0;

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;
  filter.connect(gainNode);

  const reverbSendGain = ctx.createGain();
  reverbSendGain.gain.value = p.reverbSend ?? DEFAULT_REVERB_SEND;
  gainNode.connect(reverbSendGain);
  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }

  const delaySendGain = ctx.createGain();
  delaySendGain.gain.value = p.delaySend ?? DEFAULT_DELAY_SEND;
  gainNode.connect(delaySendGain);
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    delaySendGain.connect(globalThis.masterDelaySendGain);
  }

  let mistSendGain;
  if (globalThis.mistEffectInput) {
    mistSendGain = ctx.createGain();
    mistSendGain.gain.value = 0;
    gainNode.connect(mistSendGain);
    mistSendGain.connect(globalThis.mistEffectInput);
  }

  let crushSendGain;
  if (globalThis.crushEffectInput) {
    crushSendGain = ctx.createGain();
    crushSendGain.gain.value = 0;
    gainNode.connect(crushSendGain);
    crushSendGain.connect(globalThis.crushEffectInput);
  }

  if (globalThis.masterGain) {
    gainNode.connect(globalThis.masterGain);
  }

  return {
    lowPassFilter: filter,
    gainNode,
    reverbSendGain,
    delaySendGain,
    mistSendGain,
    crushSendGain,
  };
}
