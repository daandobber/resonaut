# Backup of Multi-Canvas Functionality

This document preserves the removed multi-canvas features, including the canvas manager, switcher, timeline, associated orb, and related sections from `main.js`.

## canvasManager.js

```javascript
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
```

## canvasSwitcher.js

```javascript
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
```

## canvasTimeline.js

```javascript
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
```

## canvas-orb.js

```javascript
import { switchTo } from './canvasManager.js';

export class CanvasReceiveOrb {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.radius = 20;
  }
}

export class CanvasSendOrb {
  constructor(x = 0, y = 0, targetCanvasIndex = 0, receiverId = null) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.targetCanvasIndex = targetCanvasIndex;
    this.receiverId = receiverId;
  }

  checkHit(pulse) {
    const dx = this.x - pulse.x;
    const dy = this.y - pulse.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius + pulse.radius;
  }

  trigger(pulse, receivers = []) {
    switchTo(this.targetCanvasIndex);
    const target = receivers.find(r => r.id === this.receiverId);
    if (target && pulse) {
      pulse.x = target.x;
      pulse.y = target.y;
    }
  }
}
```

## main.js — Removed Sections

```javascript
const CANVAS_SEND_ORB_TYPE = "canvas_orb_send";
const CANVAS_RECEIVE_ORB_TYPE = "canvas_orb_receive";

// createAudioNodesForNode exclusions
        node.type === CANVAS_SEND_ORB_TYPE ||
        node.type === CANVAS_RECEIVE_ORB_TYPE ||

// propagateTrigger handling
    } else if (currentNode.type === CANVAS_SEND_ORB_TYPE) {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = false;
      currentNode.animationState = 1;
      if (typeof currentNode.targetCanvasIndex === "number") {
        switchTo(currentNode.targetCanvasIndex);
      }
      if (currentNode.receiverId) {
        const recv = findNodeById(currentNode.receiverId);
        if (recv) {
          propagateTrigger(
            recv,
            0,
            pulseId + Math.random(),
            currentNode.id,
            hopsRemaining - 1,
            { type: "trigger", data: pulseDataForNextPropagation },
            null,
          );
        }
      }
    } else if (currentNode.type === CANVAS_RECEIVE_ORB_TYPE) {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = true;
      currentNode.animationState = 1;

// node color styling
  } else if (node.type === CANVAS_SEND_ORB_TYPE) {
    fillColor = styles.getPropertyValue("--canvas-orb-send-color").trim();
    borderColor = styles.getPropertyValue("--canvas-orb-send-border").trim();
    glowColor = borderColor;
  } else if (node.type === CANVAS_RECEIVE_ORB_TYPE) {
    fillColor = styles.getPropertyValue("--canvas-orb-receive-color").trim();
    borderColor = styles.getPropertyValue("--canvas-orb-receive-border").trim();
    glowColor = borderColor;

// edit panel for send orb
            } else if (node && node.type === CANVAS_SEND_ORB_TYPE) {
                const section = document.createElement('div');
                section.classList.add('panel-section');
                const targetLabel = document.createElement('label');
                targetLabel.textContent = 'Target Canvas: ';
                targetLabel.htmlFor = `edit-canvas-target-${node.id}`;
                section.appendChild(targetLabel);
                const targetSelect = document.createElement('select');
                targetSelect.id = `edit-canvas-target-${node.id}`;
                canvases.forEach((c, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx;
                    opt.textContent = `Canvas ${idx + 1}`;
                    if (idx === (node.targetCanvasIndex || 0)) opt.selected = true;
                    targetSelect.appendChild(opt);
                });
                targetSelect.addEventListener('change', (e) => {
                    const newIndex = parseInt(e.target.value, 10);
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === CANVAS_SEND_ORB_TYPE) n.targetCanvasIndex = newIndex;
                    });
                    saveState();
                });
                section.appendChild(targetSelect);
                const receiverLabel = document.createElement('label');
                receiverLabel.textContent = ' Receiver:';
                receiverLabel.htmlFor = `edit-canvas-receiver-${node.id}`;
                receiverLabel.style.marginLeft = '10px';
                section.appendChild(receiverLabel);
                const receiverSelect = document.createElement('select');
                receiverSelect.id = `edit-canvas-receiver-${node.id}`;
                const noneOpt = document.createElement('option');
                noneOpt.value = '';
                noneOpt.textContent = 'None';
                if (!node.receiverId) noneOpt.selected = true;
                receiverSelect.appendChild(noneOpt);
                const allReceivers = [];
                nodes.forEach(nd => {
                    if (nd.type === CANVAS_RECEIVE_ORB_TYPE) {
                        allReceivers.push({ node: nd, canvas: getCurrentCanvasIndex ? getCurrentCanvasIndex() : 0 });
                    }
                });
                canvasStates.forEach((state, idx) => {
                    if (!state || !state.nodes) return;
                    state.nodes.forEach(nd => {
                        if (nd.type === CANVAS_RECEIVE_ORB_TYPE) {
                            allReceivers.push({ node: nd, canvas: idx });
                        }
                    });
                });
                allReceivers.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.node.id;
                    opt.textContent = `Canvas ${r.canvas + 1} - Receive #${r.node.id}`;
                    if (r.node.id === node.receiverId) opt.selected = true;
                    receiverSelect.appendChild(opt);
                });
                receiverSelect.addEventListener('change', (e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === CANVAS_SEND_ORB_TYPE) n.receiverId = val;
                    });
                    saveState();
                });
                section.appendChild(receiverSelect);
                fragment.appendChild(section);

// tools menu entries
    {
      icon: "⚡",
      label: "Send Canvas Orb",
      handler: () => setupAddTool(null, CANVAS_SEND_ORB_TYPE, false),
    },
    {
      icon: "🎯",
      label: "Receive Canvas Orb",
      handler: () => setupAddTool(null, CANVAS_RECEIVE_ORB_TYPE, false),
    },

// node creation
  if (type === CANVAS_SEND_ORB_TYPE) {
     newNode.targetCanvasIndex = 0;
     newNode.receiverId = null;
     newNode.audioParams = null;
     visualStyle = "canvas_orb_send";
  } else if (type === CANVAS_RECEIVE_ORB_TYPE) {
     newNode.audioParams = null;
     visualStyle = "canvas_orb_receive";
  }

// canvas switcher toggle
if (canvasSwitcherToggle && canvasSwitcherEl)
  canvasSwitcherToggle.addEventListener("change", (e) => {
    canvasSwitcherEl.classList.toggle("hidden", !e.target.checked);
  });
```

