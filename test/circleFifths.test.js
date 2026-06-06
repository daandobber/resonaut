import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../orbs/analog-orb-ui.js', () => ({ showTonePanel: () => {} }));
vi.mock('../orbs/alien-orb.js', () => ({ showAlienPanel: () => {} }));
vi.mock('../orbs/pluck-synth-orb.js', () => ({ pluckSynthPresets: [] }));
vi.mock('../orbs/tone-pluck-synth-ui.js', () => ({ showTonePluckSynthMenu: () => {} }));
vi.mock('../orbs/ether-aura-ui.js', () => ({ showEtherAuraMenu: () => {} }));

let CIRCLE_FIFTHS_TYPE;
let applyZodiacPresetToCircle;
let handleCirclePulse;

beforeAll(async () => {
  const mod = await import('../orbs/circle-fifths.js');
  CIRCLE_FIFTHS_TYPE = mod.CIRCLE_FIFTHS_TYPE;
  applyZodiacPresetToCircle = mod.applyZodiacPresetToCircle;
  handleCirclePulse = mod.handleCirclePulse;
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
    highlightCircleDegreeBars: () => {},
    SAMPLER_DEFINITIONS: [
      { id: 'bass_drum', baseFreq: null },
      { id: 'marimba', baseFreq: 130.81 },
    ],
    child,
  };
}

describe('circle of fifths sequencing', () => {
  it('Aries moves away from the root over repeated pulses', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      audioParams: {
        centerAttachedNodeId: 2,
        randomChordProbability: 0,
      },
    };
    applyZodiacPresetToCircle(node, 'Aries');
    const events = [];
    const conn = { nodeAId: node.id, nodeAHandle: 0, nodeBId: 99, nodeBHandle: 0 };

    handleCirclePulse(node, conn, makeDeps(events));
    handleCirclePulse(node, conn, makeDeps(events));
    handleCirclePulse(node, conn, makeDeps(events));

    expect(events).toEqual([1, 5, 2]);
  });

  it('Taurus is a moving sequencer, not a root lock', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      audioParams: {
        centerAttachedNodeId: 2,
        randomChordProbability: 0,
      },
    };
    applyZodiacPresetToCircle(node, 'Taurus');
    expect(node.audioParams.holdRoot).toBe(false);

    const events = [];
    const conn = { nodeAId: node.id, nodeAHandle: -1, nodeBId: 99, nodeBHandle: 0 };
    handleCirclePulse(node, conn, makeDeps(events));
    handleCirclePulse(node, conn, makeDeps(events));
    handleCirclePulse(node, conn, makeDeps(events));

    expect(events).toEqual([2, 4, 1]);
  });

  it('old single-root degree states are forced into movement', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      audioParams: {
        centerAttachedNodeId: 2,
        patternSource: 'zodiac',
        zodiacSign: 'Taurus',
        sequenceMode: 'degree',
        degreePattern: '1',
        holdRoot: true,
        randomChordProbability: 0,
      },
    };

    const events = [];
    const conn = { nodeAId: node.id, nodeAHandle: -1, nodeBId: 99, nodeBHandle: 0 };
    handleCirclePulse(node, conn, makeDeps(events));
    handleCirclePulse(node, conn, makeDeps(events));

    expect(events).toEqual([2, 4]);
  });

  it('plays custom degree patterns instead of staying on the root', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      audioParams: {
        centerAttachedNodeId: 2,
        patternSource: 'custom',
        sequenceMode: 'degree',
        degreePattern: '1,3',
        holdRoot: true,
        randomChordProbability: 0,
      },
    };
    const events = [];
    const conn = { nodeAId: node.id, nodeAHandle: -1, nodeBId: 99, nodeBHandle: 0 };

    handleCirclePulse(node, conn, makeDeps(events));
    handleCirclePulse(node, conn, makeDeps(events));

    expect(events).toEqual([2, 0]);
  });

  it('replaces unpitched center samplers so sequenced notes can change pitch', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      audioParams: {
        centerAttachedNodeId: 2,
        randomChordProbability: 0,
      },
    };
    applyZodiacPresetToCircle(node, 'Aries');
    const events = [];
    const deps = makeDeps(events, { waveform: 'sampler_bass_drum', engine: 'sampler' });
    const conn = { nodeAId: node.id, nodeAHandle: 0, nodeBId: 99, nodeBHandle: 0 };

    handleCirclePulse(node, conn, deps);

    expect(events).toEqual([1]);
    expect(deps.child.audioParams.waveform).toBe('sampler_marimba');
    expect(deps.child.audioParams.engine).toBeUndefined();
  });

  it('creates a playable center instrument when the saved attachment is missing', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      x: 100,
      y: 120,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      audioParams: {
        centerAttachedNodeId: 999,
        randomChordProbability: 0,
      },
    };
    applyZodiacPresetToCircle(node, 'Aries');
    const events = [];
    const deps = makeDeps(events);
    deps.findNodeById = () => null;
    const conn = { nodeAId: node.id, nodeAHandle: 0, nodeBId: 99, nodeBHandle: 0 };

    handleCirclePulse(node, conn, deps);

    expect(events).toEqual([1]);
    expect(node.audioParams.centerAttachedNodeId).toBe(2);
    expect(deps.child.audioNodes).toEqual({ gainNode: {} });
  });

  it('passes through a standard cable even when an old directional flag is stale', () => {
    const node = {
      id: 1,
      type: CIRCLE_FIFTHS_TYPE,
      segments: 12,
      segmentIndex: 0,
      patternIndex: 0,
      connections: new Set([99, 3]),
      audioParams: {
        centerAttachedNodeId: 2,
        randomChordProbability: 0,
      },
    };
    applyZodiacPresetToCircle(node, 'Aries');
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
    deps.createVisualPulse = () => {};
    deps.propagateTrigger = (neighbor, _travelTime, _pulseId, sourceNodeId, _hops, _pulseData, conn) => {
      propagated.push({ neighborId: neighbor.id, sourceNodeId, connectionId: conn.id });
    };

    handleCirclePulse(node, incoming, deps);

    expect(propagated).toEqual([{ neighborId: 3, sourceNodeId: node.id, connectionId: 11 }]);
  });
});
