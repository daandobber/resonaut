const TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SPEED_MANUAL = 0.005;
const TIMELINE_GRID_DEFAULT_AUTO_ROTATE_DIRECTION = "clockwise";
  } catch (e) {}
function makeParameterGroup() {
  const selectedNodes = Array.from(selectedElements)
    .filter((el) => el.type === "node")
    .map((el) => findNodeById(el.id))
    .filter(
      (n) =>
        n &&
        isPlayableNode(n) &&
        n.audioParams &&
        n.audioNodes &&
        n.type !== TIMELINE_GRID_TYPE
    );
  if (selectedNodes.length < 2) {
    alert("Select at least two compatible nodes to link.");
  const firstNodeType = selectedNodes[0].type;
  if (!selectedNodes.every((n) => n.type === firstNodeType)) {
    alert("Select nodes of the same type to link.");
    return;
  }
paramGroups.forEach((g) => {
  selectedNodes.forEach((n) => g.nodeIds.delete(n.id));
});
paramGroups = paramGroups.filter((g) => g.nodeIds.size > 0);

const firstNode = selectedNodes[0];
if (!firstNode || !firstNode.audioParams) {
  alert("Selected node has no parameters.");
  return;
}
const baseParams = JSON.parse(JSON.stringify(firstNode.audioParams));
delete baseParams.pitch;
delete baseParams.scaleIndex;
const group = {
  id: `paramGroup_${paramGroupIdCounter++}`,
  nodeIds: new Set(selectedNodes.map((n) => n.id)),
  params: null,
  nodeParamTargets: new Map(),
};
const proxy = new Proxy(baseParams, {
  set(target, prop, value) {
    if (prop === "pitch" || prop === "scaleIndex") {
    }
    target[prop] = value;
    const g = paramGroupMap.get(proxy);
    if (g) {
      g.nodeIds.forEach((id) => {
        const n = findNodeById(id);
        const nodeTarget = g.nodeParamTargets.get(id);
        // Ensure each linked node's parameter object reflects the latest
        // value so audio updates propagate immediately without triggering
        // recursive proxy writes.
        if (nodeTarget) {
          if (Object.prototype.hasOwnProperty.call(nodeTarget, prop)) {
            nodeTarget[prop] = value;
            Object.defineProperty(nodeTarget, prop, {
              value,
              writable: true,
              enumerable: true,
              configurable: true,
            });
        }
        if (n && n.audioNodes) refreshNodeAudio(n);
    return true;
  },
});
group.params = proxy;
paramGroupMap.set(proxy, group);
paramGroups.push(group);
group.nodeIds.forEach((id) => {
  const n = findNodeById(id);
  if (n) {
    const nodeParams = { pitch: n.audioParams.pitch, scaleIndex: n.audioParams.scaleIndex };
    Object.setPrototypeOf(nodeParams, proxy);
    const paramProxy = new Proxy(nodeParams, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return proxy[prop];
      },
      set(target, prop, value) {
        if (prop === "pitch" || prop === "scaleIndex") {
          target[prop] = value;
          refreshNodeAudio(n);
        } else {
          proxy[prop] = value;
        }
        return true;
      },
    });
    group.nodeParamTargets.set(id, nodeParams);
    n.audioParams = paramProxy;
    refreshNodeAudio(n);
  }
});
saveState();
) {}
) {}
    } catch (resumeErr) {}
          .catch((err) => {});
                                            (e) => {
                                              isReverbReady = false;rej(e);
                                            });
      isReverbReady = false;
    if(startMessage) {
        startMessage.textContent = "Audio Context Error";
        startMessage.style.display = "block";
    }
    isAudioReady = false;
    if (typeof window !== 'undefined') window.isAudioReady = false;
    return null;

      isReverbReady = false;
      return null;
      return null;
function updateConnectionAudioParams(connection) {
  if (
    !connection.audioNodes ||
    connection.type !== "string_violin" ||
    !isAudioReady
  )
    return;
  const now = audioContext.currentTime;
  const params = connection.audioParams;
  const timeConstantForPitch = 0.05;
  // Ensure we have a valid base pitch
  const requestedPitch = (params && typeof params.pitch === 'number') ? params.pitch : 440;
  const sanitizedPitch = sanitizeFrequency(requestedPitch);
try {
  const {
    gainNode,
    filterNode,
    reverbSendGain,
    delaySendGain,
    oscillators,
    vibratoLfo,
    vibratoGain,
  } = connection.audioNodes;
  if (!gainNode || !filterNode || !oscillators || !vibratoLfo || !vibratoGain)
    return;
  oscillators.forEach((osc, i) => {
    const freq = sanitizedPitch;
    const detuneAmount =
      i === 0
        ? 0
        : (i % 2 === 1 ? 1 : -1) *
          Math.ceil(i / 2) *
          (params.detune ?? STRING_VIOLIN_DEFAULTS.detune);
    osc.frequency.setTargetAtTime(freq, now, timeConstantForPitch);
    osc.detune.setTargetAtTime(detuneAmount, now, timeConstantForPitch);
  });
  filterNode.frequency.setTargetAtTime(
    sanitizedPitch *
      (params.filterFreqFactor ?? STRING_VIOLIN_DEFAULTS.filterFreqFactor),
    now,
    timeConstantForPitch,
  );
  filterNode.Q.setTargetAtTime(
    params.filterQ ?? STRING_VIOLIN_DEFAULTS.filterQ,
    now,
    0.02,
  );

  vibratoLfo.frequency.setTargetAtTime(
    params.vibratoRate ?? STRING_VIOLIN_DEFAULTS.vibratoRate,
    now,
    0.02,
  );
  vibratoGain.gain.setTargetAtTime(
    params.vibratoDepth ?? STRING_VIOLIN_DEFAULTS.vibratoDepth,
    now,
    0.02,
  );
  if (isReverbReady && reverbSendGain) {
    reverbSendGain.gain.setTargetAtTime(
      params.reverbSend ?? DEFAULT_REVERB_SEND,
  }
  if (isDelayReady && delaySendGain) {
    delaySendGain.gain.setTargetAtTime(
      params.delaySend ?? DEFAULT_DELAY_SEND,
} catch (e) {}
function createAudioNodesForConnection(connection) {
  if (!audioContext || connection.type !== "string_violin") return null;
  const now = audioContext.currentTime;
  const startDelay = now + 0.02;
  try {
    const params = connection.audioParams;
    // Compute sanitized base pitch for initial node setup
    const requestedPitch = (params && typeof params.pitch === 'number') ? params.pitch : 440;
    const sanitizedPitch = sanitizeFrequency(requestedPitch);
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0;
  const filterNode = audioContext.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.value =
    sanitizedPitch *
    (params.filterFreqFactor ?? STRING_VIOLIN_DEFAULTS.filterFreqFactor);
  filterNode.Q.value = params.filterQ ?? STRING_VIOLIN_DEFAULTS.filterQ;
  const vibratoLfo = audioContext.createOscillator();
  vibratoLfo.type = "sine";
  vibratoLfo.frequency.value =
    params.vibratoRate ?? STRING_VIOLIN_DEFAULTS.vibratoRate;
  const vibratoGain = audioContext.createGain();
  vibratoGain.gain.value =
    params.vibratoDepth ?? STRING_VIOLIN_DEFAULTS.vibratoDepth;
  vibratoLfo.connect(vibratoGain);
  const oscillators = [];
  const numOsc = params.numOsc ?? STRING_VIOLIN_DEFAULTS.numOsc;
  for (let i = 0; i < numOsc; i++) {
    const osc = audioContext.createOscillator();
    osc.type = "sawtooth";
    const freq = sanitizedPitch;
    const detuneAmount =
      i === 0
        ? 0
        : (i % 2 === 1 ? 1 : -1) *
          Math.ceil(i / 2) *
          (params.detune ?? STRING_VIOLIN_DEFAULTS.detune);
    osc.frequency.value = freq;
    osc.detune.value = detuneAmount;
    vibratoGain.connect(osc.detune);
    osc.connect(filterNode);
    oscillators.push(osc);
  }
  filterNode.connect(gainNode);
  let reverbSendGain = null;
  if (isReverbReady && reverbNode) {
    reverbSendGain = audioContext.createGain();
    reverbSendGain.gain.value = params.reverbSend ?? DEFAULT_REVERB_SEND;
  }
  let delaySendGain = null;
  if (isDelayReady && masterDelaySendGain) {
    delaySendGain = audioContext.createGain();
    delaySendGain.gain.value = params.delaySend ?? DEFAULT_DELAY_SEND;
  }
  try {
    vibratoLfo.start(startDelay);
  } catch (e) {}
  oscillators.forEach((osc) => {
      osc.start(startDelay);
  });
  return {
    gainNode,
    filterNode,
    oscillators,
    vibratoLfo,
    vibratoGain,
    reverbSendGain,
    delaySendGain,
  };
} catch (e) {
    }
    }
      } catch (e) {}
  } catch (e) {}
function updateAndDrawPulses(now) {
const defaultPulseColor =
  getComputedStyle(document.body || document.documentElement)
    .getPropertyValue("--pulse-visual-color")
    .trim() || "rgba(255, 255, 255, 1)";
const stringPulseColor =
  getComputedStyle(document.body || document.documentElement)
    .getPropertyValue("--string-violin-pulse-color")
    .trim() || "#ffccaa";
const wavetrailGlowColor = "rgba(230, 255, 230, 0.7)";
const envelopeResolution = 128;
const hanningWindowCurve = createHanningWindow(envelopeResolution);

  // Helper: distance from point to line segment (returns {dist, t, vx, vy})
  function pointToSegmentInfo(px, py, ax, ay, bx, by) {
    const vx = bx - ax;
    const vy = by - ay;
    const len2 = vx * vx + vy * vy || 1;
    let t = ((px - ax) * vx + (py - ay) * vy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * vx;
    const cy = ay + t * vy;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return { dist, t, vx, vy };
  }

  // Try pluck: when a pulse crosses near a string connection at ~perpendicular angle
  function maybePluckNearbyString(pulseX, pulseY, pulseDirX, pulseDirY, intensity) {
    // Early exit if no connections
    if (!Array.isArray(connections) || connections.length === 0) return;
    const nowMs = performance && performance.now ? performance.now() : Date.now();
    const proximity = 8 / (viewScale || 1); // pixels
    const minAngleCos = Math.cos(Math.PI * 60 / 180); // >60deg ~ fairly perpendicular

    for (const s of connections) {
      if (!s || s.type !== 'string_violin') continue;
      const nA = findNodeById(s.nodeAId);
      const nB = findNodeById(s.nodeBId);
      if (!nA || !nB) continue;
      const pA = getConnectionPoint(nA, s.nodeAHandle);
      const pB = getConnectionPoint(nB, s.nodeBHandle);
      const info = pointToSegmentInfo(pulseX, pulseY, pA.x, pA.y, pB.x, pB.y);
      if (info.dist > proximity) continue;
      // Angle check
      const svx = info.vx;
      const svy = info.vy;
      const spl = Math.sqrt(svx * svx + svy * svy) || 1;
      const pdl = Math.sqrt(pulseDirX * pulseDirX + pulseDirY * pulseDirY) || 1;
      const cos = (svx * pulseDirX + svy * pulseDirY) / (spl * pdl);
      if (Math.abs(cos) > minAngleCos) continue; // too parallel

      // Cooldown to avoid rapid retriggers
      const cooldownMs = 140;
      const last = s.__lastPluckTime || 0;
      if (nowMs - last < cooldownMs) continue;
      s.__lastPluckTime = nowMs;

      // Trigger a short, plucky envelope on the string
      try { pluckStringSound(s, Math.max(0.2, Math.min(1.0, intensity || 1.0))); } catch(e) {}
      try { s.animationState = Math.min(1.0, (s.animationState || 0) + 0.6); } catch(_) {}
    }
  }

  activePulses = activePulses.filter((p) => {
  const elapsedTime = now - p.startTime;
  const connection = findConnectionById(p.connectionId);

  if (!connection || elapsedTime >= p.duration) {
      connection &&
      connection.type === "string_violin" &&
      p.audioStartTime
      stopStringSound(connection);
    if (connection && connection.type === "wavetrail" && p.granularGainNode) {
      try {
        p.granularGainNode.gain.cancelScheduledValues(now);
        p.granularGainNode.gain.setTargetAtTime(0, now, 0.05);
        setTimeout(() => {
          if (p.granularGainNode) p.granularGainNode.disconnect();
        }, 60);
      } catch (e) {}
      p.granularGainNode = null;
    }
    return false;
  }
  const nodeA = findNodeById(connection.nodeAId);
  const nodeB = findNodeById(connection.nodeBId);
  if (!nodeA || !nodeB) return false;
  const progress = Math.min(1.0, elapsedTime / p.duration);
  let bufferDuration = 0;
  let pathData = null;
  let totalPathPoints = 0;
  let hasAudio = false;
  if (
    connection.type === "wavetrail" &&
    connection.audioParams?.buffer &&
    connection.audioParams?.waveformPath
  ) {
    bufferDuration = connection.audioParams.buffer.duration;
    pathData = connection.audioParams.waveformPath;
    totalPathPoints = pathData.length;
    hasAudio = true;
  }
    if (connection.type === "wavetrail" && hasAudio && bufferDuration > 0) {
    if (!p.granularGainNode && audioContext) {
      try {
        p.granularGainNode = audioContext.createGain();
        p.granularGainNode.connect(masterGain);
        p.lastGrainTime = p.startTime;
        p.granularGainNode.gain.setValueAtTime(
          (p.intensity || 1.0) * 0.7,
          p.startTime,
      } catch (e) {
        p.granularGainNode = null;
    }
    if (p.granularGainNode) {
      const grainDuration = connection.audioParams.grainDuration || 0.09;
      const grainOverlap = connection.audioParams.grainOverlap || 0.07;
      const grainInterval = Math.max(0.005, grainDuration - grainOverlap);
      const playbackRate = connection.audioParams.playbackRate || 1.0;


      if (now - p.lastGrainTime >= grainInterval && effectiveDuration > 0) {
        try {
          const grainSource = audioContext.createBufferSource();
          grainSource.buffer = connection.audioParams.buffer;
          grainSource.playbackRate.setValueAtTime(playbackRate, now);
          const grainGain = audioContext.createGain();
          grainGain.gain.setValueAtTime(0, now);
          grainGain.gain.setValueCurveAtTime(
            hanningWindowCurve,
            now,
            grainDuration,
          );
          grainSource.connect(grainGain);
          grainGain.connect(p.granularGainNode);

          const offset = Math.max(
            0,
            Math.min(bufferDuration - 0.001, currentBufferTime),
          );
          const duration = Math.min(
            grainDuration / playbackRate,
            bufferDuration - offset,
          );

          if (duration > 0.001) {
            grainSource.start(now, offset, duration);
            grainSource.onended = () => {
              try {
                grainSource.disconnect();
                grainGain.disconnect();
              } catch (e) {}
            };
          } else {
            try {
              grainSource.disconnect();
              grainGain.disconnect();
            } catch (e) {}
          }
          p.lastGrainTime = now;
        } catch (grainError) {}
    }
  }

    let pX, pY;
    let dirX = 0, dirY = 0;
    if (connection.type === 'string_violin') {
      const point = getStringConnectionPoint(connection, progress);
      pX = point.x; pY = point.y;
      const prevPoint = getStringConnectionPoint(connection, Math.max(0, progress - 0.01));
      dirX = pX - prevPoint.x; dirY = pY - prevPoint.y;
      const startNodeForDraw = p.startNodeId === nodeA.id ? nodeA : nodeB;
      const startPos = getConnectionPoint(startNodeForDraw, startNodeForDraw.id === nodeA.id ? connection.nodeAHandle : connection.nodeBHandle);
      const endPos = getConnectionPoint(startNodeForDraw.id === nodeA.id ? nodeB : nodeA, startNodeForDraw.id === nodeA.id ? connection.nodeBHandle : connection.nodeAHandle);
      const midX = (startPos.x + endPos.x) / 2 + connection.controlPointOffsetX;
      const midY = (startPos.y + endPos.y) / 2 + connection.controlPointOffsetY;
      pX = lerp(
        lerp(startPos.x, midX, progress),
        lerp(midX, endPos.x, progress),
        progress,
      );
      pY = lerp(
        lerp(startPos.y, midY, progress),
        lerp(midY, endPos.y, progress),
        progress,
      );
      const prevProgress = Math.max(0, progress - 0.01);
      const prevXCalc = lerp(
        lerp(startPos.x, midX, prevProgress),
        lerp(midX, endPos.x, prevProgress),
        prevProgress,
      );
      const prevYCalc = lerp(
        lerp(startPos.y, midY, prevProgress),
        lerp(midY, endPos.y, prevProgress),
        prevProgress,
      );
      dirX = pX - prevXCalc; dirY = pY - prevYCalc;
    // Only pluck strings when traveling on non-string connections
    if (connection.type !== 'string_violin') {
      maybePluckNearbyString(pX, pY, dirX, dirY, p.intensity || 1.0);
    }

  if (connection.type === "wavetrail" && hasAudio) {
    let currentAmplitude = 0;
    let positiveGlowAmplitude = 0;
    let negativeGlowAmplitude = 0;

    const startTimeOffset = connection.audioParams.startTimeOffset || 0;
    const endTimeOffset =
      connection.audioParams.endTimeOffset ?? bufferDuration;
    const actualEndTime = Math.max(startTimeOffset + 0.01, endTimeOffset);
    const effectiveDuration = actualEndTime - startTimeOffset;
    const isReverse = p.startNodeId === connection.nodeBId;
    let currentBufferTime;
    if (isReverse) {
      currentBufferTime =
        startTimeOffset + (1.0 - progress) * effectiveDuration;
    } else {
      currentBufferTime = startTimeOffset + progress * effectiveDuration;
    }
    const audioProgress = currentBufferTime / bufferDuration;
    const i = Math.max(
      0,
      Math.min(
        totalPathPoints - 1,
        Math.floor(audioProgress * totalPathPoints),
      ),
    );
    if (pathData[i]) {
      currentAmplitude = Math.abs(pathData[i].max - pathData[i].min);
      positiveGlowAmplitude = pathData[i].max > 0 ? pathData[i].max : 0;
      negativeGlowAmplitude = pathData[i].min < 0 ? pathData[i].min : 0;
    }

    if (currentAmplitude > 0.05) {
      ctx.save();

      const glowLineWidth = (1.5 + currentAmplitude * 3.0) / viewScale;
      const glowAlpha = Math.min(0.7, 0.2 + currentAmplitude * 0.5);
      const glowBlur = (12 + currentAmplitude * 18) / viewScale;
      const maxVisualAmplitude = 15 / viewScale;
      const dx_glow = nodeB.x - nodeA.x;
      const dy_glow = nodeB.y - nodeA.y;
      const lineAngle_glow = Math.atan2(dy_glow, dx_glow);
      const perpAngle_glow = lineAngle_glow + Math.PI / 2;
      const topGlowOffsetX =
        Math.cos(perpAngle_glow) *
        positiveGlowAmplitude *
        maxVisualAmplitude *
        1.1;
      const topGlowOffsetY =
        Math.sin(perpAngle_glow) *
        positiveGlowAmplitude *
        maxVisualAmplitude *
        1.1;
      const bottomGlowOffsetX =
        Math.cos(perpAngle_glow) *
        negativeGlowAmplitude *
        maxVisualAmplitude *
        1.1;
      const bottomGlowOffsetY =
        Math.sin(perpAngle_glow) *
        negativeGlowAmplitude *
        maxVisualAmplitude *
        1.1;

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = wavetrailGlowColor.replace(
        /[\d\.]+\)$/g,
        `${glowAlpha})`,
      );
      ctx.lineWidth = glowLineWidth;
      ctx.shadowColor = wavetrailGlowColor.replace(
        /[\d\.]+\)$/g,
        `${glowAlpha * 0.7})`,
      );
      ctx.shadowBlur = glowBlur;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pX + bottomGlowOffsetX, pY + bottomGlowOffsetY);
      ctx.lineTo(pX + topGlowOffsetX, pY + topGlowOffsetY);
      ctx.stroke();

      ctx.restore();
    }
  } else {
    drawStandardPulseVisual(p, pX, pY, connection, progress);
  }

  return true;
});
  } catch (e) {}
      return;
  } catch (err) {}
function stopStringSound(connection) {
  if (!connection.audioNodes || connection.type !== "string_violin") return;
  const now = audioContext.currentTime;
  const { gainNode } = connection.audioNodes;
  const params = connection.audioParams;
  const defaults = STRING_VIOLIN_DEFAULTS;
  const releaseTime = params.release ?? defaults.release;
  try {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(0, now, releaseTime / 3);
  } catch (e) {}
}
// Short, percussive pluck for string_violin connection
function pluckStringSound(connection, intensity = 1.0) {
  if (!connection.audioNodes || connection.type !== "string_violin") return;
  const now = audioContext.currentTime;
  const {
    gainNode,
    filterNode,
    // reverbSendGain, delaySendGain, // available if needed later
  } = connection.audioNodes;
  const params = connection.audioParams || {};
  const defaults = STRING_VIOLIN_DEFAULTS;
  const baseVolume = params.volume ?? defaults.volume;
  const peak = Math.max(0.02, Math.min(1.0, baseVolume * intensity * 1.1));
  // Briefly open the filter for a brighter transient
  const requestedPitch = (typeof params.pitch === 'number') ? params.pitch : 440;
  const sanitized = sanitizeFrequency(requestedPitch);
  const normalFreq = sanitized * (params.filterFreqFactor ?? defaults.filterFreqFactor);
  const burstFreq = normalFreq * 3.0;
  const targetQ = params.filterQ ?? defaults.filterQ;
  const burstQ = Math.min(6, targetQ + 0.8);
  try {
    // Gain envelope: fast attack, quick decay to near-zero
    gainNode.gain.cancelScheduledValues(now);
    const currentVal = (() => { try { return gainNode.gain.value; } catch { return 0; } })();
    gainNode.gain.setValueAtTime(Math.max(0, currentVal), now);
    gainNode.gain.linearRampToValueAtTime(peak, now + 0.01);
    // Exponential-like decay using setTargetAtTime
    gainNode.gain.setTargetAtTime(0.0008, now + 0.02, 0.06);
  } catch (e) {}
  try {
    filterNode.frequency.cancelScheduledValues(now);
    filterNode.frequency.setValueAtTime(burstFreq, now);
    filterNode.frequency.setTargetAtTime(normalFreq, now + 0.005, 0.07);
    filterNode.Q.cancelScheduledValues(now);
    filterNode.Q.setValueAtTime(burstQ, now);
    filterNode.Q.setTargetAtTime(targetQ, now + 0.005, 0.08);
  } catch (e) {}
}
        } catch (e) {}
        } catch (e) {}
      } catch (e) {}
      historyIndex++;
      historyIndex--;
    try {
      globalThis.DEBUG_PATCH_EFFECTS;
    } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
      try {
        globalThis.DEBUG_PATCH_EFFECTS;
      } catch {}
  }
    if (connection && connection.audioParams) {
        connection.audioParams.buffer = null;
        connection.audioParams.waveformPath = null;
        const fileNameDisplay = document.getElementById(`edit-wavetrail-filename-${connection.id}`);
        if (fileNameDisplay) {
            fileNameDisplay.textContent = `Error: Invalid data for ${connection.audioParams.fileName || "file"}`;
        }
    }
    populateEditPanel();
    return;
    if (connection.audioParams.waveformPath && connection.audioParams.waveformPath.length > 0)
      {}
    if (fileNameDisplay) {
        fileNameDisplay.textContent = `Error decoding: ${connection.audioParams.fileName || "file"}`;
    }
    connection.audioParams.buffer = null;
    connection.audioParams.waveformPath = null;
    populateEditPanel();
  }
function onMIDIFailure(msg) {}
      } catch (e) {}
