// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';

vi.mock('nexusui', () => ({
  default: {
    Position: class {
      constructor() {}
      on() {}
      set() {}
      colorize() {}
    },
    Dial: class {
      constructor() { this.value = 0; }
      on() {}
      colorize() {}
    },
  },
}));

vi.mock('../utils/domElements.js', async () => {
  const actual = await vi.importActual('../utils/domElements.js');
  return {
    ...actual,
    tonePanelContent: document.createElement('div'),
  };
});

vi.mock('../main.js', () => ({
  updateNodeAudioParams: vi.fn(),
  nodes: [],
}));

vi.mock('../orbs/analog-orb-ui.js', () => ({
  showTonePanel: vi.fn(),
  hideAnalogOrbMenu: vi.fn(),
}));

describe('FM Drone swarm reset', () => {
  it('clears existing swarm particles when menu opens', async () => {
    const { showFmDroneOrbMenu, FM_DRONE_TYPE } = await import('../orbs/fm-drone-orb.js');
    const node = { id: 1, type: FM_DRONE_TYPE, audioParams: {}, swarmParticles: [{}, {}] };
    await showFmDroneOrbMenu(node);
    expect(node.swarmParticles).toEqual([]);
  });
});
