import { describe, it, expect } from 'vitest';
import { isEmbeddedInstrument, repairCenterConnections } from '../utils/centerSequencerRouting.js';

describe('center sequencer cable repair', () => {
  it.each(['circle_fifths', 'tonnetz_sequencer', 'galactic_bloom'])('repairs hidden instrument cables for %s, including owner ID zero', type => {
    const nodes = [
      { id: 0, type, audioParams: { centerAttachedNodeId: 1 } },
      { id: 1, type: 'sound', isEmbeddedInCircleId: 0 },
      { id: 2, type: 'pulsar_standard' },
    ];
    expect(isEmbeddedInstrument(nodes[1])).toBe(true);
    const result = repairCenterConnections(nodes, [{ id: 4, nodeAId: 2, nodeBId: 1, type: 'standard' }]);
    expect(result[0]).toMatchObject({ nodeAId: 2, nodeBId: 0, nodeBHandle: -1 });
    expect([...nodes[0].connections]).toEqual([2]);
    expect([...nodes[1].connections]).toEqual([]);
    expect([...nodes[2].connections]).toEqual([0]);
  });

  it('preserves one-way direction and removes duplicate repaired cables', () => {
    const nodes = [{ id: 0, type: 'tonnetz_sequencer', audioParams: { centerAttachedNodeId: 1 } }, { id: 1, type: 'sound' }, { id: 2, type: 'sound' }];
    const result = repairCenterConnections(nodes, [
      { id: 7, nodeAId: 1, nodeBId: 2, type: 'one_way', directional: true },
      { id: 8, nodeAId: 0, nodeBId: 2, type: 'standard' },
      { id: 9, nodeAId: 0, nodeBId: 1, type: 'standard' },
    ]);
    expect(result).toEqual([{ id: 7, nodeAId: 0, nodeBId: 2, nodeAHandle: 0, type: 'one_way', directional: true }]);
  });
});
