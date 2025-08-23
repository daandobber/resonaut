export const ARVO_DRONE_TYPE = 'arvo_drone';
import { arvoPanel, arvoPanelContent } from '../utils/domElements.js';
import { saveState, updateNodeAudioParams, getScreenCoords } from '../main.js';


export const DEFAULT_ARVO_DRONE_PARAMS = {
  pitch: 220,
  scaleIndex: 0,
  harmonicSpread: 1.25,
  motion: 0.5,
  reverbSend: 0.1,
  delaySend: 0.1,
  stereoSpread: 0.5,
  filterCutoff: 1500,
  filterResonance: 2.5,
  oscType: 'string',
  visualStyle: 'arvo_drone_default',
  ignoreGlobalSync: false,
};

function createSitarResonator(ctx, baseFreq) {
  const input = ctx.createGain();
  const output = ctx.createGain();
  input.connect(output);
  const ratios = [1, 1.25, 1.5, 2, 2.5, 3];
  const bands = ratios.map(r => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = baseFreq * r;
    bp.Q.value = 15;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    input.connect(bp);
    bp.connect(g);
    g.connect(output);
    return { bp, ratio: r };
  });
  return { input, output, bands };
}

export function createArvoDroneAudioNodes(node) {
  const p = node.audioParams;
  const ctx = globalThis.audioContext;
  const mainGain = ctx.createGain();
  mainGain.gain.value = 1.0;

  const { input: resIn, output: resOut, bands: resBands } = createSitarResonator(
    ctx,
    p.pitch || 220,
  );

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = p.filterCutoff ?? 1500;
  filter.Q.value = p.filterResonance ?? 2.5;

  mainGain.connect(resIn);
  resOut.connect(filter);

  const combDelay = ctx.createDelay();
  combDelay.delayTime.value = 0.02;
  const combFeedback = ctx.createGain();
  combFeedback.gain.value = 0.6;
  filter.connect(combDelay);
  combDelay.connect(combFeedback);
  combFeedback.connect(combDelay);
  const combMix = ctx.createGain();
  filter.connect(combMix);
  combDelay.connect(combMix);

  const reverbSendGain = ctx.createGain();
  reverbSendGain.gain.value = p.reverbSend ?? 0.1;
  const delaySendGain = ctx.createGain();
  delaySendGain.gain.value = p.delaySend ?? 0.1;
  combMix.connect(reverbSendGain);
  combMix.connect(delaySendGain);

  const partialCount = 16;
  const real = new Float32Array(partialCount);
  const imag = new Float32Array(partialCount);
  for (let i = 1; i < partialCount; i++) {
    const amp = (i % 2 === 1 ? 1 : 0.6) / i;
    real[i] = amp;
  }
  const wave = ctx.createPeriodicWave(real, imag);

  const oscDefs = [
    { baseRatio: 0.5, spreadMul: 0 },
    { baseRatio: 1, spreadMul: 0 },
    { baseRatio: Math.pow(2, 3 / 12), spreadMul: 0 },
    { baseRatio: 1, spreadMul: 1 },
    { baseRatio: 1, spreadMul: 2 },
  ];
  const oscillators = oscDefs.map((def, idx) => {
    const spread = p.harmonicSpread ?? 1.25;
    const ratio = def.baseRatio + def.spreadMul * spread;
    const osc = ctx.createOscillator();
    if (p.oscType && p.oscType !== 'string') {
      osc.type = p.oscType;
    } else {
      osc.setPeriodicWave(wave);
    }
    osc.frequency.value = (p.pitch || 220) * ratio;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = osc.frequency.value;
    bp.Q.value = 10;
    const g = ctx.createGain();
    g.gain.value = 1 - idx * 0.2;
    const panNode = ctx.createStereoPanner();
    const half = (oscDefs.length - 1) / 2;
    const spreadAmt = p.stereoSpread ?? 0.5;
    panNode.pan.value = half ? ((idx - half) / half) * spreadAmt : 0;
    osc.connect(bp);
    bp.connect(g);
    g.connect(panNode);
    panNode.connect(mainGain);
    return {
      osc,
      gain: g,
      bandpass: bp,
      panner: panNode,
      baseRatio: def.baseRatio,
      spreadMul: def.spreadMul,
    };
  });

  const motion = p.motion ?? 0.5;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.02 + motion * 0.23;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.05 + motion * 0.3;
  lfo.connect(lfoGain);
  lfoGain.connect(mainGain.gain);
  const unisonGain = ctx.createGain();
  unisonGain.gain.value = motion * 20;
  lfo.connect(unisonGain);
  oscillators.forEach(o => unisonGain.connect(o.osc.detune));
  combFeedback.gain.value = 0.3 + motion * 0.7;


  if (globalThis.masterGain) {
    combMix.connect(globalThis.masterGain);
  } else {
    combMix.connect(ctx.destination);
  }
  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode)
    reverbSendGain.connect(globalThis.reverbPreDelayNode);
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain)
    delaySendGain.connect(globalThis.masterDelaySendGain);

  const now = ctx.currentTime;
  oscillators.forEach(o => o.osc.start(now));
  lfo.start(now);

  return {
    mainGain,
    filter,
    resonator: { input: resIn, output: resOut, bands: resBands },
    combDelay,
    combFeedback,
    combMix,
    oscillators,
    lfo,
    lfoGain,
    unisonGain,
    reverbSendGain,
    delaySendGain,
    wave,
    nodeRef: node,
  };
}

export function updateArvoDroneParams(audioNodes, pitch) {
  const ctx = globalThis.audioContext;
  const now = ctx.currentTime;
  if (audioNodes.oscillators) {
    const spread = audioNodes.nodeRef?.audioParams?.harmonicSpread ?? 1.25;
    const stereo = audioNodes.nodeRef?.audioParams?.stereoSpread ?? 0.5;
    const waveType = audioNodes.nodeRef?.audioParams?.oscType;
    const half = (audioNodes.oscillators.length - 1) / 2;
    audioNodes.oscillators.forEach((o, idx) => {
      const ratio = o.baseRatio + o.spreadMul * spread;
      o.osc.frequency.setTargetAtTime(pitch * ratio, now, 0.1);
      o.bandpass.frequency.setTargetAtTime(pitch * ratio, now, 0.1);
      if (o.panner)
        o.panner.pan.setTargetAtTime(
          half ? ((idx - half) / half) * stereo : 0,
          now,
          0.1,
        );
      if (waveType && waveType !== 'string') {
        o.osc.type = waveType;
      } else if (audioNodes.wave) {
        o.osc.setPeriodicWave(audioNodes.wave);
      }
    });
  }
  if (audioNodes.resonator && audioNodes.resonator.bands) {
    const ratios = [1, 1.25, 1.5, 2, 2.5, 3];
    audioNodes.resonator.bands.forEach((b, idx) => {
      const r = ratios[idx] || 1;
      b.bp.frequency.setTargetAtTime(pitch * r, now, 0.1);
    });
  }
  if (audioNodes.filter && audioNodes.nodeRef?.audioParams?.filterCutoff) {
    audioNodes.filter.frequency.setTargetAtTime(
      audioNodes.nodeRef.audioParams.filterCutoff,
      now,
      0.1,
    );
  }
  if (audioNodes.filter && audioNodes.nodeRef?.audioParams?.filterResonance !== undefined) {
    audioNodes.filter.Q.setTargetAtTime(
      audioNodes.nodeRef.audioParams.filterResonance,
      now,
      0.1,
    );
  }
  if (audioNodes.reverbSendGain && audioNodes.nodeRef?.audioParams?.reverbSend !== undefined) {
    audioNodes.reverbSendGain.gain.setTargetAtTime(
      audioNodes.nodeRef.audioParams.reverbSend,
      now,
      0.1,
    );
  }
  if (audioNodes.delaySendGain && audioNodes.nodeRef?.audioParams?.delaySend !== undefined) {
    audioNodes.delaySendGain.gain.setTargetAtTime(
      audioNodes.nodeRef.audioParams.delaySend,
      now,
      0.1,
    );
  }
  const motion = audioNodes.nodeRef?.audioParams?.motion ?? 0.5;
  if (audioNodes.lfo)
    audioNodes.lfo.frequency.setTargetAtTime(0.02 + motion * 0.23, now, 0.1);
  if (audioNodes.lfoGain)
    audioNodes.lfoGain.gain.setTargetAtTime(0.05 + motion * 0.3, now, 0.1);
  if (audioNodes.unisonGain)
    audioNodes.unisonGain.gain.setTargetAtTime(motion * 20, now, 0.1);
  if (audioNodes.combFeedback)
    audioNodes.combFeedback.gain.setTargetAtTime(0.3 + motion * 0.7, now, 0.1);
}

export function stopArvoDroneAudioNodes(audioNodes) {
  if (!audioNodes) return;
  if (audioNodes.oscillators) {
    audioNodes.oscillators.forEach(o => {
      try { o.osc.stop(); } catch {}
      try { o.osc.disconnect(); } catch {}
      try { o.gain.disconnect(); } catch {}
      try { o.panner?.disconnect(); } catch {}
    });
  }
  try { audioNodes.lfo?.stop(); } catch {}
  audioNodes.lfo?.disconnect();
  audioNodes.lfoGain?.disconnect();
  audioNodes.unisonGain?.disconnect();
  audioNodes.filter?.disconnect();
  audioNodes.resonator?.input?.disconnect();
  audioNodes.resonator?.output?.disconnect();
  audioNodes.combDelay?.disconnect();
  audioNodes.combFeedback?.disconnect();
  audioNodes.combMix?.disconnect();
  audioNodes.reverbSendGain?.disconnect();
  audioNodes.delaySendGain?.disconnect();
  audioNodes.mainGain?.disconnect();
}


export function positionArvoPanel(node) {
  if (!arvoPanel) return;
  const coords = getScreenCoords(node.x, node.y);
  const offsetX = 80;
  arvoPanel.style.position = 'fixed';
  arvoPanel.style.left = `${coords.x + offsetX}px`;
  arvoPanel.style.top = `${coords.y}px`;
  arvoPanel.style.right = 'auto';
  arvoPanel.style.transform = 'translate(0, -50%)';
}

export function showArvoPanel(node) {
  if (!arvoPanel) return;
  arvoPanel.classList.remove('hidden');
  arvoPanel.dataset.nodeId = node.id;
  positionArvoPanel(node);
}

export function hideArvoPanel() {
  if (arvoPanel) arvoPanel.classList.add('hidden');
}

export function hideArvoDroneOrbMenu() {
  const existing = document.getElementById('arvo-drone-container');
  if (existing) existing.remove();
  if (arvoPanelContent) arvoPanelContent.innerHTML = '';
}

export function showArvoDroneOrbMenu(node) {
  hideArvoDroneOrbMenu();
  if (!node || node.type !== ARVO_DRONE_TYPE) return;
  showArvoPanel(node);
  if (!arvoPanelContent) return;
  const container = document.createElement('div');
  container.id = 'arvo-drone-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  arvoPanelContent.innerHTML = '';
  arvoPanelContent.appendChild(container);

  const waveItem = document.createElement('div');
  waveItem.className = 'mixer-control-item';
  const waveLabel = document.createElement('label');
  waveLabel.htmlFor = 'arvo-oscType';
  waveLabel.textContent = 'Wave';
  const waveSelect = document.createElement('select');
  waveSelect.id = 'arvo-oscType';
  ['string','sine','square','triangle','sawtooth'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if ((node.audioParams.oscType || 'string') === t) opt.selected = true;
    waveSelect.appendChild(opt);
  });
  waveSelect.addEventListener('change', () => {
    node.audioParams.oscType = waveSelect.value;
    updateNodeAudioParams(node);
    saveState();
  });
  waveItem.appendChild(waveLabel);
  waveItem.appendChild(waveSelect);
  container.appendChild(waveItem);

  const paramDefs = [
    { id: 'harmonicSpread', min: 0.5, max: 3, step: 0.1, label: 'Spread' },
    { id: 'stereoSpread', min: 0, max: 1, step: 0.05, label: 'Stereo' },
    { id: 'motion', min: 0, max: 1, step: 0.01, label: 'Motion' },
    { id: 'filterCutoff', min: 200, max: 5000, step: 1, label: 'Filter' },
    { id: 'filterResonance', min: 0.5, max: 20, step: 0.1, label: 'Reso' },
  ];

  paramDefs.forEach(info => {
    const item = document.createElement('div');
    item.className = 'mixer-control-item';
    const label = document.createElement('label');
    label.htmlFor = `arvo-${info.id}`;
    label.textContent = info.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.id = `arvo-${info.id}`;
    input.min = info.min;
    input.max = info.max;
    input.step = info.step;
    input.value = node.audioParams[info.id] ?? info.min;
    const span = document.createElement('span');
    span.textContent = parseFloat(input.value).toFixed(2);
    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      span.textContent = val.toFixed(2);
      node.audioParams[info.id] = val;
      updateNodeAudioParams(node);
      saveState();
    });
    item.appendChild(label);
    item.appendChild(input);
    item.appendChild(span);
    container.appendChild(item);
  });
  positionArvoPanel(node);
}

