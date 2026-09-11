import { instrumentControls, syncInstrumentControls } from './utils/instrumentControls.js';
import { PATTERN_ORBS, ORBIT_RHYTHM_TYPE, CHORD_ORB_TYPE, ARP_ORB_TYPE, ACID_ORB_TYPE, patternDefaults, patternState, rhythmHit, resetPattern, randomizePattern } from './utils/patternOrbs.js';

export function buildPatternOrbEditor(node, { onChange, onStep, subdivisionOptions, getSyncEnabled = () => true }) {
  const p = node.audioParams, melodic = node.type !== ORBIT_RHYTHM_TYPE;
  const defaults = patternDefaults(node.type);
  for (const [key, value] of Object.entries(defaults)) if (p[key] == null) p[key] = value;
  p.steps = defaults.steps.map((step, i) => ({ ...step, ...p.steps[i] }));
  const section = document.createElement('section'); section.className = 'pattern-orb-editor';
  const heading = document.createElement('h4'); heading.textContent = PATTERN_ORBS.find(item => item.type === node.type)?.label;
  const help = document.createElement('p');
  help.textContent = melodic ? 'Edit notes directly. Tap a step number to mute it.' : 'Tap steps to change the rhythm. Hits and rotation generate the starting pattern.';
  if (node.type === CHORD_ORB_TYPE) help.textContent = 'Connect to a sound orb to play chords. Edit roots below; incoming notes set the base. Strum spreads the notes in time.';
  if (node.type === ARP_ORB_TYPE) help.textContent = 'Your note sequence climbs through the octaves. Incoming notes set its base. Tap a step number to mute it.';
  section.append(heading, help);
  if (node.type === ACID_ORB_TYPE) help.textContent = 'Acid bass with its own voice. Accent opens the filter; Slide bends into this note. Connect flowers to send them the melody too.';
  const settings = document.createElement('div'); settings.className = 'music-control-grid';
  const controls = [];
  function select(label, key, options, numeric = false) {
    const row = document.createElement('label'); row.textContent = label;
    const input = document.createElement('select'); input.dataset.patternParam = key;
    options.forEach(([value, text]) => input.add(new Option(text, String(value))));
    input.addEventListener('change', () => {
      p[key] = numeric ? Number(input.value) : ['advanceOnPulse', 'openVoicing', 'acidSound'].includes(key) ? input.value === 'true' : input.value;
      resetPattern(node); onChange(); refresh();
    });
    controls.push([key, input]); row.append(input); settings.append(row);
  }
  function number(label, key, min, max, step = 1) {
    const row = document.createElement('label'); row.textContent = label;
    const input = document.createElement('input'); input.type = 'number';
    input.min = min; input.max = max; input.step = step; input.dataset.patternParam = key;
    input.addEventListener('input', () => { if(key !== 'length' && Number.isFinite(input.valueAsNumber)) p[key] = input.valueAsNumber; });
    input.addEventListener('change', () => {
      if (!Number.isFinite(input.valueAsNumber)) { input.value = p[key]; return; }
      p[key] = Math.min(max, Math.max(min, step === 1 ? Math.round(input.valueAsNumber) : input.valueAsNumber));
      if (key === 'length') resetPattern(node);
      onChange(); refresh();
    });
    controls.push([key, input]); row.append(input); settings.append(row);
  }
  select('Clock', 'advanceOnPulse', [[false, 'Internal'], [true, 'Incoming pulses']]);
  number('Steps', 'length', 2, 32);
  select('Sync rate', 'syncSubdivisionIndex', subdivisionOptions.map((item, i) => [i, item.label]), true);
  number('Free rate · seconds', 'triggerInterval', 0.04, 4, 0.01);
  select('Direction', 'direction', [['forward', 'Forward'], ['reverse', 'Reverse'], ['pendulum', 'Back & forth']]);
  if (melodic) {
    select('Notes', 'noteMode', [['relative', 'Relative to orb'], ['absolute', 'Project scale']]);
    number('Transpose · steps', 'transpose', -14, 14);
  } else {
    number('Hits', 'hits', 0, 32);
    number('Rotation', 'rotation', 0, 31);
    number('Accent every', 'accentEvery', 0, 16);
  }
  if (node.type === CHORD_ORB_TYPE) {
    select('Chord', 'chordShape', [['triad', 'Triad'], ['seventh', 'Seventh'], ['sus2', 'Sus 2'], ['sus4', 'Sus 4'], ['sixth', 'Sixth']]);
    number('Inversion', 'inversion', 0, 3);
    select('Voicing', 'openVoicing', [[false, 'Close'], [true, 'Open']]);
    number('Strum · ms per note', 'strumMs', 0, 150, 5);
  }
  if (node.type === ARP_ORB_TYPE) number('Octaves', 'octaves', 1, 3);
  number('Strength', 'pulseIntensity', 0, 1, 0.05);
  if (node.type === ACID_ORB_TYPE) {
    select('Voice', 'acidSound', [[true,'Acid + note pulses'],[false,'Note pulses only']]);
    select('Wave', 'acidWave', [['sawtooth','Saw'],['square','Square']]);
    number('Cutoff · Hz', 'cutoff', 60, 12000, 20);
    number('Resonance', 'resonance', .1, 14, .1);
    number('Filter sweep · octaves', 'envDepth', 0, 6, .1);
    number('Decay · seconds', 'acidDecay', .04, 1.5, .01);
    number('Gate', 'gate', .1, 1, .05);
    number('Slide · ms', 'slideMs', 10, 200, 5);
  }
  number('Chance', 'probability', 0, 1, 0.05);
  number('Variation seed', 'seed', 1, 9999);
  section.append(settings);
  const toolbar = document.createElement('div'); toolbar.className = 'pattern-actions';
  function button(label, action) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.addEventListener('click', action); toolbar.append(b);
  }
  button('Step', onStep);
  button('Restart', () => resetPattern(node));
  if (!melodic) button('Clear overrides', () => { p.rhythmOverrides = {}; onChange(); refresh(); });
  else {
    button('Reverse notes', () => {
      p.steps = [...p.steps.slice(0, p.length).reverse(), ...p.steps.slice(p.length)]; onChange(); refresh();
    });
    button('Random', () => { randomizePattern(node); onChange(); refresh(); });
  }
  const grid = document.createElement('div'); grid.className = melodic ? 'pattern-note-matrix' : 'pattern-steps';
  grid.setAttribute('aria-label', 'Pattern steps');
  const status = document.createElement('p'); status.className = 'pattern-live-status';
  section.append(toolbar, grid, status);
  function stepButton(i) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.patternStep = i;
    b.dataset.playheadStep = i; b.textContent = i + 1;
    const sync = () => {
      const enabled = melodic ? p.steps[i].enabled : rhythmHit(p, i);
      b.classList.toggle('on', enabled);
      b.setAttribute('aria-pressed', String(enabled));
      b.setAttribute('aria-label', `Step ${i + 1}, ${enabled ? 'on' : 'rest'}`);
    };
    b.addEventListener('click', () => {
      if (melodic) p.steps[i].enabled = !p.steps[i].enabled;
      else p.rhythmOverrides[i] = !rhythmHit(p, i);
      sync(); onChange();
    });
    sync(); return b;
  }
  function refresh() {
    controls.forEach(([key, input]) => {
      input.value = String(p[key]);
      if (key === 'syncSubdivisionIndex') input.disabled = p.advanceOnPulse || !getSyncEnabled() || p.ignoreGlobalSync;
      if (key === 'triggerInterval') input.disabled = p.advanceOnPulse || (getSyncEnabled() && !p.ignoreGlobalSync);
    });
    grid.replaceChildren();
    syncInstrumentControls(section);
    if (!melodic) {
      for (let i = 0; i < p.length; i++) grid.append(stepButton(i));
      return;
    }
    for (let start = 0; start < p.length; start += 8) {
      const table = document.createElement('table');
      table.setAttribute('aria-label', `Steps ${start + 1}–${Math.min(start + 8, p.length)}`);
      const header = table.createTHead().insertRow();
      const name = document.createElement('th'); name.textContent = 'Step'; header.append(name);
      for (let i = start; i < Math.min(start + 8, p.length); i++) {
        const th = document.createElement('th'); th.append(stepButton(i)); header.append(th);
      }
      const body = table.createTBody();
      for (const [key, label, min, max, factor] of [['degree', 'Note', -14, 14, 1], ['velocity', 'Vol %', 0, 100, 100], ['probability', 'Chance %', 0, 100, 100]]) {
        const row = body.insertRow(); const th = document.createElement('th'); th.scope = 'row'; th.textContent = label; row.append(th);
        for (let i = start; i < Math.min(start + 8, p.length); i++) {
          const td = row.insertCell(); td.dataset.playheadStep = i;
          const input = document.createElement('input'); input.type = 'number'; input.min = min; input.max = max; input.step = 1;
          input.value = Math.round(p.steps[i][key] * factor); input.dataset.stepParam = key; input.dataset.stepIndex = i;
          input.setAttribute('aria-label', `Step ${i + 1} ${label}`);
          input.addEventListener('input', () => {
            if (Number.isFinite(input.valueAsNumber)) p.steps[i][key] = Math.max(min, Math.min(max, Math.round(input.valueAsNumber))) / factor;
          });
          input.addEventListener('change', () => {
            if (Number.isFinite(input.valueAsNumber)) p.steps[i][key] = Math.max(min, Math.min(max, Math.round(input.valueAsNumber))) / factor;
            input.value = Math.round(p.steps[i][key] * factor); onChange();
          });
          td.append(input);
        }
      }
      if (node.type === ACID_ORB_TYPE) for (const key of ['accent','slide']) {
        const row=body.insertRow(),th=document.createElement('th');th.scope='row';th.textContent=key==='accent'?'Accent':'Slide';row.append(th);
        for(let i=start;i<Math.min(start+8,p.length);i++) {
          const td=row.insertCell(),input=document.createElement('input');input.type='checkbox';input.checked=!!p.steps[i][key];
          input.dataset.stepParam=key;input.dataset.stepIndex=i;input.setAttribute('aria-label',`Step ${i+1} ${key}`);
          input.addEventListener('change',()=>{p.steps[i][key]=input.checked;onChange();});td.append(input);
        }
      }
      grid.append(table);
    }
    instrumentControls(grid);
  }
  refresh();
  function update() {
    if (!section.isConnected) return;
    const state = patternState(node);
    controls.forEach(([key, input]) => {
      if (key === 'syncSubdivisionIndex') input.disabled = p.advanceOnPulse || !getSyncEnabled() || p.ignoreGlobalSync;
      if (key === 'triggerInterval') input.disabled = p.advanceOnPulse || (getSyncEnabled() && !p.ignoreGlobalSync);
    });
    syncInstrumentControls(section);
    const text = `Step ${state.step + 1} / ${p.length} · ${p.advanceOnPulse ? 'Incoming pulses' : 'Internal clock'}`;
    if (status.textContent !== text) status.textContent = text;
    grid.querySelectorAll('[data-playhead-step]').forEach(el => {
      const current = Number(el.dataset.playheadStep) === state.step;
      if (el.classList.contains('current') !== current) el.classList.toggle('current', current);
    });
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
  instrumentControls(section);
  // Keep choices together and knobs in uninterrupted rows, rather than leaving
  // empty cells between clock, direction and sound controls.
  const settingsRows=[...settings.children];
  settings.append(...settingsRows.filter(row=>row.querySelector('select')),...settingsRows.filter(row=>!row.querySelector('select')));
  return section;
}
