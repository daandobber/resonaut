import { tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, positionTonePanel, hideToneSynthMenu } from './tone-synth-ui.js';
import { fmAlgorithms } from './fm-synth-orb.js';

let NexusPromise = typeof window !== 'undefined' ? import('nexusui') : null;

const fmDials = new Set();
function applyDialTheme(dial) {
  const styles = getComputedStyle(document.body);
  const accent = styles.getPropertyValue('--button-active').trim() || '#8860b0';
  const fill = styles.getPropertyValue('--button-bg').trim() || '#503070';
  if (dial.colorize) {
    dial.colorize('accent', accent);
    dial.colorize('fill', fill);
  }
}

let themeObserverInitialized = false;
function initThemeObserver() {
  if (themeObserverInitialized || typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(() => {
    fmDials.forEach(applyDialTheme);
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  themeObserverInitialized = true;
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

async function createDial(id, labelText, min, max, step, value, onChange, format = v => v.toFixed(step.toString().includes('.') ? step.toString().split('.')[1].length : 0)) {
  if (!NexusPromise) {
    return createSlider(id, labelText, min, max, step, value, onChange, format);
  }

  const { default: Nexus } = await NexusPromise;

  const wrap = document.createElement('div');
  wrap.style.display = 'grid';
  wrap.style.gridTemplateRows = 'auto auto auto';
  wrap.style.justifyItems = 'center';
  wrap.style.gap = '2px';
  wrap.style.width = '48px';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.style.fontSize = '10px';
  wrap.appendChild(label);

  const target = document.createElement('div');
  target.id = id;
  wrap.appendChild(target);

  const numberTarget = document.createElement('div');
  wrap.appendChild(numberTarget);

  const dial = new Nexus.Dial(target, {
    size: [30, 30],
    interaction: 'radial',
    mode: 'relative',
    min,
    max,
    step,
    value,
  });
  applyDialTheme(dial);
  fmDials.add(dial);
  initThemeObserver();

  const num = new Nexus.Number(numberTarget, {
    size: [40, 20],
    min,
    max,
    step,
    value: parseFloat(format(value)),
  });

  dial.on('change', v => {
    num.value = parseFloat(format(v));
    if (onChange) onChange(v);
  });
  num.on('change', v => {
    dial.value = v;
    if (onChange) onChange(v);
  });

  wrap.dial = dial;
  return wrap;
}

export async function showToneFmSynthMenu(node) {
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

  const operatorsRow = document.createElement('div');
  operatorsRow.style.display = 'grid';
  operatorsRow.style.gridTemplateColumns = 'repeat(2, auto)';
  operatorsRow.style.marginBottom = '4px';
  operatorsRow.style.gap = '8px';

  // Carrier operator
  const carSection = document.createElement('div');
  carSection.style.display = 'flex';
  carSection.style.flexDirection = 'column';
  const carLabel = document.createElement('div');
  carLabel.textContent = 'Car';
  carLabel.style.fontWeight = 'bold';
  carLabel.style.marginBottom = '2px';
  carSection.appendChild(carLabel);

  const carControls = document.createElement('div');
  carControls.style.display = 'grid';
  carControls.style.gridTemplateColumns = 'repeat(auto-fill, 48px)';
  carControls.style.gap = '4px';
  carSection.appendChild(carControls);

  const carWaveWrap = document.createElement('div');
  const carWaveLabel = document.createElement('label');
  carWaveLabel.textContent = 'Wave';
  const carWaveSelect = document.createElement('select');
  ['sine', 'square', 'triangle', 'sawtooth'].forEach(wf => {
    const opt = document.createElement('option');
    opt.value = wf;
    opt.textContent = wf;
    if (node.audioParams.carrierWaveform === wf) opt.selected = true;
    carWaveSelect.appendChild(opt);
  });
  carWaveSelect.addEventListener('change', e => {
    node.audioParams.carrierWaveform = e.target.value;
    updateNodeAudioParams(node);
  });
  carWaveWrap.appendChild(carWaveLabel);
  carWaveWrap.appendChild(carWaveSelect);
  carControls.appendChild(carWaveWrap);

  const carrierEnvControls = [
    { key: 'carrierEnvAttack', label: 'Atk', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvDecay', label: 'Dec', min: 0, max: 4, step: 0.01 },
    { key: 'carrierEnvRelease', label: 'Rel', min: 0, max: 4, step: 0.01 },
  ];
  for (const c of carrierEnvControls) {
    const dialWrap = await createDial(
      `fm-${c.key}-${node.id}`,
      c.label,
      c.min,
      c.max,
      c.step,
      node.audioParams[c.key] ?? 0,
      v => { node.audioParams[c.key] = v; updateNodeAudioParams(node); },
      v => v.toFixed(c.step < 1 ? 2 : 0)
    );
    carControls.appendChild(dialWrap);
  }

  operatorsRow.appendChild(carSection);

  // Modulator operator
  const modSection = document.createElement('div');
  modSection.style.display = 'flex';
  modSection.style.flexDirection = 'column';
  const modLabel = document.createElement('div');
  modLabel.textContent = 'Mod';
  modLabel.style.fontWeight = 'bold';
  modLabel.style.marginBottom = '2px';
  modSection.appendChild(modLabel);

  const modControls = document.createElement('div');
  modControls.style.display = 'grid';
  modControls.style.gridTemplateColumns = 'repeat(auto-fill, 48px)';
  modControls.style.gap = '4px';
  modSection.appendChild(modControls);

  const modWaveWrap = document.createElement('div');
  const modWaveLabel = document.createElement('label');
  modWaveLabel.textContent = 'Wave';
  const modWaveSelect = document.createElement('select');
  ['sine', 'square', 'triangle', 'sawtooth'].forEach(wf => {
    const opt = document.createElement('option');
    opt.value = wf;
    opt.textContent = wf;
    if (node.audioParams.modulatorWaveform === wf) opt.selected = true;
    modWaveSelect.appendChild(opt);
  });
  modWaveSelect.addEventListener('change', e => {
    node.audioParams.modulatorWaveform = e.target.value;
    updateNodeAudioParams(node);
  });
  modWaveWrap.appendChild(modWaveLabel);
  modWaveWrap.appendChild(modWaveSelect);
  modControls.appendChild(modWaveWrap);

  const ratioDial = await createDial(
    `fm-modulatorRatio-${node.id}`,
    'Ratio',
    0.1,
    10,
    0.1,
    node.audioParams.modulatorRatio ?? 1,
    v => { node.audioParams.modulatorRatio = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  modControls.appendChild(ratioDial);
  const ratioDialInstance = ratioDial.dial;

  const depthDial = await createDial(
    `fm-modDepth-${node.id}`,
    'Depth',
    0,
    10,
    0.1,
    node.audioParams.modulatorDepthScale ?? 1,
    v => { node.audioParams.modulatorDepthScale = v; updateNodeAudioParams(node); },
    v => (v * 10).toFixed(1)
  );
  modControls.appendChild(depthDial);
  const depthDialInstance = depthDial.dial;

  const modEnvControls = [
    { key: 'modulatorEnvAttack', label: 'Atk', min: 0, max: 4, step: 0.01, fallback: 'carrierEnvAttack' },
    { key: 'modulatorEnvDecay', label: 'Dec', min: 0, max: 4, step: 0.01, fallback: 'carrierEnvDecay' },
    { key: 'modulatorEnvRelease', label: 'Rel', min: 0, max: 4, step: 0.01, fallback: 'carrierEnvRelease' },
  ];
  for (const c of modEnvControls) {
    const val = node.audioParams[c.key] ?? node.audioParams[c.fallback] ?? 0;
    const dialWrap = await createDial(
      `fm-${c.key}-${node.id}`,
      c.label,
      c.min,
      c.max,
      c.step,
      val,
      v => { node.audioParams[c.key] = v; updateNodeAudioParams(node); },
      v => v.toFixed(c.step < 1 ? 2 : 0)
    );
    modControls.appendChild(dialWrap);
  }

  operatorsRow.appendChild(modSection);
  container.appendChild(operatorsRow);

  const algRow = document.createElement('div');
  algRow.style.display = 'flex';
  algRow.style.marginBottom = '6px';
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
      if (ratioDialInstance) {
        ratioDialInstance.value = alg.modulatorRatio;
        ratioDialInstance.emit('change', ratioDialInstance.value);
      }
      if (depthDialInstance) {
        depthDialInstance.value = alg.modulatorDepthScale;
        depthDialInstance.emit('change', depthDialInstance.value);
      }
      Array.from(algRow.children).forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
    });
    algRow.appendChild(btn);
  });
  container.appendChild(algRow);

  const filterRow = document.createElement('div');
  filterRow.style.display = 'grid';
  filterRow.style.gridTemplateColumns = 'repeat(auto-fill, 48px)';
  filterRow.style.marginTop = '4px';
  filterRow.style.gap = '4px';

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
  filterRow.appendChild(filterTypeWrap);

  const cutoffDial = await createDial(
    `fm-filterCutoff-${node.id}`,
    'Cutoff',
    100,
    20000,
    100,
    node.audioParams.filterCutoff ?? 20000,
    v => { node.audioParams.filterCutoff = v; updateNodeAudioParams(node); },
    v => Math.round(v)
  );
  filterRow.appendChild(cutoffDial);

  const resDial = await createDial(
    `fm-filterResonance-${node.id}`,
    'Res',
    0.1,
    20,
    0.1,
    node.audioParams.filterResonance ?? 1,
    v => { node.audioParams.filterResonance = v; updateNodeAudioParams(node); },
    v => v.toFixed(1)
  );
  filterRow.appendChild(resDial);

  const detuneDial = await createDial(
    `fm-detune-${node.id}`,
    'Detune',
    -1200,
    1200,
    1,
    node.audioParams.detune ?? 0,
    v => { node.audioParams.detune = v; updateNodeAudioParams(node); },
    v => v.toFixed(0)
  );
  filterRow.appendChild(detuneDial);

  container.appendChild(filterRow);

  positionTonePanel(node);
}

