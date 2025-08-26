export async function playWithToneSampler(
  buffer,
  baseFreq,
  freq,
  startTime,
  attack,
  release,
  velocity,
  destination,
) {
  // sampler logs removed

  const ctx = globalThis.audioContext;
  if (!ctx) {
    return;
  }

  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch (e) {
      return;
    }
  }
  if (!buffer) {
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const rate = baseFreq ? freq / baseFreq : 1;
  if (!baseFreq) {
    // baseFreq invalid, defaulting playbackRate to 1
  }
  source.playbackRate.value = rate;

  const dest = destination ?? ctx.destination;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const actualStart = Math.max(now, startTime);
  const safeVelocity = Number.isFinite(velocity) && velocity > 0 ? velocity : 0.001;
  if (safeVelocity !== velocity) {
    // invalid velocity
  }
  gain.gain.setValueAtTime(0, actualStart);
  gain.gain.linearRampToValueAtTime(safeVelocity, actualStart + attack);
  gain.gain.setTargetAtTime(0, actualStart + attack + buffer.duration, release / 4);

  source.connect(gain);
  gain.connect(dest);

  try {
    source.start(actualStart, 0, buffer.duration);
  } catch (e) {
    return;
  }
  const stopTime = actualStart + buffer.duration + release;
  source.stop(stopTime);



  setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch (e) {
    }
  }, (stopTime - ctx.currentTime + 0.5) * 1000);
}
