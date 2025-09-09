import { canvases, switchTo, nextCanvas, prevCanvas, getCurrentIndex, toggleCanvasAudio, isCanvasAudible, getCurrentCanvasType } from './canvasManager.js';

let numberContainer;
let prevBtn;
let nextBtn;

function renderButtons() {
  if (!numberContainer) return;
  numberContainer.innerHTML = '';
  canvases.forEach((c, i) => {
    const container = document.createElement('div');
    container.className = 'canvas-item';
    
    const btn = document.createElement('button');
    btn.className = 'canvas-number-btn';
    btn.textContent = i + 1;
    if (i === getCurrentIndex()) btn.classList.add('active');
    btn.addEventListener('click', () => switchTo(i));
    
    // Add audio toggle button
    const audioBtn = document.createElement('button');
    audioBtn.className = 'canvas-audio-btn';
    audioBtn.textContent = '🔊';
    audioBtn.title = 'Toggle audio for this canvas';
    if (!isCanvasAudible(i)) {
      audioBtn.classList.add('muted');
      audioBtn.textContent = '🔇';
    }
    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCanvasAudio(i);
      renderButtons(); // Refresh to show updated state
    });
    
    // Show canvas type indicator
    const typeIndicator = document.createElement('span');
    typeIndicator.className = 'canvas-type-indicator';
    const canvasType = c.dataset.canvasType || 'freeform';
    typeIndicator.textContent = canvasType === 'musical_staff' ? '♪' : '•';
    typeIndicator.title = `Canvas type: ${canvasType}`;
    
    container.appendChild(btn);
    container.appendChild(audioBtn);
    container.appendChild(typeIndicator);
    numberContainer.appendChild(container);
  });
}

function updateActive() {
  if (!numberContainer) return;
  const canvasItems = numberContainer.children;
  for (let i = 0; i < canvasItems.length; i++) {
    const btn = canvasItems[i].querySelector('.canvas-number-btn');
    if (btn) {
      btn.classList.toggle('active', i === getCurrentIndex());
    }
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
  
  // Add play button for musical staff
  const playBtn = document.createElement('button');
  playBtn.id = 'staffPlayBtn';
  playBtn.innerHTML = '▶️';
  playBtn.title = 'Play/Pause Musical Staff';
  playBtn.style.display = 'none';
  playBtn.addEventListener('click', () => {
    const canvasType = getCurrentCanvasType();
    if (canvasType && canvasType.type === 'musical_staff') {
      canvasType.togglePlayback();
      playBtn.innerHTML = canvasType.isPlaying ? '⏸️' : '▶️';
    }
  });
  container.appendChild(playBtn);
  
  renderButtons();
  updatePlayButton();
  window.addEventListener('canvases-updated', renderButtons);
  window.addEventListener('canvas-switched', () => {
    updateActive();
    updatePlayButton();
  });
}

function updatePlayButton() {
  const playBtn = document.getElementById('staffPlayBtn');
  const canvasType = getCurrentCanvasType();
  
  if (playBtn) {
    if (canvasType && canvasType.type === 'musical_staff') {
      playBtn.style.display = 'block';
      playBtn.innerHTML = canvasType.isPlaying ? '⏸️' : '▶️';
    } else {
      playBtn.style.display = 'none';
    }
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setup);
}
