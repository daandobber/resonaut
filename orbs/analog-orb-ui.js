import { tonePanel, tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams, getScreenCoords } from '../main.js';

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

const analogDials = new Set();
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
    analogDials.forEach(applyDialTheme);
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
  analogDials.add(dial);
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

function createSelect(labelText, options, value, onChange) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.alignItems = 'center';
  wrap.style.width = '40px';

  const select = document.createElement('select');
  select.style.width = '40px';
  options.forEach(optVal => {
    const opt = document.createElement('option');
    opt.value = optVal;
    opt.textContent = optVal;
    if (value === optVal) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', e => onChange(e.target.value));
  wrap.appendChild(select);

  const label = document.createElement('div');
  label.textContent = labelText;
  label.style.fontSize = '10px';
  wrap.appendChild(label);
  return wrap;
}

export function hideAnalogOrbMenu() {
  const existing = document.getElementById('tone-synth-container');
  if (existing) existing.remove();
  if (tonePanelContent) tonePanelContent.innerHTML = '';
}

export function hideTonePanel() {
  if (tonePanel) tonePanel.classList.add('hidden');
  import('./fm-drone-orb.js').then((m) => m.hideFmDroneOrbMenu?.());
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

export async function showAnalogOrbMenu(node) {
  hideAnalogOrbMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'tone') return;

  showTonePanel(node);
  if (!tonePanelContent) return;

  const Nexus = await getNexus();

  const container = document.createElement('div');
  container.id = 'tone-synth-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  const displayWrap = document.createElement('div');
  displayWrap.style.display = 'flex';
  displayWrap.style.alignItems = 'center';
  displayWrap.style.justifyContent = 'center';
  displayWrap.style.gap = '4px';
  displayWrap.style.marginBottom = '4px';

  if (Nexus) {
    const oscTarget = document.createElement('div');
    oscTarget.style.width = '80px';
    oscTarget.style.height = '30px';
    displayWrap.appendChild(oscTarget);
    const oscilloscope = new Nexus.Oscilloscope(oscTarget, { size: [80, 30] });
    applyDialTheme(oscilloscope);
    analogDials.add(oscilloscope);
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
    applyDialTheme(numberDisplay);
    analogDials.add(numberDisplay);
    initThemeObserver();
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
  dialsGrid.style.gridTemplateColumns = 'repeat(7, 40px)';
  container.appendChild(dialsGrid);

  const controls = [
    { id: 'osc1Level', label: 'G1', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'osc2Level', label: 'G2', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'osc1Octave', label: 'O1', min: -2, max: 2, step: 1, format: v => (v > 0 ? '+' + v : '' + v) },
    { id: 'osc2Octave', label: 'O2', min: -2, max: 2, step: 1, format: v => (v > 0 ? '+' + v : '' + v) },
    { id: 'osc2Detune', label: 'Det', min: -100, max: 100, step: 1, format: v => v.toFixed(0) },
    { id: 'filterCutoff', label: 'Cut', min: 20, max: 20000, step: 1, format: v => `${Math.round(v)}` },
    { id: 'filterResonance', label: 'Res', min: 0, max: 30, step: 0.1, format: v => v.toFixed(1) },
    { id: 'ampEnvAttack', label: 'A', min: 0.005, max: 2.0, step: 0.001, format: v => v.toFixed(2) },
    { id: 'ampEnvDecay', label: 'D', min: 0.01, max: 2.0, step: 0.01, format: v => v.toFixed(2) },
    { id: 'ampEnvSustain', label: 'S', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'ampEnvRelease', label: 'R', min: 0.01, max: 4.0, step: 0.01, format: v => v.toFixed(2) },
    { id: 'noiseLevel', label: 'Noi', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'reverbSend', label: 'Rev', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'delaySend', label: 'Del', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
  ];

  for (const info of controls) {
    const dial = await createDial(
      `analog-${info.id}-${node.id}`,
      info.label,
      info.min,
      info.max,
      info.step,
      node.audioParams[info.id] ?? info.min,
      v => {
        node.audioParams[info.id] = v;
        updateNodeAudioParams(node);
      },
      info.format,
      updateDisplay
    );
    dialsGrid.appendChild(dial);
  }

  const selectsRow = document.createElement('div');
  selectsRow.style.display = 'flex';
  selectsRow.style.gap = '4px';
  selectsRow.style.marginTop = '4px';

  const osc1Sel = createSelect(
    'Osc1',
    ['sine', 'square', 'triangle', 'sawtooth'],
    node.audioParams.osc1Waveform,
    v => {
      node.audioParams.osc1Waveform = v;
      updateNodeAudioParams(node);
    }
  );
  const osc2Sel = createSelect(
    'Osc2',
    ['sine', 'square', 'triangle', 'sawtooth'],
    node.audioParams.osc2Waveform,
    v => {
      node.audioParams.osc2Waveform = v;
      updateNodeAudioParams(node);
    }
  );
  const filtSel = createSelect(
    'Filt',
    ['lowpass', 'highpass', 'bandpass', 'notch'],
    node.audioParams.filterType,
    v => {
      node.audioParams.filterType = v;
      updateNodeAudioParams(node);
    }
  );

  selectsRow.appendChild(osc1Sel);
  selectsRow.appendChild(osc2Sel);
  selectsRow.appendChild(filtSel);
  container.appendChild(selectsRow);

  positionTonePanel(node);
}
