import { tonePanelContent } from '../utils/domElements.js';
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

const pluckDials = new Set();
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
    pluckDials.forEach(applyDialTheme);
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
  pluckDials.add(dial);
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

export async function showTonePluckSynthMenu(node) {
  hideAnalogOrbMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'tonepluck') return;

  showTonePanel(node);
  if (!tonePanelContent) return;

  const Nexus = await getNexus();

  const container = document.createElement('div');
  container.id = 'tone-pluck-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  // Small display row
  const displayWrap = document.createElement('div');
  displayWrap.style.display = 'flex';
  displayWrap.style.alignItems = 'center';
  displayWrap.style.justifyContent = 'center';
  displayWrap.style.gap = '4px';
  displayWrap.style.marginBottom = '4px';

  // Oscilloscope like other engines
  if (Nexus) {
    const oscTarget = document.createElement('div');
    oscTarget.style.width = '80px';
    oscTarget.style.height = '30px';
    displayWrap.appendChild(oscTarget);
    const oscilloscope = new Nexus.Oscilloscope(oscTarget, { size: [80, 30] });
    applyDialTheme(oscilloscope);
    pluckDials.add(oscilloscope);
    initThemeObserver();
    const srcNode =
      node.audioNodes?.gainNode ||
      node.audioNodes?.mainGain ||
      node.audioNodes?.output ||
      node.audioNodes?.mix;
    if (srcNode && oscilloscope.connect) {
      try { oscilloscope.connect(srcNode); } catch {}
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

  // Core pluck params
  const pluckGrid = document.createElement('div');
  pluckGrid.style.display = 'grid';
  pluckGrid.style.gridTemplateColumns = 'repeat(4, 40px)';
  pluckGrid.style.gap = '4px';
  pluckGrid.style.justifyContent = 'start';

  const coreParams = [
    { key: 'attackNoise', label: 'Atk', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'dampening', label: 'Damp', min: 100, max: 20000, step: 50, format: v => Math.round(v) },
    { key: 'resonance', label: 'Res', min: 0.01, max: 1.0, step: 0.01, format: v => v.toFixed(2) },
    { key: 'volume', label: 'Vol', min: 0, max: 1.5, step: 0.01, format: v => v.toFixed(2) },
  ];

  for (const cp of coreParams) {
    const wrap = await createDial(
      `pluck-${cp.key}-${node.id}`,
      cp.label,
      cp.min,
      cp.max,
      cp.step,
      node.audioParams[cp.key] ?? cp.min,
      v => { node.audioParams[cp.key] = v; updateNodeAudioParams(node); },
      cp.format,
      updateDisplay,
    );
    pluckGrid.appendChild(wrap);
  }
  container.appendChild(pluckGrid);

  // Distortion section
  const distHeader = document.createElement('div');
  distHeader.style.fontSize = '11px';
  distHeader.style.fontWeight = 'bold';
  distHeader.style.color = '#b06060';
  distHeader.style.margin = '8px 0 4px 0';
  distHeader.textContent = 'Distortion';
  container.appendChild(distHeader);

  const distGrid = document.createElement('div');
  distGrid.style.display = 'grid';
  distGrid.style.gridTemplateColumns = 'repeat(5, 40px)';
  distGrid.style.gap = '4px';
  distGrid.style.justifyContent = 'start';

  const distParams = [
    { key: 'distortionAmount', label: 'Amt', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'distortionWet', label: 'Wet', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'distortionDrive', label: 'Drv', min: 0, max: 10, step: 0.1, format: v => v.toFixed(1) },
    { key: 'distortionLevel', label: 'Lvl', min: 0, max: 3, step: 0.05, format: v => v.toFixed(2) },
  ];
  for (const dp of distParams) {
    const wrap = await createDial(
      `pluck-${dp.key}-${node.id}`,
      dp.label,
      dp.min,
      dp.max,
      dp.step,
      node.audioParams[dp.key] ?? dp.min,
      v => { node.audioParams[dp.key] = v; updateNodeAudioParams(node); },
      dp.format,
      updateDisplay,
    );
    distGrid.appendChild(wrap);
  }
  // Oversample select
  const overWrap = document.createElement('div');
  overWrap.style.display = 'flex';
  overWrap.style.flexDirection = 'column';
  overWrap.style.alignItems = 'center';
  overWrap.style.width = '40px';
  const sel = document.createElement('select');
  sel.style.width = '40px';
  sel.style.fontSize = '9px';
  ;['none','2x','4x'].forEach(o => { const opt = document.createElement('option'); opt.value=o; opt.textContent=o; if ((node.audioParams.distortionOversample||'2x')===o) opt.selected=true; sel.appendChild(opt); });
  sel.addEventListener('change', e => { node.audioParams.distortionOversample = e.target.value; updateNodeAudioParams(node); });
  const l = document.createElement('div'); l.textContent = 'OS'; l.style.fontSize='10px';
  overWrap.appendChild(sel); overWrap.appendChild(l);
  distGrid.appendChild(overWrap);
  container.appendChild(distGrid);

  // AutoWah section (wet/dry only; no toggle)
  const wahHeader = document.createElement('div');
  wahHeader.style.fontSize = '11px';
  wahHeader.style.fontWeight = 'bold';
  wahHeader.style.color = '#60b060';
  wahHeader.style.margin = '8px 0 4px 0';
  wahHeader.textContent = 'AutoWah';
  container.appendChild(wahHeader);

  const wahGrid = document.createElement('div');
  wahGrid.style.display = 'grid';
  wahGrid.style.gridTemplateColumns = 'repeat(5, 40px)';
  wahGrid.style.gap = '4px';
  wahGrid.style.justifyContent = 'start';

  const wahParams = [
    { key: 'wahWet', label: 'Wet', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'wahBaseFreq', label: 'Base', min: 50, max: 1000, step: 5, format: v => Math.round(v) },
    { key: 'wahOctaves', label: 'Oct', min: 0, max: 6, step: 0.1, format: v => v.toFixed(1) },
    { key: 'wahQ', label: 'Q', min: 0.1, max: 10, step: 0.1, format: v => v.toFixed(1) },
    { key: 'wahSensitivity', label: 'Sens', min: -40, max: 0, step: 0.5, format: v => v.toFixed(1) },
  ];

  for (const wp of wahParams) {
    const wrap = await createDial(
      `pluck-${wp.key}-${node.id}`,
      wp.label,
      wp.min,
      wp.max,
      wp.step,
      node.audioParams[wp.key] ?? wp.min,
      v => { node.audioParams[wp.key] = v; updateNodeAudioParams(node); },
      wp.format,
      updateDisplay,
    );
    wahGrid.appendChild(wrap);
  }
  container.appendChild(wahGrid);

  // Tremolo section (wet/dry only; no toggle)
  const tremHeader = document.createElement('div');
  tremHeader.style.fontSize = '11px';
  tremHeader.style.fontWeight = 'bold';
  tremHeader.style.color = '#c09040';
  tremHeader.style.margin = '8px 0 4px 0';
  tremHeader.textContent = 'Tremolo';
  container.appendChild(tremHeader);

  const tremGrid = document.createElement('div');
  tremGrid.style.display = 'grid';
  tremGrid.style.gridTemplateColumns = 'repeat(3, 40px)';
  tremGrid.style.gap = '4px';
  tremGrid.style.justifyContent = 'start';

  const tremParams = [
    { key: 'tremoloWet', label: 'Wet', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'tremoloRate', label: 'Rate', min: 0.1, max: 20, step: 0.1, format: v => v.toFixed(1) },
    { key: 'tremoloDepth', label: 'Dep', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
  ];
  for (const tp of tremParams) {
    const wrap = await createDial(
      `pluck-${tp.key}-${node.id}`,
      tp.label,
      tp.min,
      tp.max,
      tp.step,
      node.audioParams[tp.key] ?? tp.min,
      v => { node.audioParams[tp.key] = v; updateNodeAudioParams(node); },
      tp.format,
      updateDisplay,
    );
    tremGrid.appendChild(wrap);
  }
  container.appendChild(tremGrid);

  // Chorus section (wet/dry only; no toggle)
  const choHeader = document.createElement('div');
  choHeader.style.fontSize = '11px';
  choHeader.style.fontWeight = 'bold';
  choHeader.style.color = '#40a0c0';
  choHeader.style.margin = '8px 0 4px 0';
  choHeader.textContent = 'Chorus';
  container.appendChild(choHeader);

  const choGrid = document.createElement('div');
  choGrid.style.display = 'grid';
  choGrid.style.gridTemplateColumns = 'repeat(5, 40px)';
  choGrid.style.gap = '4px';
  choGrid.style.justifyContent = 'start';

  const choParams = [
    { key: 'chorusWet', label: 'Wet', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'chorusRate', label: 'Rate', min: 0.1, max: 8, step: 0.1, format: v => v.toFixed(1) },
    { key: 'chorusDepth', label: 'Dep', min: 0, max: 1, step: 0.01, format: v => v.toFixed(2) },
    { key: 'chorusDelayTime', label: 'DlyT', min: 1, max: 20, step: 0.5, format: v => v.toFixed(1) },
    { key: 'chorusSpread', label: 'Spr', min: 0, max: 180, step: 5, format: v => Math.round(v) },
  ];
  for (const cp of choParams) {
    const wrap = await createDial(
      `pluck-${cp.key}-${node.id}`,
      cp.label,
      cp.min,
      cp.max,
      cp.step,
      node.audioParams[cp.key] ?? cp.min,
      v => { node.audioParams[cp.key] = v; updateNodeAudioParams(node); },
      cp.format,
      updateDisplay,
    );
    choGrid.appendChild(wrap);
  }
  container.appendChild(choGrid);

  positionTonePanel(node);
}
