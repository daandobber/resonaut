// Chords share a root note; individual voices never change the orb's editable note.
export function readPulseChord(data = {}) {
  const chord = data.chord;
  if (!Array.isArray(chord?.intervals)) return null;
  const intervals = [...new Set(chord.intervals.filter(Number.isFinite)
    .map(n => Math.max(-28, Math.min(28, Math.round(n)))))].slice(0, 4);
  if (!intervals.length) return null;
  return { intervals, strumMs: Number.isFinite(chord.strumMs) ? Math.max(0, Math.min(150, chord.strumMs)) : 0 };
}

const pending = new WeakMap();
export function scheduleChordVoice(owner, delay, play) {
  if (delay <= 0) { play(); return; }
  let timers = pending.get(owner);
  if (!timers) pending.set(owner, timers = new Set());
  const timer = setTimeout(() => { timers.delete(timer); play(); }, delay);
  timers.add(timer);
}
export function cancelChordVoices(owner) {
  for (const timer of pending.get(owner) || []) clearTimeout(timer);
  pending.delete(owner);
}
