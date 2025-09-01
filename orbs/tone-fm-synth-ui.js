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

  function createSelect(labelText, options, value, onChange) {
    console.log('[ToneFM UI] createSelect called:', { labelText, options, value });
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
    sel.style.fontSize = '9px';
    options.forEach(optVal => {
      const opt = document.createElement('option');
      opt.value = optVal;
      opt.textContent = optVal;
      if (value === optVal) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', e => {
      console.log('[ToneFM UI] Select changed:', e.target.value);
      onChange(e.target.value);
    });
    wrap.appendChild(sel);
    wrap.appendChild(label);
    console.log('[ToneFM UI] Created select element:', sel, 'in wrapper:', wrap);
    return wrap;
  }

  const operators = [
    { prefix: 'carrier', label: 'Car' },
    { prefix: 'modulator', label: 'M1', envFallback: 'carrier' },
    { prefix: 'modulator2', label: 'M2', envFallback: 'carrier' },
    { prefix: 'modulator3', label: 'M3', envFallback: 'carrier' },
  ];

  // Create operator sections (each operator gets its own row)
  for (const op of operators) {
    // Operator header
    const opSection = document.createElement('div');
    opSection.style.marginBottom = '8px';
    
    const opHeader = document.createElement('div');
    opHeader.style.fontSize = '11px';
    opHeader.style.fontWeight = 'bold';
    opHeader.style.color = '#6075b0';
    opHeader.style.marginBottom = '4px';
    opHeader.textContent = `Operator ${op.label}`;
    opSection.appendChild(opHeader);
    
    // Operator controls in a horizontal grid
    const opGrid = document.createElement('div');
    opGrid.style.display = 'grid';
    opGrid.style.gridTemplateColumns = 'repeat(9, 40px)';
    opGrid.style.gap = '4px';
    opGrid.style.justifyContent = 'start';
    
    const columns = [
      { suffix: 'Waveform', short: 'W', type: 'select', options: ['sine', 'square', 'triangle', 'sawtooth'] },
      { suffix: 'Ratio', short: 'Rat', min: 0.1, max: 10, step: 0.1, format: v => v.toFixed(1) },
      { suffix: 'DepthScale', short: 'Dep', min: 0, max: 10, step: 0.1, format: v => (v * 10).toFixed(1) },
      { suffix: 'EnvAttack', short: 'A', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
      { suffix: 'EnvDecay', short: 'D', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
      { suffix: 'EnvRelease', short: 'R', min: 0, max: 4, step: 0.01, format: v => v.toFixed(2) },
      { suffix: 'LfoRate', short: 'LR', min: 0, max: 10, step: 0.01, format: v => v.toFixed(2) },
      { suffix: 'LfoDepth', short: 'LD', min: 0, max: 10, step: 0.1, format: v => (v * 10).toFixed(1) },
      { suffix: 'Detune', short: 'Det', min: -1200, max: 1200, step: 1, format: v => v.toFixed(0) },
    ];
    
    for (const col of columns) {
      const key = `${op.prefix}${col.suffix}`;
      let val = node.audioParams[key];
      if (val == null && op.envFallback && col.suffix.startsWith('Env')) {
        const fbKey = `${op.envFallback}${col.suffix}`;
        val = node.audioParams[fbKey];
      }
      
      // Special handling for detune - use 0 as default instead of null
      if (val == null && col.suffix === 'Detune') {
        val = 0;
      }

      console.log(`[ToneFM UI] Creating control for ${key}, type: ${col.type || 'dial'}, value:`, val);

      let wrap;
      if (col.type === 'select') {
        console.log(`[ToneFM UI] Creating waveform selector for ${key} with options:`, col.options);
        wrap = createSelect(
          `${col.short}`,
          col.options,
          val || col.options[0],
          v => {
            console.log(`[ToneFM UI] Waveform changed for ${key}:`, v);
            node.audioParams[key] = v;
            updateNodeAudioParams(node);
          }
        );
      } else {
        wrap = await createDial(
          `fm-${key}-${node.id}`,
          `${col.short}`,
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
      opGrid.appendChild(wrap);
    }
    
    opSection.appendChild(opGrid);
    container.appendChild(opSection);
  }

  // Filter and Algorithm section (side by side)
  const filterAlgSection = document.createElement('div');
  filterAlgSection.style.display = 'flex';
  filterAlgSection.style.gap = '16px';
  filterAlgSection.style.marginBottom = '8px';
  
  // Filter section
  const filterSection = document.createElement('div');
  
  const filterHeader = document.createElement('div');
  filterHeader.style.fontSize = '11px';
  filterHeader.style.fontWeight = 'bold';
  filterHeader.style.color = '#6075b0';
  filterHeader.style.marginBottom = '4px';
  filterHeader.textContent = 'Filter';
  filterSection.appendChild(filterHeader);
  
  const filterGrid = document.createElement('div');
  filterGrid.style.display = 'grid';
  filterGrid.style.gridTemplateColumns = 'repeat(3, 40px)';
  filterGrid.style.gap = '4px';
  filterGrid.style.justifyContent = 'start';

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
    filterGrid.appendChild(wrap);
  }
  
  filterSection.appendChild(filterGrid);
  filterAlgSection.appendChild(filterSection);

  // Algorithm section
  const algSection = document.createElement('div');
  
  const algHeader = document.createElement('div');
  algHeader.style.fontSize = '11px';
  algHeader.style.fontWeight = 'bold';
  algHeader.style.color = '#6075b0';
  algHeader.style.marginBottom = '4px';
  algHeader.textContent = 'Algorithm';
  algSection.appendChild(algHeader);
  
  // Algorithm visualization
  const algVisualContainer = document.createElement('div');
  algVisualContainer.style.display = 'flex';
  algVisualContainer.style.alignItems = 'center';
  algVisualContainer.style.gap = '8px';
  algVisualContainer.style.marginBottom = '4px';
  
  // Algorithm diagram
  const algDiagram = document.createElement('div');
  algDiagram.style.width = '120px';
  algDiagram.style.height = '80px';
  algDiagram.style.position = 'relative';
  algDiagram.style.border = '1px solid #444';
  algDiagram.style.borderRadius = '4px';
  algDiagram.style.backgroundColor = '#2a2a2a';
  
  function drawAlgorithmDiagram(algorithmIndex) {
    const alg = fmAlgorithms[algorithmIndex] || fmAlgorithms[0];
    algDiagram.innerHTML = '';
    
    // Operator positions (4 operators in a 2x2 grid)
    const positions = {
      4: { x: 20, y: 15 },  // Top left
      3: { x: 80, y: 15 },  // Top right  
      2: { x: 20, y: 50 },  // Bottom left
      1: { x: 80, y: 50 }   // Bottom right
    };
    
    // Draw connections first (behind operators)
    alg.connections.forEach(({ source, target }) => {
      const line = document.createElement('div');
      const sourcePos = positions[source];
      const targetPos = positions[target];
      
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      line.style.position = 'absolute';
      line.style.left = sourcePos.x + 8 + 'px';
      line.style.top = sourcePos.y + 8 + 'px';
      line.style.width = length + 'px';
      line.style.height = '2px';
      line.style.backgroundColor = '#6075b0';
      line.style.transformOrigin = '0 1px';
      line.style.transform = `rotate(${angle}rad)`;
      line.style.zIndex = '1';
      
      // Add arrowhead
      const arrow = document.createElement('div');
      arrow.style.position = 'absolute';
      arrow.style.right = '-4px';
      arrow.style.top = '-2px';
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderLeft = '4px solid #6075b0';
      arrow.style.borderTop = '2px solid transparent';
      arrow.style.borderBottom = '2px solid transparent';
      line.appendChild(arrow);
      
      algDiagram.appendChild(line);
    });
    
    // Draw operators
    [4, 3, 2, 1].forEach(opNum => {
      const pos = positions[opNum];
      const opDiv = document.createElement('div');
      opDiv.style.position = 'absolute';
      opDiv.style.left = pos.x + 'px';
      opDiv.style.top = pos.y + 'px';
      opDiv.style.width = '16px';
      opDiv.style.height = '16px';
      opDiv.style.borderRadius = '3px';
      opDiv.style.fontSize = '10px';
      opDiv.style.display = 'flex';
      opDiv.style.alignItems = 'center';
      opDiv.style.justifyContent = 'center';
      opDiv.style.fontWeight = 'bold';
      opDiv.style.zIndex = '2';
      opDiv.textContent = opNum;
      
      // Color carriers differently
      if (alg.carriers.includes(opNum)) {
        opDiv.style.backgroundColor = '#6075b0';
        opDiv.style.color = 'white';
        opDiv.style.border = '2px solid #8090d0';
      } else {
        opDiv.style.backgroundColor = '#444';
        opDiv.style.color = '#ccc';
        opDiv.style.border = '1px solid #666';
      }
      
      algDiagram.appendChild(opDiv);
    });
  }
  
  // Algorithm info text
  const algInfo = document.createElement('div');
  algInfo.style.fontSize = '11px';
  algInfo.style.color = '#ccc';
  algInfo.style.lineHeight = '1.3';
  
  function updateAlgorithmInfo(algorithmIndex) {
    const alg = fmAlgorithms[algorithmIndex] || fmAlgorithms[0];
    algInfo.innerHTML = `
      <div style="font-weight: bold; color: #6075b0;">${alg.label}</div>
      <div>Carriers: ${alg.carriers.join(', ')}</div>
      <div>Connections: ${alg.connections.length}</div>
    `;
  }
  
  algVisualContainer.appendChild(algDiagram);
  algVisualContainer.appendChild(algInfo);
  algSection.appendChild(algVisualContainer);
  
  // Algorithm selection buttons
  const algRow = document.createElement('div');
  algRow.style.display = 'flex';
  algRow.style.flexWrap = 'wrap';
  algRow.style.gap = '4px';
  
  fmAlgorithms.forEach((alg, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `${idx + 1}`;  // Just show number, not "Alg 1"
    btn.className = 'waveform-button';
    btn.style.fontSize = '9px';
    btn.style.padding = '2px 4px';
    btn.style.width = '20px';
    btn.style.height = '20px';
    btn.style.minWidth = 'auto';
    btn.style.boxSizing = 'border-box';
    if (node.audioParams.algorithm === idx) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      node.audioParams.algorithm = idx;
      Array.from(algRow.children).forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      drawAlgorithmDiagram(idx);
      updateAlgorithmInfo(idx);
      updateNodeAudioParams(node);
    });
    algRow.appendChild(btn);
  });
  
  algSection.appendChild(algRow);
  filterAlgSection.appendChild(algSection);
  container.appendChild(filterAlgSection);
  
  // Initialize with current algorithm
  drawAlgorithmDiagram(node.audioParams.algorithm ?? 0);
  updateAlgorithmInfo(node.audioParams.algorithm ?? 0);

  positionTonePanel(node);
}
