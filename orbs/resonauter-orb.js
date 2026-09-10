import { createRealtimeDSP } from '../utils/realtimeAudio.js';

export const RESONAUTER_TYPE = 'resonauter';

export const DEFAULT_RESONAUTER_PARAMS = {
  pitch: 440,
  scaleIndex: 0,
  strength: 0.5,
  contour: 0.5,
  brightness: 0.5,
  damping: 0.5,
  geometry: 0.5,
  position: 0.5,
  length: 0.5,
  repeat: 0.5,
  strum: 0.0,
  material: 0.5,
  bow: 0.5,
  blow: 0.3,
  strike: 0.7,
  mallet: 0.6,
  hammer: 0.4,
  release: 0.5,
  space: 0.2,
  roomSize: 0.35,
  roomDamp: 0.45,
  spatialWidth: 0.55,
  earlyReflections: 0.35,
  gSize: 0.3,
  gPitch: 0.5,
  gPos: 0.0,
  gDensity: 0.5,
  gTexture: 0.5,
  gMix: 0.0,
  reverbSend: 0.2,
  delaySend: 0.1,
  visualStyle: 'resonauter_default',
  ignoreGlobalSync: false,

};
export const resonauterGranParams = {
  gSize: 0.3,
  gPitch: 0.5,
  gPos: 0.0,
  gDensity: 0.5,
  gTexture: 0.5,
  gMix: 0.0,
};


export function createResonauterGranularNode(params = resonauterGranParams) {
  return createRealtimeDSP(globalThis.audioContext, { kind: 'granular', params });
}

export function createResonauterOrbAudioNodes(node) {
  const ctx = globalThis.audioContext;
  const audioNodes = {
    output: ctx.createGain(),
    reverbSendGain: ctx.createGain(),
    delaySendGain: ctx.createGain(),
    effectInput: ctx.createGain(),
    gran: createResonauterGranularNode(node.audioParams),
    drySpatialGain: ctx.createGain(),
    reflectionInput: ctx.createGain(),
    reflectionLeftDelay: ctx.createDelay(0.25),
    reflectionRightDelay: ctx.createDelay(0.25),
    reflectionLeftFilter: ctx.createBiquadFilter(),
    reflectionRightFilter: ctx.createBiquadFilter(),
    reflectionLeftGain: ctx.createGain(),
    reflectionRightGain: ctx.createGain(),
    reflectionLeftPan: ctx.createStereoPanner(),
    reflectionRightPan: ctx.createStereoPanner(),
    mistSendGain: ctx.createGain(),
    crushSendGain: ctx.createGain(),
  };

  audioNodes.effectInput.connect(audioNodes.gran);
  audioNodes.gran.connect(audioNodes.drySpatialGain);
  audioNodes.drySpatialGain.connect(audioNodes.output);
  audioNodes.gran.connect(audioNodes.reflectionInput);
  audioNodes.reflectionInput.connect(audioNodes.reflectionLeftDelay);
  audioNodes.reflectionInput.connect(audioNodes.reflectionRightDelay);
  audioNodes.reflectionLeftDelay.connect(audioNodes.reflectionLeftFilter);
  audioNodes.reflectionRightDelay.connect(audioNodes.reflectionRightFilter);
  audioNodes.reflectionLeftFilter.connect(audioNodes.reflectionLeftGain);
  audioNodes.reflectionRightFilter.connect(audioNodes.reflectionRightGain);
  audioNodes.reflectionLeftGain.connect(audioNodes.reflectionLeftPan);
  audioNodes.reflectionRightGain.connect(audioNodes.reflectionRightPan);
  audioNodes.reflectionLeftPan.connect(audioNodes.output);
  audioNodes.reflectionRightPan.connect(audioNodes.output);

  applyResonauterSpatialParams({ ...node, audioNodes });

  audioNodes.output.connect(audioNodes.reverbSendGain);
  audioNodes.output.connect(audioNodes.delaySendGain);
  audioNodes.reverbSendGain.gain.value = node.audioParams.reverbSend ?? 0.2;
  audioNodes.delaySendGain.gain.value = node.audioParams.delaySend ?? 0.1;

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) audioNodes.reverbSendGain.connect(globalThis.reverbPreDelayNode);
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) audioNodes.delaySendGain.connect(globalThis.masterDelaySendGain);

  if (globalThis.mistEffectInput) {
    audioNodes.mistSendGain.gain.value = 0;
    audioNodes.output.connect(audioNodes.mistSendGain);
    audioNodes.mistSendGain.connect(globalThis.mistEffectInput);
  }
  if (globalThis.crushEffectInput) {
    audioNodes.crushSendGain.gain.value = 0;
    audioNodes.output.connect(audioNodes.crushSendGain);
    audioNodes.crushSendGain.connect(globalThis.crushEffectInput);
  }

  if (globalThis.masterGain) {
    audioNodes.output.connect(globalThis.masterGain);
  } else {
    audioNodes.output.connect(globalThis.audioContext.destination);
  }
  return audioNodes;
}

export function applyResonauterSpatialParams(node, time = globalThis.audioContext?.currentTime ?? 0) {
  if (!node?.audioNodes) return;
  const p = { ...DEFAULT_RESONAUTER_PARAMS, ...(node.audioParams || {}) };
  const {
    drySpatialGain,
    reflectionInput,
    reflectionLeftDelay,
    reflectionRightDelay,
    reflectionLeftFilter,
    reflectionRightFilter,
    reflectionLeftGain,
    reflectionRightGain,
    reflectionLeftPan,
    reflectionRightPan,
    reverbSendGain,
  } = node.audioNodes;
  if (!reflectionInput) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const space = clamp(p.space ?? 0.2, 0, 1);
  const roomSize = clamp(p.roomSize ?? 0.35, 0, 1);
  const roomDamp = clamp(p.roomDamp ?? 0.45, 0, 1);
  const width = clamp(p.spatialWidth ?? 0.55, 0, 1);
  const early = clamp(p.earlyReflections ?? 0.35, 0, 1);
  const tau = 0.04;

  drySpatialGain?.gain.setTargetAtTime(clamp(1 - space * 0.18, 0.72, 1), time, tau);
  reflectionInput.gain.setTargetAtTime(space * early * 0.75, time, tau);
  reflectionLeftDelay.delayTime.setTargetAtTime(0.012 + roomSize * 0.055, time, tau);
  reflectionRightDelay.delayTime.setTargetAtTime(0.018 + roomSize * 0.085, time, tau);
  const cutoff = 1200 + (1 - roomDamp) * 10500;
  reflectionLeftFilter.type = 'lowpass';
  reflectionRightFilter.type = 'lowpass';
  reflectionLeftFilter.frequency.setTargetAtTime(cutoff, time, tau);
  reflectionRightFilter.frequency.setTargetAtTime(cutoff * 0.88, time, tau);
  reflectionLeftFilter.Q.setTargetAtTime(0.7 + roomSize * 1.8, time, tau);
  reflectionRightFilter.Q.setTargetAtTime(0.7 + roomSize * 1.5, time, tau);
  reflectionLeftGain.gain.setTargetAtTime(0.42 + roomSize * 0.25, time, tau);
  reflectionRightGain.gain.setTargetAtTime(0.38 + roomSize * 0.3, time, tau);
  reflectionLeftPan.pan.setTargetAtTime(-width, time, tau);
  reflectionRightPan.pan.setTargetAtTime(width, time, tau);
  reverbSendGain?.gain.setTargetAtTime(p.reverbSend ?? space, time, tau);
}

export function playResonauterSound(node, pitch, intensity = 1) {
  const p = node.audioParams || {};
  applyResonauterSpatialParams(node);
  globalThis.resonauterSpinSpeed += 4 * intensity;
  const baseTime = globalThis.audioContext.currentTime;
  const sVal = p.strum ?? 0;
  const hits = 1 + Math.round(sVal * 4);
  const gap = 0.03 + sVal * 0.05;
  for (let h = 0; h < hits; h++) {
    const hitPitch = pitch * (1 + (h / hits - 0.5) * 0.08 * sVal);
    const hitGain = intensity * (1 - h / hits * 0.3 * sVal);
    createStrike(baseTime + h * gap, hitPitch, hitGain, h);
  }

  function createStrike(now, hitPitch, hitGain, hitIndex) {
    const noiseSrc = globalThis.audioContext.createBufferSource();
    const bufDur = 0.2;
    const buf = globalThis.audioContext.createBuffer(1, globalThis.audioContext.sampleRate * bufDur, globalThis.audioContext.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseSrc.buffer = buf;

    const osc = globalThis.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hitPitch;

    const noiseGain = globalThis.audioContext.createGain();
    noiseGain.gain.value = (p.strike ?? 0.5) * hitGain * 1.2;
    const blowFilt = globalThis.audioContext.createBiquadFilter();
    blowFilt.type = 'bandpass';
    blowFilt.frequency.value = hitPitch * 2;
    const blowGain = globalThis.audioContext.createGain();
    blowGain.gain.value = (p.blow ?? 0.3) * hitGain * 1.2;
    noiseSrc.connect(blowFilt);
    blowFilt.connect(blowGain);
    noiseSrc.connect(noiseGain);

    const oscGain = globalThis.audioContext.createGain();
    oscGain.gain.value = (p.bow ?? 0.5) * hitGain * 1.2;
    osc.connect(oscGain);

    const malletOsc = globalThis.audioContext.createOscillator();
    malletOsc.type = 'sine';
    malletOsc.frequency.value = hitPitch * 2;
    const malletGain = globalThis.audioContext.createGain();
    malletGain.gain.value = (p.mallet ?? 0.0) * hitGain * 1.2;
    malletOsc.connect(malletGain);

    const hammerOsc = globalThis.audioContext.createOscillator();
    hammerOsc.type = 'square';
    hammerOsc.frequency.value = hitPitch * 3;
    const hammerGain = globalThis.audioContext.createGain();
    hammerGain.gain.value = (p.hammer ?? 0.0) * hitGain * 1.2;
    hammerOsc.connect(hammerGain);

    const excMix = globalThis.audioContext.createGain();
    noiseGain.connect(excMix);
    blowGain.connect(excMix);
    oscGain.connect(excMix);
    malletGain.connect(excMix);
    hammerGain.connect(excMix);

    const excEnv = globalThis.audioContext.createGain();
    excMix.connect(excEnv);
    excEnv.gain.setValueAtTime(0, now);
    const envDur = 0.2 + (p.contour ?? 0.5) * 0.4;
    const lengthFactor = p.length ?? 0.5;
    const totalDur = envDur + lengthFactor * 1.5;
    excEnv.gain.linearRampToValueAtTime((p.strength ?? 0.5) * hitGain, now + 0.01);
    excEnv.gain.exponentialRampToValueAtTime(0.0001, now + envDur);

    const delay1 = globalThis.audioContext.createDelay();
    delay1.delayTime.value = 1 / hitPitch;
    const fb1 = globalThis.audioContext.createGain();
    const repBoost = (p.repeat ?? 0.5) * 0.05;
    const material = p.material ?? 0.5;
    const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
    const dampBase = (p.damping ?? 0.5) + (1 - material) * 0.2;
    fb1.gain.value = clamp(0.9 - dampBase * 0.4 + repBoost, 0, 0.99);
    delay1.connect(fb1); fb1.connect(delay1);

    const delay2 = globalThis.audioContext.createDelay();
    delay2.delayTime.value = (1 + (p.geometry ?? 0.5) * 3) / hitPitch;
    const fb2 = globalThis.audioContext.createGain();
    fb2.gain.value = clamp(0.85 - dampBase * 0.3 + (p.geometry ?? 0.5) * 0.1 + repBoost, 0, 0.99);
    delay2.connect(fb2); fb2.connect(delay2);

    const cross1 = globalThis.audioContext.createGain();
    cross1.gain.value = clamp((p.geometry ?? 0.5) * 0.5 + (p.repeat ?? 0.5) * 0.3,0,0.95);
    const cross2 = globalThis.audioContext.createGain();
    cross2.gain.value = cross1.gain.value;
    // Bound the combined feedback, including the cross-coupled delay paths.
    const feedbackScale = Math.min(1, 0.98 / Math.max(
      fb1.gain.value + cross2.gain.value, fb2.gain.value + cross1.gain.value));
    [fb1, fb2, cross1, cross2].forEach(gain => { gain.gain.value *= feedbackScale; });
    delay1.connect(cross1); cross1.connect(delay2);
    delay2.connect(cross2); cross2.connect(delay1);

    excEnv.connect(delay1);
    excEnv.connect(delay2);

    const mix = globalThis.audioContext.createGain();
    delay1.connect(mix); delay2.connect(mix);
    const filt = globalThis.audioContext.createBiquadFilter();
    filt.type = 'lowpass';
    const bright = p.brightness ?? 0.5;
    const matBright = bright + material * 0.3;
    filt.frequency.value = hitPitch * (2 + matBright * matBright * 20);
    filt.Q.value = 2 + matBright * 8;
    mix.connect(filt);

    const outGain = globalThis.audioContext.createGain();
    filt.connect(outGain);
    outGain.gain.setValueAtTime(0, now);
    outGain.gain.linearRampToValueAtTime(hitGain, now + 0.01);
    const rel = p.release ?? 0.5;
    outGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDur + rel * 0.7);

    const limiter = globalThis.audioContext.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 20;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    outGain.connect(limiter);

    const pan = globalThis.audioContext.createStereoPanner();
    const width = Math.max(0, Math.min(1, p.spatialWidth ?? DEFAULT_RESONAUTER_PARAMS.spatialWidth));
    const roomSize = Math.max(0, Math.min(1, p.roomSize ?? DEFAULT_RESONAUTER_PARAMS.roomSize));
    const hitScatter = (hits > 1 ? hitIndex / (hits - 1) - 0.5 : 0) * width * (0.35 + roomSize * 0.45);
    pan.pan.value = Math.max(-1, Math.min(1, ((p.position ?? 0.5) * 2 - 1) + hitScatter));
    limiter.connect(pan);
    pan.connect(node.audioNodes.effectInput);

    noiseSrc.start(now);
    noiseSrc.stop(now + Math.max(bufDur, totalDur));
    osc.start(now);
    osc.stop(now + totalDur);
    malletOsc.start(now);
    malletOsc.stop(now + totalDur);
    hammerOsc.start(now);
    hammerOsc.stop(now + totalDur);

    setTimeout(() => {
      try {
        noiseSrc.disconnect();
        osc.disconnect();
        malletOsc.disconnect();
        hammerOsc.disconnect();
        noiseGain.disconnect();
        blowFilt.disconnect();
        blowGain.disconnect();
        oscGain.disconnect();
        malletGain.disconnect();
        hammerGain.disconnect();
        excMix.disconnect();
        excEnv.disconnect();
        delay1.disconnect();
        fb1.disconnect();
        delay2.disconnect();
        fb2.disconnect();
        cross1.disconnect();
        cross2.disconnect();
        mix.disconnect();
        filt.disconnect();
        outGain.disconnect();
        limiter.disconnect();
        pan.disconnect();
      } catch (e) {
      }
    }, (totalDur + 0.3) * 1000);
  }
}
