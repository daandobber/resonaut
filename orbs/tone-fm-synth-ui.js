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
  oscRow.style.display = 'flex';
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
    wrap.style.marginRight = '6px';
    oscRow.appendChild(wrap);
  });
  container.appendChild(oscRow);

  const ratioSlider = createSlider(
    `fm-modulatorRatio-${node.id}`,
    'Ratio',
    0.1,
    10,
    0.1,
    node.audioParams.modulatorRatio ?? 1,
    v => { node.audioParams.modulatorRatio = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  container.appendChild(ratioSlider);

  const depthSlider = createSlider(
    `fm-modDepth-${node.id}`,
    'Depth',
    0,
    10,
    0.1,
    node.audioParams.modulatorDepthScale ?? 1,
    v => { node.audioParams.modulatorDepthScale = v; updateNodeAudioParams(node); },
    v => (v * 10).toFixed(1)
  );
  container.appendChild(depthSlider);

  const envRow = document.createElement('div');
  envRow.style.display = 'flex';
  const envControls = [
    { key: 'carrierEnvAttack', label: 'Atk', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvDecay', label: 'Dec', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvRelease', label: 'Rel', min: 0, max: 4, step: 0.01 },
  ];
  envControls.forEach(c => {
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
    slider.style.flex = '1';
    slider.style.marginRight = '4px';
    envRow.appendChild(slider);
  });
  container.appendChild(envRow);

  positionTonePanel(node);
}

