// Export the original selected loop at its recorded speed, without altering the take.
export function encodeLoopWav(buffer, start = 0, end = buffer.duration) {
  const first = Math.max(0, Math.floor(start * buffer.sampleRate));
  const last = Math.min(buffer.length, Math.round(end * buffer.sampleRate));
  const frames = Math.max(0, last - first);
  const channels = buffer.numberOfChannels;
  const bytes = frames * channels * 2;
  const wav = new ArrayBuffer(44 + bytes);
  const view = new DataView(wav);
  const text = (offset, value) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, bytes, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let frame = first; frame < last; frame++) {
    for (let c = 0; c < channels; c++) {
      const value = Math.max(-1, Math.min(1, data[c][frame] || 0));
      view.setInt16(offset, Math.round(value * (value < 0 ? 32768 : 32767)), true);
      offset += 2;
    }
  }
  return wav;
}
