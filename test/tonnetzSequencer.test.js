import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../orbs/analog-orb-ui.js', () => ({ showTonePanel: () => {} }));
vi.mock('../orbs/alien-orb.js', () => ({ showAlienPanel: () => {} }));
vi.mock('../orbs/pluck-synth-orb.js', () => ({ pluckSynthPresets: [] }));
vi.mock('../orbs/tone-pluck-synth-ui.js', () => ({ showTonePluckSynthMenu: () => {} }));
vi.mock('../orbs/ether-aura-ui.js', () => ({ showEtherAuraMenu: () => {} }));

let TONNETZ_TYPE;
let applyTonnetzPreset;
let handleTonnetzPulse;

beforeAll(async () => {
  const mod = await import('../orbs/tonnetz-sequencer.js');
  TONNETZ_TYPE = mod.TONNETZ_TYPE;
  applyTonnetzPreset = mod.applyTonnetzPreset;
  handleTonnetzPulse = mod.handleTonnetzPulse;
});

function makeDeps(events, childAudioParams = {}) {
  const child = {
    id: 2,
    type: 'sound',
    audioParams: { scaleIndex: 0, ...childAudioParams },
  };
  return {
    findNodeById: (id) => (id === 2 ? child : null),
    triggerNodeEffect: (_node, _pulse, _start, _glide, override) => {
      if (!_node.audioNodes?.gainNode) return;
      events.push(override.scaleIndexOverride);
    },
    addNode: (_x, _y, type, subtype) => {
      child.type = type;
      child.audioParams.waveform = subtype;
      return child;
    },
    createAudioNodesForNode: () => ({ gainNode: {} }),
    updateNodeAudioParams: () => {},
    MIN_SCALE_INDEX: -48,
    MAX_SCALE_INDEX: 48,
    DELAY_FACTOR: 0,
    propagateTrigger: () => {},
    createVisualPulse: () => {},
    connections: [],
    highlightTonnetzPosition: () => {},
    SAMPLER_DEFINITIONS: [
      { id: 'bass_drum', baseFreq: null },
      { id: 'marimba', baseFreq: 130.81 },
    ],
    child,
  };
}

function makeNode(audioParams = {}) {
  return {
    id: 1,
    type: TONNETZ_TYPE,
    connections: new Set(),
    patternIndex: 0,
    audioParams: {
      centerAttachedNodeId: 2,
      chordProbability: 0,
      sequenceLength: 8,
      ...audioParams,
    },
  };
}

describe('tonnetz sequencing', () => {
  it('advances position and notes over repeated pulses', () => {
    const node = makeNode({
      sequenceMode: 'triad',
      direction: 'chromatic_mediant',
      triadPattern: 'major,minor',
    });
    const events = [];
    const conn = { nodeAId: node.id, nodeAHandle: -1, nodeBId: 99, nodeBHandle: 0 };

    handleTonnetzPulse(node, conn, makeDeps(events));
    handleTonnetzPulse(node, conn, makeDeps(events));
    handleTonnetzPulse(node, conn, makeDeps(events));

    expect(events).toEqual([7, 11, 6]);
    expect(node.currentPos).toEqual({ x: 2, y: 1 });
    expect(node.audioParams.currentPosition).toEqual({ x: 2, y: 1 });
  });

  it('uses the legacy sequencingMode field and handles counterclockwise hex steps', () => {
    const node = makeNode({
      sequencingMode: 'hexagon_walk',
      direction: 'counterclockwise',
      stepPattern: '1',
    });
    const events = [];
    const conn = { nodeAId: 99, nodeAHandle: 0, nodeBId: node.id, nodeBHandle: -1 };

    handleTonnetzPulse(node, conn, makeDeps(events));
    handleTonnetzPulse(node, conn, makeDeps(events));

    expect(events).toEqual([4, 11]);
    expect(node.audioParams.sequenceMode).toBe('hexagon_walk');
    expect(node.currentPos).toEqual({ x: 1, y: 1 });
  });

  it('applies presets without leaving stale sequence mode state', () => {
    const node = makeNode({
      sequenceMode: 'triad',
      sequencingMode: 'triad',
      currentPosition: { x: 2, y: 2 },
    });

    applyTonnetzPreset(node, 'Minimal');

    expect(node.audioParams.sequenceMode).toBe('hexagon_walk');
    expect(node.audioParams.sequencingMode).toBe('hexagon_walk');
    expect(node.patternIndex).toBe(0);
    expect(node.currentPos).toEqual({ x: 0, y: 0 });
  });

  it('replaces unpitched center samplers so sequenced notes can change pitch', () => {
    const node = makeNode({
      sequenceMode: 'triad',
      direction: 'chromatic_mediant',
      triadPattern: 'major,minor',
    });
    const events = [];
    const deps = makeDeps(events, { waveform: 'sampler_bass_drum', engine: 'sampler' });
    const conn = { nodeAId: node.id, nodeAHandle: -1, nodeBId: 99, nodeBHandle: 0 };

    handleTonnetzPulse(node, conn, deps);

    expect(events).toEqual([7]);
    expect(deps.child.audioParams.waveform).toBe('sampler_marimba');
    expect(deps.child.audioParams.engine).toBeUndefined();
  });

  it('creates a playable center instrument when the saved attachment is missing', () => {
    const node = makeNode({
      centerAttachedNodeId: 999,
      sequenceMode: 'triad',
      direction: 'chromatic_mediant',
      triadPattern: 'major,minor',
    });
    node.x = 100;
    node.y = 120;
    const events = [];
    const deps = makeDeps(events);
    deps.findNodeById = () => null;
    const conn = { nodeAId: node.id, nodeAHandle: -1, nodeBId: 99, nodeBHandle: 0 };

    handleTonnetzPulse(node, conn, deps);

    expect(events).toEqual([7]);
    expect(node.audioParams.centerAttachedNodeId).toBe(2);
    expect(deps.child.audioNodes).toEqual({ gainNode: {} });
  });

  it('passes through a standard cable even when an old directional flag is stale', () => {
    const node = makeNode({
      sequenceMode: 'triad',
      direction: 'chromatic_mediant',
      triadPattern: 'major,minor',
    });
    node.connections = new Set([99, 3]);
    const incoming = { id: 10, nodeAId: 99, nodeAHandle: 0, nodeBId: node.id, nodeBHandle: -1, type: 'standard' };
    const outgoing = {
      id: 11,
      nodeAId: 3,
      nodeBId: node.id,
      type: 'standard',
      directional: true,
      length: 0,
    };
    const events = [];
    const propagated = [];
    const deps = makeDeps(events);
    deps.connections = [incoming, outgoing];
    deps.findNodeById = (id) => (id === 2 ? deps.child : id === 3 ? { id: 3, type: 'sound' } : null);
    deps.propagateTrigger = (neighbor, _travelTime, _pulseId, sourceNodeId, _hops, _pulseData, conn) => {
      propagated.push({ neighborId: neighbor.id, sourceNodeId, connectionId: conn.id });
    };

    handleTonnetzPulse(node, incoming, deps);

    expect(propagated).toEqual([{ neighborId: 3, sourceNodeId: node.id, connectionId: 11 }]);
  });
});
