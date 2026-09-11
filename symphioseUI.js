import { instrumentControls, syncInstrumentControls } from './utils/instrumentControls.js';
import { SYMPHIOSE_ROLES, SYMPHIOSE_PRESETS, SYMPHIOSE_PROGRESSIONS, SYMPHIOSE_CHORDS, SYMPHIOSE_GROOVES, symphioseContext, symphioseNote } from './utils/symphioseMusic.js';

export function mountSymphioseEditor(node, onChange, { subdivisionOptions = [], getSyncEnabled = () => true } = {}) {
  const section = document.createElement('section');
  section.className = 'symphiose-music-editor';
  const heading = document.createElement('h4');
  heading.textContent = node.audioParams.isQueen ? 'Queen · ensemble conductor' : 'Mind · musical voice';
  const description = document.createElement('p');
  description.textContent = node.audioParams.isQueen
    ? 'Veins connect Minds to this clock and harmony.'
    : 'Connect instruments with Veins. A Queen can supply the harmony.';
  section.append(heading, description);
  const presets = document.createElement('div');
  presets.className = 'symphiose-presets';
  for (const [key, preset] of Object.entries(SYMPHIOSE_PRESETS)) {
    if (node.audioParams.isQueen && ['starlight', 'clave'].includes(key)) continue;
    const button = document.createElement('button');
    button.textContent = preset.label;
    button.dataset.symphiosePreset = key;
    button.addEventListener('click', () => {
      const { label, ...changes } = preset;
      onChange({ chordColor: 'triad', arpDirection: 'up', rhythmStyle: 'euclidean', ...changes });
      refreshControls();
    });
    presets.append(button);
  }
  section.append(presets);
  const controls = [];
  let controlGrid;
  function group(title) {
    const heading = document.createElement('h5'); heading.textContent = title;
    controlGrid = document.createElement('div'); controlGrid.className = 'music-control-grid';
    if (title === 'Music') controlGrid.classList.add('symphiose-musical-controls');
    section.append(heading, controlGrid);
  }
  group('Music');
  function select(label, key, options, numeric = false) {
    const row = document.createElement('label');
    row.textContent = label;
    const input = document.createElement('select');
    input.dataset.symphioseParam = key;
    for (const [value, text] of options) input.add(new Option(text, value));
    input.addEventListener('change', () => { onChange({ [key]: numeric || key === 'barsPerChord' ? Number(input.value) : input.value }); refreshControls(); });
    controls.push([key, input]); row.append(input); controlGrid.append(row);
  }
  select('Musical role', 'musicalRole', SYMPHIOSE_ROLES.map(role => [role, role === 'auto' ? 'Auto' : role.charAt(0).toUpperCase() + role.slice(1)]));
  select('Chord progression', 'progression', Object.entries(SYMPHIOSE_PROGRESSIONS).map(([key, value]) => [key, value.label]));
  select('Cycles per chord', 'barsPerChord', [1, 2, 4, 8].map(n => [String(n), String(n)]));
  select('Chord color', 'chordColor', Object.entries(SYMPHIOSE_CHORDS).map(([key, value]) => [key, value.label]));
  if (!node.audioParams.isQueen) {
    select('Arpeggio direction', 'arpDirection', [['up', 'Up'], ['down', 'Down'], ['pendulum', 'Up and down']]);
    select('Rhythm groove', 'rhythmStyle', Object.entries(SYMPHIOSE_GROOVES).map(([key, value]) => [key, value.label]));
  }
  for (const [key, label, min, max, step] of [
    ['dreamDepth', 'Density', 0, 16, 1], ['variation', 'Phrase variation', 0, 1, 0.05],
    ['focusIntensity', 'Dynamics', 0, 1.4, 0.05],
  ]) {
    const row = document.createElement('label');
    row.className = 'music-number';
    const text = document.createElement('span'); text.textContent = label;
    const output = document.createElement('output');
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.dataset.symphioseParam = key;
    input.addEventListener('input', () => { output.value = input.value; onChange({ [key]: Number(input.value) }, { commit: false }); });
    input.addEventListener('change', () => { onChange({ [key]: Number(input.value) }); refreshControls(); });
    controls.push([key, input, output]); row.append(text, output, input); controlGrid.append(row);
  }
  function number(label, key, min, max, step = 1) {
    const row = document.createElement('label'); row.textContent = label;
    row.className = 'music-number';
    const input = document.createElement('input'); input.type = 'number';
    Object.assign(input, { min, max, step }); input.dataset.symphioseParam = key;
    input.addEventListener('input', () => { if(Number.isFinite(input.valueAsNumber)) onChange({[key]:input.valueAsNumber},{commit:false}); });
    input.addEventListener('change', () => {
      if (Number.isFinite(input.valueAsNumber)) onChange({ [key]: Math.max(min, Math.min(max, step === 1 ? Math.round(input.valueAsNumber) : input.valueAsNumber)) });
      refreshControls();
    });
    controls.push([key, input]); row.append(input); controlGrid.append(row);
  }
  function toggle(label, key) {
    const row = document.createElement('label'); row.className = 'music-toggle';
    const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.symphioseParam = key;
    input.addEventListener('change', () => { onChange({ [key]: input.checked }); refreshControls(); });
    row.append(input, document.createTextNode(label)); controls.push([key, input]); controlGrid.append(row);
  }
  number('Pattern steps', 'consciousnessSpan', 4, 32);
  number('Rotation', 'memoryEcho', 0, 31);
  number('Variation seed', 'imaginationSeed', 1, 100);
  number('Complexity', 'spellComplexity', 1, 5);
  group('Clock');
  toggle('Free timing', 'ignoreGlobalSync');
  select('Sync rate', 'syncSubdivisionIndex', subdivisionOptions.map((opt, i) => [String(i), opt.label]), true);
  number('Free rate · seconds', 'triggerInterval', 0.04, 4, 0.01);
  number('Speed', 'thoughtSpeed', 0.25, 4, 0.25);
  group(node.audioParams.isQueen ? 'Hive & connections' : 'Connections');
  toggle('Find connections', 'isAlive');
  number('Search range', 'searchRadius', 100, 1000, 25);
  number('Searching veins', 'maxFloatingVeins', 1, 6);
  if (node.audioParams.isQueen) {
    toggle('Move the hive', 'moveWithHive');
    select('Formation', 'hiveFormation', ['circle', 'line', 'swarm', 'spiral', 'grid', 'star', 'orbit', 'diamond'].map(v => [v, v[0].toUpperCase() + v.slice(1)]));
    number('Formation size', 'hiveRadius', 200, 1000, 50);
    number('Hive strength', 'commandIntensity', 0, 1.5, 0.05);
    toggle('Pluck vein strings', 'clawsEnabled');
    number('String tension', 'stringTension', 0, 1, 0.05);
    number('String resonance', 'stringResonance', 0, 1, 0.05);
  }
  const status = document.createElement('p'); status.className = 'symphiose-live-status';
  const pattern = document.createElement('div'); pattern.className = 'symphiose-pattern';
  pattern.setAttribute('aria-label', 'Rhythm preview');
  for (let i = 0; i < 16; i++) pattern.append(document.createElement('i'));
  section.append(status, pattern);
  const voices = document.createElement('div'); voices.className = 'symphiose-voices'; section.append(voices);
  function refreshControls() {
    for (const [key, input, output] of controls) {
      const defaults = { progression: 'journey', musicalRole: 'auto', chordColor: 'triad', arpDirection: 'up', rhythmStyle: 'euclidean' };
      if (input.type === 'checkbox') input.checked = !!node.audioParams[key];
      else input.value = node.audioParams[key] ?? defaults[key] ?? 1;
      if (['searchRadius', 'maxFloatingVeins'].includes(key)) input.disabled = !node.audioParams.isAlive;
      if (['stringTension', 'stringResonance'].includes(key)) input.disabled = !node.audioParams.clawsEnabled;
      if (['hiveFormation', 'hiveRadius'].includes(key)) input.disabled = !node.audioParams.moveWithHive;
      if (key === 'syncSubdivisionIndex') input.disabled = !getSyncEnabled() || !!node.audioParams.ignoreGlobalSync;
      if (key === 'triggerInterval') input.disabled = getSyncEnabled() && !node.audioParams.ignoreGlobalSync;
      if (output) output.value = input.value;
    }
    syncInstrumentControls(section);
  }
  refreshControls();
  let snapshot = '';
  function update() {
    if (!section.isConnected) return;
    const life = node.lifeSystem;
    const context = life?.musicalContext || symphioseContext(node.audioParams, 0);
    const role = life?.activeRole || node.audioParams.musicalRole;
    const controller = life?.queenController;
    for (const [key, input] of controls) {
      if (['chordColor', 'progression', 'barsPerChord'].includes(key)) {
        input.disabled = !!controller;
        input.title = controller ? 'Follows the connected Queen' : '';
        const value = controller ? controller.audioParams[key] : node.audioParams[key];
        if (value != null && input.value !== String(value)) input.value = value;
      }
      if (key === 'syncSubdivisionIndex') input.disabled = !getSyncEnabled() || !!node.audioParams.ignoreGlobalSync;
      if (key === 'triggerInterval') input.disabled = getSyncEnabled() && !node.audioParams.ignoreGlobalSync;
    }
    syncInstrumentControls(section);
    const isPlaying = life?.isGenerating && (!controller || controller.lifeSystem.isGenerating);
    const statusText = `${isPlaying ? 'Playing' : 'Ready'} · cycle ${context.cycle + 1} · chord ${['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'][context.chordDegree % 7]}${controller ? ' · following Queen' : ''}`;
    if (status.textContent !== statusText) status.textContent = statusText;
    [...pattern.children].forEach((dot, index) => {
      const step = Math.floor(index * context.length / 16);
      const hit = !!symphioseNote(node.audioParams, { ...context, step }, 0, 1, role === 'auto' ? undefined : role);
      const current = !!isPlaying && index === Math.floor(context.step * 16 / context.length);
      if (dot.classList.contains('hit') !== hit) dot.classList.toggle('hit', hit);
      if (dot.classList.contains('current') !== current) dot.classList.toggle('current', current);
    });
    const targets = (life?.veins || []).filter(v => v.targetNode && !v.isFloating);
    const next = targets.map(v => `${v.id}:${v.targetNode.type}:${v.lastMusicalEvent?.role || ''}`).join('|');
    if (snapshot !== next || !voices.childNodes.length) {
      snapshot = next; voices.replaceChildren();
      if (!targets.length) voices.textContent = 'No voices yet · use the Vein tool to connect an instrument.';
      targets.forEach(vein => {
        const row = document.createElement('div');
        row.textContent = `${vein.targetNode.type === 'mind' ? 'Mind' : vein.lastMusicalEvent?.role || 'Voice'} · ${vein.targetNode.audioParams?.waveform || vein.targetNode.type}`;
        const disconnect = document.createElement('button'); disconnect.textContent = '×'; disconnect.title = 'Disconnect this vein';
        disconnect.addEventListener('click', () => { node.removeVein(vein.id); onChange({}); });
        row.append(disconnect); voices.append(row);
      });
    }
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
  instrumentControls(section);
  return section;
}
