const LABELS = {
  'filter-lp':  'Filter LP',
  'filter-hp':  'Filter HP',
  'delay':      'Delay',
  'distortion': 'Distortion',
};

let kpX      = 0.5;
let kpY      = 0.5;
let kpActive = false;  // currently touching
let kpOn     = false;  // master on/off toggle
let kpWet    = 0.7;    // wetness amount (0–1)

function makeDistCurve(amount) {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1;
    if (amount < 0.005) {
      curve[i] = x;
    } else {
      const k = amount * 300;
      curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
    }
  }
  return curve;
}

function setWetDry(wet, t) {
  const wg = window.kaosPadWetGain;
  const dg = window.kaosPadDryGain;
  if (!wg || !dg) return;
  wg.gain.setTargetAtTime(wet,       t, 0.03);
  dg.gain.setTargetAtTime(1 - wet,   t, 0.03);
}

function resetEffectNodes(t) {
  const lp   = window.kaosPadLpFilter;
  const hp   = window.kaosPadHpFilter;
  const del  = window.kaosPadDelay;
  const fb   = window.kaosPadDelayFb;
  const dist = window.kaosPadDistortion;
  if (!lp) return;
  lp.frequency.setTargetAtTime(20000, t, 0.06);
  hp.frequency.setTargetAtTime(20,    t, 0.06);
  del.delayTime.setTargetAtTime(0.001, t, 0.06);
  fb.gain.setTargetAtTime(0, t, 0.06);
  dist.curve = makeDistCurve(0);
}

function applyEffectNodes(x, y, selX, selY, t) {
  const lp   = window.kaosPadLpFilter;
  const hp   = window.kaosPadHpFilter;
  const del  = window.kaosPadDelay;
  const fb   = window.kaosPadDelayFb;
  const dist = window.kaosPadDistortion;
  if (!lp) return;

  const used = { lp: false, hp: false, delay: false, dist: false };

  const applyOne = (which, val) => {
    switch (which) {
      case 'filter-lp':
        lp.frequency.setTargetAtTime(200 * Math.pow(100, val), t, 0.02);
        used.lp = true; break;
      case 'filter-hp':
        hp.frequency.setTargetAtTime(20 * Math.pow(200, val), t, 0.02);
        used.hp = true; break;
      case 'delay':
        del.delayTime.setTargetAtTime(val * 0.55, t, 0.02);
        fb.gain.setTargetAtTime(val * 0.84, t, 0.02);
        used.delay = true; break;
      case 'distortion':
        dist.curve = makeDistCurve(val);
        used.dist = true; break;
    }
  };

  applyOne(selX, x);
  applyOne(selY, y);

  if (!used.lp)    lp.frequency.setTargetAtTime(20000, t, 0.05);
  if (!used.hp)    hp.frequency.setTargetAtTime(20,    t, 0.05);
  if (!used.delay) { del.delayTime.setTargetAtTime(0.001, t, 0.05); fb.gain.setTargetAtTime(0, t, 0.05); }
  if (!used.dist)  dist.curve = makeDistCurve(0);
}

function draw(canvas, selX, selY) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = kpX * W;
  const cy = (1 - kpY) * H;

  // Background
  ctx.fillStyle = kpOn ? '#060e20' : '#060c1a';
  ctx.fillRect(0, 0, W, H);

  if (kpOn && kpActive) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.65);
    glow.addColorStop(0, `rgba(50,140,255,${0.12 + kpWet * 0.15})`);
    glow.addColorStop(1, 'rgba(50,140,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // Grid
  const gridAlpha = kpOn ? 0.12 : 0.06;
  ctx.strokeStyle = `rgba(80,130,200,${gridAlpha})`;
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * W / 4, 0); ctx.lineTo(i * W / 4, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * H / 4); ctx.lineTo(W, i * H / 4); ctx.stroke();
  }

  // Crosshairs
  if (kpOn) {
    ctx.strokeStyle = kpActive ? 'rgba(100,200,255,0.3)' : 'rgba(80,140,200,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Axis labels
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = kpOn ? 'rgba(130,185,255,0.55)' : 'rgba(100,140,200,0.3)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('← ' + LABELS[selX] + ' →', W / 2, H - 3);
  ctx.save();
  ctx.translate(11, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'top';
  ctx.fillText('← ' + LABELS[selY] + ' →', 0, 0);
  ctx.restore();

  // OFF overlay
  if (!kpOn) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(150,180,220,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OFF', W / 2, H / 2);
    return;
  }

  // Cursor
  const r = kpActive ? 12 : 7;
  if (kpActive) {
    const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
    outerGlow.addColorStop(0, `rgba(80,200,255,${0.4 + kpWet * 0.3})`);
    outerGlow.addColorStop(1, 'rgba(80,200,255,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath(); ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = kpActive ? `hsl(${200 + kpWet * 40}, 85%, ${55 + kpWet * 15}%)` : '#3a70aa';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = kpActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
}

function initKaosPad() {
  const canvas     = document.getElementById('kaosPadCanvas');
  const selectX    = document.getElementById('kaosPadSelectX');
  const selectY    = document.getElementById('kaosPadSelectY');
  const resetBtn   = document.getElementById('kaosPadResetBtn');
  const holdToggle = document.getElementById('kaosPadHoldToggle');
  const onToggle   = document.getElementById('kaosPadOnToggle');
  const wetSlider  = document.getElementById('kaosPadWetSlider');
  const wetValue   = document.getElementById('kaosPadWetValue');

  if (!canvas) return;

  const getAudioCtx = () => window.audioContext;
  const redraw = () => draw(canvas, selectX.value, selectY.value);

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 10 && canvas.width !== Math.round(rect.width)) {
      canvas.width  = Math.round(rect.width);
      canvas.height = Math.round(rect.height || 190);
    }
  }

  function getXY(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left)  / rect.width)),
      y: Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height)),
    };
  }

  function applyState(x, y) {
    kpX = x; kpY = y;
    const ctx = getAudioCtx();
    if (!ctx || !kpOn) return;
    applyEffectNodes(x, y, selectX.value, selectY.value, ctx.currentTime);
    setWetDry(kpWet, ctx.currentTime);
  }

  function disableKaoss() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    resetEffectNodes(ctx.currentTime);
    setWetDry(0, ctx.currentTime);
  }

  // On/Off toggle
  if (onToggle) {
    onToggle.addEventListener('change', () => {
      kpOn = onToggle.checked;
      if (!kpOn) {
        disableKaoss();
      } else {
        // Re-apply current state if hold is on
        if (holdToggle?.checked) applyState(kpX, kpY);
        else setWetDry(0, getAudioCtx()?.currentTime ?? 0);
      }
      redraw();
    });
  }

  // Wet slider
  if (wetSlider) {
    wetSlider.addEventListener('input', () => {
      kpWet = parseFloat(wetSlider.value);
      if (wetValue) wetValue.textContent = Math.round(kpWet * 100) + '%';
      const ctx = getAudioCtx();
      if (ctx && kpOn && (kpActive || holdToggle?.checked)) {
        setWetDry(kpWet, ctx.currentTime);
      }
      redraw();
    });
  }

  // Canvas interaction
  let dragging = false;

  canvas.addEventListener('pointerdown', e => {
    if (!kpOn) return;
    dragging = true;
    kpActive = true;
    canvas.setPointerCapture(e.pointerId);
    syncCanvasSize();
    const { x, y } = getXY(e);
    applyState(x, y);
    redraw();
  });

  canvas.addEventListener('pointermove', e => {
    if (!dragging || !kpOn) return;
    const { x, y } = getXY(e);
    applyState(x, y);
    redraw();
  });

  canvas.addEventListener('pointerup', e => {
    dragging = false;
    kpActive = false;
    canvas.releasePointerCapture(e.pointerId);
    if (!holdToggle?.checked) {
      const ctx = getAudioCtx();
      if (ctx) { resetEffectNodes(ctx.currentTime); setWetDry(0, ctx.currentTime); }
      kpX = 0.5; kpY = 0.5;
    }
    redraw();
  });

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const ctx = getAudioCtx();
      if (ctx) { resetEffectNodes(ctx.currentTime); if (!kpOn) setWetDry(0, ctx.currentTime); }
      kpX = 0.5; kpY = 0.5;
      kpActive = false;
      redraw();
    });
  }

  [selectX, selectY].forEach(s => s.addEventListener('change', redraw));

  // Sync canvas on performance panel open
  const syncAndDraw = () => setTimeout(() => { syncCanvasSize(); redraw(); }, 60);
  document.getElementById('app-menu-performance-btn')?.addEventListener('click', syncAndDraw);
  document.getElementById('openPerformancePanelBtn')?.addEventListener('click', syncAndDraw);

  redraw();
}

document.addEventListener('DOMContentLoaded', initKaosPad);
