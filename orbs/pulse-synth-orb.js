import * as Tone from 'tone';

// Game Boy-like Pulse Synth with LSDj-style table runner
export const DEFAULT_PULSE_SYNTH_PARAMS = {
  // Core
  duty: 0.5, // 12.5%, 25%, 50%, 75% => 0.125, 0.25, 0.5, 0.75
  detune: 0,
  waveform: 'pulse',

  // Envelope (simple ADSR; GB had a stepped vol env but this maps well)
  ampEnvAttack: 0.005,
  ampEnvDecay: 0.05,
  ampEnvSustain: 0.6,
  ampEnvRelease: 0.08,

  // FX sends
  reverbSend: 0.05,
  delaySend: 0.05,

  // (vibrato and arp removed)

  // Visuals / engine control
  visualStyle: 'pulse_default',
  ignoreGlobalSync: false,
};

function getCurrentBpm(fallback = 120) {
  try {
    if (typeof globalBPM === 'number' && globalBPM > 0) return globalBPM;
  } catch {}
  return fallback;
}

function centsToRatio(cents) {
  return Math.pow(2, cents / 1200);
}

export function createPulseSynthOrb(node) {
  const p = node.audioParams || {};

  // Base oscillator: Tone.PulseOscillator provides width for duty
  const osc = new Tone.PulseOscillator({
    frequency: 440,
    width: p.duty ?? DEFAULT_PULSE_SYNTH_PARAMS.duty,
  });
  osc.detune.value = p.detune ?? 0;

  // Gain-based voice structure to match engine expectations
  // Voice and mixing
  const osc1Gain = new Tone.Gain(0.0); // shaped by per-note ADSR
  const ampEnvControl = new Tone.Gain(1.0); // unity bus that sums all voices
  const mainGain = new Tone.Gain(0.0); // starts silent, controlled by envelope
  const reverbSendGain = new Tone.Gain(p.reverbSend ?? DEFAULT_PULSE_SYNTH_PARAMS.reverbSend);
  const delaySendGain = new Tone.Gain(p.delaySend ?? DEFAULT_PULSE_SYNTH_PARAMS.delaySend);

  // Connections for primary voice
  osc.connect(osc1Gain);
  osc1Gain.connect(ampEnvControl);
  ampEnvControl.connect(mainGain);
  mainGain.connect(reverbSendGain);
  mainGain.connect(delaySendGain);

  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    delaySendGain.connect(globalThis.masterDelaySendGain);
  }
  // Always create effect sends so patch effects can target them
  let mistSendGain = new Tone.Gain(0);
  let crushSendGain = new Tone.Gain(0);
  mainGain.connect(mistSendGain);
  mainGain.connect(crushSendGain);
  try {
    if (globalThis.mistEffectInput) {
      mistSendGain.connect(globalThis.mistEffectInput);
      console.log('[PATCH][PULSE] mist send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][PULSE] mist send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}
  try {
    if (globalThis.crushEffectInput) {
      crushSendGain.connect(globalThis.crushEffectInput);
      console.log('[PATCH][PULSE] crush send created + connected', { nodeId: node.id });
    } else {
      console.log('[PATCH][PULSE] crush send created (not connected yet)', { nodeId: node.id });
    }
  } catch {}
  if (globalThis.masterGain) {
    mainGain.connect(globalThis.masterGain);
  } else {
    mainGain.connect(Tone.getContext().destination);
  }

  // ORBITONES: additional pulse voices mixed pre-mainGain
  const orbitoneOscillators = [];
  const orbitoneIndividualGains = [];
  if (p.orbitonesEnabled && p.orbitoneCount > 0) {
    const duty = Math.max(0.01, Math.min(0.99, p.duty ?? DEFAULT_PULSE_SYNTH_PARAMS.duty));
    for (let i = 0; i < p.orbitoneCount; i++) {
      const o = new Tone.PulseOscillator({ width: duty });
      const g = new Tone.Gain(0);
      o.connect(g);
      g.connect(ampEnvControl);
      try { o.start(); } catch {}
      orbitoneOscillators.push(o);
      orbitoneIndividualGains.push(g);
    }
  }

  // removed verbose init logging
  // Start base oscillator
  try { osc.start(); } catch {}

  // Envelope via osc1Gain (main voice) to decouple from Orbitone timing
  let noteOnBaseFreq = 440;
  const triggerStart = (time, velocity = 1) => {
    const ap = node.audioParams || {};
    // Update runtime params
    try {
      if (osc && osc.width && ap.duty !== undefined) {
        const w = Math.max(0.01, Math.min(0.99, ap.duty));
        if (typeof osc.width.value !== 'undefined') osc.width.value = w;
        else if (osc.width.setValueAtTime) osc.width.setValueAtTime(w, Tone.getContext().currentTime);
      }
      if (osc && osc.detune && ap.detune !== undefined) {
        try { osc.detune.setValueAtTime(ap.detune, Tone.getContext().currentTime); } catch {}
      }
      if (reverbSendGain && reverbSendGain.gain && ap.reverbSend !== undefined) {
        try { reverbSendGain.gain.setValueAtTime(ap.reverbSend, Tone.getContext().currentTime); } catch {}
      }
      if (delaySendGain && delaySendGain.gain && ap.delaySend !== undefined) {
        try { delaySendGain.gain.setValueAtTime(ap.delaySend, Tone.getContext().currentTime); } catch {}
      }
    } catch {}

    // Capture current oscillator frequency as base
    try { noteOnBaseFreq = osc.frequency.value; } catch {}

    // Simple ADSR on main osc gain
    const atk = Math.max(0.001, ap.ampEnvAttack ?? DEFAULT_PULSE_SYNTH_PARAMS.ampEnvAttack);
    const dec = Math.max(0.001, ap.ampEnvDecay ?? DEFAULT_PULSE_SYNTH_PARAMS.ampEnvDecay);
    const sus = Math.max(0, Math.min(1, ap.ampEnvSustain ?? DEFAULT_PULSE_SYNTH_PARAMS.ampEnvSustain));
    const now = time ?? Tone.getContext().currentTime;
    const orbitMix = ap.orbitonesEnabled ? (ap.orbitoneMix ?? 0.5) : 0;
    const peak = Math.max(0.001, Math.min(1.5, velocity)) * (1 - orbitMix);

    try {
      // Set mainGain to full volume during notes
      mainGain.gain.setValueAtTime(1.0, now);
      
      // Control osc1Gain envelope
      osc1Gain.gain.cancelScheduledValues(now);
      osc1Gain.gain.setValueAtTime(0, now);
      osc1Gain.gain.linearRampToValueAtTime(peak, now + atk);
      if (sus > 0.01) {
        osc1Gain.gain.setTargetAtTime(peak * sus, now + atk, dec / 4 + 0.001);
      } else {
        osc1Gain.gain.setTargetAtTime(0.0001, now + atk, dec / 3 + 0.001);
      }
    } catch {}
  };

  const triggerStop = (time) => {
    const ap = node.audioParams || {};
    const rel = Math.max(0.001, ap.ampEnvRelease ?? DEFAULT_PULSE_SYNTH_PARAMS.ampEnvRelease);
    const now = time ?? Tone.getContext().currentTime;
    try {
      // Fade out main gain
      mainGain.gain.setTargetAtTime(0.0001, now, rel / 4 + 0.001);
      
      // Fade out osc gain
      osc1Gain.gain.cancelScheduledValues(now);
      osc1Gain.gain.setTargetAtTime(0.0001, now, rel / 4 + 0.001);
    } catch {}
    try { osc.frequency.setValueAtTime(noteOnBaseFreq, Tone.getContext().currentTime); } catch {}
  };

  return {
    // keep naming consistent with other orbs
    oscillator1: osc,
    osc1Gain,
    ampEnvControl,
    lowPassFilter: undefined,
    gainNode: mainGain,
    reverbSendGain,
    delaySendGain,
    mistSendGain,
    crushSendGain,
    orbitoneOscillators,
    orbitoneIndividualGains,

    triggerStart,
    triggerStop,
  };
}
