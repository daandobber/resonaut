import { it, expect, vi } from 'vitest';
import { patternDefaults, advancePattern, resetPattern, chordIntervals, drawPatternOrb } from '../utils/patternOrbs.js';
import { readPulseChord, scheduleChordVoice, cancelChordVoices } from '../utils/chordPulse.js';
const orb = type => ({ type, audioParams: patternDefaults(type) });

it('voices chords within the current scale and raises inversions by its octave length', () => {
  expect(chordIntervals({ chordShape: 'triad', inversion: 1 }, 5)).toEqual([2, 4, 5]);
  expect(chordIntervals({ chordShape: 'seventh', inversion: 2 }, 7)).toEqual([4, 6, 7, 9]);
  expect(chordIntervals({ chordShape: 'triad', openVoicing: true }, 7)).toEqual([0, 4, 9]);
  const node = orb('chord_garden');
  expect(advancePattern(node).chord.intervals).toEqual([0, 2, 4]);
});

it('arpeggiates edited notes across scale octaves with a stable incoming root', () => {
  const node = orb('arp_orbit');
  const first = advancePattern(node, { note: { degree: 3, mode: 'absolute' }, chord: { intervals: [0,2,4] } }, 5);
  expect(first.note).toEqual({ degree: 3, mode: 'absolute' });
  expect(first.chord).toBeUndefined();
  expect(Array.from({ length: 8 }, () => advancePattern(node, {}, 5).note.degree)).toEqual([5,7,9,8,10,12,14,3]);
  resetPattern(node);
  expect(advancePattern(node).note.degree).toBe(0);
  resetPattern(node); node.audioParams.direction = 'reverse';
  expect(advancePattern(node, {}, 5).note.degree).toBe(11);
});

it('sanitizes chord messages and cancels pending strums on lifecycle changes', () => {
  expect(readPulseChord({ chord: { intervals: [0, 0, NaN, 2, 4, 7, 9], strumMs: 999 } })).toEqual({ intervals: [0,2,4,7], strumMs: 150 });
  expect(readPulseChord({ chord: { intervals: [] } })).toBeNull();
  vi.useFakeTimers();
  try {
    const owner = {}, play = vi.fn();
    scheduleChordVoice(owner, 0, play); scheduleChordVoice(owner, 100, play);
    cancelChordVoices(owner); vi.runAllTimers(); expect(play).toHaveBeenCalledTimes(1);
  } finally { vi.useRealTimers(); }
});

it('places every pattern label below its shape and respects hidden information', () => {
  const labels = [];
  const ctx = new Proxy({}, { get: (_, key) => key === 'fillText' ? (...args) => labels.push(args) : () => {}, set: () => true });
  for (const type of ['note_loom', 'orbit_rhythm', 'chord_garden', 'arp_orbit']) {
    labels.length = 0; drawPatternOrb(ctx, orb(type), 50, 1, false, true);
    expect(labels.length).toBe(2); expect(labels.every(([, , y]) => y > 50)).toBe(true);
    labels.length = 0; drawPatternOrb(ctx, orb(type), 50, 1, false, false); expect(labels).toEqual([]);
  }
});
