export function playWithToneSampler(
  buffer,
  baseFreq,
  freq,
  startTime,
  attack,
  release,
  velocity,
  destination,
) {
  console.log('[playWithToneSampler] Invoked', {
    baseFreq,
    freq,
    startTime,
    attack,
    release,
    velocity,
  });

  const ctx = globalThis.audioContext;
  if (!ctx) {
    console.warn('[playWithToneSampler] AudioContext not available.');
    return;
  }

  if (ctx.state !== 'running') {
    console.warn('[playWithToneSampler] AudioContext state is', ctx.state);
    try {
      ctx.resume().then(() => {
        console.log('[playWithToneSampler] AudioContext resumed');
      });
    } catch (e) {
      console.error('[playWithToneSampler] Failed to resume AudioContext', e);
      return;
    }
  }
  if (!buffer) {
    console.warn('[playWithToneSampler] No buffer provided.');
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const rate = baseFreq ? freq / baseFreq : 1;
  if (!baseFreq) {
    console.warn(
      '[playWithToneSampler] baseFreq invalid, defaulting playbackRate to 1.',
    );
  }
  source.playbackRate.value = rate;

  const dest = destination ?? ctx.destination;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const actualStart = Math.max(now, startTime);
  gain.gain.setValueAtTime(0, actualStart);
  gain.gain.linearRampToValueAtTime(velocity, actualStart + attack);
  gain.gain.setTargetAtTime(0, actualStart + attack + buffer.duration, release / 4);

  source.connect(gain);
  gain.connect(dest);

  try {
    source.start(actualStart, 0, buffer.duration);
  } catch (e) {
    console.error('[playWithToneSampler] Failed to start source.', e);
    return;
  }
  const stopTime = actualStart + buffer.duration + release;
  source.stop(stopTime);

  console.log('[playWithToneSampler] Scheduled sample', {
    startTime,
    actualStart,
    stopTime,
    rate,
    velocity,
  });

  setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch (e) {
      console.warn('[playWithToneSampler] Error during disconnect.', e);
    }
  }, (stopTime - ctx.currentTime + 0.5) * 1000);
}
