export const SYMPHIOSE_ROLES = ['auto', 'bass', 'chords', 'melody', 'arp', 'rhythm'];
export const SYMPHIOSE_CHORDS = {
  triad: { label: 'Triad', degrees: [0, 2, 4] },
  seventh: { label: 'Seventh', degrees: [0, 2, 4, 6] },
  ninth: { label: 'Add ninth', degrees: [0, 2, 4, 8] },
  sus2: { label: 'Suspended second', degrees: [0, 1, 4] },
  sus4: { label: 'Suspended fourth', degrees: [0, 3, 4] },
};
export const SYMPHIOSE_GROOVES = {
  euclidean: { label: 'Euclidean', beats: null },
  backbeat: { label: 'Backbeat', beats: [4, 12] },
  clave: { label: 'Son clave 3–2', beats: [0, 3, 6, 10, 12] },
  tresillo: { label: 'Tresillo 3–3–2', beats: [0, 6, 12] },
  offbeat: { label: 'Offbeat', beats: [2, 6, 10, 14] },
};
export const SYMPHIOSE_PROGRESSIONS = {
  home: { label: 'Home · I', degrees: [0] },
  journey: { label: 'Journey · I–vi–IV–V', degrees: [0, 5, 3, 4] },
  drift: { label: 'Drift · I–IV–vi–V', degrees: [0, 3, 5, 4] },
  orbit: { label: 'Orbit · ii–V–I–vi', degrees: [1, 4, 0, 5] },
};
export const SYMPHIOSE_PRESETS = {
  starlight: { label: 'Starlight arp', dreamDepth: 8, consciousnessSpan: 16, musicalRole: 'arp', arpDirection: 'pendulum', chordColor: 'seventh', variation: 0.15, progression: 'drift', barsPerChord: 2 },
  suspended: { label: 'Suspended', dreamDepth: 3, consciousnessSpan: 16, musicalRole: 'chords', chordColor: 'sus2', variation: 0.1, progression: 'journey', barsPerChord: 2 },
  clave: { label: 'Clave', dreamDepth: 5, consciousnessSpan: 16, musicalRole: 'rhythm', rhythmStyle: 'clave', variation: 0, progression: 'home', barsPerChord: 1 },
  ensemble: { label: 'Ensemble', dreamDepth: 5, consciousnessSpan: 16, musicalRole: 'auto', variation: 0.2, progression: 'journey', barsPerChord: 1 },
  breathe: { label: 'Breathe', dreamDepth: 3, consciousnessSpan: 16, musicalRole: 'chords', variation: 0.1, progression: 'drift', barsPerChord: 2 },
  conversation: { label: 'Conversation', dreamDepth: 7, consciousnessSpan: 16, musicalRole: 'melody', variation: 0.4, progression: 'orbit', barsPerChord: 1 },
  pulse: { label: 'Pulse', dreamDepth: 8, consciousnessSpan: 16, musicalRole: 'rhythm', variation: 0.25, progression: 'home', barsPerChord: 1 },
};
const wrap = (n, length) => ((n % length) + length) % length;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
function random(seed) {
  let n = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function symphioseContext(params, tick) {
  const length = clamp(Math.round(params.consciousnessSpan ?? 16), 4, 64);
  const cycle = Math.floor(tick / length);
  const progression = SYMPHIOSE_PROGRESSIONS[params.progression] || SYMPHIOSE_PROGRESSIONS.journey;
  const chordIndex = Math.floor(cycle / clamp(params.barsPerChord ?? 1, 1, 8)) % progression.degrees.length;
  return { tick, length, cycle, step: wrap(tick, length), chordDegree: progression.degrees[chordIndex], chordIndex,
    chordColor: params.chordColor || 'triad',
    ensemble: params.isQueen ? { density: (params.dreamDepth ?? 6) / 6, variation: params.variation ?? 0.2 } : undefined };
}

// Every role shares the same harmony and phrase, but leaves different spaces.
export function symphioseNote(params, context, voiceIndex, voiceCount, assignedRole) {
  const role = params.musicalRole && params.musicalRole !== 'auto'
    ? params.musicalRole : assignedRole || ['bass', 'chords', 'melody', 'rhythm'][voiceIndex % 4];
  const { length, cycle } = context;
  const step = wrap(context.step + Math.round(params.memoryEcho ?? 0), length);
  const beat = Math.floor(step * 16 / length);
  const density = clamp(Math.round((params.dreamDepth ?? 5) * (params.isQueen ? 1 : context.ensemble?.density ?? 1)), 0, length);
  if (density === 0) return null;
  const phrase = Math.floor(cycle / Math.max(1, params.wisdomCycles ?? 4));
  const seed = Math.round(params.imaginationSeed ?? 1) * 97 + phrase * 503 + voiceIndex * 31;
  const variation = clamp((context.ensemble?.variation ?? params.variation ?? 0.2) + ((params.spellComplexity ?? 1) - 1) * 0.05, 0, 1);
  let hit;
  if (role === 'bass') hit = step === 0 || (beat === 8 && step === Math.ceil(length / 2)) || (density > 6 && beat === 14);
  else if (role === 'chords') hit = step === 0 || (density > 4 && step === Math.floor(length * 0.625));
  else if (role === 'rhythm') {
    const groove = SYMPHIOSE_GROOVES[params.rhythmStyle]?.beats;
    hit = groove ? groove.some(position => Math.round(position * length / 16) === step)
      : wrap(step * density, length) < density;
  }
  else if (role === 'arp') hit = wrap(step * density, length) < density;
  else hit = wrap((step + 1) * density, length) < density && beat !== 0 && beat !== 8;
  // Fills occur only at the end of a four-cycle phrase and are deterministic.
  if (!hit && cycle % 4 === 3 && step >= length * 0.75) hit = random(seed + step * 17) < variation * 0.6;
  if (!hit) return null;
  const color = context.ensemble ? context.chordColor : params.chordColor;
  const chordTones = (SYMPHIOSE_CHORDS[color] || SYMPHIOSE_CHORDS.triad).degrees;
  const motif = [0, 2, 4, 2, 1, 4, 2, 0];
  let degree = context.chordDegree;
  if (role === 'chords') {
    // Three-voice ensembles keep the root and third, and give the top voice
    // the chosen extension instead of silently losing its chord color.
    const voicing = voiceCount === 3 && chordTones.length === 4
      ? [chordTones[0], chordTones[1], chordTones[3]] : chordTones;
    degree += voicing[voiceIndex % voicing.length];
  }
  if (role === 'arp') {
    let index = cycle * density + Math.floor(step * density / length) + voiceIndex;
    if (params.arpDirection === 'down') index = chordTones.length - 1 - wrap(index, chordTones.length);
    else if (params.arpDirection === 'pendulum') {
      index = wrap(index, 2 * (chordTones.length - 1));
      index = Math.min(index, 2 * (chordTones.length - 1) - index);
    }
    degree += chordTones[wrap(index, chordTones.length)];
  }
  if (role === 'melody') {
    const motifIndex = wrap(Math.floor(step / 2) + voiceIndex + (random(seed) < variation ? phrase : 0), motif.length);
    degree += motif[motifIndex];
  }
  const accent = step === 0 ? 1 : (beat % 4 === 0 ? 0.86 : 0.67);
  return {
    role, degree, octave: role === 'bass' ? -1 : role === 'melody' ? 1 : 0,
    pitched: role !== 'rhythm',
    intensity: clamp((params.focusIntensity ?? 1) * accent / Math.sqrt(Math.max(1, voiceCount)), 0, 1),
  };
}

// Absolute audio-clock deadlines avoid accumulating timer drift; skip missed
// ticks on a suspended/background tab instead of firing a burst of old notes.
export function advanceSymphioseClock(state, now, interval, origin = 0) {
  const tick = Math.max(0, Math.floor((now - origin + 1e-7) / Math.max(0.02, interval)));
  if (state.clockTick === tick) return null;
  state.clockTick = tick;
  return tick;
}
