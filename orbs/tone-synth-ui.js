import { tonePanel, tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams, getScreenCoords } from '../main.js';

export const prorbMenuConfig = {
  AMP: [
    { id: 'ampEnvAttack', label: 'Attack', min: 0.005, max: 2.0, step: 0.001, format: v => v.toFixed(2) },
    { id: 'ampEnvDecay', label: 'Decay', min: 0.01, max: 2.0, step: 0.01, format: v => v.toFixed(2) },
    { id: 'ampEnvSustain', label: 'Sustain', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'ampEnvRelease', label: 'Release', min: 0.01, max: 4.0, step: 0.01, format: v => v.toFixed(2) },
  ],
  FILTER: [
    { id: 'filterCutoff', label: 'Cutoff', min: 20, max: 20000, step: 1, format: v => `${v.toFixed(0)}` },
    { id: 'filterResonance', label: 'Reso', min: 0, max: 30, step: 0.1, format: v => v.toFixed(1) },
    { id: 'filterEnvAmount', label: 'Env Amt', min: 0, max: 8000, step: 10, format: v => `${v.toFixed(0)}` },
    { id: 'filterEnvAttack', label: 'Env Atk', min: 0.01, max: 2.0, step: 0.01, format: v => v.toFixed(2) },
    { id: 'filterEnvDecay', label: 'Env Dec', min: 0.01, max: 2.0, step: 0.01, format: v => v.toFixed(2) },
    { id: 'filterEnvSustain', label: 'Env Sus', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'filterEnvRelease', label: 'Env Rel', min: 0.01, max: 4.0, step: 0.01, format: v => v.toFixed(2) },
  ],
  OSC: [
    { id: 'osc1Level', label: 'Gain 1', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'osc2Level', label: 'Gain 2', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'osc1Octave', label: 'Oct 1', min: -2, max: 2, step: 1, format: v => (v>0?'+':'')+v },
    { id: 'osc2Octave', label: 'Oct 2', min: -2, max: 2, step: 1, format: v => (v>0?'+':'')+v },
    { id: 'osc2Detune', label: 'Detune 2', min: -100, max: 100, step: 1, format: v => v.toFixed(0) },
  ],
  MOD: [
    { id: 'lfoRate', label: 'LFO Rate', min: 0, max: 20, step: 0.1, format: v => v.toFixed(1) },
    { id: 'lfoAmount', label: 'LFO Amt', min: 0, max: 5000, step: 10, format: v => v.toFixed(0) },
    { id: 'lfo2Rate', label: 'LFO2 Rate', min: 0, max: 20, step: 0.1, format: v => v.toFixed(1) },
    { id: 'lfo2Amount', label: 'LFO2 Amt', min: 0, max: 5000, step: 10, format: v => v.toFixed(0) },
  ],
};

export function drawAmpEnv(ctx, params, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 1;
  const total = params.ampEnvAttack + params.ampEnvDecay + params.ampEnvRelease + 0.2;
  const unit = width / total;
  const startY = height;
  ctx.moveTo(0, startY);
  let x = params.ampEnvAttack * unit;
  ctx.lineTo(x, 0);
  const sustainY = height * (1 - params.ampEnvSustain);
  let x2 = x + params.ampEnvDecay * unit;
  ctx.lineTo(x2, sustainY);
  let x3 = x2 + 0.2 * unit;
  ctx.lineTo(x3, sustainY);
  let x4 = x3 + params.ampEnvRelease * unit;
  ctx.lineTo(x4, height);
  ctx.stroke();
}

let currentToneSection = 'OSC';
let currentToneNode = null;

export function hideTonePanel() {
  if (tonePanel) tonePanel.classList.add('hidden');
}

export function positionTonePanel(node) {
  if (!tonePanel) return;
  const coords = getScreenCoords(node.x, node.y);
  const offsetX = 80;
  tonePanel.style.position = 'fixed';
  tonePanel.style.left = `${coords.x + offsetX}px`;
  tonePanel.style.top = `${coords.y}px`;
  tonePanel.style.right = 'auto';
  tonePanel.style.transform = 'translate(0, -50%)';
}

export function showTonePanel(node) {
  if (!tonePanel) return;
  tonePanel.classList.remove('hidden');
  tonePanel.dataset.nodeId = node.id;
  positionTonePanel(node);
}

export function hideToneSynthMenu() {
  const existing = document.getElementById('tone-synth-container');
  if (existing) existing.remove();
  if (tonePanelContent) tonePanelContent.innerHTML = '';
  currentToneNode = null;
}

function createSlider(id, labelText, min, max, step, value, onInput, format = v => v.toFixed(step.toString().includes('.') ? step.toString().split('.')[1].length : 0)) {
  const wrap = document.createElement('div');
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = `${labelText} (${format(value)}):`;
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    label.textContent = `${labelText} (${format(val)}):`;
    if (onInput) onInput(val);
  });
  wrap.appendChild(label);
  wrap.appendChild(input);
  return wrap;
}

export function showToneSynthMenu(node, section = 'OSC') {
  hideToneSynthMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'tone') return;
  currentToneSection = section;
  currentToneNode = node;
  showTonePanel(node);
  if (!tonePanelContent) return;

  const container = document.createElement('div');
  container.id = 'tone-synth-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  const tabRow = document.createElement('div');
  tabRow.className = 'op1-tab-row';
  ['OSC', 'FILTER', 'AMP'].forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    if (cat === section) btn.classList.add('active');
    btn.addEventListener('click', () => showToneSynthMenu(node, cat));
    tabRow.appendChild(btn);
  });
  container.appendChild(tabRow);

  let envCanvas = null;
  if (section === 'AMP') {
    envCanvas = document.createElement('canvas');
    envCanvas.className = 'amp-env-display';
    envCanvas.width = 240;
    envCanvas.height = 80;
    container.appendChild(envCanvas);
    drawAmpEnv(envCanvas.getContext('2d'), node.audioParams, envCanvas.width, envCanvas.height);
  }

  if (section === 'FILTER') {
    const wrap = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = 'Type';
    const select = document.createElement('select');
    ['lowpass','highpass','bandpass','notch'].forEach(ft => {
      const opt = document.createElement('option');
      opt.value = ft;
      opt.textContent = ft;
      if (node.audioParams.filterType === ft) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', e => {
      node.audioParams.filterType = e.target.value;
      updateNodeAudioParams(node);
    });
    wrap.appendChild(label);
    wrap.appendChild(select);
    container.appendChild(wrap);
  }

  if (section === 'OSC') {
    const oscRow = document.createElement('div');
    oscRow.className = 'osc-select-row';
    ['osc1Waveform','osc2Waveform'].forEach((param, idx) => {
      const wrap = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = idx === 0 ? 'Osc 1' : 'Osc 2';
      const select = document.createElement('select');
      ['sine','square','triangle','sawtooth'].forEach(wf => {
        const opt = document.createElement('option');
        opt.value = wf;
        opt.textContent = wf;
        if (node.audioParams[param] === wf) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', e => {
        node.audioParams[param] = e.target.value;
        updateNodeAudioParams(node);
      });
      wrap.appendChild(label);
      wrap.appendChild(select);
      oscRow.appendChild(wrap);
    });
    container.appendChild(oscRow);
    const noiseSlider = createSlider(
      `tone-noiseLevel-${node.id}`,
      'Noise',
      0,
      1,
      0.01,
      node.audioParams.noiseLevel ?? 0,
      (v) => {
        node.audioParams.noiseLevel = v;
        updateNodeAudioParams(node);
      },
      (v) => v.toFixed(2),
    );
    container.appendChild(noiseSlider);
  }


  let controls = prorbMenuConfig[section] || [];
  if (section === 'FILTER') {
    controls = controls.filter(c => c.id === 'filterCutoff' || c.id === 'filterResonance');
  }
  controls.forEach(info => {
    const slider = createSlider(
      `tone-${info.id}-${node.id}`,
      info.label,
      info.min,
      info.max,
      info.step,
      node.audioParams[info.id],
      val => {
        node.audioParams[info.id] = val;
        updateNodeAudioParams(node);
        if (envCanvas) {
          drawAmpEnv(envCanvas.getContext('2d'), node.audioParams, envCanvas.width, envCanvas.height);
        }
      },
      info.format
    );
    container.appendChild(slider);
  });

  positionTonePanel(node);
}
