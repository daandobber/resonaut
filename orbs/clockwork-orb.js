import { stepAngle } from '../utils/gearMechanics.js';
import { clockworkOrbPanel, clockworkOrbPanelContent } from '../utils/domElements.js';
import { getScreenCoords } from '../main.js';

export const CLOCKWORK_ORB_TYPE = 'clockwork_orb';

export const DEFAULT_CLOCKWORK_PULSE_STEP = Math.PI / 8;

export const DEFAULT_CLOCKWORK_PARAMS = {
  speed: 0,
  pulseStep: DEFAULT_CLOCKWORK_PULSE_STEP,
};

export const CLOCKWORK_FORCE_DEFAULT = 1.0;
export const CLOCKWORK_DECAY_DEFAULT = 0.2;

export function updateClockworkOrb(node, dt) {
  const speed = node.audioParams?.speed ?? DEFAULT_CLOCKWORK_PARAMS.speed;
  let angle = stepAngle(node.angle || 0, speed, dt);

  if (node.pulseAdvanceRemaining) {
    const force = node.pulseForce || CLOCKWORK_FORCE_DEFAULT;
    const decay = node.pulseDecay || CLOCKWORK_DECAY_DEFAULT;
    const pushFrac = (dt * force) / decay;
    let step = pushFrac * node.pulseAdvanceRemaining;
    if (Math.abs(step) >= Math.abs(node.pulseAdvanceRemaining)) {
      step = node.pulseAdvanceRemaining;
      node.pulseAdvanceRemaining = 0;
    } else {
      node.pulseAdvanceRemaining -= step;
    }
    angle = stepAngle(angle, step, 1);
  }

  node.angle = angle;
}

export function advanceClockworkOrb(node) {
  const step = node.audioParams?.pulseStep ?? DEFAULT_CLOCKWORK_PULSE_STEP;
  node.pulseAdvanceRemaining = (node.pulseAdvanceRemaining || 0) + step;
}

export function positionClockworkOrbPanel(node) {
  if (!clockworkOrbPanel) return;
  const coords = getScreenCoords(node.x, node.y);
  const offsetX = 80;
  clockworkOrbPanel.style.position = 'fixed';
  clockworkOrbPanel.style.left = `${coords.x + offsetX}px`;
  clockworkOrbPanel.style.top = `${coords.y}px`;
  clockworkOrbPanel.style.right = 'auto';
  clockworkOrbPanel.style.transform = 'translate(0, -50%)';
}

export function showClockworkOrbPanel(node) {
  if (!clockworkOrbPanel) return;
  clockworkOrbPanel.classList.remove('hidden');
  clockworkOrbPanel.dataset.nodeId = node.id;
  positionClockworkOrbPanel(node);
}

export function hideClockworkOrbPanel() {
  if (clockworkOrbPanel) clockworkOrbPanel.classList.add('hidden');
}

export function hideClockworkOrbMenu() {
  const existing = document.getElementById('clockwork-orb-container');
  if (existing) existing.remove();
  if (clockworkOrbPanelContent) clockworkOrbPanelContent.innerHTML = '';
}

export function showClockworkOrbMenu(node) {
  hideClockworkOrbMenu();
  if (!node || node.type !== CLOCKWORK_ORB_TYPE) return;
  showClockworkOrbPanel(node);
  if (!clockworkOrbPanelContent) return;
  const container = document.createElement('div');
  container.id = 'clockwork-orb-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  clockworkOrbPanelContent.innerHTML = '';
  clockworkOrbPanelContent.appendChild(container);

  const addSlider = (id, label, min, max, step, val, prop, fmt = v => v.toFixed(2)) => {
    const wrap = document.createElement('div');
    wrap.className = 'mixer-control-item';
    const lab = document.createElement('label');
    lab.textContent = label;
    lab.htmlFor = id;
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.id = id;
    inp.min = min;
    inp.max = max;
    inp.step = step;
    inp.value = val;
    const span = document.createElement('span');
    span.textContent = fmt(val);
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);
      span.textContent = fmt(v);
      node.audioParams[prop] = v;
    });
    wrap.appendChild(lab);
    wrap.appendChild(inp);
    wrap.appendChild(span);
    container.appendChild(wrap);
  };

  const params = node.audioParams || {};
  addSlider(`clockwork-speed-${node.id}`, 'Speed', -10, 10, 0.1, params.speed ?? DEFAULT_CLOCKWORK_PARAMS.speed, 'speed');
  addSlider(`clockwork-step-${node.id}`, 'Step', 0.01, 1, 0.01, params.pulseStep ?? DEFAULT_CLOCKWORK_PULSE_STEP, 'pulseStep');
}

