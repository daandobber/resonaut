import { canvases, addCanvas, switchTo, removeCanvas, moveCanvas, cloneCanvas, getCurrentCanvas } from './canvasManager.js';

let panel;
let listEl;
let toggleBtn;
let closeBtn;
let addBtn;

function refreshList() {
  if (!listEl) return;
  listEl.innerHTML = '';
  canvases.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'canvas-timeline-item';
    item.dataset.index = i;
    if (i === getCurrentIndex()) item.classList.add('active');

    const label = document.createElement('span');
    label.textContent = `Canvas ${i + 1}`;
    item.appendChild(label);

    const selectBtn = document.createElement('button');
    selectBtn.textContent = 'Select';
    selectBtn.addEventListener('click', () => switchTo(i));
    item.appendChild(selectBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      cloneCanvas(i);
    });
    item.appendChild(copyBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Del';
    delBtn.addEventListener('click', () => {
      removeCanvas(i);
    });
    item.appendChild(delBtn);

    const upBtn = document.createElement('button');
    upBtn.textContent = '↑';
    upBtn.addEventListener('click', () => {
      moveCanvas(i, Math.max(0, i - 1));
    });
    item.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.textContent = '↓';
    downBtn.addEventListener('click', () => {
      moveCanvas(i, Math.min(canvases.length - 1, i + 1));
    });
    item.appendChild(downBtn);

    listEl.appendChild(item);
  });
}

function getCurrentIndex() {
  return canvases.indexOf(getCurrentCanvas());
}

export function toggleCanvasTimeline(show) {
  if (!panel) return;
  if (show === undefined) show = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !show);
  if (show) refreshList();
}

function setup() {
  panel = document.getElementById('canvasTimelineView');
  listEl = document.getElementById('canvasTimelineList');
  toggleBtn = document.getElementById('app-menu-canvas-timeline-btn');
  closeBtn = document.getElementById('closeCanvasTimelineBtn');
  addBtn = document.getElementById('addCanvasTimelineBtn');
  if (toggleBtn) toggleBtn.addEventListener('click', () => toggleCanvasTimeline());
  if (closeBtn) closeBtn.addEventListener('click', () => toggleCanvasTimeline(false));
  if (addBtn) addBtn.addEventListener('click', () => {
    addCanvas();
    refreshList();
  });
  window.addEventListener('canvases-updated', refreshList);
  window.addEventListener('canvas-switched', refreshList);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setup);
}
