import { alienPanel, alienPanelContent } from '../utils/domElements.js';
import {
  getScreenCoords,
  createOp1HBar,
  saveState,
  setupAudio,
  stopNodeAudio,
  createAudioNodesForNode,
  updateNodeAudioParams,
  identifyAndRouteAllGroups,
} from '../main.js';

export const ALIEN_ORB_TYPE = 'alien_orb';
export const ALIEN_DRONE_TYPE = 'alien_drone';

export let alienEngine = 0;
export let alienLfoRate = 1.0;
export let alienLfoAmount = 0.2;
export let alienLfoTargets = new Set(['flux']);
let alienLfoPhase = 0;
let alienSliders = {};
let alienLfoToggles = {};
let alienEngineOrbs = null;
let alienAudioNodes = null;
let alienAnalyser = null;
let alienVisualRunning = false;
let alienOrbCanvas = null;
let alienOrbCtx = null;
let alienLastVisualTime = 0;
let alienLfoScopeCanvas = null;
let alienLfoScopeCtx = null;

export function randomGeez(len = 4) {
  let str = '';
  for (let i = 0; i < len; i++) {
    const code = 0x1200 + Math.floor(Math.random() * (0x137f - 0x1200));
    str += String.fromCharCode(code);
  }
  return str;
}

export function setAlienLfoRate(val) {
  alienLfoRate = val;
}

export function setAlienLfoAmount(val) {
  alienLfoAmount = val;
}

let currentAlienNode = null;

export const DEFAULT_ALIEN_PARAMS = {
  pitch: 440,
  scaleIndex: 0,
  flux: 50,
  vorr: 50,
  chime: 50,
  dross: 50,
  krell: 50,
  prax: 50,
  zuul: 50,
  qorx: 50,
  lfoRate: 1.0,
  lfoAmount: 0.2,
  lfoTargets: ['flux'],
  engine: 0,
  visualStyle: 'alien_orb_default',
  ignoreGlobalSync: false,
};

export function positionAlienPanel(node) {
  if (!alienPanel) return;
  const coords = getScreenCoords(node.x, node.y);
  const offsetX = 80;
  alienPanel.style.position = 'fixed';
  alienPanel.style.left = `${coords.x + offsetX}px`;
  alienPanel.style.top = `${coords.y}px`;
  alienPanel.style.right = 'auto';
  alienPanel.style.transform = 'translate(0, -50%)';
}

export function showAlienPanel(node) {
  if (!alienPanel) return;
  alienPanel.classList.remove('hidden');
  alienPanel.dataset.nodeId = node.id;
  positionAlienPanel(node);
}

export function hideAlienPanel() {
  if (alienPanel) alienPanel.classList.add('hidden');
}

export function hideAlienOrbMenu() {
  const existing = document.getElementById('alien-orb-container');
  if (existing) existing.remove();
  if (alienPanelContent) alienPanelContent.innerHTML = '';
  currentAlienNode = null;
  alienLfoScopeCanvas = null;
  alienLfoScopeCtx = null;
}

export function showAlienOrbMenu(node) {
  hideAlienOrbMenu();
  if (typeof hideSamplerOrbMenu === 'function') hideSamplerOrbMenu();
  if (!node || (node.type !== ALIEN_ORB_TYPE && node.type !== 'alien_drone')) return;
  currentAlienNode = node;
  showAlienPanel(node);
  if (!alienPanelContent) return;
  alienEngine = node.audioParams.engine || 0;
  alienLfoRate = node.audioParams.lfoRate ?? 1.0;
  alienLfoAmount = node.audioParams.lfoAmount ?? 0.2;
  alienLfoTargets = new Set(
    node.audioParams.lfoTargets || [node.audioParams.lfoTarget || 'flux']
  );
  const container = document.createElement('div');
  container.id = 'alien-orb-container';
  container.className = 'op1-panel';
  container.dataset.nodeId = node.id;
  alienPanelContent.innerHTML = '';
  alienPanelContent.appendChild(container);

  const firstRow = document.createElement('div');
  firstRow.className = 'prorb-bar-row';
  const secondRow = document.createElement('div');
  secondRow.className = 'prorb-bar-row';
  const params = ['flux','vorr','chime','dross','krell','prax','zuul','qorx'];
  alienSliders = {};
  params.forEach((p, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'prorb-bar-wrapper';
    const bar = document.createElement('div');
    bar.className = 'prorb-bar';
    const val = node.audioParams[p] ?? 50;
    const setVal = v => {
      const pct = Math.max(2, Math.min(100, v));
      bar.style.height = `${pct}%`;
      wrap.dataset.value = v;
    };
    setVal(val);
    wrap.appendChild(bar);

    const geez = document.createElement('div');
    geez.className = 'geez-display';
    geez.textContent = randomGeez(3 + Math.floor(Math.random()*3));
    wrap.appendChild(geez);

    const toggle = document.createElement('div');
    toggle.className = 'lfo-toggle';
    toggle.title = 'LFO Target';
    toggle.addEventListener('mousedown', e => e.stopPropagation());
    toggle.addEventListener('click', () => {
      if (alienLfoTargets.has(p)) {
        alienLfoTargets.delete(p);
      } else {
        alienLfoTargets.add(p);
      }
      node.audioParams.lfoTargets = Array.from(alienLfoTargets);
      updateAlienLfoToggleUI();
      saveState();
    });
    wrap.appendChild(toggle);
    alienLfoToggles[p] = toggle;

    let dragging = false;
    const updateFromPos = y => {
      const rect = wrap.getBoundingClientRect();
      let ratio = (rect.bottom - y) / rect.height;
      ratio = Math.max(0, Math.min(1, ratio));
      const newVal = ratio * 100;
      setVal(newVal);
      geez.textContent = randomGeez(3 + Math.floor(Math.random()*3));
      node.audioParams[p] = newVal;
      updateAlienNodesParams(node.audioNodes, node.audioParams.engine, node.audioParams.pitch);
      if (node.audioNodes && node.audioNodes.orbitoneSynths) {
        node.audioNodes.orbitoneSynths.forEach((s) =>
          updateAlienNodesParams(
            s,
            node.audioParams.engine,
            s.baseFreq || node.audioParams.pitch
          )
        );
      }
      updateAlienParams();
    };
    wrap.addEventListener('mousedown', e => {
      dragging = true; updateFromPos(e.clientY);
      const move = ev => { if (dragging) updateFromPos(ev.clientY); };
      const up = () => { dragging = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); saveState(); };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    (idx < 4 ? firstRow : secondRow).appendChild(wrap);
    alienSliders[p] = wrap;
  });
  container.appendChild(firstRow);

  const lfoRow = document.createElement('div');
  lfoRow.className = 'prorb-bar-row';
  const lfoParams = [
    { id: 'lfoRate', min: 0.1, max: 10 },
    { id: 'lfoAmount', min: 0, max: 1 }
  ];
  lfoParams.forEach(info => {
    const wrap = document.createElement('div');
    wrap.className = 'prorb-bar-wrapper';
    const bar = document.createElement('div');
    bar.className = 'prorb-bar';
    const val = node.audioParams[info.id] ?? info.min;
    const setVal = v => {
      const pct = ((v - info.min) / (info.max - info.min)) * 100;
      bar.style.height = `${Math.max(2, Math.min(100, pct))}%`;
      wrap.dataset.value = v;
    };
    setVal(val);
    wrap.appendChild(bar);

    const geez = document.createElement('div');
    geez.className = 'geez-display';
    geez.textContent = randomGeez(3 + Math.floor(Math.random()*3));
    wrap.appendChild(geez);

    let dragging = false;
    const updateFromPos = y => {
      const rect = wrap.getBoundingClientRect();
      let ratio = (rect.bottom - y) / rect.height;
      ratio = Math.max(0, Math.min(1, ratio));
      const newVal = info.min + ratio * (info.max - info.min);
      setVal(newVal);
      geez.textContent = randomGeez(3 + Math.floor(Math.random()*3));
      node.audioParams[info.id] = newVal;
      if (info.id === 'lfoRate') setAlienLfoRate(newVal);
      if (info.id === 'lfoAmount') setAlienLfoAmount(newVal);
      updateAlienParams();
    };
    wrap.addEventListener('mousedown', e => {
      dragging = true; updateFromPos(e.clientY);
      const move = ev => { if (dragging) updateFromPos(ev.clientY); };
      const up = () => { dragging = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); saveState(); };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    lfoRow.appendChild(wrap);
  });
  alienLfoScopeCanvas = document.createElement('canvas');
  alienLfoScopeCanvas.id = 'alienLfoScope';
  alienLfoScopeCanvas.width = 100;
  alienLfoScopeCanvas.height = 30;
  alienLfoScopeCtx = alienLfoScopeCanvas.getContext('2d');
  lfoRow.appendChild(alienLfoScopeCanvas);
  container.appendChild(lfoRow);

  updateAlienLfoToggleUI();

  const engineRow = document.createElement('div');
  engineRow.id = 'alienEngineRow';
  engineRow.className = 'alien-engine-row';
  for (let i=0;i<4;i++) {
    const c = document.createElement('canvas');
    c.className = 'alien-engine-orb';
    c.dataset.engine = i;
    c.width = 20; c.height = 20;
    engineRow.appendChild(c);
  }
  container.appendChild(engineRow);
  container.appendChild(secondRow);
  alienEngineOrbs = engineRow.querySelectorAll('.alien-engine-orb');
  alienEngineOrbs.forEach((orb) => {
    orb.addEventListener('click', () => {
      const eng = parseInt(orb.dataset.engine, 10);
      if (alienEngine !== eng) {
        alienEngine = eng;
        node.audioParams.engine = eng;
        if (node.audioNodes) {
          if (typeof stopNodeAudio === 'function') stopNodeAudio(node);
          node.audioNodes = createAudioNodesForNode(node);
          if (node.audioNodes) {
            updateAlienNodesParams(
              node.audioNodes,
              node.audioParams.engine,
              node.audioParams.pitch,
              0,
              true,
            );
            updateNodeAudioParams(node);
            identifyAndRouteAllGroups();
          }
        }
        if (alienAudioNodes) {
          stopAlienSynth();
          startAlienSynth();
        }
        updateAlienEngineUI();
        saveState();
      }
    });
  });
  updateAlienEngineUI();
  startAlienSynth();
  positionAlienPanel(node);
}

export function createAlienSynth(engine = 0, baseFreq = 220, autoConnect = true) {
  if (!isFinite(baseFreq) || baseFreq < 20) baseFreq = 220;
  const analyserNode = globalThis.audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  const mix = globalThis.audioContext.createGain();
  mix.gain.value = 0;
  mix.connect(analyserNode);
  if (autoConnect) {
    if (globalThis.masterGain)
      analyserNode.connect(globalThis.masterGain);
    else analyserNode.connect(globalThis.audioContext.destination);
  }
  let nodes = { mix, analyser: analyserNode, baseGain: 1, baseFreq, engine };
  if (engine === 0) {
    const osc = globalThis.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = baseFreq;
    const f1 = globalThis.audioContext.createBiquadFilter();
    const f2 = globalThis.audioContext.createBiquadFilter();
    const f3 = globalThis.audioContext.createBiquadFilter();
    [f1, f2, f3].forEach(f => { f.type = 'bandpass'; f.Q.value = 8; });
    [f1, f2, f3].forEach(f => { f.frequency.value = baseFreq; });
    const g1 = globalThis.audioContext.createGain();
    const g2 = globalThis.audioContext.createGain();
    const g3 = globalThis.audioContext.createGain();
    osc.connect(f1); osc.connect(f2); osc.connect(f3);
    f1.connect(g1); f2.connect(g2); f3.connect(g3);
    g1.connect(mix); g2.connect(mix); g3.connect(mix);
    osc.start();
    Object.assign(nodes, { osc, f1, f2, f3, g1, g2, g3 });
  } else if (engine === 1) {
    const carrier = globalThis.audioContext.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.value = baseFreq;
    const mod = globalThis.audioContext.createOscillator();
    mod.frequency.value = baseFreq;
    const modGain = globalThis.audioContext.createGain();
    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    const filt = globalThis.audioContext.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = baseFreq * 2;
    carrier.connect(filt);
    filt.connect(mix);
    carrier.start();
    mod.start();
    Object.assign(nodes, { carrier, mod, modGain, filt });
  } else if (engine === 2) {
    const buffer = globalThis.audioContext.createBuffer(1, globalThis.audioContext.sampleRate * 2, globalThis.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = globalThis.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const bp = globalThis.audioContext.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = baseFreq;
    const lp = globalThis.audioContext.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = baseFreq * 2;
    const g = globalThis.audioContext.createGain();
    noise.connect(bp);
    bp.connect(lp);
    lp.connect(g);
    g.connect(mix);
    noise.start();
    Object.assign(nodes, { noise, bp, lp, g });
  } else {
    const osc1 = globalThis.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = baseFreq;
    const delay = globalThis.audioContext.createDelay();
    const fb = globalThis.audioContext.createGain();
    const filt = globalThis.audioContext.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = baseFreq * 2;
    delay.delayTime.value = 0.25;
    fb.gain.value = 0.4;
    const g = globalThis.audioContext.createGain();
    osc1.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(filt);
    filt.connect(g);
    g.connect(mix);
    osc1.start();
    Object.assign(nodes, { osc1, delay, fb, filt, g });
  }
  return nodes;
}

export function getAlienParamVal(key) {
  const el = alienSliders[key];
  if (!el) return 0.5;
  const v = el.dataset.value ? parseFloat(el.dataset.value) : parseFloat(el.value);
  return isNaN(v) ? 0.5 : v / 100;
}

export function updateAlienParams(baseFreq = 220, mod = 0) {
  if (!alienAudioNodes) return;
  if (currentAlienNode && currentAlienNode.audioParams)
    baseFreq = currentAlienNode.audioParams.pitch || baseFreq;
  if (!isFinite(baseFreq) || baseFreq < 20) baseFreq = 220;
  const now = globalThis.audioContext.currentTime;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const flux = clamp(getAlienParamVal('flux') + (alienLfoTargets.has('flux') ? mod : 0));
  const vorr = clamp(getAlienParamVal('vorr') + (alienLfoTargets.has('vorr') ? mod : 0));
  const chime = clamp(getAlienParamVal('chime') + (alienLfoTargets.has('chime') ? mod : 0));
  const dross = clamp(getAlienParamVal('dross') + (alienLfoTargets.has('dross') ? mod : 0));
  const krell = clamp(getAlienParamVal('krell') + (alienLfoTargets.has('krell') ? mod : 0));
  const prax = clamp(getAlienParamVal('prax') + (alienLfoTargets.has('prax') ? mod : 0));
  const zuul = clamp(getAlienParamVal('zuul') + (alienLfoTargets.has('zuul') ? mod : 0));
  const qorx = clamp(getAlienParamVal('qorx') + (alienLfoTargets.has('qorx') ? mod : 0));
  if (alienEngine === 0) {
    alienAudioNodes.osc.frequency.setTargetAtTime(baseFreq * (0.5 + flux * 2), now, 0.05);
    alienAudioNodes.f1.frequency.setTargetAtTime(baseFreq * (1 + vorr * 4), now, 0.05);
    alienAudioNodes.f2.frequency.setTargetAtTime(baseFreq * (2 + chime * 8), now, 0.05);
    alienAudioNodes.f3.frequency.setTargetAtTime(baseFreq * (4 + dross * 16), now, 0.05);
    const q = 5 + krell * 20 + qorx * 10;
    alienAudioNodes.f1.Q.setTargetAtTime(q, now, 0.05);
    alienAudioNodes.f2.Q.setTargetAtTime(q, now, 0.05);
    alienAudioNodes.f3.Q.setTargetAtTime(q, now, 0.05);
    alienAudioNodes.baseGain = 0.4 + prax * 0.6 + zuul * 0.4;
  } else if (alienEngine === 1) {
    alienAudioNodes.carrier.frequency.setTargetAtTime(baseFreq * (0.75 + flux * 2), now, 0.05);
    alienAudioNodes.mod.frequency.setTargetAtTime(baseFreq * (0.2 + vorr * 1.5), now, 0.05);
    alienAudioNodes.modGain.gain.setTargetAtTime(chime * baseFreq, now, 0.05);
    alienAudioNodes.filt.frequency.setTargetAtTime(baseFreq * (2 + dross * 10), now, 0.05);
    alienAudioNodes.filt.Q.setTargetAtTime(5 + krell * 10 + qorx * 5, now, 0.05);
    alienAudioNodes.baseGain = 0.4 + prax * 0.6 + zuul * 0.4;
  } else if (alienEngine === 2) {
    alienAudioNodes.bp.frequency.setTargetAtTime(baseFreq * (1 + flux * 4), now, 0.05);
    alienAudioNodes.bp.Q.setTargetAtTime(1 + vorr * 20 + qorx * 10, now, 0.05);
    alienAudioNodes.lp.frequency.setTargetAtTime(baseFreq * (2 + chime * 10), now, 0.05);
    alienAudioNodes.lp.Q.setTargetAtTime(1 + krell * 10, now, 0.05);
    alienAudioNodes.g.gain.setTargetAtTime(0.1 + dross * 0.9, now, 0.05);
    alienAudioNodes.baseGain = 0.2 + prax * 0.8 + zuul * 0.4;
  } else {
    alienAudioNodes.osc1.frequency.setTargetAtTime(baseFreq * (0.5 + flux * 2), now, 0.05);
    alienAudioNodes.delay.delayTime.setTargetAtTime(0.05 + chime * 0.4, now, 0.05);
    alienAudioNodes.fb.gain.setTargetAtTime(dross, now, 0.05);
    alienAudioNodes.filt.frequency.setTargetAtTime(baseFreq * (1 + vorr * 5), now, 0.05);
    alienAudioNodes.filt.Q.setTargetAtTime(1 + krell * 10 + qorx * 5, now, 0.05);
    alienAudioNodes.g.gain.setTargetAtTime(1.0, now, 0.05);
    alienAudioNodes.baseGain = 0.3 + prax * 0.7 + zuul * 0.4;
  }
}

export function updateAlienNodesParams(
  nodes,
  engine = alienEngine,
  baseFreq = 220,
  mod = 0,
  immediate = false,
) {
  if (!nodes) return;
  if (
    (engine === 0 && !nodes.osc) ||
    (engine === 1 && !nodes.carrier) ||
    (engine === 2 && !nodes.bp) ||
    (engine > 2 && !nodes.osc1)
  ) {
    return;
  }
  if (!isFinite(baseFreq) || baseFreq < 20) baseFreq = 220;
  const now = globalThis.audioContext.currentTime;
  const setParam = (param, value) => {
    if (!param) return;
    if (immediate) param.setValueAtTime(value, now);
    else param.setTargetAtTime(value, now, 0.05);
  };
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const flux = clamp(getAlienParamVal('flux') + (alienLfoTargets.has('flux') ? mod : 0));
  const vorr = clamp(getAlienParamVal('vorr') + (alienLfoTargets.has('vorr') ? mod : 0));
  const chime = clamp(getAlienParamVal('chime') + (alienLfoTargets.has('chime') ? mod : 0));
  const dross = clamp(getAlienParamVal('dross') + (alienLfoTargets.has('dross') ? mod : 0));
  const krell = clamp(getAlienParamVal('krell') + (alienLfoTargets.has('krell') ? mod : 0));
  const prax = clamp(getAlienParamVal('prax') + (alienLfoTargets.has('prax') ? mod : 0));
  const zuul = clamp(getAlienParamVal('zuul') + (alienLfoTargets.has('zuul') ? mod : 0));
  const qorx = clamp(getAlienParamVal('qorx') + (alienLfoTargets.has('qorx') ? mod : 0));
  if (engine === 0) {
    setParam(nodes.osc.frequency, baseFreq * (0.5 + flux * 2));
    setParam(nodes.f1.frequency, baseFreq * (1 + vorr * 4));
    setParam(nodes.f2.frequency, baseFreq * (2 + chime * 8));
    setParam(nodes.f3.frequency, baseFreq * (4 + dross * 16));
    const q = 5 + krell * 20 + qorx * 10;
    setParam(nodes.f1.Q, q);
    setParam(nodes.f2.Q, q);
    setParam(nodes.f3.Q, q);
    nodes.baseGain = 0.4 + prax * 0.6 + zuul * 0.4;
  } else if (engine === 1) {
    setParam(nodes.carrier.frequency, baseFreq * (0.75 + flux * 2));
    setParam(nodes.mod.frequency, baseFreq * (0.2 + vorr * 1.5));
    setParam(nodes.modGain.gain, chime * baseFreq);
    setParam(nodes.filt.frequency, baseFreq * (2 + dross * 10));
    setParam(nodes.filt.Q, 5 + krell * 10 + qorx * 5);
    nodes.baseGain = 0.4 + prax * 0.6 + zuul * 0.4;
  } else if (engine === 2) {
    setParam(nodes.bp.frequency, baseFreq * (1 + flux * 4));
    setParam(nodes.bp.Q, 1 + vorr * 20 + qorx * 10);
    setParam(nodes.lp.frequency, baseFreq * (2 + chime * 10));
    setParam(nodes.lp.Q, 1 + krell * 10);
    setParam(nodes.g.gain, 0.1 + dross * 0.9);
    nodes.baseGain = 0.2 + prax * 0.8 + zuul * 0.4;
  } else {
    setParam(nodes.osc1.frequency, baseFreq * (0.5 + flux * 2));
    setParam(nodes.delay.delayTime, 0.05 + chime * 0.4);
    setParam(nodes.fb.gain, dross);
    setParam(nodes.filt.frequency, baseFreq * (1 + vorr * 5));
    setParam(nodes.filt.Q, 1 + krell * 10 + qorx * 5);
    setParam(nodes.g.gain, 1.0);
    nodes.baseGain = 0.3 + prax * 0.7 + zuul * 0.4;
  }
}

export function startAlienSynth() {
  setupAudio().then(() => {
    const baseFreq = currentAlienNode?.audioParams?.pitch || 220;
    if (!alienAudioNodes || alienAudioNodes.engine !== alienEngine) {
      if (alienAudioNodes) stopAlienSynth();
      alienAudioNodes = createAlienSynth(alienEngine, baseFreq);
      alienAnalyser = alienAudioNodes.analyser;
      updateAlienNodesParams(alienAudioNodes, alienEngine, baseFreq, 0, true);
      updateAlienParams(baseFreq);
    }
  });
}

export function stopAlienSynth() {
  if (alienAudioNodes) {
    Object.values(alienAudioNodes).forEach((n) => {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { if (n.disconnect) n.disconnect(); } catch (e) {}
    });
    alienAudioNodes = null;
    alienAnalyser = null;
  }
  alienVisualRunning = false;
  currentAlienNode = null;
}

export function updateAlienVisual() {
  if (!alienVisualRunning || !alienOrbCtx || !alienAnalyser) return;
  const w = alienOrbCanvas.width;
  const h = alienOrbCanvas.height;
  alienOrbCtx.clearRect(0, 0, w, h);
  alienOrbCtx.fillStyle = `hsla(${(performance.now() / 20) % 360},60%,5%,0.2)`;
  alienOrbCtx.fillRect(0, 0, w, h);
  const nowMs = performance.now();
  const dt = (nowMs - alienLastVisualTime) / 1000;
  alienLastVisualTime = nowMs;
  alienLfoPhase += alienLfoRate * dt;
  const lfoVal = Math.sin(alienLfoPhase * 2 * Math.PI) * alienLfoAmount * 2;
  updateAlienParams(undefined, lfoVal);
  const data = new Uint8Array(alienAnalyser.fftSize);
  alienAnalyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i];
  const level = sum / data.length / 255;
  const t = performance.now() / 400;
  const cx = w / 2,
    cy = h / 2;
  const baseRadius = 15 + getAlienParamVal("prax") * 30 + level * 10;
  const hueBase = [200, 40, 120, 300][alienEngine] || 200;
  const headW = baseRadius * (2 + lfoVal * 0.5);
  const headH = baseRadius * (2.6 + lfoVal * 0.5);
  alienOrbCtx.fillStyle = `hsl(${hueBase + level * 120 + lfoVal * 60},80%,${
    40 + level * 50
  }%)`;
  alienOrbCtx.strokeStyle = `hsl(${hueBase + level * 120},80%,${50 + level * 40}%)`;
  alienOrbCtx.lineWidth = 1.5 + level * 2;
  alienOrbCtx.beginPath();
  alienOrbCtx.ellipse(cx, cy, headW / 2, headH / 2, 0, 0, Math.PI * 2);
  alienOrbCtx.fill();
  alienOrbCtx.stroke();

  const eyeR = headW * 0.15 + level * 2;
  const eyeOffsetX = headW * 0.25;
  const eyeOffsetY = -headH * 0.1;
  alienOrbCtx.fillStyle = '#fff';
  alienOrbCtx.beginPath();
  alienOrbCtx.arc(cx - eyeOffsetX, cy + eyeOffsetY, eyeR, 0, Math.PI * 2);
  alienOrbCtx.arc(cx + eyeOffsetX, cy + eyeOffsetY, eyeR, 0, Math.PI * 2);
  alienOrbCtx.fill();
  alienOrbCtx.fillStyle = '#000';
  alienOrbCtx.beginPath();
  alienOrbCtx.arc(cx - eyeOffsetX, cy + eyeOffsetY, eyeR * 0.5, 0, Math.PI * 2);
  alienOrbCtx.arc(cx + eyeOffsetX, cy + eyeOffsetY, eyeR * 0.5, 0, Math.PI * 2);
  alienOrbCtx.fill();
  if (alienLfoScopeCtx) {
    const sw = alienLfoScopeCanvas.width;
    const sh = alienLfoScopeCanvas.height;
    alienLfoScopeCtx.fillStyle = 'rgba(0,0,0,0.3)';
    alienLfoScopeCtx.fillRect(0,0,sw,sh);
    alienLfoScopeCtx.strokeStyle = '#0f0';
    alienLfoScopeCtx.beginPath();
    for (let x = 0; x < sw; x++) {
      const phase = alienLfoPhase * 2 * Math.PI + (x / sw) * 2 * Math.PI;
      const y = sh/2 - Math.sin(phase) * alienLfoAmount * sh * 0.45;
      if (x === 0) alienLfoScopeCtx.moveTo(x, y);
      else alienLfoScopeCtx.lineTo(x, y);
    }
    alienLfoScopeCtx.stroke();
  }
  if (alienVisualRunning) requestAnimationFrame(updateAlienVisual);
}

export function updateAlienEngineUI() {
  alienEngineOrbs.forEach((orb) => {
    const eng = parseInt(orb.dataset.engine, 10);
    orb.classList.toggle('active', eng === alienEngine);
    const ctx = orb.getContext('2d');
    if (ctx) {
      ctx.clearRect(0,0,20,20);
      ctx.strokeStyle = eng === alienEngine ? '#0f0' : '#ccc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (eng === 0) ctx.arc(10,10,7,0,Math.PI*2);
      else if (eng === 1) { ctx.moveTo(10,3); ctx.lineTo(17,17); ctx.lineTo(3,17); ctx.closePath(); }
      else if (eng === 2) ctx.rect(3,3,14,14);
      else { for(let i=0;i<5;i++){ const a=i*2*Math.PI/5- Math.PI/2; const x=10+Math.cos(a)*7; const y=10+Math.sin(a)*7; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); }
      ctx.stroke();
    }
  });
}

export function updateAlienLfoToggleUI() {
  Object.entries(alienLfoToggles).forEach(([param, el]) => {
    if (el) el.classList.toggle('active', alienLfoTargets.has(param));
  });
}
