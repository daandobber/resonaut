// Centralized constants extracted from app.js for easier management
export const PRORB_TYPE = 'prorb';
export const PORTAL_NEBULA_TYPE = 'portal_nebula';
export const NODE_RADIUS_BASE = 12;
export const MIN_NODE_SIZE = 0.6;
export const MAX_NODE_SIZE = 1.8;
export const MIN_FILTER_FREQ = 350;
export const MAX_FILTER_FREQ = 16000;
export const DEFAULT_REVERB_SEND = 0.0;
export const MIST_SEND_LEVEL = 1.0;
export const DEFAULT_REVERB_DAMP_FREQ = 8000;
export const MIST_RESON_FREQ = 1200;
export const MIST_DELAY_TIME = 0.07;
export const MIST_FEEDBACK_GAIN = 0.6;
export const MIST_WET_LEVEL = 0.7;
export const MIST_PAN_LFO_RATE = 0.1;
export const MIST_PAN_LFO_DEPTH = 0.6;
export const MIST_DELAY_LFO_RATE = 0.07;
export const MIST_DELAY_LFO_DEPTH = 0.02;
export const MIST_LOW_PASS_FREQ = 1500;
export const MIST_MAX_COVERAGE = 3;
export const CRUSH_SEND_LEVEL = 1.0;
export const MRFA_BAND_FREQS = [90, 180, 360, 720, 1440, 2880, 5760, 11520];
export const MRFA_Q = 10;
export const MRFA_DEFAULT_GAIN = 1.0;
export const PERF_RESO_DELAY_TIME = 0.25;
export const PERF_RESO_FEEDBACK = 0.8;
export const PERF_RESO_FREQ = 900;
export const PERF_RESO_Q = 8;
export const PERF_RESO_WET = 0.8;
export const PERF_REVERB_BASE_TIMES = [0.12, 0.16, 0.21, 0.27];
export const PERF_REVERB_DECAY = 0.6;
export const PERF_REVERB_WET = 0.9;
export const CRUSH_WET_LEVEL = 0.7;
export const CRUSH_COMB_DELAY = 0.03;
export const CRUSH_COMB_FEEDBACK = 0.5;
export const CRUSH_BIT_DEPTH = 6;
export const CRUSH_REDUCTION = 0.15;
export const DEFAULT_DELAY_SEND = 0.0;
export const DEFAULT_TRIGGER_INTERVAL = 2.5;
export const DEFAULT_PULSE_INTENSITY = 0.7;
export const MIN_PULSE_INTENSITY = 0.1;
export const MAX_PULSE_INTENSITY = 1.5;
export const PULSAR_RANDOM_TIMING_CHANCE_PER_SEC = 0.4;
export const DELAY_FACTOR = 0.005;
export const PULSE_SIZE = 3;
export const GATE_ROTATION_SPEED = 0.025;
export const GATE_ANGLE_SIZE = Math.PI / 2.5;
export const GATE_MODES = ["1/2", "1/3", "1/4", "2/3", "3/4", "RAND"];
export const DEFAULT_GATE_MODE_INDEX = 0;
export const GATE_RANDOM_THRESHOLD = 0.5;
export const DEFAULT_PROBABILITY = 0.5;
export const PITCH_SHIFT_AMOUNTS = [1, 2, 3, 4, 5, 7, 12, -1, -2, -3, -4, -5, -7, -12];
export const DEFAULT_PITCH_SHIFT_INDEX = 6;
export const NEBULA_ROTATION_SPEED_OUTER = 0.0001;
export const NEBULA_ROTATION_SPEED_INNER = -0.0002;
export const NEBULA_PULSE_SPEED = 0.026;
export const NEBULA_OSC_INTERVALS = [0, 7, 12];
export const NEBULA_OSC_DETUNE = 7;
export const NEBULA_FILTER_LFO_RATE = 0.04;
export const NEBULA_FILTER_LFO_DEPTH_FACTOR = 6;
export const NEBULA_VOL_LFO_RATE = 0.08;
export const NEBULA_VOL_LFO_DEPTH = 0.18;
export const NEBULA_VOL_SCALING = 0.09;
export const NEBULA_MAX_VOL = 0.28;
export const NEBULA_FILTER_Q = 2.5;
export const NEBULA_INTERACTION_DISTANCE = 150;
export const NEBULA_BRIDGE_ALPHA_BASE = 0.55;
export const NEBULA_LFO_SPIN_MULTIPLIER = 800;
export const NEBULA_SPIN_LFO_RATE = 0.05;
export const NEBULA_SPIN_LFO_DEPTH = 0.5;
export const ORBITONE_ROTATE_MIN_VOL = 0.1;
export const GLIDE_LINE_WIDTH = 2;
export const GLIDE_LINE_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--string-glide-connection-color")
  .trim() || "rgba(255, 200, 100, 0.6)";
export const ROPE_LINE_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue("--rope-connection-color")
  .trim() || "rgba(180, 160, 120, 0.7)";

export const STRING_VIOLIN_DEFAULTS = {
  type: "string_violin",
  numOsc: 3,
  detune: 8,
  attack: 0.05,
  release: 1.5,
  filterFreqFactor: 2.5,
  filterQ: 1.5,
  vibratoRate: 4,
  vibratoDepth: 20,
  volume: 0.4,
  scaleIndex: 0,
  pitch: 0,
  reverbSend: DEFAULT_REVERB_SEND,
  delaySend: DEFAULT_DELAY_SEND,
};

export const DRUM_ELEMENT_DEFAULTS = {
  drum_kick: {
    baseFreq: 60,
    decay: 0.3,
    volume: 1.0,
    icon: "\uD83D\uDCA5",
    label: "Kick",
  },
  drum_snare: {
    baseFreq: 180,
    decay: 0.2,
    noiseDecay: 0.15,
    volume: 0.8,
    icon: "SN",
    label: "Snare",
  },
  drum_hihat: {
    baseFreq: 7000,
    decay: 0.05,
    volume: 0.6,
    icon: "HH",
    label: "Hi-Hat",
  },
  drum_clap: {
    noiseDecay: 0.1,
    volume: 0.9,
    icon: "CL",
    label: "Clap",
    baseFreq: 1500,
  },
  drum_tom1: {
    baseFreq: 150,
    decay: 0.4,
    volume: 0.9,
    icon: "T1",
    label: "Tom 1",
  },
  drum_tom2: {
    baseFreq: 100,
    decay: 0.5,
    volume: 0.9,
    icon: "T2",
    label: "Tom 2",
  },
  drum_cowbell: {
    baseFreq: 520,
    decay: 0.3,
    volume: 0.7,
    icon: "CB",
    label: "Cowbell",
  },
  drum_fm_kick: {
    baseFreq: 55,
    decay: 0.5,
    volume: 1.0,
    modRatio: 2.2,
    modDepth: 70,
    feedback: 0.3,
    carrierWaveform: "sine",
    modulatorWaveform: "sine",
    icon: "\uD83C\uDFAF",
    label: "FM Kick",
  },
  drum_fm_snare: {
    baseFreq: 220,
    decay: 0.3,
    volume: 0.9,
    modRatio: 5,
    modDepth: 80,
    feedback: 0.25,
    noiseRatio: 0.6,
    carrierWaveform: "triangle",
    modulatorWaveform: "square",
    icon: "\uD83E\uDD4B",
    label: "FM Snare",
  },
  drum_fm_tom: {
    baseFreq: 140,
    decay: 0.4,
    volume: 0.9,
    modRatio: 1.5,
    modDepth: 60,
    feedback: 0.15,
    carrierWaveform: "sine",
    modulatorWaveform: "sawtooth",
    icon: "\uD83C\uDFB2",
    label: "FM Tom",
  },
};

export const PORTAL_NEBULA_DEFAULTS = {
  droneBaseFreq: 40.0,
  numHarmonics: 5,
  harmonicSpread: 0.8,
  harmonicBaseGain: 0.04,
  shimmerRate: 0.15,
  shimmerDepth: 0.02,
  baseColorHue: 280,
  pulseSpeed: 0.5,
};

export const ARVO_DRONE_DEFAULTS = {
  baseFreq: 110,
  harmonicCount: 3,
  harmonicSpread: 1.5,
  baseColorHue: 200,
};

