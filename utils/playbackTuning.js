import { holdAudioParam } from './audioLifecycle.js';

// The editable note and the tuning of an already running voice are separate.
const tunings = new WeakMap();
const tails = new WeakMap();

export function capturePlaybackTuning(graph, params, scale, root, transpose) {
  if (!graph) return graph;
  tunings.set(graph, {
    pitch: params.pitch, scaleIndex: params.scaleIndex, params: { ...params },
    scale: { ...scale, notes: [...scale.notes] }, root, transpose,
  });
  return graph;
}

export function getPlaybackTuning(graph) { return tunings.get(graph); }

export function needsNewTuning(graph, params, scale, root, transpose) {
  const old = tunings.get(graph);
  return !!old && (old.pitch !== params.pitch || old.scaleIndex !== params.scaleIndex ||
    old.root !== root || old.transpose !== transpose ||
    old.scale.notes.join(',') !== scale.notes.join(','));
}

// Visit graph-owned audio resources, never a node's model, context or buffers.
export function disposeOwnedAudioGraph(graph) {
  const seen = new Set();
  function dispose(value) {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    try { value.stop?.(); } catch {}
    if (typeof value.dispose === 'function') { try { value.dispose(); } catch {} return; }
    if (typeof value.disconnect === 'function') { try { value.disconnect(); } catch {} return; }
    if (Array.isArray(value)) value.forEach(dispose);
    else if (Object.getPrototypeOf(value) === Object.prototype) {
      for (const [key, child] of Object.entries(value)) {
        if (!['nodeRef', 'audioContext', 'context', 'buffer', 'audioParams'].includes(key)) dispose(child);
      }
    }
  }
  dispose(graph);
}

export function retainAudioTail(owner, graph, seconds, context, cleanup) {
  let active = tails.get(owner);
  if (!active) tails.set(owner, active = new Set());
  let timer;
  let end = context.currentTime + seconds;
  const tail = { graph, finishing: false, finishSoon() {
    this.finishing = true;
    for (const voice of [graph, ...(graph.orbitoneSynths || [])]) {
      const gain = (voice.gainNode || voice.mainGain || voice.mix || voice.output)?.gain;
      if (gain) {
        holdAudioParam(gain, context.currentTime);
        gain.linearRampToValueAtTime(0, context.currentTime + 0.02);
      }
    }
    end = context.currentTime + 0.03;
    clearTimeout(timer);
    timer = setTimeout(check, 50);
  }, dispose() {
    clearTimeout(timer);
    if (!active.delete(tail)) return;
    cleanup(graph);
  } };
  active.add(tail);
  // A suspended audio clock must not shorten a release.
  const check = () => {
    const remaining = end - context.currentTime;
    if (remaining <= 0) tail.dispose();
    else timer = setTimeout(check, Math.max(50, remaining * 1000));
  };
  timer = setTimeout(check, seconds * 1000);
  // Bound CPU use during very fast, continuously changing sequences.
  const ringing = [...active].filter(voice => !voice.finishing);
  if (ringing.length > 8) ringing[0].finishSoon();
  return tail;
}

export function stopAudioTails(owner) {
  for (const tail of [...(tails.get(owner) || [])]) tail.dispose();
}

export function getAudioTailCount(owner, time = 0) {
  return [...(tails.get(owner) || [])].filter(tail => !tail.finishing &&
    (tunings.get(tail.graph)?.audibleUntil ?? Infinity) > time).length;
}
