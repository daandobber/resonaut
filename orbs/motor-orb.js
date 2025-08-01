import { stepAngle } from '../utils/gearMechanics.js';
import { motorOrbPanel, motorOrbPanelContent } from '../utils/domElements.js';
import { getScreenCoords } from '../main.js';

export const MOTOR_ORB_TYPE = 'motor_orb';

export const DEFAULT_MOTOR_PARAMS = {
  speed: 1,
};

export function updateMotorOrb(node, dt) {
  const speed = node.audioParams?.speed ?? DEFAULT_MOTOR_PARAMS.speed;
  node.angle = stepAngle(node.angle || 0, speed, dt);
}


export function positionMotorOrbPanel(node) {
  if (!motorOrbPanel) return;
  const coords = getScreenCoords(node.x, node.y);
  const offsetX = 80;
  motorOrbPanel.style.position = 'fixed';
  motorOrbPanel.style.left = `${coords.x + offsetX}px`;
  motorOrbPanel.style.top = `${coords.y}px`;
  motorOrbPanel.style.right = 'auto';
  motorOrbPanel.style.transform = 'translate(0, -50%)';
}

export function showMotorOrbPanel(node) {
  if (!motorOrbPanel) return;
  motorOrbPanel.classList.remove('hidden');
  motorOrbPanel.dataset.nodeId = node.id;
  positionMotorOrbPanel(node);
}

export function hideMotorOrbPanel() {
  if (motorOrbPanel) motorOrbPanel.classList.add('hidden');
}

export function hideMotorOrbMenu() {
  const existing = document.getElementById('motor-orb-container');
  if (existing) existing.remove();
  if (motorOrbPanelContent) motorOrbPanelContent.innerHTML = '';
}

export function showMotorOrbMenu(node) {
  hideMotorOrbMenu();
  if (!node || node.type !== MOTOR_ORB_TYPE) return;
  showMotorOrbPanel(node);
  if (!motorOrbPanelContent) return;
  const container = document.createElement('div');
  container.id = 'motor-orb-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  motorOrbPanelContent.innerHTML = '';
  motorOrbPanelContent.appendChild(container);

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
  addSlider(`motor-speed-${node.id}`, 'Speed', -10, 10, 0.1, params.speed ?? DEFAULT_MOTOR_PARAMS.speed, 'speed');
}

