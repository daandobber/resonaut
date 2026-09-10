import { instrumentControls } from './utils/instrumentControls.js';
import {
  GRID_DIRECTIONS, GRID_PRESETS, copyGrid, euclideanRow, makeGridPreset,
  rotateGrid, mutateGrid, getGridRowSettings, isGridRowAudible,
  gridLabSettings, setGridRowSettings, storeGridSlot, recallGridSlot, resetGridPlayback,
} from './utils/gridPatternLab.js';

export function buildGridPatternLab(node, { getSelectedNodes = () => [node], onChange = () => {} } = {}) {
  const root = document.createElement('section');
  root.className = 'grid-pattern-lab';
  root.setAttribute('aria-label', 'Grid Pattern Lab');
  let message = 'Connect the row outputs to your orbs, then press Play.';
  let targetRow = 0;
  let hits = Math.min(3, node.cols || 8);
  let rotation = 0;

  const element = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const commit = (operation, text) => {
    getSelectedNodes().forEach(operation);
    onChange();
    message = text;
    const focusId = document.activeElement?.id;
    render();
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  };
  const button = (label, title, action, key) => {
    const btn = element('button', 'grid-lab-button', label);
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    if (key) btn.id = `grid-lab-${node.id}-${key}`;
    btn.addEventListener('click', action);
    return btn;
  };
  const field = (labelText, control) => {
    const label = element('label', 'grid-lab-field');
    label.append(element('span', '', labelText), control);
    return label;
  };

  function render() {
    const generatorOpen = root.querySelector('details')?.open || false;
    root.replaceChildren();
    const cols = node.cols || 8;
    const rows = node.rows || 4;
    const lab = node.audioParams?.gridLab || {};
    const header = element('div', 'grid-lab-header');
    header.append(element('h4', '', 'Pattern Lab'), element('span', 'grid-lab-badge', `${rows} × ${cols}`));
    root.append(header);
    if (getSelectedNodes().length > 1) {
      root.append(element('p', 'grid-lab-hint', 'Edits apply to all selected grids. Preview shows the first grid.'));
    }

    const presets = element('div', 'grid-lab-presets');
    Object.entries(GRID_PRESETS).forEach(([key, preset]) => {
      presets.append(button(preset.name, `${preset.name}: ${preset.description}`, () => commit(n => {
        n.grid = makeGridPreset(key, n.rows || 4, n.cols || 8);
      }, `${preset.name} pattern loaded. Mute, solo and chance settings are kept.`), `preset-${key}`));
    });
    root.append(presets);

    const direction = element('select');
    direction.id = `grid-lab-${node.id}-direction`;
    GRID_DIRECTIONS.forEach((value, i) => {
      const option = element('option', '', ['Forward →', 'Reverse ←', 'Ping-pong ↔', 'Random ↝'][i]);
      option.value = value;
      direction.append(option);
    });
    direction.value = lab.direction || 'forward';
    direction.addEventListener('change', () => commit(n => {
      gridLabSettings(n).direction = direction.value;
      resetGridPlayback(n);
    }, 'Playback direction updated. The next trigger starts the new sequence.'));
    root.append(field('Movement', direction));

    const previewScroll = element('div', 'grid-lab-preview-scroll');
    const preview = element('div', 'grid-lab-preview');
    preview.style.gridTemplateColumns = `repeat(${cols}, minmax(18px, 1fr))`;
    preview.setAttribute('role', 'group');
    preview.setAttribute('aria-label', 'Pattern steps');
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const active = !!node.grid?.[r]?.[c];
        const cell = button('', `Row ${r + 1}, step ${c + 1}`, () => commit(n => {
          if (r >= (n.rows || 4) || c >= (n.cols || 8)) return;
          n.grid = copyGrid(n.grid, n.rows || 4, n.cols || 8);
          n.grid[r][c] = !active;
        }, `Row ${r + 1}, step ${c + 1} ${active ? 'off' : 'on'}.`), `cell-${r}-${c}`);
        cell.className = 'grid-lab-cell';
        cell.setAttribute('aria-pressed', String(active));
        if (!isGridRowAudible(node, r)) cell.classList.add('is-muted');
        if (c % 4 === 0) cell.classList.add('is-beat');
        preview.append(cell);
      }
    }
    previewScroll.append(preview);
    root.append(previewScroll);

    const transforms = element('div', 'grid-lab-actions');
    transforms.append(
      button('←', 'Shift pattern left', () => commit(n => { n.grid = rotateGrid(n.grid, -1); }, 'Pattern shifted one step left.'), 'left'),
      button('→', 'Shift pattern right', () => commit(n => { n.grid = rotateGrid(n.grid, 1); }, 'Pattern shifted one step right.'), 'right'),
      button('Vary', 'Move one hit per row, keeping the same density', () => commit(n => { n.grid = mutateGrid(n.grid); }, 'Variation created. The number of hits stays the same.'), 'vary'),
      button('Clear', 'Clear the pattern steps', () => commit(n => { n.grid = copyGrid([], n.rows || 4, n.cols || 8); }, 'Pattern cleared. Use Undo to bring it back.'), 'clear'),
    );
    root.append(transforms);

    const mixer = element('div', 'grid-lab-rows');
    const mixerHeader = element('div', 'grid-lab-row grid-lab-row-heading');
    mixerHeader.append(element('span', '', 'Row'), element('span', '', 'Mute'), element('span', '', 'Solo'), element('span', '', 'Chance'));
    mixer.append(mixerHeader);
    for (let r = 0; r < rows; r++) {
      const settings = getGridRowSettings(node, r);
      const row = element('div', 'grid-lab-row');
      row.append(element('span', 'grid-lab-row-number', String(r + 1).padStart(2, '0')));
      for (const [key, label] of [['mute', 'M'], ['solo', 'S']]) {
        const toggle = button(label, `${key === 'mute' ? 'Mute' : 'Solo'} row ${r + 1}`, () => commit(n => {
          if (r < (n.rows || 4)) setGridRowSettings(n, r, { [key]: !settings[key] });
        }, `Row ${r + 1} ${key} ${settings[key] ? 'off' : 'on'}.`), `${key}-${r}`);
        toggle.setAttribute('aria-pressed', String(settings[key]));
        row.append(toggle);
      }
      const chanceWrap = element('label', 'grid-lab-chance');
      const chance = element('input');
      chance.type = 'range';
      chance.min = '0'; chance.max = '100'; chance.step = '1';
      chance.value = String(Math.round(settings.probability * 100));
      chance.id = `grid-lab-${node.id}-chance-${r}`;
      chance.setAttribute('aria-label', `Trigger chance for row ${r + 1}`);
      const output = element('output', '', `${chance.value}%`);
      chance.addEventListener('input', () => { output.textContent = `${chance.value}%`; });
      chance.addEventListener('change', () => commit(n => {
        if (r < (n.rows || 4)) setGridRowSettings(n, r, { probability: Number(chance.value) / 100 });
      }, `Row ${r + 1} trigger chance: ${chance.value}%.`));
      chanceWrap.append(chance, output);
      row.append(chanceWrap);
      mixer.append(row);
    }
    root.append(mixer);

    const generator = element('details', 'grid-lab-generator');
    generator.open = generatorOpen;
    generator.append(element('summary', '', 'Euclidean row generator'));
    const generatorFields = element('div', 'grid-lab-generator-fields');
    const rowSelect = element('select');
    rowSelect.setAttribute('aria-label', 'Generator row');
    for (let r = 0; r < rows; r++) {
      const option = element('option', '', String(r + 1)); option.value = String(r); rowSelect.append(option);
    }
    rowSelect.value = String(targetRow);
    rowSelect.addEventListener('change', () => { targetRow = Number(rowSelect.value); });
    const hitsInput = element('input');
    hitsInput.type = 'number'; hitsInput.min = '0'; hitsInput.max = String(cols); hitsInput.value = String(Math.min(hits, cols));
    hitsInput.addEventListener('input', () => { hits = Math.max(0, Math.min(cols, Math.round(Number(hitsInput.value) || 0))); });
    const rotationInput = element('input');
    rotationInput.type = 'number'; rotationInput.min = '0'; rotationInput.max = String(cols - 1); rotationInput.value = String(rotation % cols);
    rotationInput.addEventListener('input', () => { rotation = Math.max(0, Math.min(cols - 1, Math.round(Number(rotationInput.value) || 0))); });
    generatorFields.append(field('Row', rowSelect), field('Hits', hitsInput), field('Rotate', rotationInput));
    generator.append(generatorFields, button('Generate row', 'Generate evenly spaced hits on the selected row', () => commit(n => {
      if (targetRow >= (n.rows || 4)) return;
      n.grid = copyGrid(n.grid, n.rows || 4, n.cols || 8);
      n.grid[targetRow] = euclideanRow(n.cols || 8, hits, rotation);
    }, `Euclidean rhythm generated on row ${targetRow + 1}.`), 'generate'));
    root.append(generator);

    const slotHeading = element('div', 'grid-lab-slot-heading');
    slotHeading.append(element('span', '', 'Pattern memory'), element('small', '', 'Steps · movement · row settings'));
    root.append(slotHeading);
    const slots = element('div', 'grid-lab-slots');
    for (let i = 0; i < 4; i++) {
      const name = 'ABCD'[i];
      const slot = element('div', 'grid-lab-slot');
      const exists = !!lab.slots?.[i];
      const recall = button(name, `Recall pattern ${name}`, () => commit(n => { recallGridSlot(n, i); }, `Pattern ${name} recalled where saved, fitted to the current grid size.`), `recall-${i}`);
      recall.disabled = !getSelectedNodes().some(n => n.audioParams?.gridLab?.slots?.[i]);
      recall.classList.toggle('is-stored', exists);
      const store = button('Save', `Save current pattern to ${name}`, () => commit(n => { storeGridSlot(n, i); }, `Pattern ${name} saved. Click ${name} to recall it. Undo also restores overwritten slots.`), `store-${i}`);
      slot.append(recall, store);
      slots.append(slot);
    }
    root.append(slots);
    const status = element('p', 'grid-lab-status', message);
    status.setAttribute('role', 'status');
    root.append(status);
    instrumentControls(root);
  }

  render();
  return root;
}
