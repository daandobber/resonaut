import { describe, it, expect } from 'vitest';
import { patternDefaults, rhythmHit, advancePattern, patternState, resetPattern, randomizePattern, NOTE_LOOM_TYPE, ORBIT_RHYTHM_TYPE, ACID_ORB_TYPE } from '../utils/patternOrbs.js';
const orb = type => ({ type, audioParams: patternDefaults(type) });
describe('Independent pattern orbs', () => {
  it('distributes exactly the requested hits, rotates them and keeps manual overrides', () => {
    for (let length = 2; length <= 32; length++) for (let hits = 0; hits <= length; hits++) {
      const p = { length, hits, rotation: 3 };
      expect(Array.from({ length }, (_, i) => rhythmHit(p, i)).filter(Boolean)).toHaveLength(hits);
    }
    const p = { length: 8, hits: 3, rotation: 0, rhythmOverrides: { 0: false, 1: true } };
    expect(rhythmHit(p, 0)).toBe(false); expect(rhythmHit(p, 1)).toBe(true);
  });
  it('keeps rests as real steps and forwards scale notes and individual dynamics', () => {
    const node = orb(NOTE_LOOM_TYPE);
    node.audioParams.steps[0] = { degree: -3, enabled: true, velocity: 0.5, probability: 1 };
    node.audioParams.transpose = 2;
    const note = advancePattern(node, { intensity: 0.8, color: 'blue' });
    expect(note.note).toEqual({ degree: -1, mode: 'absolute' });
    expect(note.intensity).toBeCloseTo(0.28);
    expect(note.color).toBe('blue');
    advancePattern(node); advancePattern(node);
    expect(advancePattern(node)).toBeNull();
    expect(patternState(node).step).toBe(3);
  });
  it('plays reverse and pendulum patterns and resets without serializing the playhead', () => {
    const node = orb(NOTE_LOOM_TYPE); node.audioParams.length = 4;
    node.audioParams.direction = 'reverse';
    const steps = () => Array.from({ length: 8 }, () => { advancePattern(node); return patternState(node).step; });
    expect(steps()).toEqual([3, 2, 1, 0, 3, 2, 1, 0]);
    resetPattern(node); node.audioParams.direction = 'pendulum';
    expect(steps()).toEqual([0, 1, 2, 3, 2, 1, 0, 1]);
    expect(patternState(JSON.parse(JSON.stringify(node))).step).toBe(-1);
  });
  it('honors chance and zero strength without changing the instrument pitch in rhythm mode', () => {
    const node = orb(ORBIT_RHYTHM_TYPE);
    node.audioParams.probability = 0;
    expect(advancePattern(node)).toBeNull();
    resetPattern(node); node.audioParams.probability = 1; node.audioParams.pulseIntensity = 0;
    expect(advancePattern(node)).toBeNull();
    resetPattern(node); node.audioParams.pulseIntensity = 0.7;
    expect(advancePattern(node, { scaleDegreeOffset: 5 }).scaleDegreeOffset).toBe(5);
  });
  it('repeats seeded chance decisions and keeps independent nodes editable', () => {
    const a = orb(NOTE_LOOM_TYPE), b = orb(NOTE_LOOM_TYPE);
    a.audioParams.probability = b.audioParams.probability = 0.5;
    const render = node => Array.from({ length: 128 }, () => !!advancePattern(node));
    expect(render(a)).toEqual(render(b));
    a.audioParams.steps[0].degree = 9;
    expect(b.audioParams.steps[0].degree).toBe(0);
  });
  it('randomizes a melodic pattern within its own length, always leaving something audible', () => {
    const node = orb(ACID_ORB_TYPE);
    node.audioParams.length = 8;
    randomizePattern(node);
    const active = node.audioParams.steps.slice(0, 8);
    expect(active.every(s => s.degree >= 0 && s.degree <= 7)).toBe(true);
    expect(active.some(s => s.enabled)).toBe(true);
    expect(node.audioParams.steps.length).toBe(32);
  });
  it('does not randomize non-melodic orbit rhythm orbs', () => {
    const node = orb(ORBIT_RHYTHM_TYPE);
    const before = JSON.stringify(node.audioParams.steps);
    randomizePattern(node);
    expect(JSON.stringify(node.audioParams.steps)).toBe(before);
  });
});
