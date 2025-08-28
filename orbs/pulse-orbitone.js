import * as Tone from 'tone';
import { getFrequency } from '../audioUtils.js';
import { scaleState } from '../utils/scaleConstants.js';
import { dbgOrbitone } from '../utils/debug.js';

// Schedule Orbitone voices for the Pulse synth and apply mix/envelopes.
// Keeps logic close to the main engine's Orbitone handling.
export function triggerPulseOrbitones(node, now, intensity = 1) {
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
  const orbitMix = ap.orbitoneMix !== undefined ? ap.orbitoneMix : 0.5;
  const peak = Math.max(0.001, Math.min(1.5, intensity));

  // Main voice envelope already scales by (1 - orbitMix) inside triggerStart.

  // Compute frequencies for each Orbitone voice
  const baseFreq = (() => {
    try { return an.oscillator1?.frequency?.value ?? ap.pitch; } catch { return ap.pitch; }
  })();

  const scaleDef = scaleState.currentScale || { notes: [0], baseFreq: baseFreq };
  const baseIdx = ap.scaleIndex ?? 0;
  const intervals = ap.orbitoneIntervals || [];

  const orbitFreqs = [];
  for (let i = 0; i < an.orbitoneOscillators.length; i++) {
    const step = intervals[i] !== undefined ? intervals[i] : (i + 1) * 2;
    let f = getFrequency(
      scaleDef,
      baseIdx + step,
      0,
      scaleState.currentRootNote || 0,
      scaleState.globalTransposeOffset || 0,
    );
    if (!Number.isFinite(f) || f <= 0) {
      f = baseFreq * Math.pow(2, ((i + 1) * 3) / 12);
    }
    orbitFreqs.push(f);
  }

  const perOrbitPeak = (peak * orbitMix) / Math.max(1, an.orbitoneOscillators.length);

  // Schedule each Orbitone oscillator and its gain envelope
  dbgOrbitone('schedule:start', {
    nodeId: node.id,
    count: an.orbitoneOscillators.length,
    orbitMix,
    peak,
    perOrbitPeak,
    baseFreq,
    intervals,
    freqs: orbitFreqs,
    mainOscLevel: (an.osc1Gain && an.osc1Gain.gain && an.osc1Gain.gain.value) || undefined,
  });

  for (let i = 0; i < an.orbitoneOscillators.length; i++) {
    const offMs = (ap.orbitoneTimingOffsets && ap.orbitoneTimingOffsets[i] !== undefined)
      ? ap.orbitoneTimingOffsets[i]
      : 0;
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
