import { instrumentControls, syncInstrumentControls } from './utils/instrumentControls.js';
import { TAPE_PRESETS } from './utils/tapeAudio.js';

export function mountTapeStudio(panel, onChange, onExport) {
  if (!panel) return null;
  panel.querySelectorAll('.cassette-controls button').forEach(button => { button.dataset.dynamicLabel = 'true'; });
  panel.querySelector('.cassette-top-label').innerHTML = '<span class="cassette-side" aria-label="Selected tape track">1</span><span class="cassette-model">TAPE</span>';
  const shell = panel.querySelector('.cassette-main-body');
  const loopControls = panel.querySelector('.cassette-loop-controls');
  for (const selector of ['.tape-track-controls', '.cassette-tape-visual-container', '.cassette-zoom-controls', '.cassette-bottom-label']) {
    panel.insertBefore(shell.querySelector(selector), loopControls);
  }
  const slider = panel.querySelector('#tapeLoopSpeedSlider');
  panel.querySelectorAll('.reel').forEach(reel => {
    reel.innerHTML = `<svg viewBox="0 0 112 112" aria-hidden="true" fill="none">
      <circle cx="56" cy="56" r="54"/><circle cx="56" cy="56" r="16"/>
      <circle cx="56" cy="56" r="10"/><circle cx="56" cy="56" r="3"/>
      <path d="M56 10v27 M96 79L73 66 M16 79L39 66 M45 42l6-4 M74 54l-1 7 M48 72l-5-5"/>
    </svg>`;
  });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  path.setAttribute('viewBox', '0 0 340 210');
  path.setAttribute('class', 'tape-line-path');
  path.setAttribute('aria-hidden', 'true');
  path.innerHTML = `<g fill="none" stroke="currentColor" stroke-width="1.4">
    <path d="M45 138L72 174L109 176L170 183L232 176L267 174L294 138"/>
    <circle cx="72" cy="174" r="5"/><circle cx="109" cy="176" r="8"/>
    <circle cx="232" cy="176" r="8"/><circle cx="267" cy="174" r="5"/>
    <path d="M105 176h8 M232 172v8 M164 175h12v15h-12z M170 164v-12"/>
    <path class="tape-line-guide" d="M12 201h316 M28 196v5 M80 196v5 M132 196v5 M184 196v5 M236 196v5 M288 196v5"/>
    <path class="tape-line-accent" d="M170 189v19"/>
  </g>`;
  panel.querySelector('.cassette-reels').append(path);
  slider.min = '-2';
  slider.max = '2';
  slider.step = '0.05';
  slider.setAttribute('aria-label', 'Tape transport: reverse, stop, forward');
  slider.title = 'Left: reverse · Center: stop · Right: forward';
  const speed = panel.querySelector('.cassette-speed-controls');
  const ticks = document.createElement('div');
  ticks.className = 'tape-speed-ticks';
  ticks.innerHTML = '<span>◀ REV 2×</span><span>0 / STOP</span><span>FWD 2× ▶</span>';
  speed.append(ticks);
  panel.querySelector('#tapeLoopResetSpeedBtn').textContent = '▶ 1×';
  panel.querySelector('#tapeLoopResetSpeedBtn').title = 'Normal forward speed';
  const studio = document.createElement('div');
  studio.className = 'tape-studio';
  studio.innerHTML = `
    <div class="tape-studio-heading"><span>TAPE CHARACTER</span><span>4 TRACKS · STEREO</span></div>
    <div class="tape-presets" role="group" aria-label="Tape character presets">
      <button type="button" data-preset="clean">Clean</button>
      <button type="button" data-preset="warm">Warm</button>
      <button type="button" data-preset="worn">Worn</button>
    </div>
    <label>Warmth <input aria-label="Tape warmth" data-setting="warmth" type="range" min="0" max="1" step="0.01"><output></output></label>
    <label>Tone <input aria-label="Tape tone" data-setting="tone" type="range" min="0" max="1" step="0.01"><output></output></label>
    <label>Drift <input aria-label="Tape drift" data-setting="drift" type="range" min="0" max="1" step="0.01"><output></output></label>
    <label class="tape-length-choice">Record length <select id="tapeRecordBars" aria-label="Tape record length">
      <option value="0">Seconds (above)</option><option value="1">1 bar · 4 beats</option><option value="2">2 bars · 8 beats</option><option value="4">4 bars · 16 beats</option><option value="8">8 bars · 32 beats</option>
    </select></label>
    <p class="tape-studio-hint">Record the live mix onto the selected track. Record again to finish and loop; Stop keeps the take. Play runs all recorded tracks. Sync follows the project tempo.</p>`;
  const details = document.createElement('details');
  details.className = 'tape-character-drawer';
  const summary = document.createElement('summary');
  summary.textContent = 'Sound & recording';
  details.append(summary, studio);
  panel.append(details);
  const exportButton = document.createElement('button');
  exportButton.id = 'tapeLoopExportBtn';
  exportButton.className = 'tape-export-button';
  exportButton.textContent = 'Export take · WAV';
  exportButton.title = 'Download the selected loop at its original recorded speed, without tape effects';
  exportButton.addEventListener('click', () => onExport?.());
  panel.querySelector('.cassette-controls').append(exportButton);
  studio.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => onChange({ ...TAPE_PRESETS[button.dataset.preset] })));
  studio.querySelectorAll('[data-setting]').forEach(input => input.addEventListener('input', () => onChange({ [input.dataset.setting]: Number(input.value) })));
  instrumentControls(panel);
  return {
    update(settings, busy, tracks, selected) {
      exportButton.disabled = busy || !tracks[selected].buffer;
      panel.querySelector('.cassette-side').textContent = selected + 1;
      studio.querySelectorAll('[data-setting]').forEach(input => {
        input.value = settings[input.dataset.setting];
        input.nextElementSibling.textContent = `${Math.round(Number(input.value) * 100)}%`;
      });
      studio.querySelectorAll('[data-preset]').forEach(button => {
        const active = Object.entries(TAPE_PRESETS[button.dataset.preset]).every(([key, value]) => Math.abs(settings[key] - value) < 0.001);
        button.setAttribute('aria-pressed', String(active));
      });
      studio.querySelector('select').disabled = busy;
      syncInstrumentControls(panel);
      panel.querySelectorAll('.tape-track-btn').forEach((button, i) => {
        button.disabled = busy;
        button.classList.toggle('has-take', !!tracks[i].buffer);
        button.classList.toggle('active', i === selected);
        button.setAttribute('aria-pressed', String(i === selected));
        button.title = `Track ${i + 1} · ${tracks[i].buffer ? 'Recorded' : 'Empty'}`;
      });
    },
  };
}
