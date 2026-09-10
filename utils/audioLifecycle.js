// Hold the audible value when retriggering, instead of cutting a live waveform
// to zero. Both native AudioParams and Tone.Params support this operation.
export function holdAudioParam(param, time) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(time);
  } else {
    const value = param.value;
    param.cancelScheduledValues(time);
    param.setValueAtTime(value, time);
  }
}

// Sources stop on the audio clock, even if the UI thread is busy or backgrounded.
// The timeout only frees JS/Tone objects and uses a duration, not an absolute time.
export function scheduleTransientVoice(owner, sources, resources, context, endTime) {
  owner.transientVoices ??= new Set();
  let timer;
  let disposed = false;
  const voice = {
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      for (const source of sources) { try { source.stop(); } catch {} }
      for (const resource of new Set([...sources, ...resources])) {
        try { resource.dispose ? resource.dispose() : resource.disconnect(); } catch {}
      }
      owner.transientVoices.delete(voice);
    },
  };
  owner.transientVoices.add(voice);
  sources.forEach(source => source.stop(endTime));
  timer = setTimeout(() => voice.dispose(), Math.max(0, endTime - context.currentTime + 0.05) * 1000);
  return voice;
}

export function stopTransientVoices(owner) {
  if (!owner?.transientVoices) return;
  [...owner.transientVoices].forEach(voice => voice.dispose());
}
