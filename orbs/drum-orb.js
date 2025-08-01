import { DRUM_ELEMENT_DEFAULTS, DEFAULT_REVERB_SEND, DEFAULT_DELAY_SEND } from "../utils/appConstants.js";


export const drumElementTypes = Object.keys(DRUM_ELEMENT_DEFAULTS).map(key => ({
  type: key,
  label: DRUM_ELEMENT_DEFAULTS[key].label,
  icon: DRUM_ELEMENT_DEFAULTS[key].icon,
}));

export function isDrumType(type) {
  return drumElementTypes.some(dt => dt.type === type);
}

export function createDrumOrbAudioNodes(node) {
  const p = node.audioParams;
  const audioNodes = { mainGain: globalThis.audioContext.createGain() };
  audioNodes.mainGain.gain.value = p.volume || 1.0;
  if (globalThis.isReverbReady && globalThis.reverbPreDelayNode) {
    audioNodes.reverbSendGain = globalThis.audioContext.createGain();
    audioNodes.reverbSendGain.gain.value = p.reverbSend ?? DEFAULT_REVERB_SEND;
    audioNodes.mainGain.connect(audioNodes.reverbSendGain);
    audioNodes.reverbSendGain.connect(globalThis.reverbPreDelayNode);
  }
  if (globalThis.isDelayReady && globalThis.masterDelaySendGain) {
    audioNodes.delaySendGain = globalThis.audioContext.createGain();
    audioNodes.delaySendGain.gain.value = p.delaySend ?? DEFAULT_DELAY_SEND;
    audioNodes.mainGain.connect(audioNodes.delaySendGain);
    audioNodes.delaySendGain.connect(globalThis.masterDelaySendGain);
  }
  if (globalThis.mistEffectInput) {
    audioNodes.mistSendGain = globalThis.audioContext.createGain();
    audioNodes.mistSendGain.gain.value = 0;
    audioNodes.mainGain.connect(audioNodes.mistSendGain);
    audioNodes.mistSendGain.connect(globalThis.mistEffectInput);
  }
  if (globalThis.crushEffectInput) {
    audioNodes.crushSendGain = globalThis.audioContext.createGain();
    audioNodes.crushSendGain.gain.value = 0;
    audioNodes.mainGain.connect(audioNodes.crushSendGain);
    audioNodes.crushSendGain.connect(globalThis.crushEffectInput);
  }
  audioNodes.mainGain.connect(globalThis.masterGain);
  return audioNodes;
}

export function triggerDrumOrb(node, intensity = 1.0) {
  if (!node.audioNodes?.mainGain) return;
  const params = node.audioParams;
  const mainGain = node.audioNodes.mainGain;
  const finalVol = (params.volume || 1.0) * intensity;
  const targetFreq = params.baseFreq;
  const now = globalThis.audioContext.currentTime;
}

export function drawDrumOrb(ctx, node, r, viewScale, baseLineWidth, fillColor, borderColor) {
  ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
  ctx.strokeStyle = borderColor;
  ctx.fillStyle = fillColor;
  switch (node.type) {
    case 'drum_kick':
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const innerR = r * (0.6 + node.animationState * 0.1);
      ctx.fillStyle = fillColor.replace(/[\d.]+\)$/g, '0.6)');
      ctx.beginPath();
      ctx.arc(node.x, node.y, innerR, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

export function addDrumEditUI(node, selectedArray, currentSection) {
  const params = node.audioParams;
  const defaults = DRUM_ELEMENT_DEFAULTS[node.type];
  const soundDiv = document.createElement('div');
  soundDiv.classList.add('edit-drum-sound');
  const soundLabel = document.createElement('strong');
  soundLabel.textContent = defaults.label;
  soundDiv.appendChild(soundLabel);
  const currentBaseFreq = params?.baseFreq ?? defaults?.baseFreq ?? 60;
  const tuneSlider = createSlider(`edit-drum-tune-${node.id}`, `Tune (${currentBaseFreq.toFixed(0)}Hz):`, 20,
    node.type === 'drum_hihat' ? 15000 : (node.type === 'drum_cowbell' || node.type === 'drum_clap' ? 2000 : 1000),
    1, currentBaseFreq,
    () => { identifyAndRouteAllGroups(); saveState(); },
    e => {
      const val = parseFloat(e.target.value);
      selectedArray.forEach(el => { const n = findNodeById(el.id); if (n?.audioParams) n.audioParams.baseFreq = val; });
      e.target.previousElementSibling.textContent = `Tune (${val.toFixed(0)}Hz):`;
    });
  soundDiv.appendChild(tuneSlider);
  currentSection.appendChild(soundDiv);
}
