import { tonePanel, tonePanelContent, appMenuBpmInput } from '../utils/domElements.js';
import { getScreenCoords, updateNodeAudioParams } from '../main.js';

// Reuse tone panel positioning similar to analog UI
function positionTonePanel(node) {
  if (!tonePanel) return;
  const coords = getScreenCoords(node.x, node.y);
  const offsetX = 80;
  tonePanel.style.position = 'fixed';
  tonePanel.style.left = `${coords.x + offsetX}px`;
  tonePanel.style.top = `${coords.y}px`;
  tonePanel.style.right = 'auto';
  tonePanel.style.transform = 'translate(0, -50%)';
}

export function hideEtherAuraMenu() {
  if (tonePanelContent) tonePanelContent.innerHTML = '';
  if (tonePanel) tonePanel.classList.add('hidden');
}

export function showEtherAuraMenu(node) {
  hideEtherAuraMenu();
  if (!node || node.type !== 'sound' || node.audioParams.engine !== 'etheraura') return;

  if (!tonePanel || !tonePanelContent) return;
  tonePanel.classList.remove('hidden');
  tonePanel.dataset.nodeId = node.id;
  positionTonePanel(node);

  const params = node.audioParams || {};
  const aura = node.audioNodes && node.audioNodes.aura;

  const container = document.createElement('div');
  container.id = 'ether-aura-container';
  container.className = 'panel-section';
  container.dataset.nodeId = node.id;
  tonePanelContent.innerHTML = '';
  tonePanelContent.appendChild(container);

  const title = document.createElement('div');
  title.textContent = 'EtherAura (Dual Wavefolder)';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '6px';
  container.appendChild(title);

  // Prepare preview canvases (we will place them under the columns)
  const canvas1 = document.createElement('canvas');
  const canvas2 = document.createElement('canvas');
  ;[canvas1, canvas2].forEach(cv => { cv.width = 160; cv.height = 60; cv.style.width='160px'; cv.style.height='60px'; cv.style.background='rgba(255,255,255,0.06)'; cv.style.borderRadius='4px'; });

  const drawPreviewCommon = (canvas, useFolder2) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    const midY = canvas.height/2;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(canvas.width, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, canvas.height-1); ctx.stroke();
    // Draw output waveform: oscillator waveform passed through folder curve
    const folds = useFolder2 ? (params.folds2 ?? params.folds ?? 3) : (params.folds1 ?? params.folds ?? 3);
    const drive = useFolder2 ? (params.drive2 ?? params.drive ?? 1.0) : (params.drive1 ?? params.drive ?? 1.0);
    const symmetry = useFolder2 ? (params.symmetry2 ?? params.symmetry ?? 0.0) : (params.symmetry1 ?? params.symmetry ?? 0.0);
    const wave = useFolder2 ? (params.osc2Waveform ?? 'sine') : (params.osc1Waveform ?? 'sine');
    const len = 256;
    // Pull live Tone folder curve if present for more accuracy
    let folderCurve = null;
    try {
      const folder = useFolder2 ? (aura && aura.folder2) : (aura && aura.folder1);
      folderCurve = (folder && folder.curve) ? Array.from(folder.curve) : null;
    } catch {}
    const transfer = (x) => {
      // x in [-1,1]
      if (folderCurve && folderCurve.length > 0) {
        const idx = Math.max(0, Math.min(folderCurve.length - 1, Math.floor(((x + 1) * 0.5) * (folderCurve.length - 1))));
        return folderCurve[idx];
      }
      // Fallback: analytic transfer
      const y = Math.sin((x + symmetry) * drive * Math.PI * folds);
      return Math.max(-1, Math.min(1, y));
    };
    const oscSample = (type, phase01) => {
      const p = phase01 - Math.floor(phase01);
      switch (type) {
        case 'square': return p < 0.5 ? 1 : -1;
        case 'sawtooth': return p * 2 - 1;
        case 'triangle': return 1 - 4 * Math.abs(p - 0.5);
        case 'sine':
        default: return Math.sin(2 * Math.PI * p);
      }
    };
    ctx.strokeStyle = useFolder2 ? 'rgba(255,200,180,0.9)' : 'rgba(180,220,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const cycles = 2;
    for (let i = 0; i < len; i++) {
      const t = (i / (len - 1)) * cycles;
      const input = oscSample(wave, t);
      const y = transfer(input);
      const px = (i / (len - 1)) * canvas.width;
      const py = midY - y * (canvas.height * 0.45);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };
  const drawPreview1 = () => drawPreviewCommon(canvas1, false);
  const drawPreview2 = () => drawPreviewCommon(canvas2, true);

  // Two symmetrical columns for identical OSC controls
  const dual = document.createElement('div');
  dual.style.display = 'grid';
  dual.style.gridTemplateColumns = '1fr 1fr';
  dual.style.columnGap = '10px';
  dual.style.rowGap = '6px';
  container.appendChild(dual);

  const colHeader = (text) => {
    const h = document.createElement('div');
    h.textContent = text;
    h.style.fontWeight = '600';
    h.style.fontSize = '11px';
    h.style.opacity = '0.9';
    h.style.marginBottom = '2px';
    return h;
  };

  const mk = (label, min, max, step, value, onInput, format = (v)=>v, previewFn = null) => {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'stretch';
    const lab = document.createElement('div');
    lab.textContent = `${label}: ${format(value)}`;
    lab.style.fontSize = '10px';
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      onInput(v);
      lab.textContent = `${label}: ${format(v)}`;
      if (previewFn) previewFn();
    });
    wrap.appendChild(input);
    wrap.appendChild(lab);
    return wrap;
  };

  const mkSelect = (label, options, value, onChange) => {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    const sel = document.createElement('select');
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt; if (opt === value) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', e => onChange(e.target.value));
    const lab = document.createElement('div');
    lab.textContent = label;
    lab.style.fontSize = '10px';
    wrap.appendChild(sel);
    wrap.appendChild(lab);
    return wrap;
  };

  const setParam = (key, val) => {
    node.audioParams[key] = val;
  };

  // Core folder controls
  // Column 1 (OSC 1)
  const col1 = document.createElement('div');
  col1.appendChild(colHeader('OSC 1'));
  col1.appendChild(mk('Folds', 1, 12, 1, (params.folds1 ?? params.folds ?? 3), v => { setParam('folds1', Math.round(v)); if (aura) aura.setFolds1(v); } , v => Math.round(v), drawPreview1));
  col1.appendChild(mk('Drive', 0, 5, 0.01, (params.drive1 ?? params.drive ?? 1.0), v => { setParam('drive1', v); if (aura) aura.setDrive1(v); }, v => v.toFixed(2), drawPreview1));
  col1.appendChild(mk('Symmetry', -1, 1, 0.01, (params.symmetry1 ?? params.symmetry ?? 0.0), v => { setParam('symmetry1', v); if (aura) aura.setSymmetry1(v); }, v => v.toFixed(2), drawPreview1));
  // waveform & octave
  const wf1 = (params.osc1Waveform ?? 'sine');
  const oct1 = (params.osc1Octave ?? 0);
  col1.appendChild(mkSelect('Wave', ['sine','triangle','sawtooth','square'], wf1, v => { setParam('osc1Waveform', v); try { aura.setOsc1Waveform(v) } catch {}; drawPreview1(); }));
  col1.appendChild(mkSelect('Oct', ['-2','-1','0','1','2'], String(oct1), v => { const o = parseInt(v,10); setParam('osc1Octave', o); try { aura.setOctave1(o) } catch {} }));
  col1.appendChild(mk('Level', 0, 1, 0.01, params.osc1Level ?? 1.0, v => { setParam('osc1Level', v); try { aura.setOsc1Level(v) } catch {} }, v => v.toFixed(2)));
  // Fold modulation
  const mod1Wrap = document.createElement('div');
  mod1Wrap.style.display = 'grid';
  mod1Wrap.style.gridTemplateColumns = 'auto 1fr 1fr auto auto';
  mod1Wrap.style.gap = '4px';
  const mod1Toggle = document.createElement('label');
  const mod1Cb = document.createElement('input'); mod1Cb.type = 'checkbox'; mod1Cb.checked = !!(params.foldMod1Enabled);
  mod1Cb.addEventListener('change', e => { setParam('foldMod1Enabled', !!e.target.checked); try { aura.setFoldMod1Enabled(!!e.target.checked) } catch {} });
  mod1Toggle.appendChild(mod1Cb); mod1Toggle.appendChild(document.createTextNode('Mod'));
  mod1Wrap.appendChild(mod1Toggle);
  mod1Wrap.appendChild(mk('Depth', 0, 5, 0.01, params.foldMod1Depth ?? 0.0, v => { setParam('foldMod1Depth', v); try { aura.setFoldMod1Depth(v) } catch {}; }, v => v.toFixed(2), drawPreview1));
  const rate1Wrap = mk('Rate', 0, 10, 0.01, params.foldMod1Rate ?? 0.5, v => { setParam('foldMod1Rate', v); try { aura.setFoldMod1Rate(v) } catch {}; }, v => v.toFixed(2), drawPreview1);
  mod1Wrap.appendChild(rate1Wrap);
  // Sync controls
  const sync1Cb = document.createElement('input'); sync1Cb.type = 'checkbox'; sync1Cb.checked = !!params.foldMod1SyncEnabled;
  const sync1Label = document.createElement('label'); sync1Label.appendChild(sync1Cb); sync1Label.appendChild(document.createTextNode('Sync'));
  const sync1Sel = document.createElement('select');
  const subdivs = ['1/8','1/4','1/2','1','2','4']; // beats per cycle: 0.5,1,2,4,8,16
  subdivs.forEach(s => { const o=document.createElement('option'); o.value=s; o.textContent=s; if ((params.foldMod1SyncSubdivision||'1/4')===s) o.selected=true; sync1Sel.appendChild(o); });
  const beatsFromSubdiv = (s) => ({'1/8':0.5,'1/4':1,'1/2':2,'1':4,'2':8,'4':16})[s]||1;
  const computeHzFromSync = (sel) => {
    const bpm = parseFloat(appMenuBpmInput && appMenuBpmInput.value ? appMenuBpmInput.value : '120') || 120;
    const bps = bpm/60;
    const beats = beatsFromSubdiv(sel);
    return bps / beats;
  };
  const applySync1 = () => {
    if (sync1Cb.checked) {
      const sel = sync1Sel.value || '1/4';
      const hz = computeHzFromSync(sel);
      setParam('foldMod1Rate', hz); try { aura.setFoldMod1Rate(hz) } catch {};
    }
  };
  sync1Cb.addEventListener('change', (e)=>{ setParam('foldMod1SyncEnabled', !!e.target.checked); applySync1(); });
  sync1Sel.addEventListener('change', (e)=>{ setParam('foldMod1SyncSubdivision', e.target.value); applySync1(); });
  // bpm input listener
  if (appMenuBpmInput) {
    const onBpm = ()=> { if (sync1Cb.checked) applySync1(); };
    appMenuBpmInput.addEventListener('change', onBpm);
    appMenuBpmInput.addEventListener('input', onBpm);
  }
  mod1Wrap.appendChild(sync1Label);
  mod1Wrap.appendChild(sync1Sel);
  col1.appendChild(mod1Wrap);

  // Column 2 (OSC 2)
  const col2 = document.createElement('div');
  col2.appendChild(colHeader('OSC 2'));
  col2.appendChild(mk('Folds', 1, 12, 1, (params.folds2 ?? params.folds ?? 3), v => { setParam('folds2', Math.round(v)); if (aura) aura.setFolds2(v); } , v => Math.round(v), drawPreview2));
  col2.appendChild(mk('Drive', 0, 5, 0.01, (params.drive2 ?? params.drive ?? 1.0), v => { setParam('drive2', v); if (aura) aura.setDrive2(v); }, v => v.toFixed(2), drawPreview2));
  col2.appendChild(mk('Symmetry', -1, 1, 0.01, (params.symmetry2 ?? params.symmetry ?? 0.0), v => { setParam('symmetry2', v); if (aura) aura.setSymmetry2(v); }, v => v.toFixed(2), drawPreview2));
  const wf2 = (params.osc2Waveform ?? 'sine');
  const oct2 = (params.osc2Octave ?? 0);
  col2.appendChild(mkSelect('Wave', ['sine','triangle','sawtooth','square'], wf2, v => { setParam('osc2Waveform', v); try { aura.setOsc2Waveform(v) } catch {}; drawPreview2(); }));
  col2.appendChild(mkSelect('Oct', ['-2','-1','0','1','2'], String(oct2), v => { const o = parseInt(v,10); setParam('osc2Octave', o); try { aura.setOctave2(o) } catch {} }));
  col2.appendChild(mk('Level', 0, 1, 0.01, params.osc2Level ?? 0.8, v => { setParam('osc2Level', v); try { aura.setOsc2Level(v) } catch {} }, v => v.toFixed(2)));
  const mod2Wrap = document.createElement('div');
  mod2Wrap.style.display = 'grid';
  mod2Wrap.style.gridTemplateColumns = 'auto 1fr 1fr auto auto';
  mod2Wrap.style.gap = '4px';
  const mod2Toggle = document.createElement('label');
  const mod2Cb = document.createElement('input'); mod2Cb.type = 'checkbox'; mod2Cb.checked = !!(params.foldMod2Enabled);
  mod2Cb.addEventListener('change', e => { setParam('foldMod2Enabled', !!e.target.checked); try { aura.setFoldMod2Enabled(!!e.target.checked) } catch {} });
  mod2Toggle.appendChild(mod2Cb); mod2Toggle.appendChild(document.createTextNode('Mod'));
  mod2Wrap.appendChild(mod2Toggle);
  mod2Wrap.appendChild(mk('Depth', 0, 5, 0.01, params.foldMod2Depth ?? 0.0, v => { setParam('foldMod2Depth', v); try { aura.setFoldMod2Depth(v) } catch {}; }, v => v.toFixed(2), drawPreview2));
  const rate2Wrap = mk('Rate', 0, 10, 0.01, params.foldMod2Rate ?? 0.5, v => { setParam('foldMod2Rate', v); try { aura.setFoldMod2Rate(v) } catch {}; }, v => v.toFixed(2), drawPreview2);
  mod2Wrap.appendChild(rate2Wrap);
  const sync2Cb = document.createElement('input'); sync2Cb.type = 'checkbox'; sync2Cb.checked = !!params.foldMod2SyncEnabled;
  const sync2Label = document.createElement('label'); sync2Label.appendChild(sync2Cb); sync2Label.appendChild(document.createTextNode('Sync'));
  const sync2Sel = document.createElement('select'); subdivs.forEach(s => { const o=document.createElement('option'); o.value=s; o.textContent=s; if ((params.foldMod2SyncSubdivision||'1/4')===s) o.selected=true; sync2Sel.appendChild(o); });
  const applySync2 = () => {
    if (sync2Cb.checked) {
      const sel = sync2Sel.value || '1/4';
      const hz = computeHzFromSync(sel);
      setParam('foldMod2Rate', hz); try { aura.setFoldMod2Rate(hz) } catch {};
    }
  };
  sync2Cb.addEventListener('change', (e)=>{ setParam('foldMod2SyncEnabled', !!e.target.checked); applySync2(); });
  sync2Sel.addEventListener('change', (e)=>{ setParam('foldMod2SyncSubdivision', e.target.value); applySync2(); });
  if (appMenuBpmInput) {
    const onBpm2 = ()=> { if (sync2Cb.checked) applySync2(); };
    appMenuBpmInput.addEventListener('change', onBpm2);
    appMenuBpmInput.addEventListener('input', onBpm2);
  }
  mod2Wrap.appendChild(sync2Label);
  mod2Wrap.appendChild(sync2Sel);
  col2.appendChild(mod2Wrap);

  dual.appendChild(col1);
  dual.appendChild(col2);

  // Place the previews under the columns
  const previewWrap = document.createElement('div');
  previewWrap.style.margin = '6px 0 6px 0';
  previewWrap.style.display = 'grid';
  previewWrap.style.gridTemplateColumns = '1fr 1fr';
  previewWrap.style.gap = '6px';
  previewWrap.appendChild(canvas1);
  previewWrap.appendChild(canvas2);
  container.appendChild(previewWrap);

  // Filter section
  const filterRow = document.createElement('div');
  filterRow.style.display = 'grid';
  filterRow.style.gridTemplateColumns = 'repeat(3, 1fr)';
  filterRow.style.gap = '6px';
  filterRow.style.marginTop = '6px';
  container.appendChild(filterRow);

  const filterEnabled = document.createElement('label');
  filterEnabled.style.display = 'flex';
  filterEnabled.style.alignItems = 'center';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!(params.filterEnabled);
  cb.addEventListener('change', e => { setParam('filterEnabled', !!e.target.checked); if (aura) aura.setFilterEnabled(!!e.target.checked); });
  filterEnabled.appendChild(cb);
  const cbl = document.createElement('span');
  cbl.textContent = 'Filter';
  cbl.style.marginLeft = '4px';
  filterEnabled.appendChild(cbl);
  filterRow.appendChild(filterEnabled);

  filterRow.appendChild(mkSelect('Type', ['lowpass','highpass','bandpass','notch'], params.filterType ?? 'lowpass', v => { setParam('filterType', v); if (aura) aura.setFilter(v); }));
  filterRow.appendChild(mk('Freq', 20, 20000, 1, params.filterFreq ?? 8000, v => { setParam('filterFreq', v); if (aura) aura.setFilter(null, v); }, v => `${Math.round(v)}Hz`));
  filterRow.appendChild(mk('Q', 0.1, 20, 0.1, params.filterQ ?? 0.8, v => { setParam('filterQ', v); if (aura) aura.setFilter(null, null, v); }, v => v.toFixed(2)));

  // Volume (global)
  const volRow = document.createElement('div');
  volRow.style.display = 'grid';
  volRow.style.gridTemplateColumns = 'repeat(3, 1fr)';
  volRow.style.gap = '6px';
  volRow.style.marginTop = '6px';
  container.appendChild(volRow);

  volRow.appendChild(mk('Volume', 0, 1, 0.01, params.volume ?? 0.9, v => { setParam('volume', v); if (aura) aura.setVolume(v); }, v => v.toFixed(2)));

  // Low-pass gate envelope section
  const gateRow = document.createElement('div');
  gateRow.style.display = 'grid';
  gateRow.style.gridTemplateColumns = 'repeat(5, 1fr)';
  gateRow.style.gap = '6px';
  gateRow.style.marginTop = '6px';
  container.appendChild(gateRow);

  gateRow.appendChild(mk('Atk', 0.001, 1.0, 0.001, params.gateAttack ?? 0.005, v => { setParam('gateAttack', v); try { aura.setGateEnvelope(v) } catch {} }, v => v.toFixed(3)));
  gateRow.appendChild(mk('Dec', 0.001, 2.0, 0.001, params.gateDecay ?? 0.25, v => { setParam('gateDecay', v); try { aura.setGateEnvelope(undefined, v) } catch {} }, v => v.toFixed(3)));
  gateRow.appendChild(mk('Sus', 0.0, 1.0, 0.01, params.gateSustain ?? 0.0, v => { setParam('gateSustain', v); try { aura.setGateEnvelope(undefined, undefined, v) } catch {} }, v => v.toFixed(2)));
  gateRow.appendChild(mk('Rel', 0.001, 2.0, 0.001, params.gateRelease ?? 0.25, v => { setParam('gateRelease', v); try { aura.setGateEnvelope(undefined, undefined, undefined, v) } catch {} }, v => v.toFixed(3)));
  gateRow.appendChild(mk('EnvAmt', 0, 10000, 1, params.lpgEnvAmount ?? 4000, v => { setParam('lpgEnvAmount', v); try { aura.setLpgEnvAmount(v) } catch {} }, v => `${Math.round(v)}Hz`));

  // Persist parameters to state on pointer up
  container.addEventListener('pointerup', () => {
    updateNodeAudioParams(node);
  });

  // Initial preview draw
  drawPreview1();
  drawPreview2();

  // Animate previews to reflect live fold modulation
  let animId = null;
  let pollTimer = null;
  const stopAnim = () => { if (animId) { cancelAnimationFrame(animId); animId = null; } if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; } };
  const rafLoop = () => {
    if (!document.body.contains(container)) { stopAnim(); return; }
    drawPreview1();
    drawPreview2();
    animId = requestAnimationFrame(rafLoop);
  };
  const scheduleAnim = () => {
    const anyMod = !!(node.audioParams.foldMod1Enabled || node.audioParams.foldMod2Enabled);
    if (anyMod) {
      if (!animId) animId = requestAnimationFrame(rafLoop);
    } else {
      stopAnim();
      // Light poll to start when user enables modulation later
      pollTimer = setTimeout(scheduleAnim, 600);
    }
  };
  scheduleAnim();
}
