import { tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, positionTonePanel, hideToneSynthMenu } from './tone-synth-ui.js';
import { fmAlgorithms } from './fm-synth-orb.js';

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

function createSlider(id, labelText, min, max, step, value, onInput, format, updateDisplay) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  wrap.style.width = '40px';

  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  wrap.appendChild(input);

  const label = document.createElement('div');
  label.textContent = labelText;
  label.style.fontSize = '10px';
  wrap.appendChild(label);

  input.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    onInput(v);
    updateDisplay(labelText, v, format);
  });
  wrap.addEventListener('pointerdown', () => updateDisplay(labelText, parseFloat(input.value), format));

  wrap.dial = input;
  return wrap;
}

async function createDial(id, labelText, min, max, step, value, onChange, format, updateDisplay) {
  const Nexus = await getNexus();
  if (!Nexus) {
    return createSlider(id, labelText, min, max, step, value, onChange, format, updateDisplay);
  }

  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  wrap.style.width = '40px';

  const target = document.createElement('div');
  target.id = id;
  wrap.appendChild(target);

  const dial = new Nexus.Dial(target, {
    size: [30, 30],
    interaction: 'radial',
    mode: 'absolute',
    min,
    max,
    step,
    value,
  });
  applyDialTheme(dial);
  fmDials.add(dial);
  initThemeObserver();

  const label = document.createElement('div');
  label.textContent = labelText;
  label.style.fontSize = '10px';
  wrap.appendChild(label);

  dial.on('change', v => {
    onChange(v);
    updateDisplay(labelText, v, format);
  });

  wrap.addEventListener('pointerdown', () => updateDisplay(labelText, dial.value, format));

  wrap.dial = dial;
  return wrap;
}

export async function showToneFmSynthMenu(node) {
  hideToneSynthMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'tonefm') return;

  showTonePanel(node);
  if (!tonePanelContent) return;

  const Nexus = await getNexus();

  const container = document.createElement('div');
  container.id = 'tone-synth-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  // Display showing active parameter
  const displayWrap = document.createElement('div');
  displayWrap.style.display = 'flex';
  displayWrap.style.alignItems = 'center';
  displayWrap.style.justifyContent = 'center';
  displayWrap.style.gap = '4px';
  displayWrap.style.marginBottom = '4px';

  const displayLabel = document.createElement('div');
  displayLabel.style.fontSize = '10px';
  displayWrap.appendChild(displayLabel);

  const numberTarget = document.createElement('div');
  displayWrap.appendChild(numberTarget);

  let numberDisplay;
  if (Nexus) {
    numberDisplay = new Nexus.Number(numberTarget, { size: [40, 20], value: 0 });
  } else {
    const input = document.createElement('input');
    input.type = 'number';
    input.readOnly = true;
    input.style.width = '40px';
    numberTarget.appendChild(input);
    numberDisplay = input;
  }

  container.appendChild(displayWrap);

  function updateDisplay(label, value, format) {
    displayLabel.textContent = label;
    const formatted = parseFloat(format(value));
    if (numberDisplay && typeof numberDisplay.value !== 'undefined') {
      numberDisplay.value = formatted;
    }
  }

  const dialsGrid = document.createElement('div');
  dialsGrid.style.display = 'grid';
  dialsGrid.style.gridTemplateColumns = 'repeat(auto-fill, 40px)';
  dialsGrid.style.gap = '4px';
  container.appendChild(dialsGrid);

  const params = [
    { key: 'carrierEnvAttack', label: 'CarA', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { key: 'carrierEnvDecay', label: 'CarD', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { key: 'carrierEnvRelease', label: 'CarR', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { key: 'modulatorEnvAttack', label: 'ModA', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2), fallback: 'carrierEnvAttack' },
    { key: 'modulatorEnvDecay', label: 'ModD', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2), fallback: 'carrierEnvDecay' },
    { key: 'modulatorEnvRelease', label: 'ModR', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2), fallback: 'carrierEnvRelease' },
    { key: 'modulatorRatio', label: 'Ratio', min: 0.1, max: 10, step: 0.1, format: v => v.toFixed(1) },
    { key: 'modulatorDepthScale', label: 'Depth', min: 0, max: 10, step: 0.1, format: v => (v * 10).toFixed(1) },
    { key: 'filterCutoff', label: 'Cut', min: 100, max: 20000, step: 100, format: v => Math.round(v) },
    { key: 'filterResonance', label: 'Res', min: 0.1, max: 20, step: 0.1, format: v => v.toFixed(1) },
    { key: 'detune', label: 'Det', min: -1200, max: 1200, step: 1, format: v => v.toFixed(0) },
  ];

  let ratioDialWrap = null;
  let depthDialWrap = null;

  for (const def of params) {
    const val = node.audioParams[def.key] ?? (def.fallback ? node.audioParams[def.fallback] : def.min);
    const dialWrap = await createDial(
      `fm-${def.key}-${node.id}`,
      def.label,
      def.min,
      def.max,
      def.step,
      val,
      v => {
        node.audioParams[def.key] = v;
        updateNodeAudioParams(node);
      },
      def.format,
      updateDisplay
    );
    if (def.key === 'modulatorRatio') ratioDialWrap = dialWrap;
    if (def.key === 'modulatorDepthScale') depthDialWrap = dialWrap;
    dialsGrid.appendChild(dialWrap);
  }

  // Waveform and filter selects
  function createSelect(labelText, options, value, onChange) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';
    wrap.style.width = '40px';
    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.fontSize = '10px';
    const sel = document.createElement('select');
    sel.style.width = '40px';
    options.forEach(optVal => {
      const opt = document.createElement('option');
      opt.value = optVal;
      opt.textContent = optVal;
      if (value === optVal) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', e => onChange(e.target.value));
    wrap.appendChild(sel);
    wrap.appendChild(label);
    return wrap;
  }

  const carWaveWrap = createSelect('CarW', ['sine', 'square', 'triangle', 'sawtooth'], node.audioParams.carrierWaveform, v => {
    node.audioParams.carrierWaveform = v;
    updateNodeAudioParams(node);
  });
  const modWaveWrap = createSelect('ModW', ['sine', 'square', 'triangle', 'sawtooth'], node.audioParams.modulatorWaveform, v => {
    node.audioParams.modulatorWaveform = v;
    updateNodeAudioParams(node);
  });
  const filterTypeWrap = createSelect('Filt', ['lowpass', 'highpass', 'bandpass'], node.audioParams.filterType, v => {
    node.audioParams.filterType = v;
    updateNodeAudioParams(node);
  });
  dialsGrid.appendChild(carWaveWrap);
  dialsGrid.appendChild(modWaveWrap);
  dialsGrid.appendChild(filterTypeWrap);

  // Algorithm selection
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
      if (ratioDialWrap && ratioDialWrap.dial) {
        ratioDialWrap.dial.value = alg.modulatorRatio;
        if (ratioDialWrap.dial.emit) {
          ratioDialWrap.dial.emit('change', ratioDialWrap.dial.value);
        } else {
          ratioDialWrap.dial.dispatchEvent(new Event('input'));
        }
      }
      if (depthDialWrap && depthDialWrap.dial) {
        depthDialWrap.dial.value = alg.modulatorDepthScale;
        if (depthDialWrap.dial.emit) {
          depthDialWrap.dial.emit('change', depthDialWrap.dial.value);
        } else {
          depthDialWrap.dial.dispatchEvent(new Event('input'));
        }
      }
      Array.from(algRow.children).forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      updateNodeAudioParams(node);
    });
    algRow.appendChild(btn);
  });
  container.appendChild(algRow);

  positionTonePanel(node);
}

