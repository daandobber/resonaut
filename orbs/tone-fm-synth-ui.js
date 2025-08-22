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

function createSlider(id) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = 0;
  input.max = 1;
  input.step = 0.01;
  input.value = 0;
  wrap.appendChild(input);
  const label = document.createElement('div');
  label.style.fontSize = '10px';
  wrap.appendChild(label);
  wrap.dial = input;
  wrap.label = label;
  return wrap;
}

async function createDial(id) {
  if (!NexusPromise) {
    return createSlider(id);
  }

  const { default: Nexus } = await NexusPromise;

  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  wrap.style.width = '60px';

  const target = document.createElement('div');
  target.id = id;
  wrap.appendChild(target);

  const dial = new Nexus.Dial(target, {
    size: [50, 50],
    interaction: 'radial',
    mode: 'absolute',
    min: 0,
    max: 1,
    step: 0.01,
    value: 0,
  });
  applyDialTheme(dial);
  fmDials.add(dial);
  initThemeObserver();

  const label = document.createElement('div');
  label.style.fontSize = '10px';
  wrap.appendChild(label);

  wrap.dial = dial;
  wrap.label = label;
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

  const dialWrap = await createDial(`fm-main-${node.id}`);
  container.appendChild(dialWrap);
  const dial = dialWrap.dial;
  const label = dialWrap.label;

  const paramsGrid = document.createElement('div');
  paramsGrid.style.display = 'grid';
  paramsGrid.style.gridTemplateColumns = 'repeat(auto-fill, 48px)';
  paramsGrid.style.gap = '4px';
  paramsGrid.style.marginTop = '4px';
  container.appendChild(paramsGrid);

  const params = [
    { key: 'carrierEnvAttack', label: 'CarAtk', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { key: 'carrierEnvDecay', label: 'CarDec', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { key: 'carrierEnvRelease', label: 'CarRel', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { key: 'modulatorRatio', label: 'Ratio', min: 0.1, max: 10, step: 0.1, format: v => v.toFixed(1) },
    { key: 'modulatorDepthScale', label: 'Depth', min: 0, max: 10, step: 0.1, format: v => (v * 10).toFixed(1) },
    { key: 'modulatorEnvAttack', label: 'ModAtk', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2), fallback: 'carrierEnvAttack' },
    { key: 'modulatorEnvDecay', label: 'ModDec', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2), fallback: 'carrierEnvDecay' },
    { key: 'modulatorEnvRelease', label: 'ModRel', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2), fallback: 'carrierEnvRelease' },
    { key: 'filterCutoff', label: 'Cutoff', min: 100, max: 20000, step: 100, format: v => Math.round(v) },
    { key: 'filterResonance', label: 'Res', min: 0.1, max: 20, step: 0.1, format: v => v.toFixed(1) },
    { key: 'detune', label: 'Detune', min: -1200, max: 1200, step: 1, format: v => v.toFixed(0) },
  ];

  let activeParam = null;

  function setActive(def) {
    activeParam = def;
    if (dial.off) dial.off('change');
    const val = node.audioParams[def.key] ?? (def.fallback ? node.audioParams[def.fallback] : def.min);
    if (dial.min !== undefined) {
      dial.min = def.min;
      dial.max = def.max;
      dial.step = def.step;
      dial.value = val;
    } else {
      dial.setAttribute('min', def.min);
      dial.setAttribute('max', def.max);
      dial.setAttribute('step', def.step);
      dial.value = val;
    }
    label.textContent = `${def.label}: ${def.format(val)}`;
    const handler = v => {
      const value = typeof v === 'number' ? v : parseFloat(v);
      node.audioParams[def.key] = value;
      label.textContent = `${def.label}: ${def.format(value)}`;
      updateNodeAudioParams(node);
    };
    if (dial.on) {
      dial.on('change', handler);
    } else {
      dial.oninput = e => handler(e.target.value);
    }
  }

  params.forEach(def => {
    const btn = document.createElement('button');
    btn.textContent = def.label;
    btn.style.fontSize = '10px';
    btn.addEventListener('click', () => setActive(def));
    paramsGrid.appendChild(btn);
  });

  const carWaveWrap = document.createElement('div');
  const carWaveLabel = document.createElement('label');
  carWaveLabel.textContent = 'CarWave';
  carWaveLabel.style.fontSize = '10px';
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
  paramsGrid.appendChild(carWaveWrap);

  const modWaveWrap = document.createElement('div');
  const modWaveLabel = document.createElement('label');
  modWaveLabel.textContent = 'ModWave';
  modWaveLabel.style.fontSize = '10px';
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
  paramsGrid.appendChild(modWaveWrap);

  const filterTypeWrap = document.createElement('div');
  const filterTypeLabel = document.createElement('label');
  filterTypeLabel.textContent = 'Filt';
  filterTypeLabel.style.fontSize = '10px';
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
  paramsGrid.appendChild(filterTypeWrap);

  const algRow = document.createElement('div');
  algRow.style.display = 'flex';
  algRow.style.marginTop = '4px';
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
      if (activeParam && (activeParam.key === 'modulatorRatio' || activeParam.key === 'modulatorDepthScale')) {
        setActive(activeParam);
      }
      Array.from(algRow.children).forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      updateNodeAudioParams(node);
    });
    algRow.appendChild(btn);
  });
  container.appendChild(algRow);

  setActive(params[0]);

  positionTonePanel(node);
}

