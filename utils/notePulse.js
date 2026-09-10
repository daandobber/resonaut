// Shared musical message for sequencers, routers and instruments. Degrees are
// scale steps, so a pulse follows the project's current root and scale.
export function readPulseNote(data = {}) {
  if (data.note && Number.isFinite(data.note.degree) && ['relative', 'absolute'].includes(data.note.mode)) {
    return { degree: Math.round(data.note.degree), mode: data.note.mode };
  }
  // Compatibility with the first Note Loom implementation.
  if (Number.isFinite(data.scaleDegreeOffset)) return { degree: Math.round(data.scaleDegreeOffset), mode: 'relative' };
  return null;
}

export function withPulseNote(data, degree, mode = 'relative') {
  const { scaleDegreeOffset, note, ...rest } = data;
  if (!Number.isFinite(degree)) return rest;
  return { ...rest, note: { degree: Math.round(degree), mode: mode === 'absolute' ? 'absolute' : 'relative' } };
}

export function musicalPulseType(data) { return readPulseNote(data) ? 'note' : 'trigger'; }

export function resolvePulseScaleIndex(data, instrumentIndex = 0) {
  const note = readPulseNote(data);
  if (!note) return null;
  return note.degree + (note.mode === 'relative' && Number.isFinite(instrumentIndex) ? instrumentIndex : 0);
}

// Keep a stable starting register for relative melodies. Otherwise +2 on every
// step would climb forever once the receiving orb's actual note is updated.
export function commitPulseNote(params, data, frequencyForIndex, min = -Infinity, max = Infinity) {
  if (!readPulseNote(data)) return null;
  const current = Number.isFinite(params.scaleIndex) ? params.scaleIndex : 0;
  const reference = params.notePulseReference;
  const base = reference && reference.last === current && Number.isFinite(reference.base) ? reference.base : current;
  const index = Math.max(min, Math.min(max, resolvePulseScaleIndex(data, base)));
  const frequency = frequencyForIndex(index);
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const changed = params.scaleIndex !== index || params.pitch !== frequency;
  params.notePulseReference = { base, last: index };
  params.scaleIndex = index;
  params.pitch = frequency;
  return { index, changed };
}
