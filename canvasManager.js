import { setCanvas } from './utils/domElements.js';
import { createCanvasType, CANVAS_TYPES } from './canvasTypes.js';
import { MusicalStaffInterface } from './musicalStaffInterface.js';

export const canvases = [];
export const canvasStates = [];
export const canvasTypes = []; // Store canvas type for each canvas
export const canvasAudioStates = []; // Store whether each canvas is audible
export const staffInterfaces = []; // Store musical staff interfaces
let currentIndex = 0;
let currentStaffInterface = null;

function dispatchUpdate() {
  window.dispatchEvent(new Event('canvases-updated'));
}

function dispatchSwitch() {
  window.dispatchEvent(new Event('canvas-switched'));
}

export function registerCanvas(canvas, canvasType = CANVAS_TYPES.FREEFORM) {
  if (!canvas) return;
  canvases.push(canvas);
  canvasStates.push(null);
  canvasTypes.push(createCanvasType(canvasType));
  canvasAudioStates.push(canvases.length === 1); // First canvas is audible by default
  canvas.classList.add('song-canvas');
  
  // Store canvas type on the element for reference
  canvas.dataset.canvasType = canvasType;
  
  // Create musical staff interface if needed
  if (canvasType === CANVAS_TYPES.MUSICAL_STAFF) {
    const staffInterface = new MusicalStaffInterface(document.body);
    staffInterfaces.push(staffInterface);
  } else {
    staffInterfaces.push(null);
  }
  
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

export function addCanvas(canvasType = CANVAS_TYPES.FREEFORM) {
  const container = document.getElementById('canvasContainer');
  if (!container) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'song-canvas hidden';
  canvas.width = container.clientWidth || window.innerWidth;
  canvas.height = container.clientHeight || window.innerHeight;
  container.appendChild(canvas);
  registerCanvas(canvas, canvasType);
  switchTo(canvases.length - 1);
  return canvas;
}

export function switchTo(index) {
  if (index < 0 || index >= canvases.length) return;
  
  // Hide current staff interface if active
  if (currentStaffInterface) {
    currentStaffInterface.hide();
    currentStaffInterface = null;
  }
  
  if (window.saveState && window.getLatestState) {
    window.saveState();
    canvasStates[currentIndex] = window.getLatestState();
  }
  
  // Show/hide regular canvases and staff interfaces
  canvases.forEach((c, i) => {
    if (i === index) {
      const canvasType = canvasTypes[i];
      if (canvasType && canvasType.type === CANVAS_TYPES.MUSICAL_STAFF) {
        // Hide main canvas and show staff interface
        c.classList.add('hidden');
        c.style.display = 'none';
        
        const staffInterface = staffInterfaces[i];
        if (staffInterface) {
          staffInterface.show();
          currentStaffInterface = staffInterface;
        }
      } else {
        // Show regular canvas
        c.classList.remove('hidden');
        c.style.display = 'block';
      }
    } else {
      c.classList.add('hidden');
      c.style.display = 'none';
      
      // Hide any staff interfaces for non-current canvases
      const staffInterface = staffInterfaces[i];
      if (staffInterface) {
        staffInterface.hide();
      }
    }
  });
  
  currentIndex = index;
  
  // Only set canvas for non-staff canvases
  const currentCanvasType = canvasTypes[currentIndex];
  if (!currentCanvasType || currentCanvasType.type !== CANVAS_TYPES.MUSICAL_STAFF) {
    setCanvas(canvases[currentIndex]);
    const state = canvasStates[currentIndex];
    if (state && window.loadState) {
      window.loadState(state);
    } else if (!state && window.handleNewWorkspace) {
      window.handleNewWorkspace(true);
    }
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
  
  // Clean up staff interface if exists
  const staffInterface = staffInterfaces[index];
  if (staffInterface) {
    staffInterface.destroy();
  }
  
  const canvas = canvases.splice(index, 1)[0];
  canvasStates.splice(index, 1);
  canvasTypes.splice(index, 1);
  canvasAudioStates.splice(index, 1);
  staffInterfaces.splice(index, 1);
  
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
  const canvasType = canvasTypes.splice(from, 1)[0];
  const audioState = canvasAudioStates.splice(from, 1)[0];
  const staffInterface = staffInterfaces.splice(from, 1)[0];
  canvases.splice(to, 0, canvas);
  canvasStates.splice(to, 0, state);
  canvasTypes.splice(to, 0, canvasType);
  canvasAudioStates.splice(to, 0, audioState);
  staffInterfaces.splice(to, 0, staffInterface);
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
  const originalType = canvasTypes[index];
  const newCanvas = addCanvas(originalType.type);
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

// Get canvas type for a specific canvas
export function getCanvasType(index = currentIndex) {
  if (index < 0 || index >= canvasTypes.length) return null;
  return canvasTypes[index];
}

// Get current canvas type
export function getCurrentCanvasType() {
  return getCanvasType(currentIndex);
}

// Toggle audio state for a canvas
export function toggleCanvasAudio(index) {
  if (index < 0 || index >= canvasAudioStates.length) return;
  canvasAudioStates[index] = !canvasAudioStates[index];
  dispatchUpdate();
}

// Set audio state for a canvas
export function setCanvasAudio(index, isAudible) {
  if (index < 0 || index >= canvasAudioStates.length) return;
  canvasAudioStates[index] = isAudible;
  dispatchUpdate();
}

// Check if a canvas is audible
export function isCanvasAudible(index) {
  if (index < 0 || index >= canvasAudioStates.length) return false;
  return canvasAudioStates[index];
}

// Get all audible canvas indices
export function getAudibleCanvases() {
  return canvasAudioStates
    .map((isAudible, index) => isAudible ? index : -1)
    .filter(index => index !== -1);
}

// Get nodes from all audible canvases
export function getAllAudibleNodes() {
  if (typeof window.nodes === 'undefined') return [];
  
  const audibleCanvases = getAudibleCanvases();
  if (audibleCanvases.length <= 1) {
    // If only current canvas or no audible canvases, return current nodes
    return window.nodes || [];
  }
  
  const allAudibleNodes = [];
  
  audibleCanvases.forEach(canvasIndex => {
    if (canvasIndex === currentIndex) {
      // Add current canvas nodes
      if (window.nodes) {
        allAudibleNodes.push(...window.nodes);
      }
    } else {
      // Add nodes from other audible canvases
      const canvasState = canvasStates[canvasIndex];
      if (canvasState && canvasState.nodes) {
        // Mark these nodes with their canvas index for potential filtering
        const nodesWithCanvas = canvasState.nodes.map(node => ({
          ...node,
          _canvasIndex: canvasIndex
        }));
        allAudibleNodes.push(...nodesWithCanvas);
      }
    }
  });
  
  return allAudibleNodes;
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.song-canvas').forEach(c => registerCanvas(c));
    const addBtn = document.getElementById('app-menu-add-canvas');
    const addStaffBtn = document.getElementById('app-menu-add-staff-canvas');
    const nextBtn = document.getElementById('app-menu-next-canvas');
    const prevBtn = document.getElementById('app-menu-prev-canvas');
    if (addBtn) addBtn.addEventListener('click', () => addCanvas());
    if (addStaffBtn) addStaffBtn.addEventListener('click', () => addCanvas(CANVAS_TYPES.MUSICAL_STAFF));
    if (nextBtn) nextBtn.addEventListener('click', () => nextCanvas());
    if (prevBtn) prevBtn.addEventListener('click', () => prevCanvas());
    
    // Make canvas manager data available globally
    if (typeof window !== 'undefined') {
      window.canvasManager = {
        staffInterfaces,
        currentIndex: () => currentIndex,
        getCurrentStaffInterface: () => currentStaffInterface
      };
    }
  });
}
