export const fmSynthPresets = [
  {
    type: 'sine',
    label: 'Sine',
    icon: '○',
    details: {
      visualStyle: 'fm_default',
      carrierWaveform: 'sine',
      modulatorWaveform: 'sine',
    },
  },
  {
    type: 'square',
    label: 'Square',
    icon: '□',
    details: {
      visualStyle: 'fm_default',
      carrierWaveform: 'square',
      modulatorWaveform: 'square',
    },
  },
  {
    type: 'sawtooth',
    label: 'Saw',
    icon: '📈',
    details: {
      visualStyle: 'fm_default',
      carrierWaveform: 'sawtooth',
      modulatorWaveform: 'sawtooth',
    },
  },
  {
    type: 'triangle',
    label: 'Triangle',
    icon: '△',
    details: {
      visualStyle: 'fm_default',
      carrierWaveform: 'triangle',
      modulatorWaveform: 'triangle',
    },
  },
];
export { createToneFmSynthOrb, DEFAULT_TONE_FM_SYNTH_PARAMS } from './tone-fm-synth-orb.js';
