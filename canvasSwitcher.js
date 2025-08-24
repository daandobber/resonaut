import { canvases, switchTo, nextCanvas, prevCanvas, getCurrentIndex } from './canvasManager.js';

let numberContainer;
let prevBtn;
let nextBtn;

function renderButtons() {
  if (!numberContainer) return;
  numberContainer.innerHTML = '';
  canvases.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'canvas-number-btn';
    btn.textContent = i + 1;
    if (i === getCurrentIndex()) btn.classList.add('active');
    btn.addEventListener('click', () => switchTo(i));
    numberContainer.appendChild(btn);
  });
}

function updateActive() {
  if (!numberContainer) return;
  const children = numberContainer.children;
  for (let i = 0; i < children.length; i++) {
    children[i].classList.toggle('active', i === getCurrentIndex());
  }
}

function setup() {
  const container = document.getElementById('canvasSwitcher');
  if (!container) return;
  numberContainer = container.querySelector('#canvasNumberContainer');
  prevBtn = container.querySelector('#canvasPrevBtn');
  nextBtn = container.querySelector('#canvasNextBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => prevCanvas());
  if (nextBtn) nextBtn.addEventListener('click', () => nextCanvas());
  renderButtons();
  window.addEventListener('canvases-updated', renderButtons);
  window.addEventListener('canvas-switched', updateActive);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setup);
}
