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
  const t = document.createElement('div');
  document.body.appendChild(t);
  return {
    ...actual,
    tonePanelContent: t,
  };
});

const nodesMock = [];
vi.mock('../main.js', () => ({
  updateNodeAudioParams: vi.fn(),
  nodes: nodesMock,
}));

vi.mock('../orbs/analog-orb-ui.js', () => ({
  showTonePanel: vi.fn(),
  hideAnalogOrbMenu: vi.fn(),
}));

vi.stubGlobal('requestAnimationFrame', () => 1);
vi.stubGlobal('cancelAnimationFrame', vi.fn());

describe('FM Drone swarm reset', () => {
  it('clears swarm particles and runs auto drift', async () => {
    const { showFmDroneOrbMenu, hideFmDroneOrbMenu, FM_DRONE_TYPE } = await import('../orbs/fm-drone-orb.js');
    const node = { id: 1, type: FM_DRONE_TYPE, audioParams: {}, swarmParticles: [{}, {}] };
    nodesMock.push(node);
    await showFmDroneOrbMenu(node);
    expect(node.swarmParticles).toEqual([]);
    expect(node.autoDriftInterval).toBe(1);
    hideFmDroneOrbMenu();
    expect(node.autoDriftInterval).toBeNull();
  });
});
