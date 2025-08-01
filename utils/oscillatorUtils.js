export const BASIC_OSC_TYPES = ['sine', 'square', 'sawtooth', 'triangle'];

export function sanitizeWaveformType(type, fallback = 'sine') {
  if (typeof type !== 'string') return fallback;
  if (BASIC_OSC_TYPES.includes(type)) return type;
  if (type === 'pulse') return 'square';
  return fallback;
}
