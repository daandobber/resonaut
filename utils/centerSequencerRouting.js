const CENTER_TYPES = new Set(['circle_fifths', 'tonnetz_sequencer', 'galactic_bloom']);

export function isCenterSequencerType(type) { return CENTER_TYPES.has(type); }

export function isEmbeddedInstrument(node) {
  return node?.isEmbeddedInCircleId != null || node?.isEmbeddedInTonnetzId != null;
}

export function centerOwnership(nodes) {
  const owners = new Map();
  for (const node of nodes) {
    if (isCenterSequencerType(node.type) && node.audioParams?.centerAttachedNodeId != null) {
      owners.set(node.audioParams.centerAttachedNodeId, node);
    }
  }
  return owners;
}

// Old auto-snap could cable directly to a hidden instrument, bypassing its sequencer.
export function repairCenterConnections(nodes, connections) {
  const owners = centerOwnership(nodes);
  const ids = new Set(nodes.map(n => n.id));
  const seen = new Set();
  const repaired = [];
  for (const connection of connections) {
    const next = { ...connection };
    if (next.type !== 'vein') {
      const ownerA = owners.get(next.nodeAId);
      const ownerB = owners.get(next.nodeBId);
      if (ownerA) { next.nodeAId = ownerA.id; next.nodeAHandle = 0; }
      if (ownerB) { next.nodeBId = ownerB.id; next.nodeBHandle = -1; }
    }
    if (next.nodeAId === next.nodeBId || !ids.has(next.nodeAId) || !ids.has(next.nodeBId)) continue;
    const key = [next.nodeAId, next.nodeBId].sort((a, b) => a - b).join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    repaired.push(next);
  }
  for (const node of nodes) node.connections = new Set();
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const connection of repaired) {
    byId.get(connection.nodeAId).connections.add(connection.nodeBId);
    byId.get(connection.nodeBId).connections.add(connection.nodeAId);
  }
  return repaired;
}
