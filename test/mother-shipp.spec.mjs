import { describe, it, expect } from 'vitest';
import { buildMotherShippTrack, euclid } from '../orbs/mother-shipp.js';

describe('Mother Shipp Euclidean builder', () => {
  it('distributes pulses over equal loop and track', () => {
    const patt = buildMotherShippTrack(16, 16, 4, 0);
    expect(patt).toHaveLength(16);
    // Expect 4 on a 16 length
    expect(patt.filter(Boolean).length).toBe(4);
  });

  it('repeats loop if loop shorter than track', () => {
    const loopLen = 13;
    const pulses = 4;
    const trackLen = 16;
    const loop = euclid(loopLen, pulses);
    const patt = buildMotherShippTrack(trackLen, loopLen, pulses, 0);
    expect(patt).toHaveLength(trackLen);
    const expectedCount = (trackLen - (trackLen % loopLen)) / loopLen * pulses + loop.slice(0, trackLen % loopLen).filter(Boolean).length;
    expect(patt.filter(Boolean).length).toBe(expectedCount);
  });

  it('truncates loop if loop longer than track', () => {
    const loopLen = 20;
    const pulses = 5;
    const trackLen = 16;
    const loop = euclid(loopLen, pulses);
    const patt = buildMotherShippTrack(trackLen, loopLen, pulses, 0);
    expect(patt).toHaveLength(trackLen);
    const expectedCount = loop.slice(0, trackLen).filter(Boolean).length;
    expect(patt.filter(Boolean).length).toBe(expectedCount);
  });
});

