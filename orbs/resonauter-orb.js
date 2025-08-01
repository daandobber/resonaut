
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


export function createResonauterGranularNode() {
  const proc = globalThis.audioContext.createScriptProcessor(512, 2, 2);
  const sr = globalThis.audioContext.sampleRate;
  const bufLen = sr * 2;
  const ringL = new Float32Array(bufLen);
  const ringR = new Float32Array(bufLen);
  let write = 0;
  const grains = [];
  let counter = 0;
  proc.onaudioprocess = (e) => {
    const inpL = e.inputBuffer.getChannelData(0);
    const inpR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inpL;
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    const p = resonauterGranParams;
    const gDur = 0.02 + p.gSize * 0.28;
    const gDurS = Math.max(1, Math.floor(gDur * sr));
    const pitch = Math.pow(2, (p.gPitch - 0.5) * 4);
    const posOff = Math.floor(p.gPos * bufLen);
    const dens = 1 + p.gDensity * 50;
    const interval = sr / dens;
    const texPow = 1 + p.gTexture * 3;
    const mix = p.gMix;
    for (let i = 0; i < inpL.length; i++) {
      ringL[write] = inpL[i];
      ringR[write] = inpR[i];
      if (counter >= interval) {
        const jitter = p.gTexture;
        const posJitter = (Math.random() - 0.5) * bufLen * 0.05 * jitter;
        const pitchJitter = 1 + (Math.random() - 0.5) * 0.3 * jitter;
        const amp = 0.7 + Math.random() * 0.6 * jitter;
        counter -= interval;
        grains.push({
          pos: (write - posOff + posJitter + bufLen) % bufLen,
          age: 0,
          pitch: pitch * pitchJitter,
          amp,
        });
      }
      let wetL = 0, wetR = 0;
      for (let g = grains.length - 1; g >= 0; g--) {
        const gr = grains[g];
        if (gr.age >= gDurS) { grains.splice(g, 1); continue; }
        const idx = Math.floor(gr.pos) % bufLen;
        const frac = gr.pos - idx;
        const nIdx = (idx + 1) % bufLen;
        const sL = ringL[idx] * (1 - frac) + ringL[nIdx] * frac;
        const sR = ringR[idx] * (1 - frac) + ringR[nIdx] * frac;
        const t = gr.age / gDurS;
        const env = (Math.sin(Math.PI * t) ** texPow) * (gr.amp || 1);
        wetL += sL * env;
        wetR += sR * env;
        gr.pos += gr.pitch || pitch;
        gr.age++;
      }
      outL[i] = inpL[i] * (1 - mix) + wetL * mix;
      outR[i] = inpR[i] * (1 - mix) + wetR * mix;
      write = (write + 1) % bufLen;
      counter++;
    }
  };
  return proc;
}

export function createResonauterOrbAudioNodes(node) {
  const audioNodes = {
    output: globalThis.audioContext.createGain(),
    reverbSendGain: globalThis.audioContext.createGain(),
    delaySendGain: globalThis.audioContext.createGain(),
    effectInput: globalThis.audioContext.createGain(),
    gran: createResonauterGranularNode(),
    mistSendGain: globalThis.audioContext.createGain(),
    crushSendGain: globalThis.audioContext.createGain(),
  };

  audioNodes.effectInput.connect(audioNodes.gran);
  audioNodes.gran.connect(audioNodes.output);

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

export function playResonauterSound(node, pitch, intensity = 1) {
  const p = node.audioParams || {};
  globalThis.resonauterSpinSpeed += 4 * intensity;
  const baseTime = globalThis.audioContext.currentTime;
  const sVal = p.strum ?? 0;
  const hits = 1 + Math.round(sVal * 4);
  const gap = 0.03 + sVal * 0.05;
  for (let h = 0; h < hits; h++) {
    const hitPitch = pitch * (1 + (h / hits - 0.5) * 0.08 * sVal);
    const hitGain = intensity * (1 - h / hits * 0.3 * sVal);
    createStrike(baseTime + h * gap, hitPitch, hitGain);
  }

  function createStrike(now, hitPitch, hitGain) {
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
    pan.pan.value = (p.position ?? 0.5) * 2 - 1;
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
