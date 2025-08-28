import {
  DEFAULT_REVERB_SEND,
  DEFAULT_DELAY_SEND,
  CRUSH_BIT_DEPTH,
  CRUSH_REDUCTION,
} from '../utils/appConstants.js';

function createBitCrusherNode(bits, normFreq) {
  const proc = globalThis.audioContext.createScriptProcessor(256, 2, 2);
  let ph = 0;
  let lastL = 0,
    lastR = 0;
  const step = Math.pow(0.5, bits);
  proc.onaudioprocess = (e) => {
    const inL = e.inputBuffer.getChannelData(0);
    const inR =
      e.inputBuffer.numberOfChannels > 1
        ? e.inputBuffer.getChannelData(1)
        : inL;
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    for (let i = 0; i < inL.length; i++) {
      ph += normFreq;
      if (ph >= 1.0) {
        ph -= 1.0;
        lastL = step * Math.floor(inL[i] / step + 0.5);
        lastR = step * Math.floor(inR[i] / step + 0.5);
      }
      outL[i] = lastL;
      outR[i] = lastR;
    }
  };
  return proc;
}

export function createSamplerOrbAudioNodes(node) {
  const ctx = globalThis.audioContext;
  if (!ctx) return null;
  const p = node.audioParams || {};

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = p.filterCutoff ?? 4000;
  filter.Q.value = p.filterResonance ?? 1.0;

  const crusher = createBitCrusherNode(CRUSH_BIT_DEPTH, CRUSH_REDUCTION);
  const bitCrusherWetGain = ctx.createGain();
  bitCrusherWetGain.gain.value = p.sampleCrush ?? 0;
  const bitCrusherDryGain = ctx.createGain();
  bitCrusherDryGain.gain.value = 1 - (p.sampleCrush ?? 0);

  filter.connect(crusher);
  crusher.connect(bitCrusherWetGain);
  filter.connect(bitCrusherDryGain);

  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;
  bitCrusherWetGain.connect(gainNode);
  bitCrusherDryGain.connect(gainNode);

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

  // Always create sends; connect if inputs exist
  let mistSendGain = ctx.createGain();
  mistSendGain.gain.value = 0;
  gainNode.connect(mistSendGain);
  try {
    if (globalThis.mistEffectInput) {
      mistSendGain.connect(globalThis.mistEffectInput);
      console.log('[PATCH][SAMPLER] mist send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][SAMPLER] mist send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}

  let crushSendGain = ctx.createGain();
  crushSendGain.gain.value = 0;
  gainNode.connect(crushSendGain);
  try {
    if (globalThis.crushEffectInput) {
      crushSendGain.connect(globalThis.crushEffectInput);
      console.log('[PATCH][SAMPLER] crush send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][SAMPLER] crush send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}

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
    bitCrusherWetGain,
    bitCrusherDryGain,
    bitCrusher: crusher,
  };
}
