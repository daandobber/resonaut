export const TAPE_PRESETS = {
  clean: { warmth: 0, tone: 1, drift: 0 },
  warm: { warmth: 0.3, tone: 0.72, drift: 0.12 },
  worn: { warmth: 0.65, tone: 0.38, drift: 0.45 },
};

export function tapeSpeedLabel(rate) {
  return rate === 0 ? 'STOP' : `${rate < 0 ? 'REV' : 'FWD'} ${Math.abs(rate).toFixed(2)}x`;
}

export function reverseTapeBuffer(context, buffer) {
  const reversed = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    reversed.getChannelData(c).set(buffer.getChannelData(c));
    reversed.getChannelData(c).reverse();
  }
  return reversed;
}

export function wrapTapePosition(position, start, end) {
  const length = end - start;
  return start + ((position - start) % length + length) % length;
}

export function createTapeVoice(context, buffer, destination, settings, start, end, initialRate = 1) {
  const forward = prepareTapeBuffer(context, buffer, start, end);
  let reversed;
  let rate = initialRate;
  let position = start;
  let anchorTime = 0;
  let started = false;
  let stopped = false;
  let current;
  const sources = new Set();
  const shape = context.createWaveShaper();
  shape.oversample = '2x';
  const tone = context.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = 0.5;
  shape.connect(tone).connect(destination);
  const wow = context.createOscillator();
  wow.frequency.value = 0.65;
  const flutter = context.createOscillator();
  flutter.frequency.value = 5.3;
  const wowDepth = context.createGain();
  const flutterDepth = context.createGain();
  wow.connect(wowDepth);
  flutter.connect(flutterDepth);

  const release = (entry, time) => {
    entry.gain.gain.cancelAndHoldAtTime(time);
    entry.gain.gain.linearRampToValueAtTime(0, time + 0.008);
    entry.source.stop(time + 0.012);
  };
  function makeSource(time, originalPosition) {
    const source = context.createBufferSource();
    const reverse = rate < 0;
    if (reverse && !reversed) reversed = reverseTapeBuffer(context, forward);
    source.buffer = reverse ? reversed : forward;
    source.loop = true;
    source.loopStart = reverse ? buffer.duration - end : start;
    source.loopEnd = reverse ? buffer.duration - start : end;
    source.playbackRate.value = Math.abs(rate);
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(rate === 0 ? 0 : 1, time + 0.008);
    source.connect(gain).connect(shape);
    wowDepth.connect(source.detune);
    flutterDepth.connect(source.detune);
    const entry = { source, gain, reverse };
    sources.add(entry);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      wowDepth.disconnect(source.detune);
      flutterDepth.disconnect(source.detune);
      sources.delete(entry);
      if (stopped && sources.size === 0) [shape, tone, wow, flutter, wowDepth, flutterDepth].forEach(n => n.disconnect());
    };
    const mappedPosition = reverse ? buffer.duration - originalPosition - 1 / buffer.sampleRate : originalPosition;
    source.start(time, wrapTapePosition(mappedPosition, source.loopStart, source.loopEnd));
    return entry;
  }
  const voice = {
    get source() { return current?.source; },
    get rate() { return rate; },
    loopStart: start,
    loopEnd: end,
    getPosition(time = context.currentTime) {
      return wrapTapePosition(position + (started ? Math.max(0, time - anchorTime) * rate : 0), start, end);
    },
    update(next) {
      shape.curve = tapeCurve(next.warmth);
      tone.frequency.setTargetAtTime(2500 * Math.pow(8, next.tone), context.currentTime, 0.03);
      wowDepth.gain.setTargetAtTime(next.drift * 18, context.currentTime, 0.05);
      flutterDepth.gain.setTargetAtTime(next.drift * 3, context.currentTime, 0.05);
    },
    setRate(nextRate) {
      if (stopped) return;
      const now = context.currentTime;
      position = voice.getPosition(now);
      anchorTime = Math.max(now, anchorTime);
      rate = nextRate;
      if (!started) return;
      if (rate !== 0 && current.reverse !== (rate < 0)) {
        release(current, now);
        current = makeSource(anchorTime, position);
      } else {
        // Native playbackRate remains nonnegative; zero holds the exact sample and mutes DC.
        current.source.playbackRate.setValueAtTime(Math.abs(rate), now);
        current.gain.gain.cancelAndHoldAtTime(now);
        current.gain.gain.linearRampToValueAtTime(rate === 0 ? 0 : 1, anchorTime + 0.008);
      }
    },
    start(time, offset = start) {
      position = wrapTapePosition(offset, start, end);
      anchorTime = time;
      current = makeSource(time, position);
      wow.start(time);
      flutter.start(time);
      started = true;
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const now = context.currentTime;
      if (current) release(current, now);
      wow.stop(now + 0.012);
      flutter.stop(now + 0.012);
    },
  };
  voice.update(settings);
  return voice;
}

export function tapeCurve(warmth) {
  const amount = Math.max(0, Math.min(1, warmth));
  const drive = 1 + amount * 3;
  const curve = new Float32Array(4097);
  // Unity small-signal gain: warmth rounds peaks without a loudness jump.
  for (let i = 0; i < curve.length; i++) {
    const x = i / (curve.length - 1) * 2 - 1;
    curve[i] = (1 - amount) * x + amount * Math.tanh(x * drive) / drive;
  }
  return curve;
}

export function prepareTapeBuffer(context, buffer, start = 0, end = buffer.duration) {
  const copy = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const first = Math.max(0, Math.floor(start * buffer.sampleRate));
  const last = Math.min(buffer.length, Math.round(end * buffer.sampleRate));
  const fade = Math.min(Math.round(buffer.sampleRate * 0.004), Math.floor((last - first) / 2));
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = copy.getChannelData(c);
    data.set(buffer.getChannelData(c));
    for (let i = 0; i < fade; i++) {
      const gain = Math.sin(i / Math.max(1, fade - 1) * Math.PI / 2);
      data[first + i] *= gain;
      data[last - 1 - i] *= gain;
    }
  }
  return copy;
}
