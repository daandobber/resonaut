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
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = freq / baseFreq;

  const dest = destination ?? audioContext.destination;
  const gain = audioContext.createGain();
  const actualStart = Math.max(audioContext.currentTime, startTime);
  gain.gain.setValueAtTime(0, actualStart);
  gain.gain.linearRampToValueAtTime(velocity, actualStart + attack);
  gain.gain.setTargetAtTime(0, actualStart + attack + buffer.duration, release / 4);

  source.connect(gain);
  gain.connect(dest);

  source.start(actualStart, 0, buffer.duration);
  const stopTime = actualStart + buffer.duration + release;
  source.stop(stopTime);

  setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch (e) {}
  }, (stopTime - audioContext.currentTime + 0.5) * 1000);
}
