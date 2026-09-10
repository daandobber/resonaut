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
  'addNoteLoomBtn':                 '',
  'addChordGardenBtn':              '',
  'addArpOrbitBtn':                 '',
  'addAcidMyceliumBtn':             '',
  'tapeLoopRecordBtn':              '',
  'tapeLoopPlayBtn':                '',
  'tapeLoopStopBtn':                '',
  'tapeLoopClearBtn':               '',
  'canvasNextBtn':                  '',
};

// SVG inner content for each button. All 24x24 viewBox.
const ICONS = {

  // — Transport controls — (Lucide-style)
  'app-menu-play-pause-btn':
    '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>',

  'app-menu-stop-btn':
    '<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>',

  'app-menu-record-btn':
    '<circle cx="12" cy="12" r="7" fill="currentColor"/>'
    + '<circle cx="12" cy="12" r="3.5" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>',

  'metronomeToggleBtn':
    '<path d="M12 3 L6 21 H18 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
    + '<line x1="12" y1="8" x2="16.5" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<circle cx="16.5" cy="17" r="1.8" fill="currentColor"/>',

  // Lucide: Cassette tape
  'app-menu-toggle-tape-looper-btn':
    '<rect x="2" y="6" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="8" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    + '<circle cx="16" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    + '<path d="M6 6V4h12v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
    + '<path d="M10.5 13h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',

  // Lucide: BarChart2
  'app-menu-performance-btn':
    '<line x1="18" x2="18" y1="20" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="12" x2="12" y1="20" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="6" x2="6" y1="20" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: CircleHelp
  'app-menu-help-btn':
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="12" x2="12.01" y1="17" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // — Right toolbar menus — (Lucide icons)

  // Lucide: Wrench
  'toolsMenuBtn':
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

  // Lucide: Music
  'instrumentsMenuBtn':
    '<path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',

  // Lucide: Link2
  'connectionsMenuBtn':
    '<path d="M9 17H7A5 5 0 0 1 7 7h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M15 7h2a5 5 0 1 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="8" x2="16" y1="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: Sparkles (mind/intelligence)
  'symphioseMenuBtn':
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
    + '<path d="M20 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M22 5h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: CloudFog
  'mistMenuBtn':
    '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M8 19h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M12 19h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M5 23h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: Waves (drone/ambient sound)
  'dronesMenuBtn':
    '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: Move (4-directional arrows)
  'motionMenuBtn':
    '<polyline points="5 9 2 12 5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<polyline points="9 5 12 2 15 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<polyline points="15 19 12 22 9 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<polyline points="19 9 22 12 19 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<line x1="2" x2="22" y1="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="12" x2="12" y1="2" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // — Editing tools — (Lucide icons)

  // Lucide: Paintbrush
  'brushBtn':
    '<path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M14.5 17.5 4.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: MousePointer2
  'editBtn':
    '<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" fill="currentColor"/>',

  // Lucide: Wand2
  'wandBtn':
    '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="m14 7 3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M5 6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M19 14v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M10 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M7 8H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M21 16h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M11 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: Trash2
  'deleteBtn':
    '<path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="10" x2="10" y1="11" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="14" x2="14" y1="11" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: Menu
  'hamburgerBtn':
    '<line x1="4" x2="20" y1="6" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="4" x2="20" y1="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    + '<line x1="4" x2="20" y1="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // — Sequencer / add buttons —

  // Lucide: Star
  'addPulsarBtn':
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',

  // Lucide: Grid3x3 (4 filled squares → step sequencer)
  'addGridSequencerBtn':
    '<rect x="3"  y="3"  width="7" height="7" rx="1" fill="currentColor"/>'
    + '<rect x="14" y="3"  width="7" height="7" rx="1" fill="currentColor"/>'
    + '<rect x="3"  y="14" width="7" height="7" rx="1" fill="currentColor"/>'
    + '<rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.4"/>',

  // Timeline grid (kept custom — clearly represents a timeline)
  'addTimelineGridBtn':
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<line x1="3"  y1="9"  x2="21" y2="9"  stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="3"  y1="15" x2="21" y2="15" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="9"  y1="9"  x2="9"  y2="21" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="15" y1="9"  x2="15" y2="21" stroke="currentColor" stroke-width="1.5"/>'
    + '<rect x="5" y="5" width="3" height="3" rx="0.5" fill="currentColor"/>'
    + '<rect x="16" y="5" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>',

  // Radar (kept custom — perfect representation)
  'addRadarBtn':
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="6"  fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="2"  fill="currentColor"/>'
    + '<line x1="12" y1="12" x2="19.5" y2="6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',

  // Lucide: Zap (meteor/energy burst)
  'addMeteorShowerBtn':
    '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',

  // Circle of Fifths (kept custom — specific music theory concept)
  'addCircleFifthsBtn':
    '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
    + '<circle cx="12"  cy="2.5"  r="1.5" fill="currentColor"/>'
    + '<circle cx="20.7" cy="7"   r="1.5" fill="currentColor"/>'
    + '<circle cx="20.7" cy="17"  r="1.5" fill="currentColor"/>'
    + '<circle cx="12"  cy="21.5" r="1.5" fill="currentColor"/>'
    + '<circle cx="3.3"  cy="17"  r="1.5" fill="currentColor"/>'
    + '<circle cx="3.3"  cy="7"   r="1.5" fill="currentColor"/>',

  // Tonnetz (kept custom — specific music theory concept)
  'addTonnetzBtn':
    '<path d="M12 3 L20 17 H4 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
    + '<line x1="12" y1="3"  x2="12" y2="17" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="4"  y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.5"/>'
    + '<line x1="8"  y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.5"/>'
    + '<circle cx="12" cy="3"  r="1.8" fill="currentColor"/>'
    + '<circle cx="4"  cy="17" r="1.8" fill="currentColor"/>'
    + '<circle cx="20" cy="17" r="1.8" fill="currentColor"/>'
    + '<circle cx="8"  cy="10" r="1.4" fill="currentColor"/>'
    + '<circle cx="16" cy="10" r="1.4" fill="currentColor"/>',

  'addNoteLoomBtn':
    '<path d="M12 22V3M12 17C3 17 3 11 4 11c5 0 8 6 8 6Zm0-4c9 0 9-6 8-6-5 0-8 6-8 6Zm0-4C7 9 6 4 7 4c3 0 5 5 5 5Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
  'addChordGardenBtn':
    '<path d="M12 22V10m0 10C5 16 5 10 5 7m7 12c7-4 7-9 7-12M12 10C7 7 9 3 12 2c3 1 5 5 0 8ZM5 7C1 5 3 2 5 2c3 0 4 4 0 5Zm14 0c-4-2-2-5 0-5 3 0 4 4 0 5Z" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  'addArpOrbitBtn':
    '<path d="M10 22c-6-5 9-7 4-12S9 5 13 2M12 17c6 1 9-2 8-5-4-1-8 5-8 5Zm0-7C6 12 3 8 4 5c4-1 8 5 8 5Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',

  'addAcidMyceliumBtn':
    '<path d="M3 10C3 0 21 0 21 10Q12 14 3 10ZM12 11v7m-4-7 2 7m6-7-2 7M12 18l-7 4m7-4 7 4m-7-4v5M6 10l3-4m3 4V4m6 6-3-4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',

  // Galactic Bloom (kept custom — specific sequencer concept)
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
    if (el.dataset.dynamicLabel === 'true') return;
    // Preserve existing SVG children. Replacing them here made our own observer
    // schedule another full rebuild on every animation frame.
    const textNodes = [...el.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
    const currentLabel = textNodes.map(node => node.textContent).join('');
    if (currentLabel !== label) {
      textNodes.forEach(node => node.remove());
      if (label) el.append(document.createTextNode(label));
    }
    if (!el.classList.contains('icon-svg')) el.classList.add('icon-svg');
  });

  Object.entries(ICONS).forEach(([id, innerSVG]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.dataset.dynamicLabel === 'true') return;
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
