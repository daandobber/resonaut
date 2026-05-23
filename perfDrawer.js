const PERF_STATE_KEY = 'perf-block-states';

function loadStates() {
  try { return JSON.parse(localStorage.getItem(PERF_STATE_KEY) || '{}'); } catch { return {}; }
}

function saveState(states, id, collapsed) {
  states[id] = collapsed;
  localStorage.setItem(PERF_STATE_KEY, JSON.stringify(states));
}

function wrapBody(parent, afterEl) {
  const body = document.createElement('div');
  body.className = 'perf-block-body';
  let n = afterEl.nextSibling;
  while (n) { const nx = n.nextSibling; body.appendChild(n); n = nx; }
  parent.appendChild(body);
}

function addArrowToHeader(headerEl) {
  const arrow = document.createElement('span');
  arrow.className = 'perf-collapse-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  headerEl.appendChild(arrow);
}

function initPerfBlockCollapse() {
  const states = loadStates();

  // ── DJ EQ ────────────────────────────────────────────────────────────────────
  const djEq = document.querySelector('.dj-eq-section');
  if (djEq) {
    const h4 = djEq.querySelector(':scope > h4');
    if (h4) {
      addArrowToHeader(h4);
      wrapBody(djEq, h4);
      if (states['dj-eq']) djEq.classList.add('perf-collapsed');
      h4.addEventListener('click', () => {
        saveState(states, 'dj-eq', djEq.classList.toggle('perf-collapsed'));
      });
    }
  }

  // ── Regular blocks (MRFA, Resonator, Reverb, Microcosm) ──────────────────────
  document.querySelectorAll('#performance-panel-content .performance-block:not(#scaleKeySeqBlock)').forEach(block => {
    const h4 = block.querySelector(':scope > h4');
    if (!h4) return;

    const id = block.id || h4.firstChild?.textContent?.trim()?.toLowerCase()?.replace(/\s+/g, '-') || 'block';

    // Pull toggle out of perf-toggle-row into h4
    const toggleRow = block.querySelector(':scope > .perf-toggle-row');
    const toggle = toggleRow?.querySelector('.stomp-switch');
    if (toggle) {
      const ctrl = document.createElement('span');
      ctrl.className = 'perf-block-controls';
      ctrl.appendChild(toggle);
      addArrowToHeader(ctrl);
      h4.appendChild(ctrl);
    } else {
      addArrowToHeader(h4);
    }
    if (toggleRow) toggleRow.remove();

    wrapBody(block, h4);
    if (states[id]) block.classList.add('perf-collapsed');

    h4.addEventListener('click', e => {
      if (e.target.closest('.stomp-switch')) return;
      saveState(states, id, block.classList.toggle('perf-collapsed'));
    });
  });

  // ── Scale Seq (has its own seq-header-row) ────────────────────────────────────
  const seqBlock = document.getElementById('scaleKeySeqBlock');
  if (seqBlock) {
    const hdr = seqBlock.querySelector('.seq-header-row');
    if (hdr) {
      addArrowToHeader(hdr);
      wrapBody(seqBlock, hdr);
      if (states['scale-seq']) seqBlock.classList.add('perf-collapsed');
      hdr.addEventListener('click', e => {
        if (e.target.closest('input, select, button')) return;
        saveState(states, 'scale-seq', seqBlock.classList.toggle('perf-collapsed'));
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', initPerfBlockCollapse);
