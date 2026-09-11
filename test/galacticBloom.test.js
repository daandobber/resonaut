import { beforeAll, describe, it, expect, vi } from 'vitest';

vi.mock('../orbs/circle-fifths.js', () => ({
  CIRCLE_FIFTHS_TYPE: 'circle_fifths',
  handleCirclePulse: () => true,
  initCircleNode: (node) => {
    node.audioParams.ignoreGlobalSync = true;
    node.patternIndex = 0;
  },
}));

let GALACTIC_PRESETS;
let applyGalacticPreset;
let canTriggerGalacticNote;
let euclideanPattern;
let initGalacticNode;
let mutateGalacticBloom;

beforeAll(async () => {
  globalThis.document ??= { documentElement: {}, body: {} };
  globalThis.getComputedStyle ??= () => ({ getPropertyValue: () => '' });
  const mod = await import('../orbs/galactic-bloom.js');
  GALACTIC_PRESETS = mod.GALACTIC_PRESETS;
  applyGalacticPreset = mod.applyGalacticPreset;
  canTriggerGalacticNote = mod.canTriggerGalacticNote;
  euclideanPattern = mod.euclideanPattern;
  initGalacticNode = mod.initGalacticNode;
  mutateGalacticBloom = mod.mutateGalacticBloom;
});

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

describe('galactic bloom presets', () => {
  it('exposes several playable modes', () => {
    expect(Object.keys(GALACTIC_PRESETS)).toEqual(expect.arrayContaining(['bloom', 'sparse', 'cascade', 'storm']));
  });

  it('applies preset values and rebuilds dots', () => {
    const node = { audioParams: {} };

    applyGalacticPreset(node, 'sparse');

    expect(node.audioParams.galacticPreset).toBe('sparse');
    expect(node.audioParams.numSpokes).toBe(GALACTIC_PRESETS.sparse.values.numSpokes);
    expect(node._galDots).toHaveLength(GALACTIC_PRESETS.sparse.values.numDots);
  });

  it('mutation creates valid spoke state and a non-empty dot layout', () => {
    const node = { audioParams: { numSpokes: 5, numDots: 11, mutationAmount: 0.8 } };

    mutateGalacticBloom(node, 0.8);

    expect(node.audioParams.spokeAngles).toHaveLength(5);
    expect(node.audioParams.spokeEnabled).toHaveLength(5);
    expect(node.audioParams.spokeEnabled.some(Boolean)).toBe(true);
    expect(node._galDots).toHaveLength(11);
    expect(node._galDots.every((dot) => dot.r >= 0.1 && dot.r <= 0.92)).toBe(true);
  });

  it('caps dense saved dot counts at sixteen', () => {
    const node = { audioParams: { numSpokes: 8, numDots: 100, mutationAmount: 0.8 } };

    mutateGalacticBloom(node, 0.8);

    expect(node._galDots).toHaveLength(16);
  });

  it('restores galactic runtime defaults after circle initialization', () => {
    const node = { id: 1, x: 0, y: 0, audioParams: {} };

    initGalacticNode(node, {
      DEFAULT_PULSE_INTENSITY: 1,
      DEFAULT_SUBDIVISION_INDEX: 0,
      DEFAULT_TRIGGER_INTERVAL: 0.5,
      samplerWaveformTypes: [],
      SAMPLER_DEFINITIONS: [],
      addNode: () => null,
    });

    expect(node.audioParams.ignoreGlobalSync).toBe(false);
    expect(node.audioParams.spinSyncEnabled).toBe(true);
    expect(node.audioParams.randomChordProbability).toBe(0);
    expect(node._galDots).toHaveLength(node.audioParams.numDots);
  });

  it('limits dense trigger bursts', () => {
    const node = { audioParams: { minTriggerMs: 50, maxNotesPerSecond: 2 } };

    expect(canTriggerGalacticNote(node, 1000)).toBe(true);
    expect(canTriggerGalacticNote(node, 1020)).toBe(false);
    expect(canTriggerGalacticNote(node, 1060)).toBe(true);
    expect(canTriggerGalacticNote(node, 1120)).toBe(false);
    expect(canTriggerGalacticNote(node, 2061)).toBe(true);
  });
});
