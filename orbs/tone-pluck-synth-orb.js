import * as Tone from 'tone';

export const DEFAULT_TONE_PLUCK_SYNTH_PARAMS = {
  attackNoise: 0.68,
  dampening: 5200,
  resonance: 0.86,
  reverbSend: 0.12,
  delaySend: 0.08,
  volume: 1.0,
  // Guitar-like effects
  distortionAmount: 0.2,
  distortionWet: 0.0,
  distortionOversample: '2x', // 'none' | '2x' | '4x'
  distortionDrive: 1.0,
  distortionLevel: 1.0,
  wahEnabled: false,
  wahBaseFreq: 200,
  wahOctaves: 2,
  wahQ: 2,
  wahSensitivity: -20,
  wahWet: 0.0,
  // Tremolo
  tremoloEnabled: false,
  tremoloRate: 5.0,
  tremoloDepth: 0.25,
  tremoloWet: 0.0,
  // Chorus
  chorusEnabled: false,
  chorusRate: 1.8,
  chorusDepth: 0.4,
  chorusDelayTime: 3.5,
  chorusSpread: 120,
  chorusWet: 0.0,
  visualStyle: 'pluck_guitar',
  ignoreGlobalSync: false,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getToneRawContext() {
  const toneContext = Tone.getContext ? Tone.getContext() : Tone.context;
  return (
    toneContext?.rawContext ||
    toneContext?.context ||
    toneContext?._context ||
    globalThis.audioContext ||
    null
  );
}

function connectNativeToTone(nativeNode, toneNode) {
  const target = toneNode?.input || toneNode;
  if (nativeNode && target) nativeNode.connect(target);
}

function createModalStringVoice(outputNode, params = {}) {
  const state = {
    attackNoise: params.attackNoise ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.attackNoise,
    dampening: params.dampening ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.dampening,
    resonance: params.resonance ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.resonance,
    visualStyle: params.visualStyle ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.visualStyle,
  };

  const voice = {
    get attackNoise() { return state.attackNoise; },
    set attackNoise(value) { state.attackNoise = value; },
    get dampening() { return state.dampening; },
    set dampening(value) { state.dampening = value; },
    get resonance() { return state.resonance; },
    set resonance(value) { state.resonance = value; },
    get visualStyle() { return state.visualStyle; },
    set visualStyle(value) { state.visualStyle = value; },
    triggerAttack(freq, time, velocity = 1.0) {
      const ctx = getToneRawContext();
      if (!ctx || !outputNode || !Number.isFinite(freq) || freq <= 0) return;

      const startTime = Math.max(ctx.currentTime, Number.isFinite(time) ? time : ctx.currentTime);
      const vel = clamp(velocity ?? 1.0, 0.03, 1.0);
      const resonance = clamp(state.resonance ?? 0.85, 0.05, 0.98);
      const damping = clamp(state.dampening ?? 4500, 600, 12000);
      const attackNoise = clamp(state.attackNoise ?? 0.5, 0, 1);
      const style = state.visualStyle || "pluck_guitar";
      const isBass = style === "pluck_bass";
      const isHarp = style === "pluck_harp";
      const brightness = clamp((damping - 1200) / 8200, 0, 1);
      const baseDecay = clamp(
        (isBass ? 0.5 : 0.32) + resonance * (isHarp ? 2.5 : 1.8) + Math.max(0, 160 - freq) / 180,
        0.18,
        isHarp ? 3.4 : 2.6,
      );
      const partialCount = isBass ? 7 : isHarp ? 10 : 9;
      const inharmonicity = isHarp ? 0.0018 : isBass ? 0.0006 : 0.0011;

      const noteBus = ctx.createGain();
      const bodyLow = ctx.createBiquadFilter();
      const bodyMid = ctx.createBiquadFilter();
      const bodyHigh = ctx.createBiquadFilter();
      const bodyLowGain = ctx.createGain();
      const bodyMidGain = ctx.createGain();
      const bodyHighGain = ctx.createGain();
      const outGain = ctx.createGain();

      bodyLow.type = "bandpass";
      bodyLow.frequency.setValueAtTime(clamp(freq * (isBass ? 1.1 : 1.45), 85, 480), startTime);
      bodyLow.Q.setValueAtTime(isBass ? 1.1 : 1.7, startTime);
      bodyMid.type = "bandpass";
      bodyMid.frequency.setValueAtTime(clamp(freq * (isHarp ? 3.6 : 2.7), 360, 2100), startTime);
      bodyMid.Q.setValueAtTime(isHarp ? 2.2 : 1.8, startTime);
      bodyHigh.type = "bandpass";
      bodyHigh.frequency.setValueAtTime(clamp(freq * 6.5, 1500, 6500), startTime);
      bodyHigh.Q.setValueAtTime(2.8, startTime);
      bodyLowGain.gain.setValueAtTime(isBass ? 0.55 : 0.34, startTime);
      bodyMidGain.gain.setValueAtTime(isBass ? 0.18 : 0.28, startTime);
      bodyHighGain.gain.setValueAtTime(0.08 + brightness * 0.24, startTime);

      noteBus.connect(bodyLow);
      noteBus.connect(bodyMid);
      noteBus.connect(bodyHigh);
      bodyLow.connect(bodyLowGain);
      bodyMid.connect(bodyMidGain);
      bodyHigh.connect(bodyHighGain);
      bodyLowGain.connect(outGain);
      bodyMidGain.connect(outGain);
      bodyHighGain.connect(outGain);
      connectNativeToTone(outGain, outputNode);

      outGain.gain.setValueAtTime(0, startTime);
      outGain.gain.linearRampToValueAtTime(0.85 * vel, startTime + 0.004);
      outGain.gain.setTargetAtTime(0.0001, startTime + 0.03, baseDecay / 4.5);
      outGain.gain.setValueAtTime(0, startTime + baseDecay + 0.55);

      const transientLength = Math.ceil(ctx.sampleRate * clamp(0.006 + attackNoise * 0.018, 0.006, 0.028));
      const buffer = ctx.createBuffer(1, transientLength, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < transientLength; i++) {
        const env = Math.pow(1 - i / transientLength, 2.2);
        const raw = (Math.random() * 2 - 1) * env;
        last = last * (0.25 + (1 - brightness) * 0.55) + raw * (0.75 - (1 - brightness) * 0.55);
        data[i] = last * (0.25 + attackNoise * 0.65) * vel;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const transientGain = ctx.createGain();
      transientGain.gain.setValueAtTime(0.55, startTime);
      source.connect(transientGain);
      transientGain.connect(noteBus);
      source.start(startTime);
      source.stop(startTime + transientLength / ctx.sampleRate + 0.02);

      const cleanupNodes = [
        source,
        transientGain,
        noteBus,
        bodyLow,
        bodyMid,
        bodyHigh,
        bodyLowGain,
        bodyMidGain,
        bodyHighGain,
        outGain,
      ];

      for (let i = 1; i <= partialCount; i++) {
        const partialFreq = freq * i * (1 + inharmonicity * i * i);
        if (partialFreq > Math.min(ctx.sampleRate * 0.42, 12000)) break;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const harmonicRollOff = Math.pow(i, isBass ? 1.18 : isHarp ? 1.02 : 1.28);
        const pickPosition = isHarp ? 0.18 : isBass ? 0.32 : 0.24;
        const pickNotch = Math.abs(Math.sin(Math.PI * i * pickPosition));
        const brightLift = 0.55 + brightness * 0.75;
        const level = (pickNotch * brightLift + 0.08) / harmonicRollOff;
        const decay = baseDecay / (0.65 + i * (isHarp ? 0.09 : 0.16)) * (1 + resonance * 0.45);
        const detune = (Math.random() - 0.5) * (isHarp ? 5 : 2.5);

        osc.type = i === 1 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(partialFreq, startTime);
        osc.detune.setValueAtTime(detune, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(level * vel * 0.9, startTime + 0.003 + i * 0.00055);
        gain.gain.setTargetAtTime(0.0001, startTime + 0.012 + i * 0.002, decay / 4.2);
        gain.gain.setValueAtTime(0, startTime + decay + 0.35);

        osc.connect(gain);
        gain.connect(noteBus);
        osc.start(startTime);
        osc.stop(startTime + decay + 0.45);
        cleanupNodes.push(osc, gain);
      }

      const cleanupDelayMs = Math.ceil((baseDecay + 0.75) * 1000);
      setTimeout(() => {
        cleanupNodes.forEach((node) => {
          try { node.disconnect(); } catch {}
        });
      }, cleanupDelayMs);
    },
    dispose() {},
  };

  return voice;
}

export function createTonePluckSynthOrb(node) {
  const p = node.audioParams || {};

  const preFxMix = new Tone.Gain(1);
  const synth = createModalStringVoice(preFxMix, p);

  // Effects
  const distortion = new Tone.Distortion({
    distortion: p.distortionAmount ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.distortionAmount,
    oversample: p.distortionOversample ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.distortionOversample,
  });
  const distortionWet = new Tone.Gain(p.distortionWet ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.distortionWet);
  const distortionDry = new Tone.Gain(1 - (p.distortionWet ?? 0));

  const autoWah = new Tone.AutoWah({
    baseFrequency: p.wahBaseFreq ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.wahBaseFreq,
    octaves: p.wahOctaves ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.wahOctaves,
    Q: p.wahQ ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.wahQ,
    sensitivity: p.wahSensitivity ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.wahSensitivity,
  });
  const wahWet = new Tone.Gain(p.wahWet ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.wahWet);
  const wahDry = new Tone.Gain(1 - (p.wahWet ?? 0));

  // Output and sends
  const gainNode = new Tone.Gain(p.volume ?? 1.0);
  // Reverb/Delay sends are mixer-controlled; no per-engine sends here

  // Always create patch sends
  const mistSendGain = new Tone.Gain(0);
  const crushSendGain = new Tone.Gain(0);

  // Routing:
  // synth -> split (dry/wets)
  //  - Distortion: parallel mix
  //  - AutoWah: parallel mix (enabled via wahEnabled + wet)
  // Mixed -> gainNode -> sends/master
  // Distortion parallel with drive + level
  const distortionPreGain = new Tone.Gain(p.distortionDrive ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.distortionDrive);
  const distortionLevelGain = new Tone.Gain(p.distortionLevel ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.distortionLevel);
  preFxMix.connect(distortionPreGain);
  distortionPreGain.connect(distortion);
  distortion.connect(distortionLevelGain);
  distortionLevelGain.connect(distortionWet);
  preFxMix.connect(distortionDry);

  const postDistMix = new Tone.Gain(1);
  distortionWet.connect(postDistMix);
  distortionDry.connect(postDistMix);

  // AutoWah parallel (can be disabled)
  postDistMix.connect(autoWah);
  autoWah.connect(wahWet);
  postDistMix.connect(wahDry);

  const postWahMix = new Tone.Gain(1);
  wahWet.connect(postWahMix);
  wahDry.connect(postWahMix);

  // Mod effects: custom Tremolo (LFO + Gain) -> Chorus
  const tremRate = p.tremoloRate ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.tremoloRate;
  const tremDepth = Math.max(0, Math.min(1, p.tremoloDepth ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.tremoloDepth));
  const tremLfo = new Tone.LFO({
    frequency: tremRate,
    min: 1 - tremDepth,
    max: 1,
    phase: 0,
  }).start();
  const tremGain = new Tone.Gain(1);
  tremLfo.connect(tremGain.gain);
  const tremWetGain = new Tone.Gain(p.tremoloWet ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.tremoloWet);
  const tremDryGain = new Tone.Gain(1 - (p.tremoloWet ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.tremoloWet));
  const mainLevelGain = new Tone.Gain(1);

  const chorus = new Tone.Chorus(
    p.chorusRate ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.chorusRate,
    p.chorusDelayTime ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.chorusDelayTime,
    p.chorusDepth ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.chorusDepth,
  );
  try { chorus.wet.value = (p.chorusWet ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.chorusWet); } catch {}
  try { chorus.spread = p.chorusSpread ?? DEFAULT_TONE_PLUCK_SYNTH_PARAMS.chorusSpread; } catch {}
  chorus.start();

  // Tremolo split/mix
  postWahMix.connect(tremGain);
  postWahMix.connect(tremDryGain);
  tremGain.connect(tremWetGain);
  const postTremMix = new Tone.Gain(1);
  tremWetGain.connect(postTremMix);
  tremDryGain.connect(postTremMix);

  // Chorus then out
  postTremMix.connect(chorus);
  chorus.connect(mainLevelGain);
  mainLevelGain.connect(gainNode);

  // Global sends handled by mixer; nothing to connect here

  // Patch effect sends
  gainNode.connect(mistSendGain);
  gainNode.connect(crushSendGain);
  try { if (globalThis.mistEffectInput) mistSendGain.connect(globalThis.mistEffectInput); } catch {}
  try { if (globalThis.crushEffectInput) crushSendGain.connect(globalThis.crushEffectInput); } catch {}

  // Master
  if (globalThis.masterGain) {
    gainNode.connect(globalThis.masterGain);
  } else {
    gainNode.connect(Tone.getContext().destination);
  }

  let lastFrequency = 440;
  const setCarrierFrequency = (freq) => {
    lastFrequency = freq;
  };

  const triggerStart = (_time, velocity = 1.0) => {
    try {
      const t = Number.isFinite(_time)
        ? _time
        : ((Tone.now && typeof Tone.now === 'function') ? Tone.now() : undefined);
      const vel = Math.max(0.05, Math.min(1.0, velocity));
      synth.triggerAttack(lastFrequency, t, vel);
    } catch {}
  };
  const triggerStop = (_time) => {
    // PluckSynth is percussive; no explicit release required
  };

  function createOrbitone(freq) {
    const oGain = new Tone.Gain(0);
    // Minimal effects: follow same chain settings
    const oPre = new Tone.Gain(1);
    const oSynth = createModalStringVoice(oPre, p);
    const oDist = new Tone.Distortion({
      distortion: p.distortionAmount ?? 0.2,
      oversample: p.distortionOversample ?? '2x',
    });
    const oDWet = new Tone.Gain(p.distortionWet ?? 0.0);
    const oDDry = new Tone.Gain(1 - (p.distortionWet ?? 0));
    const oWah = new Tone.AutoWah({
      baseFrequency: p.wahBaseFreq ?? 200,
      octaves: p.wahOctaves ?? 2,
      Q: p.wahQ ?? 2,
      sensitivity: p.wahSensitivity ?? 0.5,
    });
    const oWWet = new Tone.Gain(p.wahWet ?? 0.0);
    const oWDry = new Tone.Gain(1 - (p.wahWet ?? 0));
    const oPostDist = new Tone.Gain(1);
    const oPostWah = new Tone.Gain(1);
    oPre.connect(oDist); oDist.connect(oDWet); oPre.connect(oDDry);
    oDWet.connect(oPostDist); oDDry.connect(oPostDist);
    oPostDist.connect(oWah); oWah.connect(oWWet); oPostDist.connect(oWDry);
    oWWet.connect(oPostWah); oWDry.connect(oPostWah);
    oPostWah.connect(oGain);

    const oMist = new Tone.Gain(0);
    const oCrush = new Tone.Gain(0);
    oGain.connect(oMist); oGain.connect(oCrush);
    try { if (globalThis.mistEffectInput) oMist.connect(globalThis.mistEffectInput); } catch {}
    try { if (globalThis.crushEffectInput) oCrush.connect(globalThis.crushEffectInput); } catch {}

    const oTrigStart = (_time, velocity = 1.0) => {
      try {
        const t = Number.isFinite(_time)
          ? _time
          : ((Tone.now && typeof Tone.now === 'function') ? Tone.now() : undefined);
        oSynth.triggerAttack(freq, t, Math.max(0.05, Math.min(1.0, velocity)));
      } catch {}
    };
    const oTrigStop = (_time) => {};

    return {
      gainNode: oGain,
      triggerStart: oTrigStart,
      triggerStop: oTrigStop,
      mistSendGain: oMist,
      crushSendGain: oCrush,
    };
  }

  return {
    // Expose a few items for update integration
    gainNode,
    mistSendGain,
    crushSendGain,
    // Pluck-specific references
    pluckSynth: synth,
    distortion,
    distortionPreGain,
    distortionWet,
    distortionLevelGain,
    distortionDry,
    autoWah,
    wahWet,
    wahDry,
    tremLfo,
    tremGain,
    tremWetGain,
    tremDryGain,
    chorus,
    mainLevelGain,
    setCarrierFrequency,
    triggerStart,
    triggerStop,
    createOrbitone,
    orbitoneSynths: [],
  };
}
