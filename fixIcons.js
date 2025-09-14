// Replace emoji/glyphs in button labels with plain text, keeping CSS SVG icons.
const LABELS = {
  'app-menu-play-pause-btn': '',
  'app-menu-stop-btn': '',
  'metronomeToggleBtn': '',
  'toggleInfoTextBtn': 'Info',
  'app-menu-record-btn': '',
  'app-menu-toggle-tape-looper-btn': '',
  'app-menu-performance-btn': '',
  'app-menu-help-btn': '?',
  'mixerToggleBtn': 'Mixer',
  'app-menu-enter-ufo-mode': 'UFO Mode',
  // Left toolbar - remove text labels to show only icons
  'instrumentsMenuBtn': '',
  'connectionsMenuBtn': '',
  'toolsMenuBtn': '',
  'symphioseMenuBtn': '',
  'mistMenuBtn': '',
  'dronesMenuBtn': '',
  'motionMenuBtn': '',
  'brushBtn': '',
  'editBtn': '',
  'wandBtn': '',
  'deleteBtn': '',
  'hamburgerBtn': '',
  // Logic adders - remove text labels to show only icons
  'addPulsarBtn': '',
  'addGridSequencerBtn': '',
  'addTimelineGridBtn': '',
  'addRadarBtn': '',
  'addMeteorShowerBtn': '',
  // Tape looper controls
  'tapeLoopRecordBtn': '',
  'tapeLoopPlayBtn': '',
  'tapeLoopStopBtn': '',
  'tapeLoopClearBtn': '',
  'canvasNextBtn': '',
};

const ICONS = {
  'app-menu-play-pause-btn': '<path d="M8 5v14l11-7z"/>',
  'app-menu-stop-btn': '<rect x="5" y="5" width="14" height="14"/>',
  'app-menu-record-btn': '<circle cx="12" cy="12" r="7"/>',
  'app-menu-toggle-tape-looper-btn': '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>',
  'app-menu-performance-btn': '<path d="M10 4h2v16h-2V4zm7 6h2v10h-2V10zM3 14h2v6H3v-6z"/>',
  'app-menu-help-btn': '<circle cx="12" cy="12" r="10"/><rect x="11" y="10" width="2" height="7"/><rect x="11" y="7" width="2" height="2"/>',
  'metronomeToggleBtn': '<path d="M8 20h8l2-6-6-10-6 10 2 6z"/>',
  'app-menu-enter-ufo-mode': '<path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm8 8a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM4 11a1 1 0 0 1-1-1 1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H4zm3-7a1 1 0 0 1 0 1.414L5.586 6.828a1 1 0 0 1-1.414-1.414L5.586 4a1 1 0 0 1 1.414 0z"/>',
  'toolsMenuBtn': '<path d="M22 19l-6.3-6.3A5 5 0 0 1 7 4l3 3-3 3-3-3a5 5 0 0 0 8.7 3.7L19 22l3-3z"/>',
  'instrumentsMenuBtn': '<path d="M9 19a3 3 0 1 1 0-6c.7 0 1.3.2 1.8.5V5h8v2h-6v10a3 3 0 0 1-3 2.9z"/>',
  'connectionsMenuBtn': '<path d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 1 0 0 6h3v2h-3a5 5 0 0 1-5-5zm11.2-5h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 1 0 0-6h-3V7z"/>',
  'symphioseMenuBtn': '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>',
  'mistMenuBtn': '<path d="M6.5 20q-2.28 0-3.89-1.57T1 14.58q0-1.95 1.17-3.48t3.03-1.9q.63-2.3 2.5-3.72T12 4q2.93 0 4.96 2.04T19 11q1.73.2 2.86 1.5T23 15.5q0 1.87-1.31 3.19T18.5 20H6.5z"/>',
  'brushBtn': '<path d="M7 16c-1.7 0-3 1.3-3 3v2h6v-2c0-1.7-1.3-3-3-3zm12.7-9.3l-2.4-2.4a1 1 0 0 0-1.4 0L8 10.2V14h3.8l7.9-7.9a1 1 0 0 0 0-1.4z"/>',
  'editBtn': '<path d="M3 3l7 18 2-7 7-2L3 3z"/>',
  'wandBtn': '<path d="M2 22l8-8 2 2-8 8H2zm14-14l2-2 2 2-2 2-2-2zM9 5l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
  'deleteBtn': '<path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/>',
  'dronesMenuBtn': '<path d="M7 3l-4 7 4 7h10l4-7-4-7H7z"/>',
  'motionMenuBtn': '<path d="M12 2l4 4h-3v8H7V6H4l4-4h4zm0 20l-4-4h3v-4h6v4h3l-4 4h-4z"/>',
  'hamburgerBtn': '<path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>',
  'addPulsarBtn': '<path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/>',
  'addGridSequencerBtn': '<path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>',
  'addTimelineGridBtn': '<path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm-1 6h12v12H6V8z"/>',
  'addRadarBtn': '<path d="M12 21a9 9 0 1 1 9-9h-2a7 7 0 1 0-7 7v2zm0-6a3 3 0 1 1 3-3h-2a1 1 0 1 0-1 1v2z"/>',
  'addMeteorShowerBtn': '<path d="M2 12l10 2-2 10 4-8 8-4-10 2-2-10z"/>',
  'tapeLoopRecordBtn': '<circle cx="12" cy="12" r="7"/>',
  'tapeLoopPlayBtn': '<path d="M8 5v14l11-7z"/>',
  'tapeLoopStopBtn': '<rect x="6" y="6" width="12" height="12"/>',
  'tapeLoopClearBtn': '<path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z"/>',
  'canvasNextBtn': '<path d="M8 5v14l11-7z"/>'
};

function stripEmoji(str) {
  // Remove surrogate pairs and misc symbols, leave ASCII and common latin.
  try {
    return str
      // emoji via surrogate pairs
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      // common emoji/symbol range
      .replace(/[\u2600-\u27BF]/g, '')
      // bullets and geometric shapes often used as markers
      .replace(/[\u2022\u25CF\u25CB\u25C9\u25A0\u25AA]/g, '')
      // variation selectors, ZWJ, etc.
      .replace(/[\uFE0F\u200D\u20E3\uFEFF]/g, '')
      .trim();
  } catch { return str; }
}

let _applying = false;
function applyCleanLabels() {
  if (_applying) return; // prevent re-entrancy
  _applying = true;
  Object.entries(LABELS).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (el) {
      if ((el.textContent || '').trim() !== label) {
        el.textContent = label;
      }
      el.classList && el.classList.add('icon-svg');
      // keep title attribute if present
    }
  });
  // Ensure play/pause gets plain text too
  const playBtn = document.getElementById('app-menu-play-pause-btn');
  if (playBtn) {
    const cleanPlay = stripEmoji(playBtn.textContent || '');
    if ((playBtn.textContent || '').trim() !== cleanPlay) {
      playBtn.textContent = cleanPlay || 'Play';
    }
  }
  // Only inject inline SVG icons for buttons that don't have CSS icons
  const cssIconButtons = [
    'app-menu-play-pause-btn', 'app-menu-performance-btn', 'app-menu-stop-btn',
    'app-menu-record-btn', 'app-menu-toggle-tape-looper-btn', 'app-menu-help-btn',
    'metronomeToggleBtn', 'toolsMenuBtn', 'instrumentsMenuBtn', 'connectionsMenuBtn',
    'symphioseMenuBtn', 'mistMenuBtn', 'brushBtn', 'editBtn', 'wandBtn',
    'deleteBtn', 'dronesMenuBtn', 'motionMenuBtn', 'hamburgerBtn',
    'addPulsarBtn', 'addGridSequencerBtn', 'addTimelineGridBtn',
    'addRadarBtn', 'addMeteorShowerBtn'
  ];
  
  Object.entries(ICONS).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.querySelector('span.svg-icon')) return; // don't duplicate
    
    // Skip if this button already has CSS icons
    if (cssIconButtons.includes(id)) return;
    
    const span = document.createElement('span');
    span.className = 'svg-icon';
    span.style.display = 'inline-flex';
    span.style.width = '1em';
    span.style.height = '1em';
    span.style.marginRight = '6px';
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '1em');
    svg.setAttribute('height', '1em');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.fill = 'currentColor';
    const g = document.createElementNS(svgNs, 'g');
    g.innerHTML = path; // trusted static set above
    svg.appendChild(g);
    span.appendChild(svg);
    el.prepend(span);
  });
  // As a fallback, strip any stray emoji on all buttons to avoid mojibake
  document.querySelectorAll('button').forEach((b) => {
    const cleaned = stripEmoji(b.textContent || '');
    // If replacement char present, drop it
    const noReplacement = cleaned.replace(/\uFFFD/g, '').trim();
    if (noReplacement && noReplacement !== (b.textContent || '').trim()) {
      b.textContent = noReplacement || b.textContent;
    }
  });
  _applying = false;
}

if (typeof document !== 'undefined') {
  const run = () => applyCleanLabels();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  // Debounced observer that ignores characterData to avoid feedback loops
  try {
    let scheduled = false;
    const obs = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; applyCleanLabels(); });
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch {}
}
