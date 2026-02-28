// Single source of truth for all button icons.
// Injects inline SVG into every listed button, removes stray emoji.

const LABELS = {
  'app-menu-play-pause-btn':        '',
  'app-menu-stop-btn':              '',
  'app-menu-record-btn':            '',
  'app-menu-toggle-tape-looper-btn':'',
  'app-menu-performance-btn':       '',
  'app-menu-help-btn':              '',
  'metronomeToggleBtn':             '',
  'toggleInfoTextBtn':              'Info',
  'instrumentsMenuBtn':             '',
  'connectionsMenuBtn':             '',
  'toolsMenuBtn':                   '',
  'symphioseMenuBtn':               '',
  'mistMenuBtn':                    '',
  'dronesMenuBtn':                  '',
  'motionMenuBtn':                  '',
  'brushBtn':                       '',
  'editBtn':                        '',
  'wandBtn':                        '',
  'deleteBtn':                      '',
  'hamburgerBtn':                   '',
  'addPulsarBtn':                   '',
  'addGridSequencerBtn':            '',
  'addTimelineGridBtn':             '',
  'addRadarBtn':                    '',
  'addMeteorShowerBtn':             '',
  'addCircleFifthsBtn':             '',
  'addTonnetzBtn':                  '',
  'addGalacticBloomBtn':            '',
  'tapeLoopRecordBtn':              '',
  'tapeLoopPlayBtn':                '',
  'tapeLoopStopBtn':                '',
  'tapeLoopClearBtn':               '',
  'canvasNextBtn':                  '',
};

// SVG inner content for each button. All 24x24 viewBox.
const ICONS = {

  // — Transport controls —
  'app-menu-play-pause-btn':
    '<polygon points="5,3 19,12 5,21" fill="currentColor"/>',

  'app-menu-stop-btn':
    '<rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor"/>',

  'app-menu-record-btn':
    '<circle cx="12" cy="12" r="7" fill="currentColor"/>'
    + '<circle cx="12" cy="12" r="3.5" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>',

  'metronomeToggleBtn':
    '<path d="M12 3 L6 21 H18 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
    + '<line x1="12" y1="8" x2="16.5" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<circle cx="16.5" cy="17" r="1.8" fill="currentColor"/>',

  'app-menu-toggle-tape-looper-btn':
    '<rect x="3" y="6" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="8.5" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    + '<circle cx="15.5" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    + '<path d="M11 13h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M8 6V4h8v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  'app-menu-performance-btn':
    '<rect x="3"  y="13" width="4" height="8"  rx="1" fill="currentColor"/>'
    + '<rect x="10" y="5"  width="4" height="16" rx="1" fill="currentColor"/>'
    + '<rect x="17" y="9"  width="4" height="12" rx="1" fill="currentColor"/>'
    + '<circle cx="5"  cy="11" r="2" fill="currentColor"/>'
    + '<circle cx="12" cy="3"  r="2" fill="currentColor"/>'
    + '<circle cx="19" cy="7"  r="2" fill="currentColor"/>',

  'app-menu-help-btn':
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M9.5 9.5a3 3 0 0 1 5.2 2c0 1.5-1.5 2.2-2.2 2.8-.4.4-.5.8-.5 1.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<circle cx="12" cy="17.5" r="1.2" fill="currentColor"/>',

  // — Right toolbar menus —
  'toolsMenuBtn':
    '<path d="M14.7 3.3a5 5 0 0 0-6.4 6.4L3 15a2.1 2.1 0 0 0 3 3l5.3-5.3A5 5 0 0 0 17.7 6.3l-2.1 2.1-1.7-.5-.5-1.7 2.1-2.1-.8-.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'instrumentsMenuBtn':
    '<path d="M9 18a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M9 12V4l9-2v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'connectionsMenuBtn':
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L11.75 5.19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'symphioseMenuBtn':
    '<path d="M9 17a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M15 14a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M9 12V6l6-1.5V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'mistMenuBtn':
    '<path d="M20 15.5A4.5 4.5 0 0 0 17.5 7H17A8 8 0 1 0 4 14.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M6 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'dronesMenuBtn':
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="2" fill="currentColor"/>',

  'motionMenuBtn':
    '<path d="M12 2v20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M7 7l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M7 17l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  // — Editing tools —
  'brushBtn':
    '<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03L13.1 15.96" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M13.1 15.96C11.5 17.5 10 18.5 8.5 18.5 8.5 20 9.5 21 11 21c0 0-2 1-5 0 0-3 1-4.5 2.5-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  'editBtn':
    '<path d="M4.5 20.5L3 3l17.5 11.5-7.5 1.5-8.5 4.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M13 14.5l2.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'wandBtn':
    '<path d="M3 21l8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M12.5 3l8.5 8.5L12 20 3.5 11.5 12.5 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
    + '<line x1="20" y1="2" x2="21" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="22" y1="6" x2="19" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'deleteBtn':
    '<path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M8 6V4h8v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'hamburgerBtn':
    '<line x1="3" y1="6"  x2="21" y2="6"  stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
    + '<line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
    + '<line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',

  // — Sequencer / add buttons —
  'addPulsarBtn':
    '<polygon points="12,2 14.9,8.2 21.7,9.3 16.8,14.1 18,21 12,17.8 6,21 7.2,14.1 2.3,9.3 9.1,8.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',

  'addGridSequencerBtn':
    '<rect x="3"  y="3"  width="7" height="7" rx="1" fill="currentColor"/>'
    + '<rect x="14" y="3"  width="7" height="7" rx="1" fill="currentColor"/>'
    + '<rect x="3"  y="14" width="7" height="7" rx="1" fill="currentColor"/>'
    + '<rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.45"/>',

  'addTimelineGridBtn':
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<line x1="3"  y1="9"  x2="21" y2="9"  stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="3"  y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="9"  y1="9"  x2="9"  y2="21" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="15" y1="9"  x2="15" y2="21" stroke="currentColor" stroke-width="1.5"/>'
    + '<rect x="5" y="5" width="3" height="3" rx="0.5" fill="currentColor"/>'
    + '<rect x="16" y="5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>',

  'addRadarBtn':
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="6"  fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="2"  fill="currentColor"/>'
    + '<line x1="12" y1="12" x2="19.5" y2="6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'addMeteorShowerBtn':
    '<path d="M2 22 L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M22 2 L14 6 L18 10 Z" fill="currentColor"/>'
    + '<line x1="6"  y1="18" x2="4"  y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    + '<line x1="10" y1="14" x2="8"  y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    + '<line x1="14" y1="10" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  // Circle of Fifths — concentric circles with 6 outer dots (the 12 key positions)
  'addCircleFifthsBtn':
    '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    + '<circle cx="12" cy="12" r="1.5" fill="currentColor"/>'
    + '<circle cx="12"  cy="2.5"  r="1.5" fill="currentColor"/>'
    + '<circle cx="20.7" cy="7"   r="1.5" fill="currentColor"/>'
    + '<circle cx="20.7" cy="17"  r="1.5" fill="currentColor"/>'
    + '<circle cx="12"  cy="21.5" r="1.5" fill="currentColor"/>'
    + '<circle cx="3.3"  cy="17"  r="1.5" fill="currentColor"/>'
    + '<circle cx="3.3"  cy="7"   r="1.5" fill="currentColor"/>',

  // Tonnetz — three interlocked triangles / hexagonal lattice
  'addTonnetzBtn':
    '<path d="M12 3 L20 17 H4 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
    + '<path d="M4 17 L12 3 L20 17" fill="none" stroke="currentColor" stroke-width="0"/>'
    + '<line x1="12" y1="3"  x2="12" y2="17" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="4"  y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="8"  y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.5"/>'
    + '<circle cx="12" cy="3"  r="1.8" fill="currentColor"/>'
    + '<circle cx="4"  cy="17" r="1.8" fill="currentColor"/>'
    + '<circle cx="20" cy="17" r="1.8" fill="currentColor"/>'
    + '<circle cx="8"  cy="10" r="1.4" fill="currentColor"/>'
    + '<circle cx="16" cy="10" r="1.4" fill="currentColor"/>',

  // Galactic Bloom — Euclidean radial sequencer: center + ring + 6 satellites
  'addGalacticBloomBtn':
    '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>'
    + '<circle cx="12" cy="12" r="2.5" fill="currentColor"/>'
    + '<circle cx="12"  cy="2.5"  r="2.2" fill="currentColor"/>'
    + '<circle cx="20.7" cy="7"   r="2.2" fill="currentColor"/>'
    + '<circle cx="20.7" cy="17"  r="2.2" fill="currentColor"/>'
    + '<circle cx="12"  cy="21.5" r="2.2" fill="currentColor"/>'
    + '<circle cx="3.3"  cy="17"  r="2.2" fill="currentColor"/>'
    + '<circle cx="3.3"  cy="7"   r="2.2" fill="currentColor"/>'
    + '<line x1="12" y1="9.5"  x2="12" y2="4.5"   stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="14.7" y1="10.5" x2="18.9" y2="8.1" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="14.7" y1="13.5" x2="18.9" y2="15.9" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="12" y1="14.5"  x2="12" y2="19.5"  stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="9.3" y1="13.5" x2="5.1" y2="15.9"  stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="9.3" y1="10.5" x2="5.1" y2="8.1"   stroke="currentColor" stroke-width="1.5"/>',

  // — Tape looper controls —
  'tapeLoopRecordBtn':
    '<circle cx="12" cy="12" r="7" fill="currentColor"/>',

  'tapeLoopPlayBtn':
    '<polygon points="5,3 19,12 5,21" fill="currentColor"/>',

  'tapeLoopStopBtn':
    '<rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor"/>',

  'tapeLoopClearBtn':
    '<path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M8 6V4h8v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  'canvasNextBtn':
    '<polygon points="5,3 15,12 5,21" fill="currentColor"/>'
    + '<line x1="19" y1="3" x2="19" y2="21" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
};

// ─── Injection ────────────────────────────────────────────────────────────────

function injectIcons() {
  const svgNs = 'http://www.w3.org/2000/svg';

  Object.entries(LABELS).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Set plain text label
    el.textContent = label;
    el.classList.add('icon-svg');
  });

  Object.entries(ICONS).forEach(([id, innerSVG]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.querySelector('span.svg-icon')) return; // already injected

    const span = document.createElement('span');
    span.className = 'svg-icon';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = '1em';
    svg.style.height = '1em';
    svg.style.display = 'block';
    svg.style.fill = 'currentColor';
    const g = document.createElementNS(svgNs, 'g');
    g.innerHTML = innerSVG;
    svg.appendChild(g);
    span.appendChild(svg);
    el.prepend(span);
  });

  // Scrub any lingering mojibake from buttons not in our list
  document.querySelectorAll('button').forEach((b) => {
    const text = b.childNodes;
    for (const node of text) {
      if (node.nodeType === Node.TEXT_NODE) {
        const cleaned = node.textContent.replace(/\uFFFD/g, '').trim();
        // Remove surrogate-pair emoji / private use area
        const noEmoji = cleaned
          .replace(/[\uD800-\uDFFF]/g, '')
          .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
          .trim();
        if (noEmoji !== node.textContent.trim()) {
          node.textContent = noEmoji ? noEmoji + ' ' : '';
        }
      }
    }
  });
}

// Run once on load, then watch for dynamically-created buttons
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectIcons);
  } else {
    injectIcons();
  }

  // Re-run when new elements appear (e.g. dynamically added toolbar buttons)
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; injectIcons(); });
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
}
