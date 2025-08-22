import { tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, positionTonePanel, hideToneSynthMenu } from './tone-synth-ui.js';
import { fmAlgorithms } from './fm-synth-orb.js';

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
  const ratioSliderInput = ratioSlider.querySelector('input');

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
  const depthSliderInput = depthSlider.querySelector('input');

  const algRow = document.createElement('div');
  algRow.style.display = 'flex';
  algRow.style.marginTop = '6px';
  fmAlgorithms.forEach((alg, idx) => {
    const btn = document.createElement('button');
    btn.textContent = alg.label || `Alg ${idx + 1}`;
    btn.className = 'waveform-button';
    btn.style.marginRight = '4px';
    if (node.audioParams.algorithm === idx) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      node.audioParams.algorithm = idx;
      node.audioParams.modulatorRatio = alg.modulatorRatio;
      node.audioParams.modulatorDepthScale = alg.modulatorDepthScale;
      ratioSliderInput.value = alg.modulatorRatio;
      ratioSliderInput.dispatchEvent(new Event('input'));
      depthSliderInput.value = alg.modulatorDepthScale;
      depthSliderInput.dispatchEvent(new Event('input'));
      Array.from(algRow.children).forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
    });
    algRow.appendChild(btn);
  });
  container.appendChild(algRow);

  const carEnvLabel = document.createElement('div');
  carEnvLabel.textContent = 'Car Env';
  carEnvLabel.style.marginTop = '6px';
  container.appendChild(carEnvLabel);

  const carrierEnvRow = document.createElement('div');
  carrierEnvRow.style.display = 'flex';
  const carrierEnvControls = [
    { key: 'carrierEnvAttack', label: 'Atk', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvDecay', label: 'Dec', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvRelease', label: 'Rel', min: 0, max: 4, step: 0.01 },
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
    slider.style.flex = '1';
    slider.style.marginRight = '4px';
    carrierEnvRow.appendChild(slider);
  });
  container.appendChild(carrierEnvRow);

  const modEnvLabel = document.createElement('div');
  modEnvLabel.textContent = 'Mod Env';
  modEnvLabel.style.marginTop = '6px';
  container.appendChild(modEnvLabel);

  const modEnvRow = document.createElement('div');
  modEnvRow.style.display = 'flex';
  const modEnvControls = [
    { key: 'modulatorEnvAttack', label: 'Atk', min: 0, max: 4, step: 0.01, fallback: 'carrierEnvAttack' },
    { key: 'modulatorEnvDecay', label: 'Dec', min: 0, max: 4, step: 0.01, fallback: 'carrierEnvDecay' },
    { key: 'modulatorEnvRelease', label: 'Rel', min: 0, max: 4, step: 0.01, fallback: 'carrierEnvRelease' },
  ];
  modEnvControls.forEach(c => {
    const val = node.audioParams[c.key] ?? node.audioParams[c.fallback] ?? 0;
    const slider = createSlider(
      `fm-${c.key}-${node.id}`,
      c.label,
      c.min,
      c.max,
      c.step,
      val,
      v => { node.audioParams[c.key] = v; updateNodeAudioParams(node); },
      v => v.toFixed(c.step < 1 ? 2 : 0)
    );
    slider.style.flex = '1';
    slider.style.marginRight = '4px';
    modEnvRow.appendChild(slider);
  });
  container.appendChild(modEnvRow);

  const filterTypeWrap = document.createElement('div');
  const filterTypeLabel = document.createElement('label');
  filterTypeLabel.textContent = 'Filt';
  const filterTypeSelect = document.createElement('select');
  ['lowpass', 'highpass', 'bandpass'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if (node.audioParams.filterType === t) opt.selected = true;
    filterTypeSelect.appendChild(opt);
  });
  filterTypeSelect.addEventListener('change', e => {
    node.audioParams.filterType = e.target.value;
    updateNodeAudioParams(node);
  });
  filterTypeWrap.appendChild(filterTypeLabel);
  filterTypeWrap.appendChild(filterTypeSelect);
  filterTypeWrap.style.marginTop = '6px';
  container.appendChild(filterTypeWrap);

  const cutoffSlider = createSlider(
    `fm-filterCutoff-${node.id}`,
    'Cutoff',
    100,
    20000,
    100,
    node.audioParams.filterCutoff ?? 20000,
    v => { node.audioParams.filterCutoff = v; updateNodeAudioParams(node); },
    v => Math.round(v)
  );
  container.appendChild(cutoffSlider);

  const resSlider = createSlider(
    `fm-filterResonance-${node.id}`,
    'Res',
    0.1,
    20,
    0.1,
    node.audioParams.filterResonance ?? 1,
    v => { node.audioParams.filterResonance = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  container.appendChild(resSlider);

  const detuneSlider = createSlider(
    `fm-detune-${node.id}`,
    'Detune',
    -1200,
    1200,
    1,
    node.audioParams.detune ?? 0,
    v => { node.audioParams.detune = v; updateNodeAudioParams(node); },
    v => v.toFixed(0)
  );
  container.appendChild(detuneSlider);

  positionTonePanel(node);
}

