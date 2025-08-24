import { describe, it, expect } from 'vitest';
import { morphShape, fmMorphAmount } from '../utils/fmShapeMorph.js';

describe('morphShape', () => {
  it('interpolates between two shapes', () => {
    const a = [{ x: 0, y: 0 }, { x: 2, y: 0 }];
    const b = [{ x: 2, y: 2 }, { x: 4, y: 2 }];
    const result = morphShape(a, b, 0.5);
    expect(result[0]).toEqual({ x: 1, y: 1 });
    expect(result[1]).toEqual({ x: 3, y: 1 });
  });

  it('clamps amount to 0..1', () => {
    const a = [{ x: 0, y: 0 }];
    const b = [{ x: 2, y: 2 }];
    const result = morphShape(a, b, 2);
    expect(result[0]).toEqual({ x: 2, y: 2 });
  });
});

describe('fmMorphAmount', () => {
  it('returns values between 0 and 1', () => {
    const values = Array.from({ length: 5 }, (_, i) =>
      fmMorphAmount(2, 1, 1, i * 0.1)
    );
    values.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});
