import { setCanvas } from './utils/domElements.js';

export const canvases = [];
export const canvasStates = [];
let currentIndex = 0;

function dispatchUpdate() {
  window.dispatchEvent(new Event('canvases-updated'));
}

function dispatchSwitch() {
  window.dispatchEvent(new Event('canvas-switched'));
}

export function registerCanvas(canvas) {
  if (!canvas) return;
  canvases.push(canvas);
  canvasStates.push(null);
  canvas.classList.add('song-canvas');
  if (canvases.length === 1) {
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    setCanvas(canvas);
  } else {
    canvas.classList.add('hidden');
    canvas.style.display = 'none';
  }
  dispatchUpdate();
}

export function addCanvas() {
  const container = document.getElementById('canvasContainer');
  if (!container) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'song-canvas hidden';
  canvas.width = container.clientWidth || window.innerWidth;
  canvas.height = container.clientHeight || window.innerHeight;
  container.appendChild(canvas);
  registerCanvas(canvas);
  switchTo(canvases.length - 1);
  return canvas;
}

export function switchTo(index) {
  if (index < 0 || index >= canvases.length) return;
  if (window.saveState && window.getLatestState) {
    window.saveState();
    canvasStates[currentIndex] = window.getLatestState();
  }
  canvases.forEach((c, i) => {
    if (i === index) {
      c.classList.remove('hidden');
      c.style.display = 'block';
    } else {
      c.classList.add('hidden');
      c.style.display = 'none';
    }
  });
  currentIndex = index;
  setCanvas(canvases[currentIndex]);
  const state = canvasStates[currentIndex];
  if (state && window.loadState) {
    window.loadState(state);
  } else if (!state && window.handleNewWorkspace) {
    window.handleNewWorkspace(true);
  }
  dispatchSwitch();
}

export function nextCanvas() {
  if (canvases.length === 0) return;
  let next = (currentIndex + 1) % canvases.length;
  switchTo(next);
}


export function prevCanvas() {
  if (canvases.length === 0) return;
  let prev = (currentIndex - 1 + canvases.length) % canvases.length;
  switchTo(prev);
}

export function getCurrentCanvas() {
  return canvases[currentIndex];
}

export function getCurrentIndex() {
  return currentIndex;
}

export function getCanvasCount() {
  return canvases.length;
}

export function removeCanvas(index) {
  if (index < 0 || index >= canvases.length) return;
  const canvas = canvases.splice(index, 1)[0];
  canvasStates.splice(index, 1);
  if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  if (currentIndex >= index) currentIndex = Math.max(0, currentIndex - 1);
  switchTo(currentIndex);
  dispatchUpdate();
}

export function moveCanvas(from, to) {
  if (from < 0 || from >= canvases.length || to < 0 || to >= canvases.length) return;
  if (from === to) return;
  const canvas = canvases.splice(from, 1)[0];
  const state = canvasStates.splice(from, 1)[0];
  canvases.splice(to, 0, canvas);
  canvasStates.splice(to, 0, state);
  const container = document.getElementById('canvasContainer');
  if (container) {
    container.removeChild(canvas);
    const ref = container.children[to];
    if (ref) container.insertBefore(canvas, ref); else container.appendChild(canvas);
  }
  if (currentIndex === from) currentIndex = to;
  else if (currentIndex > from && currentIndex <= to) currentIndex--;
  else if (currentIndex < from && currentIndex >= to) currentIndex++;
  switchTo(currentIndex);
  dispatchUpdate();
}

export function cloneCanvas(index) {
  if (index < 0 || index >= canvases.length) return null;
  const original = canvases[index];
  const newCanvas = addCanvas();
  if (newCanvas && original) {
    newCanvas.width = original.width;
    newCanvas.height = original.height;
    newCanvas.getContext('2d').drawImage(original, 0, 0);
    canvasStates[canvases.length - 1] = canvasStates[index]
      ? JSON.parse(JSON.stringify(canvasStates[index]))
      : null;
    moveCanvas(canvases.length - 1, index + 1);
  }
  dispatchUpdate();
  return newCanvas;
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.song-canvas').forEach(c => registerCanvas(c));
    const addBtn = document.getElementById('app-menu-add-canvas');
    const nextBtn = document.getElementById('app-menu-next-canvas');
    const prevBtn = document.getElementById('app-menu-prev-canvas');
    if (addBtn) addBtn.addEventListener('click', () => addCanvas());
    if (nextBtn) nextBtn.addEventListener('click', () => nextCanvas());
    if (prevBtn) prevBtn.addEventListener('click', () => prevCanvas());
  });
}
