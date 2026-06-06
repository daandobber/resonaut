const STATIONS = [
  { name: 'NPO Radio 1',  url: 'https://icecast.omroep.nl/radio1-bb-mp3',     freq: 0 },
  { name: 'NPO Radio 2',  url: 'https://icecast.omroep.nl/radio2-bb-mp3',     freq: 1 },
  { name: 'NPO 3FM',      url: 'https://icecast.omroep.nl/3fm-bb-mp3',        freq: 2 },
  { name: 'Groove Salad', url: 'https://ice2.somafm.com/groovesalad-128-mp3', freq: 3 },
  { name: 'SomaFM Lush',  url: 'https://ice2.somafm.com/lush-128-mp3',        freq: 4 },
  { name: 'Drone Zone',   url: 'https://ice2.somafm.com/dronezone-128-mp3',   freq: 5 },
  { name: 'Secret Agent', url: 'https://ice2.somafm.com/secretagent-128-mp3', freq: 6 },
];

const PAD_COUNT  = 12;
const STEP_COUNT = 16;

function initRadioSampler() {
  const panel          = document.getElementById('radioSamplerPanel');
  const toggleBtn      = document.getElementById('app-menu-radio-sampler-btn');
  const closeBtn       = document.getElementById('closeRadioSamplerPanelBtn');
  const playBtn        = document.getElementById('radioPlayBtn');
  const volumeSlider   = document.getElementById('radioVolumeSlider');
  const seqRecordBtn   = document.getElementById('radioRecordSeqBtn');
  const stationSlider  = document.getElementById('radioStationSlider');
  const stationLabel   = document.getElementById('radioStationNameLabel');
  const padGrid        = document.getElementById('radioSamplerGrid');
  const stepsContainer = document.getElementById('radioSeqSteps');
  const waveformCanvas = document.getElementById('radioWaveformCanvas');
  const startInput     = document.getElementById('radioPadStart');
  const endInput       = document.getElementById('radioPadEnd');
  const pitchSliderPad = document.getElementById('radioPadPitch');
  const volSliderPad   = document.getElementById('radioPadVolume');
  const reverseToggle  = document.getElementById('radioPadReverse');
  const radioAudio     = document.getElementById('radioStream');
  const editorDiv      = document.getElementById('radioPadEditor');

  if (!panel || !radioAudio) return;

  // --- Build pad DOM ---
  for (let i = 0; i < PAD_COUNT; i++) {
    const pad = document.createElement('div');
    pad.className = 'radio-pad';
    const cv = document.createElement('canvas');
    cv.width = 60; cv.height = 26;
    const row = document.createElement('div');
    row.className = 'rs-pad-btns';
    const recBtn = document.createElement('button');
    recBtn.className = 'pad-rec-btn';
    recBtn.title = 'Record from radio (5s)';
    recBtn.textContent = '●';
    const stepToggle = document.createElement('button');
    stepToggle.className = 'pad-step-toggle';
    stepToggle.title = 'Toggle in selected step';
    stepToggle.textContent = 'S';
    row.appendChild(recBtn);
    row.appendChild(stepToggle);
    pad.appendChild(cv);
    pad.appendChild(row);
    padGrid.appendChild(pad);
  }

  // --- Build step DOM ---
  for (let i = 0; i < STEP_COUNT; i++) {
    const step = document.createElement('div');
    step.className = 'radio-step';
    step.textContent = i + 1;
    stepsContainer.appendChild(step);
  }

  const pads    = Array.from(padGrid.querySelectorAll('.radio-pad'));
  const stepEls = Array.from(stepsContainer.querySelectorAll('.radio-step'));
  const waveCtx = waveformCanvas.getContext('2d');

  // --- Audio context ---
  const audioCtx = window.audioContext || (window.audioContext = new (window.AudioContext || window.webkitAudioContext)());

  // Radio stream gain/analyser (for radio volume control + mixer)
  if (!window.radioGainNode) {
    window.radioGainNode = audioCtx.createGain();
    window.radioGainNode.gain.value = 0.8;
    window.radioGainNode._originalGainBeforeMute = 0.8;
    window.radioMuteState = false;
    window.radioSoloState = false;
  }
  if (!window.radioAnalyserNode) {
    window.radioAnalyserNode = audioCtx.createAnalyser();
    window.radioAnalyserNode.fftSize = 256;
    window.radioAnalyserNode.smoothingTimeConstant = 0.7;
    window.radioGainNode.connect(window.radioAnalyserNode);
    window.radioAnalyserNode.connect(audioCtx.destination);
  }

  // --- Radio stream routing ---
  let mediaElementSource = null;
  let streamDest = null;

  function connectRadioStream() {
    if (mediaElementSource) return;
    try {
      mediaElementSource = audioCtx.createMediaElementSource(radioAudio);
      streamDest = audioCtx.createMediaStreamDestination();
      mediaElementSource.connect(streamDest);          // for recording
      mediaElementSource.connect(window.radioGainNode); // to output
    } catch (e) {
      console.warn('Radio stream connect:', e);
    }
  }

  // --- Between-station static noise ---
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 4000;
  noiseFilter.Q.value = 0.5;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0;
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.7;
  lfoGain.gain.value = 0;
  lfo.connect(lfoGain);
  lfoGain.connect(noiseGain.gain);
  lfo.start();
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noiseSource.start();

  // --- State ---
  let isRadioPlaying   = false;
  let isSeqRecording   = false;
  let mediaRecorder    = null;
  const buffers        = pads.map(() => null);
  const revBuffers     = pads.map(() => null);
  const padStart       = pads.map(() => 0);
  const padEnd         = pads.map(() => 0);
  const padPitch       = pads.map(() => 1);
  const padGain        = pads.map(() => 1);
  const padReverse     = pads.map(() => false);
  const activeSources  = pads.map(() => null);
  const seqSteps       = Array.from({ length: STEP_COUNT }, () => []);
  let currentStep      = 0;
  let stepTimeout      = null;
  let selectedPad      = 0;
  let selectedStep     = null;
  let draggingStart    = false;
  let draggingEnd      = false;
  let recordingPad     = null;
  let recordingTimeout = null;

  // --- Pad output: goes to app master gain so it's always audible ---
  function getPadOutput() {
    return window.masterGain || audioCtx.destination;
  }

  // --- Helpers ---
  function drawPadWaveform(idx) {
    const cv = pads[idx].querySelector('canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    const buf = buffers[idx];
    if (!buf) return;
    const data = buf.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / cv.width));
    ctx.beginPath();
    for (let i = 0; i < cv.width; i++) ctx.lineTo(i, cv.height / 2 - data[i * step] * cv.height / 2);
    ctx.strokeStyle = '#88f';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawEditor() {
    waveCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    const buf = buffers[selectedPad];
    if (!buf) return;
    const data = buf.getChannelData(0);
    const W = waveformCanvas.width, H = waveformCanvas.height;
    const step = Math.max(1, Math.floor(data.length / W));
    waveCtx.beginPath();
    for (let i = 0; i < W; i++) waveCtx.lineTo(i, H / 2 - data[i * step] * H / 2);
    waveCtx.strokeStyle = '#88f';
    waveCtx.lineWidth = 1;
    waveCtx.stroke();
    const start = padStart[selectedPad];
    const end   = padEnd[selectedPad] || buf.duration;
    const sx = (start / buf.duration) * W;
    const ex = (end   / buf.duration) * W;
    waveCtx.fillStyle = 'rgba(100,150,255,0.2)';
    waveCtx.fillRect(sx, 0, ex - sx, H);
    waveCtx.fillStyle = '#f66';
    waveCtx.fillRect(sx - 1, 0, 2, H);
    waveCtx.fillRect(ex - 1, 0, 2, H);
  }

  function createReversedBuffer(buf) {
    const rev = audioCtx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = rev.getChannelData(ch);
      for (let i = 0, j = src.length - 1; i < src.length; i++, j--) dst[i] = src[j];
    }
    return rev;
  }

  function playPad(idx) {
    if (!buffers[idx]) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const start = padStart[idx] || 0;
    const end   = padEnd[idx]   || buffers[idx].duration;
    if (activeSources[idx]) { try { activeSources[idx].stop(); } catch (_) {} activeSources[idx] = null; }
    const src = audioCtx.createBufferSource();
    const buf = padReverse[idx] ? (revBuffers[idx] || buffers[idx]) : buffers[idx];
    src.buffer = buf;
    src.playbackRate.setValueAtTime(padPitch[idx] || 1, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.value = padGain[idx] || 1;
    src.connect(gain);
    gain.connect(getPadOutput());  // straight to master, always audible
    src.onended = () => { if (activeSources[idx] === src) activeSources[idx] = null; };
    if (padReverse[idx]) {
      src.start(0, buf.duration - end, Math.max(0, end - start));
    } else {
      src.start(0, start, Math.max(0, end - start));
    }
    activeSources[idx] = src;
    pads[idx].classList.add('playing');
    setTimeout(() => pads[idx].classList.remove('playing'), Math.max(100, (end - start) * 1000));
  }

  function playClick(accent) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = accent ? 1600 : 800;
    gain.gain.value = 0.2;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  }

  function getStepDuration() {
    if (typeof isGlobalSyncEnabled !== 'undefined' && isGlobalSyncEnabled && typeof globalBPM === 'number') {
      return 60 / globalBPM / 4;
    }
    const bpmInput = document.getElementById('app-menu-bpm-input');
    return 60 / (parseFloat(bpmInput?.value) || 120) / 4;
  }

  function startSequencer() {
    if (stepTimeout) clearTimeout(stepTimeout);
    const scheduleStep = () => {
      const dur = getStepDuration();
      stepEls.forEach((el, i) => el.classList.toggle('active', i === currentStep));
      if (window._radioMetronomeOn) playClick(currentStep % 4 === 0);
      seqSteps[currentStep].forEach(idx => playPad(idx));
      currentStep = (currentStep + 1) % STEP_COUNT;
      stepTimeout = setTimeout(scheduleStep, dur * 1000);
    };
    scheduleStep();
  }

  function stopSequencer() {
    if (stepTimeout) clearTimeout(stepTimeout);
    stepTimeout = null;
    stepEls.forEach(el => el.classList.remove('active'));
  }

  function startPadRecording(idx, btn) {
    if (!streamDest) { alert('Start the radio first to record.'); return; }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      if (recordingPad === idx) { mediaRecorder.stop(); return; }
      mediaRecorder.stop();
    }
    const chunks = [];
    recordingPad = idx;
    mediaRecorder = new MediaRecorder(streamDest.stream);
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      if (recordingTimeout) { clearTimeout(recordingTimeout); recordingTimeout = null; }
      const blob = new Blob(chunks, { type: 'audio/webm' });
      try {
        const arr = await blob.arrayBuffer();
        buffers[idx]    = await audioCtx.decodeAudioData(arr);
        revBuffers[idx] = createReversedBuffer(buffers[idx]);
        padStart[idx] = 0;
        padEnd[idx]   = buffers[idx].duration;
        if (startInput) startInput.value = '0.00';
        if (endInput)   endInput.value   = buffers[idx].duration.toFixed(2);
        drawPadWaveform(idx);
        if (selectedPad === idx) drawEditor();
      } catch (e) { console.warn('Decode error:', e); }
      if (btn) btn.classList.remove('recording');
      recordingPad = null;
    };
    mediaRecorder.start();
    if (btn) btn.classList.add('recording');
    recordingTimeout = setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    }, 5000);
  }

  function updateTuning() {
    const val = parseFloat(stationSlider.value);
    let nearest = STATIONS[0];
    for (const st of STATIONS) if (Math.abs(st.freq - val) < Math.abs(nearest.freq - val)) nearest = st;

    if (!isRadioPlaying) {
      // Mute radio stream only — pads route separately and are always audible
      window.radioGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      noiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      lfoGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      return;
    }

    if (Math.abs(nearest.freq - val) < 0.2) {
      if (radioAudio.src !== nearest.url) {
        const wasPlaying = !radioAudio.paused;
        radioAudio.src = nearest.url;
        if (wasPlaying) radioAudio.play().catch(e => console.warn('radio play:', e));
      } else if (radioAudio.paused) {
        radioAudio.play().catch(e => console.warn('radio play:', e));
      }
      if (stationLabel) stationLabel.textContent = nearest.name;
      window.radioGainNode.gain.setTargetAtTime(parseFloat(volumeSlider.value), audioCtx.currentTime, 0.05);
      noiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      lfoGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    } else {
      if (stationLabel) stationLabel.textContent = '~ ~ ~';
      window.radioGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      noiseGain.gain.setTargetAtTime(0.2, audioCtx.currentTime, 0.05);
      lfoGain.gain.setTargetAtTime(0.2, audioCtx.currentTime, 0.05);
    }
  }

  // --- Update step/pad indicators ---
  function updatePadStepIndicators() {
    pads.forEach((pad, i) => {
      const ind = pad.querySelector('.pad-step-toggle');
      if (ind) ind.classList.toggle('on', selectedStep !== null && seqSteps[selectedStep].includes(i));
    });
  }

  function updateStepGrid() {
    stepEls.forEach((el, idx) => el.classList.toggle('selected', seqSteps[idx].includes(selectedPad)));
  }

  // --- Panel toggle ---
  function hidePanel() {
    panel.classList.add('hidden');
    if (toggleBtn) toggleBtn.classList.remove('active');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        toggleBtn.classList.add('active');
      } else {
        hidePanel();
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', hidePanel);

  // --- Controls ---
  volumeSlider.addEventListener('input', () => {
    const val = parseFloat(volumeSlider.value);
    if (isRadioPlaying) window.radioGainNode.gain.setTargetAtTime(val, audioCtx.currentTime, 0.01);
    window.radioGainNode._originalGainBeforeMute = val;
  });

  playBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isRadioPlaying) {
      radioAudio.pause();
      isRadioPlaying = false;
      playBtn.textContent = 'Play Radio';
    } else {
      connectRadioStream();
      radioAudio.play().catch(e => console.warn('radio play:', e));
      isRadioPlaying = true;
      playBtn.textContent = 'Stop Radio';
    }
    updateTuning();
  });

  stationSlider.addEventListener('input', updateTuning);

  seqRecordBtn.addEventListener('click', () => {
    isSeqRecording = !isSeqRecording;
    seqRecordBtn.classList.toggle('active', isSeqRecording);
    seqRecordBtn.textContent = isSeqRecording ? 'Stop Seq' : 'Record Seq';
    if (isSeqRecording) {
      seqSteps.forEach((_, i) => { seqSteps[i] = []; });
      currentStep = 0;
      startSequencer();
    } else {
      stopSequencer();
    }
  });

  stepEls.forEach((el, i) => {
    el.addEventListener('click', () => {
      selectedStep = i;
      const arr = seqSteps[i];
      const pos = arr.indexOf(selectedPad);
      if (pos === -1) arr.push(selectedPad); else arr.splice(pos, 1);
      updateStepGrid();
      updatePadStepIndicators();
    });
  });

  pads.forEach((pad, idx) => {
    const recBtn     = pad.querySelector('.pad-rec-btn');
    const stepToggle = pad.querySelector('.pad-step-toggle');

    pad.addEventListener('pointerdown', () => {
      selectedPad = idx;
      if (startInput) startInput.value = padStart[idx].toFixed(2);
      if (endInput)   endInput.value   = (padEnd[idx] || 0).toFixed(2);
      if (pitchSliderPad) pitchSliderPad.value = padPitch[idx].toString();
      if (volSliderPad)   volSliderPad.value   = padGain[idx].toString();
      if (reverseToggle)  reverseToggle.checked = padReverse[idx];
      if (editorDiv) editorDiv.classList.remove('hidden');
      playPad(idx);
      drawEditor();
      updateStepGrid();
      updatePadStepIndicators();
    });

    if (recBtn) recBtn.addEventListener('click', e => { e.stopPropagation(); startPadRecording(idx, recBtn); });

    if (stepToggle) {
      stepToggle.addEventListener('click', e => {
        e.stopPropagation();
        if (selectedStep === null) return;
        const arr = seqSteps[selectedStep];
        const pos = arr.indexOf(idx);
        if (pos === -1) arr.push(idx); else arr.splice(pos, 1);
        updateStepGrid();
        updatePadStepIndicators();
      });
    }
  });

  if (startInput) startInput.addEventListener('input', () => { padStart[selectedPad] = parseFloat(startInput.value) || 0; drawEditor(); });
  if (endInput)   endInput.addEventListener('input',   () => { padEnd[selectedPad]   = parseFloat(endInput.value)   || (buffers[selectedPad]?.duration ?? 0); drawEditor(); });
  if (pitchSliderPad) pitchSliderPad.addEventListener('input', () => { padPitch[selectedPad] = parseFloat(pitchSliderPad.value) || 1; });
  if (volSliderPad)   volSliderPad.addEventListener('input',   () => { padGain[selectedPad]  = parseFloat(volSliderPad.value)   || 1; });
  if (reverseToggle)  reverseToggle.addEventListener('change',  () => { padReverse[selectedPad] = reverseToggle.checked; });

  // Waveform trim handles
  waveformCanvas.addEventListener('pointerdown', e => {
    if (!buffers[selectedPad]) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const x    = (e.clientX - rect.left) * (waveformCanvas.width / rect.width);
    const buf  = buffers[selectedPad];
    const sx   = (padStart[selectedPad] / buf.duration) * waveformCanvas.width;
    const ex   = (padEnd[selectedPad]   / buf.duration) * waveformCanvas.width;
    draggingStart = Math.abs(x - sx) <= Math.abs(x - ex);
    draggingEnd   = !draggingStart;
    waveformCanvas.setPointerCapture(e.pointerId);
  });

  waveformCanvas.addEventListener('pointermove', e => {
    if (!draggingStart && !draggingEnd) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const x    = (e.clientX - rect.left) * (waveformCanvas.width / rect.width);
    const buf  = buffers[selectedPad];
    const t    = (x / waveformCanvas.width) * buf.duration;
    if (draggingStart) {
      padStart[selectedPad] = Math.max(0, Math.min(t, padEnd[selectedPad]));
      if (startInput) startInput.value = padStart[selectedPad].toFixed(2);
    } else {
      padEnd[selectedPad] = Math.min(buf.duration, Math.max(t, padStart[selectedPad]));
      if (endInput) endInput.value = padEnd[selectedPad].toFixed(2);
    }
    drawEditor();
  });

  waveformCanvas.addEventListener('pointerup', e => {
    draggingStart = false;
    draggingEnd = false;
    waveformCanvas.releasePointerCapture(e.pointerId);
  });

  // --- Public API (used by radio_orb trigger in main.js) ---
  window.radioSamplerPlayPad = playPad;
  window.radioSamplerInfo = {
    get gainNode()     { return window.radioGainNode; },
    get analyserNode() { return window.radioAnalyserNode; },
    get isPlaying()    { return isRadioPlaying; },
    get hasRecording() { return buffers.some(Boolean); },
  };

  updatePadStepIndicators();
  updateStepGrid();
  updateTuning();
}

document.addEventListener('DOMContentLoaded', initRadioSampler);
