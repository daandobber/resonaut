import { tonePanel, tonePanelContent } from '../utils/domElements.js';
import { updateNodeAudioParams } from '../main.js';
import { showTonePanel, positionTonePanel, hideAnalogOrbMenu } from './analog-orb-ui.js';

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

const uiDials = new Set();
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
  const observer = new MutationObserver(() => uiDials.forEach(applyDialTheme));
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
  const dial = new Nexus.Dial(target, { size: [30,30], interaction: 'radial', mode: 'relative', min, max, step, value });
  applyDialTheme(dial); uiDials.add(dial); initThemeObserver();
  const label = document.createElement('div');
  label.textContent = labelText; label.style.fontSize = '10px';
  wrap.appendChild(label);
  dial.on('change', v => { onChange(v); updateDisplay(labelText, v, format); });
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
  options.forEach(({label, value: val}) => {
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = label; if (val === value) opt.selected = true; select.appendChild(opt);
  });
  select.addEventListener('change', e => onChange(parseFloat(e.target.value)));
  wrap.appendChild(select);
  const labelEl = document.createElement('div');
  labelEl.textContent = labelText; labelEl.style.fontSize = '10px';
  wrap.appendChild(labelEl);
  return wrap;
}

export function hidePulseSynthMenu() {
  const existing = document.getElementById('pulse-synth-container');
  if (existing) existing.remove();
  if (tonePanelContent) tonePanelContent.innerHTML = '';
}

export async function showPulseSynthMenu(node) {
  hidePulseSynthMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'pulse') return;
  hideAnalogOrbMenu();
  showTonePanel(node);
  if (!tonePanelContent) return;
  try {
    const header = document.getElementById('tone-panel-header');
    if (header) header.textContent = 'Pulse Synth Settings';
  } catch {}

  const Nexus = await getNexus();
  const container = document.createElement('div');
  container.id = 'pulse-synth-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  // Compact but scrollable if needed
  container.style.maxHeight = '60vh';
  container.style.overflowY = 'auto';
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
    oscTarget.style.width = '80px'; oscTarget.style.height = '30px';
    displayWrap.appendChild(oscTarget);
    const oscilloscope = new Nexus.Oscilloscope(oscTarget, { size: [80,30] });
    applyDialTheme(oscilloscope); uiDials.add(oscilloscope); initThemeObserver();
    const srcNode = node.audioNodes?.gainNode || node.audioNodes?.mainGain || node.audioNodes?.output || node.audioNodes?.mix;
    if (srcNode) oscilloscope.connect(srcNode);
  }

  const displayLabel = document.createElement('div');
  displayLabel.style.fontSize = '10px';
  displayWrap.appendChild(displayLabel);

  const numberTarget = document.createElement('div');
  displayWrap.appendChild(numberTarget);
  let numberDisplay;
  if (Nexus) {
    numberDisplay = new Nexus.Number(numberTarget, { size: [40, 20], value: 0 });
    applyDialTheme(numberDisplay); uiDials.add(numberDisplay); initThemeObserver();
  } else {
    const input = document.createElement('input'); input.type = 'number'; input.readOnly = true; input.style.width = '40px'; numberTarget.appendChild(input); numberDisplay = input;
  }
  container.appendChild(displayWrap);

  function updateDisplay(label, value, format) {
    displayLabel.textContent = label;
    const formatted = parseFloat(format(value));
    if (numberDisplay && typeof numberDisplay.value !== 'undefined') numberDisplay.value = formatted;
  }

  const p = node.audioParams || {};

  // Dials row (Nexus)
  const dialsGrid = document.createElement('div');
  dialsGrid.style.display = 'grid';
  dialsGrid.style.gap = '4px';
  dialsGrid.style.gridTemplateColumns = 'repeat(8, 40px)';
  container.appendChild(dialsGrid);

  const dutyOptions = [
    { label: '12', value: 0.125 },
    { label: '25', value: 0.25 },
    { label: '50', value: 0.5 },
    { label: '75', value: 0.75 },
  ];

  const dutySelect = createSelect('Duty', dutyOptions, p.duty ?? 0.5, v => { node.audioParams.duty = v; updateNodeAudioParams(node); });
  dialsGrid.appendChild(dutySelect);

  const controls = [
    { id: 'detune', label: 'Det', min: -1200, max: 1200, step: 1, format: v => v.toFixed(0) },
    { id: 'ampEnvAttack', label: 'A', min: 0.001, max: 1.0, step: 0.001, format: v => v.toFixed(3) },
    { id: 'ampEnvDecay', label: 'D', min: 0.001, max: 1.0, step: 0.001, format: v => v.toFixed(3) },
    { id: 'ampEnvSustain', label: 'S', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { id: 'ampEnvRelease', label: 'R', min: 0.001, max: 2.0, step: 0.001, format: v => v.toFixed(3) },
  ];
  for (const info of controls) {
    const dial = await createDial(
      `pulse-${info.id}-${node.id}`,
      info.label,
      info.min,
      info.max,
      info.step,
      p[info.id] ?? info.min,
      v => { node.audioParams[info.id] = v; updateNodeAudioParams(node); },
      info.format,
      updateDisplay,
    );
    dialsGrid.appendChild(dial);
  }

  // (ARP and vibrato controls removed for pulse)

  positionTonePanel(node);
}
