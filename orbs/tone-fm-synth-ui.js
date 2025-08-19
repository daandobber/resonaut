import { tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, positionTonePanel, hideToneSynthMenu } from './tone-synth-ui.js';

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

export function showToneFmSynthMenu(node) {
  hideToneSynthMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'tonefm') return;

  showTonePanel(node);
  if (!tonePanelContent) return;

  const container = document.createElement('div');
  container.id = 'tone-synth-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  const oscRow = document.createElement('div');
  oscRow.className = 'osc-select-row';
  ['carrierWaveform', 'modulatorWaveform'].forEach((param, idx) => {
    const wrap = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = idx === 0 ? 'Car' : 'Mod';
    const select = document.createElement('select');
    ['sine', 'square', 'triangle', 'sawtooth'].forEach(wf => {
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

  const carrierRatioSlider = createSlider(
    `fm-carrierRatio-${node.id}`,
    'Carrier Ratio',
    0.1,
    10,
    0.1,
    node.audioParams.carrierRatio ?? 1,
    v => { node.audioParams.carrierRatio = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  container.appendChild(carrierRatioSlider);

  const modRatioSlider = createSlider(
    `fm-modulatorRatio-${node.id}`,
    'Mod Ratio',
    0.1,
    10,
    0.1,
    node.audioParams.modulatorRatio ?? 1,
    v => { node.audioParams.modulatorRatio = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  container.appendChild(modRatioSlider);

  const depthSlider = createSlider(
    `fm-modDepth-${node.id}`,
    'Mod Depth',
    0,
    10,
    0.1,
    node.audioParams.modulatorDepthScale ?? 2,
    v => { node.audioParams.modulatorDepthScale = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  container.appendChild(depthSlider);

  const carrierEnvHeader = document.createElement('h4');
  carrierEnvHeader.textContent = 'Carrier Env';
  container.appendChild(carrierEnvHeader);
  const carrierEnvControls = [
    { key: 'carrierEnvAttack', label: 'Attack', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvDecay', label: 'Decay', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvSustain', label: 'Sustain', min: 0, max: 1, step: 0.01 },
    { key: 'carrierEnvRelease', label: 'Release', min: 0, max: 4, step: 0.01 },
  ];
  carrierEnvControls.forEach(c => {
    const slider = createSlider(
      `fm-${c.key}-${node.id}`,
      c.label,
      c.min,
      c.max,
      c.step,
      node.audioParams[c.key] ?? 0,
      v => { node.audioParams[c.key] = v; updateNodeAudioParams(node); },
      v => v.toFixed(c.step < 1 ? 2 : 0)
    );
    container.appendChild(slider);
  });

  const modEnvHeader = document.createElement('h4');
  modEnvHeader.textContent = 'Mod Env';
  container.appendChild(modEnvHeader);
  const modEnvControls = [
    { key: 'modulatorEnvAttack', label: 'Attack', min: 0, max: 4, step: 0.01 },
    { key: 'modulatorEnvDecay', label: 'Decay', min: 0, max: 4, step: 0.01 },
    { key: 'modulatorEnvSustain', label: 'Sustain', min: 0, max: 1, step: 0.01 },
    { key: 'modulatorEnvRelease', label: 'Release', min: 0, max: 4, step: 0.01 },
  ];
  modEnvControls.forEach(c => {
    const slider = createSlider(
      `fm-${c.key}-${node.id}`,
      c.label,
      c.min,
      c.max,
      c.step,
      node.audioParams[c.key] ?? 0,
      v => { node.audioParams[c.key] = v; updateNodeAudioParams(node); },
      v => v.toFixed(c.step < 1 ? 2 : 0)
    );
    container.appendChild(slider);
  });

  positionTonePanel(node);
}

