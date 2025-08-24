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

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(velocity, startTime + attack);
  gain.gain.setTargetAtTime(0, startTime + attack + buffer.duration, release / 4);

  source.connect(gain);
  const dest = destination ?? audioContext.destination;
  gain.connect(dest);

  source.start(startTime, 0, buffer.duration);
  const stopTime = startTime + buffer.duration + release;
  source.stop(stopTime);

  setTimeout(() => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch (e) {}
  }, (stopTime - audioContext.currentTime + 0.5) * 1000);
}
