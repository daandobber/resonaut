import { ALIEN_ORB_TYPE, ALIEN_DRONE_TYPE } from "../orbs/alien-orb.js";
import { ARVO_DRONE_TYPE } from "../orbs/arvo-drone-orb.js";
import { RESONAUTER_TYPE } from "../orbs/resonauter-orb.js";

export const HUE_STEP = 30;

export const scales = {
  major_pentatonic: {
    name: "Deep Space",
    notes: [0, 2, 4, 7, 9],
    theme: "theme-major",
    baseFreq: 130.81,
    baseHSL: {
      h: 220,
      s: 75,
      l: 65,
    },
  },
  minor_pentatonic: {
    name: "Nebula",
    notes: [0, 3, 5, 7, 10],
    theme: "theme-minor-pentatonic",
    baseFreq: 110.0,
    baseHSL: {
      h: 280,
      s: 70,
      l: 68,
    },
  },
  major: {
    name: "Aurora",
    notes: [0, 2, 4, 5, 7, 9, 11],
    theme: "",
    baseFreq: 130.81,
    baseHSL: {
      h: 150,
      s: 70,
      l: 60,
    },
  },
  minor: {
    name: "Eclipse",
    notes: [0, 2, 3, 5, 7, 8, 10],
    theme: "theme-minor",
    baseFreq: 110.0,
    baseHSL: {
      h: 25,
      s: 80,
      l: 65,
    },
  },
  chromatic: {
    name: "Void",
    notes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    theme: "theme-chromatic",
    baseFreq: 130.81,
    baseHSL: {
      h: 0,
      s: 0,
      l: 75,
    },
  },
  dorian: {
    name: "Dorian",
    notes: [0, 2, 3, 5, 7, 9, 10],
    theme: "theme-dorian",
    baseFreq: 130.81,
    baseHSL: {
      h: 190,
      s: 65,
      l: 60,
    },
  },
  phrygian: {
    name: "Phrygian",
    notes: [0, 1, 3, 5, 7, 8, 10],
    theme: "theme-phrygian",
    baseFreq: 110.0,
    baseHSL: {
      h: 340,
      s: 70,
      l: 60,
    },
  },
  lydian: {
    name: "Lydian",
    notes: [0, 2, 4, 6, 7, 9, 11],
    theme: "theme-lydian",
    baseFreq: 130.81,
    baseHSL: {
      h: 60,
      s: 80,
      l: 60,
    },
  },
  mixolydian: {
    name: "Mixolydian",
    notes: [0, 2, 4, 5, 7, 9, 10],
    theme: "theme-mixolydian",
    baseFreq: 130.81,
    baseHSL: {
      h: 100,
      s: 70,
      l: 65,
    },
  },
  locrian: {
    name: "Locrian",
    notes: [0, 1, 3, 5, 6, 8, 10],
    theme: "theme-locrian",
    baseFreq: 110.0,
    baseHSL: {
      h: 300,
      s: 60,
      l: 65,
    },
  },
};

export const scaleState = {
  currentScaleKey: "major",
  currentScale: null,
  currentRootNote: 0,
  globalTransposeOffset: 0,
  tapTempoTimes: [],
};
scaleState.currentScale = scales[scaleState.currentScaleKey];

export const MAX_TAP_INTERVAL = 2000;
export const MAX_TAP_TIMES = 4;

export const CONSTELLATION_NODE_TYPES = [
  "sound",
  "drum_kick",
  "drum_snare",
  "drum_hihat",
  "drum_clap",
  "drum_tom1",
  "drum_tom2",
  "drum_cowbell",
  // New Tone FM drums
  "drum_tone_fm",
  "drum_tone_fm_kick",
  "drum_tone_fm_snap",
  "drum_tone_fm_punch",
  "drum_tone_fm_metal",
  "drum_tone_fm_soft",
  "drum_tone_fm_hard",
  "drum_tone_fm_808",
  // Chip drums
  "drum_chip_kick",
  "drum_chip_snare",
  "drum_chip_hihat",
  "drum_chip_tom",
  ALIEN_ORB_TYPE,
  ALIEN_DRONE_TYPE,
  ARVO_DRONE_TYPE,
  RESONAUTER_TYPE,
];
