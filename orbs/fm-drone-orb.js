export const FM_DRONE_TYPE = 'fm_drone';
import { tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, hideAnalogOrbMenu } from './analog-orb-ui.js';

let NexusPromise = typeof window !== 'undefined' ? import('nexusui') : null;
let NexusLib = null;
async function getNexus() {
  if (!NexusPromise) return null;
  if (!NexusLib) {
    const { default: Nexus } = await NexusPromise;
    NexusLib = Nexus;
  }
  return NexusLib;
}

export const DEFAULT_FM_DRONE_PARAMS = {
  pitch: 110,
  scaleIndex: 0,
  baseFreq: 110,
  harmonicity: 1.5,
  modulationIndex: 10,
  filterCutoff: 1200,
  filterResonance: 1.5,
  lfoRate: 0.05,
  lfoDepth: 200,
  reverbSend: 0.2,
  delaySend: 0.2,
  swarmCount: 0,
  visualStyle: 'fm_drone_swarm',
  ignoreGlobalSync: false,
};

export function createFmDroneAudioNodes(node) {
  const p = node.audioParams;
  const ctx = globalThis.audioContext;
  const baseFreq = p.pitch || p.baseFreq || 110;
  const carrier = ctx.createOscillator();
  carrier.type = p.oscType || 'sine';
  carrier.frequency.value = baseFreq;

  const modOsc = ctx.createOscillator();
  modOsc.type = 'sine';
  modOsc.frequency.value = baseFreq * (p.harmonicity || 1.5);

  const modGain = ctx.createGain();
  modGain.gain.value = p.modulationIndex || 10;
  modOsc.connect(modGain);
  modGain.connect(carrier.frequency);

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = p.lfoRate || 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = p.lfoDepth || 200;
  lfo.connect(lfoGain);
  lfoGain.connect(modGain.gain);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = p.filterCutoff || 1200;
  filter.Q.value = p.filterResonance || 1.5;

  carrier.connect(filter);

  const reverbSendGain = ctx.createGain();
  reverbSendGain.gain.value = p.reverbSend ?? 0.2;
  const delaySendGain = ctx.createGain();
  delaySendGain.gain.value = p.delaySend ?? 0.2;
  filter.connect(reverbSendGain);
  filter.connect(delaySendGain);

  const mainGain = ctx.createGain();
  mainGain.gain.value = 0.5;
  filter.connect(mainGain);

  if (globalThis.masterGain) {
    mainGain.connect(globalThis.masterGain);
  } else {
    mainGain.connect(ctx.destination);
  }
  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode)
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain)
    delaySendGain.connect(globalThis.masterDelaySendGain);

  const now = ctx.currentTime;
  carrier.start(now);
  modOsc.start(now);
  lfo.start(now);

  return {
    carrier,
    modOsc,
    modGain,
    lfo,
    lfoGain,
    filter,
    reverbSendGain,
    delaySendGain,
    mainGain,
    nodeRef: node,
  };
}

export function updateFmDroneParams(audioNodes) {
  const p = audioNodes.nodeRef?.audioParams;
  if (!p) return;
  const ctx = globalThis.audioContext;
  const now = ctx.currentTime;
  const baseFreq = p.pitch ?? p.baseFreq ?? 110;
  audioNodes.carrier.frequency.setTargetAtTime(baseFreq, now, 0.1);
  audioNodes.modOsc.frequency.setTargetAtTime(baseFreq * (p.harmonicity ?? 1.5), now, 0.1);
  audioNodes.modGain.gain.setTargetAtTime(p.modulationIndex ?? 10, now, 0.1);
  audioNodes.lfo.frequency.setTargetAtTime(p.lfoRate ?? 0.05, now, 0.1);
  audioNodes.lfoGain.gain.setTargetAtTime(p.lfoDepth ?? 200, now, 0.1);
  audioNodes.filter.frequency.setTargetAtTime(p.filterCutoff ?? 1200, now, 0.1);
  audioNodes.filter.Q.setTargetAtTime(p.filterResonance ?? 1.5, now, 0.1);
  audioNodes.reverbSendGain.gain.setTargetAtTime(p.reverbSend ?? 0.2, now, 0.1);
  audioNodes.delaySendGain.gain.setTargetAtTime(p.delaySend ?? 0.2, now, 0.1);
  if (p.oscType) {
    audioNodes.carrier.type = p.oscType;
  }
}

export function stopFmDroneAudioNodes(audioNodes) {
  try {
    audioNodes.carrier?.stop();
    audioNodes.modOsc?.stop();
    audioNodes.lfo?.stop();
  } catch (e) {}
  Object.values(audioNodes).forEach(n => {
    try { n.disconnect(); } catch (e) {}
  });
}

export async function showFmDroneOrbMenu(node) {
  hideFmDroneOrbMenu();
  if (!node || node.type !== FM_DRONE_TYPE) return;
  showTonePanel(node);
  if (!tonePanelContent) return;

  const Nexus = await getNexus();

  const container = document.createElement('div');
  container.id = 'fm-drone-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  const waveWrap = document.createElement('div');
  waveWrap.style.display = 'flex';
  waveWrap.style.flexDirection = 'column';
  waveWrap.style.alignItems = 'center';
  waveWrap.style.marginBottom = '6px';
  const waveLabel = document.createElement('div');
  waveLabel.textContent = 'Wave';
  waveLabel.style.fontSize = '10px';
  waveWrap.appendChild(waveLabel);
  const waveSelect = document.createElement('select');
  ['sine','square','triangle','sawtooth'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if ((node.audioParams.oscType || 'sine') === t) opt.selected = true;
    waveSelect.appendChild(opt);
  });
  waveSelect.addEventListener('change', () => {
    node.audioParams.oscType = waveSelect.value;
    updateNodeAudioParams(node);
  });
  waveWrap.appendChild(waveSelect);
  container.appendChild(waveWrap);

  const pads = [];
  const padDefs = [
    {
      label: 'Galactic Drift',
      map: (v) => {
        node.audioParams.harmonicity = 0.5 + v.x * 4.5;
        node.audioParams.modulationIndex = v.y * 20;
      },
    },
    {
      label: 'Shimmer Veil',
      map: (v) => {
        node.audioParams.filterCutoff = 200 + v.x * 4800;
        node.audioParams.filterResonance = 0.1 + v.y * 9.9;
      },
    },
    {
      label: 'Orbit Flux',
      map: (v) => {
        node.audioParams.lfoRate = v.x;
        node.audioParams.lfoDepth = v.y * 400;
      },
    },
    {
      label: 'Echo Bloom',
      map: (v) => {
        node.audioParams.reverbSend = v.x;
        node.audioParams.delaySend = v.y;
      },
    },
  ];

  padDefs.forEach((def, idx) => {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';
    wrap.style.marginBottom = '6px';
    const label = document.createElement('div');
    label.textContent = def.label;
    label.style.fontSize = '10px';
    wrap.appendChild(label);
    const target = document.createElement('div');
    target.style.width = '80px';
    target.style.height = '80px';
    wrap.appendChild(target);
    let pad;
    if (Nexus) {
      pad = new Nexus.Position(target, { size: [80, 80] });
      pad.on('change', v => {
        def.map(v);
        updateNodeAudioParams(node);
      });
    } else {
      const inputX = document.createElement('input');
      inputX.type = 'range';
      inputX.min = 0; inputX.max = 1; inputX.step = 0.01; inputX.value = 0.5;
      const inputY = document.createElement('input');
      inputY.type = 'range';
      inputY.min = 0; inputY.max = 1; inputY.step = 0.01; inputY.value = 0.5;
      const onChange = () => {
        const v = { x: parseFloat(inputX.value), y: parseFloat(inputY.value) };
        def.map(v);
        updateNodeAudioParams(node);
      };
      inputX.addEventListener('input', onChange);
      inputY.addEventListener('input', onChange);
      wrap.appendChild(inputX);
      wrap.appendChild(inputY);
      pad = {
        set: ({ x, y }) => {
          inputX.value = x;
          inputY.value = y;
          onChange();
        }
      };
    }
    container.appendChild(wrap);
    pads.push(pad);
  });

  const swarmWrap = document.createElement('div');
  swarmWrap.style.display = 'flex';
  swarmWrap.style.flexDirection = 'column';
  swarmWrap.style.alignItems = 'center';
  swarmWrap.style.marginBottom = '6px';
  const swarmLabel = document.createElement('div');
  swarmLabel.textContent = 'Beestjes';
  swarmLabel.style.fontSize = '10px';
  swarmWrap.appendChild(swarmLabel);
  const swarmSlider = document.createElement('input');
  swarmSlider.type = 'range';
  swarmSlider.min = 0;
  swarmSlider.max = 1;
  swarmSlider.step = 0.01;
  swarmSlider.value = node.audioParams.swarmCount || 0;
  swarmSlider.addEventListener('input', () => {
    node.audioParams.swarmCount = parseFloat(swarmSlider.value);
    updateNodeAudioParams(node);
  });
  swarmWrap.appendChild(swarmSlider);
  container.appendChild(swarmWrap);

  const btn = document.createElement('button');
  btn.textContent = 'Auto Drift';
  container.appendChild(btn);
  let autoInterval = null;
  btn.addEventListener('click', () => {
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
      btn.classList.remove('active');
    } else {
      btn.classList.add('active');
      autoInterval = setInterval(() => {
        pads.forEach(p => {
          const x = Math.random();
          const y = Math.random();
          if (p.set) p.set({ x, y });
          if (p.position) p.set({ x, y });
        });
      }, 2000);
    }
  });
}

export function hideFmDroneOrbMenu() {
  const existing = document.getElementById('fm-drone-container');
  if (existing) existing.remove();
  if (tonePanelContent) tonePanelContent.innerHTML = '';
  hideAnalogOrbMenu();
}
