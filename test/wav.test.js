import { it, expect } from 'vitest';
import { encodeLoopWav } from '../utils/wav.js';

it('exports the chosen loop with correct WAV metadata, stereo ordering and clipping', () => {
  const channels = [Float32Array.from([0, 0.5, 2, 0]), Float32Array.from([0, -0.5, -2, 0])];
  const result = encodeLoopWav({ numberOfChannels: 2, length: 4, sampleRate: 4, duration: 1, getChannelData: c => channels[c] }, 0.25, 0.75);
  const view = new DataView(result);
  expect(new TextDecoder().decode(new Uint8Array(result, 0, 4))).toBe('RIFF');
  expect(view.getUint16(22, true)).toBe(2);
  expect(view.getUint32(24, true)).toBe(4);
  expect(view.getUint32(40, true)).toBe(8);
  expect([44, 46, 48, 50].map(i => view.getInt16(i, true))).toEqual([16384, -16384, 32767, -32768]);
});
