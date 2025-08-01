import { describe, it, expect } from 'vitest'
import { clamp, lerp, randomRange, randomInt } from '../mathUtils.js'

describe('mathUtils', () => {
  it('clamp returns within range', () => {
    expect(clamp(5, 1, 10)).toBe(5)
    expect(clamp(-5, 1, 10)).toBe(1)
    expect(clamp(15, 1, 10)).toBe(10)
  })

  it('lerp interpolates correctly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
  })

  it('randomRange returns within bounds', () => {
    for (let i = 0; i < 100; i++) {
      const r = randomRange(0, 1)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThan(1)
    }
  })

  it('randomInt returns integer within bounds', () => {
    for (let i = 0; i < 100; i++) {
      const n = randomInt(0, 5)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(5)
    }
  })
})
