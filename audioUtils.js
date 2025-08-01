export const A4_FREQ = 440.0;
export const A4_MIDI_NOTE = 69;

export function midiToFrequency(midiNote) {
  if (isNaN(midiNote)) return NaN;
  return A4_FREQ * Math.pow(2, (midiNote - A4_MIDI_NOTE) / 12);
}

export function frequencyToMidi(frequency) {
  if (frequency <= 0) return NaN;
  return Math.round(A4_MIDI_NOTE + 12 * Math.log2(frequency / A4_FREQ));
}

export function getFrequency(scaleDef, index, oct = 0, rootNote = 0, transposeOffset = 0) {
  const notes = scaleDef.notes;
  if (!notes || notes.length === 0) return scaleDef.baseFreq;
  const numNotesInScale = notes.length;
  const noteIdx = index % numNotesInScale;
  const effectiveNoteIndex = noteIdx < 0 ? noteIdx + numNotesInScale : noteIdx;
  const octOffset = Math.floor(index / numNotesInScale) + oct;
  const semitonesInScale = notes[effectiveNoteIndex];
  if (semitonesInScale === undefined || semitonesInScale === null)
    return scaleDef.baseFreq;

  const baseMidi = frequencyToMidi(scaleDef.baseFreq);
  const finalMidi =
    baseMidi + rootNote + transposeOffset + semitonesInScale + octOffset * 12;
  return midiToFrequency(finalMidi);
}

export function getNoteName(midiNoteNumber, noteNames) {
  const note = Math.round(midiNoteNumber);
  if (isNaN(note)) return "?";
  const octave = Math.floor(note / 12) - 1;
  const noteIndex = note % 12;
  const correctedNoteIndex = noteIndex < 0 ? noteIndex + 12 : noteIndex;
  const noteNameBase = noteNames[correctedNoteIndex] || "?";
  return noteNameBase + octave;
}

export function getNoteNameFromScaleIndex(scaleDef, index, noteNames, rootNote = 0, transposeOffset = 0) {
  const notes = scaleDef.notes;
  if (!notes || notes.length === 0) return "?";
  const numNotesInScale = notes.length;
  const noteIdx = index % numNotesInScale;
  const effectiveNoteIndex = noteIdx < 0 ? noteIdx + numNotesInScale : noteIdx;
  const octOffset = Math.floor(index / numNotesInScale);
  const semitonesInScale = notes[effectiveNoteIndex];
  if (semitonesInScale === undefined || semitonesInScale === null) return "?";

  const baseMidi =
    frequencyToMidi(scaleDef.baseFreq) + rootNote + transposeOffset;
  if (isNaN(baseMidi)) return "?";
  const finalMidi = baseMidi + semitonesInScale + octOffset * 12;
  return getNoteName(finalMidi, noteNames);
}

export function parseNoteNameToMidi(noteStr) {
  if (!noteStr) return NaN;
  const m = noteStr.trim().toLowerCase().match(/^([a-g])(b|#)?(-?\d+)$/);
  if (!m) return NaN;
  const letter = m[1];
  const accidental = m[2] || "";
  const octave = parseInt(m[3], 10);
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  let semitone = base[letter];
  if (accidental === "#") semitone += 1;
  else if (accidental === "b") semitone -= 1;
  return (octave + 1) * 12 + semitone;
}

export function getClosestScaleIndexForMidi(midiNote, scaleDef, minIndex, maxIndex, rootNote = 0, transposeOffset = 0) {
  const map = new Map();
  for (let i = minIndex; i <= maxIndex; i++) {
    const m = Math.round(frequencyToMidi(getFrequency(scaleDef, i, 0, rootNote, transposeOffset)));
    if (!isNaN(m)) map.set(i, m);
  }
  let closest = 0;
  let minDiff = Infinity;
  for (const [idx, m] of map.entries()) {
    const diff = Math.abs(midiNote - m);
    if (diff < minDiff) {
      minDiff = diff;
      closest = idx;
      if (diff === 0) break;
    }
  }
  return closest;
}

export function sanitizeFrequency(value, fallback = A4_FREQ) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}
