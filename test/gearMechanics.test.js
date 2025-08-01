import { describe, it, expect } from 'vitest'
import { computeDrivenSpeed, stepAngle, rotateDrivenGear } from '../utils/gearMechanics.js'

describe('gearMechanics', () => {
  it('computeDrivenSpeed accounts for tooth ratio', () => {
    expect(computeDrivenSpeed(2, 8, 8)).toBeCloseTo(2)
  })

  it('stepAngle wraps around 2pi', () => {
    const full = Math.PI * 2
    expect(stepAngle(0, 1, full)).toBeCloseTo(0)
  })

  it('rotateDrivenGear updates gear angle from motor ratio', () => {
    const motor = { speed: 2, teeth: 8 }
    const gear = { teeth: 8, angle: 0 }
    rotateDrivenGear(motor, gear, 1)
    expect(gear.angle).toBeCloseTo(2)
  })
})

