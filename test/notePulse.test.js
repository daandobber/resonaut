import { describe, it, expect } from 'vitest';
import { readPulseNote, withPulseNote, musicalPulseType, resolvePulseScaleIndex, commitPulseNote } from '../utils/notePulse.js';
describe('Shared note pulses', () => {
  it('commits the real note and frequency and leaves them in place for ordinary triggers', () => {
    const params = { scaleIndex: 0, pitch: 220 };
    const frequency = i => 220 * 2 ** (i / 7);
    expect(commitPulseNote(params, withPulseNote({}, 7, 'absolute'), frequency)).toEqual({ index: 7, changed: true });
    expect(params.scaleIndex).toBe(7); expect(params.pitch).toBe(440);
    expect(commitPulseNote(params, {}, frequency)).toBeNull();
    expect(params.pitch).toBe(440);
  });
  it('keeps repeated relative melodies stable, including after save/load and manual retuning', () => {
    let params = { scaleIndex: 7, pitch: 440 };
    const frequency = i => 220 * 2 ** (i / 7);
    const pulse = withPulseNote({}, 2);
    for(let i=0;i<20;i++) commitPulseNote(params, pulse, frequency);
    expect(params.scaleIndex).toBe(9);
    params = JSON.parse(JSON.stringify(params));
    commitPulseNote(params, pulse, frequency);
    expect(params.scaleIndex).toBe(9);
    params.scaleIndex = -7;
    commitPulseNote(params, pulse, frequency);
    expect(params.scaleIndex).toBe(-5);
  });
  it('leaves ordinary triggers unpitched and interprets legacy Note Loom offsets', () => {
    expect(musicalPulseType({ intensity: 0.8 })).toBe('trigger');
    expect(resolvePulseScaleIndex({}, 7)).toBeNull();
    expect(resolvePulseScaleIndex({ scaleDegreeOffset: 2 }, 7)).toBe(9);
  });
  it('plays relative notes in each instrument register and absolute notes at one project index', () => {
    const relative = withPulseNote({ intensity: 0.5 }, 2);
    const absolute = withPulseNote({ intensity: 0.5 }, 2, 'absolute');
    expect([0, 7, -7].map(base => resolvePulseScaleIndex(relative, base))).toEqual([2, 9, -5]);
    expect([0, 7, -7].map(base => resolvePulseScaleIndex(absolute, base))).toEqual([2, 2, 2]);
    expect(musicalPulseType(absolute)).toBe('note');
  });
  it('replaces pitch at the next sequencer while preserving dynamics and branch isolation', () => {
    const original = withPulseNote({ intensity: 0.3, color: 'blue' }, 5);
    const branch = withPulseNote(original, -2, 'absolute');
    expect(branch).toEqual({ intensity: 0.3, color: 'blue', note: { degree: -2, mode: 'absolute' } });
    expect(original.note.degree).toBe(5);
    expect(withPulseNote({ scaleDegreeOffset: 8 }, 0)).not.toHaveProperty('scaleDegreeOffset');
  });
  it('ignores invalid pitch messages and preserves degree zero', () => {
    expect(readPulseNote({ note: { degree: NaN, mode: 'relative' } })).toBeNull();
    expect(readPulseNote({ note: { degree: 2, mode: 'nonsense' } })).toBeNull();
    expect(resolvePulseScaleIndex(withPulseNote({}, 0, 'absolute'), 7)).toBe(0);
  });
});
