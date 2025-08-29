import { tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, positionTonePanel, hideAnalogOrbMenu } from './analog-orb-ui.js';
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
    mode: 'relative',
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
  hideAnalogOrbMenu();
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

  // Small oscilloscope showing the synth output
  if (Nexus) {
    const oscTarget = document.createElement('div');
    oscTarget.style.width = '80px';
    oscTarget.style.height = '30px';
    displayWrap.appendChild(oscTarget);
    const oscilloscope = new Nexus.Oscilloscope(oscTarget, { size: [80, 30] });
    applyDialTheme(oscilloscope);
    fmDials.add(oscilloscope);
    initThemeObserver();
    const srcNode =
      node.audioNodes?.gainNode ||
      node.audioNodes?.mainGain ||
      node.audioNodes?.output ||
      node.audioNodes?.mix;
    if (srcNode) {
      oscilloscope.connect(srcNode);
    }
  }

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
  dialsGrid.style.gap = '4px';
  container.appendChild(dialsGrid);

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

  const operators = [
    { prefix: 'carrier', label: 'Car' },
    { prefix: 'modulator', label: 'M1', envFallback: 'carrier' },
    { prefix: 'modulator2', label: 'M2', envFallback: 'carrier' },
    { prefix: 'modulator3', label: 'M3', envFallback: 'carrier' },
  ];

  const columns = [
    { suffix: 'EnvAttack', short: 'A', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { suffix: 'EnvDecay', short: 'D', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { suffix: 'EnvRelease', short: 'R', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
    { suffix: 'Ratio', short: 'Rat', min: 0.1, max: 10, step: 0.1, format: v => v.toFixed(1) },
    { suffix: 'DepthScale', short: 'Dep', min: 0, max: 10, step: 0.1, format: v => (v * 10).toFixed(1) },
    { suffix: 'LfoRate', short: 'LR', min: 0, max: 10, step: 0.01, format: v => v.toFixed(2) },
    { suffix: 'LfoDepth', short: 'LD', min: 0, max: 10, step: 0.1, format: v => (v * 10).toFixed(1) },
    { suffix: 'Detune', short: 'Det', min: -1200, max: 1200, step: 1, format: v => v.toFixed(0) },
    { suffix: 'Waveform', short: 'W', type: 'select', options: ['sine', 'square', 'triangle', 'sawtooth'] },
  ];

  dialsGrid.style.gridTemplateColumns = `repeat(${columns.length}, 40px)`;

  for (const op of operators) {
    for (const col of columns) {
      const key = `${op.prefix}${col.suffix}`;
      let val = node.audioParams[key];
      if (val == null && op.envFallback && col.suffix.startsWith('Env')) {
        const fbKey = `${op.envFallback}${col.suffix}`;
        val = node.audioParams[fbKey];
      }

      let wrap;
      if (col.type === 'select') {
        wrap = createSelect(
          `${op.label}${col.short}`,
          col.options,
          val || col.options[0],
          v => {
            node.audioParams[key] = v;
            updateNodeAudioParams(node);
          }
        );
      } else {
        wrap = await createDial(
          `fm-${key}-${node.id}`,
          `${op.label}${col.short}`,
          col.min,
          col.max,
          col.step,
          val ?? col.min,
          v => {
            node.audioParams[key] = v;
            updateNodeAudioParams(node);
          },
          col.format,
          updateDisplay
        );
      }
      dialsGrid.appendChild(wrap);
    }
  }

  const extras = [
    { key: 'filterCutoff', label: 'Cut', min: 100, max: 20000, step: 100, format: v => Math.round(v) },
    { key: 'filterResonance', label: 'Res', min: 0.1, max: 20, step: 0.1, format: v => v.toFixed(1) },
    { key: 'filterType', label: 'Filt', type: 'select', options: ['lowpass', 'highpass', 'bandpass'] },
  ];

  for (const ex of extras) {
    let wrap;
    if (ex.type === 'select') {
      wrap = createSelect(
        ex.label,
        ex.options,
        node.audioParams[ex.key],
        v => {
          node.audioParams[ex.key] = v;
          updateNodeAudioParams(node);
        }
      );
    } else {
      wrap = await createDial(
        `fm-${ex.key}-${node.id}`,
        ex.label,
        ex.min,
        ex.max,
        ex.step,
        node.audioParams[ex.key] ?? ex.min,
        v => {
          node.audioParams[ex.key] = v;
          updateNodeAudioParams(node);
        },
        ex.format,
        updateDisplay
      );
    }
    dialsGrid.appendChild(wrap);
  }

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
      Array.from(algRow.children).forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      updateNodeAudioParams(node);
    });
    algRow.appendChild(btn);
  });
  container.appendChild(algRow);

  positionTonePanel(node);
}
