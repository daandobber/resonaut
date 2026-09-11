import * as Tone from 'tone';
import { getFrequency } from '../audioUtils.js';
import { getPlaybackTuning } from '../utils/playbackTuning.js';
import { scaleState } from '../utils/scaleConstants.js';
import { dbgOrbitone } from '../utils/debug.js';

function createOrbitonePlaybackOrder(node, count) {
  const mode = node?.audioParams?.orbitoneOrder || 'normal';
  const normal = Array.from({ length: Math.max(0, count || 0) }, (_, index) => index);
  if (mode === 'reverse') return normal.slice().reverse();
  if (mode === 'random') {
    const shuffled = normal.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  if (mode === 'pingpong') {
    const reverse = !!node._orbitonePingPongReverse;
    node._orbitonePingPongReverse = !reverse;
    return reverse ? normal.slice().reverse() : normal;
  }
  return normal;
}

function getOrbitoneOrderedTimingOffset(params, voiceIndex, playbackOrder) {
  const offsets = params?.orbitoneTimingOffsets || [];
  const orderSlot = playbackOrder.indexOf(voiceIndex);
  const timingIndex = orderSlot >= 0 ? orderSlot : voiceIndex;
  if (timingIndex <= 0) return 0;
  return offsets[timingIndex - 1] !== undefined ? offsets[timingIndex - 1] : 0;
}

// Schedule Orbitone voices for the Pulse synth and apply mix/envelopes.
// Keeps logic close to the main engine's Orbitone handling.
export function triggerPulseOrbitones(node, now, intensity = 1, externalPlaybackOrder = null) {
  if (!node || !node.audioParams || !node.audioNodes) return;
  const ap = node.audioParams;
  const an = node.audioNodes;

  if (!ap.orbitonesEnabled || !an.orbitoneOscillators || an.orbitoneOscillators.length === 0) {
    return;
  }

  const atk = Math.max(0.001, ap.ampEnvAttack ?? 0.005);
  const dec = Math.max(0.001, ap.ampEnvDecay ?? 0.05);
  const sus = Math.max(0, Math.min(1, ap.ampEnvSustain ?? 0.6));
  const rel = Math.max(0.001, ap.ampEnvRelease ?? 0.08);

  // Determine how much of the sound should be main vs. orbitones
  const orbitMix = ap.orbitoneMix !== undefined ? ap.orbitoneMix : 0.65;
  const peak = Math.max(0.001, Math.min(1.5, intensity));

  // Main voice envelope already scales by (1 - orbitMix) inside triggerStart.

  // Compute frequencies for each Orbitone voice
  const baseFreq = (() => {
    try { return an.oscillator1?.frequency?.value ?? ap.pitch; } catch { return ap.pitch; }
  })();

  const tuning = getPlaybackTuning(an);
  const scaleDef = tuning?.scale || scaleState.currentScale || { notes: [0], baseFreq: baseFreq };
  const baseIdx = ap.scaleIndex ?? 0;
  const intervals = ap.orbitoneIntervals || [];

  const orbitFreqs = [];
  for (let i = 0; i < an.orbitoneOscillators.length; i++) {
    const step = intervals[i] !== undefined ? intervals[i] : (i + 1) * 2;
    let f = getFrequency(
      scaleDef,
      baseIdx + step,
      0,
      tuning?.root ?? scaleState.currentRootNote ?? 0,
      tuning?.transpose ?? scaleState.globalTransposeOffset ?? 0,
    );
    if (!Number.isFinite(f) || f <= 0) {
      f = baseFreq * Math.pow(2, ((i + 1) * 3) / 12);
    }
    orbitFreqs.push(f);
  }

  const activeCount = Math.min(
    ap.orbitoneCount || an.orbitoneOscillators.length,
    an.orbitoneOscillators.length,
  );
  const perOrbitPeak =
    (peak * orbitMix) / Math.sqrt(Math.max(1, activeCount));
  const playbackOrder = externalPlaybackOrder || createOrbitonePlaybackOrder(node, activeCount + 1);

  // Schedule each Orbitone oscillator and its gain envelope
  dbgOrbitone('schedule:start', {
    nodeId: node.id,
    count: activeCount,
    orbitMix,
    peak,
    perOrbitPeak,
    baseFreq,
    intervals,
    freqs: orbitFreqs,
    mainOscLevel: (an.osc1Gain && an.osc1Gain.gain && an.osc1Gain.gain.value) || undefined,
  });

  for (let i = 0; i < an.orbitoneOscillators.length; i++) {
    if (i >= activeCount) {
      const g = an.orbitoneIndividualGains[i];
      try { g?.gain?.setTargetAtTime(0, now, 0.01); } catch {}
      continue;
    }
    const offMs = getOrbitoneOrderedTimingOffset(ap, i + 1, playbackOrder);
    const startT = now + offMs / 1000.0;
    const osc = an.orbitoneOscillators[i];
    const g = an.orbitoneIndividualGains[i];
    if (!osc || !g) continue;
    const f = orbitFreqs[i];
    try {
      if (osc.frequency && osc.frequency.setValueAtTime) {
        osc.frequency.cancelScheduledValues(startT);
        osc.frequency.setValueAtTime(f, startT);
      }
      const tgt = Math.min(1.0, Math.max(0.001, perOrbitPeak));
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0, now);
      g.gain.setValueAtTime(0, startT);
      g.gain.linearRampToValueAtTime(tgt, startT + atk);
      g.gain.setTargetAtTime(tgt * sus, startT + atk, dec / 4 + 0.001);
      g.gain.setTargetAtTime(0.0001, startT + atk + dec + (sus > 0 ? 0.5 : 0), rel / 4 + 0.001);
      dbgOrbitone('voice', { nodeId: node.id, i, f, offMs, tgt });
    } catch {}
  }
}
