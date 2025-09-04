export async function playWithToneSampler(
  buffer,
  baseFreq,
  freq,
  startTime,
  attack,
  decay,
  sustain,
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
  // ADSR Envelope - each voice has its own independent envelope
  gain.gain.setValueAtTime(0, actualStart);
  
  // Attack: 0 -> velocity
  gain.gain.linearRampToValueAtTime(safeVelocity, actualStart + attack);
  
  // Decay: velocity -> sustain * velocity  
  const sustainLevel = safeVelocity * Math.max(0, Math.min(1, sustain));
  const decayEnd = actualStart + attack + decay;
  if (decay > 0.001) {
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), decayEnd);
  }
  
  source.connect(gain);
  gain.connect(dest);

  // Sustain: hold sustain level during sample playback
  const sustainTime = Math.max(0.1, buffer.duration - attack - decay); // Ensure minimum sustain
  const releaseStart = decayEnd + sustainTime;
  
  // Release: sustain -> 0
  if (release > 0.001) {
    const releaseEnd = releaseStart + release;
    gain.gain.exponentialRampToValueAtTime(0.001, releaseEnd);
  } else {
    gain.gain.setValueAtTime(0.001, releaseStart);
  }

  try {
    source.start(actualStart, 0, buffer.duration);
  } catch (e) {
    return;
  }
  const stopTime = releaseStart + (release > 0.001 ? release : 0) + 0.1; // Add small buffer
  source.stop(stopTime);



  setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch (e) {
    }
  }, (stopTime - ctx.currentTime + 0.5) * 1000);
}
