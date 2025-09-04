import { describe, it, expect } from 'vitest';
import { euclideanPattern } from '../orbs/galactic-bloom.js';

describe('euclideanPattern', () => {
  it('handles trivial cases', () => {
    expect(euclideanPattern(1, 0)).toEqual([false]);
    expect(euclideanPattern(1, 1)).toEqual([true]);
  });

  it('distributes beats evenly', () => {
    // Classic E(8,3) -> 1 0 0 1 0 0 1 0
    const p = euclideanPattern(8, 3).map(Boolean);
    expect(p.filter(Boolean).length).toBe(3);
  });

  it('all or nothing boundaries', () => {
    expect(euclideanPattern(8, 0)).toEqual([false,false,false,false,false,false,false,false]);
    expect(euclideanPattern(8, 8)).toEqual([true,true,true,true,true,true,true,true]);
  });
});

