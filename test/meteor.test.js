import { describe, it, expect, vi } from 'vitest'

const triggerNodeEffect = vi.fn()

vi.mock('../main.js', () => ({
  triggerNodeEffect,
}))

function makeNode(id, x, y) {
  return { id, x, y, size: 1, type: 'sound', audioParams: {} }
}

describe('updateAndDrawMeteorShowers', () => {
  it('calls triggerNodeEffect when a meteor overlaps a node', async () => {
    globalThis.document = { documentElement: {} }
    globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' })
    const { updateAndDrawMeteorShowers, activeMeteorShowers } = await import('../utils/meteor.js')

    triggerNodeEffect.mockClear()
    globalThis.propagateTrigger = (node) => {
      triggerNodeEffect(node)
    }
    globalThis.isAudioReady = true
    globalThis.isPulsarType = () => false
    globalThis.isDrumType = () => false
    globalThis.ctx = null
    globalThis.NODE_RADIUS_BASE = 1
    const node = makeNode('orb1', 5, 0)
    globalThis.nodes = [node]

    activeMeteorShowers.length = 0
    activeMeteorShowers.push({
      id: 'ms1',
      originX: 0,
      originY: 0,
      currentRadius: 0,
      maxRadius: 50,
      growthRate: 100,
      color: 'red',
      startTime: 0,
      sourceNodeId: 'source',
      triggeredNodes: new Set(),
      generation: 0,
      pulseData: { intensity: 1, color: 'red' },
      isCollisionProduct: false,
      canSpawnFromCollisionUntil: 0
    })

    updateAndDrawMeteorShowers(0.1, 0)

    expect(triggerNodeEffect).toHaveBeenCalled()
  })
})
