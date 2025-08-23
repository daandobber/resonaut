import { fmSynthPresets, createToneFmSynthOrb, DEFAULT_TONE_FM_SYNTH_PARAMS } from './orbs/fm-synth-orb.js';
import { analogWaveformPresets } from './orbs/analog-waveform-presets.js';
import { createAnalogOrb, DEFAULT_ANALOG_ORB_PARAMS } from './orbs/analog-orb.js';
import { showAnalogOrbMenu, hideAnalogOrbMenu, hideTonePanel } from './orbs/analog-orb-ui.js';
import { showToneFmSynthMenu } from './orbs/tone-fm-synth-ui.js';
import * as Tone from 'tone';
import { sanitizeWaveformType } from './utils/oscillatorUtils.js';
import { DEFAULT_RESONAUTER_PARAMS, resonauterGranParams, createResonauterOrbAudioNodes, playResonauterSound } from './orbs/resonauter-orb.js';
import { NOTE_NAMES, MIN_SCALE_INDEX, MAX_SCALE_INDEX } from './utils/musicConstants.js';
import {
  hideAlienPanel,
  hideAlienOrbMenu,
  showAlienOrbMenu,
  createAlienSynth,
  updateAlienParams,
  updateAlienNodesParams,
  randomGeez,
  ALIEN_ORB_TYPE,
  alienEngine,
  setAlienLfoRate,
  setAlienLfoAmount,
} from './orbs/alien-orb.js';
import {
  ARVO_DRONE_TYPE,
  createArvoDroneAudioNodes,
  updateArvoDroneParams,
  stopArvoDroneAudioNodes,
  showArvoDroneOrbMenu,
  hideArvoDroneOrbMenu,
  hideArvoPanel,
  DEFAULT_ARVO_DRONE_PARAMS,
} from './orbs/arvo-drone-orb.js';
import {
  FM_DRONE_TYPE,
  createFmDroneAudioNodes,
  updateFmDroneParams,
  stopFmDroneAudioNodes,
  showFmDroneOrbMenu,
  hideFmDroneOrbMenu,
  DEFAULT_FM_DRONE_PARAMS,
} from './orbs/fm-drone-orb.js';
import { MOTOR_ORB_TYPE, DEFAULT_MOTOR_PARAMS, updateMotorOrb, showMotorOrbMenu, hideMotorOrbMenu, hideMotorOrbPanel } from './orbs/motor-orb.js';
import { CLOCKWORK_ORB_TYPE, DEFAULT_CLOCKWORK_PARAMS, CLOCKWORK_FORCE_DEFAULT, CLOCKWORK_DECAY_DEFAULT, updateClockworkOrb, advanceClockworkOrb, showClockworkOrbMenu, hideClockworkOrbMenu, hideClockworkOrbPanel } from './orbs/clockwork-orb.js';
import {
  A4_FREQ,
  A4_MIDI_NOTE,
  frequencyToMidi,
  getFrequency,
  getNoteName,
  getNoteNameFromScaleIndex,
  parseNoteNameToMidi,
  getClosestScaleIndexForMidi,
  sanitizeFrequency,
} from './audioUtils.js';
import { clamp, lerp, distance } from './mathUtils.js';
import { patchConsole } from './utils/loggingUtils.js';
import { createDailyTipManager } from './utils/dailyTips.js';
import * as el from './utils/domElements.js';
import { ONE_WAY_TYPE, drawArrow, getArrowPosition } from './connectors.js';
import { initStarfield, initNeuralBackground, drawBackground, backgroundMode, setBackgroundMode } from './utils/backgrounds.js';
import { generateWaveformPath } from "./utils/waveformUtils.js";
import { SAMPLER_DEFINITIONS } from './samplers.js';
import { populateSideToolbar } from './sideToolbar.js';

if (typeof document === 'undefined' || !document.getElementById) {
  globalThis.document = globalThis.document || { documentElement: {} };
  if (!globalThis.document.getElementById) {
    globalThis.document.getElementById = () => ({
      addEventListener: () => {},
      classList: { add() {}, remove() {}, contains() { return false; } },
      style: {},
    });
  }
  if (!globalThis.document.querySelectorAll) globalThis.document.querySelectorAll = () => [];
  if (!globalThis.document.addEventListener) globalThis.document.addEventListener = () => {};
  if (!globalThis.window) globalThis.window = {};
  if (!globalThis.window.addEventListener) globalThis.window.addEventListener = () => {};
}

import { rgbaToHex, hexToRgba, hexToRgbForGradient, hslToRgba, rgbaToHsl } from "./utils/colorUtils.js";
import { startMeteorShower, updateAndDrawMeteorShowers, createCollisionImpactVisual, METEOR_SHOWER_DEFAULT_MAX_RADIUS, METEOR_SHOWER_DEFAULT_GROWTH_RATE, MAX_METEOR_SHOWER_GENERATIONS, PAIR_INTERACTION_COOLDOWN_SECONDS, COLLISION_SPAWN_COOLDOWN_SECONDS } from './utils/meteor.js';
import { startRecording, stopRecording } from "./recordingUtils.js";
import { canvases, switchTo, canvasStates, getCurrentIndex as getCurrentCanvasIndex } from './canvasManager.js';
import { base64ToArrayBuffer } from './utils/audioBufferUtils.js';
import {
  patchState,
  createCrushPatch,
  createMistPatch,
  updateCrushPatchPositions,
  updateMistPatchPositions,
  updateCrushWetness,
  updateMistWetness,
  erasePatchesAt,
  initPatchEffects,
} from './patchEffects.js';
import { HUE_STEP, scales, CONSTELLATION_NODE_TYPES, MAX_TAP_INTERVAL, MAX_TAP_TIMES } from "./utils/scaleConstants.js";
import { drawStarShape, drawSatelliteShape, drawMidiOrbShape, drawRoundedRect } from "./utils/drawingShapes.js";
import {
  NODE_RADIUS_BASE,
  MIN_NODE_SIZE,
  MAX_NODE_SIZE,
  MIN_FILTER_FREQ,
  MAX_FILTER_FREQ,
  DEFAULT_REVERB_SEND,
  MIST_SEND_LEVEL,
  DEFAULT_REVERB_DAMP_FREQ,
  MIST_RESON_FREQ,
  MIST_DELAY_TIME,
  MIST_FEEDBACK_GAIN,
  MIST_WET_LEVEL,
  MIST_PAN_LFO_RATE,
  MIST_PAN_LFO_DEPTH,
  MIST_DELAY_LFO_RATE,
  MIST_DELAY_LFO_DEPTH,
  MIST_LOW_PASS_FREQ,
  MIST_MAX_COVERAGE,
  CRUSH_SEND_LEVEL,
  MRFA_BAND_FREQS,
  MRFA_Q,
  MRFA_DEFAULT_GAIN,
  PERF_RESO_DELAY_TIME,
  PERF_RESO_FEEDBACK,
  PERF_RESO_FREQ,
  PERF_RESO_Q,
  PERF_RESO_WET,
  PERF_REVERB_BASE_TIMES,
  PERF_REVERB_DECAY,
  PERF_REVERB_WET,
  CRUSH_WET_LEVEL,
  CRUSH_COMB_DELAY,
  CRUSH_COMB_FEEDBACK,
  CRUSH_BIT_DEPTH,
  CRUSH_REDUCTION,
  DEFAULT_DELAY_SEND,
  DEFAULT_TRIGGER_INTERVAL,
  DEFAULT_PULSE_INTENSITY,
  MIN_PULSE_INTENSITY,
  MAX_PULSE_INTENSITY,
  PULSAR_RANDOM_TIMING_CHANCE_PER_SEC,
  DELAY_FACTOR,
  PULSE_SIZE,
  GATE_ROTATION_SPEED,
  GATE_ANGLE_SIZE,
  GATE_MODES,
  DEFAULT_GATE_MODE_INDEX,
  GATE_RANDOM_THRESHOLD,
  DEFAULT_PROBABILITY,
  PITCH_SHIFT_AMOUNTS,
  DEFAULT_PITCH_SHIFT_INDEX,
  NEBULA_ROTATION_SPEED_OUTER,
  NEBULA_ROTATION_SPEED_INNER,
  NEBULA_PULSE_SPEED,
  NEBULA_OSC_INTERVALS,
  NEBULA_OSC_DETUNE,
  NEBULA_FILTER_LFO_RATE,
  NEBULA_FILTER_LFO_DEPTH_FACTOR,
  NEBULA_VOL_LFO_RATE,
  NEBULA_VOL_LFO_DEPTH,
  NEBULA_VOL_SCALING,
  NEBULA_MAX_VOL,
  NEBULA_FILTER_Q,
  NEBULA_INTERACTION_DISTANCE,
  NEBULA_BRIDGE_ALPHA_BASE,
  NEBULA_LFO_SPIN_MULTIPLIER,
  NEBULA_SPIN_LFO_RATE,
  NEBULA_SPIN_LFO_DEPTH,
  ORBITONE_ROTATE_MIN_VOL,
  GLIDE_LINE_WIDTH,
  GLIDE_LINE_COLOR,
  ROPE_LINE_COLOR,
  STRING_VIOLIN_DEFAULTS,
  DRUM_ELEMENT_DEFAULTS,
  PRORB_TYPE,
  PORTAL_NEBULA_TYPE,
  PORTAL_NEBULA_DEFAULTS,
} from './utils/appConstants.js';
import { formatTime } from "./utils/timeUtils.js";
const {
  startMessage,
  dailyTipEl,
  prevTipBtn,
  nextTipBtn,
  startChillBtn,
  startProBtn,
  loadingIndicator,
  startEngineBtn,
  appMenuNew,
  appMenuLoad,
  appMenuSave,
  midiInputSelect,
  midiOutputSelect,
  midiSyncInCheckbox,
  midiSyncOutCheckbox,
  appMenuEnterUfoMode,
  appMenuUndoBtn,
  appMenuRedoBtn,
  appMenuCut,
  appMenuCopy,
  appMenuPaste,
  appMenuReplace,
  appMenuGridToggleBtn,
  appMenuGridSnapBtn,
  appMenuSyncToggleBtn,
  appMenuBpmControls,
  appMenuBpmInput,
  appMenuPlayPauseBtn,
  appMenuStopBtn,
  appMenuRestartPulsarsBtn,
  appMenuHelpBtn,
  helpPopup,
  closeHelpPopupBtn,
  scaleSelectTransport,
  pianoRollModeSelect,
  backgroundSelect,
  closeHamburgerBtn,
  groupControlsDiv,
  groupVolumeSlider,
  groupFluctuateToggle,
  groupFluctuateAmount,
  groupNodeCountSpan,
  toggleInfoTextBtn,
  transportControlsDiv,
  beatIndicatorElement,
  mixerPanel,
  mixerVolumeControls,
  mixerSendControls,
  mixerPanControls,
  mixerTabButtons,
  addSoundStarBtn,
  addSamplerBtn,
  addNebulaBtn,
  addPulsarBtn,
  addMeteorShowerBtn,
  instrumentsMenuBtn,
  connectionsMenuBtn,
  addAnalogSynthBtn,
  addFmSynthBtn,
  addDrumElementBtn,
  dronesMenuBtn,
  toolsMenuBtn,
  mistMenuBtn,
  motionMenuBtn,
  editBtn,
  connectBtn,
  connectStringBtn,
  glideToolButton,
  connectWaveTrailBtn,
  connectOneWayBtn,
  connectRopeBtn,
  deleteBtn,
  eraserBtn,
  wandBtn,
  mistBtn,
  mistLayer,
  crushBtn,
  crushLayer,
  hamburgerBtn,
  hamburgerMenuPanel,
  editPanelContent,
  toolbar,
  sideToolbar,
  sideToolbarTitle,
  sideToolbarContent,
  alienPanel,
  alienPanelCloseBtn,
  arvoPanelCloseBtn,
  resonauterPanel,
  resonauterPanelContent,
  resonauterPanelCloseBtn,
  samplerPanel,
  samplerPanelContent,
  samplerPanelCloseBtn,
  tonePanel,
  tonePanelCloseBtn,
  radioOrbPanel,
  radioOrbPanelContent,
  radioOrbPanelCloseBtn,
  motorOrbPanel,
  motorOrbPanelContent,
  motorOrbPanelCloseBtn,
  clockworkOrbPanel,
  clockworkOrbPanelContent,
  clockworkOrbPanelCloseBtn,
  stringPanel,
  stringPanelContent,
  stringPanelCloseBtn,
  appMenuRecordBtn,
  appMenuToggleTapeLooperBtn,
  appMenuRadioSamplerBtn,
  appMenuPerformanceBtn,
  appMenuToggleTimelineBtn,
  tapeLooperPanel,
  closeTapeLooperPanelBtn,
  tapeWaveformCanvas,
  tapeVisualLoopRegion,
  tapeLoopHandleStart,
  tapeLoopHandleEnd,
  tapeVisualPlayhead,
  tapeLoopDurationInput,
  tapeTrackButtons,
  tapeLoopStartInput,
  tapeLoopEndInput,
  tapeLoopSetLoopPointsBtn,
  tapeLoopRecordBtn,
  tapeLoopPlayBtn,
  tapeLoopStopBtn,
  tapeLoopClearBtn,
  tapeLoopSpeedSlider,
  tapeLoopSpeedValue,
  tapeLoopResetSpeedBtn,
  tapeLoopStatusLabel,
  tapeLoopTimer,
  radioSamplerPanel,
  performancePanel,
  performancePanelCloseBtn,
  openPerformancePanelBtn,
  mrfaToggle,
  mrfaBandSliders,
  perfResoSlider,
  perfResoValue,
  perfResoToggle,
  perfResoDelaySlider,
  perfResoDelayValue,
  perfResoFeedbackSlider,
  perfResoFeedbackValue,
  perfResoFreqSlider,
  perfResoFreqValue,
  perfResoQSlider,
  perfResoQValue,
  perfReverbSlider,
  perfReverbValue,
  perfReverbToggle,
  perfReverbSizeSlider,
  perfReverbSizeValue,
  perfReverbDecaySlider,
  perfReverbDecayValue,
  perfReverbDampSlider,
  perfReverbDampValue,
  canvasSwitcherEl,
  canvasSwitcherToggle,
  helpWizard,
  wizardArrow,
  wizardHighlight,
  wizardText,
  wizardMessage,
  wizardNextBtn,
  wizardPrevBtn,
  wizardCloseBtn,
  wizardEndBtn,
} = el;
let canvas = el.canvas;
let ctx = el.ctx;
let selectedMode = 'chill';
let samplesLoadedCount = 0;
let totalSamples = 0;

function updateCanvasRefs() {
  canvas = el.canvas;
  ctx = el.ctx;
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
window.addEventListener('canvas-set', () => {
  updateCanvasRefs();
  const resize = () => {
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    draw();
  };
  requestAnimationFrame(resize);
  attachCanvasEvents(canvas);
});
}

patchConsole();
const dailyTipManager = createDailyTipManager(dailyTipEl, prevTipBtn, nextTipBtn);


let currentSamplerNode = null;
let samplerWaveformCanvas = null;
let samplerVisualPlayhead = null;
let samplerEnvelopeDot = null;
let samplerPlayheadTimeout = null;
let samplerSliders = {};
let resonauterSpinPhase = 0;
let currentResonauterTab = 'exc';
const TIMELINE_GRID_TYPE = "timeline_grid";
const SPACERADAR_TYPE = "spaceradar";
const CRANK_RADAR_TYPE = "crank_radar";
const GRID_SEQUENCER_TYPE = "grid_sequencer";
const MIDI_ORB_TYPE = "midi_orb";
const RESONAUTER_TYPE = "resonauter";
const RADIO_ORB_TYPE = "radio_orb";
const ALIEN_DRONE_TYPE = "alien_drone";
const CANVAS_SEND_ORB_TYPE = "canvas_orb_send";
const CANVAS_RECEIVE_ORB_TYPE = "canvas_orb_receive";
const TIMELINE_GRID_DEFAULT_WIDTH = 250;
const TIMELINE_GRID_DEFAULT_HEIGHT = 400;
const TIMELINE_GRID_DEFAULT_SPEED = 4.0;
const TIMELINE_GRID_DEFAULT_COLOR = "rgba(120, 220, 120, 0.7)";
const TIMELINE_GRID_DEFAULT_PULSE_INTENSITY = 0.9;
const TIMELINE_GRID_DEFAULT_AUTO_ROTATE_ENABLED = false;
const TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SPEED_MANUAL = 0.005; 
const TIMELINE_GRID_DEFAULT_AUTO_ROTATE_DIRECTION = "clockwise"; 
const TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SYNC_SUBDIVISION_INDEX = 8;
const SPACERADAR_DEFAULT_RADIUS = 250;
const SPACERADAR_DEFAULT_SPEED = 4.0;
const SPACERADAR_DEFAULT_COLOR = "rgba(150, 220, 150, 0.7)";
const SPACERADAR_DEFAULT_PULSE_INTENSITY = 0.9;
const SPACERADAR_DEFAULT_MUSICAL_BARS = 1;
const GRID_SEQUENCER_DEFAULT_WIDTH = 200;
const GRID_SEQUENCER_DEFAULT_HEIGHT = 150;
const GRID_SEQUENCER_DEFAULT_ROWS = 4;
const GRID_SEQUENCER_DEFAULT_COLS = 8;
const SPACERADAR_MODE_NORMAL = "normal";
const SPACERADAR_MODE_REVERSE = "reverse";
const SPACERADAR_DEFAULT_MODE = SPACERADAR_MODE_NORMAL;
const SPACERADAR_ANGLE_OFFSET = -Math.PI / 2;
const CRANK_RADAR_PIVOT_OFFSET_FACTOR = 1.15;
const CRANK_RADAR_HANDLE_LENGTH_FACTOR = 0.5;
const PULSE_PUSH_DURATION = 0.2;
const PULSE_FORCE_DEFAULT = 1.0;
const PULSE_DECAY_DEFAULT = PULSE_PUSH_DURATION;
const ROCKET_DEFAULT_SPEED = 150.0;
const ROCKET_DEFAULT_RANGE = 400;
const ROCKET_DEFAULT_GRAVITY = 50;
const ROCKET_EXPLOSION_PARTICLES = 40;
const ROCKET_PULSE_VISUAL_SIZE = 4;
const addTimelineGridBtn =
  typeof document !== 'undefined' && typeof document.getElementById === 'function'
    ? document.getElementById("addTimelineGridBtn")
    : null;
if (addTimelineGridBtn) {
  addTimelineGridBtn.addEventListener("click", (e) => {
    setupAddTool(e.currentTarget, TIMELINE_GRID_TYPE, false);
  });
} else {
  console.warn("#addTimelineGridBtn not found in DOM!");
}
const addRadarBtn =
  typeof document !== 'undefined' && typeof document.getElementById === 'function'
    ? document.getElementById("addRadarBtn")
    : null;
const mixerToggleBtn =
  typeof document !== 'undefined' && typeof document.getElementById === 'function'
    ? document.getElementById("mixerToggleBtn")
    : null;
if (addRadarBtn) {
  addRadarBtn.addEventListener("click", (e) => {
    setupAddTool(e.currentTarget, SPACERADAR_TYPE, false);
  });
} else {
  console.warn("#addRadarBtn not found in DOM!");
}
const addMidiOrbBtn = document.getElementById("addMidiOrbBtn");
const addAlienOrbBtn = document.getElementById("addAlienOrbBtn");
const addResonauterBtn = document.getElementById("addResonauterBtn");
if (addMidiOrbBtn) {
  addMidiOrbBtn.addEventListener("click", (e) => {
    setupAddTool(e.currentTarget, MIDI_ORB_TYPE, false);
  });
}
if (addAlienOrbBtn) {
  addAlienOrbBtn.addEventListener("click", (e) => {
    setupAddTool(e.currentTarget, ALIEN_ORB_TYPE, false);
  });
}
if (addResonauterBtn) {
  addResonauterBtn.addEventListener("click", (e) => {
    setupAddTool(e.currentTarget, RESONAUTER_TYPE, false);
  });
}
let isResizingTimelineGrid = false;
let resizingTimelineGridNode = null;
let resizeHandleType = null;
let resizeStartMousePos = { x: 0, y: 0 };
let initialNodeDimensions = { x: 0, y: 0, width: 0, height: 0 };
let tapeReelAngle = 0;
let isDrawingNewTimelineGrid = false;
let newTimelineGridInitialCorner = null;
let currentlyPlacingTimelineNodeId = null;
let isRotatingTimelineGrid = false;
let rotatingTimelineGridNode = null;
let rotationTimelineGridStartAngle = 0;
let initialTimelineGridRotation = 0;

let unsavedChanges = false;
let audioContext;
let masterGain;
let masterPannerNode;
let masterAnalyser;
let reverbNode;
let reverbWetGain;
let delayNode;
let delayFeedbackGain;
let masterDelaySendGain;
let delayReturnGain;
let isReverbReady = false;
let isDelayReady = false;
const REVERB_IR_URL = "audio/reverb.wav";
const reverbIRSelect = document.getElementById("reverbIRSelect");
const reverbWetSlider = document.getElementById("reverbWetSlider");
const reverbWetValue = document.getElementById("reverbWetValue");
const reverbPreDelaySlider = document.getElementById("reverbPreDelaySlider");
const reverbPreDelayValue = document.getElementById("reverbPreDelayValue");
const reverbDampingSlider = document.getElementById("reverbDampingSlider");
const reverbDampingValue = document.getElementById("reverbDampingValue");
const reverbLowCutSlider = document.getElementById("reverbLowCutSlider");
const reverbLowCutValue = document.getElementById("reverbLowCutValue");

let delayReturnAnalyser, reverbReturnAnalyser;
let reverbPreDelayNode;
let reverbLowPass;
let reverbHighPass;
let mistEffectInput, mistDelay, mistFeedback, mistFilter, mistLowpass, mistPanner;
let mistPanLFO, mistPanLFOGain, mistWetGain;
let mistDelayLFO, mistDelayLFOGain;
let crushEffectInput, crushWetGain, crushCombDelay, crushCombFeedback, crushBitCrusher;
let mrfaInput, mrfaOutput, mrfaWetGain, mrfaDryGain, mrfaDirectGain;
let mrfaFilters = [], mrfaGains = [];
let perfResoInput, perfResoDelay, perfResoFeedback, perfResoFilter, perfResoGain;
let perfResoDelayLFO, perfResoDelayLFOGain;
let perfReverbInput, perfReverbWetGain, perfReverbLowPass;
let perfReverbDelayNodes = [], perfReverbFeedbackGains = [];
let perfReverbLFOs = [], perfReverbLFOGains = [];
let perfReverbSize = 1.0;
let perfResoEnabled = false, perfReverbEnabled = false;
let mrfaEnabled = false;
window.isRecording = false;
let originalMasterGainDestination = null;
const NUM_TAPE_TRACKS = 4;
let currentTapeTrack = 0;
let configuredTapeLoopDurationSeconds = 4;
let tapeTracks = Array.from({ length: NUM_TAPE_TRACKS }, () => ({
  buffer: null,
  writePosition: 0,
  effectivelyRecordedDuration: 0,
  recordedAtBPM: 0,
  loopStart: 0,
  loopEnd: -1,
  displayStartTime: 0,
  displayEndTime: configuredTapeLoopDurationSeconds,
  waveformPathData: null,
  playbackRate: 1.0,
}));
let tapeLoopSourceNodes = new Array(NUM_TAPE_TRACKS).fill(null);
let tapeTrackGainNodes = new Array(NUM_TAPE_TRACKS).fill(null);
let tapeTrackAnalyserNodes = new Array(NUM_TAPE_TRACKS).fill(null);
let tapeTrackMuteStates = new Array(NUM_TAPE_TRACKS).fill(false);
let tapeTrackSoloStates = new Array(NUM_TAPE_TRACKS).fill(false);
let tapeLoopBuffer = null;
let tapeLoopSourceNode = null;
let isTapeLoopRecording = false;
let isTapeLoopPlaying = false;
let scriptNodeForTapeLoop = null;
let tapeLoopSourceNodeStartTime = 0;
let tapeLoopSourceNodeStartOffsetInLoop = 0;

let radioGainNode = null;
let radioAnalyserNode = null;
let radioPannerNode = null;
let radioDelaySendGainNode = null;
let radioReverbSendGainNode = null;
let radioMuteState = false;
let radioSoloState = false;
let tapeLoopWritePosition = 0;
let tapeLoopEffectivelyRecordedDuration = 0;
let tapeLoopRecordedAtBPM = 0;
let tapeLoopInputGate = null;
let actualTapeLoopRecordStartTime = 0;
let scheduledTapeLoopEvents = [];
let tapeLoopRecordBtnClickable = true;
let userDefinedLoopStart = 0;
let userDefinedLoopEnd = -1;
let currentPlaybackRate = 1.0;
let tapeDisplayStartTime = 0;
let tapeDisplayEndTime = configuredTapeLoopDurationSeconds;

function startWithMode(mode) {
  userHasInteracted = true;
  if (startMessage) startMessage.style.display = "none";
  if (mode === "pro") {
    if (!isGridVisible && appMenuGridToggleBtn) appMenuGridToggleBtn.click();
    if (!isSnapEnabled && appMenuGridSnapBtn) appMenuGridSnapBtn.click();
    if (!isGlobalSyncEnabled && appMenuSyncToggleBtn) appMenuSyncToggleBtn.click();
    changeScale("chromatic");
  }
}

function setDisabled(el, state) {
  if (el) el.disabled = state;
}

function setDisplay(el, value) {
  if (el) el.style.display = value;
}

const NON_AUDIO_NODE_TYPES = [
  TIMELINE_GRID_TYPE,
  GRID_SEQUENCER_TYPE,
  SPACERADAR_TYPE,
  CRANK_RADAR_TYPE,
  MOTOR_ORB_TYPE,
  CLOCKWORK_ORB_TYPE,
  "global_key_setter",
];

function createMissingAudioNodes(nodesList) {
  nodesList.forEach((n) => {
    if (!n.audioNodes && !NON_AUDIO_NODE_TYPES.includes(n.type)) {
      n.audioNodes = createAudioNodesForNode(n);
      if (n.audioNodes) updateNodeAudioParams(n);
    }
  });
}

async function startApplication() {
  if (loadingIndicator) {
    samplesLoadedCount = 0;
    totalSamples = typeof SAMPLER_DEFINITIONS !== "undefined" ? SAMPLER_DEFINITIONS.length : 0;
    updateLoadingIndicator();
    setDisplay(loadingIndicator, "block");
  }
  setDisabled(startEngineBtn, true);
  setDisabled(appMenuPlayPauseBtn, true);
  try {
    const context = await setupAudio();
    if (context) {
      isAudioReady = true;
      if (typeof window !== 'undefined') window.isAudioReady = true;
      createMissingAudioNodes(nodes);
      updateMixerGUI();
      updateScaleAndTransposeUI();
      identifyAndRouteAllGroups();
      updateMistWetness();
      updateCrushWetness();
      drawPianoRoll();
      setActiveTool("edit");
      resetSideToolbars();
      hideOverlappingPanels();
      updateTapeLooperUI();
      loadStateFromLocalStorage();
      startWithMode(selectedMode);
      if (isAudioReady && !isPlaying) {
        togglePlayPause();
      }
      setDisabled(appMenuPlayPauseBtn, false);
    } else {
      if (startMessage) {
        startMessage.textContent = "Error loading audio.";
        setDisplay(startMessage, "block");
      }
    }
  } catch (err) {
    console.error('[Audio] setupAudio error:', err);
    if (startMessage) {
      startMessage.textContent = "Error loading audio.";
      setDisplay(startMessage, "block");
    }
    setDisabled(appMenuPlayPauseBtn, false);
  } finally {
    if (loadingIndicator) hideLoadingIndicator();
    setDisabled(startEngineBtn, false);
    setDisabled(appMenuPlayPauseBtn, !isAudioReady);
  }
}

function saveCurrentTapeTrack() {
  const track = tapeTracks[currentTapeTrack];
  track.buffer = tapeLoopBuffer;
  track.writePosition = tapeLoopWritePosition;
  track.effectivelyRecordedDuration = tapeLoopEffectivelyRecordedDuration;
  track.recordedAtBPM = tapeLoopRecordedAtBPM;
  track.loopStart = userDefinedLoopStart;
  track.loopEnd = userDefinedLoopEnd;
  track.displayStartTime = tapeDisplayStartTime;
  track.displayEndTime = tapeDisplayEndTime;
  track.waveformPathData = waveformPathData;
  track.playbackRate = currentPlaybackRate;
}


function loadTapeTrack(index) {
  const track = tapeTracks[index];
  tapeLoopBuffer = track.buffer;
  tapeLoopWritePosition = track.writePosition;
  tapeLoopEffectivelyRecordedDuration = track.effectivelyRecordedDuration;
  tapeLoopRecordedAtBPM = track.recordedAtBPM;
  userDefinedLoopStart = track.loopStart;
  userDefinedLoopEnd = track.loopEnd;
  tapeDisplayStartTime = track.displayStartTime;
  tapeDisplayEndTime = track.displayEndTime;
  waveformPathData = track.waveformPathData;
  currentPlaybackRate = track.playbackRate;
  if (tapeLoopSpeedSlider) tapeLoopSpeedSlider.value = currentPlaybackRate;
  if (tapeLoopSpeedValue)
    tapeLoopSpeedValue.textContent = currentPlaybackRate.toFixed(2) + "x";
  updateTapeLooperUI();
  drawTapeWaveform();
}

async function handleIncomingTapeData({ track, data }) {
  if (!audioContext) return;
  try {
    const arrayBuffer = base64ToArrayBuffer(data);
    const decoded = await audioContext.decodeAudioData(arrayBuffer);
    tapeTracks[track].buffer = decoded;
    tapeTracks[track].writePosition = decoded.length;
    tapeTracks[track].effectivelyRecordedDuration = decoded.duration;
    tapeTracks[track].loopStart = 0;
    tapeTracks[track].loopEnd = decoded.duration;
    if (track === currentTapeTrack) {
      tapeLoopBuffer = decoded;
      tapeLoopWritePosition = decoded.length;
      tapeLoopEffectivelyRecordedDuration = decoded.duration;
      userDefinedLoopStart = 0;
      userDefinedLoopEnd = decoded.duration;
      tapeDisplayStartTime = 0;
      tapeDisplayEndTime = decoded.duration;
      waveformPathData = null;
      updateTapeLooperUI();
      drawTapeWaveform();
    }
  } catch (e) {
    console.warn('Failed to load shared tape data', e);
  }
}

function switchTapeTrack(index) {
  if (index === currentTapeTrack) return;
  saveCurrentTapeTrack();
  currentTapeTrack = index;
  loadTapeTrack(index);
  document.querySelectorAll('.tape-track-btn').forEach((btn) => {
    btn.classList.toggle('active', parseInt(btn.dataset.track) === index);
  });
}

let nodes = [];
if (typeof window !== 'undefined') {
  window.nodes = nodes;
}
let connections = [];
let activePulses = [];
let activeParticles = [];
let windParticles = [];
let nodeIdCounter = 0;
let connectionIdCounter = 0;
let pulseIdCounter = 0;
let particleIdCounter = 0;
let isAudioReady = false;
initPatchEffects({
  getIsAudioReady: () => isAudioReady,
  getAudioContext: () => audioContext,
  getNodes: () => nodes,
  getCrushWetGain: () => crushWetGain,
  getMistFilter: () => mistFilter,
  getMistLowpass: () => mistLowpass,
  getMistWetGain: () => mistWetGain,
  getScreenCoords,
  getWorldCoords,
  saveState,
});
let currentGlobalPulseId = 0;
let previousFrameTime = 0;
let pianoRollCanvas = null;
let pianoRollCtx = null;
let tapeWaveformCtx = null;
let pianoRollHexagons = [];
let pianoRollKeys = [];
let pianoRollMinusRect = null;
let pianoRollPlusRect = null;
let pianoRollMode = 'piano';
let pianoRollOctave = 0;
let pianoRollHoveredIndex = -1;
let pianoRollHoverMinus = false;
let pianoRollHoverPlus = false;
let activeNebulaInteractions = new Map();
let nebulaIdsToHide = new Set();
let portalGroupGain = null;
let originalNebulaGroupGain = null;
let activeRockets = [];
let rocketIdCounter = 0;
let isRotatingRocket = null;
let rotationStartDetails = {
  screenX: 0,
  screenY: 0,
  initialAngleRad: 0,
};
let isCrankingRadar = null;
let crankStartDetails = { previousMouseAngleRad: 0 };
let isDraggingLoopHandle = null;
let loopHandleDragStartX = 0;
let initialLoopHandleValue = 0;
let waveformPathData = null;


let currentTool = "edit";
let nodeTypeToAdd = null;
let waveformToAdd = null;
let soundEngineToAdd = null;
let noteIndexToAdd = -1;
let connectionTypeToAdd = "standard";
let noteSelectContainer = null;
let isDragging = false;
let isConnecting = false;
let isResizing = false;
let nodeClickedAtMouseDown = null;
let connectionClickedAtMouseDown = null;
let elementClickedAtMouseDown = null;
let connectingNode = null;
let resizeStartSize = 1.0;
let resizeStartY = 0;
let mousePos = {
  x: 0,
  y: 0,
};
let screenMousePos = {
  x: 0,
  y: 0,
};
let didDrag = false;
let mouseDownPos = {
  x: 0,
  y: 0,
};
let selectedElements = new Set();
let clipboardNodes = [];
let ctrlLikeAtMouseDown = false;
let isSelecting = false;
let selectionRect = {
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  active: false,
};
let nodeDragOffsets = new Map();
let dragStartPos = {
  x: 0,
  y: 0,
};
let brushNodeType = "sound";
let brushWaveform = "fmBell";
let brushStartWithPulse = true;
let brushNoteSequence = [];
let brushNoteSequenceIndex = 0;
let brushNotesInputValue = "";
let isBrushing = false;
let lastBrushNode = null;
let userDefinedGroups = [];
let userGroupIdCounter = 0;
let paramGroups = [];
let paramGroupIdCounter = 0;
const paramGroupMap = new WeakMap();
function makeUserDefinedGroup() {
  if (!isAudioReady || !audioContext) {
      alert("Audio context not ready.");
      return;
  }

  const selectedNodeIds = Array.from(selectedElements)
      .filter(el => el.type === 'node')
      .map(el => el.id);

  if (selectedNodeIds.length === 0) {
      alert("Select some nodes to group first.");
      return;
  }

  userDefinedGroups.forEach(group => {
      selectedNodeIds.forEach(nodeId => {
          group.nodeIds.delete(nodeId);
      });
  });
  userDefinedGroups = userDefinedGroups.filter(group => group.nodeIds.size > 0);

  const newGroupId = `userGroup_${userGroupIdCounter++}`;
  const newMainGroupGainNode = audioContext.createGain();
  newMainGroupGainNode.gain.value = 1.0;


  const groupDelaySendGain = audioContext.createGain();
  groupDelaySendGain.gain.value = DEFAULT_DELAY_SEND;

  const groupReverbSendGain = audioContext.createGain();
  groupReverbSendGain.gain.value = DEFAULT_REVERB_SEND;

  const newNodeIdSet = new Set(selectedNodeIds);
  userDefinedGroups.push({
      id: newGroupId,
      nodeIds: newNodeIdSet,
      gainNode: newMainGroupGainNode, 
      delaySendGainNode: groupDelaySendGain,
      reverbSendGainNode: groupReverbSendGain,
      
      volume: 1.0, 
      delaySendLevel: DEFAULT_DELAY_SEND,
      reverbSendLevel: DEFAULT_REVERB_SEND,
      userDefined: true
  });

  identifyAndRouteAllGroups();
  updateMixerGUI();
  saveState();
}

function refreshNodeAudio(node) {
  if (!node || !node.audioNodes) return;
  updateNodeAudioParams(node);
}

  function makeParameterGroup() {
    const selectedNodes = Array.from(selectedElements)
      .filter((el) => el.type === "node")
      .map((el) => findNodeById(el.id))
      .filter(
        (n) =>
          n &&
          isPlayableNode(n) &&
          n.audioParams &&
          n.audioNodes &&
          n.type !== TIMELINE_GRID_TYPE
      );

    if (selectedNodes.length < 2) {
      alert("Select at least two compatible nodes to link.");
      return;
    }
    const firstNodeType = selectedNodes[0].type;
    if (!selectedNodes.every((n) => n.type === firstNodeType)) {
      alert("Select nodes of the same type to link.");
      return;
    }
  paramGroups.forEach((g) => {
    selectedNodes.forEach((n) => g.nodeIds.delete(n.id));
  });
  paramGroups = paramGroups.filter((g) => g.nodeIds.size > 0);

  const firstNode = selectedNodes[0];
  if (!firstNode || !firstNode.audioParams) {
    alert("Selected node has no parameters.");
    return;
  }
  const baseParams = JSON.parse(JSON.stringify(firstNode.audioParams));
  delete baseParams.pitch;
  delete baseParams.scaleIndex;
  const group = {
    id: `paramGroup_${paramGroupIdCounter++}`,
    nodeIds: new Set(selectedNodes.map((n) => n.id)),
    params: null,
    nodeParamTargets: new Map(),
  };
  const proxy = new Proxy(baseParams, {
    set(target, prop, value) {
      if (prop === "pitch" || prop === "scaleIndex") {
        return true;
      }
      target[prop] = value;
      const g = paramGroupMap.get(proxy);
      if (g) {
        g.nodeIds.forEach((id) => {
          const n = findNodeById(id);
          const nodeTarget = g.nodeParamTargets.get(id);
          // Ensure each linked node's parameter object reflects the latest
          // value so audio updates propagate immediately without triggering
          // recursive proxy writes.
          if (nodeTarget) {
            if (Object.prototype.hasOwnProperty.call(nodeTarget, prop)) {
              nodeTarget[prop] = value;
            } else {
              Object.defineProperty(nodeTarget, prop, {
                value,
                writable: true,
                enumerable: true,
                configurable: true,
              });
            }
          }
          if (n && n.audioNodes) refreshNodeAudio(n);
        });
      }
      return true;
    },
  });
  group.params = proxy;
  paramGroupMap.set(proxy, group);
  paramGroups.push(group);
  group.nodeIds.forEach((id) => {
    const n = findNodeById(id);
    if (n) {
      const nodeParams = { pitch: n.audioParams.pitch, scaleIndex: n.audioParams.scaleIndex };
      Object.setPrototypeOf(nodeParams, proxy);
      const paramProxy = new Proxy(nodeParams, {
        get(target, prop) {
          if (prop in target) return target[prop];
          return proxy[prop];
        },
        set(target, prop, value) {
          if (prop === "pitch" || prop === "scaleIndex") {
            target[prop] = value;
            refreshNodeAudio(n);
          } else {
            proxy[prop] = value;
          }
          return true;
        },
      });
      group.nodeParamTargets.set(id, nodeParams);
      n.audioParams = paramProxy;
      refreshNodeAudio(n);
    }
  });
  saveState();
}

function removeNodeFromParamGroups(nodeId) {
  paramGroups.forEach((g) => {
    if (g.nodeIds.delete(nodeId)) {
      g.nodeParamTargets.delete(nodeId);
      const n = findNodeById(nodeId);
      if (n) {
        const params = {
          ...JSON.parse(JSON.stringify(g.params)),
          pitch: n.audioParams.pitch,
          scaleIndex: n.audioParams.scaleIndex,
        };
        n.audioParams = params;
        refreshNodeAudio(n);
      }
    }
  });
  paramGroups = paramGroups.filter((g) => g.nodeIds.size > 0);
}

let currentScaleKey = "major";
let currentScale = scales[currentScaleKey];
let currentRootNote = 0;
let globalTransposeOffset = 0;

let tapTempoTimes = [];
let identifiedGroups = [];
window.identifiedGroups = identifiedGroups;
let currentConstellationGroup = new Set();
let fluctuatingGroupNodeIDs = new Set();

let isGridVisible = false;
let gridType = "lines";
let isSnapEnabled = false;
const DEFAULT_GRID_SIZE_PX = 50;
const REFERENCE_BPM = 120;
const PIXELS_PER_SIXTEENTH_AT_REF_BPM = 50;
let isInfoTextVisible = true;
let viewOffsetX = 0;
let viewOffsetY = 0;
let viewScale = 1.0;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3.0;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SPEED = 10;
let isPanning = false;
let panStart = {
  x: 0,
  y: 0,
};
let isSpacebarDown = false;
let isUfoModeActive = false;
let playerUfo = null;
const UFO_MOVE_SPEED = 100;
const UFO_ACCEL = 300;
const UFO_FRICTION = 2.5;
const ufoKeys = { up: false, down: false, left: false, right: false };
let tractorBeamActive = false;
let tractorBeamTarget = null;
let ufoConnectorFirstNode = null;
let ufoOrbWaveform = "sine";
let wandLastTriggerTime = 0;
const WAND_TRIGGER_COOLDOWN = 0.2;
let wandHoveredNodeId = null;
let wandBeamEnd = null;
let wandBeamTimer = 0;
const WAND_BEAM_DURATION = 0.3;
const MAX_HISTORY_SIZE = 50;
let historyStack = [];
let historyIndex = -1;
let isPerformingUndoRedo = false;

export function getLatestState() {
  return historyStack[historyIndex] || null;
}
let isGlobalSyncEnabled = false;
let globalBPM = 120;
const subdivisionOptions = [
  {
    label: "1/32",
    value: 0.125,
  },
  {
    label: "1/16 Triplet",
    value: 1 / 6,
  },
  {
    label: "1/16",
    value: 0.25,
  },
  {
    label: "1/8 Triplet",
    value: 1 / 3,
  },
  {
    label: "1/8",
    value: 0.5,
  },
  {
    label: "1/4 Triplet",
    value: 2 / 3,
  },
  {
    label: "1/4",
    value: 1,
  },
  {
    label: "1/3 Beat",
    value: (1 / 3) * 4,
  },
  {
    label: "1/2",
    value: 2,
  },
  {
    label: "1/1 (Whole)",
    value: 4,
  },
  {
    label: "2/1 (2 Whole)",
    value: 8,
  },
  {
    label: "1/3 Note",
    value: 4 / 3,
  },
  {
    label: "1/5 Note",
    value: 4 / 5,
  },
  {
    label: "1/6 Note",
    value: 4 / 6,
  },
  {
    label: "1/9 Note",
    value: 4 / 9,
  },
];

const DEFAULT_SUBDIVISION_INDEX = 8;

let isPlaying = false;
let animationFrameId = null;
let userHasInteracted = false;
let lastBeatTime = 0;
let midiAccess = null;
let activeMidiInput = null;
let activeMidiOutput = null;
let activeMidiNotes = new Map();
let midiSyncInEnabled = false;
let midiSyncOutEnabled = false;
let lastMidiClockBeatTime = 0;
let midiClockPulseCounter = 0;
let midiClockIntervalId = null;

const pulsarTypes = [
  {
    type: "pulsar_standard",
    label: "Standard",
    icon: "🔆",
  },
  {
    type: "pulsar_random_volume",
    label: "Random Volume",
    icon: "🔀🔆",
  },
  {
    type: "pulsar_random_particles",
    label: "Random Timing",
    icon: "🎲🔆",
  },
  {
    type: "pulsar_triggerable",
    label: "Triggerable",
    icon: "⚡🔆",
  },
  {
    type: "pulsar_manual",
    label: "Manual",
    icon: "👆",
  },
  {
    type: "pulsar_rocket",
    label: "Rocket",
    icon: "🚀",
  },
  {
    type: "pulsar_ufo",
    label: "UFO",
    icon: "🛸",
  },
  {
    type: "pulsar_meteorshower", 
    label: "Meteor Shower",     
    icon: "☄️",                 
  },
];

const samplerWaveformTypes =
  typeof SAMPLER_DEFINITIONS !== "undefined"
    ? SAMPLER_DEFINITIONS.map((sampler) => ({
        type: `sampler_${sampler.id}`,
        label: sampler.label,
        icon: sampler.icon,
        loadFailed: sampler.loadFailed,
      }))
    : [];

if (
  samplerWaveformTypes.length === 0 &&
  typeof SAMPLER_DEFINITIONS === "undefined"
) {
  console.error(
    "SAMPLER_DEFINITIONS is niet gevonden. Zorg dat samplers.js correct geladen wordt vóór app.js in index.html.",
  );
}

if (
  samplerWaveformTypes.length === 0 &&
  typeof SAMPLER_DEFINITIONS === "undefined"
) {
  console.error(
    "SAMPLER_DEFINITIONS is niet gevonden. Zorg dat samplers.js correct geladen wordt vóór app.js in index.html.",
  );
}

const drumElementTypes = Object.keys(DRUM_ELEMENT_DEFAULTS).map((key) => ({
  type: key,
  label: DRUM_ELEMENT_DEFAULTS[key].label,
  icon: DRUM_ELEMENT_DEFAULTS[key].icon,
}));

function isPulsarType(type) {
  return pulsarTypes.some((pt) => pt.type === type);
}

function isDrumType(type) {
  return drumElementTypes.some((dt) => dt.type === type);
}

const NEBULA_PRESET_OPTIONS = [...analogWaveformPresets, ...fmSynthPresets].filter(
  (p) => !isDrumType(p.type) && !p.type.startsWith("sampler_")
);

function isPlayableNode(node) {
  if (!node) return false;
  return (
    node.type === "sound" ||
    isDrumType(node.type) ||
    node.type === PRORB_TYPE ||
    node.type === MIDI_ORB_TYPE ||
    node.type === ALIEN_ORB_TYPE ||
    node.type === ALIEN_DRONE_TYPE ||
    node.type === ARVO_DRONE_TYPE ||
    node.type === FM_DRONE_TYPE ||
    node.type === RESONAUTER_TYPE ||
    node.type === RADIO_ORB_TYPE
  );
}


function updateBrushNoteSequenceFromString(str) {
  brushNotesInputValue = str;
  brushNoteSequence = [];
  brushNoteSequenceIndex = 0;
  if (!str) return;
  const parts = str.split(",").map((p) => p.trim()).filter((p) => p);
  parts.forEach((pt) => {
    const midi = parseNoteNameToMidi(pt);
    if (!isNaN(midi)) {
      brushNoteSequence.push(
        getClosestScaleIndexForMidi(
          midi,
          currentScale,
          MIN_SCALE_INDEX,
          MAX_SCALE_INDEX,
          currentRootNote,
          globalTransposeOffset,
        ),
      );
    }
  });
}


function getStringConnectionPoint(connection, t) {
  const nA = findNodeById(connection.nodeAId);
  const nB = findNodeById(connection.nodeBId);
  if (!nA || !nB) return { x: 0, y: 0 };
  const pA = getConnectionPoint(nA, connection.nodeAHandle);
  const pB = getConnectionPoint(nB, connection.nodeBHandle);
  const mX = (pA.x + pB.x) / 2 + connection.controlPointOffsetX;
  const mY = (pA.y + pB.y) / 2 + connection.controlPointOffsetY;
  const baseX = lerp(lerp(pA.x, mX, t), lerp(mX, pB.x, t), t);
  const baseY = lerp(lerp(pA.y, mY, t), lerp(mY, pB.y, t), t);
  const dx = 2 * (1 - t) * (mX - pA.x) + 2 * t * (pB.x - mX);
  const dy = 2 * (1 - t) * (mY - pA.y) + 2 * t * (pB.y - mY);
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const depth = connection.audioParams?.vibratoDepth ?? STRING_VIOLIN_DEFAULTS.vibratoDepth;
  const rate = connection.audioParams?.vibratoRate ?? STRING_VIOLIN_DEFAULTS.vibratoRate;
  const amp = (depth / 10) * 8 / viewScale;
  const wavelength = Math.max(5, 60 / rate) / viewScale;
  const phase = (t * connection.length) / wavelength * 2 * Math.PI;
  const envelope = Math.sin(Math.PI * t);
  const offset = Math.sin(phase) * amp * envelope;
  return { x: baseX + nx * offset, y: baseY + ny * offset };
}

function updateRopeConnections() {
  connections.forEach((conn) => {
    if (conn.type !== "rope") return;
    const nA = findNodeById(conn.nodeAId);
    const nB = findNodeById(conn.nodeBId);
    if (!nA || !nB) return;
    let driver = null;
    let follower = null;
    if (nA.angle !== undefined && (nA.type === MOTOR_ORB_TYPE || nA.type === CLOCKWORK_ORB_TYPE || nA.angle !== undefined)) {
      driver = nA;
      follower = nB;
    } else if (nB.angle !== undefined) {
      driver = nB;
      follower = nA;
    } else {
      return;
    }
    const dx = follower.x - driver.x;
    const dy = follower.y - driver.y;
    if (!conn.ropeLength) {
      conn.ropeLength = Math.sqrt(dx * dx + dy * dy);
      conn.angleOffset = Math.atan2(dy, dx) - (driver.angle || 0);
    }
    const r = conn.ropeLength;
    const angle = (driver.angle || 0) + (conn.angleOffset || 0);
    follower.x = driver.x + Math.cos(angle) * r;
    follower.y = driver.y + Math.sin(angle) * r;
  });
}

function updateAllConnectionLengths() {
  connections.forEach((conn) => {
    const nA = findNodeById(conn.nodeAId);
    const nB = findNodeById(conn.nodeBId);
    if (!nA || !nB) return;
    const pA = getConnectionPoint(nA, conn.nodeAHandle);
    const pB = getConnectionPoint(nB, conn.nodeBHandle);
    conn.length = distance(pA.x, pA.y, pB.x, pB.y);
  });
}

function findNodeAt(worldX, worldY) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.type === TIMELINE_GRID_TYPE || n.type === GRID_SEQUENCER_TYPE) {
      const rectX1 = n.x - n.width / 2;
      const rectY1 = n.y - n.height / 2;
      const rectX2 = n.x + n.width / 2;
      const rectY2 = n.y + n.height / 2;
      if (
        worldX >= rectX1 &&
        worldX <= rectX2 &&
        worldY >= rectY1 &&
        worldY <= rectY2
      ) {
        return n;
      }
    } else if (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE) {
      const d = distance(worldX, worldY, n.x, n.y);
      if (d <= n.radius) {
        return n;
      }
    } else {
      const apparentRadius = NODE_RADIUS_BASE * n.size * 1.15;
      const d = distance(worldX, worldY, n.x, n.y);
      if (d < apparentRadius) {
        return n;
      }
    }
  }
  return null;
}

function findCrankRadarHandleAt(worldX, worldY) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.type === CRANK_RADAR_TYPE) {
      const pivotRadius = n.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
      const handleLength = n.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
      const angle = (n.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
      const pivotX = n.x + Math.cos(angle) * pivotRadius;
      const pivotY = n.y + Math.sin(angle) * pivotRadius;
      const handleAngle = angle + Math.PI / 2;
      const gripX = pivotX + Math.cos(handleAngle) * handleLength;
      const gripY = pivotY + Math.sin(handleAngle) * handleLength;
      const pivotR = 6 / viewScale;
      const gripR = 7 / viewScale;
      if (
        distance(worldX, worldY, gripX, gripY) < gripR ||
        distance(worldX, worldY, pivotX, pivotY) < pivotR
      ) {
        return n;
      }
    }
  }
  return null;
}

function getCrankRadarHandleGripPos(n) {
  const pivotRadius = n.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
  const handleLength = n.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
  const angle = (n.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
  const pivotX = n.x + Math.cos(angle) * pivotRadius;
  const pivotY = n.y + Math.sin(angle) * pivotRadius;
  const handleAngle = angle + Math.PI / 2;
  const gripX = pivotX + Math.cos(handleAngle) * handleLength;
  const gripY = pivotY + Math.sin(handleAngle) * handleLength;
  return { x: gripX, y: gripY };
}

function getConnectionPoint(node, useHandle) {
  if (useHandle && node.type === CRANK_RADAR_TYPE) {
    return getCrankRadarHandleGripPos(node);
  }
  if (node.type === MOTOR_ORB_TYPE || node.type === CLOCKWORK_ORB_TYPE) {
    const angle = node.angle || 0;
    return {
      x: node.x + Math.cos(angle) * node.radius,
      y: node.y + Math.sin(angle) * node.radius,
    };
  }
  return { x: node.x, y: node.y };
}

function findNodeById(id) {
  return nodes.find((n) => n.id === id);
}

function findConnectionById(id) {
  return connections.find((c) => c.id === id);
}

function findNearestOrb(x, y, maxDist) {
  let nearest = null;
  let best = maxDist;
  const orbTypes = ["sound", MIDI_ORB_TYPE, ALIEN_ORB_TYPE, ALIEN_DRONE_TYPE, ARVO_DRONE_TYPE, FM_DRONE_TYPE, RESONAUTER_TYPE, RADIO_ORB_TYPE, MOTOR_ORB_TYPE, CLOCKWORK_ORB_TYPE];
  for (const n of nodes) {
    if (!orbTypes.includes(n.type)) continue;
    const d = distance(x, y, n.x, n.y);
    if (d < best) {
      best = d;
      nearest = n;
    }
  }
  return nearest;
}

function findNearestConnectableNode(x, y, maxDist) {
  let nearest = null;
  let best = maxDist;
  for (const n of nodes) {
    if (isPlayableNode(n) || isPulsarType(n.type)) {
      const d = distance(x, y, n.x, n.y);
      if (d < best) {
        best = d;
        nearest = n;
      }
    }
  }
  return nearest;
}

function findConnectionNear(worldX, worldY, threshold = 10) {
  const screenThreshold = threshold / viewScale;
  for (const conn of connections) {
    const nA = findNodeById(conn.nodeAId);
    const nB = findNodeById(conn.nodeBId);
    if (!nA || !nB) continue;
    const pA = getConnectionPoint(nA, conn.nodeAHandle);
    const pB = getConnectionPoint(nB, conn.nodeBHandle);
    const midX = (pA.x + pB.x) / 2 + conn.controlPointOffsetX;
    const midY = (pA.y + pB.y) / 2 + conn.controlPointOffsetY;
    const curveMidX = lerp(lerp(pA.x, midX, 0.5), lerp(midX, pB.x, 0.5), 0.5);
    const curveMidY = lerp(lerp(pA.y, midY, 0.5), lerp(midY, pB.y, 0.5), 0.5);
    const d = distance(worldX, worldY, curveMidX, curveMidY);
    if (d < screenThreshold) {
      return conn;
    }
  }
  return null;
}

function isElementSelected(type, id) {
  for (const elem of selectedElements) {
    if (elem.type === type && elem.id === id) {
      return true;
    }
  }
  return false;
}


export function getWorldCoords(screenX, screenY) {
  return {
    x: (screenX - viewOffsetX) / viewScale,
    y: (screenY - viewOffsetY) / viewScale,
  };
}

export function getScreenCoords(worldX, worldY) {
  return {
    x: worldX * viewScale + viewOffsetX,
    y: worldY * viewScale + viewOffsetY,
  };
}

function updateLoadingIndicator() {
  const percent =
    totalSamples > 0
      ? Math.round((samplesLoadedCount / totalSamples) * 100)
      : 100;
  loadingIndicator.textContent = `Loading Samples... ${percent}%`;
  loadingIndicator.style.display = "block";
  loadingIndicator.style.opacity = "1";
}

function hideLoadingIndicator() {
  if (!loadingIndicator) return;
  loadingIndicator.style.opacity = "0";
  setTimeout(() => {
    loadingIndicator.style.display = "none";
    loadingIndicator.style.opacity = "1";
  }, 500);
}
async function loadSample(url, sampleName) {
  updateLoadingIndicator();
  try {
    const fetchStart = performance.now();
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status} for ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    let decodedBuffer = null;
    if (
      typeof audioContext.decodeAudioData === "function" &&
      audioContext.decodeAudioData.length !== 1
    ) {
      const decodeStart = performance.now();
      decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } else {
      const decodeStart = performance.now();
      decodedBuffer = await new Promise((resolve, reject) => {
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            resolve(buffer);
          },
          (error) => {
            console.error(
              `[Sampler Load] DecodeAudioData (callback) error for ${sampleName}:`,
              error,
            );
            reject(error);
          },
        );
      });
    }
    samplesLoadedCount++;
    updateLoadingIndicator();
    return {
      name: sampleName,
      buffer: decodedBuffer,
      success: true,
    };
  } catch (error) {
    console.error(
      `[Sampler Load] CATCH error for sample ${sampleName} from ${url}:`,
      error,
    );
    updateLoadingIndicator();

    if (typeof SAMPLER_DEFINITIONS !== "undefined") {
      const definition = SAMPLER_DEFINITIONS.find((s) => s.id === sampleName);
      if (definition) {
        definition.loadFailed = true;
      }
    }

    if (typeof samplerWaveformTypes !== "undefined") {
      const wfType = samplerWaveformTypes.find(
        (w) => w.type === `sampler_${sampleName}`,
      );
      if (wfType) {
        wfType.loadFailed = true;
      }
    }

    return {
      name: sampleName,
      buffer: null,
      success: false,
    };
  }
}

const impulseResponses = [
    { name: "Default Reverb", url: "audio/reverb.wav" },
    { name: "Factory Hall", url: "audio/Factory-Hall.wav" },
    { name: "Church", url: "audio/church.wav" }
];
let currentIRUrl = impulseResponses[0].url;

export async function setupAudio() {
  if (audioContext) return audioContext;
  try {
    audioContext = window.audioContext || (window.audioContext = new (window.AudioContext || window.webkitAudioContext)());
    audioContext.onstatechange = () => {};
    const originalResume = audioContext.resume.bind(audioContext);
    audioContext.resume = (...args) => {
      const start = performance.now();
      return originalResume(...args).then((res) => {
        return res;
      });
    };
    const originalSuspend = audioContext.suspend.bind(audioContext);
    audioContext.suspend = (...args) => {
      const start = performance.now();
      return originalSuspend(...args).then((res) => {
        return res;
      });
    };
    try {
      await audioContext.resume();
      Tone.setContext(new Tone.Context({ context: audioContext }));
      await Tone.start();
    } catch (resumeErr) {
      console.error('AudioContext initial resume failed', resumeErr);
    }
    const resumeEvents = ['click', 'pointerdown', 'touchstart'];
    const resumeAudioContext = (event) => {
      const removeListeners = () => {
        resumeEvents.forEach((evt) => window.removeEventListener(evt, resumeAudioContext));
      };
      if (audioContext.state === 'suspended') {
        audioContext.resume()
          .then(() => {
          if (audioContext.state === 'running') removeListeners();
        })
          .catch((err) => {
            console.error('AudioContext resume failed', err);
          });
      } else if (audioContext.state === 'running') {
        removeListeners();
      }
    };
    resumeEvents.forEach((evt) => {
      window.addEventListener(evt, resumeAudioContext);
    });
    originalMasterGainDestination = audioContext.destination;

    masterGain = audioContext.createGain();
    window.masterGain = masterGain;
    masterGain.gain.value = 0.8;
    masterGain._originalGainBeforeMute = masterGain.gain.value;

    masterPannerNode = audioContext.createStereoPanner();
    masterPannerNode.pan.value = 0;

    masterAnalyser = audioContext.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterAnalyser.smoothingTimeConstant = 0.7;


    masterGain.connect(masterPannerNode);
    mrfaInput = audioContext.createGain();
    mrfaOutput = audioContext.createGain();
    mrfaWetGain = audioContext.createGain();
    mrfaDryGain = audioContext.createGain();
    mrfaDirectGain = audioContext.createGain();
    mrfaWetGain.gain.value = 0;
    mrfaDryGain.gain.value = 1;
    mrfaDirectGain.gain.value = 1.0;
    masterPannerNode.connect(mrfaInput);
    mrfaInput.connect(mrfaDryGain);
    mrfaWetGain.connect(mrfaOutput);
    mrfaDryGain.connect(mrfaOutput);
    mrfaOutput.connect(mrfaDirectGain);
    mrfaDirectGain.connect(masterAnalyser);
    masterAnalyser.connect(originalMasterGainDestination);

    for (let i = 0; i < NUM_TAPE_TRACKS; i++) {
      const gain = audioContext.createGain();
      gain.gain.value = 1.0;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      gain.connect(analyser);
      analyser.connect(masterGain);
      tapeTrackGainNodes[i] = gain;
      tapeTrackAnalyserNodes[i] = analyser;
    }

    if (window.radioGainNode && window.radioAnalyserNode) {
      try { window.radioGainNode.disconnect(); } catch (e) {}
      try { window.radioAnalyserNode.disconnect(); } catch (e) {}

      radioPannerNode = audioContext.createStereoPanner();
      radioPannerNode.pan.value = 0;

      radioDelaySendGainNode = audioContext.createGain();
      radioDelaySendGainNode.gain.value = DEFAULT_DELAY_SEND;

      radioReverbSendGainNode = audioContext.createGain();
      radioReverbSendGainNode.gain.value = DEFAULT_REVERB_SEND;

      window.radioGainNode.connect(radioPannerNode);
      radioPannerNode.connect(window.radioAnalyserNode);
      window.radioAnalyserNode.connect(masterGain);

      radioGainNode = window.radioGainNode;
      radioAnalyserNode = window.radioAnalyserNode;
    }

    portalGroupGain = audioContext.createGain();
    portalGroupGain.gain.value = 0.7;
    portalGroupGain.connect(masterGain);

    originalNebulaGroupGain = audioContext.createGain();
    originalNebulaGroupGain.gain.value = 0.8;
    originalNebulaGroupGain.connect(masterGain);

    reverbPreDelayNode = audioContext.createDelay(1.0);
    reverbPreDelayNode.delayTime.value = 0.02;
    reverbNode = audioContext.createConvolver();
    reverbLowPass = audioContext.createBiquadFilter();
    reverbLowPass.type = "lowpass";
    reverbLowPass.frequency.value = DEFAULT_REVERB_DAMP_FREQ;
    reverbHighPass = audioContext.createBiquadFilter();
    reverbHighPass.type = "highpass";
    reverbHighPass.frequency.value = 100;
    reverbWetGain = audioContext.createGain();

    reverbWetGain.gain.value = 0.9;
    reverbWetGain._originalGainBeforeMute = reverbWetGain.gain.value;
    reverbWetGain.isMuted = false;
    reverbWetGain.isSoloed = false;

    reverbReturnAnalyser = audioContext.createAnalyser();
    reverbReturnAnalyser.fftSize = 256;
    reverbReturnAnalyser.smoothingTimeConstant = 0.7;

    reverbPreDelayNode.connect(reverbNode);
    reverbNode.connect(reverbHighPass);
    reverbHighPass.connect(reverbLowPass);
    reverbLowPass.connect(reverbWetGain);
    reverbWetGain.connect(reverbReturnAnalyser);
    reverbReturnAnalyser.connect(originalMasterGainDestination);

    delayNode = audioContext.createDelay(1.0);
    delayFeedbackGain = audioContext.createGain();
    masterDelaySendGain = audioContext.createGain();
    masterDelaySendGain.gain.value = 0.3;
    delayNode.delayTime.value = 0.25;
    delayFeedbackGain.gain.value = 0.4;

    delayReturnGain = audioContext.createGain();
    delayReturnGain.gain.value = 0.5;
    delayReturnGain._originalGainBeforeMute = delayReturnGain.gain.value;
    delayReturnGain.isMuted = false;
    delayReturnGain.isSoloed = false;

    delayReturnAnalyser = audioContext.createAnalyser();
    delayReturnAnalyser.fftSize = 256;
    delayReturnAnalyser.smoothingTimeConstant = 0.7;

    masterDelaySendGain.connect(delayNode);
    delayNode.connect(delayFeedbackGain);
    delayFeedbackGain.connect(delayNode);
    delayNode.connect(delayReturnGain);
    delayReturnGain.connect(delayReturnAnalyser);
    delayReturnAnalyser.connect(originalMasterGainDestination);

    isDelayReady = true;

    if (window.radioGainNode) {
      try { window.radioGainNode.disconnect(radioDelaySendGainNode); } catch(e) {}
      try { window.radioGainNode.disconnect(radioReverbSendGainNode); } catch(e) {}
      if (radioDelaySendGainNode && masterDelaySendGain) {
        window.radioGainNode.connect(radioDelaySendGainNode);
        radioDelaySendGainNode.connect(masterDelaySendGain);
      }
      if (radioReverbSendGainNode && reverbPreDelayNode) {
        window.radioGainNode.connect(radioReverbSendGainNode);
        radioReverbSendGainNode.connect(reverbPreDelayNode);
      }
    }

    mistEffectInput = audioContext.createGain();
    mistDelay = audioContext.createDelay();
    mistDelay.delayTime.value = MIST_DELAY_TIME;
    mistFeedback = audioContext.createGain();
    mistFeedback.gain.value = MIST_FEEDBACK_GAIN;
    mistFilter = audioContext.createBiquadFilter();
    mistFilter.type = "bandpass";
    mistFilter.frequency.value = MIST_RESON_FREQ;
    mistFilter.Q.value = 4;
    mistLowpass = audioContext.createBiquadFilter();
    mistLowpass.type = "lowpass";
    mistLowpass.frequency.value = MIST_LOW_PASS_FREQ;
    mistWetGain = audioContext.createGain();
    mistWetGain.gain.value = MIST_WET_LEVEL;
    mistPanner = audioContext.createStereoPanner();

    mistEffectInput.connect(mistDelay);
    mistDelay.connect(mistFeedback);
    mistFeedback.connect(mistDelay);
    mistDelay.connect(mistFilter);
    mistFilter.connect(mistLowpass);
    mistLowpass.connect(mistPanner);
    mistPanner.connect(mistWetGain);
    mistWetGain.connect(masterGain);

    mistPanLFO = audioContext.createOscillator();
    mistPanLFO.frequency.value = MIST_PAN_LFO_RATE;
    mistPanLFOGain = audioContext.createGain();
    mistPanLFOGain.gain.value = MIST_PAN_LFO_DEPTH;
    mistPanLFO.connect(mistPanLFOGain);
    mistPanLFOGain.connect(mistPanner.pan);
    mistPanLFO.start();

    mistDelayLFO = audioContext.createOscillator();
    mistDelayLFO.frequency.value = MIST_DELAY_LFO_RATE;
    mistDelayLFOGain = audioContext.createGain();
    mistDelayLFOGain.gain.value = MIST_DELAY_LFO_DEPTH;
    mistDelayLFO.connect(mistDelayLFOGain);
    mistDelayLFOGain.connect(mistDelay.delayTime);
    mistDelayLFO.start();

    crushEffectInput = audioContext.createGain();
    crushBitCrusher = createBitCrusherNode(CRUSH_BIT_DEPTH, CRUSH_REDUCTION);
    crushCombDelay = audioContext.createDelay();
    crushCombDelay.delayTime.value = CRUSH_COMB_DELAY;
    crushCombFeedback = audioContext.createGain();
    crushCombFeedback.gain.value = CRUSH_COMB_FEEDBACK;
    crushWetGain = audioContext.createGain();
    crushWetGain.gain.value = CRUSH_WET_LEVEL;

    crushEffectInput.connect(crushBitCrusher);
    crushBitCrusher.connect(crushCombDelay);
    crushCombDelay.connect(crushCombFeedback);
    crushCombFeedback.connect(crushCombDelay);
    crushCombDelay.connect(crushWetGain);
    crushWetGain.connect(masterGain);

    mrfaFilters = [];
    mrfaGains = [];
    MRFA_BAND_FREQS.forEach((freq) => {
      const bp = audioContext.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = MRFA_Q;
      const g = audioContext.createGain();
      g.gain.value = MRFA_DEFAULT_GAIN;
      mrfaInput.connect(bp);
      bp.connect(g);
      g.connect(mrfaWetGain);
      mrfaFilters.push(bp);
      mrfaGains.push(g);
    });
    perfResoInput = audioContext.createGain();
    perfResoInput.gain.value = perfResoEnabled ? 1.0 : 0.0;
    perfResoDelay = audioContext.createDelay();
    perfResoDelay.delayTime.value = PERF_RESO_DELAY_TIME;
    perfResoDelayLFO = audioContext.createOscillator();
    perfResoDelayLFO.frequency.value = 0.15;
    perfResoDelayLFOGain = audioContext.createGain();
    perfResoDelayLFOGain.gain.value = 0.003;
    perfResoDelayLFO.connect(perfResoDelayLFOGain);
    perfResoDelayLFOGain.connect(perfResoDelay.delayTime);
    perfResoDelayLFO.start();
    perfResoFeedback = audioContext.createGain();
    perfResoFeedback.gain.value = PERF_RESO_FEEDBACK;
    perfResoFilter = audioContext.createBiquadFilter();
    perfResoFilter.type = "bandpass";
    perfResoFilter.frequency.value = PERF_RESO_FREQ;
    perfResoFilter.Q.value = PERF_RESO_Q;
    perfResoGain = audioContext.createGain();
    perfResoGain.gain.value = perfResoEnabled ? PERF_RESO_WET : 0.0;
    mrfaOutput.connect(perfResoInput);
    perfResoInput.connect(perfResoDelay);
    perfResoDelay.connect(perfResoFeedback);
    perfResoFeedback.connect(perfResoDelay);
    perfResoDelay.connect(perfResoFilter);
    perfResoFilter.connect(perfResoGain);
    perfResoGain.connect(masterAnalyser);

    perfReverbInput = audioContext.createGain();
    perfReverbInput.gain.value = perfReverbEnabled ? 1.0 : 0.0;
    perfReverbWetGain = audioContext.createGain();
    perfReverbWetGain.gain.value = perfReverbEnabled ? PERF_REVERB_WET : 0.0;
    perfReverbLowPass = audioContext.createBiquadFilter();
    perfReverbLowPass.type = "lowpass";
    perfReverbLowPass.frequency.value = DEFAULT_REVERB_DAMP_FREQ;

    const perfReverbMix = audioContext.createGain();
    PERF_REVERB_BASE_TIMES.forEach((dt) => {
      const d = audioContext.createDelay();
      d.delayTime.value = dt;
      const fb = audioContext.createGain();
      fb.gain.value = PERF_REVERB_DECAY;
      const lfo = audioContext.createOscillator();
      lfo.frequency.value = 0.1 + Math.random() * 0.2;
      const lfoGain = audioContext.createGain();
      lfoGain.gain.value = 0.002;
      lfo.connect(lfoGain);
      lfoGain.connect(d.delayTime);
      lfo.start();
      perfReverbInput.connect(d);
      d.connect(fb);
      fb.connect(d);
      d.connect(perfReverbMix);
      perfReverbDelayNodes.push(d);
      perfReverbFeedbackGains.push(fb);
      perfReverbLFOs.push(lfo);
      perfReverbLFOGains.push(lfoGain);
    });
    perfReverbMix.connect(perfReverbLowPass);
    perfReverbLowPass.connect(perfReverbWetGain);
    perfReverbWetGain.connect(reverbReturnAnalyser);
    perfResoGain.connect(perfReverbInput);
    mrfaOutput.connect(perfReverbInput);

    try {
        const irToLoad = currentIRUrl || (typeof impulseResponses !== 'undefined' && impulseResponses.length > 0 ? impulseResponses[0].url : REVERB_IR_URL);
        const r = await fetch(irToLoad);
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status} for ${irToLoad}`);
        const ab = await r.arrayBuffer();
        if (audioContext.decodeAudioData.length === 1) { 
            await new Promise((res, rej) => {
                audioContext.decodeAudioData(ab, (b) => { reverbNode.buffer = b; isReverbReady = true; res(); }, 
                                            (e) => { isReverbReady = false; console.error(`Failed to decode reverb IR (callback): ${irToLoad}`, e); rej(e); });
            });
        } else { 
            const b = await audioContext.decodeAudioData(ab);
            reverbNode.buffer = b; isReverbReady = true;
        }
    } catch (e) {
        console.error(`Failed to load or process reverb IR: ${currentIRUrl || (typeof impulseResponses !== 'undefined' && impulseResponses.length > 0 ? impulseResponses[0].url : REVERB_IR_URL)}`, e);
        isReverbReady = false;
    }

    samplesLoadedCount = 0;
    totalSamples = typeof SAMPLER_DEFINITIONS !== "undefined" ? SAMPLER_DEFINITIONS.length : 0;
    updateLoadingIndicator();
    const sampleLoadPromises = typeof SAMPLER_DEFINITIONS !== "undefined" ? SAMPLER_DEFINITIONS.map(sampler => loadSample(sampler.url, sampler.id)) : [];
    const loadResults = await Promise.all(sampleLoadPromises);
    if (typeof SAMPLER_DEFINITIONS !== "undefined") {
        loadResults.forEach(result => {
            const definition = SAMPLER_DEFINITIONS.find(s => s.id === result.name);
            if (definition) {
                if (result.success) {
                    definition.buffer = result.buffer;
                    definition.reversedBuffer = null;
                    definition.isLoaded = true;
                    definition.loadFailed = false;
                } else {
                    definition.buffer = null;
                    definition.reversedBuffer = null;
                    definition.isLoaded = false;
                    definition.loadFailed = true;
                }
            }
        });
    }
    const successes = loadResults.filter(r => r.success).length;
    updateLoadingIndicator();
    isAudioReady = true;
    if (typeof window !== 'undefined') window.isAudioReady = true;
    resetSideToolbars();
    if (scaleSelectTransport) changeScale(scaleSelectTransport.value, true);
    updateSyncUI();
    updateGroupControlsUI();
    updateInfoToggleUI();
    setupMIDI();

    if (historyStack.length === 0) saveState();
    identifyAndRouteAllGroups();
    drawPianoRoll();
    initializeGlobalEffectSliders();

    return audioContext;
  } catch (e) {
      console.error("Error during setupAudio:", e);
      if(startMessage) {
          startMessage.textContent = "Audio Context Error";
          startMessage.style.display = "block";
      }
      isAudioReady = false;
      if (typeof window !== 'undefined') window.isAudioReady = false;
      return null;
  }
}

 

function populateReverbIRSelect() {
    if (!reverbIRSelect) return;
    reverbIRSelect.innerHTML = ""; 
    impulseResponses.forEach(ir => {
        const option = document.createElement("option");
        option.value = ir.url;
        option.textContent = ir.name;
        reverbIRSelect.appendChild(option);
    });
    reverbIRSelect.value = currentIRUrl; 
}


async function updateReverbIR(newIRUrl) {
    if (!audioContext || !reverbNode) return;
    currentIRUrl = newIRUrl;
    isReverbReady = false; 
    try {
      const r = await fetch(currentIRUrl);
      if (!r.ok) throw new Error(`HTTP error! status: ${r.status} for ${currentIRUrl}`);
      const ab = await r.arrayBuffer();
      let decodedBuffer;
      if (audioContext.decodeAudioData.length === 1) { 
          decodedBuffer = await new Promise((res, rej) => {
              audioContext.decodeAudioData(ab, buffer => res(buffer), error => rej(error));
          });
      } else {
          decodedBuffer = await audioContext.decodeAudioData(ab);
      }
      reverbNode.buffer = decodedBuffer;
      isReverbReady = true;
      saveState();
    } catch (e) {
        console.error(`Failed to load or process new reverb IR: ${currentIRUrl}`, e);
        
        isReverbReady = false;
    }
}

















function getNextQuantizedTime(baseTime, beatsToQuantizeTo = 1) {
  if (!isGlobalSyncEnabled || !audioContext || globalBPM <= 0) {
    return audioContext.currentTime;
  }
  const secondsPerBeat = 60.0 / globalBPM;
  const quantizationIntervalSeconds = secondsPerBeat * beatsToQuantizeTo;
  const currentTime = baseTime || audioContext.currentTime;
  let nextTime =
    Math.ceil(currentTime / quantizationIntervalSeconds) *
    quantizationIntervalSeconds;
  if (nextTime <= currentTime + 0.02) {
    nextTime += quantizationIntervalSeconds;
  }
  return nextTime;
}


export function identifyAndRouteAllGroups() {
  if (!isAudioReady || !audioContext) return;

  const ensureGroupAudioExtras = (group) => {
      if (!group.pannerNode && audioContext) {
          group.pannerNode = audioContext.createStereoPanner();
      }
      if (!group.analyserNode && audioContext) { 
          group.analyserNode = audioContext.createAnalyser();
          group.analyserNode.fftSize = 256;
          group.analyserNode.smoothingTimeConstant = 0.7;
      }
      if (group.soloState === undefined) group.soloState = false;
      if (group.muteState === undefined) group.muteState = false;
      if (group.gainNode && group.gainNode._originalGainBeforeMute === undefined) {
        group.gainNode._originalGainBeforeMute = group.gainNode.gain.value;
      }
  };
  
  userDefinedGroups.forEach(ensureGroupAudioExtras);
  
  const nodesInUserGroups = new Set();
  if (userDefinedGroups && Array.isArray(userDefinedGroups)) {
      userDefinedGroups.forEach(ug => {
          if (ug.nodeIds && ug.gainNode) { 
              ug.nodeIds.forEach(nodeId => nodesInUserGroups.add(nodeId));
              try { ug.gainNode.disconnect(); } catch (e) {} 
              try { ug.pannerNode.disconnect(); } catch(e){}
              try { ug.analyserNode.disconnect(); } catch(e){}


              ug.gainNode.connect(ug.pannerNode);
              ug.pannerNode.connect(ug.analyserNode); 
              ug.analyserNode.connect(masterGain);    

              if (ug.delaySendGainNode && masterDelaySendGain) {
                  try { ug.delaySendGainNode.disconnect(); } catch(e){}
                  ug.gainNode.connect(ug.delaySendGainNode); 
                  ug.delaySendGainNode.connect(masterDelaySendGain); 
              }
              if (ug.reverbSendGainNode && reverbPreDelayNode) {
                  try { ug.reverbSendGainNode.disconnect(); } catch(e){}
                  ug.gainNode.connect(ug.reverbSendGainNode);
                  ug.reverbSendGainNode.connect(reverbPreDelayNode); 
              }
          } else if (ug.nodeIds && !ug.gainNode && audioContext) { 
              ug.gainNode = audioContext.createGain();
              ug.gainNode.gain.value = ug.volume !== undefined ? ug.volume : 1.0;
              ug.gainNode._originalGainBeforeMute = ug.gainNode.gain.value;
              
              ug.pannerNode = audioContext.createStereoPanner();
              ug.pannerNode.pan.value = ug.pan !== undefined ? ug.pan : 0;

              ug.analyserNode = audioContext.createAnalyser(); 
              ug.analyserNode.fftSize = 256;
              ug.analyserNode.smoothingTimeConstant = 0.7;

              ug.gainNode.connect(ug.pannerNode);
              ug.pannerNode.connect(ug.analyserNode); 
              ug.analyserNode.connect(masterGain);    

              ug.delaySendGainNode = audioContext.createGain();
              ug.delaySendGainNode.gain.value = ug.delaySendLevel !== undefined ? ug.delaySendLevel : DEFAULT_DELAY_SEND;
              ug.gainNode.connect(ug.delaySendGainNode);
              ug.delaySendGainNode.connect(masterDelaySendGain);
              
              ug.reverbSendGainNode = audioContext.createGain();
              ug.reverbSendGainNode.gain.value = ug.reverbSendLevel !== undefined ? ug.reverbSendLevel : DEFAULT_REVERB_SEND;
              ug.gainNode.connect(ug.reverbSendGainNode);
              ug.reverbSendGainNode.connect(reverbPreDelayNode);
          }
           ensureGroupAudioExtras(ug); 
      });
  }
  
  const existingAutoGroupSettings = new Map();
  identifiedGroups.filter(g => !g.userDefined).forEach((group) => {
      if (group.gainNode && group.nodeIds && group.nodeIds.size > 0) {
          const sortedNodeIds = Array.from(group.nodeIds).sort((a, b) => a - b);
          const canonicalKey = sortedNodeIds.join(",");

          const savedVolume = group.volume !== undefined
              ? group.volume
              : (group.gainNode._originalGainBeforeMute !== undefined
                  ? group.gainNode._originalGainBeforeMute
                  : group.gainNode.gain.value);

          existingAutoGroupSettings.set(canonicalKey, {
              volume: savedVolume,
              pan: group.pannerNode ? group.pannerNode.pan.value : 0,
              soloState: group.soloState,
              muteState: group.muteState,
              delaySend: group.delaySendGainNode ? group.delaySendGainNode.gain.value : DEFAULT_DELAY_SEND,
              reverbSend: group.reverbSendGainNode ? group.reverbSendGainNode.gain.value : DEFAULT_REVERB_SEND,
          });
          try { group.gainNode.disconnect(); } catch (e) {}
          try { group.pannerNode.disconnect(); } catch(e) {}
          try { group.analyserNode.disconnect(); } catch(e) {}
      }
  });

  const newAutoGroups = [];
  const visitedNodesForAutoGrouping = new Set(nodesInUserGroups); 
  let nextAutoGroupId = 0;

  nodes.forEach((node) => {
      if (
          CONSTELLATION_NODE_TYPES.includes(node.type) &&
          !visitedNodesForAutoGrouping.has(node.id)
      ) {
          const constellationNodeIds = findConstellation(node.id);
          const validConstellationMembers = new Set();
          constellationNodeIds.forEach(id => {
              if (!nodesInUserGroups.has(id)) { 
                  validConstellationMembers.add(id);
              }
          });

          if (validConstellationMembers.size > 0) {
              validConstellationMembers.forEach((id) => visitedNodesForAutoGrouping.add(id));
              const newGainNode = audioContext.createGain();
              const newPannerNode = audioContext.createStereoPanner();
              const newAnalyserNode = audioContext.createAnalyser(); 
              newAnalyserNode.fftSize = 256;
              newAnalyserNode.smoothingTimeConstant = 0.7;

              const sortedNewNodeIds = Array.from(validConstellationMembers).sort((a, b) => a - b);
              const newCanonicalKey = sortedNewNodeIds.join(",");
              const savedSettings = existingAutoGroupSettings.get(newCanonicalKey);

              const baseVolume = savedSettings ? savedSettings.volume : 1.0;
              newGainNode.gain.value = savedSettings && savedSettings.muteState ? 0 : baseVolume;
              newGainNode._originalGainBeforeMute = baseVolume;
              newPannerNode.pan.value = savedSettings ? savedSettings.pan : 0;
              
              newGainNode.connect(newPannerNode);
              newPannerNode.connect(newAnalyserNode); 
              newAnalyserNode.connect(masterGain);    
              const autoGroup = {
                  id: `autoGroup_${nextAutoGroupId++}`,
                  nodeIds: validConstellationMembers,
                  gainNode: newGainNode,
                  pannerNode: newPannerNode,
                  analyserNode: newAnalyserNode,
                  userDefined: false,
                  soloState: savedSettings ? savedSettings.soloState : false,
                  muteState: savedSettings ? savedSettings.muteState : false,
                  delaySendGainNode: audioContext.createGain(),
                  reverbSendGainNode: audioContext.createGain(),
                  volume: baseVolume,
                  pan: newPannerNode.pan.value,
                  delaySendLevel: savedSettings ? savedSettings.delaySend : DEFAULT_DELAY_SEND,
                  reverbSendLevel: savedSettings ? savedSettings.reverbSend : DEFAULT_REVERB_SEND
              };
              autoGroup.delaySendGainNode.gain.value = autoGroup.delaySendLevel;
              autoGroup.reverbSendGainNode.gain.value = autoGroup.reverbSendLevel;
              autoGroup.gainNode.connect(autoGroup.delaySendGainNode);
              autoGroup.delaySendGainNode.connect(masterDelaySendGain);
              autoGroup.gainNode.connect(autoGroup.reverbSendGainNode);
              autoGroup.reverbSendGainNode.connect(reverbPreDelayNode);

              newAutoGroups.push(autoGroup);
          }
      }
  });
  
  identifiedGroups = [ ...(userDefinedGroups || []), ...newAutoGroups ];
  window.identifiedGroups = identifiedGroups;
  applySoloMuteToAllGroupsAudio(); 

  nodes.forEach((node) => {
      const isRoutableAudioNode =
          (CONSTELLATION_NODE_TYPES.includes(node.type) ||
              node.type === "nebula" ||
              node.type === PORTAL_NEBULA_TYPE ||
              node.type === PRORB_TYPE) &&
          node.audioNodes;

      if (isRoutableAudioNode) {
        const outputNode = node.audioNodes.gainNode || node.audioNodes.mainGain || node.audioNodes.output || node.audioNodes.mix;
          if (!outputNode) return;

          let destinationNodeForIndividualNode = masterGain; 
          const groupNodeBelongsTo = findGroupContainingNode(node.id);

          if (groupNodeBelongsTo && groupNodeBelongsTo.gainNode) {
              destinationNodeForIndividualNode = groupNodeBelongsTo.gainNode; 
              if (node.audioNodes.delaySendGain) node.audioNodes.delaySendGain.gain.value = 0;
              if (node.audioNodes.reverbSendGain) node.audioNodes.reverbSendGain.gain.value = 0;
          } else if (node.type === "nebula") {
              destinationNodeForIndividualNode = originalNebulaGroupGain || masterGain;
          } else if (node.type === PORTAL_NEBULA_TYPE) {
              destinationNodeForIndividualNode = portalGroupGain || masterGain;
          }
          rerouteAudioForNode(node, destinationNodeForIndividualNode);
      }
  });

  connections.forEach((conn) => {
      if (conn.type === "string_violin" && conn.audioNodes) {
          const outputNode = conn.audioNodes.gainNode;
          if (!outputNode) return;
          const nodeA = findNodeById(conn.nodeAId);
          const nodeB = findNodeById(conn.nodeBId);
          let destinationNodeForConn = masterGain;
          let sharedGroup = null;

          if (nodeA && nodeB) {
              const groupA = findGroupContainingNode(nodeA.id);
              const groupB = findGroupContainingNode(nodeB.id);
              if (groupA && groupA === groupB && groupA.gainNode) {
                  sharedGroup = groupA;
              }
          }
          
          if (sharedGroup) {
              destinationNodeForConn = sharedGroup.gainNode;
              if (conn.audioNodes.delaySendGain) conn.audioNodes.delaySendGain.gain.value = 0;
              if (conn.audioNodes.reverbSendGain) conn.audioNodes.reverbSendGain.gain.value = 0;
          }
          rerouteAudioForNode(conn, destinationNodeForConn);
      }
  });
  updateMixerGUI(); 
}

export function createAudioNodesForNode(node) {
    if (!audioContext) {
        console.warn(
            "AudioContext not ready, cannot create audio nodes for node ID:",
            node.id,
        );
        return null;
    }
    if (
        node.type === TIMELINE_GRID_TYPE ||
        node.type === GRID_SEQUENCER_TYPE ||
        node.type === SPACERADAR_TYPE ||
        node.type === CRANK_RADAR_TYPE ||
        node.type === CANVAS_SEND_ORB_TYPE ||
        node.type === CANVAS_RECEIVE_ORB_TYPE ||
        node.type === CLOCKWORK_ORB_TYPE
    ) {
        return null;
    }
    if (
        ![PRORB_TYPE, "sound", "nebula", PORTAL_NEBULA_TYPE, ALIEN_ORB_TYPE, ALIEN_DRONE_TYPE, ARVO_DRONE_TYPE, FM_DRONE_TYPE, RESONAUTER_TYPE, RADIO_ORB_TYPE, MOTOR_ORB_TYPE, CLOCKWORK_ORB_TYPE].includes(node.type) &&
        !isDrumType(node.type)
    ) {
        return null;
    }

    const params = node.audioParams;
    const now = audioContext.currentTime;
    const startDelay = now + 0.02;
    const pitch = sanitizeFrequency(params.pitch, A4_FREQ);

    try {
        if (node.type === RESONAUTER_TYPE) {
            return createResonauterOrbAudioNodes(node);
        } else if (node.type === PRORB_TYPE) {
          const p = node.audioParams;
          const audioNodes = {
              osc1: audioContext.createOscillator(),
              osc1Gain: audioContext.createGain(),
              osc2: audioContext.createOscillator(),
              osc2Gain: audioContext.createGain(),
              filter: audioContext.createBiquadFilter(),
              ampEnvControl: audioContext.createGain(),
              filterEnvControl: audioContext.createGain(),
              lfo: audioContext.createOscillator(),
              lfoGain: audioContext.createGain(),
              lfo2: audioContext.createOscillator(),
              lfo2Gain: audioContext.createGain(),
              mainGain: audioContext.createGain(),
              reverbSendGain: audioContext.createGain(),
              delaySendGain: audioContext.createGain(),
          };

          audioNodes.osc1.type = p.osc1Waveform;
          audioNodes.osc1.connect(audioNodes.osc1Gain);
          audioNodes.osc1Gain.gain.value = p.osc1Level ?? 1.0;
          audioNodes.osc1Gain.connect(audioNodes.filter);

          audioNodes.osc2.type = p.osc2Waveform;
          audioNodes.osc2.detune.value = p.osc2Detune;
          audioNodes.osc2.connect(audioNodes.osc2Gain);
          audioNodes.osc2Gain.gain.value = p.osc2Enabled ? (p.osc2Level ?? 1.0) : 0;
          audioNodes.osc2Gain.connect(audioNodes.filter);

          audioNodes.filter.type = p.filterType;
          audioNodes.filter.frequency.value = p.filterCutoff;
          audioNodes.filter.Q.value = p.filterResonance;
          audioNodes.filter.connect(audioNodes.ampEnvControl);

          audioNodes.ampEnvControl.gain.value = 0;
          audioNodes.ampEnvControl.connect(audioNodes.mainGain);

          audioNodes.filterEnvControl.gain.value = p.filterEnvAmount;
          audioNodes.filterEnvControl.connect(audioNodes.filter.frequency);
          audioNodes.lfo.type = p.lfoWaveform;
          audioNodes.lfo.frequency.value = p.lfoRate;
          audioNodes.lfoGain.gain.value = p.lfoEnabled ? p.lfoAmount : 0;
          audioNodes.lfo.connect(audioNodes.lfoGain);
          try { audioNodes.lfoGain.disconnect(); } catch(e) {}
          const lfoTarget = p.lfoTarget || 'filter';
          if (lfoTarget === 'amp') {
              audioNodes.lfoGain.connect(audioNodes.mainGain.gain);
          } else if (lfoTarget === 'osc1Freq' && audioNodes.osc1.frequency) {
              audioNodes.lfoGain.connect(audioNodes.osc1.frequency);
          } else if (lfoTarget === 'osc2Freq' && audioNodes.osc2.frequency) {
              audioNodes.lfoGain.connect(audioNodes.osc2.frequency);
          } else {
              audioNodes.lfoGain.connect(audioNodes.filter.frequency);
          }

          audioNodes.lfo2.type = p.lfo2Waveform;
          audioNodes.lfo2.frequency.value = p.lfo2Rate;
          audioNodes.lfo2Gain.gain.value = p.lfo2Enabled ? p.lfo2Amount : 0;
          audioNodes.lfo2.connect(audioNodes.lfo2Gain);
          try { audioNodes.lfo2Gain.disconnect(); } catch(e) {}
          const lfo2Target = p.lfo2Target || 'filter';
          if (lfo2Target === 'amp') {
              audioNodes.lfo2Gain.connect(audioNodes.mainGain.gain);
          } else if (lfo2Target === 'osc1Freq' && audioNodes.osc1.frequency) {
              audioNodes.lfo2Gain.connect(audioNodes.osc1.frequency);
          } else if (lfo2Target === 'osc2Freq' && audioNodes.osc2.frequency) {
              audioNodes.lfo2Gain.connect(audioNodes.osc2.frequency);
          } else {
              audioNodes.lfo2Gain.connect(audioNodes.filter.frequency);
          }
          audioNodes.mainGain.gain.value = 1.0;
          audioNodes.reverbSendGain.gain.value = p.reverbSend;
          audioNodes.delaySendGain.gain.value = p.delaySend;
          audioNodes.mainGain.connect(audioNodes.reverbSendGain);
          audioNodes.mainGain.connect(audioNodes.delaySendGain);

          if (isReverbReady && reverbPreDelayNode) {
              audioNodes.reverbSendGain.connect(reverbPreDelayNode);
          }
          if (isDelayReady && masterDelaySendGain) {
              audioNodes.delaySendGain.connect(masterDelaySendGain);
          }

          if (mistEffectInput) {
              audioNodes.mistSendGain = audioContext.createGain();
              audioNodes.mistSendGain.gain.value = 0;
              audioNodes.mainGain.connect(audioNodes.mistSendGain);
              audioNodes.mistSendGain.connect(mistEffectInput);
          }
          if (crushEffectInput) {
              audioNodes.crushSendGain = audioContext.createGain();
              audioNodes.crushSendGain.gain.value = 0;
              audioNodes.mainGain.connect(audioNodes.crushSendGain);
              audioNodes.crushSendGain.connect(crushEffectInput);
          }

          try { audioNodes.osc1.start(now); } catch(e){}
          try { audioNodes.osc2.start(now); } catch(e){}
          try { audioNodes.lfo.start(now); } catch(e){}
          try { audioNodes.lfo2.start(now); } catch(e){}

          return audioNodes;
        } else if (node.type === "sound") {
            if (node.audioParams && node.audioParams.engine === 'tonefm') {
                return createToneFmSynthOrb(node);
            } else if (node.audioParams && node.audioParams.engine === 'tone') {
                return createAnalogOrb(node);
            }
            const audioNodes = {
                gainNode: audioContext.createGain(),
                lowPassFilter: audioContext.createBiquadFilter(),
                reverbSendGain: null,
                delaySendGain: null,
                volLfo: audioContext.createOscillator(),
                volLfoGain: audioContext.createGain(),
                oscillator1: null,
                osc1Gain: audioContext.createGain(),
                modulatorOsc1: null,
                modulatorGain1: null,
                oscillator2: null,
                osc2Gain: null,
                orbitoneOscillators: [],
                orbitoneOsc2s: [],
                orbitoneOsc1Gains: [],
                orbitoneOsc2Gains: [],
                orbitoneIndividualGains: [],
                orbitoneModulatorOscs: [],
                orbitoneModulatorGains: [],
            };

            audioNodes.gainNode.gain.setValueAtTime(0, now);
            audioNodes.lowPassFilter.type = params.filterType || "lowpass";
            audioNodes.lowPassFilter.Q.value = params.filterResonance || 1.2;
            audioNodes.lowPassFilter.frequency.value =
                params.lowPassFreq || MAX_FILTER_FREQ;

            if (params.waveform && !params.waveform.startsWith("sampler_")) {
                audioNodes.oscillator1 = audioContext.createOscillator();
                const osc1BaseWaveform =
                    params.osc1Type ||
                    params.baseSoundType ||
                    params.carrierWaveform ||
                    params.actualOscillatorType ||
                    params.waveform ||
                    "sine";
                const validOscTypes = ["sine", "square", "sawtooth", "triangle"];
                audioNodes.oscillator1.type = validOscTypes.includes(osc1BaseWaveform) ?
                    osc1BaseWaveform :
                    osc1BaseWaveform === "pulse" ?
                    "square" :
                    "sine";
                audioNodes.oscillator1.frequency.setValueAtTime(pitch, now);
                audioNodes.oscillator1.connect(audioNodes.osc1Gain);
            }
            audioNodes.osc1Gain.gain.value = 1.0;
            audioNodes.osc1Gain.connect(audioNodes.lowPassFilter);
            audioNodes.lowPassFilter.connect(audioNodes.gainNode);

            if (isReverbReady && reverbPreDelayNode) {
                audioNodes.reverbSendGain = audioContext.createGain();
                audioNodes.reverbSendGain.gain.value = params.reverbSend || 0;
                audioNodes.gainNode.connect(audioNodes.reverbSendGain);
                audioNodes.reverbSendGain.connect(reverbPreDelayNode);
            }
            if (isDelayReady && masterDelaySendGain) {
                audioNodes.delaySendGain = audioContext.createGain();
                audioNodes.delaySendGain.gain.value = params.delaySend || 0;
                audioNodes.gainNode.connect(audioNodes.delaySendGain);
                audioNodes.delaySendGain.connect(masterDelaySendGain);
            }

            audioNodes.volLfo.type = params.lfo1Type || "sine";
            audioNodes.volLfo.frequency.setValueAtTime(params.volLfoRate || 0.2, now);
            audioNodes.volLfoGain.gain.value = fluctuatingGroupNodeIDs.has(node.id) ?
                parseFloat(groupFluctuateAmount.value) :
                params.volLfoDepth || 0;
            audioNodes.volLfo.connect(audioNodes.volLfoGain);
            audioNodes.volLfoGain.connect(audioNodes.gainNode.gain);
            try {
                audioNodes.volLfo.start(startDelay);
            } catch (e) {}

            if (audioNodes.oscillator1) {
                try {
                    audioNodes.oscillator1.start(startDelay);
                } catch (e) {}
                if (params.carrierWaveform && params.modulatorWaveform) {
                    audioNodes.modulatorOsc1 = audioContext.createOscillator();
                    audioNodes.modulatorOsc1.type = params.modulatorWaveform;
                    const modRatio = params.modulatorRatio || 1.0;
                    audioNodes.modulatorOsc1.frequency.setValueAtTime(
                        pitch * modRatio,
                        now,
                    );
                    audioNodes.modulatorGain1 = audioContext.createGain();
                    audioNodes.modulatorGain1.gain.setValueAtTime(0, now);
                    audioNodes.modulatorOsc1.connect(audioNodes.modulatorGain1);
                    audioNodes.modulatorGain1.connect(audioNodes.oscillator1.frequency);
                    try {
                        audioNodes.modulatorOsc1.start(startDelay);
                    } catch (e) {}
                }
                if (
                    !params.orbitonesEnabled &&
                    params.osc2Type &&
                    !params.carrierWaveform
                ) {
                    audioNodes.oscillator2 = audioContext.createOscillator();
                    const validOscTypes = ["sine", "square", "sawtooth", "triangle"];
                    audioNodes.oscillator2.type = validOscTypes.includes(params.osc2Type) ?
                        params.osc2Type :
                        params.osc2Type === "pulse" ?
                        "square" :
                        "sine";
                    if (params.osc2Detune)
                        audioNodes.oscillator2.detune.setValueAtTime(
                            params.osc2Detune,
                            now,
                        );
                    const osc2BaseFreq =
                        pitch * Math.pow(2, params.osc2Octave || 0);
                    audioNodes.oscillator2.frequency.setValueAtTime(osc2BaseFreq, now);
                    audioNodes.osc2Gain = audioContext.createGain();
                    audioNodes.osc2Gain.gain.value = params.osc2Level ?? 0.7;
                    audioNodes.oscillator2.connect(audioNodes.osc2Gain);
                    audioNodes.osc2Gain.connect(audioNodes.lowPassFilter);
                    try {
                        audioNodes.oscillator2.start(startDelay);
                    } catch (e) {}
                }
            }

            if (
                params.orbitonesEnabled &&
                params.orbitoneCount > 0 &&
                params.orbitoneIntervals &&
                !(params.waveform && params.waveform.startsWith("sampler_"))
            ) {
                    const allFrequenciesForCreation = getOrbitoneFrequencies(
                    params.scaleIndex,
                    params.orbitoneCount,
                    params.orbitoneIntervals,
                    0,
                    currentScale,
                    pitch,
                );
                const actualOrbitoneFrequencies = allFrequenciesForCreation.slice(1);
                const osc1BaseWaveformForOrbitones =
                    params.osc1Type || params.waveform || "sine";
                const validOscTypesForOrbitones = [
                    "sine",
                    "square",
                    "sawtooth",
                    "triangle",
                ];
                const finalOrbitoneWaveform = validOscTypesForOrbitones.includes(
                        osc1BaseWaveformForOrbitones,
                    ) ?
                    osc1BaseWaveformForOrbitones :
                    "sine";

                for (let i = 0; i < actualOrbitoneFrequencies.length; i++) {
                    const freq = actualOrbitoneFrequencies[i];
                    if (isNaN(freq) || freq <= 0) continue;
                    const orbitOsc = audioContext.createOscillator();
                    orbitOsc.type = finalOrbitoneWaveform;
                    orbitOsc.frequency.setValueAtTime(freq, now);
                    const g1 = audioContext.createGain();
                    g1.gain.setValueAtTime(params.osc1Level ?? 1.0, now);
                    orbitOsc.connect(g1);
                    const orbitOsc2 = audioContext.createOscillator();
                    const validOscTypes2 = ["sine", "square", "sawtooth", "triangle"];
                    orbitOsc2.type = validOscTypes2.includes(params.osc2Type)
                        ? params.osc2Type
                        : params.osc2Type === "pulse" ? "square" : "sine";
                    if (params.osc2Detune)
                        orbitOsc2.detune.setValueAtTime(params.osc2Detune, now);
                    orbitOsc2.frequency.setValueAtTime(
                        freq * Math.pow(2, params.osc2Octave || 0),
                        now
                    );
                    const g2 = audioContext.createGain();
                    g2.gain.setValueAtTime(
                        params.osc2Enabled ? params.osc2Level ?? 1.0 : 0,
                        now
                    );
                    orbitOsc2.connect(g2);
                    const orbitIndividualGainNode = audioContext.createGain();
                    orbitIndividualGainNode.gain.setValueAtTime(0, now);
                    g1.connect(orbitIndividualGainNode);
                    g2.connect(orbitIndividualGainNode);
                    orbitIndividualGainNode.connect(audioNodes.lowPassFilter);
                    try {
                        orbitOsc.start(startDelay);
                    } catch (e) {}
                    try {
                        orbitOsc2.start(startDelay);
                    } catch (e) {}
                    audioNodes.orbitoneOscillators.push(orbitOsc);
                    audioNodes.orbitoneOsc2s.push(orbitOsc2);
                    audioNodes.orbitoneOsc1Gains.push(g1);
                    audioNodes.orbitoneOsc2Gains.push(g2);
                    audioNodes.orbitoneIndividualGains.push(orbitIndividualGainNode);
                    if (
                        params.carrierWaveform &&
                        params.modulatorWaveform &&
                        audioNodes.modulatorGain1
                    ) {
                        const modOsc = audioContext.createOscillator();
                        modOsc.type = params.modulatorWaveform;
                        const modRatio = params.modulatorRatio || 1.0;
                        modOsc.frequency.setValueAtTime(freq * modRatio, now);
                        const modGain = audioContext.createGain();
                        modGain.gain.setValueAtTime(0, now);
                        modOsc.connect(modGain);
                        modGain.connect(orbitOsc.frequency);
                        try {
                            modOsc.start(startDelay);
                        } catch (e) {}
                        audioNodes.orbitoneModulatorOscs.push(modOsc);
                audioNodes.orbitoneModulatorGains.push(modGain);
            }
        }
            }
            if (mistEffectInput) {
                audioNodes.mistSendGain = audioContext.createGain();
                audioNodes.mistSendGain.gain.value = 0;
                audioNodes.gainNode.connect(audioNodes.mistSendGain);
                audioNodes.mistSendGain.connect(mistEffectInput);
            }
            if (crushEffectInput) {
                audioNodes.crushSendGain = audioContext.createGain();
                audioNodes.crushSendGain.gain.value = 0;
                audioNodes.gainNode.connect(audioNodes.crushSendGain);
                audioNodes.crushSendGain.connect(crushEffectInput);
            }
            return audioNodes;
        } else if (node.type === ALIEN_ORB_TYPE) {
            const audioNodes = createAlienSynth(
                node.audioParams.engine || 0,
                node.audioParams.pitch,
                false,
            );
            audioNodes.mix.gain.setValueAtTime(0, now);
            updateAlienNodesParams(
                audioNodes,
                node.audioParams.engine || 0,
                node.audioParams.pitch,
                0,
                true,
            );
            audioNodes.orbitoneSynths = [];
            if (
                node.audioParams.orbitonesEnabled &&
                node.audioParams.orbitoneCount > 0 &&
                node.audioParams.orbitoneIntervals
            ) {
                const orbitFreqs = getOrbitoneFrequencies(
                    node.audioParams.scaleIndex,
                    node.audioParams.orbitoneCount,
                    node.audioParams.orbitoneIntervals,
                    0,
                    currentScale,
                    node.audioParams.pitch,
                ).slice(1);
                orbitFreqs.forEach((freq) => {
                    const oSynth = createAlienSynth(
                        node.audioParams.engine || 0,
                        freq,
                        false,
                    );
                    oSynth.mix.gain.setValueAtTime(0, now);
                    oSynth.mix.connect(audioNodes.mix);
                    updateAlienNodesParams(
                        oSynth,
                        node.audioParams.engine || 0,
                        freq,
                        0,
                        true,
                    );
                    if (mistEffectInput) {
                        oSynth.mistSendGain = audioContext.createGain();
                        oSynth.mistSendGain.gain.value = 0;
                        oSynth.mix.connect(oSynth.mistSendGain);
                        oSynth.mistSendGain.connect(mistEffectInput);
                    }
                    if (crushEffectInput) {
                        oSynth.crushSendGain = audioContext.createGain();
                        oSynth.crushSendGain.gain.value = 0;
                        oSynth.mix.connect(oSynth.crushSendGain);
                        oSynth.crushSendGain.connect(crushEffectInput);
                    }
                    audioNodes.orbitoneSynths.push(oSynth);
                });
            }
            if (mistEffectInput) {
                audioNodes.mistSendGain = audioContext.createGain();
                audioNodes.mistSendGain.gain.value = 0;
                audioNodes.mix.connect(audioNodes.mistSendGain);
                audioNodes.mistSendGain.connect(mistEffectInput);
            }
            if (crushEffectInput) {
                audioNodes.crushSendGain = audioContext.createGain();
                audioNodes.crushSendGain.gain.value = 0;
                audioNodes.mix.connect(audioNodes.crushSendGain);
                audioNodes.crushSendGain.connect(crushEffectInput);
            }
            return audioNodes;
        } else if (node.type === ALIEN_DRONE_TYPE) {
            const audioNodes = createAlienSynth(
                node.audioParams.engine || 0,
                node.audioParams.pitch,
                false,
            );
            updateAlienNodesParams(
                audioNodes,
                node.audioParams.engine || 0,
                node.audioParams.pitch,
                0,
                true,
            );
            audioNodes.orbitoneSynths = [];
            if (
                node.audioParams.orbitonesEnabled &&
                node.audioParams.orbitoneCount > 0 &&
                node.audioParams.orbitoneIntervals
            ) {
                const orbitFreqs = getOrbitoneFrequencies(
                    node.audioParams.scaleIndex,
                    node.audioParams.orbitoneCount,
                    node.audioParams.orbitoneIntervals,
                    0,
                    currentScale,
                    node.audioParams.pitch,
                ).slice(1);
                orbitFreqs.forEach((freq) => {
                    const oSynth = createAlienSynth(
                        node.audioParams.engine || 0,
                        freq,
                        false,
                    );
                    updateAlienNodesParams(
                        oSynth,
                        node.audioParams.engine || 0,
                        freq,
                        0,
                        true,
                    );
                    oSynth.mix.connect(audioNodes.mix);
                    const targetAmp = oSynth.baseGain || 1;
                    oSynth.mix.gain.setValueAtTime(targetAmp, now);
                    if (mistEffectInput) {
                        oSynth.mistSendGain = audioContext.createGain();
                        oSynth.mistSendGain.gain.value = 0;
                        oSynth.mix.connect(oSynth.mistSendGain);
                        oSynth.mistSendGain.connect(mistEffectInput);
                    }
                    if (crushEffectInput) {
                        oSynth.crushSendGain = audioContext.createGain();
                        oSynth.crushSendGain.gain.value = 0;
                        oSynth.mix.connect(oSynth.crushSendGain);
                        oSynth.crushSendGain.connect(crushEffectInput);
                    }
                    audioNodes.orbitoneSynths.push(oSynth);
                });
            }
            const targetAmp = audioNodes.baseGain || 1;
            audioNodes.mix.gain.setValueAtTime(targetAmp, now);
            if (mistEffectInput) {
                audioNodes.mistSendGain = audioContext.createGain();
                audioNodes.mistSendGain.gain.value = 0;
                audioNodes.mix.connect(audioNodes.mistSendGain);
                audioNodes.mistSendGain.connect(mistEffectInput);
            }
            if (crushEffectInput) {
                audioNodes.crushSendGain = audioContext.createGain();
                audioNodes.crushSendGain.gain.value = 0;
                audioNodes.mix.connect(audioNodes.crushSendGain);
                audioNodes.crushSendGain.connect(crushEffectInput);
            }
            return audioNodes;
        } else if (node.type === ARVO_DRONE_TYPE) {
            const audioNodes = createArvoDroneAudioNodes(node);
            return audioNodes;
        } else if (node.type === FM_DRONE_TYPE) {
            const audioNodes = createFmDroneAudioNodes(node);
            return audioNodes;
        } else if (node.type === RADIO_ORB_TYPE) {
            const audioNodes = { gainNode: audioContext.createGain() };
            audioNodes.gainNode.gain.value = 1.0;
            audioNodes.gainNode.connect(masterGain);
            return audioNodes;
        } else if (node.type === "nebula") {
            const audioNodes = {};
            audioNodes.gainNode = audioContext.createGain();
            audioNodes.gainNode.gain.value = 0;
            audioNodes.filterNode = audioContext.createBiquadFilter();
            audioNodes.filterNode.type = params.filterType || "lowpass";
            audioNodes.filterNode.Q.value = params.filterResonance || NEBULA_FILTER_Q;
            const baseFreq = pitch;
            audioNodes.filterLfo = audioContext.createOscillator();
            audioNodes.filterLfo.type = "sine";
            const spinRate = Math.abs(node.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) *
                NEBULA_LFO_SPIN_MULTIPLIER;
            audioNodes.filterLfo.frequency.setValueAtTime(
                NEBULA_FILTER_LFO_RATE + spinRate,
                now,
            );
            audioNodes.filterLfoGain = audioContext.createGain();
            audioNodes.filterLfoGain.gain.setValueAtTime(
                baseFreq *
                NEBULA_FILTER_LFO_DEPTH_FACTOR *
                (params.lfoDepthFactor || 1),
                now,
            );
            audioNodes.filterLfo.connect(audioNodes.filterLfoGain);
            audioNodes.filterLfoGain.connect(audioNodes.filterNode.frequency);
            audioNodes.volLfo = audioContext.createOscillator();
            audioNodes.volLfo.type = "sine";
            audioNodes.volLfo.frequency.setValueAtTime(NEBULA_VOL_LFO_RATE, now);
            audioNodes.volLfoGain = audioContext.createGain();
            audioNodes.volLfoGain.gain.value = NEBULA_VOL_LFO_DEPTH;
            audioNodes.volLfo.connect(audioNodes.volLfoGain);
            audioNodes.volLfoGain.connect(audioNodes.gainNode.gain);
            audioNodes.oscillators = [];
            const baseWaveformForNebula =
                params.osc1Type || params.waveform || "sawtooth";
            const validOscTypes = ["sine", "square", "sawtooth", "triangle"];
            let waveformType = validOscTypes.includes(baseWaveformForNebula) ?
                baseWaveformForNebula :
                "sawtooth";
            if (
                baseWaveformForNebula === "fmBell" ||
                baseWaveformForNebula === "fmXylo"
            )
                waveformType = "sine";
            NEBULA_OSC_INTERVALS.forEach((interval, i) => {
                const osc = audioContext.createOscillator();
                const freq = baseFreq * Math.pow(2, interval / 12);
                osc.frequency.setValueAtTime(freq, now);
                osc.detune.setValueAtTime(
                    (i % 2 === 0 ? 1 : -1) *
                    (params.detune || NEBULA_OSC_DETUNE) *
                    (i + 1),
                    now,
                );
                osc.type = waveformType;
                osc.connect(audioNodes.filterNode);
                audioNodes.oscillators.push(osc);
            });
            audioNodes.filterNode.connect(audioNodes.gainNode);
            if (isReverbReady && reverbPreDelayNode) {
                audioNodes.reverbSendGain = audioContext.createGain();
                audioNodes.reverbSendGain.gain.value = params.reverbSend || 0;
                audioNodes.gainNode.connect(audioNodes.reverbSendGain);
                audioNodes.reverbSendGain.connect(reverbPreDelayNode);
            }
            if (isDelayReady && masterDelaySendGain) {
                audioNodes.delaySendGain = audioContext.createGain();
                audioNodes.delaySendGain.gain.value = params.delaySend || 0;
                audioNodes.gainNode.connect(audioNodes.delaySendGain);
                audioNodes.delaySendGain.connect(masterDelaySendGain);
            }
            const initialVol = Math.min(
                NEBULA_MAX_VOL,
                node.size * NEBULA_VOL_SCALING,
            );
            const initialFilterFreq =
                params.filterCutoff ||
                baseFreq * 2 +
                ((node.size - MIN_NODE_SIZE) / (MAX_NODE_SIZE - MIN_NODE_SIZE || 1)) *
                baseFreq *
                (params.filterFreqFactor || 12);
            audioNodes.filterNode.frequency.setValueAtTime(initialFilterFreq, now);
            audioNodes.gainNode.gain.linearRampToValueAtTime(initialVol, now + 0.5);
            try {
                audioNodes.filterLfo.start(startDelay);
            } catch (e) {}
            try {
                audioNodes.volLfo.start(startDelay);
            } catch (e) {}
            audioNodes.oscillators.forEach((osc) => {
                try {
                    osc.start(startDelay);
                } catch (e) {}
            });
            if (originalNebulaGroupGain) {
                audioNodes.gainNode.connect(originalNebulaGroupGain);
            } else {
                audioNodes.gainNode.connect(masterGain);
            }
            if (mistEffectInput) {
                audioNodes.mistSendGain = audioContext.createGain();
                audioNodes.mistSendGain.gain.value = 0;
                audioNodes.gainNode.connect(audioNodes.mistSendGain);
                audioNodes.mistSendGain.connect(mistEffectInput);
            }
            return audioNodes;
        } else if (node.type === PORTAL_NEBULA_TYPE) {
            const audioNodes = {};
            const defaults = PORTAL_NEBULA_DEFAULTS;
            audioNodes.mainGain = audioContext.createGain();
            audioNodes.mainGain.gain.setValueAtTime(0, now);
            audioNodes.mainGain.gain.linearRampToValueAtTime(
                params.volume,
                now + 1.0,
            );
            audioNodes.droneOsc = audioContext.createOscillator();
            audioNodes.droneOsc.type = params.actualOscillatorType || "triangle";
            audioNodes.droneOsc.frequency.setValueAtTime(pitch, now);
            audioNodes.droneFreqLfo = audioContext.createOscillator();
            audioNodes.droneFreqLfo.type = "sine";
            audioNodes.droneFreqLfo.frequency.setValueAtTime(
                0.05 + Math.random() * 0.05,
                now,
            );
            audioNodes.droneFreqLfoGain = audioContext.createGain();
            audioNodes.droneFreqLfoGain.gain.setValueAtTime(
                0.5 + Math.random() * 0.5,
                now,
            );
            audioNodes.droneFreqLfo.connect(audioNodes.droneFreqLfoGain);
            audioNodes.droneFreqLfoGain.connect(audioNodes.droneOsc.frequency);
            audioNodes.droneOsc.connect(audioNodes.mainGain);
            audioNodes.harmonics = [];
            audioNodes.harmonicGain = audioContext.createGain();
            audioNodes.harmonicGain.gain.setValueAtTime(
                defaults.harmonicBaseGain,
                now,
            );
            audioNodes.shimmerLfo = audioContext.createOscillator();
            audioNodes.shimmerLfo.type = "sine";
            audioNodes.shimmerLfo.frequency.setValueAtTime(defaults.shimmerRate, now);
            audioNodes.shimmerLfoGain = audioContext.createGain();
            audioNodes.shimmerLfoGain.gain.setValueAtTime(defaults.shimmerDepth, now);
            audioNodes.shimmerLfo.connect(audioNodes.shimmerLfoGain);
            audioNodes.shimmerLfoGain.connect(audioNodes.harmonicGain.gain);
            for (let i = 0; i < defaults.numHarmonics; i++) {
                const harmonicOsc = audioContext.createOscillator();
                harmonicOsc.type = "sine";
                const freqMultiplier = Math.pow(
                    2,
                    (i + 1) * defaults.harmonicSpread * 0.5 + Math.random() * 0.1,
                );
                harmonicOsc.frequency.setValueAtTime(
                    pitch * freqMultiplier,
                    now,
                );
                harmonicOsc.detune.setValueAtTime((Math.random() - 0.5) * 15, now);
                harmonicOsc.connect(audioNodes.harmonicGain);
                audioNodes.harmonics.push(harmonicOsc);
            }
            audioNodes.harmonicGain.connect(audioNodes.mainGain);
            if (isReverbReady && reverbPreDelayNode) {
                audioNodes.reverbSendGain = audioContext.createGain();
                audioNodes.reverbSendGain.gain.value = params.reverbSend || 0;
                audioNodes.mainGain.connect(audioNodes.reverbSendGain);
                audioNodes.reverbSendGain.connect(reverbPreDelayNode);
            }
            if (isDelayReady && masterDelaySendGain) {
                audioNodes.delaySendGain = audioContext.createGain();
                audioNodes.delaySendGain.gain.value = params.delaySend || 0;
                audioNodes.mainGain.connect(audioNodes.delaySendGain);
                audioNodes.delaySendGain.connect(masterDelaySendGain);
            }
            try {
                audioNodes.droneOsc.start(startDelay);
            } catch (e) {}
            try {
                audioNodes.droneFreqLfo.start(startDelay);
            } catch (e) {}
            try {
                audioNodes.shimmerLfo.start(startDelay);
            } catch (e) {}
            audioNodes.harmonics.forEach((osc) => {
                try {
                    osc.start(startDelay);
                } catch (e) {}
            });
            if (portalGroupGain) {
                audioNodes.mainGain.connect(portalGroupGain);
            } else {
                audioNodes.mainGain.connect(masterGain);
            }
            if (mistEffectInput) {
                audioNodes.mistSendGain = audioContext.createGain();
                audioNodes.mistSendGain.gain.value = 0;
                audioNodes.mainGain.connect(audioNodes.mistSendGain);
                audioNodes.mistSendGain.connect(mistEffectInput);
            }
            return audioNodes;
        } else if (isDrumType(node.type)) {
            const audioNodes = {};
            audioNodes.mainGain = audioContext.createGain();
            audioNodes.mainGain.gain.value = params.volume || 1.0;
            if (isReverbReady && reverbPreDelayNode) {
                audioNodes.reverbSendGain = audioContext.createGain();
                audioNodes.reverbSendGain.gain.value =
                    params.reverbSend ?? DEFAULT_REVERB_SEND;
                audioNodes.mainGain.connect(audioNodes.reverbSendGain);
                audioNodes.reverbSendGain.connect(reverbPreDelayNode);
            }
            if (isDelayReady && masterDelaySendGain) {
                audioNodes.delaySendGain = audioContext.createGain();
                audioNodes.delaySendGain.gain.value =
                    params.delaySend ?? DEFAULT_DELAY_SEND;
                audioNodes.mainGain.connect(audioNodes.delaySendGain);
                audioNodes.delaySendGain.connect(masterDelaySendGain);
            }
            if (mistEffectInput) {
                audioNodes.mistSendGain = audioContext.createGain();
                audioNodes.mistSendGain.gain.value = 0;
                audioNodes.mainGain.connect(audioNodes.mistSendGain);
                audioNodes.mistSendGain.connect(mistEffectInput);
            }
            if (crushEffectInput) {
                audioNodes.crushSendGain = audioContext.createGain();
                audioNodes.crushSendGain.gain.value = 0;
                audioNodes.mainGain.connect(audioNodes.crushSendGain);
                audioNodes.crushSendGain.connect(crushEffectInput);
            }
            audioNodes.mainGain.connect(masterGain);
            return audioNodes;
        }
    } catch (e) {
        console.error(
            "Error creating audio nodes for node type:",
            node.type,
            "ID:",
            node.id,
            e,
        );
        return null;
    }
    return null;
}


function initializeGlobalEffectSliders() {
    if (!isAudioReady || !audioContext) return;

    if (reverbIRSelect) {
        populateReverbIRSelect();
        reverbIRSelect.addEventListener("change", (e) => {
            updateReverbIR(e.target.value);
        });
    }

    if (reverbWetSlider && reverbWetValue && reverbWetGain) {
        reverbWetSlider.value = reverbWetGain.gain.value;
        reverbWetValue.textContent = parseFloat(reverbWetSlider.value).toFixed(2);
        reverbWetSlider.addEventListener("input", (e) => {
            reverbWetGain.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            reverbWetValue.textContent = parseFloat(e.target.value).toFixed(2);
        });
        reverbWetSlider.addEventListener("change", saveState);
    }

    if (reverbPreDelaySlider && reverbPreDelayValue && reverbPreDelayNode) {
        reverbPreDelaySlider.value = reverbPreDelayNode.delayTime.value;
        reverbPreDelayValue.textContent = parseFloat(reverbPreDelaySlider.value).toFixed(3) + "s";
        reverbPreDelaySlider.addEventListener("input", (e) => {
            reverbPreDelayNode.delayTime.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            reverbPreDelayValue.textContent = parseFloat(e.target.value).toFixed(3) + "s";
        });
        reverbPreDelaySlider.addEventListener("change", saveState);
    }

    if (reverbDampingSlider && reverbDampingValue && reverbLowPass) {
        reverbDampingSlider.value = reverbLowPass.frequency.value;
        reverbDampingValue.textContent = parseFloat(reverbDampingSlider.value).toFixed(0) + "Hz";
        reverbDampingSlider.addEventListener("input", (e) => {
            reverbLowPass.frequency.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            reverbDampingValue.textContent = parseFloat(e.target.value).toFixed(0) + "Hz";
        });
        reverbDampingSlider.addEventListener("change", saveState);
    }

    if (reverbLowCutSlider && reverbLowCutValue && reverbHighPass) {
        reverbLowCutSlider.value = reverbHighPass.frequency.value;
        reverbLowCutValue.textContent = parseFloat(reverbLowCutSlider.value).toFixed(0) + "Hz";
        reverbLowCutSlider.addEventListener("input", (e) => {
            reverbHighPass.frequency.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            reverbLowCutValue.textContent = parseFloat(e.target.value).toFixed(0) + "Hz";
        });
        reverbLowCutSlider.addEventListener("change", saveState);
    }

    if (delaySendSlider && delaySendValue && masterDelaySendGain) {
        delaySendSlider.value = masterDelaySendGain.gain.value;
        delaySendValue.textContent = parseFloat(delaySendSlider.value).toFixed(2);
        delaySendSlider.addEventListener("input", (e) => {
            masterDelaySendGain.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            delaySendValue.textContent = parseFloat(e.target.value).toFixed(2);
        });
        delaySendSlider.addEventListener("change", saveState);
    }

    if (delayTimeSlider && delayTimeValue && delayNode) {
        delayTimeSlider.value = delayNode.delayTime.value;
        delayTimeValue.textContent = parseFloat(delayTimeSlider.value).toFixed(2) + "s";
        delayTimeSlider.addEventListener("input", (e) => {
            delayNode.delayTime.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            delayTimeValue.textContent = parseFloat(e.target.value).toFixed(2) + "s";
        });
        delayTimeSlider.addEventListener("change", saveState);
    }

    if (delayFeedbackSlider && delayFeedbackValue && delayFeedbackGain) {
        delayFeedbackSlider.value = delayFeedbackGain.gain.value;
        delayFeedbackValue.textContent = parseFloat(delayFeedbackSlider.value).toFixed(2);
        delayFeedbackSlider.addEventListener("input", (e) => {
            delayFeedbackGain.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            delayFeedbackValue.textContent = parseFloat(e.target.value).toFixed(2);
        });
        delayFeedbackSlider.addEventListener("change", saveState);
    }

    if (perfResoSlider && perfResoValue && perfResoGain) {
        perfResoSlider.value = perfResoGain.gain.value;
        perfResoValue.textContent = parseFloat(perfResoSlider.value).toFixed(2);
        perfResoSlider.addEventListener("input", (e) => {
            perfResoGain.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            perfResoValue.textContent = parseFloat(e.target.value).toFixed(2);
        });
        perfResoSlider.addEventListener("change", saveState);
    }
    if (perfResoDelaySlider && perfResoDelay && perfResoDelayValue) {
        perfResoDelaySlider.value = perfResoDelay.delayTime.value;
        perfResoDelayValue.textContent = parseFloat(perfResoDelaySlider.value).toFixed(3) + "s";
        perfResoDelaySlider.addEventListener("input", (e) => {
            perfResoDelay.delayTime.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            perfResoDelayValue.textContent = parseFloat(e.target.value).toFixed(3) + "s";
        });
        perfResoDelaySlider.addEventListener("change", saveState);
    }
    if (perfResoFeedbackSlider && perfResoFeedback && perfResoFeedbackValue) {
        perfResoFeedbackSlider.value = perfResoFeedback.gain.value;
        perfResoFeedbackValue.textContent = parseFloat(perfResoFeedbackSlider.value).toFixed(2);
        perfResoFeedbackSlider.addEventListener("input", (e) => {
            perfResoFeedback.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            perfResoFeedbackValue.textContent = parseFloat(e.target.value).toFixed(2);
        });
        perfResoFeedbackSlider.addEventListener("change", saveState);
    }
    if (perfResoFreqSlider && perfResoFilter && perfResoFreqValue) {
        perfResoFreqSlider.value = perfResoFilter.frequency.value;
        perfResoFreqValue.textContent = Math.round(perfResoFreqSlider.value) + "Hz";
        perfResoFreqSlider.addEventListener("input", (e) => {
            perfResoFilter.frequency.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            perfResoFreqValue.textContent = Math.round(e.target.value) + "Hz";
        });
        perfResoFreqSlider.addEventListener("change", saveState);
    }
    if (perfResoQSlider && perfResoFilter && perfResoQValue) {
        perfResoQSlider.value = perfResoFilter.Q.value;
        perfResoQValue.textContent = parseFloat(perfResoQSlider.value).toFixed(1);
        perfResoQSlider.addEventListener("input", (e) => {
            perfResoFilter.Q.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
            perfResoQValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
        perfResoQSlider.addEventListener("change", saveState);
    }

    if (perfReverbSlider && perfReverbValue && perfReverbWetGain) {
        perfReverbSlider.value = perfReverbWetGain.gain.value;
        perfReverbValue.textContent = parseFloat(perfReverbSlider.value).toFixed(2);
        perfReverbSlider.addEventListener("input", (e) => {
            const v = clamp(parseFloat(e.target.value), 0, 1);
            perfReverbWetGain.gain.setTargetAtTime(v, audioContext.currentTime, 0.01);
            perfReverbValue.textContent = v.toFixed(2);
        });
        perfReverbSlider.addEventListener("change", saveState);
    }
    if (perfReverbSizeSlider && perfReverbSizeValue && perfReverbDelayNodes.length) {
        perfReverbSizeSlider.value = perfReverbSize;
        perfReverbSizeValue.textContent = parseFloat(perfReverbSizeSlider.value).toFixed(2);
        perfReverbSizeSlider.addEventListener("input", (e) => {
            perfReverbSize = clamp(parseFloat(e.target.value), 0.5, 2);
            perfReverbDelayNodes.forEach((d, idx) => {
                d.delayTime.setTargetAtTime(PERF_REVERB_BASE_TIMES[idx] * perfReverbSize, audioContext.currentTime, 0.01);
            });
            perfReverbSizeValue.textContent = perfReverbSize.toFixed(2);
        });
        perfReverbSizeSlider.addEventListener("change", saveState);
    }
    if (perfReverbDecaySlider && perfReverbDecayValue && perfReverbFeedbackGains.length) {
        perfReverbDecaySlider.value = perfReverbFeedbackGains[0].gain.value;
        perfReverbDecayValue.textContent = parseFloat(perfReverbDecaySlider.value).toFixed(2);
        perfReverbDecaySlider.addEventListener("input", (e) => {
            const v = clamp(parseFloat(e.target.value), 0.1, 0.99);
            perfReverbFeedbackGains.forEach((g) => g.gain.setTargetAtTime(v, audioContext.currentTime, 0.01));
            perfReverbDecayValue.textContent = v.toFixed(2);
        });
        perfReverbDecaySlider.addEventListener("change", saveState);
    }
    if (perfReverbDampSlider && perfReverbDampValue && perfReverbLowPass) {
        perfReverbDampSlider.value = perfReverbLowPass.frequency.value;
        perfReverbDampValue.textContent = Math.round(perfReverbDampSlider.value) + "Hz";
        perfReverbDampSlider.addEventListener("input", (e) => {
            const v = clamp(parseFloat(e.target.value), 2000, 12000);
            perfReverbLowPass.frequency.setTargetAtTime(v, audioContext.currentTime, 0.01);
            perfReverbDampValue.textContent = Math.round(v) + "Hz";
        });
        perfReverbDampSlider.addEventListener("change", saveState);
    }



    if (perfResoToggle && perfResoGain) {
        perfResoToggle.checked = perfResoEnabled;
        perfResoToggle.addEventListener("change", (e) => {
            perfResoEnabled = e.target.checked;
            const target = perfResoEnabled ? parseFloat(perfResoSlider.value) : 0.0;
            perfResoGain.gain.setTargetAtTime(target, audioContext.currentTime, 0.01);
            if (perfResoInput) perfResoInput.gain.setTargetAtTime(perfResoEnabled ? 1.0 : 0.0, audioContext.currentTime, 0.01);
            updateMRFADirectGain();
            saveState();
        });
    }

    if (perfReverbToggle && perfReverbWetGain) {
        perfReverbToggle.checked = perfReverbEnabled;
        perfReverbToggle.addEventListener("change", (e) => {
            perfReverbEnabled = e.target.checked;
            const target = perfReverbEnabled ? parseFloat(perfReverbSlider.value) : 0.0;
            perfReverbWetGain.gain.setTargetAtTime(target, audioContext.currentTime, 0.01);
            if (perfReverbInput) perfReverbInput.gain.setTargetAtTime(perfReverbEnabled ? 1.0 : 0.0, audioContext.currentTime, 0.01);
            updateMRFADirectGain();
            saveState();
        });
    }

    if (mrfaToggle && mrfaWetGain) {
        mrfaToggle.checked = mrfaEnabled;
        mrfaWetGain.gain.value = mrfaEnabled ? 1.0 : 0.0;
        if (mrfaDryGain) mrfaDryGain.gain.value = mrfaEnabled ? 0.0 : 1.0;
        mrfaToggle.addEventListener("change", (e) => {
            mrfaEnabled = e.target.checked;
            mrfaWetGain.gain.setTargetAtTime(mrfaEnabled ? 1.0 : 0.0, audioContext.currentTime, 0.01);
            if (mrfaDryGain) {
                mrfaDryGain.gain.setTargetAtTime(mrfaEnabled ? 0.0 : 1.0, audioContext.currentTime, 0.01);
            }
            saveState();
        });
    }

    if (mrfaBandSliders && mrfaGains.length === mrfaBandSliders.length) {
        mrfaBandSliders.forEach((slider, idx) => {
            if (!slider) return;
            slider.value = mrfaGains[idx].gain.value;
            const valueSpan = document.getElementById(`mrfaVal${idx + 1}`);
            if (valueSpan) valueSpan.textContent = parseFloat(slider.value).toFixed(2);
            slider.addEventListener("input", (e) => {
                const v = parseFloat(e.target.value);
                mrfaGains[idx].gain.setTargetAtTime(v, audioContext.currentTime, 0.01);
                if (valueSpan) valueSpan.textContent = v.toFixed(2);
            });
            slider.addEventListener("change", saveState);
        });
    }
}

function updateMRFADirectGain() {
    if (!mrfaDirectGain) return;
    mrfaDirectGain.gain.setTargetAtTime(1.0, audioContext.currentTime, 0.01);
}

function updateMeterVisual(analyser, meterFillEl) {
    if (!analyser || !meterFillEl) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = bufferLength > 0 ? sum / bufferLength : 0;
    const normalizedLevel = average / 128;
    const meterHeightPercent = Math.min(100, Math.max(0, normalizedLevel * 100 * 1.5));

    const computedStyles = getComputedStyle(document.body);
    const meterStart = computedStyles.getPropertyValue('--meter-fill-start').trim() || 'rgba(124,252,0,0.9)';
    const meterMid = computedStyles.getPropertyValue('--meter-fill-mid').trim() || 'rgba(0,191,255,0.9)';
    const meterEnd = computedStyles.getPropertyValue('--meter-fill-end').trim() || 'rgba(138,43,226,0.9)';

    const gradientString = `linear-gradient(to top, ${meterStart}, ${meterMid}, ${meterEnd})`;

    meterFillEl.style.background = gradientString;
    meterFillEl.style.backgroundSize = `100% 100px`;
    meterFillEl.style.backgroundPosition = `bottom`;
    meterFillEl.style.height = `${meterHeightPercent}%`;
}

function updateMixerGUI() {
    if (!isAudioReady || !audioContext || !mixerVolumeControls || !mixerSendControls || !mixerPanControls) return;

    mixerVolumeControls.innerHTML = '';
    mixerSendControls.innerHTML = '';
    mixerPanControls.innerHTML = '';

    const timeConstant = 0.01;

    const createMeter = (id) => {
        const container = document.createElement('div');
        container.className = 'meter-container';
        const fill = document.createElement('div');
        fill.className = 'meter-fill';
        fill.id = `meterFill-${id}`;
        container.appendChild(fill);
        return container;
    };

    const createVolumeRow = (id, name, gainNode, analyserNode, soloState, muteState, groupObj) => {
        const row = document.createElement('div');
        row.className = 'mixer-row';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'group-name';
        nameDiv.textContent = name;

        const soloBtn = document.createElement('button');
        soloBtn.className = 'solo-btn';
        soloBtn.textContent = 'S';
        if (soloState) soloBtn.classList.add('active');

        const muteBtn = document.createElement('button');
        muteBtn.className = 'mute-btn';
        muteBtn.textContent = 'M';
        if (muteState) muteBtn.classList.add('active');

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1.5;
        slider.step = 0.01;
        let intendedSliderVal;
        if (groupObj) {
            if (groupObj.muteState && gainNode && gainNode._originalGainBeforeMute !== undefined) {
                intendedSliderVal = gainNode._originalGainBeforeMute;
            } else if (groupObj.volume !== undefined) {
                intendedSliderVal = groupObj.volume;
            } else {
                intendedSliderVal = gainNode ? gainNode.gain.value : 0;
            }
        } else if (id === 'master' && gainNode) {
            intendedSliderVal =
                gainNode.gain.value < 0.001 && gainNode._originalGainBeforeMuteMaster !== undefined
                    ? gainNode._originalGainBeforeMuteMaster
                    : gainNode.gain.value;
        } else if (gainNode && gainNode._originalGainBeforeMuteFx !== undefined && gainNode.gain.value < 0.001) {
            intendedSliderVal = gainNode._originalGainBeforeMuteFx;
        } else {
            intendedSliderVal = gainNode ? gainNode.gain.value : 0;
        }
        slider.value = intendedSliderVal;
        slider.id = `mixerGroupSlider_${id}`;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'value-display';
        valueSpan.id = `mixerGroupValue_${id}`;
        valueSpan.textContent = parseFloat(slider.value).toFixed(2);

        const meter = createMeter(id);

        row.appendChild(soloBtn);
        row.appendChild(muteBtn);
        row.appendChild(nameDiv);
        row.appendChild(slider);
        row.appendChild(valueSpan);
        row.appendChild(meter);

        if (gainNode) {
            slider.addEventListener('input', (e) => {
                const newVal = parseFloat(e.target.value);
                gainNode.gain.setTargetAtTime(newVal, audioContext.currentTime, timeConstant);
                if (groupObj) groupObj.volume = newVal;
                if (gainNode._originalGainBeforeMute !== undefined) gainNode._originalGainBeforeMute = newVal;
                valueSpan.textContent = newVal.toFixed(2);
            });
            slider.addEventListener('change', saveState);
        } else {
            slider.disabled = true;
        }

        if (groupObj) {
            soloBtn.addEventListener('click', () => {
                groupObj.soloState = !groupObj.soloState;
                if (groupObj.soloState) {
                    identifiedGroups.forEach(g => { if (g.id !== groupObj.id) g.soloState = false; });
                    groupObj.muteState = false;
                }
                applySoloMuteToAllGroupsAudio();
                updateMixerGUI();
                saveState();
            });
            muteBtn.addEventListener('click', () => {
                groupObj.muteState = !groupObj.muteState;
                if (groupObj.muteState) {
                    if (gainNode._originalGainBeforeMute === undefined || gainNode.gain.value > 0.001) {
                        gainNode._originalGainBeforeMute = gainNode.gain.value;
                    }
                    if (groupObj.soloState) groupObj.soloState = false;
                }
                applySoloMuteToAllGroupsAudio();
                updateMixerGUI();
                saveState();
            });
        } else if (id.startsWith('tape-')) {
            const trackIdx = parseInt(id.split('-')[1], 10);
            soloBtn.addEventListener('click', () => {
                tapeTrackSoloStates[trackIdx] = !tapeTrackSoloStates[trackIdx];
                if (tapeTrackSoloStates[trackIdx]) {
                    tapeTrackSoloStates.forEach((_, i) => { if (i !== trackIdx) tapeTrackSoloStates[i] = false; });
                    tapeTrackMuteStates[trackIdx] = false;
                }
                applySoloMuteToAllGroupsAudio();
                updateMixerGUI();
            });
            muteBtn.addEventListener('click', () => {
                tapeTrackMuteStates[trackIdx] = !tapeTrackMuteStates[trackIdx];
                if (tapeTrackMuteStates[trackIdx] && tapeTrackSoloStates[trackIdx]) {
                    tapeTrackSoloStates[trackIdx] = false;
                }
                if (tapeTrackMuteStates[trackIdx] && gainNode && gainNode._originalGainBeforeMute === undefined) {
                    gainNode._originalGainBeforeMute = gainNode.gain.value;
                }
                applySoloMuteToAllGroupsAudio();
                updateMixerGUI();
            });
        } else if (id === 'radio') {
            soloBtn.addEventListener('click', () => {
                radioSoloState = !radioSoloState;
                if (radioSoloState) {
                    tapeTrackSoloStates.forEach((_, i) => tapeTrackSoloStates[i] = false);
                    identifiedGroups.forEach(g => g.soloState = false);
                    radioMuteState = false;
                }
                applySoloMuteToAllGroupsAudio();
                updateMixerGUI();
            });
            muteBtn.addEventListener('click', () => {
                radioMuteState = !radioMuteState;
                if (radioMuteState && radioSoloState) radioSoloState = false;
                if (radioMuteState && radioGainNode && radioGainNode._originalGainBeforeMute === undefined) {
                    radioGainNode._originalGainBeforeMute = radioGainNode.gain.value;
                }
                applySoloMuteToAllGroupsAudio();
                updateMixerGUI();
            });
        } else {
            soloBtn.style.display = 'none';
            muteBtn.addEventListener('click', () => {
                if (id === 'master') {
                    if (!gainNode._originalGainBeforeMuteMaster && gainNode._originalGainBeforeMuteMaster !== 0) {
                        gainNode._originalGainBeforeMuteMaster = gainNode.gain.value > 0.001 ? gainNode.gain.value : 0.8;
                    }
                    if (gainNode.gain.value > 0.001) {
                        gainNode._originalGainBeforeMuteMaster = gainNode.gain.value;
                        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, timeConstant);
                        muteBtn.classList.add('active');
                        muteBtn.textContent = 'UNMUTE';
                    } else {
                        const restore = gainNode._originalGainBeforeMuteMaster > 0.001 ? gainNode._originalGainBeforeMuteMaster : 0.8;
                        gainNode.gain.setTargetAtTime(restore, audioContext.currentTime, timeConstant);
                        muteBtn.classList.remove('active');
                        muteBtn.textContent = 'M';
                    }
                    saveState();
                } else {
                    gainNode.isMuted = !gainNode.isMuted;
                    if (gainNode.isMuted && gainNode._originalGainBeforeMute === undefined) {
                        gainNode._originalGainBeforeMute = gainNode.gain.value;
                    }
                    applySoloMuteToAllGroupsAudio();
                    updateMixerGUI();
                    saveState();
                }
            });
        }

        return row;
    };

    const createSendRow = (id, name, groupObj) => {
        const row = document.createElement('div');
        row.className = 'mixer-row';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'group-name';
        nameDiv.textContent = name;

        const delaySlider = document.createElement('input');
        delaySlider.type = 'range';
        delaySlider.min = 0;
        delaySlider.max = 1;
        delaySlider.step = 0.01;
        delaySlider.value = groupObj.delaySendGainNode ? groupObj.delaySendGainNode.gain.value : 0;
        delaySlider.id = `mixerGroupDelaySlider_${id}`;
        const delayVal = document.createElement('span');
        delayVal.className = 'value-display';
        delayVal.id = `mixerGroupDelayValue_${id}`;
        delayVal.textContent = parseFloat(delaySlider.value).toFixed(2);

        const reverbSlider = document.createElement('input');
        reverbSlider.type = 'range';
        reverbSlider.min = 0;
        reverbSlider.max = 1;
        reverbSlider.step = 0.01;
        reverbSlider.value = groupObj.reverbSendGainNode ? groupObj.reverbSendGainNode.gain.value : 0;
        reverbSlider.id = `mixerGroupReverbSlider_${id}`;
        const reverbVal = document.createElement('span');
        reverbVal.className = 'value-display';
        reverbVal.id = `mixerGroupReverbValue_${id}`;
        reverbVal.textContent = parseFloat(reverbSlider.value).toFixed(2);

        const meter = createMeter(`${id}-send`);

        row.appendChild(nameDiv);
        row.appendChild(delaySlider);
        row.appendChild(delayVal);
        row.appendChild(reverbSlider);
        row.appendChild(reverbVal);
        row.appendChild(meter);

        if (groupObj.delaySendGainNode) {
            delaySlider.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                groupObj.delaySendGainNode.gain.setTargetAtTime(v, audioContext.currentTime, timeConstant);
                groupObj.delaySendLevel = v;
                delayVal.textContent = v.toFixed(2);
            });
            delaySlider.addEventListener('change', saveState);
        } else {
            delaySlider.disabled = true;
        }

        if (groupObj.reverbSendGainNode) {
            reverbSlider.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                groupObj.reverbSendGainNode.gain.setTargetAtTime(v, audioContext.currentTime, timeConstant);
                groupObj.reverbSendLevel = v;
                reverbVal.textContent = v.toFixed(2);
            });
            reverbSlider.addEventListener('change', saveState);
        } else {
            reverbSlider.disabled = true;
        }

        return row;
    };

    const createPanRow = (id, name, pannerNode, groupObj) => {
        const row = document.createElement('div');
        row.className = 'mixer-row';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'group-name';
        nameDiv.textContent = name;

        const panSlider = document.createElement('input');
        panSlider.type = 'range';
        panSlider.min = -1;
        panSlider.max = 1;
        panSlider.step = 0.01;
        panSlider.value = pannerNode ? pannerNode.pan.value : 0;
        panSlider.id = `mixerGroupPanSlider_${id}`;
        const panVal = document.createElement('span');
        panVal.className = 'value-display';
        panVal.id = `mixerGroupPanValue_${id}`;
        panVal.textContent = parseFloat(panSlider.value).toFixed(2);

        row.appendChild(nameDiv);
        row.appendChild(panSlider);
        row.appendChild(panVal);

        if (pannerNode) {
            panSlider.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                pannerNode.pan.setTargetAtTime(v, audioContext.currentTime, timeConstant);
                if (groupObj) groupObj.pan = v;
                panVal.textContent = v.toFixed(2);
            });
            panSlider.addEventListener('change', saveState);
        } else {
            panSlider.disabled = true;
        }

        return row;
    };

    
    if (masterGain && masterPannerNode && masterAnalyser) {
        mixerVolumeControls.appendChild(createVolumeRow('master', 'Master', masterGain, masterAnalyser, false, false, null));
        mixerPanControls.appendChild(createPanRow('master', 'Master', masterPannerNode, null));
    }

    identifiedGroups.forEach(group => {
        if (!group.gainNode) return;
        const name = group.userDefined ? `User ${group.id.replace('userGroup_','')}` : `Const. ${group.id.replace('autoGroup_','')}`;
        mixerVolumeControls.appendChild(createVolumeRow(group.id, name, group.gainNode, group.analyserNode, group.soloState, group.muteState, group));
        mixerSendControls.appendChild(createSendRow(group.id, name, group));
        mixerPanControls.appendChild(createPanRow(group.id, name, group.pannerNode, group));
    });

    if (window.radioSamplerInfo && (window.radioSamplerInfo.isPlaying || window.radioSamplerInfo.hasRecording)) {
        mixerVolumeControls.appendChild(
            createVolumeRow(
                'radio',
                'Radio',
                window.radioSamplerInfo.gainNode,
                window.radioSamplerInfo.analyserNode,
                window.radioSamplerInfo.soloState,
                window.radioSamplerInfo.muteState,
                null
            )
        );
        mixerSendControls.appendChild(
            createSendRow('radio', 'Radio', { delaySendGainNode: radioDelaySendGainNode, reverbSendGainNode: radioReverbSendGainNode })
        );
        mixerPanControls.appendChild(createPanRow('radio', 'Radio', radioPannerNode, null));
    }

    if ((isTapeLoopPlaying || isTapeLoopRecording)) {
        tapeTracks.forEach((track, idx) => {
            const hasAudio = track.buffer || (isTapeLoopRecording && idx === currentTapeTrack);
            if (!hasAudio) return;
            const gainNode = tapeTrackGainNodes[idx];
            const analyser = tapeTrackAnalyserNodes[idx];
            mixerVolumeControls.appendChild(
                createVolumeRow(
                    `tape-${idx}`,
                    `Tape ${idx + 1}`,
                    gainNode,
                    analyser,
                    tapeTrackSoloStates[idx],
                    tapeTrackMuteStates[idx],
                    null
                )
            );
        });
    }

    if (delayReturnGain && delayReturnAnalyser) {
        mixerVolumeControls.appendChild(createVolumeRow('delay-return', 'Delay FX', delayReturnGain, delayReturnAnalyser, delayReturnGain.isSoloed, delayReturnGain.isMuted, null));
    }
    if (reverbWetGain && reverbReturnAnalyser) {
        mixerVolumeControls.appendChild(createVolumeRow('reverb-return', 'Reverb FX', reverbWetGain, reverbReturnAnalyser, reverbWetGain.isSoloed, reverbWetGain.isMuted, null));
    }
    window.dispatchEvent(new Event('groups-updated'));
}


function applySoloMuteToAllGroupsAudio() {
  if (!audioContext) return;
  const timeConstant = 0.01;

  const anyGroupSoloActive = identifiedGroups.some(g => g.soloState);
  const anyFxSoloActive = (delayReturnGain && delayReturnGain.isSoloed) || (reverbWetGain && reverbWetGain.isSoloed);
  const anyTapeSoloActive = tapeTrackSoloStates.some(s => s);
  const anyRadioSoloActive = radioSoloState;
  const anySoloOverall = anyGroupSoloActive || anyFxSoloActive || anyTapeSoloActive || anyRadioSoloActive;

  identifiedGroups.forEach(group => {
      if (!group.gainNode) return;
      
      let intendedGain = group.gainNode._originalGainBeforeMute !== undefined ? group.gainNode._originalGainBeforeMute : (group.volume !== undefined ? group.volume : 1.0);
      let targetGainValue;

      if (group.muteState) { 
          targetGainValue = 0;
      } else if (anySoloOverall) { 
          if (group.soloState) { 
              targetGainValue = intendedGain;
          } else { 
              targetGainValue = 0;
          }
      } else { 
          targetGainValue = intendedGain;
      }
      group.gainNode.gain.setTargetAtTime(targetGainValue, audioContext.currentTime, timeConstant);
  });

  if (delayReturnGain) {
      let intendedGain = delayReturnGain._originalGainBeforeMute !== undefined ? delayReturnGain._originalGainBeforeMute : 0.5;
      let targetDelayReturnGain;
      if (delayReturnGain.isMuted) {
          targetDelayReturnGain = 0;
      } else if (anySoloOverall) {
          if (delayReturnGain.isSoloed) {
              targetDelayReturnGain = intendedGain;
          } else {
              targetDelayReturnGain = 0;
          }
      } else {
           targetDelayReturnGain = intendedGain;
      }
      delayReturnGain.gain.setTargetAtTime(targetDelayReturnGain, audioContext.currentTime, timeConstant);
  }

  if (reverbWetGain) {
      let intendedGain = reverbWetGain._originalGainBeforeMute !== undefined ? reverbWetGain._originalGainBeforeMute : 0.5;
      let targetReverbReturnGain;
       if (reverbWetGain.isMuted) {
          targetReverbReturnGain = 0;
      } else if (anySoloOverall) {
          if (reverbWetGain.isSoloed) {
              targetReverbReturnGain = intendedGain;
          } else {
              targetReverbReturnGain = 0;
          }
      } else {
          targetReverbReturnGain = intendedGain;
      }
      reverbWetGain.gain.setTargetAtTime(targetReverbReturnGain, audioContext.currentTime, timeConstant);
  }

  if (radioGainNode) {
      let intended = radioGainNode._originalGainBeforeMute !== undefined ? radioGainNode._originalGainBeforeMute : 1.0;
      let target;
      if (radioMuteState) {
          target = 0;
      } else if (anySoloOverall) {
          if (radioSoloState) {
              target = intended;
          } else {
              target = 0;
          }
      } else {
          target = intended;
      }
      radioGainNode.gain.setTargetAtTime(target, audioContext.currentTime, timeConstant);
  }

  tapeTrackGainNodes.forEach((gainNode, idx) => {
      if (!gainNode) return;
      let intended = gainNode._originalGainBeforeMute !== undefined ? gainNode._originalGainBeforeMute : 1.0;
      let target;
      if (tapeTrackMuteStates[idx]) {
          target = 0;
      } else if (anySoloOverall) {
          if (tapeTrackSoloStates[idx]) {
              target = intended;
          } else {
              target = 0;
          }
      } else {
          target = intended;
      }
      gainNode.gain.setTargetAtTime(target, audioContext.currentTime, timeConstant);
  });
}


export function updateNodeAudioParams(node) {
  if (!node.audioNodes || !isAudioReady) return;
  const now = audioContext ? audioContext.currentTime : 0;
  const params = node.audioParams;
  const sanitizedPitch = sanitizeFrequency(params.pitch, A4_FREQ);
  const pitchUpdateTimeConstant = 0.05;
  const generalUpdateTimeConstant = 0.02;
  const {
    oscillator1,
    osc1Gain,
    oscillator2,
    osc2Gain,
    lowPassFilter,
    reverbSendGain,
    delaySendGain,
    modulatorOsc1,
    modulatorGain1,
    modulatorOsc2,
    modulatorGain2,
    modulatorOsc3,
    modulatorGain3,
    carrierEnv,
    modulatorEnv1,
    modulatorEnv2,
    modulatorEnv3,
    setAlgorithm,
    volLfoGain,
    orbitoneOscillators,
    orbitoneOsc1Gains,
    orbitoneOsc2s,
    orbitoneOsc2Gains,
    orbitoneIndividualGains,
    orbitoneModulatorOscs,
    orbitoneModulatorGains,
  } = node.audioNodes;

  try {
    if (oscillator1 && params.osc1Waveform) {
      if (oscillator1.frequency === undefined) {
        try { oscillator1.stop(); oscillator1.disconnect(); } catch {}
        const o = new Tone.Oscillator({ type: sanitizeWaveformType(params.osc1Waveform === 'noise' ? 'sine' : params.osc1Waveform) });
        o.connect(node.audioNodes.osc1Gain);
        o.start();
        node.audioNodes.oscillator1 = o;
      } else {
        oscillator1.type = params.osc1Waveform === 'noise' ? 'sine' : params.osc1Waveform;
      }
    }
    if (oscillator2 && params.osc2Waveform) {
      if (oscillator2.frequency === undefined) {
        try { oscillator2.stop(); oscillator2.disconnect(); } catch {}
        const o2 = new Tone.Oscillator({ type: sanitizeWaveformType(params.osc2Waveform === 'noise' ? 'sine' : params.osc2Waveform) });
        o2.connect(node.audioNodes.osc2Gain);
        o2.start();
        node.audioNodes.oscillator2 = o2;
      } else {
        oscillator2.type = params.osc2Waveform === 'noise' ? 'sine' : params.osc2Waveform;
      }
    }
    if (orbitoneOsc2s && orbitoneOsc2s.length > 0 && params.osc2Waveform) {
      orbitoneOsc2s.forEach((o2, idx) => {
        if (o2.frequency === undefined) return;
        o2.type = params.osc2Waveform === 'noise' ? 'sine' : params.osc2Waveform;
      });
    }
    if (oscillator2 && oscillator2.detune && params.osc2Detune !== undefined) {
      oscillator2.detune.setTargetAtTime(params.osc2Detune, now, generalUpdateTimeConstant);
    }
    if (orbitoneOsc2s && orbitoneOsc2s.length > 0 && params.osc2Detune !== undefined) {
      orbitoneOsc2s.forEach((o2) => {
        if (o2.detune) o2.detune.setTargetAtTime(params.osc2Detune, now, generalUpdateTimeConstant);
      });
    }

    if (oscillator1 && params.carrierWaveform) {
      oscillator1.type = sanitizeWaveformType(params.carrierWaveform);
    }
    if (modulatorOsc1 && params.modulatorWaveform) {
      modulatorOsc1.type = sanitizeWaveformType(params.modulatorWaveform);
    }
    if (modulatorOsc2 && params.modulator2Waveform) {
      modulatorOsc2.type = sanitizeWaveformType(params.modulator2Waveform);
    }
    if (modulatorOsc3 && params.modulator3Waveform) {
      modulatorOsc3.type = sanitizeWaveformType(params.modulator3Waveform);
    }
    if (modulatorOsc1 && params.modulatorRatio !== undefined && oscillator1 && oscillator1.frequency) {
      const base = oscillator1.frequency.value;
      modulatorOsc1.frequency.setTargetAtTime(base * params.modulatorRatio, now, generalUpdateTimeConstant);
    }
    if (modulatorOsc2 && params.modulator2Ratio !== undefined && oscillator1 && oscillator1.frequency) {
      const base = oscillator1.frequency.value;
      modulatorOsc2.frequency.setTargetAtTime(base * params.modulator2Ratio, now, generalUpdateTimeConstant);
    }
    if (modulatorOsc3 && params.modulator3Ratio !== undefined && oscillator1 && oscillator1.frequency) {
      const base = oscillator1.frequency.value;
      modulatorOsc3.frequency.setTargetAtTime(base * params.modulator3Ratio, now, generalUpdateTimeConstant);
    }

    if (node.audioParams && node.audioParams.engine === 'tonefm') {
      if (modulatorGain1 && params.modulatorDepthScale !== undefined) {
        modulatorGain1.gain.setTargetAtTime(
          params.modulatorDepthScale * 10,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (modulatorGain2 && params.modulator2DepthScale !== undefined) {
        modulatorGain2.gain.setTargetAtTime(
          params.modulator2DepthScale * 10,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (modulatorGain3 && params.modulator3DepthScale !== undefined) {
        modulatorGain3.gain.setTargetAtTime(
          params.modulator3DepthScale * 10,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (oscillator1 && oscillator1.detune) {
        const det = params.carrierDetune ?? params.detune;
        if (det !== undefined) {
          oscillator1.detune.setTargetAtTime(
            det,
            now,
            generalUpdateTimeConstant,
          );
        }
      }
      if (modulatorOsc1 && modulatorOsc1.detune && params.modulatorDetune !== undefined) {
        modulatorOsc1.detune.setTargetAtTime(
          params.modulatorDetune,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (modulatorOsc2 && modulatorOsc2.detune && params.modulator2Detune !== undefined) {
        modulatorOsc2.detune.setTargetAtTime(
          params.modulator2Detune,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (modulatorOsc3 && modulatorOsc3.detune && params.modulator3Detune !== undefined) {
        modulatorOsc3.detune.setTargetAtTime(
          params.modulator3Detune,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (setAlgorithm && params.algorithm !== undefined) {
        setAlgorithm(params.algorithm);
      }
      if (carrierEnv) {
        carrierEnv.attack = params.carrierEnvAttack ?? carrierEnv.attack;
        carrierEnv.decay = params.carrierEnvDecay ?? carrierEnv.decay;
        carrierEnv.sustain = params.carrierEnvSustain ?? carrierEnv.sustain;
        carrierEnv.release = params.carrierEnvRelease ?? carrierEnv.release;
      }
      if (modulatorEnv1) {
        modulatorEnv1.attack = params.modulatorEnvAttack ?? modulatorEnv1.attack;
        modulatorEnv1.decay = params.modulatorEnvDecay ?? modulatorEnv1.decay;
        modulatorEnv1.sustain = params.modulatorEnvSustain ?? modulatorEnv1.sustain;
        modulatorEnv1.release = params.modulatorEnvRelease ?? modulatorEnv1.release;
      }
      if (modulatorEnv2) {
        modulatorEnv2.attack = params.modulator2EnvAttack ?? modulatorEnv2.attack;
        modulatorEnv2.decay = params.modulator2EnvDecay ?? modulatorEnv2.decay;
        modulatorEnv2.sustain = params.modulator2EnvSustain ?? modulatorEnv2.sustain;
        modulatorEnv2.release = params.modulator2EnvRelease ?? modulatorEnv2.release;
      }
      if (modulatorEnv3) {
        modulatorEnv3.attack = params.modulator3EnvAttack ?? modulatorEnv3.attack;
        modulatorEnv3.decay = params.modulator3EnvDecay ?? modulatorEnv3.decay;
        modulatorEnv3.sustain = params.modulator3EnvSustain ?? modulatorEnv3.sustain;
        modulatorEnv3.release = params.modulator3EnvRelease ?? modulatorEnv3.release;
      }
    }

    if (node.audioNodes.noiseGain) {
      node.audioNodes.noiseGain.gain.setTargetAtTime(
        params.noiseLevel ?? 0,
        now,
        generalUpdateTimeConstant,
      );
    }

    if (node.type === "sound") {
      if (lowPassFilter) {
        if (node.audioParams && (node.audioParams.engine === 'tone' || node.audioParams.engine === 'tonefm')) {
          if (params.filterType) {
            lowPassFilter.type = params.filterType;
          }
          const cutoff = params.filterCutoff ?? MAX_FILTER_FREQ;
          lowPassFilter.frequency.setTargetAtTime(
            cutoff,
            now,
            generalUpdateTimeConstant,
          );
          if (params.filterResonance !== undefined) {
            lowPassFilter.Q.setTargetAtTime(
              params.filterResonance,
              now,
              generalUpdateTimeConstant,
            );
          }
        } else {
          const sizeRange = MAX_NODE_SIZE - MIN_NODE_SIZE;
          const freqRange = MAX_FILTER_FREQ - MIN_FILTER_FREQ;
          const normalizedSize = (node.size - MIN_NODE_SIZE) / (sizeRange || 1);
          const currentFilterFreq = MIN_FILTER_FREQ + normalizedSize * freqRange;
          params.lowPassFreq = currentFilterFreq;
          lowPassFilter.frequency.setTargetAtTime(
            params.lowPassFreq,
            now,
            generalUpdateTimeConstant,
          );
        }
      }
      if (isReverbReady && reverbSendGain) {
        reverbSendGain.gain.setTargetAtTime(
          params.reverbSend ?? DEFAULT_REVERB_SEND,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (isDelayReady && delaySendGain) {
        delaySendGain.gain.setTargetAtTime(
          params.delaySend ?? DEFAULT_DELAY_SEND,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (volLfoGain) {
        const shouldFluctuate = fluctuatingGroupNodeIDs.has(node.id);
        const fluctuationAmount = parseFloat(groupFluctuateAmount.value);
        const targetLfoDepth = shouldFluctuate
          ? fluctuationAmount
          : params.volLfoDepth || 0;
        volLfoGain.gain.setTargetAtTime(targetLfoDepth, now, 0.1);
      }

      const allOutputFrequencies = getOrbitoneFrequencies(
        params.scaleIndex,
        params.orbitonesEnabled ? params.orbitoneCount : 0,
        params.orbitoneIntervals,
        0,
        currentScale,
        sanitizedPitch,
      );
      const mainNoteFreq = allOutputFrequencies[0];
      const orbitoneBaseMixLevel =
        params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;

      if (oscillator1 && !isNaN(mainNoteFreq) && mainNoteFreq > 0) {
        const osc1Freq =
          mainNoteFreq * Math.pow(2, params.osc1Octave || 0);
        oscillator1.frequency.setTargetAtTime(
          osc1Freq,
          now,
          pitchUpdateTimeConstant,
        );
        if (osc1Gain) {
          const mix = params.orbitonesEnabled ? 1.0 - orbitoneBaseMixLevel : 1.0;
          const lvl = (params.osc1Level ?? 1.0) * mix;
          osc1Gain.gain.setTargetAtTime(lvl, now, generalUpdateTimeConstant);
        }
        if (modulatorOsc1 && params.carrierWaveform) {
          const modRatio = params.modulatorRatio || 1.0;
          modulatorOsc1.frequency.setTargetAtTime(
            mainNoteFreq * modRatio,
            now,
            pitchUpdateTimeConstant,
          );
        }
        if (
          oscillator2 &&
          osc2Gain &&
          params.osc2Waveform &&
          !params.carrierWaveform &&
          !params.orbitonesEnabled
        ) {

            mainNoteFreq * Math.pow(2, params.osc2Octave || 0);
          oscillator2.frequency.setTargetAtTime(
            osc2BaseFreq,
            now,
            pitchUpdateTimeConstant,
          );
        }
        if (osc2Gain) {
          const lvlBase = params.osc2Enabled ? params.osc2Level ?? 1.0 : 0;
          const lvl = lvlBase * (params.orbitonesEnabled ? 1.0 - orbitoneBaseMixLevel : 1.0);
          osc2Gain.gain.setTargetAtTime(lvl, now, generalUpdateTimeConstant);
        }
        if (orbitoneOsc1Gains && orbitoneOsc1Gains.length > 0) {
          orbitoneOsc1Gains.forEach((g1) => {
            g1.gain.setTargetAtTime(
              (params.osc1Level ?? 1.0),
              now,
              generalUpdateTimeConstant,
            );
          });
        }
        if (orbitoneOsc2s && orbitoneOsc2Gains && orbitoneOsc2s.length > 0) {
          orbitoneOsc2s.forEach((o2, idx) => {
            if (idx + 1 >= allOutputFrequencies.length) return;
            const freq = allOutputFrequencies[idx + 1];
            if (!isNaN(freq) && freq > 0) {
              o2.frequency.setTargetAtTime(
                freq * Math.pow(2, params.osc2Octave || 0),
                now,
                pitchUpdateTimeConstant,
              );
            }
            const g2 = orbitoneOsc2Gains[idx];
            if (g2) {
              const lvl2 = params.osc2Enabled ? params.osc2Level ?? 1.0 : 0;
              g2.gain.setTargetAtTime(lvl2, now, generalUpdateTimeConstant);
            }
          });
        }
      }

      if (
        params.orbitonesEnabled &&
        orbitoneOscillators &&
        orbitoneIndividualGains
      ) {
        for (let i = 0; i < params.orbitoneCount; i++) {
          if (
            i + 1 >= allOutputFrequencies.length ||
            i >= orbitoneOscillators.length
          )
            continue;
          const freq = allOutputFrequencies[i + 1];
          const orbitOsc = orbitoneOscillators[i];
          const orbitIndGain = orbitoneIndividualGains[i];
          const orbitG1 =
            orbitoneOsc1Gains && orbitoneOsc1Gains[i]
              ? orbitoneOsc1Gains[i]
              : null;

          if (orbitOsc && !isNaN(freq) && freq > 0) {
            orbitOsc.frequency.setTargetAtTime(
              freq,
              now,
              pitchUpdateTimeConstant,
            );
            if (params.orbitoneDetune > 0) {
              orbitOsc.detune.setTargetAtTime(
                (Math.random() - 0.5) * 2 * params.orbitoneDetune,
                now,
                pitchUpdateTimeConstant,
              );
            }
          }
          if (orbitIndGain) {
          const osc1Level = params.osc1Level ?? 1.0;
          const osc2Level = params.osc2Enabled ? params.osc2Level ?? 0 : 0;
          let volMultiplier =
            orbitoneBaseMixLevel / Math.max(1, params.orbitoneCount);
          if (params.orbitoneVolumeVariation > 0) {
            volMultiplier *=
              1.0 - Math.random() * params.orbitoneVolumeVariation;
          }

          orbitIndGain.gain.setTargetAtTime(
              Math.min(1.0, Math.max(0.01, volMultiplier)),
              now,
              generalUpdateTimeConstant,
            );
          }
          if (orbitG1) {
            orbitG1.gain.setTargetAtTime(
              params.osc1Level ?? 1.0,
              now,
              generalUpdateTimeConstant,
            );
          }
          if (
            orbitoneModulatorOscs &&
            orbitoneModulatorOscs[i] &&
            params.carrierWaveform &&
            !isNaN(freq) &&
            freq > 0
          ) {
            const modOsc = orbitoneModulatorOscs[i];
            const modRatio = params.modulatorRatio || 1.0;
            modOsc.frequency.setTargetAtTime(
              freq * modRatio,
              now,
              pitchUpdateTimeConstant,
            );
          }
        }
      }
    } else if (node.type === PRORB_TYPE) {
      const { osc1, osc1Gain, osc2, osc2Gain, filter, lfo, lfoGain, lfo2, lfo2Gain, reverbSendGain, delaySendGain } = node.audioNodes;
      if (osc1) {
        osc1.frequency.setTargetAtTime(sanitizedPitch * Math.pow(2, params.osc1Octave || 0), now, pitchUpdateTimeConstant);
        osc1.type = params.osc1Waveform;
      }
      if (osc1Gain) {
        osc1Gain.gain.setTargetAtTime(params.osc1Level ?? 1.0, now, generalUpdateTimeConstant);
      }
      if (osc2) {
        osc2.frequency.setTargetAtTime(sanitizedPitch * Math.pow(2, params.osc2Octave || 0), now, pitchUpdateTimeConstant);
        osc2.type = params.osc2Waveform;
        osc2.detune.setTargetAtTime(params.osc2Detune ?? 0, now, generalUpdateTimeConstant);
      }
      if (osc2Gain) {
        const lvlBase = params.osc2Enabled ? params.osc2Level ?? 1.0 : 0;
        const orbitMix = params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;
        const lvl = lvlBase * (params.orbitonesEnabled ? 1.0 - orbitMix : 1.0);
        osc2Gain.gain.setTargetAtTime(lvl, now, generalUpdateTimeConstant);
      }
      if (filter) {
        filter.type = params.filterType;
        filter.frequency.setTargetAtTime(params.filterCutoff, now, generalUpdateTimeConstant);
        filter.Q.setTargetAtTime(params.filterResonance, now, generalUpdateTimeConstant);
      }
      if (lfo && lfoGain) {
        lfo.frequency.setTargetAtTime(params.lfoRate, now, generalUpdateTimeConstant);
        lfoGain.gain.setTargetAtTime(params.lfoEnabled ? params.lfoAmount : 0, now, generalUpdateTimeConstant);
      }
      if (lfo2 && lfo2Gain) {
        lfo2.frequency.setTargetAtTime(params.lfo2Rate, now, generalUpdateTimeConstant);
        lfo2Gain.gain.setTargetAtTime(params.lfo2Enabled ? params.lfo2Amount : 0, now, generalUpdateTimeConstant);
      }
      if (isReverbReady && reverbSendGain) {
        reverbSendGain.gain.setTargetAtTime(params.reverbSend ?? 0, now, generalUpdateTimeConstant);
      }
      if (isDelayReady && delaySendGain) {
        delaySendGain.gain.setTargetAtTime(params.delaySend ?? 0, now, generalUpdateTimeConstant);
      }
    } else if (node.type === "nebula") {
      const {
        gainNode,
        filterNode,
        filterLfoGain,
        volLfoGain: nebVolLfoGain,
        oscillators,
        reverbSendGain: nebReverbSend,
        delaySendGain: nebDelaySend,
      } = node.audioNodes;
      if (
        !gainNode ||
        !filterNode ||
        !oscillators ||
        !filterLfoGain ||
        !nebVolLfoGain
      )
        return;
      const sizeRange = MAX_NODE_SIZE - MIN_NODE_SIZE;
      const normalizedSize = (node.size - MIN_NODE_SIZE) / (sizeRange || 1);
      const baseFreq = sanitizedPitch;
      const targetVol = Math.min(
        NEBULA_MAX_VOL,
        node.size * NEBULA_VOL_SCALING * 1.5,
      );
      gainNode.gain.setTargetAtTime(targetVol, now, 0.1);
      const filterFreq =
        baseFreq * 2 +
        normalizedSize * baseFreq * (params.filterFreqFactor || 12);
      if (!isNaN(filterFreq) && filterFreq > 0)
        filterNode.frequency.setTargetAtTime(filterFreq, now, 0.1);
      const lfoDepth =
        baseFreq *
        NEBULA_FILTER_LFO_DEPTH_FACTOR *
        (params.lfoDepthFactor || 1);
      if (!isNaN(lfoDepth))
        filterLfoGain.gain.setTargetAtTime(lfoDepth, now, 0.1);
      if (node.audioNodes.filterLfo) {
        const spinMod =
          1 + Math.sin(node.spinLfoPhase || 0) * NEBULA_SPIN_LFO_DEPTH;
        const spinRate = Math.abs((node.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) * spinMod) * NEBULA_LFO_SPIN_MULTIPLIER;
        node.audioNodes.filterLfo.frequency.setTargetAtTime(
          NEBULA_FILTER_LFO_RATE + spinRate,
          now,
          0.1,
        );
      }
      nebVolLfoGain.gain.setTargetAtTime(NEBULA_VOL_LFO_DEPTH, now, 0.1);
      oscillators.forEach((osc, i) => {
        const interval = NEBULA_OSC_INTERVALS[i];
        const freq = baseFreq * Math.pow(2, interval / 12);
        if (!isNaN(freq) && freq > 0)
          osc.frequency.setTargetAtTime(freq, now, 0.1);
        const detuneAmount = params.detune || NEBULA_OSC_DETUNE || 7;
        osc.detune.setTargetAtTime(
          (i % 2 === 0 ? 1 : -1) * detuneAmount * (i + 1),
          now,
          0.1,
        );
        const desiredWaveform =
          params.waveform === "fmBell" || params.waveform === "fmXylo"
            ? "sine"
            : params.waveform || "sawtooth";
        if (osc.type !== desiredWaveform) {
          osc.type = desiredWaveform;
        }
      });
      if (isReverbReady && nebReverbSend) {
        nebReverbSend.gain.setTargetAtTime(
          params.reverbSend ?? DEFAULT_REVERB_SEND,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (isDelayReady && nebDelaySend) {
        nebDelaySend.gain.setTargetAtTime(
          params.delaySend ?? DEFAULT_DELAY_SEND,
          now,
          generalUpdateTimeConstant,
        );
      }
    } else if (node.type === RESONAUTER_TYPE) {
      const { reverbSendGain: resVerb, delaySendGain: resDelay } = node.audioNodes;
      if (isReverbReady && resVerb)
        resVerb.gain.setTargetAtTime(params.reverbSend ?? 0.1, now, generalUpdateTimeConstant);
      if (isDelayReady && resDelay)
        resDelay.gain.setTargetAtTime(params.delaySend ?? 0.1, now, generalUpdateTimeConstant);
      resonauterGranParams.gMix = params.gMix ?? 0;
      const {
        combDelay,
        combFeedback,
        combLPF,
        resonLow,
        resonLowGain,
        resonMid,
        resonMidGain,
        resonHigh,
        resonHighGain,
        mixComb,
        mixReson,
        reverbSendGain: combVerb,
        delaySendGain: combDelaySend,
      } = node.audioNodes;
      if (!combDelay || !combFeedback) return;
      combDelay.delayTime.setTargetAtTime(params.delayTime ?? 0.01, now, generalUpdateTimeConstant);
      combFeedback.gain.setTargetAtTime(params.feedback ?? 0.7, now, generalUpdateTimeConstant);
      combLPF.frequency.setTargetAtTime(params.combLpFreq ?? 8000, now, generalUpdateTimeConstant);
      resonLow.frequency.setTargetAtTime(params.resLowFreq ?? 200, now, generalUpdateTimeConstant);
      resonLow.Q.setTargetAtTime(params.resLowQ ?? 10, now, generalUpdateTimeConstant);
      resonLowGain.gain.setTargetAtTime(params.resLowGain ?? 0.5, now, generalUpdateTimeConstant);
      resonMid.frequency.setTargetAtTime(params.resMidFreq ?? 400, now, generalUpdateTimeConstant);
      resonMid.Q.setTargetAtTime(params.resMidQ ?? 10, now, generalUpdateTimeConstant);
      resonMidGain.gain.setTargetAtTime(params.resMidGain ?? 0.5, now, generalUpdateTimeConstant);
      resonHigh.frequency.setTargetAtTime(params.resHighFreq ?? 800, now, generalUpdateTimeConstant);
      resonHigh.Q.setTargetAtTime(params.resHighQ ?? 10, now, generalUpdateTimeConstant);
      resonHighGain.gain.setTargetAtTime(params.resHighGain ?? 0.5, now, generalUpdateTimeConstant);
      mixComb.gain.setTargetAtTime(1 - (params.mix ?? 0.5), now, generalUpdateTimeConstant);
      mixReson.gain.setTargetAtTime(params.mix ?? 0.5, now, generalUpdateTimeConstant);
      if (isReverbReady && combVerb)
        combVerb.gain.setTargetAtTime(params.reverbSend ?? 0.1, now, generalUpdateTimeConstant);
      if (isDelayReady && combDelaySend)
        combDelaySend.gain.setTargetAtTime(params.delaySend ?? 0.1, now, generalUpdateTimeConstant);
    } else if (node.type === ARVO_DRONE_TYPE) {
      const { lfo, lfoGain, filterLfo, filterLfoGain } = node.audioNodes;
      updateArvoDroneParams(node.audioNodes, sanitizedPitch);
      if (lfo)
        lfo.frequency.setTargetAtTime(params.lfoRate ?? 0.1, now, generalUpdateTimeConstant);
      if (lfoGain)
        lfoGain.gain.setTargetAtTime(params.lfoDepth ?? 0.3, now, generalUpdateTimeConstant);
      if (filterLfo)
        filterLfo.frequency.setTargetAtTime(params.filterModRate ?? 0.02, now, generalUpdateTimeConstant);
      if (filterLfoGain)
        filterLfoGain.gain.setTargetAtTime(params.filterModDepth ?? 2000, now, generalUpdateTimeConstant);
    } else if (node.type === FM_DRONE_TYPE) {
      updateFmDroneParams(node.audioNodes);
    } else if (node.type === RADIO_ORB_TYPE) {
    } else if (isDrumType(node.type)) {
      const {
        mainGain,
        reverbSendGain: drumReverbSend,
        delaySendGain: drumDelaySend,
      } = node.audioNodes;
      if (mainGain)
        mainGain.gain.setTargetAtTime(
          params.volume ?? 1.0,
          now,
          generalUpdateTimeConstant,
        );
      if (isReverbReady && drumReverbSend) {
        drumReverbSend.gain.setTargetAtTime(
          params.reverbSend ?? DEFAULT_REVERB_SEND,
          now,
          generalUpdateTimeConstant,
        );
      }
      if (isDelayReady && drumDelaySend) {
        drumDelaySend.gain.setTargetAtTime(
          params.delaySend ?? DEFAULT_DELAY_SEND,
          now,
          generalUpdateTimeConstant,
        );
      }
    }
  } catch (e) {}
}

function updateConnectionAudioParams(connection) {
  if (
    !connection.audioNodes ||
    connection.type !== "string_violin" ||
    !isAudioReady
  )
    return;
  const now = audioContext.currentTime;
  const params = connection.audioParams;
  const timeConstantForPitch = 0.05;

  try {
    const {
      gainNode,
      filterNode,
      reverbSendGain,
      delaySendGain,
      oscillators,
      vibratoLfo,
      vibratoGain,
    } = connection.audioNodes;
    if (!gainNode || !filterNode || !oscillators || !vibratoLfo || !vibratoGain)
      return;

    oscillators.forEach((osc, i) => {
      const freq = sanitizedPitch;
      const detuneAmount =
        i === 0
          ? 0
          : (i % 2 === 1 ? 1 : -1) *
            Math.ceil(i / 2) *
            (params.detune ?? STRING_VIOLIN_DEFAULTS.detune);
      osc.frequency.setTargetAtTime(freq, now, timeConstantForPitch);
      osc.detune.setTargetAtTime(detuneAmount, now, timeConstantForPitch);
    });

    filterNode.frequency.setTargetAtTime(
      sanitizedPitch *
        (params.filterFreqFactor ?? STRING_VIOLIN_DEFAULTS.filterFreqFactor),
      now,
      timeConstantForPitch,
    );
    filterNode.Q.setTargetAtTime(
      params.filterQ ?? STRING_VIOLIN_DEFAULTS.filterQ,
      now,
      0.02,
    );

    vibratoLfo.frequency.setTargetAtTime(
      params.vibratoRate ?? STRING_VIOLIN_DEFAULTS.vibratoRate,
      now,
      0.02,
    );
    vibratoGain.gain.setTargetAtTime(
      params.vibratoDepth ?? STRING_VIOLIN_DEFAULTS.vibratoDepth,
      now,
      0.02,
    );

    if (isReverbReady && reverbSendGain) {
      reverbSendGain.gain.setTargetAtTime(
        params.reverbSend ?? DEFAULT_REVERB_SEND,
        now,
        0.02,
      );
    }
    if (isDelayReady && delaySendGain) {
      delaySendGain.gain.setTargetAtTime(
        params.delaySend ?? DEFAULT_DELAY_SEND,
        now,
        0.02,
      );
    }
  } catch (e) {
    console.error(
      `Error updating connection audio params for ${connection.id}:`,
      e,
    );
  }
}

function createAudioNodesForConnection(connection) {
  if (!audioContext || connection.type !== "string_violin") return null;
  const now = audioContext.currentTime;
  const startDelay = now + 0.02;
  try {
    const params = connection.audioParams;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value =
      sanitizedPitch *
      (params.filterFreqFactor ?? STRING_VIOLIN_DEFAULTS.filterFreqFactor);
    filterNode.Q.value = params.filterQ ?? STRING_VIOLIN_DEFAULTS.filterQ;
    const vibratoLfo = audioContext.createOscillator();
    vibratoLfo.type = "sine";
    vibratoLfo.frequency.value =
      params.vibratoRate ?? STRING_VIOLIN_DEFAULTS.vibratoRate;
    const vibratoGain = audioContext.createGain();
    vibratoGain.gain.value =
      params.vibratoDepth ?? STRING_VIOLIN_DEFAULTS.vibratoDepth;
    vibratoLfo.connect(vibratoGain);
    const oscillators = [];
    const numOsc = params.numOsc ?? STRING_VIOLIN_DEFAULTS.numOsc;
    for (let i = 0; i < numOsc; i++) {
      const osc = audioContext.createOscillator();
      osc.type = "sawtooth";
      const freq = sanitizedPitch;
      const detuneAmount =
        i === 0
          ? 0
          : (i % 2 === 1 ? 1 : -1) *
            Math.ceil(i / 2) *
            (params.detune ?? STRING_VIOLIN_DEFAULTS.detune);
      osc.frequency.value = freq;
      osc.detune.value = detuneAmount;
      vibratoGain.connect(osc.detune);
      osc.connect(filterNode);
      oscillators.push(osc);
    }
    filterNode.connect(gainNode);

    let reverbSendGain = null;
    if (isReverbReady && reverbNode) {
      reverbSendGain = audioContext.createGain();
      reverbSendGain.gain.value = params.reverbSend ?? DEFAULT_REVERB_SEND;
    }
    let delaySendGain = null;
    if (isDelayReady && masterDelaySendGain) {
      delaySendGain = audioContext.createGain();
      delaySendGain.gain.value = params.delaySend ?? DEFAULT_DELAY_SEND;
    }

    try {
      vibratoLfo.start(startDelay);
    } catch (e) {}
    oscillators.forEach((osc) => {
      try {
        osc.start(startDelay);
      } catch (e) {}
    });

    return {
      gainNode,
      filterNode,
      oscillators,
      vibratoLfo,
      vibratoGain,
      reverbSendGain,
      delaySendGain,
    };
  } catch (e) {
    console.error(
      `Error creating audio nodes for connection ${connection.id}:`,
      e,
    );
    return null;
  }
}

export function triggerNodeEffect(
  node,
  pulseData = {},
  startFrequency = null,
  glideDuration = 0.3,
  transpositionOverride = null,
) {
  if (!node || !node.audioParams) return;
  const now = audioContext ? audioContext.currentTime : 0;
  const params = node.audioParams;
  const intensity = pulseData.intensity ?? 1.0;
  if ('fromTimeline' in pulseData) delete pulseData.fromTimeline;

  const baseVolumeSettingForFinalEnvelope = 1.0;
  const oscillatorVolumeMultiplier = 0.75;
  const samplerVolumeMultiplier = 1.5;

  const ampEnv = params.ampEnv || {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.7,
    release: 0.3,
  };

  let effectiveScaleIndex = params.scaleIndex;
  let effectivePitch = params.pitch;

  if (
    transpositionOverride &&
    typeof transpositionOverride.scaleIndexOverride === "number"
  ) {
    effectiveScaleIndex = transpositionOverride.scaleIndexOverride;

    effectivePitch = getFrequency(
      currentScale,
      effectiveScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(effectivePitch) || effectivePitch <= 0) {
      console.warn(
        `Transposition override for node ${node.id} resulted in invalid pitch. Falling back to original.`,
      );
      effectiveScaleIndex = params.scaleIndex;
      effectivePitch = params.pitch;
    }
  }

  if (node.type === "sound") {
    if (
      !node.audioNodes ||
      !node.audioNodes.gainNode ||
      !node.audioNodes.lowPassFilter
    ) {
      node.isTriggered = false;
      node.animationState = 0;
      return;
    }
    const audioNodes = node.audioNodes;
    const gainNode = audioNodes.gainNode;
    const lowPassFilter = audioNodes.lowPassFilter;
    const oscillator1 = audioNodes.oscillator1;
    const modulatorOsc1 = audioNodes.modulatorOsc1;
    const modulatorGain1 = audioNodes.modulatorGain1;
    const oscillator2 = audioNodes.oscillator2;
    const osc2Gain = audioNodes.osc2Gain;
    const orbitoneOscillators = audioNodes.orbitoneOscillators;
    const orbitoneOsc1Gains = audioNodes.orbitoneOsc1Gains;
    const orbitoneOsc2s = audioNodes.orbitoneOsc2s;
    const orbitoneOsc2Gains = audioNodes.orbitoneOsc2Gains;
    const orbitoneModulatorOscs = audioNodes.orbitoneModulatorOscs;
    const orbitoneModulatorGains = audioNodes.orbitoneModulatorGains;
    const orbitoneIndividualGains = audioNodes.orbitoneIndividualGains;
    const osc1Gain = audioNodes.osc1Gain;

    if (node.audioParams && node.audioParams.engine === 'tonefm') {
      node.isTriggered = true;
      node.animationState = 1;

      const atk = params.carrierEnvAttack ?? 0.01;
      const dec = params.carrierEnvDecay ?? 0.3;
      const sus = params.carrierEnvSustain ?? 0;
      const rel = params.carrierEnvRelease ?? 0.3;

      if (oscillator1 && oscillator1.frequency) {
        oscillator1.frequency.setValueAtTime(
          effectivePitch,
          now,
        );
      }

      if (audioNodes.triggerStart) {
        audioNodes.triggerStart(now, intensity);
      }

      const noteOffTime = now + atk + dec + (sus > 0 ? 0.1 : 0);
      if (audioNodes.triggerStop) {
        audioNodes.triggerStop(noteOffTime);
      }

      setTimeout(() => {
        const stillNode = findNodeById(node.id);
        if (stillNode) stillNode.isTriggered = false;
      }, (noteOffTime - now + rel) * 1000 + 100);
      return;
    }

    if (node.audioParams && node.audioParams.engine === 'tone') {
      node.isTriggered = true;
      node.animationState = 1;

      const peak = Math.max(
        0.01,
        Math.min(
          1.5,
          baseVolumeSettingForFinalEnvelope * intensity * oscillatorVolumeMultiplier,
        ),
      );

      const atk = params.ampEnvAttack ?? 0.01;
      const dec = params.ampEnvDecay ?? 0.3;
      const sus = params.ampEnvSustain ?? 0.7;
      const rel = params.ampEnvRelease ?? 0.3;

      if (oscillator1 && oscillator1.frequency) {
        oscillator1.frequency.setTargetAtTime(
          effectivePitch * Math.pow(2, params.osc1Octave || 0),
          now,
          0.005,
        );
      }
      if (oscillator2 && oscillator2.frequency) {
        oscillator2.frequency.setTargetAtTime(
          effectivePitch * Math.pow(2, params.osc2Octave || 0),
          now,
          0.005,
        );
      }
      const orbitMix =
        params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;
      if (osc1Gain) {
        const mainLvl =
          (params.osc1Level ?? 1.0) *
          (params.orbitonesEnabled ? 1.0 - orbitMix : 1.0);
        osc1Gain.gain.setTargetAtTime(mainLvl, now, 0.02);
      }
      if (osc2Gain) {
        const lvlBase = params.osc2Enabled ? params.osc2Level ?? 1.0 : 0;
        const lvl = lvlBase * (params.orbitonesEnabled ? 1.0 - orbitMix : 1.0);
        osc2Gain.gain.setTargetAtTime(lvl, now, 0.02);
      }

      if (
        params.orbitonesEnabled &&
        node.audioNodes.orbitoneOscillators &&
        node.audioNodes.orbitoneIndividualGains &&
        node.audioNodes.orbitoneOscillators.length > 0
      ) {
        const numAct = node.audioNodes.orbitoneOscillators.length;
        const levelPerOrbit =
          (intensity * orbitMix * (params.osc1Level ?? 1.0)) /
          Math.max(1, numAct);

        const freqs = getOrbitoneFrequencies(
          effectiveScaleIndex,
          params.orbitoneCount,
          params.orbitoneIntervals,
          0,
          currentScale,
          effectivePitch,
        );

        freqs.forEach((_, idx) => {
          const offMs =
            idx === 0
              ? 0
              : params.orbitoneTimingOffsets &&
                params.orbitoneTimingOffsets[idx - 1] !== undefined
              ? params.orbitoneTimingOffsets[idx - 1]
              : 0;
          highlightOrbitoneBar(node.id, idx, offMs);
        });

        freqs.slice(1).forEach((f, i) => {
          const osc = node.audioNodes.orbitoneOscillators[i];
          const osc2 = orbitoneOsc2s ? orbitoneOsc2s[i] : null;
          const g2 = orbitoneOsc2Gains ? orbitoneOsc2Gains[i] : null;
          const g = node.audioNodes.orbitoneIndividualGains[i];
          if (osc && g && !isNaN(f) && f > 0) {
            const offMs =
              params.orbitoneTimingOffsets &&
              params.orbitoneTimingOffsets[i] !== undefined
                ? params.orbitoneTimingOffsets[i]
                : 0;
            const startT = now + offMs / 1000.0;
            osc.frequency.cancelScheduledValues(startT);
            osc.frequency.setValueAtTime(f, startT);
            if (osc2) {
              osc2.frequency.cancelScheduledValues(startT);
              osc2.frequency.setValueAtTime(
                f * Math.pow(2, params.osc2Octave || 0),
                startT,
              );
            }
            let tgt = Math.min(1.0, Math.max(0.001, levelPerOrbit));
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(0, now);
            g.gain.setValueAtTime(0, startT);
            g.gain.linearRampToValueAtTime(tgt, startT + atk);
            g.gain.setTargetAtTime(tgt * sus, startT + atk, dec / 4 + 0.001);
            g.gain.setTargetAtTime(
              0.0001,
              startT + atk + dec + (sus > 0 ? 0.5 : 0),
              rel / 4 + 0.001,
            );
          }
          if (g2) {
            g2.gain.cancelScheduledValues(now);
            g2.gain.setValueAtTime(params.osc2Enabled ? params.osc2Level ?? 1.0 : 0, now);
          }
        });
      }

      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(peak, now + atk);
      gainNode.gain.setTargetAtTime(peak * sus, now + atk, dec / 4);

      const noteDur = atk + dec + 0.3;
      gainNode.gain.setTargetAtTime(0.0, now + noteDur, rel / 4);

      setTimeout(() => {
        const stillNode = findNodeById(node.id);
        if (stillNode) stillNode.isTriggered = false;
      }, noteDur * 1000 + 100);
      return;
    }
    node.isTriggered = true;
    node.animationState = 1;
    let finalEnvelopePeak;
    if (params.waveform && params.waveform.startsWith("sampler_")) {
      finalEnvelopePeak =
        baseVolumeSettingForFinalEnvelope *
        intensity *
        samplerVolumeMultiplier;
    } else {
      finalEnvelopePeak =
        baseVolumeSettingForFinalEnvelope *
        intensity *
        oscillatorVolumeMultiplier;
    }
    finalEnvelopePeak = Math.max(0.01, Math.min(1.5, finalEnvelopePeak));

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      finalEnvelopePeak,
      now + ampEnv.attack,
    );
    gainNode.gain.setTargetAtTime(
      finalEnvelopePeak * ampEnv.sustain,
      now + ampEnv.attack,
      ampEnv.decay / 3 + 0.001,
    );


    const totalDurationForMainNodeEnvelope =
      ampEnv.attack + ampEnv.decay + (ampEnv.sustain > 0 ? 0.5 : 0);
    const mainNodeReleaseTimeConstant = ampEnv.release / 3 + 0.001;
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode && stillNode.audioNodes?.gainNode) {
        const currentGainVal = stillNode.audioNodes.gainNode.gain.value;
        stillNode.audioNodes.gainNode.gain.cancelScheduledValues(
          audioContext.currentTime,
        );
        stillNode.audioNodes.gainNode.gain.setValueAtTime(
          currentGainVal,
          audioContext.currentTime,
        );
        stillNode.audioNodes.gainNode.gain.setTargetAtTime(
          0,
          audioContext.currentTime,
          mainNodeReleaseTimeConstant,
        );
      }
      if (stillNode) stillNode.isTriggered = false;
    }, totalDurationForMainNodeEnvelope * 1000);

    if (params.waveform && params.waveform.startsWith("sampler_")) {
      const samplerId = params.waveform.replace("sampler_", "");
      const definition = SAMPLER_DEFINITIONS.find((s) => s.id === samplerId);

      if (definition && definition.isLoaded && definition.buffer) {
        const allOutputFrequencies = getOrbitoneFrequencies(
          effectiveScaleIndex,
          params.orbitonesEnabled ? params.orbitoneCount : 0,
          params.orbitoneIntervals,
          0,
          currentScale,
          effectivePitch,
        );

        allOutputFrequencies.forEach((_, idx) => {
          const offMs =
            idx === 0
              ? 0
              : params.orbitoneTimingOffsets &&
                params.orbitoneTimingOffsets[idx - 1] !== undefined
              ? params.orbitoneTimingOffsets[idx - 1]
              : 0;
          highlightOrbitoneBar(node.id, idx, offMs);
        });

        allOutputFrequencies.forEach((freq, index) => {
          if (isNaN(freq) || freq <= 0) {
            return;
          }
          const isMainNote = index === 0;
          const timingOffsetMs = isMainNote
            ? 0
            : params.orbitoneTimingOffsets &&
                params.orbitoneTimingOffsets[index - 1] !== undefined
              ? params.orbitoneTimingOffsets[index - 1]
              : 0;
          const scheduledStartTime = now + timingOffsetMs / 1000.0;
          const isReverse = params.sampleReverse ?? false;
          const source = audioContext.createBufferSource();
          const audioBuffer = isReverse ? getReversedBuffer(definition) : definition.buffer;
          source.buffer = audioBuffer;
          let targetRate = 1;
          if (definition.baseFreq > 0) {
            targetRate = Math.max(0.1, Math.min(8, freq / definition.baseFreq));
          }
          const playbackRate = targetRate;
          source.playbackRate.setValueAtTime(playbackRate, scheduledStartTime);
          const startFrac = params.sampleStart ?? 0;
          const endFrac = params.sampleEnd ?? 1;
          const startOffset = Math.max(0, Math.min(definition.buffer.duration, startFrac * definition.buffer.duration));
          const endOffset = Math.max(startOffset + 0.001, Math.min(definition.buffer.duration, endFrac * definition.buffer.duration));
          const playDur = endOffset - startOffset;
          const perNoteSamplerGain = audioContext.createGain();
          let noteVolumeFactor;
          const orbitoneBaseMixLevel =
            params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;
          if (!params.orbitonesEnabled || params.orbitoneCount === 0) {
            noteVolumeFactor = isMainNote ? 1.0 : 0;
          } else {
            const mainNoteVolWhenMixedOut =
              orbitoneBaseMixLevel >= 0.99 ? 0.0 : 1.0 - orbitoneBaseMixLevel;
            noteVolumeFactor = isMainNote
              ? mainNoteVolWhenMixedOut
              : orbitoneBaseMixLevel / Math.max(1, params.orbitoneCount);
          }
          let targetSamplerIndividualPeak = noteVolumeFactor * (params.sampleGain ?? 1.0);
          targetSamplerIndividualPeak = Math.min(
            1.0,
            Math.max(0.001, targetSamplerIndividualPeak),
          );
          if (targetSamplerIndividualPeak < 0.001 && noteVolumeFactor > 0) {
            return;
          }
          if (noteVolumeFactor === 0) return;
          const actualDur = playDur / Math.abs(playbackRate);
          let samplerAttack = params.sampleAttack ?? 0.005;
          let samplerRelease = params.sampleRelease ?? 0.2;
          perNoteSamplerGain.gain.setValueAtTime(0, scheduledStartTime);
          perNoteSamplerGain.gain.linearRampToValueAtTime(
            targetSamplerIndividualPeak,
            scheduledStartTime + samplerAttack,
          );
          source.connect(perNoteSamplerGain);
          perNoteSamplerGain.connect(lowPassFilter);
          const startPos = isReverse ? audioBuffer.duration - endOffset : startOffset;
          source.start(scheduledStartTime, startPos, playDur);
          if (currentSamplerNode === node && isMainNote) {
            const delayMs = Math.max(0, (scheduledStartTime - now) * 1000);
            setTimeout(
              () =>
                animateSamplerPlayhead(
                  node,
                  isReverse ? endFrac : startFrac,
                  isReverse ? startFrac : endFrac,
                  actualDur,
                  samplerAttack,
                  samplerRelease,
                ),
              delayMs,
            );
          }
          const samplerIntrinsicAttack = samplerAttack;
          const samplerIntrinsicDecay =
            params.samplerDecayFactor !== undefined
              ? params.samplerDecayFactor * 0.15
              : 0.15;
          const samplerIntrinsicRelease = samplerRelease;
          const samplerIntrinsicSustainLevel = targetSamplerIndividualPeak;
          const naturalStopTime = scheduledStartTime + actualDur;
          const releaseStartTime = Math.max(
            scheduledStartTime,
            naturalStopTime - samplerIntrinsicRelease,
          );

          perNoteSamplerGain.gain.setValueAtTime(0, scheduledStartTime);
          perNoteSamplerGain.gain.linearRampToValueAtTime(
            samplerIntrinsicSustainLevel,
            scheduledStartTime + samplerIntrinsicAttack,
          );
          perNoteSamplerGain.gain.setValueAtTime(
            samplerIntrinsicSustainLevel,
            releaseStartTime,
          );
          perNoteSamplerGain.gain.linearRampToValueAtTime(
            0.0001,
            naturalStopTime,
          );
          source.stop(naturalStopTime);
          source.onended = () => {
            try {
              perNoteSamplerGain.disconnect();
              source.disconnect();
            } catch (e) {}
          };
        });
      } else {
        if (oscillator1 && oscillator1.frequency) {
          const fallbackFreq =
            effectivePitch * Math.pow(2, params.osc1Octave || 0);
          oscillator1.frequency.cancelScheduledValues(now);
          oscillator1.frequency.setTargetAtTime(fallbackFreq, now, 0.005);
        }
      }
    } else if (oscillator1 && oscillator1.frequency) {
      const targetFreq =
        effectivePitch * Math.pow(2, params.osc1Octave || 0);
      oscillator1.frequency.cancelScheduledValues(now);
      oscillator1.frequency.setTargetAtTime(targetFreq, now, 0.005);

      let currentOsc1GainNode = node.audioNodes.osc1Gain;
      if (!currentOsc1GainNode) {
        currentOsc1GainNode = audioContext.createGain();
        node.audioNodes.osc1Gain = currentOsc1GainNode;
        if (oscillator1.numberOfOutputs > 0) {
          try {
            oscillator1.disconnect(lowPassFilter);
          } catch (e) {}
        }
        oscillator1.connect(currentOsc1GainNode);
        currentOsc1GainNode.connect(lowPassFilter);
      }

      let osc1TargetGainLevel = intensity;

      if (
        params.orbitonesEnabled &&
        orbitoneOscillators &&
        orbitoneIndividualGains &&
        orbitoneIndividualGains.length > 0
      ) {
        const orbitoneMix =
          params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;
        const osc1Level = params.osc1Level ?? 1.0;
        const osc2Level = params.osc2Enabled ? params.osc2Level ?? 0 : 0;
        osc1TargetGainLevel = intensity * (1.0 - orbitoneMix) * osc1Level;
        const numActiveOrbitones = orbitoneOscillators.length;
        const levelPerOrbitone =
          (intensity * orbitoneMix * osc1Level) /
          Math.max(1, numActiveOrbitones);

        const allOutputFrequencies = getOrbitoneFrequencies(
          effectiveScaleIndex,
          params.orbitoneCount,
          params.orbitoneIntervals,
          0,
          currentScale,
          effectivePitch,
        );

        allOutputFrequencies.forEach((_, idx) => {
          const offMs =
            idx === 0
              ? 0
              : params.orbitoneTimingOffsets &&
                params.orbitoneTimingOffsets[idx - 1] !== undefined
              ? params.orbitoneTimingOffsets[idx - 1]
              : 0;
          highlightOrbitoneBar(node.id, idx, offMs);
        });

        allOutputFrequencies.slice(1).forEach((freq, i) => {
          const orbitOsc = orbitoneOscillators[i];
          const orbitIndGain = orbitoneIndividualGains[i];
          if (orbitOsc && orbitIndGain && !isNaN(freq) && freq > 0) {
            const offMs =
              params.orbitoneTimingOffsets &&
              params.orbitoneTimingOffsets[i] !== undefined
                ? params.orbitoneTimingOffsets[i]
                : 0;
            const startT = now + offMs / 1000.0;
            orbitOsc.frequency.cancelScheduledValues(startT);
            orbitOsc.frequency.setValueAtTime(freq, startT);
            let orbitoneIndividualTargetPeak = levelPerOrbitone;
            orbitoneIndividualTargetPeak = Math.min(
              1.0,
              Math.max(0.001, orbitoneIndividualTargetPeak),
            );
            orbitIndGain.gain.cancelScheduledValues(now);
            orbitIndGain.gain.setValueAtTime(0, now);
            orbitIndGain.gain.setValueAtTime(0, startT);
            orbitIndGain.gain.linearRampToValueAtTime(
              orbitoneIndividualTargetPeak,
              startT + ampEnv.attack,
            );
            orbitIndGain.gain.setTargetAtTime(
              orbitoneIndividualTargetPeak * ampEnv.sustain,
              startT + ampEnv.attack,
              ampEnv.decay / 3 + 0.001,
            );
            orbitIndGain.gain.setTargetAtTime(
              0.0001,
              startT + ampEnv.attack + ampEnv.decay + (ampEnv.sustain > 0 ? 0.5 : 0),
              ampEnv.release / 3 + 0.001,
            );

            if (
              orbitoneModulatorOscs &&
              orbitoneModulatorGains &&
              orbitoneModulatorOscs[i] &&
              orbitoneModulatorGains[i] &&
              params.carrierWaveform
            ) {
              const modOsc = orbitoneModulatorOscs[i];
              const modGain = orbitoneModulatorGains[i];
              const modRatio = params.modulatorRatio || 1.0;
              modOsc.frequency.cancelScheduledValues(startT);
              modOsc.frequency.setValueAtTime(freq * modRatio, startT);
              const modEnv = params.modulatorEnv || {
                attack: 0.02,
                decay: 0.03,
                sustain: 0,
                release: 0.03,
              };
              const modDepthBase =
                params.modulatorDepthScale !== undefined
                  ? params.modulatorDepthScale
                  : 2;
              const modDepth = freq * modDepthBase;
              modGain.gain.cancelScheduledValues(now);
              modGain.gain.setValueAtTime(0, now);
              modGain.gain.setValueAtTime(0, startT);
              modGain.gain.linearRampToValueAtTime(
                modDepth,
                startT + modEnv.attack,
              );
              modGain.gain.setTargetAtTime(
                modDepth * (modEnv.sustain ?? 0),
                startT + modEnv.attack,
                modEnv.decay / 3 + 0.001,
              );
              modGain.gain.setTargetAtTime(
                0.0001,
                startT + modEnv.attack + modEnv.decay + (modEnv.sustain > 0 ? 0.05 : 0),
                modEnv.release / 3 + 0.001,
              );
            }
          }
        });
      } else if (
        oscillator2 &&
        osc2Gain &&
        params.osc2Type &&
        !params.carrierWaveform
      ) {
        const osc1Level = params.osc1Level ?? 1.0;
        const osc2Level = params.osc2Level ?? 1.0;
        const orbitMix = params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;
        osc1TargetGainLevel = intensity * (1.0 - orbitMix) * osc1Level;
        osc2Gain.gain.cancelScheduledValues(now);
        const lvl2 = intensity * (1.0 - orbitMix) * osc2Level * (params.osc2Enabled ? 1 : 0);
        osc2Gain.gain.setValueAtTime(lvl2, now);
        if (oscillator2.frequency) {
          oscillator2.frequency.cancelScheduledValues(now);
          oscillator2.frequency.setTargetAtTime(
            targetFreq * Math.pow(2, params.osc2Octave || 0),
            now,
            0.005,
          );
        }
      }

      currentOsc1GainNode.gain.cancelScheduledValues(now);
      currentOsc1GainNode.gain.setValueAtTime(
        Math.max(0.001, Math.min(1.0, osc1TargetGainLevel)),
        now,
      );

      if (modulatorOsc1 && modulatorGain1 && params.carrierWaveform) {
        const modRatio = params.modulatorRatio || 1.0;
        modulatorOsc1.frequency.cancelScheduledValues(now);
        modulatorOsc1.frequency.setTargetAtTime(
          targetFreq * modRatio,
          now,
          0.005,
        );
        const modEnv = params.modulatorEnv || {
          attack: 0.005,
          decay: 0.15,
          sustain: 0,
          release: 0.2,
        };
        const fmDepthScale =
          params.modulatorDepthScale !== undefined
            ? params.modulatorDepthScale
            : 2;
        const modDepth = targetFreq * fmDepthScale;
        modulatorGain1.gain.cancelScheduledValues(now);
        modulatorGain1.gain.setValueAtTime(0, now);
        modulatorGain1.gain.linearRampToValueAtTime(
          modDepth,
          now + modEnv.attack,
        );
        const modSustainLevel =
          modEnv.sustain > 0 ? modDepth * modEnv.sustain : 0.0001;
        modulatorGain1.gain.setTargetAtTime(
          modSustainLevel,
          now + modEnv.attack,
          modEnv.decay / 3 + 0.001,
        );
        setTimeout(
          () => {
            if (
              modulatorGain1 &&
              audioContext &&
              audioContext.state === "running"
            ) {
              const currentModGainVal = modulatorGain1.gain.value;
              modulatorGain1.gain.cancelScheduledValues(
                audioContext.currentTime,
              );
              modulatorGain1.gain.setValueAtTime(
                currentModGainVal,
                audioContext.currentTime,
              );
              modulatorGain1.gain.setTargetAtTime(
                0.0001,
                audioContext.currentTime,
                (modEnv.release || 0.2) / 3 + 0.001,
              );
            }
          },
          (modEnv.attack + modEnv.decay + (modEnv.sustain > 0 ? 0.1 : 0)) *
            1000,
        );
      }
    }

    const particleCount = Math.round(
      5 + Math.floor(node.size * 3) * (pulseData.particleMultiplier ?? 1.0),
    );
    createParticles(node.x, node.y, particleCount);
  } else if (node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE) {
    const currentStylesRadar = getComputedStyle(document.documentElement);
    const radarStroke =
      currentStylesRadar
        .getPropertyValue("--spaceradar-border-color")
        .trim() || SPACERADAR_DEFAULT_COLOR;
    const scanColor =
      currentStylesRadar
        .getPropertyValue("--spaceradar-scanline-color")
        .trim() || radarStroke;
    ctx.beginPath();
    ctx.fillStyle = radarStroke.replace(/[\d\.]+\)$/g, "0.05)");
    ctx.strokeStyle = radarStroke;
    ctx.lineWidth = Math.max(1 / viewScale, 2 / viewScale);
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const angle = ((node.scanAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.rotate(angle + SPACERADAR_ANGLE_OFFSET);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(node.radius, 0);
    ctx.strokeStyle = scanColor;
    ctx.lineWidth = Math.max(1 / viewScale, 2 / viewScale);
    ctx.shadowColor = scanColor;
    ctx.shadowBlur = 5 / viewScale;
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
    if (node.type === CRANK_RADAR_TYPE) {
      const pivotRadius = node.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
      const handleLength = node.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
      const drawingAngleForHandleRad =
        (node.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
      const pivotX =
        node.x + Math.cos(drawingAngleForHandleRad) * pivotRadius;
      const pivotY =
        node.y + Math.sin(drawingAngleForHandleRad) * pivotRadius;
      const handleAngle = drawingAngleForHandleRad + Math.PI / 2;
      const gripX = pivotX + Math.cos(handleAngle) * handleLength;
      const gripY = pivotY + Math.sin(handleAngle) * handleLength;
      const pivotDotRadius = 5 / viewScale;
      const gripRadius = 6 / viewScale;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(pivotX, pivotY);
      ctx.lineTo(gripX, gripY);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
      ctx.lineWidth = Math.max(0.5 / viewScale, 2 / viewScale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, pivotDotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gripX, gripY, gripRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(0.5 / viewScale, 1.5 / viewScale);
      ctx.stroke();
    }
  } else if (node.type === PRORB_TYPE) {
      if (!node.audioNodes) return;
      const p = node.audioParams;
      const {
          osc1, osc2, ampEnvControl, filter, filterEnvControl, lfo, lfoGain
      } = node.audioNodes;
      
      const correctedIntensity = pulseData.intensity ?? 1.0; 

      node.isTriggered = true;
      node.animationState = 1.0;
      setTimeout(() => {
          const stillNode = findNodeById(node.id);
          if (stillNode) stillNode.isTriggered = false;
      }, (p.ampEnvAttack + p.ampEnvDecay) * 1000 + 100);

      const finalPitch = effectivePitch;
      osc1.frequency.setTargetAtTime(
        finalPitch * Math.pow(2, p.osc1Octave),
        now,
        0.01,
      );
      osc2.frequency.setTargetAtTime(
        finalPitch * Math.pow(2, p.osc2Octave),
        now,
        0.01,
      );

      ampEnvControl.gain.cancelScheduledValues(now);
      ampEnvControl.gain.setValueAtTime(0, now);
      
      ampEnvControl.gain.linearRampToValueAtTime(correctedIntensity, now + p.ampEnvAttack);
      ampEnvControl.gain.setTargetAtTime(p.ampEnvSustain * correctedIntensity, now + p.ampEnvAttack, p.ampEnvDecay / 4);

      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(filter.frequency.value, now);
      filter.frequency.linearRampToValueAtTime(p.filterCutoff + p.filterEnvAmount, now + p.filterEnvAttack);
      filter.frequency.setTargetAtTime(p.filterCutoff, now + p.filterEnvAttack, p.filterEnvDecay / 4);

      const noteDuration = p.ampEnvAttack + p.ampEnvDecay + 0.3;
      ampEnvControl.gain.setTargetAtTime(0.0, now + noteDuration, p.ampEnvRelease / 4);
      filter.frequency.setTargetAtTime(p.filterCutoff, now + noteDuration, p.filterEnvRelease / 4);
      
      createParticles(node.x, node.y, 8);
  } else if (node.type === MIDI_ORB_TYPE) {
    const midiNote = Math.round(frequencyToMidi(effectivePitch));
    const velocity = Math.min(
      127,
      Math.max(0, Math.round(params.velocity || 100)),
    );
    const channel = (params.midiChannel || 1) - 1;
    sendMidiMessage([0x90 | channel, midiNote, velocity]);
    setTimeout(() => {
      sendMidiMessage([0x80 | channel, midiNote, 0]);
    }, (params.noteLength || 0.4) * 1000);
    node.isTriggered = true;
    node.animationState = 1;
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, (params.noteLength || 0.4) * 1000);
  } else if (node.type === ALIEN_ORB_TYPE) {
    if (!node.audioNodes) return;
    node.isTriggered = true;
    node.animationState = 1;
    const mix = node.audioNodes.mix.gain;
    const allFreqs = getOrbitoneFrequencies(
      node.audioParams.scaleIndex,
      node.audioParams.orbitonesEnabled ? node.audioParams.orbitoneCount : 0,
      node.audioParams.orbitoneIntervals,
      0,
      currentScale,
      effectivePitch,
    );
    updateAlienNodesParams(
      node.audioNodes,
      node.audioParams.engine,
      allFreqs[0],
    );
    const amp = node.audioNodes.baseGain || 1;
    const orbitMix = node.audioParams.orbitoneMix !== undefined ? node.audioParams.orbitoneMix : 0.5;
    mix.cancelScheduledValues(now);
    mix.setValueAtTime(amp * (node.audioParams.orbitonesEnabled ? 1.0 - orbitMix : 1.0), now);
    mix.setTargetAtTime(0.0, now + 0.5, 0.2);
    if (node.audioNodes.orbitoneSynths && node.audioNodes.orbitoneSynths.length > 0) {
      node.audioNodes.orbitoneSynths.forEach((synth, idx) => {
        if (idx + 1 >= allFreqs.length) return;
        updateAlienNodesParams(
          synth,
          node.audioParams.engine,
          allFreqs[idx + 1],
        );
        const sMix = synth.mix.gain;
        const targetAmp = synth.baseGain || 1;
        sMix.cancelScheduledValues(now);
        sMix.setValueAtTime((amp * orbitMix / node.audioNodes.orbitoneSynths.length) * targetAmp, now);
        sMix.setTargetAtTime(0.0, now + 0.5, 0.2);
      });
    }
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 500);
  } else if (node.type === ALIEN_DRONE_TYPE) {
    if (!node.audioNodes) return;
    node.isTriggered = true;
    node.animationState = 1;
    const allFreqs = getOrbitoneFrequencies(
      node.audioParams.scaleIndex,
      node.audioParams.orbitonesEnabled ? node.audioParams.orbitoneCount : 0,
      node.audioParams.orbitoneIntervals,
      0,
      currentScale,
      effectivePitch,
    );
    updateAlienNodesParams(
      node.audioNodes,
      node.audioParams.engine,
      allFreqs[0],
    );
    const baseAmp = node.audioNodes.baseGain || 1;
    const orbitMix = node.audioParams.orbitoneMix !== undefined ? node.audioParams.orbitoneMix : 0.5;
    const mainMix = node.audioNodes.mix.gain;
    mainMix.cancelScheduledValues(now);
    mainMix.setValueAtTime(baseAmp * (node.audioParams.orbitonesEnabled ? 1.0 - orbitMix : 1.0), now);
    if (node.audioNodes.orbitoneSynths && node.audioNodes.orbitoneSynths.length > 0) {
      node.audioNodes.orbitoneSynths.forEach((synth, idx) => {
        if (idx + 1 >= allFreqs.length) return;
        updateAlienNodesParams(synth, node.audioParams.engine, allFreqs[idx + 1]);
        const sMix = synth.mix.gain;
        const targetAmp = synth.baseGain || 1;
        sMix.cancelScheduledValues(now);
        sMix.setValueAtTime((baseAmp * orbitMix / node.audioNodes.orbitoneSynths.length) * targetAmp, now);
      });
    }
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 500);
  } else if (node.type === ARVO_DRONE_TYPE) {
    if (!node.audioNodes) return;
    node.isTriggered = true;
    node.animationState = 1;
    updateArvoDroneParams(node.audioNodes, effectivePitch);
    const g = node.audioNodes.mainGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(intensity, now);
    g.setTargetAtTime(0.0, now + 0.5, 0.2);
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 500);
  } else if (node.type === FM_DRONE_TYPE) {
    if (!node.audioNodes) return;
    node.isTriggered = true;
    node.animationState = 1;
    updateFmDroneParams(node.audioNodes);
    const g = node.audioNodes.mainGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(intensity, now);
    g.setTargetAtTime(0.0, now + 0.5, 0.2);
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 500);
  } else if (node.type === RESONAUTER_TYPE) {
    if (!node.audioNodes) return;
    node.isTriggered = true;
    node.animationState = 1;
    const orbitFreqs = getOrbitoneFrequencies(
      node.audioParams.scaleIndex,
      node.audioParams.orbitonesEnabled ? node.audioParams.orbitoneCount : 0,
      node.audioParams.orbitoneIntervals,
      0,
      currentScale,
      effectivePitch,
    );

    orbitFreqs.forEach((_, idx) => {
      const offMs =
        idx === 0
          ? 0
          : node.audioParams.orbitoneTimingOffsets &&
            node.audioParams.orbitoneTimingOffsets[idx - 1] !== undefined
          ? node.audioParams.orbitoneTimingOffsets[idx - 1]
          : 0;
      highlightOrbitoneBar(node.id, idx, offMs);
    });

    const orbitMix =
      node.audioParams.orbitoneMix !== undefined
        ? node.audioParams.orbitoneMix
        : 0.5;
    const mainIntensity = node.audioParams.orbitonesEnabled
      ? intensity * (1.0 - orbitMix)
      : intensity;

    const perOrbitIntensity = node.audioParams.orbitonesEnabled
      ? (intensity * orbitMix) / Math.max(1, node.audioParams.orbitoneCount)
      : 0;

    orbitFreqs.forEach((freq, idx) => {
      const offMs =
        idx === 0
          ? 0
          : node.audioParams.orbitoneTimingOffsets &&
            node.audioParams.orbitoneTimingOffsets[idx - 1] !== undefined
          ? node.audioParams.orbitoneTimingOffsets[idx - 1]
          : 0;
      const delay = Math.max(0, offMs);
      const vol = idx === 0 ? mainIntensity : perOrbitIntensity;
      if (delay === 0) {
        playResonauterSound(node, freq, vol);
      } else {
        setTimeout(() => playResonauterSound(node, freq, vol), delay);
      }
    });

    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 300 + (node.audioParams.length ?? 0.5) * 1000);
  } else if (node.type === RADIO_ORB_TYPE) {
    node.isTriggered = true;
    node.animationState = 1;
    if (typeof window.radioSamplerPlayPad === 'function') {
      const idx = node.audioParams.sampleIndex ?? 0;
      window.radioSamplerPlayPad(idx);
    }
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 500);
  } else if (isDrumType(node.type)) {
    if (!node.audioNodes?.mainGain) return;
    node.isTriggered = true;
    node.animationState = 1;
    const soundParams = params;
    const mainGain = node.audioNodes.mainGain;
    const finalVol = (soundParams.volume || 1.0) * intensity;
    const targetFreq = soundParams.baseFreq;
    try {
      if (node.type === "drum_kick") {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const kickStartFreq = targetFreq * 2.5;
        osc.frequency.setValueAtTime(kickStartFreq, now);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.05);
        gain.gain.setValueAtTime(finalVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + soundParams.decay);
        osc.connect(gain);
        gain.connect(mainGain);
        osc.start(now);
        osc.stop(now + soundParams.decay + 0.05);
      } else if (node.type === "drum_snare") {
        const noiseDur = soundParams.noiseDecay ?? 0.15;
        const bodyDecay = soundParams.decay ?? 0.2;
        const noise = audioContext.createBufferSource();
        const noiseBuffer = audioContext.createBuffer(
          1,
          audioContext.sampleRate * noiseDur,
          audioContext.sampleRate,
        );
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = "highpass";
        noiseFilter.frequency.value = 1500;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(finalVol * 0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(mainGain);
        noise.start(now);
        noise.stop(now + noiseDur + 0.01);
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(soundParams.baseFreq, now);
        gain.gain.setValueAtTime(finalVol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + bodyDecay);
        osc.connect(gain);
        gain.connect(mainGain);
        osc.start(now);
        osc.stop(now + bodyDecay + 0.01);
      } else if (node.type === "drum_hihat") {
        const decay = soundParams.decay ?? 0.05;
        const noise = audioContext.createBufferSource();
        const noiseBuffer = audioContext.createBuffer(
          1,
          audioContext.sampleRate * decay,
          audioContext.sampleRate,
        );
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = "highpass";
        noiseFilter.frequency.value = soundParams.baseFreq;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(finalVol, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(mainGain);
        noise.start(now);
        noise.stop(now + decay + 0.01);
      } else if (node.type === "drum_clap") {
        const decay = soundParams.noiseDecay ?? 0.1;
        const noise = audioContext.createBufferSource();
        const noiseBuffer = audioContext.createBuffer(
          1,
          audioContext.sampleRate * decay * 1.5,
          audioContext.sampleRate,
        );
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.value = soundParams.baseFreq ?? 1500;
        noiseFilter.Q.value = 1.5;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(finalVol, now + 0.002);
        noiseGain.gain.setValueAtTime(finalVol, now + 0.002);
        noiseGain.gain.linearRampToValueAtTime(finalVol * 0.7, now + 0.01);
        noiseGain.gain.setValueAtTime(finalVol * 0.7, now + 0.01);
        noiseGain.gain.linearRampToValueAtTime(finalVol * 0.9, now + 0.015);
        noiseGain.gain.setValueAtTime(finalVol * 0.9, now + 0.015);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(mainGain);
        noise.start(now);
        noise.stop(now + decay + 0.05);
      } else if (node.type === "drum_tom1" || node.type === "drum_tom2") {
        const decay =
          soundParams.decay ?? (node.type === "drum_tom1" ? 0.4 : 0.5);
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "sine";
        const tomStartFreq = targetFreq * 1.8;
        osc.frequency.setValueAtTime(tomStartFreq, now);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.08);
        gain.gain.setValueAtTime(finalVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc.connect(gain);
        gain.connect(mainGain);
        osc.start(now);
        osc.stop(now + decay + 0.01);
      } else if (node.type === "drum_cowbell") {
        const decay = soundParams.decay ?? 0.3;
        const osc1_cb = audioContext.createOscillator();
        const osc2_cb = audioContext.createOscillator();
        const gain_cb = audioContext.createGain();
        osc1_cb.type = "square";
        osc2_cb.type = "square";
        osc1_cb.frequency.value = soundParams.baseFreq;
        osc2_cb.frequency.value = soundParams.baseFreq * 1.5;
        gain_cb.gain.setValueAtTime(finalVol * 0.6, now);
        gain_cb.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc1_cb.connect(gain_cb);
        osc2_cb.connect(gain_cb);
        gain_cb.connect(mainGain);
        osc1_cb.start(now);
        osc1_cb.stop(now + decay);
        osc2_cb.start(now);
        osc2_cb.stop(now + decay);
      } else if (node.type.startsWith("drum_fm_")) {
        const decay = soundParams.decay ?? 0.4;
        const carrier = audioContext.createOscillator();
        const mod = audioContext.createOscillator();
        const modGain = audioContext.createGain();
        const ampGain = audioContext.createGain();

        carrier.type = soundParams.carrierWaveform || "sine";
        mod.type = soundParams.modulatorWaveform || "sine";

        const ratio = (soundParams.modRatio || 2) * (0.9 + Math.random() * 0.2);
        const depth =
          (soundParams.modDepth || 50) * intensity * (0.8 + Math.random() * 0.4);
        const startFreq = targetFreq * (node.type !== "drum_fm_snare" ? 1.6 : 1);

        carrier.frequency.setValueAtTime(startFreq, now);
        if (node.type !== "drum_fm_snare") {
          carrier.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.05);
        }

        mod.frequency.setValueAtTime(targetFreq * ratio, now);
        modGain.gain.setValueAtTime(depth, now);
        modGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        mod.connect(modGain);
        modGain.connect(carrier.frequency);

        if (soundParams.feedback) {
          const feedbackGain = audioContext.createGain();
          feedbackGain.gain.value = soundParams.feedback;
          modGain.connect(feedbackGain);
          feedbackGain.connect(mod.frequency);
        }

        ampGain.gain.setValueAtTime(finalVol, now);
        ampGain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        carrier.connect(ampGain);

        if (node.type === "drum_fm_snare") {
          const noise = audioContext.createBufferSource();
          const noiseBuffer = audioContext.createBuffer(
            1,
            audioContext.sampleRate * decay,
            audioContext.sampleRate,
          );
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          noise.buffer = noiseBuffer;
          const noiseFilter = audioContext.createBiquadFilter();
          noiseFilter.type = "highpass";
          noiseFilter.frequency.value = 1200;
          const noiseGain = audioContext.createGain();
          const noiseVol = finalVol * (soundParams.noiseRatio || 0.5);
          noiseGain.gain.setValueAtTime(noiseVol, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.8);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(mainGain);
          noise.start(now);
          noise.stop(now + decay + 0.02);
        }
        ampGain.connect(mainGain);
        carrier.start(now);
        mod.start(now);
        carrier.stop(now + decay + 0.05);
        mod.stop(now + decay + 0.05);
      }
    } catch (e) {
      node.isTriggered = false;
      node.animationState = 0;
    }
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode) stillNode.isTriggered = false;
    }, 150);
    createParticles(node.x, node.y, 3);
  }
}


function startRetriggerSequence(node, originalPulseData, transpositionOverride = null) {
  if (
    !isAudioReady ||
    !node ||
    !node.audioParams ||
    !node.audioParams.retriggerEnabled
  ) {
    return;
  }

  if (node.activeRetriggers && node.activeRetriggers.length > 0) {
    node.activeRetriggers.forEach(clearTimeout);
  }
  node.activeRetriggers = [];
  node.currentRetriggerVisualIndex = -1;

  const params = node.audioParams;

  const count = params.retriggerVolumeSteps
    ? params.retriggerVolumeSteps.length
    : 0;
  if (count === 0) return;

  let baseIntervalMs;
  const useRetriggerSync = isGlobalSyncEnabled && !params.ignoreGlobalSync;

  if (useRetriggerSync && params.retriggerSyncSubdivisionIndex !== undefined) {
    const subdivOpt = subdivisionOptions[params.retriggerSyncSubdivisionIndex];
    if (subdivOpt && typeof subdivOpt.value === "number" && globalBPM > 0) {
      const secondsPerBeat = 60.0 / globalBPM;
      baseIntervalMs = Math.max(20, secondsPerBeat * subdivOpt.value * 1000);
    } else {
      baseIntervalMs = Math.max(20, params.retriggerIntervalMs || 100);
    }
  } else {
    baseIntervalMs = Math.max(20, params.retriggerIntervalMs || 100);
  }

  const rateMode = params.retriggerRateMode || "constant";
  const now = audioContext.currentTime;
  let cumulativeTimeSeconds = 0;

  for (let i = 0; i < count; i++) {
    let currentIntervalMs;
    switch (rateMode) {
      case "accelerate":
        currentIntervalMs = baseIntervalMs * Math.pow(0.82, i);
        break;
      case "decelerate":
        currentIntervalMs = baseIntervalMs * Math.pow(1.18, i);
        break;
      case "random":
        currentIntervalMs = baseIntervalMs * (0.6 + Math.random() * 0.8);
        break;
      case "constant":
      default:
        currentIntervalMs = baseIntervalMs;
        break;
    }
    currentIntervalMs = Math.max(20, currentIntervalMs);

    const retriggerScheduledTime = now + cumulativeTimeSeconds;

    const retriggerId = setTimeout(() => {
      const currentNodeForRetrigger = findNodeById(node.id);
      if (currentNodeForRetrigger) {
        currentNodeForRetrigger.currentRetriggerVisualIndex = i;
        playSingleRetrigger(
          currentNodeForRetrigger,
          i,
          count,
          originalPulseData,
          retriggerScheduledTime,
          transpositionOverride,
        );

        setTimeout(() => {
          if (
            currentNodeForRetrigger &&
            currentNodeForRetrigger.currentRetriggerVisualIndex === i
          ) {
            if (i === count - 1) {
              currentNodeForRetrigger.currentRetriggerVisualIndex = -1;
            }
          }
        }, currentIntervalMs * 0.8);
      }
      if (node.activeRetriggers) {
        node.activeRetriggers = node.activeRetriggers.filter(
          (id) => id !== retriggerId,
        );
        if (node.activeRetriggers.length === 0 && i === count - 1) {
          node.currentRetriggerVisualIndex = -1;
        }
      }
    }, cumulativeTimeSeconds * 1000);

    node.activeRetriggers.push(retriggerId);
    cumulativeTimeSeconds += currentIntervalMs / 1000.0;
  }
}

function propagateTrigger(
  targetNode,
  incomingDelay,
  pulseId,
  sourceNodeId = -1,
  hopsRemaining = Infinity,
  incomingPulse = {
    type: "trigger",
    data: {},
  },
  incomingConnection = null,
) {
  if (!targetNode || targetNode.id === sourceNodeId) {
    return;
  }

  if (targetNode.type === "nebula" || targetNode.type === PORTAL_NEBULA_TYPE) {
    const actualNebulaTriggerDelay = incomingDelay;
    setTimeout(() => {
      const nebulaNode = findNodeById(targetNode.id);
      if (nebulaNode) {
        nebulaNode.animationState = 1.2;
        if (
          incomingPulse.data?.color &&
          nebulaNode.type === PORTAL_NEBULA_TYPE
        ) {
          nebulaNode.baseHue = (nebulaNode.baseHue + 30) % 360;
        }
        setTimeout(() => {
          const nNodeCheck = findNodeById(nebulaNode.id);
          if (nNodeCheck) nNodeCheck.animationState = 0;
        }, 250);
      }
    }, actualNebulaTriggerDelay * 1000);
    return;
  }

  if (
    targetNode.lastTriggerPulseId === pulseId &&
    targetNode.type !== "reflector"
  ) {
    return;
  }
  if (hopsRemaining <= 0 && hopsRemaining !== Infinity) {
    return;
  }

  targetNode.lastTriggerPulseId = pulseId;
  const actualTriggerDelay = incomingDelay;

  setTimeout(() => {
    const currentNode = findNodeById(targetNode.id);
    if (!currentNode) return;

    let canPropagateOriginalPulseFurther = true;
    let playPrimaryAudioEffect = false;
    let pulseDataForNextPropagation = {
      ...incomingPulse.data,
    };
    let isGlideArrival = false;

    if (
      incomingConnection &&
      incomingConnection.type === "glide" &&
      sourceNodeId !== -1
    ) {
      const sourceNodeForGlide = findNodeById(sourceNodeId);
      if (
        sourceNodeForGlide &&
        sourceNodeForGlide.audioParams &&
        (currentNode.type === "sound" ||
         isDrumType(currentNode.type) ||
         currentNode.type === PRORB_TYPE ||
         currentNode.type === MIDI_ORB_TYPE ||
         currentNode.type === ALIEN_ORB_TYPE ||
         currentNode.type === ALIEN_DRONE_TYPE ||
         currentNode.type === RESONAUTER_TYPE ||
         currentNode.type === RADIO_ORB_TYPE)
      ) {
        isGlideArrival = true;
        playPrimaryAudioEffect = true;
        canPropagateOriginalPulseFurther = true;
      }
    }

    if (!isGlideArrival) {
        if (
            currentNode.type === "sound" ||
            isDrumType(currentNode.type) ||
            currentNode.type === PRORB_TYPE ||
            currentNode.type === MIDI_ORB_TYPE ||
            currentNode.type === ALIEN_ORB_TYPE ||
            currentNode.type === RESONAUTER_TYPE ||
            currentNode.type === RADIO_ORB_TYPE
        ) {
             if (currentNode.audioParams && currentNode.audioParams.retriggerEnabled) {
                startRetriggerSequence(currentNode, { ...incomingPulse.data });
                playPrimaryAudioEffect = false; 
            } else {
                playPrimaryAudioEffect = true;
            }
        }
    }
    
    if (isPulsarType(currentNode.type)) {
      if (currentNode.type === "pulsar_triggerable") {
        if (sourceNodeId !== -1 && sourceNodeId !== currentNode.id) {
          currentNode.isEnabled = !currentNode.isEnabled;
          if (currentNode.isEnabled) {
            const nowTime = audioContext ?
              audioContext.currentTime :
              performance.now() / 1000;
            currentNode.lastTriggerTime = -1;
            currentNode.nextSyncTriggerTime = 0;
            currentNode.nextRandomTriggerTime = 0;

            if (
              isGlobalSyncEnabled &&
              !currentNode.audioParams.ignoreGlobalSync
            ) {
              const secondsPerBeat = 60.0 / (globalBPM || 120);
              const subdivIndex =
                currentNode.audioParams.syncSubdivisionIndex ??
                DEFAULT_SUBDIVISION_INDEX;
              if (subdivIndex >= 0 && subdivIndex < subdivisionOptions.length) {
                const subdiv = subdivisionOptions[subdivIndex];
                if (
                  subdiv &&
                  typeof subdiv.value === "number" &&
                  secondsPerBeat > 0
                ) {
                  const nodeIntervalSeconds = secondsPerBeat * subdiv.value;
                  if (nodeIntervalSeconds > 0) {
                    currentNode.nextSyncTriggerTime =
                      Math.ceil(nowTime / nodeIntervalSeconds) *
                      nodeIntervalSeconds;

                    if (currentNode.nextSyncTriggerTime <= nowTime + 0.01) {
                      currentNode.nextSyncTriggerTime += nodeIntervalSeconds;
                    }
                  }
                }
              }
            } else {
              const interval =
                currentNode.audioParams.triggerInterval ||
                DEFAULT_TRIGGER_INTERVAL;
              currentNode.lastTriggerTime = nowTime - interval;
            }
          }
          currentNode.animationState = 1;
        }
        canPropagateOriginalPulseFurther = false;
      } else {
        currentNode.animationState = 1;
        pulseDataForNextPropagation.color =
          currentNode.color ?? pulseDataForNextPropagation.color;
        const sourceNodeForIntensity = findNodeById(sourceNodeId);
        if (
          sourceNodeForIntensity &&
          sourceNodeForIntensity.type === "pulsar_random_volume"
        ) {
          pulseDataForNextPropagation.intensity = incomingPulse.data.intensity;
        } else {
          pulseDataForNextPropagation.intensity =
            currentNode.audioParams.pulseIntensity ?? DEFAULT_PULSE_INTENSITY;
        }
        pulseDataForNextPropagation.particleMultiplier =
          incomingPulse.data.particleMultiplier ?? 1.0;
      }
      playPrimaryAudioEffect = false;
    } else if (currentNode.type === "gate") {
      const counterBefore = currentNode.gateCounter || 0;
      currentNode.gateCounter = counterBefore + 1;
      const modeIndex = currentNode.gateModeIndex || 0;
      const mode = GATE_MODES[modeIndex];
      canPropagateOriginalPulseFurther = false;
      switch (mode) {
        case "1/2":
          if (currentNode.gateCounter % 2 === 0)
            canPropagateOriginalPulseFurther = true;
          break;
        case "1/3":
          if (currentNode.gateCounter % 3 === 0)
            canPropagateOriginalPulseFurther = true;
          break;
        case "1/4":
          if (currentNode.gateCounter % 4 === 0)
            canPropagateOriginalPulseFurther = true;
          break;
        case "2/3":
          if (currentNode.gateCounter % 3 !== 0)
            canPropagateOriginalPulseFurther = true;
          break;
        case "3/4":
          if (currentNode.gateCounter % 4 !== 0)
            canPropagateOriginalPulseFurther = true;
          break;
        case "RAND":
          const randomCheck = Math.random() < GATE_RANDOM_THRESHOLD;
          currentNode.lastRandomGateResult = randomCheck;
          if (randomCheck) canPropagateOriginalPulseFurther = true;
          break;
      }
      currentNode.animationState = 1;
      playPrimaryAudioEffect = false;
    } else if (currentNode.type === "probabilityGate") {
      canPropagateOriginalPulseFurther = false;
      if (
        Math.random() <
        (currentNode.audioParams.probability ?? DEFAULT_PROBABILITY)
      ) {
        canPropagateOriginalPulseFurther = true;
      }
      currentNode.animationState = 1;
      playPrimaryAudioEffect = false;
    } else if (currentNode.type === "pitchShift") {
      currentNode.animationState = 1;
      playPrimaryAudioEffect = false;
      const shiftIndex =
        currentNode.pitchShiftIndex ?? DEFAULT_PITCH_SHIFT_INDEX;
      let shiftAmount = PITCH_SHIFT_AMOUNTS[shiftIndex];
      if (currentNode.pitchShiftAlternating) {
        shiftAmount *= currentNode.pitchShiftDirection || 1;
        currentNode.pitchShiftDirection =
          (currentNode.pitchShiftDirection || 1) * -1;
      }
      currentNode.connections.forEach((neighborId) => {
        if (neighborId === sourceNodeId) return;
        const neighborNode = findNodeById(neighborId);
        if (
          neighborNode &&
          (neighborNode.type === "sound" || neighborNode.type === "nebula")
        ) {
          const oldIndex = neighborNode.audioParams.scaleIndex;
          neighborNode.audioParams.scaleIndex = Math.max(
            MIN_SCALE_INDEX,
            Math.min(MAX_SCALE_INDEX, oldIndex + shiftAmount),
          );
          neighborNode.audioParams.pitch = getFrequency(
            currentScale,
            neighborNode.audioParams.scaleIndex,
            0,
            currentRootNote,
            globalTransposeOffset,
          );
          updateNodeAudioParams(neighborNode);
          if (oldIndex !== neighborNode.audioParams.scaleIndex) {
            neighborNode.animationState = 0.7;
            setTimeout(() => {
              const checkNode = findNodeById(neighborId);
              if (checkNode && !checkNode.isTriggered)
                checkNode.animationState = 0;
            }, 150);
          }
        }
        const neighborConn = connections.find(
          (c) =>
          c.type === "string_violin" &&
          ((c.nodeAId === currentNode.id && c.nodeBId === neighborId) ||
            (c.nodeAId === neighborId && c.nodeBId === currentNode.id)),
        );
        if (neighborConn) {
          const oldIndex = neighborConn.audioParams.scaleIndex;
          neighborConn.audioParams.scaleIndex = Math.max(
            MIN_SCALE_INDEX,
            Math.min(MAX_SCALE_INDEX, oldIndex + shiftAmount),
          );
          neighborConn.audioParams.pitch = getFrequency(
            currentScale,
            neighborConn.audioParams.scaleIndex,
            0,
            currentRootNote,
            globalTransposeOffset,
          );
          updateConnectionAudioParams(neighborConn);
          if (oldIndex !== neighborConn.audioParams.scaleIndex) {
            neighborConn.animationState = 0.7;
            setTimeout(() => {
              const checkConn = findConnectionById(neighborConn.id);
              if (checkConn) checkConn.animationState = 0;
            }, 150);
          }
        }
      });
    } else if (currentNode.type === "relay") {
      currentNode.animationState = 1;
      playPrimaryAudioEffect = false;
    } else if (currentNode.type === CRANK_RADAR_TYPE) {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther =
        (currentNode.connections?.size || 0) >= 2;
      if (incomingConnection) {
        if (
          incomingConnection.nodeBHandle &&
          incomingConnection.nodeBId === currentNode.id
        ) {
          const step =
            (2 * Math.PI) / (currentNode.internalGridDivisions || 8);
          currentNode.pulseAdvanceRemaining =
            (currentNode.pulseAdvanceRemaining || 0) + step;
          currentNode.animationState = 1;
          if (!animationFrameId) startAnimationLoop();
        } else {
          const other = findNodeById(
            incomingConnection.nodeAId === currentNode.id
              ? incomingConnection.nodeBId
              : incomingConnection.nodeAId,
          );
          if (other) {
            const incomingAngle =
              ((Math.atan2(currentNode.y - other.y, currentNode.x - other.x) + Math.PI / 2) %
                (Math.PI * 2) +
                Math.PI * 2) %
              (Math.PI * 2);
            const scanAngle =
              ((currentNode.scanAngle % (Math.PI * 2)) + Math.PI * 2) %
              (Math.PI * 2);
            let diff = incomingAngle - scanAngle;
            diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
            if (Math.abs(diff) < Math.PI / 16) {
              const step =
                (2 * Math.PI) / (currentNode.internalGridDivisions || 8);
              currentNode.pulseAdvanceRemaining =
                (currentNode.pulseAdvanceRemaining || 0) + step;
              currentNode.animationState = 1;
              if (!animationFrameId) startAnimationLoop();
            }
          }
        }
      }
    } else if (currentNode.type === CLOCKWORK_ORB_TYPE) {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = false;
      advanceClockworkOrb(currentNode);
      currentNode.animationState = 1;
      if (!animationFrameId) startAnimationLoop();
    } else if (currentNode.type === "reflector") {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = false;
      currentNode.animationState = 1;
      const sourceNodeForReflector = findNodeById(sourceNodeId);
      if (sourceNodeForReflector && incomingConnection) {
        const baseTravelTime = incomingConnection.length * DELAY_FACTOR;
        const outgoingTravelTime = baseTravelTime;
        const pulseColor = pulseDataForNextPropagation.color;
        createVisualPulse(
          incomingConnection.id,
          outgoingTravelTime,
          currentNode.id,
          hopsRemaining - 1,
          "trigger",
          pulseColor,
          pulseDataForNextPropagation.intensity,
        );
        propagateTrigger(
          sourceNodeForReflector,
          outgoingTravelTime,
          pulseId + Math.random(),
          currentNode.id,
          hopsRemaining - 1,
          {
            type: "trigger",
            data: pulseDataForNextPropagation,
          },
          null,
        );
      }
    } else if (currentNode.type === "switch") {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = false;
      currentNode.animationState = 1;
      if (incomingConnection) {
        if (
          currentNode.primaryInputConnectionId === null ||
          currentNode.primaryInputConnectionId === undefined
        ) {
          currentNode.primaryInputConnectionId = incomingConnection.id;
        }
        if (incomingConnection.id === currentNode.primaryInputConnectionId) {
          canPropagateOriginalPulseFurther = true;
        }
      }
    } else if (currentNode.type === CANVAS_SEND_ORB_TYPE) {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = false;
      currentNode.animationState = 1;
      if (typeof currentNode.targetCanvasIndex === "number") {
        switchTo(currentNode.targetCanvasIndex);
      }
      if (currentNode.receiverId) {
        const recv = findNodeById(currentNode.receiverId);
        if (recv) {
          propagateTrigger(
            recv,
            0,
            pulseId + Math.random(),
            currentNode.id,
            hopsRemaining - 1,
            { type: "trigger", data: pulseDataForNextPropagation },
            null,
          );
        }
      }
    } else if (currentNode.type === CANVAS_RECEIVE_ORB_TYPE) {
      playPrimaryAudioEffect = false;
      canPropagateOriginalPulseFurther = true;
      currentNode.animationState = 1;
    } else if (currentNode.type === "global_key_setter") {
        playPrimaryAudioEffect = false;
        canPropagateOriginalPulseFurther = true;
        activateGlobalKeySetter(currentNode);
    } else if (isDrumType(currentNode.type)) {
      if (
        !(currentNode.audioParams && currentNode.audioParams.retriggerEnabled)
      )
        playPrimaryAudioEffect = true;
    }

    if (playPrimaryAudioEffect) {
      triggerNodeEffect(currentNode, pulseDataForNextPropagation);
    }

    if (currentNode.animationState > 0 && !currentNode.isTriggered) {
      setTimeout(() => {
        const nodeCheck = findNodeById(currentNode.id);
        if (nodeCheck && !nodeCheck.isTriggered) nodeCheck.animationState = 0;
      }, 150);
    }

    if (canPropagateOriginalPulseFurther) {
      const nextHops =
        hopsRemaining === Infinity ? Infinity : hopsRemaining - 1;
      if (nextHops >= 0) {
        currentNode.connections.forEach((neighborId) => {
          if (neighborId === sourceNodeId) return;
          const neighborNode = findNodeById(neighborId);
          const connection = connections.find(
            (c) =>
              (c.nodeAId === currentNode.id && c.nodeBId === neighborId) ||
              (!c.directional &&
                c.nodeAId === neighborId &&
                c.nodeBId === currentNode.id),
          );

          if (
            neighborNode &&
            neighborNode.type !== "nebula" &&
            neighborNode.type !== PORTAL_NEBULA_TYPE &&
            connection &&
            connection.type !== "rope"
          ) {
            const travelTime = connection.length * DELAY_FACTOR;
            createVisualPulse(
              connection.id,
              travelTime,
              currentNode.id,
              nextHops,
              "trigger",
              pulseDataForNextPropagation.color,
              pulseDataForNextPropagation.intensity,
            );
            propagateTrigger(
              neighborNode,
              travelTime,
              pulseId,
              currentNode.id,
              nextHops,
              {
                type: "trigger",
                data: pulseDataForNextPropagation,
              },
              connection,
            );
          }
        });
      }
    }
  }, actualTriggerDelay * 1000);
}

function activateGlobalKeySetter(nodeInstance) {
  if (!nodeInstance || nodeInstance.type !== "global_key_setter" || !nodeInstance.audioParams) {
      return false;
  }

  const keyParams = nodeInstance.audioParams;
  const mode = keyParams.keySetterMode || "key";
  let changed = false;

  if (mode === "key") {
    const targetKeyNoteValue = keyParams.targetKeyNote === undefined ? 0 : keyParams.targetKeyNote;
    if (currentRootNote !== targetKeyNoteValue) {
      setRootNote(targetKeyNoteValue, true);
      changed = true;
    } else {}
  } else {
    const targetOffsetValue = keyParams.targetTransposeOffset === undefined ? 0 : keyParams.targetTransposeOffset;
    if (typeof targetOffsetValue === 'number' && globalTransposeOffset !== targetOffsetValue) {
      globalTransposeOffset = targetOffsetValue;
      updateAllPitchesAndUI();
      changed = true;
    } else {}
  }

  if (changed) {
      nodeInstance.animationState = 1;
      setTimeout(() => {
          const stillNode = findNodeById(nodeInstance.id);
          if (stillNode) stillNode.animationState = 0;
      }, 250);
  } else {
      nodeInstance.animationState = 0.5;
      setTimeout(() => {
          const stillNode = findNodeById(nodeInstance.id);
          if (stillNode) stillNode.animationState = 0;
      }, 150);
  }
  return changed;
}

function playSingleRetrigger(
  node,
  retriggerIndex,
  totalRetriggers,
  basePulseData,
  scheduledPlayTime,
  transpositionOverride = null,
) {
  if (!audioContext || !node || !node.audioParams) return;

  const params = node.audioParams;
  const audioNodes = node.audioNodes;
  const isMuted =
    params.retriggerMuteSteps &&
    params.retriggerMuteSteps[retriggerIndex] === true;
  const activeTabButton = document.querySelector(
    "#hamburgerMenuPanel .retrigger-tab-button.active",
  );
  const activeParamTypeForHighlight = activeTabButton ?
    activeTabButton.dataset.paramType :
    "volume";
  const editorBarToHighlight = document.getElementById(
    `retrigger-bar-node${node.id}-param${activeParamTypeForHighlight}-step${retriggerIndex}`,
  );

  if (editorBarToHighlight) {
    editorBarToHighlight.classList.add("playing");
    if (isMuted) {
      editorBarToHighlight.classList.add("muted-playing");
    }
    setTimeout(
      () => {
        editorBarToHighlight.classList.remove("playing");
        if (isMuted) {
          editorBarToHighlight.classList.remove("muted-playing");
        }
      },
      Math.min(150, (params.retriggerIntervalMs || 100) * 0.8),
    );
  }

  node.currentRetriggerVisualIndex = retriggerIndex;

  if (isMuted) {
    node.animationState = 0.3;
    setTimeout(() => {
      const stillNode = findNodeById(node.id);
      if (stillNode && stillNode.animationState > 0) {
        if (
          !stillNode.isTriggered &&
          (!stillNode.activeRetriggers ||
            stillNode.activeRetriggers.length === 0)
        ) {
          stillNode.animationState = 0;
        }
      }
      if (retriggerIndex === totalRetriggers - 1 && stillNode) {
        setTimeout(
          () => {
            if (stillNode.currentRetriggerVisualIndex === retriggerIndex) {
              stillNode.currentRetriggerVisualIndex = -1;
            }
          },
          (params.retriggerIntervalMs || 100) * 0.9,
        );
      }
    }, 120);
    return;
  }

  if (basePulseData) {
    const retriggerIntensity = basePulseData.intensity ?? 1.0;
    const particleMultiplier = basePulseData.particleMultiplier ?? 1.0;
    const particleCountForRetrigger = Math.max(
      1,
      Math.round(
        (2 + Math.floor(node.size * 1.5)) *
        particleMultiplier *
        retriggerIntensity,
      ),
    );
    createParticles(node.x, node.y, particleCountForRetrigger);
  } else {
    createParticles(node.x, node.y, 3);
  }

  let currentVolume =
    params.retriggerVolumeSteps &&
    params.retriggerVolumeSteps[retriggerIndex] !== undefined ?
    params.retriggerVolumeSteps[retriggerIndex] :
    (basePulseData.intensity ?? 1.0);
  currentVolume *= 0.9; 
  currentVolume = Math.max(0.005, currentVolume);

  let currentPitch = params.pitch;
  let pitchStepOffset =
    params.retriggerPitchSteps &&
    params.retriggerPitchSteps[retriggerIndex] !== undefined ?
    params.retriggerPitchSteps[retriggerIndex] :
    0;
  let baseScaleIndex =
    transpositionOverride && typeof transpositionOverride.scaleIndexOverride === "number"
      ? transpositionOverride.scaleIndexOverride
      : params.scaleIndex;
  baseScaleIndex = Math.max(
    MIN_SCALE_INDEX,
    Math.min(MAX_SCALE_INDEX, baseScaleIndex),
  );
  currentPitch = getFrequency(
    currentScale,
    baseScaleIndex + pitchStepOffset,
    0,
    currentRootNote,
    globalTransposeOffset,
  );
  currentPitch = Math.max(20, currentPitch);

  let currentFilterCutoff = params.lowPassFreq;
  if (
    audioNodes &&
    audioNodes.lowPassFilter &&
    audioNodes.lowPassFilter.frequency
  ) {
    currentFilterCutoff = audioNodes.lowPassFilter.frequency.value;
  }
  let filterStepFactor =
    params.retriggerFilterSteps &&
    params.retriggerFilterSteps[retriggerIndex] !== undefined ?
    params.retriggerFilterSteps[retriggerIndex] :
    0;

  if (filterStepFactor !== 0) {
    const baseCutoffForArc = params.lowPassFreq;
    if (filterStepFactor > 0) {
      currentFilterCutoff =
        baseCutoffForArc +
        (MAX_FILTER_FREQ - baseCutoffForArc) * filterStepFactor;
    } else {
      currentFilterCutoff =
        baseCutoffForArc +
        (baseCutoffForArc - MIN_FILTER_FREQ) * filterStepFactor;
    }
  }
  currentFilterCutoff = Math.max(
    MIN_FILTER_FREQ,
    Math.min(MAX_FILTER_FREQ, currentFilterCutoff),
  );

  const tempAudioParamsForRetrigger = {
    ...params,
    pitch: currentPitch,
    volume: currentVolume,
    lowPassFreq: currentFilterCutoff,
  };

  if (node.type === "sound" && audioNodes) {
    if (tempAudioParamsForRetrigger.waveform && tempAudioParamsForRetrigger.waveform.startsWith("sampler_")) {
      const samplerId = tempAudioParamsForRetrigger.waveform.replace("sampler_", "");
      const definition = SAMPLER_DEFINITIONS.find((s) => s.id === samplerId);

      if (definition && definition.isLoaded && definition.buffer && audioNodes.lowPassFilter && audioNodes.gainNode) {
        const isReverse = params.sampleReverse ?? false;
        const source = audioContext.createBufferSource();
        const audioBuffer = isReverse ? getReversedBuffer(definition) : definition.buffer;
        source.buffer = audioBuffer;

        let targetRate = 1.0;
        if (definition.baseFreq > 0 && currentPitch > 0 && !isNaN(currentPitch) && !isNaN(definition.baseFreq)) {
          targetRate = currentPitch / definition.baseFreq;
          targetRate = Math.max(0.05, Math.min(16, targetRate));
        } else {
          console.warn(`[Retrigger Sampler V3] Invalid pitch (${currentPitch}) or baseFreq (${definition.baseFreq}) for rate calc. Using default rate 1.0.`);
          targetRate = 1.0;
        }

        if (isNaN(targetRate) || !isFinite(targetRate)) {
          console.error(`[Retrigger Sampler V3] FATAL: targetRate is ${targetRate}. Aborting retrigger step for ${samplerId}.`);
          return;
        }

        source.playbackRate.setValueAtTime(targetRate, scheduledPlayTime);
        source.connect(audioNodes.lowPassFilter);

        const mainNodeGain = audioNodes.gainNode;
        mainNodeGain.gain.cancelScheduledValues(scheduledPlayTime);
        mainNodeGain.gain.setValueAtTime(0, scheduledPlayTime);
        mainNodeGain.gain.linearRampToValueAtTime(
          currentVolume, 
          scheduledPlayTime + 0.005 
        );
        mainNodeGain.gain.setTargetAtTime(
          0.0001, 
          scheduledPlayTime + 0.005, 
          0.03 + (params.retriggerIntervalMs / 1000) * 0.15 
        );

        source.start(scheduledPlayTime);

        const sampleDurationOriginal = definition.buffer.duration;
        const effectiveSampleDuration = targetRate > 0 ? sampleDurationOriginal / targetRate : sampleDurationOriginal;
        const envelopeDuration = 0.005 + 3 * (0.03 + (params.retriggerIntervalMs / 1000) * 0.15);
        const stopTimeOffset = Math.min(effectiveSampleDuration, envelopeDuration + 0.05);


        source.stop(scheduledPlayTime + stopTimeOffset);
        source.onended = () => {
          try { source.disconnect(); } catch (e) {}
        };
      } else {
        console.warn(`[Retrigger Sampler V3] Sampler def/buffer not ready, or core audioNodes (filter/gain) missing for ${samplerId}. Node ID: ${node.id}`);
      }
    } else if (audioNodes.oscillator1 && audioNodes.gainNode) {
      const {
        oscillator1,
        oscillator2,
        osc2Gain,
        gainNode,
        lowPassFilter,
        modulatorOsc1,
        modulatorGain1,
        osc1Gain,
        orbitoneOscillators,
        orbitoneIndividualGains,
        orbitoneModulatorOscs,
        orbitoneModulatorGains,
      } = audioNodes;
      const nodeSpecificAmpEnv = tempAudioParamsForRetrigger.ampEnv;
      const generalAudibleDefaultEnv = { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.25 };
      const percussiveRetriggerEnv = { attack: 0.005, decay: 0.08, sustain: 0.0, release: 0.05 };
      let envToUse = retriggerIndex === 0 ? (nodeSpecificAmpEnv || generalAudibleDefaultEnv) : percussiveRetriggerEnv;

      gainNode.gain.cancelScheduledValues(scheduledPlayTime);
      gainNode.gain.setValueAtTime(0, scheduledPlayTime);
      gainNode.gain.linearRampToValueAtTime(currentVolume, scheduledPlayTime + envToUse.attack);
      
      if (envToUse.sustain > 0.01 && envToUse.decay > 0.001) {
        gainNode.gain.setTargetAtTime(currentVolume * envToUse.sustain, scheduledPlayTime + envToUse.attack, envToUse.decay / 4 + 0.001);
        const sustainDurationForRetrigger = (retriggerIndex === 0 && envToUse.sustain > 0.1) ? (envToUse.sustain * 0.3 + envToUse.decay) : 0.05;
        const noteOffTime = scheduledPlayTime + envToUse.attack + envToUse.decay + sustainDurationForRetrigger;
        gainNode.gain.setTargetAtTime(0.0001, noteOffTime, envToUse.release / 4 + 0.001);
      } else {
        gainNode.gain.setTargetAtTime(0.0001, scheduledPlayTime + envToUse.attack, (envToUse.decay / 3) + 0.001);
      }

      oscillator1.frequency.setValueAtTime(currentPitch, scheduledPlayTime);
      if (oscillator2 && osc2Gain) {
        const osc2Freq = currentPitch * Math.pow(2, tempAudioParamsForRetrigger.osc2Octave || 0);
        oscillator2.frequency.setValueAtTime(osc2Freq, scheduledPlayTime);
      }
      if (modulatorOsc1 && modulatorGain1 && tempAudioParamsForRetrigger.carrierWaveform) {
        const modRatio = tempAudioParamsForRetrigger.modulatorRatio || 1.0;
        modulatorOsc1.frequency.setValueAtTime(currentPitch * modRatio, scheduledPlayTime);
        const modEnv = tempAudioParamsForRetrigger.modulatorEnv || { attack: 0.002, decay: 0.03, sustain: 0, release: 0.03 };
        const modDepthBaseFactor = tempAudioParamsForRetrigger.modulatorDepthScale !== undefined ? tempAudioParamsForRetrigger.modulatorDepthScale : 2;
        const modDepth = currentPitch * modDepthBaseFactor;
        modulatorGain1.gain.cancelScheduledValues(scheduledPlayTime);
        modulatorGain1.gain.setValueAtTime(0, scheduledPlayTime);
        modulatorGain1.gain.linearRampToValueAtTime(modDepth, scheduledPlayTime + modEnv.attack);
        modulatorGain1.gain.setTargetAtTime(0.0001, scheduledPlayTime + modEnv.attack, (modEnv.decay / 3) || 0.01);
      }
      if (lowPassFilter && lowPassFilter.frequency) {
        lowPassFilter.frequency.setValueAtTime(currentFilterCutoff, scheduledPlayTime);
      }

      if (
        params.orbitonesEnabled &&
        orbitoneOscillators &&
        orbitoneIndividualGains &&
        orbitoneIndividualGains.length > 0
      ) {
        const orbitoneMix =
          params.orbitoneMix !== undefined ? params.orbitoneMix : 0.5;
        const osc1Level = params.osc1Level ?? 1.0;
        const osc1TargetLevel = currentVolume * (1.0 - orbitoneMix) * osc1Level;
        if (osc1Gain) {
          osc1Gain.gain.cancelScheduledValues(scheduledPlayTime);
          osc1Gain.gain.setValueAtTime(
            Math.max(0.001, Math.min(1.0, osc1TargetLevel)),
            scheduledPlayTime,
          );
        }

        const osc2Level = params.osc2Enabled ? params.osc2Level ?? 0 : 0;
        const numActiveOrbitones = orbitoneOscillators.length;
        const levelPerOrbitone =
          (currentVolume * orbitoneMix * osc1Level) /
          Math.max(1, numActiveOrbitones);

        const allOutputFrequencies = getOrbitoneFrequencies(
          baseScaleIndex + pitchStepOffset,
          params.orbitoneCount,
          params.orbitoneIntervals,
          0,
          currentScale,
          currentPitch,
        );

        allOutputFrequencies.forEach((_, idx) => {
          const offMs =
            idx === 0
              ? 0
              : params.orbitoneTimingOffsets &&
                params.orbitoneTimingOffsets[idx - 1] !== undefined
              ? params.orbitoneTimingOffsets[idx - 1]
              : 0;
          highlightOrbitoneBar(node.id, idx, offMs);
        });

        allOutputFrequencies.slice(1).forEach((freq, i) => {
          const orbitOsc = orbitoneOscillators[i];
          const orbitGain = orbitoneIndividualGains[i];
          const modOsc = orbitoneModulatorOscs ? orbitoneModulatorOscs[i] : null;
          const modGain = orbitoneModulatorGains ? orbitoneModulatorGains[i] : null;

          if (orbitOsc && orbitGain && !isNaN(freq) && freq > 0) {
            const offMs =
              params.orbitoneTimingOffsets &&
              params.orbitoneTimingOffsets[i] !== undefined
                ? params.orbitoneTimingOffsets[i]
                : 0;
            const startT = scheduledPlayTime + offMs / 1000.0;
            orbitOsc.frequency.setValueAtTime(freq, startT);

            const orbitTarget = Math.min(1.0, Math.max(0.001, levelPerOrbitone));
            orbitGain.gain.cancelScheduledValues(now);
            orbitGain.gain.setValueAtTime(0, now);
            orbitGain.gain.setValueAtTime(0, startT);
            orbitGain.gain.linearRampToValueAtTime(
              orbitTarget,
              startT + envToUse.attack,
            );
            if (envToUse.sustain > 0.01 && envToUse.decay > 0.001) {
              orbitGain.gain.setTargetAtTime(
                orbitTarget * envToUse.sustain,
                startT + envToUse.attack,
                envToUse.decay / 4 + 0.001,
              );
              const sustainDur =
                retriggerIndex === 0 && envToUse.sustain > 0.1
                  ? envToUse.sustain * 0.3 + envToUse.decay
                  : 0.05;
              const noteOffTime =
                startT + envToUse.attack + envToUse.decay + sustainDur;
              orbitGain.gain.setTargetAtTime(
                0.0001,
                noteOffTime,
                envToUse.release / 4 + 0.001,
              );
            } else {
              orbitGain.gain.setTargetAtTime(
                0.0001,
                startT + envToUse.attack,
                envToUse.decay / 3 + 0.001,
              );
            }
          }

          if (
            modOsc &&
            params.carrierWaveform &&
            !isNaN(freq) &&
            freq > 0
          ) {
            const modRatio = params.modulatorRatio || 1.0;
            const startT = scheduledPlayTime +
              (params.orbitoneTimingOffsets &&
              params.orbitoneTimingOffsets[i] !== undefined
                ? params.orbitoneTimingOffsets[i]
                : 0) / 1000.0;
            modOsc.frequency.setValueAtTime(freq * modRatio, startT);
            if (modGain) {
              const modEnv = tempAudioParamsForRetrigger.modulatorEnv || {
                attack: 0.02,
                decay: 0.03,
                sustain: 0,
                release: 0.03,
              };
              const modDepthBase =
                tempAudioParamsForRetrigger.modulatorDepthScale !== undefined
                  ? tempAudioParamsForRetrigger.modulatorDepthScale
                  : 2;
              const modDepth = freq * modDepthBase;
              modGain.gain.cancelScheduledValues(now);
              modGain.gain.setValueAtTime(0, now);
              modGain.gain.setValueAtTime(0, startT);
              modGain.gain.linearRampToValueAtTime(
                modDepth,
                startT + modEnv.attack,
              );
              modGain.gain.setTargetAtTime(
                0.0001,
                startT + modEnv.attack,
                (modEnv.decay / 3) || 0.01,
              );
            }
          }
        });
      }
    }
  } else if (isDrumType(node.type)) {
    const tempNodeForDrumHit = {
      ...node,
      audioParams: {
        ...node.audioParams,
        ...tempAudioParamsForRetrigger,
      },
      audioNodes: node.audioNodes,
    };
    triggerNodeEffect(tempNodeForDrumHit, {
      intensity: currentVolume,
      isRetrigger: true,
    });
  }

  node.animationState = 0.6;
  const finalRetriggerCleanup = () => {
    const stillNode = findNodeById(node.id);
    if (stillNode) {
      if (
        stillNode.animationState > 0 &&
        !stillNode.isTriggered &&
        (!stillNode.activeRetriggers || stillNode.activeRetriggers.length === 0)
      ) {
        stillNode.animationState = 0;
      }
      if (
        retriggerIndex === totalRetriggers - 1 &&
        stillNode.currentRetriggerVisualIndex === retriggerIndex
      ) {
        setTimeout(
          () => {
            if (stillNode.currentRetriggerVisualIndex === retriggerIndex) {
              stillNode.currentRetriggerVisualIndex = -1;
            }
          },
          (params.retriggerIntervalMs || 100) * 0.5,
        );
      }
    }
  };
  setTimeout(finalRetriggerCleanup, 120);
}

function createRetriggerVisualEditor(node, selectedArray, initialParamType = "volume") {
    const editorContainer = document.createElement("div");
    editorContainer.classList.add("retrigger-editor-container");

    const tabsContainer = document.createElement("div");
    tabsContainer.classList.add("retrigger-editor-tabs");

    const barsArea = document.createElement("div");
    barsArea.classList.add("retrigger-bars-area");

    const controlsDiv = document.createElement("div");
    controlsDiv.classList.add("retrigger-editor-controls");

    let currentDisplayNode = node;
    if (selectedArray && selectedArray.length > 0) {
        const firstNode = findNodeById(selectedArray[0].id);
        if (firstNode) currentDisplayNode = firstNode;
    }
    if (!currentDisplayNode.audioParams) currentDisplayNode.audioParams = {};

    let activeParamType = initialParamType;
    let activeStepsArrayRef, activeMuteStepsArrayRef;
    let activeValueMin, activeValueMax, activeValueStepInput, activeDefaultValue, activeUnit, activeBarColorClass, activeTooltipSuffix;

    function setupParamSpecifics(newParamType) {
        activeParamType = newParamType;
        editorContainer.dataset.activeParamType = newParamType;

        switch (newParamType) {
            case "pitch":
                activeStepsArrayRef = currentDisplayNode.audioParams.retriggerPitchSteps;
                activeValueMin = -12; activeValueMax = 12; activeValueStepInput = 1; activeDefaultValue = 0; activeUnit = "semi";
                activeBarColorClass = "retrigger-bar-pitch"; activeTooltipSuffix = " semitones";
                break;
            case "filter":
                activeStepsArrayRef = currentDisplayNode.audioParams.retriggerFilterSteps;
                activeValueMin = -1; activeValueMax = 1; activeValueStepInput = 0.01; activeDefaultValue = 0; activeUnit = "factor";
                activeBarColorClass = "retrigger-bar-filter"; activeTooltipSuffix = "";
                break;
            case "volume":
            default:
                activeStepsArrayRef = currentDisplayNode.audioParams.retriggerVolumeSteps;
                activeValueMin = 0; activeValueMax = 1; activeValueStepInput = 0.01; activeDefaultValue = 0.5; activeUnit = "";
                activeBarColorClass = "retrigger-bar-volume"; activeTooltipSuffix = "";
                break;
        }

        const referenceStepCount = (currentDisplayNode.audioParams.retriggerVolumeSteps || []).length;
        const ensureArraySync = (arrayName, defaultVal, isBoolean = false) => {
            let targetArray = currentDisplayNode.audioParams[arrayName];
            if (!targetArray || !Array.isArray(targetArray) || targetArray.length !== referenceStepCount) {
                const newArr = Array(referenceStepCount).fill(null).map((_, i) => {
                    if (targetArray && i < targetArray.length) return targetArray[i];
                    return isBoolean ? false : defaultVal;
                });
                currentDisplayNode.audioParams[arrayName] = newArr;
                selectedArray.forEach((elData) => {
                    const n = findNodeById(elData.id);
                    if (n && n.audioParams && n.id !== currentDisplayNode.id) {
                        let otherNodeArray = n.audioParams[arrayName];
                        const newOtherNodeArray = Array(referenceStepCount).fill(null).map((_, i) => {
                            if (otherNodeArray && i < otherNodeArray.length) return otherNodeArray[i];
                            return isBoolean ? false : defaultVal;
                        });
                        n.audioParams[arrayName] = newOtherNodeArray;
                    }
                });
                return newArr;
            }
            return targetArray;
        };

        activeStepsArrayRef = ensureArraySync(
            newParamType === "volume" ? "retriggerVolumeSteps" : newParamType === "pitch" ? "retriggerPitchSteps" : "retriggerFilterSteps",
            activeDefaultValue
        );
        activeMuteStepsArrayRef = ensureArraySync("retriggerMuteSteps", false, true);
    }

    function renderBarsInternal() {
        barsArea.innerHTML = "";
        if (!activeStepsArrayRef || activeStepsArrayRef.length === 0) {
            barsArea.textContent = "Adjust step count first.";
            return;
        }

        activeStepsArrayRef.forEach((currentValue, index) => {
            const barWrapper = document.createElement("div");
            barWrapper.classList.add("retrigger-bar-wrapper");
            let displayValue = currentValue.toFixed(activeValueStepInput >= 1 ? 0 : 2);
            if (activeParamType === "pitch" && currentValue > 0) displayValue = "+" + displayValue;
            barWrapper.title = `Step ${index + 1}: ${activeParamType.charAt(0).toUpperCase() + activeParamType.slice(1)} ${displayValue}${activeTooltipSuffix}`;

            const barVisualContainer = document.createElement("div");
            barVisualContainer.classList.add("retrigger-bar-visual-container");

            const bar = document.createElement("div");
            bar.classList.add("retrigger-bar", activeBarColorClass);
            bar.id = `retrigger-bar-node${currentDisplayNode.id}-param${activeParamType}-step${index}`;
            bar.dataset.index = index;

            let heightPercent;
            if (activeValueMin < 0) {
                heightPercent = ((currentValue - activeValueMin) / (activeValueMax - activeValueMin)) * 100;
            } else {
                heightPercent = (currentValue / activeValueMax) * 100;
            }
            bar.style.height = `${Math.max(2, Math.min(100, heightPercent))}%`;
            const isCurrentlyMuted = activeMuteStepsArrayRef[index] || false;
            bar.style.opacity = isCurrentlyMuted ? "0.3" : "1";

            barVisualContainer.appendChild(bar);
            barWrapper.appendChild(barVisualContainer);

            const muteToggleLabel = document.createElement("label");
            muteToggleLabel.classList.add("retrigger-step-mute-toggle-label");
            muteToggleLabel.title = `Mute step ${index + 1}`;
            muteToggleLabel.htmlFor = `retrigger-mute-node${currentDisplayNode.id}-param${activeParamType}-step${index}`;
            if(isCurrentlyMuted) muteToggleLabel.classList.add('is-active-mute');


            const muteToggleInput = document.createElement("input");
            muteToggleInput.type = "checkbox";
            muteToggleInput.classList.add("retrigger-step-mute-toggle-input");
            muteToggleInput.id = `retrigger-mute-node${currentDisplayNode.id}-param${activeParamType}-step${index}`;
            muteToggleInput.checked = !isCurrentlyMuted;
            muteToggleInput.dataset.index = index;

            muteToggleLabel.addEventListener("click", (e) => {
                e.stopPropagation();
                const stepIndex = parseInt(muteToggleInput.dataset.index);
                const newMuteState = !muteToggleInput.checked;

                selectedArray.forEach((elData) => {
                    const n = findNodeById(elData.id);
                    if (n && n.audioParams && n.audioParams.retriggerMuteSteps && n.audioParams.retriggerMuteSteps[stepIndex] !== undefined) {
                        n.audioParams.retriggerMuteSteps[stepIndex] = newMuteState;
                    }
                });
                if (activeMuteStepsArrayRef && activeMuteStepsArrayRef[stepIndex] !== undefined) {
                    activeMuteStepsArrayRef[stepIndex] = newMuteState;
                }
                saveState();
                bar.style.opacity = newMuteState ? "0.3" : "1";
                muteToggleLabel.classList.toggle('is-active-mute', newMuteState);
                muteToggleInput.checked = !newMuteState;
            });

            muteToggleLabel.appendChild(muteToggleInput);
            muteToggleLabel.appendChild(document.createElement("span"));
            barWrapper.appendChild(muteToggleLabel);
            barsArea.appendChild(barWrapper);
        });
    }

    let activeDraggedBarIndex = -1;
    let initialMouseYForDrag;
    let initialValueForDrag;

    barsArea.addEventListener("mousedown", (e_down) => {
        const target = e_down.target;
        const barElement = target.classList.contains("retrigger-bar") ? target : null;
        if (barElement) {
            e_down.preventDefault();
            e_down.stopPropagation();
            activeDraggedBarIndex = parseInt(barElement.dataset.index);
            initialMouseYForDrag = e_down.clientY;
            initialValueForDrag = activeStepsArrayRef[activeDraggedBarIndex];
            document.addEventListener("mousemove", onBarDragMouseMove);
            document.addEventListener("mouseup", onBarDragMouseUp);
        }
    });

    function onBarDragMouseMove(e_move) {
        if (activeDraggedBarIndex === -1) return;
        e_move.preventDefault();
        const dy = e_move.clientY - initialMouseYForDrag;
        const barsVisualContainer = barsArea.querySelector(".retrigger-bar-visual-container");
        if (!barsVisualContainer) return;
        const barsAreaHeightPx = barsVisualContainer.clientHeight;
        if (barsAreaHeightPx === 0) return;

        let valueChangeRatio = -(dy / barsAreaHeightPx);
        let newValue = initialValueForDrag + valueChangeRatio * (activeValueMax - activeValueMin);
        newValue = parseFloat(newValue.toFixed(activeValueStepInput >= 1 ? 0 : 2));
        newValue = Math.max(activeValueMin, Math.min(activeValueMax, newValue));

        selectedArray.forEach((elData) => {
            const n = findNodeById(elData.id);
            if (n && n.audioParams) {
                let targetStepsArrayToUpdate;
                if (activeParamType === "volume") targetStepsArrayToUpdate = n.audioParams.retriggerVolumeSteps;
                else if (activeParamType === "pitch") targetStepsArrayToUpdate = n.audioParams.retriggerPitchSteps;
                else if (activeParamType === "filter") targetStepsArrayToUpdate = n.audioParams.retriggerFilterSteps;
                if (targetStepsArrayToUpdate && targetStepsArrayToUpdate[activeDraggedBarIndex] !== undefined) {
                    targetStepsArrayToUpdate[activeDraggedBarIndex] = newValue;
                }
            }
        });
        if (activeStepsArrayRef && activeStepsArrayRef[activeDraggedBarIndex] !== undefined) {
            activeStepsArrayRef[activeDraggedBarIndex] = newValue;
        }

        const barToUpdate = barsArea.querySelector(`.retrigger-bar[data-index="${activeDraggedBarIndex}"]`);
        if (barToUpdate) {
            let heightPercent;
            if (activeValueMin < 0) {
                heightPercent = ((newValue - activeValueMin) / (activeValueMax - activeValueMin)) * 100;
            } else {
                heightPercent = (newValue / activeValueMax) * 100;
            }
            barToUpdate.style.height = `${Math.max(2, Math.min(100, heightPercent))}%`;
            let displayValue = newValue.toFixed(activeUnit === "factor" || activeUnit === "" ? 2 : 0);
            if (activeParamType === "pitch" && newValue > 0) displayValue = "+" + displayValue;
             const currentBarWrapper = barToUpdate.closest('.retrigger-bar-wrapper');
            if(currentBarWrapper) currentBarWrapper.title = `Step ${activeDraggedBarIndex + 1}: ${activeParamType.charAt(0).toUpperCase() + activeParamType.slice(1)} ${displayValue}${activeTooltipSuffix}`;
        }
    }

    function onBarDragMouseUp() {
        if (activeDraggedBarIndex !== -1) {
            activeDraggedBarIndex = -1;
            saveState();
        }
        document.removeEventListener("mousemove", onBarDragMouseMove);
        document.removeEventListener("mouseup", onBarDragMouseUp);
    }

    function createAndAppendPresetButtonsInternal() {
        controlsDiv.innerHTML = "";
        const currentStepCount = (activeStepsArrayRef || []).length;
         if (currentStepCount === 0 && activeParamType !== "filter") return;


        const applyPreset = (newSteps) => {
            const targetArrayName = activeParamType === "volume" ? "retriggerVolumeSteps" :
                                   activeParamType === "pitch" ? "retriggerPitchSteps" :
                                   "retriggerFilterSteps";
            selectedArray.forEach(elData => {
                const n = findNodeById(elData.id);
                if (n && n.audioParams) {
                    if(n.audioParams[targetArrayName]) n.audioParams[targetArrayName] = [...newSteps];
                    if(n.audioParams.retriggerMuteSteps) n.audioParams.retriggerMuteSteps = Array(newSteps.length).fill(false);
                }
            });
            if(currentDisplayNode.audioParams[targetArrayName]) currentDisplayNode.audioParams[targetArrayName] = [...newSteps];
            if(currentDisplayNode.audioParams.retriggerMuteSteps) currentDisplayNode.audioParams.retriggerMuteSteps = Array(newSteps.length).fill(false);
            
            setupParamSpecifics(activeParamType);
            saveState();
            renderBarsInternal();
        };

        const resetButton = document.createElement("button");
        resetButton.textContent = "Reset Steps";
        resetButton.title = "Reset all steps in this tab to default values";
        resetButton.addEventListener("click", () => {
            const newDefaultSteps = Array(currentStepCount).fill(activeDefaultValue);
            applyPreset(newDefaultSteps);
        });
        controlsDiv.appendChild(resetButton);

        const clearButton = document.createElement("button");
        clearButton.textContent = "Clear Mutes";
        clearButton.title = "Unmute all steps in this tab";
        clearButton.addEventListener("click", () => {
            const newMuteSteps = Array(currentStepCount).fill(false);
            selectedArray.forEach(elData => {
                const n = findNodeById(elData.id);
                if (n && n.audioParams) n.audioParams.retriggerMuteSteps = [...newMuteSteps];
            });
            currentDisplayNode.audioParams.retriggerMuteSteps = [...newMuteSteps];
            activeMuteStepsArrayRef = currentDisplayNode.audioParams.retriggerMuteSteps;
            saveState();
            renderBarsInternal();
        });
        controlsDiv.appendChild(clearButton);

        if (activeParamType === "volume") {
            const fadeInBtn = document.createElement("button"); fadeInBtn.textContent = "Fade In";
            fadeInBtn.onclick = () => applyPreset(Array(currentStepCount).fill(0).map((_, i) => parseFloat(((i + 1) / currentStepCount).toFixed(2))));
            controlsDiv.appendChild(fadeInBtn);

            const fadeOutBtn = document.createElement("button"); fadeOutBtn.textContent = "Fade Out";
            fadeOutBtn.onclick = () => applyPreset(Array(currentStepCount).fill(0).map((_, i) => parseFloat(((currentStepCount - i) / currentStepCount).toFixed(2))));
            controlsDiv.appendChild(fadeOutBtn);

            const fullVolBtn = document.createElement("button"); fullVolBtn.textContent = "Full";
            fullVolBtn.onclick = () => applyPreset(Array(currentStepCount).fill(1.0));
            controlsDiv.appendChild(fullVolBtn);
        } else if (activeParamType === "pitch") {
            const arpUpBtn = document.createElement("button"); arpUpBtn.textContent = "Arp Up";
            arpUpBtn.onclick = () => {
                const arpSteps = [0, 4, 7, 12];
                applyPreset(Array(currentStepCount).fill(0).map((_, i) => arpSteps[i % arpSteps.length]));
            };
            controlsDiv.appendChild(arpUpBtn);

            const arpDownBtn = document.createElement("button"); arpDownBtn.textContent = "Arp Down";
            arpDownBtn.onclick = () => {
                const arpSteps = [0, -3, -7, -12];
                applyPreset(Array(currentStepCount).fill(0).map((_, i) => arpSteps[i % arpSteps.length]));
            };
            controlsDiv.appendChild(arpDownBtn);

            const randomPitchBtn = document.createElement("button"); randomPitchBtn.textContent = "Random";
            randomPitchBtn.onclick = () => applyPreset(Array(currentStepCount).fill(0).map(() => Math.floor(Math.random() * 25) - 12));
            controlsDiv.appendChild(randomPitchBtn);
        }
    }

    const paramTypesList = ["volume", "pitch", "filter"];
    paramTypesList.forEach(pt => {
        const tabButton = document.createElement("button");
        tabButton.classList.add("retrigger-tab-button");
        tabButton.textContent = pt.charAt(0).toUpperCase() + pt.slice(1);
        tabButton.dataset.paramType = pt;
        if (pt === initialParamType) {
            tabButton.classList.add("active");
        }
        tabButton.addEventListener("click", () => {
            tabsContainer.querySelectorAll(".retrigger-tab-button").forEach(btn => btn.classList.remove("active"));
            tabButton.classList.add("active");
            setupParamSpecifics(pt);
            renderBarsInternal();
            createAndAppendPresetButtonsInternal();
        });
        tabsContainer.appendChild(tabButton);
    });

    editorContainer.appendChild(tabsContainer);
    editorContainer.appendChild(barsArea);
    editorContainer.appendChild(controlsDiv);

    setupParamSpecifics(initialParamType);
    renderBarsInternal();
    createAndAppendPresetButtonsInternal();

    return editorContainer;
}

function createParticles(x, y, count) {
  const baseColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--particle-color")
      .trim() || "rgba(220, 240, 255, 0.7)";
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;
    const life = 0.6 + Math.random() * 0.6;
    activeParticles.push({
      id: particleIdCounter++,
      x: x + (Math.random() - 0.5) * 5,
      y: y + (Math.random() - 0.5) * 5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      radius: 1 + Math.random() * 2,
      color: baseColor,
    });
  }
}

function createWindParticles(count) {
  const windColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--wind-particle-color")
      .trim() || "rgba(180, 210, 230, 0.3)";
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 0.7 + Math.random() * Math.PI * 0.6;
    const speed = 0.3 + Math.random() * 0.4;
    windParticles.push({
      id: particleIdCounter++,
      x: Math.random() * canvas.width * 1.2 - canvas.width * 0.1,
      y: -10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 20,
      maxLife: 40,
      radius: 0.5 + Math.random() * 1.0,
      color: windColor,
    });
  }
}

function updateOrbitoneNoteDisplay(node, container) {
  if (!node || !container || !node.audioParams) return;
  const params = node.audioParams;
  const freqs = getOrbitoneFrequencies(
    params.scaleIndex,
    params.orbitoneCount,
    params.orbitoneIntervals,
    0,
    currentScale,
    params.pitch,
  );
  if (!freqs || freqs.length === 0) return;
  container.innerHTML = "";
  const baseMidi = frequencyToMidi(freqs[0]);
  const offsets = freqs.map((f) => frequencyToMidi(f) - baseMidi);
  const maxOffset = Math.max(1, ...offsets.map((o) => Math.abs(o)));
  for (let i = 0; i < freqs.length; i++) {
    const off = offsets[i];
    const noteName = getNoteName(
      frequencyToMidi(freqs[i]),
      NOTE_NAMES,
    );
    const wrap = document.createElement("div");
    wrap.classList.add("orbitone-note-bar-wrapper");
    const bar = document.createElement("div");
    bar.classList.add("orbitone-note-bar");
    bar.id = `orbitone-bar-node${node.id}-idx${i}`;
    const hPct = Math.max(2, (Math.abs(off) / maxOffset) * 100);
    bar.style.height = `${hPct}%`;
    const timingOff =
      i === 0
        ? 0
        : params.orbitoneTimingOffsets &&
          params.orbitoneTimingOffsets[i - 1] !== undefined
        ? params.orbitoneTimingOffsets[i - 1]
        : 0;
    wrap.style.marginLeft = i === 0 ? "0px" : `${Math.min(20, timingOff * 0.05)}px`;
    wrap.title = `${noteName} (${off >= 0 ? "+" : ""}${off.toFixed(1)} st)`;
    const label = document.createElement("div");
    label.classList.add("orbitone-note-label");
    label.textContent = `${off >= 0 ? "+" : ""}${off.toFixed(1)}`;
    wrap.appendChild(bar);
    wrap.appendChild(label);
    container.appendChild(wrap);
  }
}

function createOrbitoneNoteDisplay(node) {
  const container = document.createElement("div");
  container.classList.add("orbitone-notes-area");
  updateOrbitoneNoteDisplay(node, container);
  return container;
}

function highlightOrbitoneBar(nodeId, index, delayMs = 0) {
  const barId = `orbitone-bar-node${nodeId}-idx${index}`;
  setTimeout(() => {
    const bar = document.getElementById(barId);
    if (bar) {
      bar.classList.add("playing");
      setTimeout(() => bar.classList.remove("playing"), 150);
    }
  }, Math.max(0, delayMs));
}

function updateAndDrawParticles(deltaTime, now) {
  activeParticles = activeParticles.filter((p) => {
    p.x += p.vx * (deltaTime * 60);
    p.y += p.vy * (deltaTime * 60);
    p.vy += 0.02;
    p.life -= deltaTime;
    if (p.life <= 0) return false;
    const alpha = Math.max(0, (p.life / p.maxLife) * 0.9);
    try {
      ctx.fillStyle = p.color.replace(/[\d.]+\)$/g, `${alpha})`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    } catch (e) {}
    return true;
  });
  if (backgroundMode === 'stardrops') {
    if (Math.random() < 0.25) createWindParticles(1);
  }
  windParticles.forEach((p) => {
    p.x += p.vx * (deltaTime * 60);
    p.y += p.vy * (deltaTime * 60);
    const padding = 10;
    const worldTopLeft = getWorldCoords(-padding, -padding);
    const worldBottomRight = getWorldCoords(
      canvas.width + padding,
      canvas.height + padding,
    );
    const worldWidth = worldBottomRight.x - worldTopLeft.x;
    const worldHeight = worldBottomRight.y - worldTopLeft.y;
    if (p.y > worldBottomRight.y) {
      p.y = worldTopLeft.y;
      p.x = worldTopLeft.x + Math.random() * worldWidth;
    } else if (p.y < worldTopLeft.y) {
      p.y = worldBottomRight.y;
      p.x = worldTopLeft.x + Math.random() * worldWidth;
    }
    if (p.x > worldBottomRight.x) {
      p.x = worldTopLeft.x;
      p.y = worldTopLeft.y + Math.random() * worldHeight;
    } else if (p.x < worldTopLeft.x) {
      p.x = worldBottomRight.x;
      p.y = worldTopLeft.y + Math.random() * worldHeight;
    }
    const alpha = 0.3;
    if (backgroundMode === 'stardrops') {
      try {
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/g, `${alpha})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } catch (e) {}
    }
  });
}

function createVisualPulse(
  connId,
  dur,
  startNodeId,
  hopsLeft = Infinity,
  pulseType = "trigger",
  pulseColor = null,
  intensity = 1.0,
  broadcast = true,
) {
  if (!isAudioReady || dur <= 0) return;
  const connection = findConnectionById(connId);
  if (!connection) return;

  const targetNodeId =
    connection.nodeAId === startNodeId
      ? connection.nodeBId
      : connection.nodeAId;

  const visualPulse = {
    id: pulseIdCounter++,
    connectionId: connId,
    startTime: audioContext.currentTime,
    duration: dur,
    startNodeId: startNodeId,
    hopsLeft: hopsLeft,
    type: pulseType,
    color: pulseColor,
    intensity: intensity,

    granularGainNode: null,
    lastGrainTime: 0,
  };

  if (
    connection.type === "wavetrail" &&
    connection.audioParams?.buffer &&
    audioContext
  ) {
    try {
      visualPulse.granularGainNode = audioContext.createGain();
      visualPulse.granularGainNode.connect(masterGain);
      visualPulse.lastGrainTime = visualPulse.startTime;

      visualPulse.granularGainNode.gain.setValueAtTime(
        intensity * 0.7,
        visualPulse.startTime,
      );
    } catch (e) {
      console.error("Error creating granular gain node:", e);
      visualPulse.granularGainNode = null;
    }
  }

  activePulses.push(visualPulse);

  if (broadcast) {
  }

  if (connection.type === "string_violin") {
    visualPulse.audioStartTime = audioContext.currentTime;
    visualPulse.audioEndTime = audioContext.currentTime + dur;
    startStringSound(connection, visualPulse.intensity);
  }
  if (connection.type === "glide") {
    const sourceNode = findNodeById(startNodeId);
    const targetNode = findNodeById(targetNodeId);
    if (
      sourceNode &&
      targetNode &&
      sourceNode.audioParams?.pitch &&
      targetNode.audioParams?.pitch
    ) {
      try {
        const sourceFreq = sourceNode.audioParams.pitch;
        const targetFreq = targetNode.audioParams.pitch;
        startTravelingGlideSound(sourceNode, targetFreq, dur, intensity);
      } catch (e) {
        console.warn("Glide kon niet worden gestart:", e);
      }
    }
  }
}

function startTravelingGlideSound(
  sourceNode,
  targetFrequency,
  duration,
  intensity = 1.0,
) {
  if (
    !isAudioReady ||
    !sourceNode ||
    !sourceNode.audioNodes ||
    !sourceNode.audioParams
  ) {
    console.warn(
      "startTravelingGlideSound: Conditions not met (audio not ready, no source node/audionodes/audioparams).",
    );
    return;
  }

  const now = audioContext.currentTime;
  const waveform = sourceNode.audioParams.waveform;

  if (waveform && waveform.startsWith("sampler_")) {
    if (typeof startSamplerGlide_Granular === "function") {
      startSamplerGlide_Granular(
        sourceNode,
        targetFrequency,
        duration,
        0.14,
        0.04,
        intensity,
      );
    } else {
      console.warn("startSamplerGlide_Granular function is not defined.");
    }
    return;
  }

  const mainOscillator =
    sourceNode.audioNodes.oscillator1 || sourceNode.audioNodes.oscillator;
  const gainNodeToUse = sourceNode.audioNodes.gainNode;

  if (!mainOscillator || !gainNodeToUse) {
    console.warn(
      `startTravelingGlideSound: Main oscillator or gain node not found for node ${sourceNode.id}`,
    );
    return;
  }

  const startFreq = sourceNode.audioParams.pitch;
  const baseVol = 0.5;
  const clampedIntensity = Math.max(0.01, Math.min(1.0, intensity));
  const targetVol = baseVol * clampedIntensity;

  try {
    gainNodeToUse.gain.cancelScheduledValues(now);
    gainNodeToUse.gain.setValueAtTime(gainNodeToUse.gain.value, now);
    gainNodeToUse.gain.linearRampToValueAtTime(targetVol, now + 0.02);

    mainOscillator.frequency.cancelScheduledValues(now);
    mainOscillator.frequency.setValueAtTime(startFreq, now);
    mainOscillator.frequency.linearRampToValueAtTime(
      targetFrequency,
      now + duration,
    );

    gainNodeToUse.gain.setTargetAtTime(
      0.0001,
      now + duration * 0.95,
      duration * 0.1,
    );

    setTimeout(
      () => {
        const stillSourceNode = findNodeById(sourceNode.id);
        if (stillSourceNode) {
          stillSourceNode.isTriggered = false;

          if (
            stillSourceNode.audioNodes &&
            stillSourceNode.audioNodes.gainNode &&
            (!sourceNode.audioParams.ampEnv ||
              sourceNode.audioParams.ampEnv.sustain === 0)
          ) {
            stillSourceNode.audioNodes.gainNode.gain.setTargetAtTime(
              0,
              audioContext.currentTime,
              0.01,
            );
          }
        }
      },
      (duration + 0.1) * 1000,
    );
  } catch (e) {
    console.error("startTravelingGlideSound error:", e);
  }
}

function updateAndDrawPulses(now) {
  const defaultPulseColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--pulse-visual-color")
      .trim() || "rgba(255, 255, 255, 1)";
  const stringPulseColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--string-violin-pulse-color")
      .trim() || "#ffccaa";
  const wavetrailGlowColor = "rgba(230, 255, 230, 0.7)";
  const envelopeResolution = 128;
  const hanningWindowCurve = createHanningWindow(envelopeResolution);

  activePulses = activePulses.filter((p) => {
    const elapsedTime = now - p.startTime;
    const connection = findConnectionById(p.connectionId);

    if (!connection || elapsedTime >= p.duration) {
      if (
        connection &&
        connection.type === "string_violin" &&
        p.audioStartTime
      ) {
        stopStringSound(connection);
      }
      if (connection && connection.type === "wavetrail" && p.granularGainNode) {
        try {
          p.granularGainNode.gain.cancelScheduledValues(now);
          p.granularGainNode.gain.setTargetAtTime(0, now, 0.05);
          setTimeout(() => {
            if (p.granularGainNode) p.granularGainNode.disconnect();
          }, 60);
        } catch (e) {
          console.error("Error cleaning up granular gain node:", e);
        }
        p.granularGainNode = null;
      }
      return false;
    }

    const nodeA = findNodeById(connection.nodeAId);
    const nodeB = findNodeById(connection.nodeBId);
    if (!nodeA || !nodeB) return false;

    const progress = Math.min(1.0, elapsedTime / p.duration);

    let bufferDuration = 0;
    let pathData = null;
    let totalPathPoints = 0;
    let hasAudio = false;
    if (
      connection.type === "wavetrail" &&
      connection.audioParams?.buffer &&
      connection.audioParams?.waveformPath
    ) {
      bufferDuration = connection.audioParams.buffer.duration;
      pathData = connection.audioParams.waveformPath;
      totalPathPoints = pathData.length;
      hasAudio = true;
    }

    if (connection.type === "wavetrail" && hasAudio && bufferDuration > 0) {
      if (!p.granularGainNode && audioContext) {
        try {
          p.granularGainNode = audioContext.createGain();
          p.granularGainNode.connect(masterGain);
          p.lastGrainTime = p.startTime;

          p.granularGainNode.gain.setValueAtTime(
            (p.intensity || 1.0) * 0.7,
            p.startTime,
          );
        } catch (e) {
          p.granularGainNode = null;
        }
      }

      if (p.granularGainNode) {
        const grainDuration = connection.audioParams.grainDuration || 0.09;
        const grainOverlap = connection.audioParams.grainOverlap || 0.07;
        const grainInterval = Math.max(0.005, grainDuration - grainOverlap);
        const playbackRate = connection.audioParams.playbackRate || 1.0;

        const startTimeOffset = connection.audioParams.startTimeOffset || 0;
        const endTimeOffset =
          connection.audioParams.endTimeOffset ?? bufferDuration;
        const actualEndTime = Math.max(startTimeOffset + 0.01, endTimeOffset);
        const effectiveDuration = actualEndTime - startTimeOffset;

        const isReverse = p.startNodeId === connection.nodeBId;

        let currentBufferTime;
        if (isReverse) {
          currentBufferTime =
            startTimeOffset + (1.0 - progress) * effectiveDuration;
        } else {
          currentBufferTime = startTimeOffset + progress * effectiveDuration;
        }

        if (now - p.lastGrainTime >= grainInterval && effectiveDuration > 0) {
          try {
            const grainSource = audioContext.createBufferSource();
            grainSource.buffer = connection.audioParams.buffer;

            grainSource.playbackRate.setValueAtTime(playbackRate, now);

            const grainGain = audioContext.createGain();
            grainGain.gain.setValueAtTime(0, now);
            grainGain.gain.setValueCurveAtTime(
              hanningWindowCurve,
              now,
              grainDuration,
            );
            grainSource.connect(grainGain);
            grainGain.connect(p.granularGainNode);

            const offset = Math.max(
              0,
              Math.min(bufferDuration - 0.001, currentBufferTime),
            );
            const duration = Math.min(
              grainDuration / playbackRate,
              bufferDuration - offset,
            );

            if (duration > 0.001) {
              grainSource.start(now, offset, duration);
              grainSource.onended = () => {
                try {
                  grainSource.disconnect();
                  grainGain.disconnect();
                } catch (e) {}
              };
            } else {
              try {
                grainSource.disconnect();
                grainGain.disconnect();
              } catch (e) {}
            }
            p.lastGrainTime = now;
          } catch (grainError) {
            console.error(
              `Error creating audio grain for pulse ${p.id}:`,
              grainError,
            );
          }
        }
      }
    }

    let pX, pY;
    if (connection.type === 'string_violin') {
      const point = getStringConnectionPoint(connection, progress);
      pX = point.x; pY = point.y;
    } else {
      const startNodeForDraw = p.startNodeId === nodeA.id ? nodeA : nodeB;
      const startPos = getConnectionPoint(startNodeForDraw, startNodeForDraw.id === nodeA.id ? connection.nodeAHandle : connection.nodeBHandle);
      const endPos = getConnectionPoint(startNodeForDraw.id === nodeA.id ? nodeB : nodeA, startNodeForDraw.id === nodeA.id ? connection.nodeBHandle : connection.nodeAHandle);
      const midX = (startPos.x + endPos.x) / 2 + connection.controlPointOffsetX;
      const midY = (startPos.y + endPos.y) / 2 + connection.controlPointOffsetY;
      pX = lerp(
        lerp(startPos.x, midX, progress),
        lerp(midX, endPos.x, progress),
        progress,
      );
      pY = lerp(
        lerp(startPos.y, midY, progress),
        lerp(midY, endPos.y, progress),
        progress,
      );
    }

    if (connection.type === "wavetrail" && hasAudio) {
      let currentAmplitude = 0;
      let positiveGlowAmplitude = 0;
      let negativeGlowAmplitude = 0;

      const startTimeOffset = connection.audioParams.startTimeOffset || 0;
      const endTimeOffset =
        connection.audioParams.endTimeOffset ?? bufferDuration;
      const actualEndTime = Math.max(startTimeOffset + 0.01, endTimeOffset);
      const effectiveDuration = actualEndTime - startTimeOffset;
      const isReverse = p.startNodeId === connection.nodeBId;
      let currentBufferTime;
      if (isReverse) {
        currentBufferTime =
          startTimeOffset + (1.0 - progress) * effectiveDuration;
      } else {
        currentBufferTime = startTimeOffset + progress * effectiveDuration;
      }
      const audioProgress = currentBufferTime / bufferDuration;
      const i = Math.max(
        0,
        Math.min(
          totalPathPoints - 1,
          Math.floor(audioProgress * totalPathPoints),
        ),
      );
      if (pathData[i]) {
        currentAmplitude = Math.abs(pathData[i].max - pathData[i].min);
        positiveGlowAmplitude = pathData[i].max > 0 ? pathData[i].max : 0;
        negativeGlowAmplitude = pathData[i].min < 0 ? pathData[i].min : 0;
      }

      if (currentAmplitude > 0.05) {
        ctx.save();

        const glowLineWidth = (1.5 + currentAmplitude * 3.0) / viewScale;
        const glowAlpha = Math.min(0.7, 0.2 + currentAmplitude * 0.5);
        const glowBlur = (12 + currentAmplitude * 18) / viewScale;
        const maxVisualAmplitude = 15 / viewScale;
        const dx_glow = nodeB.x - nodeA.x;
        const dy_glow = nodeB.y - nodeA.y;
        const lineAngle_glow = Math.atan2(dy_glow, dx_glow);
        const perpAngle_glow = lineAngle_glow + Math.PI / 2;
        const topGlowOffsetX =
          Math.cos(perpAngle_glow) *
          positiveGlowAmplitude *
          maxVisualAmplitude *
          1.1;
        const topGlowOffsetY =
          Math.sin(perpAngle_glow) *
          positiveGlowAmplitude *
          maxVisualAmplitude *
          1.1;
        const bottomGlowOffsetX =
          Math.cos(perpAngle_glow) *
          negativeGlowAmplitude *
          maxVisualAmplitude *
          1.1;
        const bottomGlowOffsetY =
          Math.sin(perpAngle_glow) *
          negativeGlowAmplitude *
          maxVisualAmplitude *
          1.1;

        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = wavetrailGlowColor.replace(
          /[\d\.]+\)$/g,
          `${glowAlpha})`,
        );
        ctx.lineWidth = glowLineWidth;
        ctx.shadowColor = wavetrailGlowColor.replace(
          /[\d\.]+\)$/g,
          `${glowAlpha * 0.7})`,
        );
        ctx.shadowBlur = glowBlur;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pX + bottomGlowOffsetX, pY + bottomGlowOffsetY);
        ctx.lineTo(pX + topGlowOffsetX, pY + topGlowOffsetY);
        ctx.stroke();

        ctx.restore();
      }
    } else {
      drawStandardPulseVisual(p, pX, pY, connection, progress);
    }

    return true;
  });
}


function drawStandardPulseVisual(p, pX, pY, connection, progress) {
  const defaultPulseColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--pulse-visual-color")
      .trim() || "rgba(255, 255, 255, 1)";
  const stringPulseColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--string-violin-pulse-color")
      .trim() || "#ffccaa";

  let colorToUse = p.color || defaultPulseColor;
  let pulseSize = PULSE_SIZE / viewScale;
  let shadowBlurSize = 8 / viewScale;

  if (connection.type === "string_violin") {
    colorToUse = p.color || stringPulseColor;
    pulseSize *= 0.9;
    shadowBlurSize = 6 / viewScale;
  }

  ctx.save();
  ctx.fillStyle = colorToUse;
  ctx.shadowColor = colorToUse;
  ctx.shadowBlur = shadowBlurSize;
  ctx.beginPath();
  ctx.arc(pX, pY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const nodeA = findNodeById(connection.nodeAId);
  const nodeB = findNodeById(connection.nodeBId);
  if (nodeA && nodeB) {
    const startNodeForDraw = p.startNodeId === nodeA.id ? nodeA : nodeB;
    const startPos = getConnectionPoint(startNodeForDraw, startNodeForDraw.id === nodeA.id ? connection.nodeAHandle : connection.nodeBHandle);
    const endPos = getConnectionPoint(startNodeForDraw.id === nodeA.id ? nodeB : nodeA, startNodeForDraw.id === nodeA.id ? connection.nodeBHandle : connection.nodeAHandle);
    const midX = (startPos.x + endPos.x) / 2 + connection.controlPointOffsetX;
    const midY = (startPos.y + endPos.y) / 2 + connection.controlPointOffsetY;

    let angle;
    if (connection.type === 'string_violin') {
      const prevPoint = getStringConnectionPoint(connection, Math.max(0, progress - 0.02));
      angle = Math.atan2(pY - prevPoint.y, pX - prevPoint.x);
    } else {
      const prevProgress = Math.max(0, progress - 0.02);
      const prevXCalc = lerp(
        lerp(startPos.x, midX, prevProgress),
        lerp(midX, endPos.x, prevProgress),
        prevProgress,
      );
      const prevYCalc = lerp(
        lerp(startPos.y, midY, prevProgress),
        lerp(midY, endPos.y, prevProgress),
        prevProgress,
      );
      angle = Math.atan2(pY - prevYCalc, pX - prevXCalc);
    }
    const tailLength = (5 + p.duration * 30) / viewScale;

    ctx.beginPath();
    ctx.moveTo(
      pX + Math.cos(angle + Math.PI * 0.8) * pulseSize * 0.5,
      pY + Math.sin(angle + Math.PI * 0.8) * pulseSize * 0.5,
    );
    ctx.lineTo(
      pX + Math.cos(angle + Math.PI) * tailLength,
      pY + Math.sin(angle + Math.PI) * tailLength,
    );
    ctx.lineTo(
      pX + Math.cos(angle - Math.PI * 0.8) * pulseSize * 0.5,
      pY + Math.sin(angle - Math.PI * 0.8) * pulseSize * 0.5,
    );
    ctx.closePath();
    const tailGradient = ctx.createLinearGradient(
      pX,
      pY,
      pX + Math.cos(angle + Math.PI) * tailLength,
      pY + Math.sin(angle + Math.PI) * tailLength,
    );
    const alpha = Math.max(0, 1.0 - progress);
    try {
      tailGradient.addColorStop(
        0,
        colorToUse.replace(/[\d\.]+\)$/g, `${alpha})`),
      );
      tailGradient.addColorStop(1, colorToUse.replace(/[\d\.]+\)$/g, "0)"));
    } catch (e) {}
    ctx.fillStyle = tailGradient;
    ctx.fill();
  }
  ctx.restore();
}

function createHanningWindow(length) {
  const curve = new Float32Array(length);
  if (length <= 1) {
    if (length === 1) curve[0] = 1;
    return curve;
  }
  for (let i = 0; i < length; i++) {
    curve[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
  }
  return curve;
}


















export function saveState() {
  if (isPerformingUndoRedo) return;
  unsavedChanges = true;


  const bufferMap = new Map();
  const pathMap = new Map();

  nodes.forEach((node) => {
      if (node.audioParams?.buffer) {
          bufferMap.set(`node_${node.id}`, node.audioParams.buffer);
      }
      
  });
  connections.forEach((conn) => {
      if (conn.audioParams?.buffer) {
          bufferMap.set(`conn_${conn.id}`, conn.audioParams.buffer);
      }
      if (conn.audioParams?.waveformPath) {
          pathMap.set(`conn_${conn.id}`, conn.audioParams.waveformPath);
      }
  });



  const stateToSerialize = {
      nodes: nodes,
      connections: connections,
      selectedElements: Array.from(selectedElements),
      fluctuatingGroupNodeIDs: Array.from(fluctuatingGroupNodeIDs),
      nodeIdCounter: nodeIdCounter,
      connectionIdCounter: connectionIdCounter,
      isGlobalSyncEnabled: isGlobalSyncEnabled,
      globalBPM: globalBPM,
      viewOffsetX: viewOffsetX,
      viewOffsetY: viewOffsetY,
      viewScale: viewScale,
      currentScaleKey: currentScaleKey,
      currentRootNote: currentRootNote,
      globalTransposeOffset: globalTransposeOffset,
      pianoRollMode: pianoRollMode,
      pianoRollOctave: pianoRollOctave,
      masterVolume: masterGain?.gain.value ?? 0.8,
      delaySend: masterDelaySendGain?.gain.value ?? 0.3,
      delayTime: delayNode?.delayTime.value ?? 0.25,
      delayFeedback: delayFeedbackGain?.gain.value ?? 0.4,
      portalVolume: portalGroupGain?.gain.value ?? 0.7,
      originalNebulaVolume: originalNebulaGroupGain?.gain.value ?? 0.8,
      currentIRUrl: currentIRUrl || (impulseResponses.length > 0 ? impulseResponses[0].url : "reverb.wav"),
      reverbWetLevel: reverbWetGain?.gain.value ?? 0.5,
      reverbPreDelayTime: reverbPreDelayNode?.delayTime.value ?? 0.02,
      reverbDampingFreq: reverbLowPass?.frequency.value ?? DEFAULT_REVERB_DAMP_FREQ,
      reverbLowCutFreq: reverbHighPass?.frequency.value ?? 100,
      performanceResoLevel: perfResoGain?.gain.value ?? PERF_RESO_WET,
      performanceResoDelay: perfResoDelay?.delayTime.value ?? PERF_RESO_DELAY_TIME,
      performanceResoFeedback: perfResoFeedback?.gain.value ?? PERF_RESO_FEEDBACK,
      performanceResoFreq: perfResoFilter?.frequency.value ?? PERF_RESO_FREQ,
      performanceResoQ: perfResoFilter?.Q.value ?? PERF_RESO_Q,
      performanceResoEnabled: perfResoEnabled,
      performanceReverbLevel: perfReverbWetGain?.gain.value ?? PERF_REVERB_WET,
      performanceReverbDecay: perfReverbFeedbackGains[0]?.gain.value ?? PERF_REVERB_DECAY,
      performanceReverbSize: perfReverbSize,
      performanceReverbDamp: perfReverbLowPass?.frequency.value ?? DEFAULT_REVERB_DAMP_FREQ,
      performanceReverbEnabled: perfReverbEnabled,
      mrfaEnabled: mrfaEnabled,
      mrfaBandValues: mrfaGains.map(g => g.gain.value),
      userDefinedGroups: userDefinedGroups.map(group => ({...group, nodeIds: Array.from(group.nodeIds) })),
      mistGroups: patchState.mistGroups.map(g => ({
          patches: g.patches.map(p => ({ x: p.x, y: p.y, size: p.size }))
      }))
  };


  const replacer = (key, value) => {
      if (key === "audioNodes" || key === "buffer" || key === "waveformPath" || key === "activeRetriggers" || key === "triggeredInThisSweep") {
          return undefined;
      }
      if (value instanceof Set) {
          return Array.from(value);
      }
      return value;
  };
  const stateString = JSON.stringify(stateToSerialize, replacer);

  const loadedState = JSON.parse(stateString);


  loadedState.nodes.forEach(node => {
      if (bufferMap.has(`node_${node.id}`)) {
          if (!node.audioParams) node.audioParams = {};
          node.audioParams.buffer = bufferMap.get(`node_${node.id}`);
      }
  });
  loadedState.connections.forEach(conn => {
      if (bufferMap.has(`conn_${conn.id}`) || pathMap.has(`conn_${conn.id}`)) {
         if (!conn.audioParams) conn.audioParams = {};
          if (bufferMap.has(`conn_${conn.id}`)) {
              conn.audioParams.buffer = bufferMap.get(`conn_${conn.id}`);
          }
          if (pathMap.has(`conn_${conn.id}`)) {
              conn.audioParams.waveformPath = pathMap.get(`conn_${conn.id}`);
          }
      }
  });
  loadedState.userDefinedGroups.forEach(group => {
      group.nodeIds = new Set(group.nodeIds);
  });
  if (loadedState.mistGroups) {
      patchState.mistGroups = [];
      if (mistLayer) mistLayer.innerHTML = "";
      loadedState.mistGroups.forEach(g => {
          const container = document.createElement('div');
          container.className = 'mist-group';
          if (mistLayer) mistLayer.appendChild(container);
          const newGroup = { container, patches: [] };
          g.patches.forEach(p => {
              const patchEl = document.createElement('div');
              patchEl.className = 'mist-patch';
              const size = p.size || 200;
              patchEl.style.width = size + 'px';
              patchEl.style.height = size + 'px';
              const coords = getScreenCoords(p.x, p.y);
              patchEl.style.left = coords.x - size / 2 + 'px';
              patchEl.style.top = coords.y - size / 2 + 'px';
              const gradientString = 'radial-gradient(circle at 50% 50%, rgba(150,100,255,0.35) 0%, transparent 70%)';
              patchEl.style.backgroundImage = gradientString;
              patchEl.style.setProperty('--dx', `${Math.random() * 20 - 10}px`);
              patchEl.style.setProperty('--dy', `${Math.random() * 20 - 10}px`);
              patchEl.style.setProperty('--duration', `${12 + Math.random() * 6}s`);
              patchEl.style.setProperty('--hueDuration', `${20 + Math.random() * 10}s`);
              patchEl.dataset.x = p.x;
              patchEl.dataset.y = p.y;
              container.appendChild(patchEl);
              newGroup.patches.push({ element: patchEl, x: p.x, y: p.y, size });
          });
          patchState.mistGroups.push(newGroup);
      });
      updateMistWetness();
  }



  if (historyIndex < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyIndex + 1);
  }
  historyStack.push(loadedState);
  if (historyStack.length > MAX_HISTORY_SIZE) {
      historyStack.shift();
  }
  historyIndex = historyStack.length - 1;
  try {
      localStorage.setItem('resonaut_state', stateString);
  } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
  }
}

async function loadState(stateToLoad) {
    if (!stateToLoad || !stateToLoad.nodes || !stateToLoad.connections) {
        console.error("Invalid state object provided to loadState.");
        return;
    }

    isPerformingUndoRedo = true;

    
    nodes.forEach((node) => stopNodeAudio(node));
    connections.forEach((conn) => stopConnectionAudio(conn));
    activePulses = [];
    activeRockets.forEach((rocket) => {
        if (rocket.audioNodes?.engineSound) {
            try {
                rocket.audioNodes.engineSound.stop();
            } catch (e) {}
        }
    });
    activeRockets = [];

    
    const filteredNodes = stateToLoad.nodes.filter(n => n.type !== PRORB_TYPE);
    const removedIds = new Set(stateToLoad.nodes
        .filter(n => n.type === PRORB_TYPE)
        .map(n => n.id));
    const filteredConnections = stateToLoad.connections.filter(c =>
        !removedIds.has(c.nodeAId) && !removedIds.has(c.nodeBId)
    );

    nodes = filteredNodes;
    if (typeof window !== 'undefined') {
        window.nodes = nodes;
    }
    connections = filteredConnections;
    nodeIdCounter = stateToLoad.nodeIdCounter;
    connectionIdCounter = stateToLoad.connectionIdCounter;

    
    isGlobalSyncEnabled = stateToLoad.isGlobalSyncEnabled;
    globalBPM = stateToLoad.globalBPM;
    viewOffsetX = stateToLoad.viewOffsetX || 0;
    viewOffsetY = stateToLoad.viewOffsetY || 0;
    viewScale = stateToLoad.viewScale || 1.0;
    currentRootNote = stateToLoad.currentRootNote || 0;
    globalTransposeOffset = stateToLoad.globalTransposeOffset || 0;
    pianoRollMode = stateToLoad.pianoRollMode || 'piano';
    pianoRollOctave =
      stateToLoad.pianoRollOctave !== undefined
        ? stateToLoad.pianoRollOctave
        : 0;
    mrfaEnabled = stateToLoad.mrfaEnabled || false;
    if (openPerformancePanelBtn) openPerformancePanelBtn.classList.remove("hidden");
    if (perfResoGain) perfResoGain.gain.value = (stateToLoad.performanceResoEnabled ?? false) ? (stateToLoad.performanceResoLevel ?? PERF_RESO_WET) : 0.0;
    if (perfResoInput) perfResoInput.gain.value = (stateToLoad.performanceResoEnabled ?? false) ? 1.0 : 0.0;
    if (perfResoDelay) perfResoDelay.delayTime.value = stateToLoad.performanceResoDelay ?? PERF_RESO_DELAY_TIME;
    if (perfResoFeedback) perfResoFeedback.gain.value = stateToLoad.performanceResoFeedback ?? PERF_RESO_FEEDBACK;
    if (perfResoFilter) {
        perfResoFilter.frequency.value = stateToLoad.performanceResoFreq ?? PERF_RESO_FREQ;
        perfResoFilter.Q.value = stateToLoad.performanceResoQ ?? PERF_RESO_Q;
    }
    perfResoEnabled = stateToLoad.performanceResoEnabled ?? false;
    if (perfReverbWetGain) perfReverbWetGain.gain.value = (stateToLoad.performanceReverbEnabled ?? false) ? (stateToLoad.performanceReverbLevel ?? PERF_REVERB_WET) : 0.0;
    if (perfReverbInput) perfReverbInput.gain.value = (stateToLoad.performanceReverbEnabled ?? false) ? 1.0 : 0.0;
    perfReverbEnabled = stateToLoad.performanceReverbEnabled ?? false;
    if (perfReverbFeedbackGains.length && stateToLoad.performanceReverbDecay !== undefined) {
        perfReverbFeedbackGains.forEach(g => g.gain.value = stateToLoad.performanceReverbDecay);
    }
    if (stateToLoad.performanceReverbSize !== undefined) {
        perfReverbSize = stateToLoad.performanceReverbSize;
        perfReverbDelayNodes.forEach((d, idx) => {
            d.delayTime.value = PERF_REVERB_BASE_TIMES[idx] * perfReverbSize;
        });
    }
    if (perfReverbLowPass && stateToLoad.performanceReverbDamp !== undefined) {
        perfReverbLowPass.frequency.value = stateToLoad.performanceReverbDamp;
    }
    if (mrfaWetGain) mrfaWetGain.gain.value = mrfaEnabled ? 1.0 : 0.0;
    if (mrfaDryGain) mrfaDryGain.gain.value = mrfaEnabled ? 0.0 : 1.0;
    if (mrfaDirectGain) mrfaDirectGain.gain.value = 1.0;
    updateMRFADirectGain();
    if (stateToLoad.mrfaBandValues && mrfaGains.length === stateToLoad.mrfaBandValues.length) {
        stateToLoad.mrfaBandValues.forEach((v, idx) => {
            mrfaGains[idx].gain.value = v;
            const slider = mrfaBandSliders[idx];
            if (slider) slider.value = v;
            const valueSpan = document.getElementById(`mrfaVal${idx + 1}`);
            if (valueSpan) valueSpan.textContent = parseFloat(v).toFixed(2);
        });
    }
    
    
    changeScale(stateToLoad.currentScaleKey || "major", true);

    
    if (Array.isArray(stateToLoad.selectedElements)) {
        selectedElements = new Set(
            stateToLoad.selectedElements.map(el => ({ ...el }))
        );
    }
    fluctuatingGroupNodeIDs = new Set(stateToLoad.fluctuatingGroupNodeIDs || []);

    
    if (isAudioReady) {
        nodes.forEach((node) => {
            node.connections = new Set(node.connections); 
            node.audioNodes = createAudioNodesForNode(node);
            if (node.audioNodes) {
                updateNodeAudioParams(node);
            }
        });
        connections.forEach((conn) => {
            conn.audioNodes = createAudioNodesForConnection(conn);
            if (conn.audioNodes) {
                updateConnectionAudioParams(conn);
            }
        });
        identifyAndRouteAllGroups();
        updateMixerGUI();
        initializeGlobalEffectSliders();
    }

    isPerformingUndoRedo = false;

    
    populateEditPanel();
    updateConstellationGroup();
    updateSyncUI();
    updateScaleAndTransposeUI();
  drawPianoRoll();
  draw();
}

function loadStateFromLocalStorage() {
  try {
    const saved = localStorage.getItem('resonaut_state');
    if (saved) {
      const loadedState = JSON.parse(saved);
      if (loadedState && loadedState.nodes && loadedState.connections) {
        loadState(loadedState);
        unsavedChanges = false;
      }
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
}


function startSamplerGlide_Granular(
  sourceNode,
  targetFreq,
  duration,
  grainDuration = 0.15,
  overlap = 0.05,
  intensity = 1.0,
) {
  if (
    !isAudioReady ||
    !sourceNode ||
    !sourceNode.audioParams ||
    !sourceNode.audioParams.waveform.startsWith("sampler_")
  )
    return;

  const samplerId = sourceNode.audioParams.waveform.replace("sampler_", "");
  const def = SAMPLER_DEFINITIONS?.find((s) => s.id === samplerId);
  if (!def?.isLoaded || !def.buffer || !def.baseFreq) return;

  const now = audioContext.currentTime;
  const baseFreq = def.baseFreq;
  const fromFreq = sourceNode.audioParams.pitch;
  const grains = Math.ceil(duration / (grainDuration - overlap));

  for (let i = 0; i < grains; i++) {
    const t = i / (grains - 1);
    const interpFreq = fromFreq + (targetFreq - fromFreq) * t;
    const rate = Math.max(0.1, Math.min(4, interpFreq / baseFreq));
    const startTime = now + i * (grainDuration - overlap);

    const src = audioContext.createBufferSource();
    src.buffer = def.buffer;
    src.playbackRate.setValueAtTime(rate, startTime);

    const g = audioContext.createGain();
    const baseVol = 0.8 + sourceNode.size * 0.3;
    const vol = baseVol * intensity * (1 - Math.abs(0.5 - t));
    g.gain.setValueAtTime(vol, startTime);
    g.gain.linearRampToValueAtTime(0.001, startTime + grainDuration);

    src.connect(g);
    const target =
      sourceNode.audioNodes?.lowPassFilter ||
      sourceNode.audioNodes?.gainNode ||
      masterGain;
    g.connect(target);
    src.start(startTime);
    src.stop(startTime + grainDuration + 0.02);
  }
}

function startStringSound(connection, intensity = 1.0) {
  if (!connection.audioNodes || connection.type !== "string_violin") return;
  const now = audioContext.currentTime;
  const { gainNode } = connection.audioNodes;
  const params = connection.audioParams;
  const defaults = STRING_VIOLIN_DEFAULTS;
  const attackTime = params.attack ?? defaults.attack;
  const baseVolume = params.volume ?? defaults.volume;
  const targetVolume = baseVolume * intensity;
  const clampedVolume = Math.max(0.01, Math.min(1.0, targetVolume));
  try {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(clampedVolume, now + attackTime);
  } catch (e) {}
}

function stopStringSound(connection) {
  if (!connection.audioNodes || connection.type !== "string_violin") return;
  const now = audioContext.currentTime;
  const { gainNode } = connection.audioNodes;
  const params = connection.audioParams;
  const defaults = STRING_VIOLIN_DEFAULTS;
  const releaseTime = params.release ?? defaults.release;
  try {
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(0, now, releaseTime / 3);
  } catch (e) {}
}

export function stopNodeAudio(node) {
  if (!node || !node.audioNodes) return;
  try {
    if (node.type === "sound") {
      try {
        node.audioNodes.oscillator1?.stop();
        node.audioNodes.oscillator1?.disconnect();
      } catch (e) {}
      try {
        node.audioNodes.modulatorOsc1?.stop();
        node.audioNodes.modulatorOsc1?.disconnect();
      } catch (e) {}
      try {
        node.audioNodes.modulatorGain1?.disconnect();
      } catch (e) {}
      try {
        node.audioNodes.oscillator2?.stop();
        node.audioNodes.oscillator2?.disconnect();
      } catch (e) {}
      try {
        node.audioNodes.osc2Gain?.disconnect();
      } catch (e) {}

      if (node.audioNodes.orbitoneOscillators) {
        node.audioNodes.orbitoneOscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        });
      }
      if (node.audioNodes.orbitoneIndividualGains) {
        node.audioNodes.orbitoneIndividualGains.forEach((g) => {
          try {
            g.disconnect();
          } catch (e) {}
        });
      }
      if (node.audioNodes.orbitoneModulatorOscs) {
        node.audioNodes.orbitoneModulatorOscs.forEach((modOsc) => {
          try {
            modOsc.stop();
            modOsc.disconnect();
          } catch (e) {}
        });
      }
      if (node.audioNodes.orbitoneModulatorGains) {
        node.audioNodes.orbitoneModulatorGains.forEach((modGain) => {
          try {
            modGain.disconnect();
          } catch (e) {}
        });
      }
      if (node.audioNodes.chordSamplerSources) {
        node.audioNodes.chordSamplerSources.forEach((src) => {
          try {
            src.stop();
            src.disconnect();
          } catch (e) {}
        });
      }

      node.audioNodes.reverbSendGain?.disconnect();
      node.audioNodes.delaySendGain?.disconnect();
      try {
        node.audioNodes.volLfo?.stop();
      } catch (e) {}
      node.audioNodes.volLfo?.disconnect();
      node.audioNodes.volLfoGain?.disconnect();
      node.audioNodes.lowPassFilter?.disconnect();
      node.audioNodes.gainNode?.disconnect();
    } else if (node.type === "nebula") {
      try {
        node.audioNodes.filterLfo?.stop();
      } catch (e) {}
      try {
        node.audioNodes.volLfo?.stop();
      } catch (e) {}
      node.audioNodes.oscillators?.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      node.audioNodes.reverbSendGain?.disconnect();
      node.audioNodes.delaySendGain?.disconnect();
      node.audioNodes.filterLfoGain?.disconnect();
      node.audioNodes.volLfoGain?.disconnect();
      node.audioNodes.filterLfo?.disconnect();
      node.audioNodes.volLfo?.disconnect();
      node.audioNodes.gainNode?.disconnect();
      node.audioNodes.filterNode?.disconnect();
    } else if (node.type === PORTAL_NEBULA_TYPE) {
      try {
        node.audioNodes.droneOsc?.stop();
      } catch (e) {}
      try {
        node.audioNodes.droneFreqLfo?.stop();
      } catch (e) {}
      try {
        node.audioNodes.shimmerLfo?.stop();
      } catch (e) {}
      node.audioNodes.harmonics?.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      node.audioNodes.reverbSendGain?.disconnect();
      node.audioNodes.delaySendGain?.disconnect();
      node.audioNodes.shimmerLfoGain?.disconnect();
      node.audioNodes.shimmerLfo?.disconnect();
      node.audioNodes.harmonicGain?.disconnect();
      node.audioNodes.droneFreqLfoGain?.disconnect();
      node.audioNodes.droneFreqLfo?.disconnect();
      node.audioNodes.droneOsc?.disconnect();
      node.audioNodes.mainGain?.disconnect();
    } else if (node.type === ALIEN_ORB_TYPE || node.type === ALIEN_DRONE_TYPE) {
      if (node.audioNodes.orbitoneSynths) {
        node.audioNodes.orbitoneSynths.forEach((s) => {
          Object.values(s).forEach((n) => {
            try { if (n.stop) n.stop(); } catch(e){}
            try { if (n.disconnect) n.disconnect(); } catch(e){}
          });
        });
      }
      Object.values(node.audioNodes).forEach(n => {
        try { if (n.stop) n.stop(); } catch(e){}
        try { if (n.disconnect) n.disconnect(); } catch(e){}
      });
    } else if (node.type === ARVO_DRONE_TYPE) {
      stopArvoDroneAudioNodes(node.audioNodes);
    } else if (node.type === FM_DRONE_TYPE) {
      stopFmDroneAudioNodes(node.audioNodes);
    } else if (isDrumType(node.type)) {
      node.audioNodes.reverbSendGain?.disconnect();
      node.audioNodes.delaySendGain?.disconnect();
      node.audioNodes.mainGain?.disconnect();
    }
  } catch (e) {}
  node.audioNodes = null;
}

function stopConnectionAudio(connection) {
  if (
    !connection ||
    !connection.audioNodes ||
    connection.type !== "string_violin"
  )
    return;
  try {
    connection.audioNodes.vibratoLfo?.stop();
    connection.audioNodes.oscillators?.forEach((osc) => osc.stop());
    connection.audioNodes.reverbSendGain?.disconnect();
    connection.audioNodes.delaySendGain?.disconnect();
    connection.audioNodes.vibratoGain?.disconnect();
    connection.audioNodes.vibratoLfo?.disconnect();
    connection.audioNodes.gainNode?.disconnect();
    connection.audioNodes.filterNode?.disconnect();
    connection.audioNodes.oscillators?.forEach((osc) => osc.disconnect());
  } catch (e) {}
  connection.audioNodes = null;
}

function removeNode(nodeToRemove) {
  if (!nodeToRemove) return;
  const nodeIdsToRemove = new Set([nodeToRemove.id]);
  selectedElements.forEach((el) => {
    if (
      el.type === "node" &&
      el.id === nodeToRemove.id &&
      selectedElements.size > 1
    ) {
      selectedElements.forEach((selEl) => {
        if (selEl.type === "node") nodeIdsToRemove.add(selEl.id);
      });
    }
  });
  let stateChanged = false;
  nodeIdsToRemove.forEach((id) => {
    const node = findNodeById(id);
    if (!node) return;
    stateChanged = true;
    stopNodeAudio(node);
    const connectionsToRemove = connections.filter(
      (conn) => conn.nodeAId === id || conn.nodeBId === id,
    );
    connectionsToRemove.forEach((conn) => removeConnection(conn, false));
    nodes = nodes.filter((n) => n.id !== id);
    if (typeof window !== 'undefined') {
        window.nodes = nodes;
    }
    selectedElements = new Set(
      [...selectedElements].filter(
        (el) => !(el.type === "node" && el.id === id),
      ),
    );
    currentConstellationGroup.delete(id);
    fluctuatingGroupNodeIDs.delete(id);
    removeNodeFromParamGroups(id);
  });
  if (stateChanged) {
    updateConstellationGroup();
    populateEditPanel();
    saveState();
  }
}

function copySelectionToClipboard() {
  clipboardNodes = [...selectedElements]
    .filter((el) => el.type === "node")
    .map((el) => {
      const n = findNodeById(el.id);
      if (!n) return null;
      const clone = JSON.parse(JSON.stringify(n));
      clone.audioNodes = null;
      clone.connections = [];
      return clone;
    })
    .filter(Boolean);
}

function cutSelection() {
  copySelectionToClipboard();
  const toRemove = [...selectedElements];
  selectedElements.clear();
  toRemove.forEach((el) => {
    if (el.type === "node") removeNode(findNodeById(el.id));
    else if (el.type === "connection")
      removeConnection(findConnectionById(el.id));
  });
  populateEditPanel();
  saveState();
}

function pasteClipboard(offset = 20) {
  clipboardNodes.forEach((data) => {
    const newNode = addNode(
      data.x + offset,
      data.y + offset,
      data.type,
      null,
      { width: data.width, height: data.height },
    );
    if (newNode) {
      Object.assign(newNode, data, {
        id: newNode.id,
        x: data.x + offset,
        y: data.y + offset,
      });
      newNode.audioParams = JSON.parse(
        JSON.stringify(data.audioParams || {}),
      );
      newNode.audioNodes = createAudioNodesForNode(newNode);
      if (newNode.audioNodes) updateNodeAudioParams(newNode);
      selectedElements.add({ type: "node", id: newNode.id });
    }
  });
  populateEditPanel();
  saveState();
}

function connectNodes(nodeA, nodeB, type = "standard", options = {}) {
  if (
    !nodeA ||
    !nodeB ||
    nodeA === nodeB ||
    nodeA.type === "nebula" ||
    nodeB.type === "nebula" ||
    nodeA.type === PORTAL_NEBULA_TYPE ||
    nodeB.type === PORTAL_NEBULA_TYPE
  )
    return;
  const exists = connections.some(
    (c) =>
      (c.nodeAId === nodeA.id && c.nodeBId === nodeB.id) ||
      (c.nodeAId === nodeB.id && c.nodeBId === nodeA.id),
  );
  if (exists) return;

  nodeA.connections.add(nodeB.id);
  nodeB.connections.add(nodeA.id);
  const startPos = getConnectionPoint(nodeA, options.nodeAHandle);
  const endPos = getConnectionPoint(nodeB, options.nodeBHandle);
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const anglePerp = Math.atan2(dx, -dy);
  const ctrlOffsetMagnitude = Math.min(len * 0.15, 30);
  const ctrlOffsetX = Math.cos(anglePerp) * ctrlOffsetMagnitude;
  const ctrlOffsetY = Math.sin(anglePerp) * ctrlOffsetMagnitude;

  const newConnection = {
    id: connectionIdCounter++,
    nodeAId: nodeA.id,
    nodeBId: nodeB.id,
    directional: type === ONE_WAY_TYPE,
    length: len,
    controlPointOffsetX: ctrlOffsetX,
    controlPointOffsetY: ctrlOffsetY,
    nodeAHandle: !!options.nodeAHandle,
    nodeBHandle: !!options.nodeBHandle,
    type: type,
    isSelected: false,
    audioParams: {},
    audioNodes: null,
    animationState: 0,
  };

  if (type === "string_violin") {
    let initialScaleIndex = 0;
    if (
      noteIndexToAdd !== -1 &&
      noteIndexToAdd >= MIN_SCALE_INDEX &&
      noteIndexToAdd <= MAX_SCALE_INDEX
    ) {
      initialScaleIndex = noteIndexToAdd;
    } else {
      initialScaleIndex = Math.floor(
        Math.random() * currentScale.notes.length * 3,
      ) - currentScale.notes.length;
    }
    initialScaleIndex = Math.max(
      MIN_SCALE_INDEX,
      Math.min(MAX_SCALE_INDEX, initialScaleIndex),
    );
    let initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch)) {
      initialScaleIndex = 0;
      initialPitch = getFrequency(
        currentScale,
        0,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
    }
    newConnection.audioParams = {
      ...STRING_VIOLIN_DEFAULTS,
      scaleIndex: initialScaleIndex,
      pitch: initialPitch,
    };
    newConnection.audioNodes = createAudioNodesForConnection(newConnection);
    if (newConnection.audioNodes) {
      updateConnectionAudioParams(newConnection);
    }
} else if (type === "wavetrail") {
    newConnection.audioParams = {
        buffer: null,
        fileName: null,
        waveformPath: null,
        startTimeOffset: 0,
        endTimeOffset: null,
        grainDuration: 0.09,
        grainOverlap: 0.07,
        playbackRate: 1.0
    };
    newConnection.audioNodes = createAudioNodesForConnection(newConnection);
    if (newConnection.audioNodes) {
        updateConnectionAudioParams(newConnection);
    }
}



  connections.push(newConnection);
  createParticles(nodeB.x, nodeB.y, 15);
  updateConstellationGroup();
  identifyAndRouteAllGroups();
  saveState();
  if (
    helpWizard &&
    !helpWizard.classList.contains("hidden") &&
    currentHelpStep === 5
  ) {
    nextHelpStep();
  }
}

function removeConnection(connToRemove, updateGroup = true) {
  if (!connToRemove) return;
  stopConnectionAudio(connToRemove);
  const nodeA = findNodeById(connToRemove.nodeAId);
  const nodeB = findNodeById(connToRemove.nodeBId);
  if (nodeA) nodeA.connections.delete(connToRemove.nodeBId);
  if (nodeB) nodeB.connections.delete(connToRemove.nodeAId);
  connections.forEach((c) => {
    if (c.type === "switch" && c.primaryInputConnectionId === connToRemove.id) {
      c.primaryInputConnectionId = null;
    }
  });
  nodes.forEach((n) => {
    if (n.type === "switch" && n.primaryInputConnectionId === connToRemove.id) {
      n.primaryInputConnectionId = null;
    }
  });
  connections = connections.filter((c) => c.id !== connToRemove.id);
  activePulses = activePulses.filter((p) => p.connectionId !== connToRemove.id);
  selectedElements = new Set(
    [...selectedElements].filter(
      (el) => !(el.type === "connection" && el.id === connToRemove.id),
    ),
  );
  if (updateGroup) {
    updateConstellationGroup();
    saveState();
    identifyAndRouteAllGroups();
  }
}

function findConstellation(startNodeId) {
  const constellationNodes = new Set();
  const queue = [startNodeId];
  const visited = new Set([startNodeId]);
  const startNode = findNodeById(startNodeId);

  if (!startNode || !CONSTELLATION_NODE_TYPES.includes(startNode.type)) {
    return constellationNodes;
  }

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    const currentNode = findNodeById(currentNodeId);
    if (!currentNode) continue;

    if (CONSTELLATION_NODE_TYPES.includes(currentNode.type)) {
      constellationNodes.add(currentNodeId);
    }

    currentNode.connections.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const neighborNode = findNodeById(neighborId);

        if (
          neighborNode &&
          CONSTELLATION_NODE_TYPES.includes(neighborNode.type)
        ) {
          queue.push(neighborId);
        }
      }
    });
  }
  return constellationNodes;
}

function findGroupContainingNode(nodeId) {
  if (nodeId === null || nodeId === undefined) return null;
  return identifiedGroups.find((group) => group.nodeIds.has(nodeId));
}

function updateConstellationGroup() {
  if (!isAudioReady) return;

  const previousSelectedNodes = new Set(currentConstellationGroup);
  currentConstellationGroup.clear();
  nodes.forEach((n) => (n.isInConstellation = false));

  const selectedNodeElements = [...selectedElements].filter(
    (el) => el.type === "node",
  );
  const selectedNodeIds = new Set(selectedNodeElements.map((el) => el.id));

  if (selectedNodeIds.size > 0 && currentTool === "edit") {
    const firstSelectedId = selectedNodeIds.values().next().value;
    const firstSelectedNode = findNodeById(firstSelectedId);

    if (
      firstSelectedNode &&
      CONSTELLATION_NODE_TYPES.includes(firstSelectedNode.type)
    ) {
      const potentialConstellation = findConstellation(firstSelectedId);
      let allSelectedInGroup = true;
      selectedNodeIds.forEach((id) => {
        if (!potentialConstellation.has(id)) {
          allSelectedInGroup = false;
        }
      });

      if (allSelectedInGroup && potentialConstellation.size > 0) {
        potentialConstellation.forEach((id) => {
          const node = findNodeById(id);
          if (node) node.isInConstellation = true;
        });
        currentConstellationGroup = potentialConstellation;
      } else {
      }
    }
  }

  updateGroupControlsUI();

  updateFluctuatingNodesLFO();
}

function rerouteAudioForNode(node, destinationNode) {
  if (!node || !node.audioNodes || !isAudioReady || !destinationNode) {
    return;
  }

  const outputNode =
    node.audioNodes.gainNode ||
    node.audioNodes.mainGain ||
    node.audioNodes.output ||
    node.audioNodes.mix;
  if (!outputNode) {
    return;
  }

  const reverbSendGain = node.audioNodes.reverbSendGain;
  const delaySendGain = node.audioNodes.delaySendGain;
  const mistSendGain = node.audioNodes.mistSendGain;
  const crushSendGain = node.audioNodes.crushSendGain;

  try {
    outputNode.disconnect();
    outputNode.connect(destinationNode);

    if (reverbSendGain && isReverbReady && reverbNode) {
      outputNode.connect(reverbSendGain);
    }
    if (delaySendGain && isDelayReady && masterDelaySendGain) {
      outputNode.connect(delaySendGain);
    }
    if (mistSendGain && mistEffectInput) {
      outputNode.connect(mistSendGain);
    }
    if (crushSendGain && crushEffectInput) {
      outputNode.connect(crushSendGain);
    }
  } catch (e) {
    try {
      outputNode.disconnect();
      outputNode.connect(masterGain);
      if (reverbSendGain && isReverbReady && reverbNode)
        outputNode.connect(reverbSendGain);
      if (delaySendGain && isDelayReady && masterDelaySendGain)
        outputNode.connect(delaySendGain);
      if (mistSendGain && mistEffectInput)
        outputNode.connect(mistSendGain);
      if (crushSendGain && crushEffectInput)
        outputNode.connect(crushSendGain);
    } catch (e2) {}
  }
}

function updateGroupControlsUI() {
  const selectionIsGroup = currentConstellationGroup.size > 0;
  if (groupControlsDiv) {
    groupControlsDiv.classList.toggle("hidden", !selectionIsGroup);
    if (selectionIsGroup) {
      groupNodeCountSpan.textContent = currentConstellationGroup.size;

      const firstSelectedNodeId = currentConstellationGroup
        .values()
        .next().value;
      const selectedGroup = findGroupContainingNode(firstSelectedNodeId);

      if (selectedGroup && selectedGroup.gainNode && groupVolumeSlider) {
        const currentGroupVol = selectedGroup.gainNode.gain.value;
        groupVolumeSlider.value = currentGroupVol;
        const originalLabel = document.querySelector(
          'label[for="groupVolumeSlider"]',
        );
        if (originalLabel && originalLabel.textContent.includes("(")) {
          originalLabel.textContent = `Group Volume (${currentGroupVol.toFixed(2)}):`;
        }
      } else if (groupVolumeSlider) {
        groupVolumeSlider.value = 1.0;
        const originalLabel = document.querySelector(
          'label[for="groupVolumeSlider"]',
        );
        if (originalLabel && originalLabel.textContent.includes("(")) {
          originalLabel.textContent = `Group Volume (--.--):`;
        }
      }

      let isGroupFluctuating = false;
      if (currentConstellationGroup.size > 0) {
        isGroupFluctuating = [...currentConstellationGroup].some((id) =>
          fluctuatingGroupNodeIDs.has(id),
        );
      }
      groupFluctuateToggle.checked = isGroupFluctuating;
      groupFluctuateAmount.disabled = !isGroupFluctuating;
    }
  }
  updateRestartPulsarsButtonVisibility();
  updateReplaceMenuState();
}



function updateTapeTimerDisplay() {
  if (
    !isTapeLoopPlaying ||
    !tapeLoopSourceNode ||
    !tapeLoopBuffer ||
    !audioContext ||
    !tapeLoopTimer
  ) {
    if (tapeLoopTimer) tapeLoopTimer.textContent = formatTime(0);
    return;
  }

  const playbackRate = tapeLoopSourceNode.playbackRate.value;
  if (playbackRate === 0) {
    if (tapeLoopTimer)
      tapeLoopTimer.textContent = formatTime(
        tapeLoopSourceNodeStartOffsetInLoop,
      );
    return;
  }

  const timeElapsedSinceAudioStart =
    (audioContext.currentTime - tapeLoopSourceNodeStartTime) * playbackRate;
  const loopSegmentDuration =
    tapeLoopSourceNode.loopEnd - tapeLoopSourceNode.loopStart;

  if (loopSegmentDuration <= 0) {
    if (tapeLoopTimer)
      tapeLoopTimer.textContent = formatTime(tapeLoopSourceNode.loopStart);
    return;
  }

  let currentPositionWithinLoopSegment =
    timeElapsedSinceAudioStart % loopSegmentDuration;
  if (currentPositionWithinLoopSegment < 0)
    currentPositionWithinLoopSegment += loopSegmentDuration;

  const absoluteBufferPosition =
    tapeLoopSourceNode.loopStart + currentPositionWithinLoopSegment;

  tapeLoopTimer.textContent = formatTime(absoluteBufferPosition);
}

function drawTapeWaveform() {
  if (!tapeWaveformCtx || !tapeWaveformCanvas) {
    return;
  }

  let displayStart = tapeDisplayStartTime;
  let displayEnd = tapeDisplayEndTime;
  const hasBuffer = !!tapeLoopBuffer;
  const maxAvailableDuration =
    tapeLoopEffectivelyRecordedDuration > 0
      ? tapeLoopEffectivelyRecordedDuration
      : hasBuffer
        ? tapeLoopBuffer.duration
        : configuredTapeLoopDurationSeconds;

  if (displayEnd <= displayStart) {
    displayEnd =
      displayStart + Math.max(0.1, maxAvailableDuration - displayStart);
  }
  if (displayEnd > maxAvailableDuration && maxAvailableDuration > 0)
    displayEnd = maxAvailableDuration;
  if (displayStart >= displayEnd && displayEnd > 0.01)
    displayStart = Math.max(0, displayEnd - 0.01);
  else if (displayStart >= displayEnd) {
    displayStart = 0;
    displayEnd = maxAvailableDuration > 0.01 ? maxAvailableDuration : 0.01;
  }
  if (displayEnd <= displayStart) displayEnd = displayStart + 0.01;

  let clientWidth = tapeWaveformCanvas.clientWidth;
  let clientHeight = tapeWaveformCanvas.clientHeight;
  if (
    tapeWaveformCanvas.parentElement &&
    (clientWidth === 0 || clientHeight === 0)
  ) {
    clientWidth = tapeWaveformCanvas.parentElement.clientWidth || clientWidth;
    clientHeight =
      tapeWaveformCanvas.parentElement.clientHeight || clientHeight;
  }

  let dimensionsChanged = false;
  if (clientWidth > 0 && tapeWaveformCanvas.width !== clientWidth) {
    tapeWaveformCanvas.width = clientWidth;
    dimensionsChanged = true;
  }
  if (clientHeight > 0 && tapeWaveformCanvas.height !== clientHeight) {
    tapeWaveformCanvas.height = clientHeight;
    dimensionsChanged = true;
  }

  if (dimensionsChanged) {
    waveformPathData = null;
  }

  if (tapeWaveformCanvas.width <= 0 || tapeWaveformCanvas.height <= 0) {
    return;
  }

  tapeWaveformCtx.clearRect(
    0,
    0,
    tapeWaveformCanvas.width,
    tapeWaveformCanvas.height,
  );

  if (!hasBuffer && configuredTapeLoopDurationSeconds <= 0) {
    waveformPathData = null;
    return;
  }

  if (!waveformPathData && hasBuffer) {
    const channelData = tapeLoopBuffer.getChannelData(0);
    const canvasWidth = tapeWaveformCanvas.width;

    const currentSampleRate = audioContext?.sampleRate || 44100;
    const startSampleAbs = Math.floor(displayStart * currentSampleRate);
    const endSampleAbs = Math.floor(displayEnd * currentSampleRate);
    const samplesToVisualize = Math.max(1, endSampleAbs - startSampleAbs);
    const samplesPerPixel = samplesToVisualize / canvasWidth;

    waveformPathData = [];
    if (channelData.length > 0 && canvasWidth > 0 && samplesToVisualize > 0) {
      for (let i = 0; i < canvasWidth; i++) {
        let min = 1.0;
        let max = -1.0;
        const sliceStartInBuffer =
          startSampleAbs + Math.floor(i * samplesPerPixel);
        const sliceEndInBuffer =
          startSampleAbs + Math.floor((i + 1) * samplesPerPixel);
        const actualSliceStart = Math.min(
          sliceStartInBuffer,
          channelData.length - 1,
        );
        const actualSliceEnd = Math.min(sliceEndInBuffer, channelData.length);

        if (actualSliceStart < actualSliceEnd) {
          for (let j = actualSliceStart; j < actualSliceEnd; j++) {
            const datum = channelData[j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
        } else if (
          actualSliceStart === actualSliceEnd &&
          actualSliceStart < channelData.length
        ) {
          const datum = channelData[actualSliceStart];
          min = datum;
          max = datum;
        } else {
          min = 0;
          max = 0;
        }
        waveformPathData.push({ min, max });
      }
    }
  } else if (!hasBuffer && !waveformPathData) {
    tapeWaveformCtx.strokeStyle = "rgba(100, 100, 110, 0.5)";
    tapeWaveformCtx.lineWidth = 1;
    tapeWaveformCtx.beginPath();
    tapeWaveformCtx.moveTo(0, tapeWaveformCanvas.height / 2);
    tapeWaveformCtx.lineTo(
      tapeWaveformCanvas.width,
      tapeWaveformCanvas.height / 2,
    );
    tapeWaveformCtx.stroke();
    return;
  }

  if (!waveformPathData || waveformPathData.length === 0) {
    return;
  }

  tapeWaveformCtx.strokeStyle = "rgba(150, 180, 220, 0.7)";
  tapeWaveformCtx.lineWidth = 1;
  tapeWaveformCtx.beginPath();

  const amp = tapeWaveformCanvas.height / 2;
  const verticalZoomFactor = 8;

  waveformPathData.forEach((point, i) => {
    const x = i;
    const scaledMin = Math.max(-1, Math.min(1, point.min * verticalZoomFactor));
    const scaledMax = Math.max(-1, Math.min(1, point.max * verticalZoomFactor));
    const yMin = (1 + scaledMin) * amp;
    const yMax = (1 + scaledMax) * amp;
    tapeWaveformCtx.moveTo(x, yMin);
    tapeWaveformCtx.lineTo(x, yMax);
  });
  tapeWaveformCtx.stroke();
}
function drawSamplerWaveform(buffer, canvas, start = 0, end = 1, attack = 0, release = 0) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!buffer) {
    ctx.strokeStyle = "rgba(100,100,110,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    return;
  }
  const data = buffer.getChannelData(0);
  const len = data.length;
  const samplesPerPixel = len / canvas.width;
  ctx.strokeStyle = "rgba(150,180,220,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x++) {
    const sliceStart = Math.floor(x * samplesPerPixel);
    const sliceEnd = Math.min(len, Math.floor((x + 1) * samplesPerPixel));
    let min = 1,
      max = -1;
    for (let j = sliceStart; j < sliceEnd; j++) {
      const v = data[j];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const yMin = (1 - min) * canvas.height / 2;
    const yMax = (1 - max) * canvas.height / 2;
    ctx.moveTo(x, yMin);
    ctx.lineTo(x, yMax);
  }
  ctx.stroke();

  const startX = start * canvas.width;
  const endX = end * canvas.width;
  ctx.fillStyle = "rgba(255,80,80,0.15)";
  ctx.fillRect(startX, 0, endX - startX, canvas.height);
  ctx.strokeStyle = "rgba(255,80,80,0.8)";
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(startX, canvas.height);
  ctx.moveTo(endX, 0);
  ctx.lineTo(endX, canvas.height);
  ctx.stroke();

  if (buffer && (attack > 0 || release > 0)) {
    const dur = (end - start) * buffer.duration;
    const pixelsPerSec = canvas.width / dur;
    const atkX = startX + attack * pixelsPerSec;
    const relX = endX;
    const relStartX = Math.max(startX, endX - release * pixelsPerSec);
    ctx.strokeStyle = "rgba(255,210,80,0.8)";
    ctx.beginPath();
    ctx.moveTo(startX, canvas.height);
    ctx.lineTo(atkX, 0);
    ctx.lineTo(relStartX, 0);
    ctx.lineTo(relX, canvas.height);
    ctx.stroke();
  }
}

function getReversedBuffer(definition) {
  if (!definition || !definition.buffer) return null;
  if (definition.reversedBuffer) return definition.reversedBuffer;
  const buffer = definition.buffer;
  const channels = buffer.numberOfChannels;
  const reversed = audioContext.createBuffer(
    channels,
    buffer.length,
    buffer.sampleRate,
  );
  for (let ch = 0; ch < channels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = reversed.getChannelData(ch);
    for (let i = 0, j = src.length - 1; i < src.length; i++, j--) {
      dst[i] = src[j];
    }
  }
  definition.reversedBuffer = reversed;
  return reversed;
}

function animateSamplerPlayhead(node, startFrac, endFrac, duration, attack = 0, release = 0) {
  if (attack + release > duration) {
    const scale = duration / Math.max(attack + release, 0.001);
    attack *= scale;
    release *= scale;
  }
  if (!samplerVisualPlayhead || currentSamplerNode !== node) return;
  if (samplerPlayheadTimeout) {
    clearTimeout(samplerPlayheadTimeout);
    samplerPlayheadTimeout = null;
  }
  samplerVisualPlayhead.style.transition = "none";
  samplerVisualPlayhead.style.display = "block";
  samplerVisualPlayhead.style.left = `${startFrac * 100}%`;
  void samplerVisualPlayhead.offsetWidth;
  samplerVisualPlayhead.style.transition = `left ${duration}s linear`;
  samplerVisualPlayhead.style.left = `${endFrac * 100}%`;
  if (samplerEnvelopeDot) {
    const startTime = performance.now();
    const step = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(elapsed, duration);
      let amp = 1;
      if (t < attack) {
        amp = t / Math.max(attack, 0.0001);
      } else if (t > duration - release) {
        const rElapsed = t - (duration - release);
        amp = 1 - rElapsed / Math.max(release, 0.0001);
      }
      samplerEnvelopeDot.style.top = `${(1 - amp) * 100}%`;
      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    };
    samplerEnvelopeDot.style.top = '100%';
    requestAnimationFrame(step);
  }
  samplerPlayheadTimeout = setTimeout(() => {
    if (samplerVisualPlayhead) {
      samplerVisualPlayhead.style.display = "none";
      samplerVisualPlayhead.style.transition = "none";
    }
  }, duration * 1000);
}


function updateLoopRegionAndInputs() {
  if (!tapeVisualLoopRegion || !tapeLoopStartInput || !tapeLoopEndInput) {
    return;
  }

  const hasBuffer = !!tapeLoopBuffer;
  const maxDurationForData =
    tapeLoopEffectivelyRecordedDuration > 0
      ? tapeLoopEffectivelyRecordedDuration
      : hasBuffer
        ? tapeLoopBuffer.duration
        : configuredTapeLoopDurationSeconds;

  userDefinedLoopStart = Math.max(
    0,
    Math.min(userDefinedLoopStart, maxDurationForData - 0.01),
  );
  if (
    userDefinedLoopEnd === -1 ||
    userDefinedLoopEnd > maxDurationForData ||
    userDefinedLoopEnd <= userDefinedLoopStart
  ) {
    userDefinedLoopEnd = maxDurationForData;
  }
  userDefinedLoopEnd = Math.max(
    userDefinedLoopStart + 0.01,
    Math.min(userDefinedLoopEnd, maxDurationForData),
  );

  tapeLoopStartInput.value = userDefinedLoopStart.toFixed(2);
  tapeLoopEndInput.value = userDefinedLoopEnd.toFixed(2);
  tapeLoopStartInput.max = maxDurationForData.toFixed(2);
  tapeLoopEndInput.max = maxDurationForData.toFixed(2);

  let currentDisplayStartTime = tapeDisplayStartTime;
  let currentDisplayEndTime = tapeDisplayEndTime;
  if (currentDisplayEndTime <= currentDisplayStartTime) {
    currentDisplayEndTime =
      currentDisplayStartTime +
      Math.max(0.1, maxDurationForData - currentDisplayStartTime);
    if (currentDisplayEndTime <= currentDisplayStartTime)
      currentDisplayEndTime = currentDisplayStartTime + 0.1;
  }
  currentDisplayEndTime = Math.min(maxDurationForData, currentDisplayEndTime);
  if (currentDisplayStartTime >= currentDisplayEndTime)
    currentDisplayStartTime = Math.max(0, currentDisplayEndTime - 0.1);

  const displayWindowDuration = Math.max(
    0.01,
    currentDisplayEndTime - currentDisplayStartTime,
  );

  const loopRegionStartRel =
    (userDefinedLoopStart - currentDisplayStartTime) / displayWindowDuration;
  const loopRegionEndRel =
    (userDefinedLoopEnd - currentDisplayStartTime) / displayWindowDuration;

  const loopRegionLeftPercent = Math.max(
    0,
    Math.min(100, loopRegionStartRel * 100),
  );
  const loopRegionWidthPercent = Math.max(
    0,
    Math.min(
      100 - loopRegionLeftPercent,
      (loopRegionEndRel - loopRegionStartRel) * 100,
    ),
  );

  tapeVisualLoopRegion.style.left = `${loopRegionLeftPercent}%`;
  tapeVisualLoopRegion.style.width = `${loopRegionWidthPercent}%`;

  const startHandleVisible =
    loopRegionStartRel >= -0.001 && loopRegionStartRel <= 1.001;
  const endHandleVisible =
    loopRegionEndRel >= -0.001 && loopRegionEndRel <= 1.001;

  tapeLoopHandleStart.style.display =
    startHandleVisible && loopRegionWidthPercent > 0.1 ? "block" : "none";
  tapeLoopHandleEnd.style.display =
    endHandleVisible && loopRegionWidthPercent > 0.1 ? "block" : "none";

  if (isTapeLoopPlaying && tapeLoopSourceNode && hasBuffer) {
    tapeLoopSourceNode.loopStart = userDefinedLoopStart;
    tapeLoopSourceNode.loopEnd = userDefinedLoopEnd;
  }
}


function handleLoopHandleMouseMove(event) {
  if (
    !isDraggingLoopHandle ||
    (!tapeLoopBuffer && configuredTapeLoopDurationSeconds <= 0) ||
    !tapeWaveformCanvas
  )
    return;

  const rect = tapeWaveformCanvas.getBoundingClientRect();
  const trackWidthPx = rect.width;
  if (trackWidthPx === 0) return;

  const currentDisplayStartTimeLocal = tapeDisplayStartTime;
  const currentDisplayEndTimeLocal =
    tapeDisplayEndTime <= tapeDisplayStartTime
      ? tapeDisplayStartTime + 0.1
      : tapeDisplayEndTime;
  const currentDisplayDuration = Math.max(
    0.01,
    currentDisplayEndTimeLocal - currentDisplayStartTimeLocal,
  );

  const dx = event.clientX - loopHandleDragStartX;
  const deltaTimeChange = (dx / trackWidthPx) * currentDisplayDuration;

  let newValue = initialLoopHandleValue + deltaTimeChange;

  const maxBufferDuration =
    tapeLoopEffectivelyRecordedDuration > 0
      ? tapeLoopEffectivelyRecordedDuration
      : tapeLoopBuffer
        ? tapeLoopBuffer.duration
        : configuredTapeLoopDurationSeconds;

  if (isDraggingLoopHandle === "start") {
    const effectiveEnd =
      userDefinedLoopEnd === -1 ||
      userDefinedLoopEnd > maxBufferDuration ||
      userDefinedLoopEnd <= userDefinedLoopStart
        ? maxBufferDuration
        : userDefinedLoopEnd;
    newValue = Math.max(0, Math.min(newValue, effectiveEnd - 0.01));
    userDefinedLoopStart = newValue;
    if (tapeLoopStartInput) tapeLoopStartInput.value = newValue.toFixed(2);
  } else {
    newValue = Math.max(
      userDefinedLoopStart + 0.01,
      Math.min(newValue, maxBufferDuration),
    );
    userDefinedLoopEnd = newValue;
    if (tapeLoopEndInput) tapeLoopEndInput.value = newValue.toFixed(2);
  }

  updateLoopRegionAndInputs();
}


function handleLoopHandleMouseDown(event, type) {
  if (!tapeLoopBuffer) return;
  event.stopPropagation();

  isDraggingLoopHandle = type;
  loopHandleDragStartX = event.clientX;

  initialLoopHandleValue =
    type === "start" ? userDefinedLoopStart : userDefinedLoopEnd;

  document.body.style.userSelect = "none";

  document.addEventListener("mousemove", handleLoopHandleMouseMove);
  document.addEventListener("mouseup", handleLoopHandleMouseUp);
}

function handleLoopHandleMouseUp() {
  if (!isDraggingLoopHandle) return;
  document.removeEventListener("mousemove", handleLoopHandleMouseMove);
  document.removeEventListener("mouseup", handleLoopHandleMouseUp);
  document.body.style.userSelect = "";
  isDraggingLoopHandle = null;
  updateLoopRegionAndInputs();
}

function setupLoopHandles() {
  if (tapeLoopHandleStart) {
    tapeLoopHandleStart.addEventListener("mousedown", (e) =>
      handleLoopHandleMouseDown(e, "start"),
    );
  }
  if (tapeLoopHandleEnd) {
    tapeLoopHandleEnd.addEventListener("mousedown", (e) =>
      handleLoopHandleMouseDown(e, "end"),
    );
  }
}

function updateAllPitchesAndUI() {
    nodes.forEach(node => {
        if (
            node.audioParams &&
            (node.type === "sound" || node.type === "nebula" || node.type === PRORB_TYPE || node.type === MIDI_ORB_TYPE || node.type === ALIEN_ORB_TYPE || node.type === ALIEN_DRONE_TYPE || node.type === ARVO_DRONE_TYPE || node.type === FM_DRONE_TYPE || node.type === RESONAUTER_TYPE)
        ) {
            if (typeof node.audioParams.scaleIndex === 'number') {
                node.audioParams.pitch = getFrequency(
                    currentScale,
                    node.audioParams.scaleIndex,
                    0,
                    currentRootNote,
                    globalTransposeOffset,
                );
                updateNodeAudioParams(node);
                if (
                    (node.type === ALIEN_ORB_TYPE || node.type === ALIEN_DRONE_TYPE) &&
                    node.audioNodes
                ) {
                    updateAlienNodesParams(
                        node.audioNodes,
                        node.audioParams.engine,
                        node.audioParams.pitch,
                    );
                    if (node.audioNodes.orbitoneSynths) {
                        const freqs = getOrbitoneFrequencies(
                            node.audioParams.scaleIndex,
                            node.audioParams.orbitoneCount,
                            node.audioParams.orbitoneIntervals,
                            0,
                            currentScale,
                            node.audioParams.pitch,
                        ).slice(1);
                        node.audioNodes.orbitoneSynths.forEach((s, idx) => {
                            if (idx < freqs.length) {
                                updateAlienNodesParams(
                                    s,
                                    node.audioParams.engine,
                                    freqs[idx],
                                );
                            }
                        });
                    }
                    updateAlienParams();
                }
            }
        }
    });
    connections.forEach(conn => {
        if (conn.type === "string_violin" && conn.audioParams) {
            if (typeof conn.audioParams.scaleIndex === 'number') {
                conn.audioParams.pitch = getFrequency(
                    currentScale,
                    conn.audioParams.scaleIndex,
                    0,
                    currentRootNote,
                    globalTransposeOffset,
                );
                updateConnectionAudioParams(conn);
            }
        }
    });
    drawPianoRoll();

    if (hamburgerMenuPanel && !hamburgerMenuPanel.classList.contains("hidden") && editPanelContent) {
        let aSelectIsFocused = false;
        if (document.activeElement && document.activeElement.tagName === 'SELECT' && editPanelContent.contains(document.activeElement)) {
            aSelectIsFocused = true;
        }

        if (aSelectIsFocused) {} else {
            populateEditPanel();
        }
    }
}

function playTapeLoop(scheduledPlayTime = 0, offsetWithinLoopSegment = 0) {
  const hasAnyBuffer = tapeTracks.some(t => t.buffer);
  if (!audioContext || !hasAnyBuffer || isTapeLoopPlaying) {
    return;
  }
  if (isTapeLoopRecording) {
    return;
  }

  tapeLoopSourceNodes.forEach((node, i) => {
    if (node) {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    }
    tapeLoopSourceNodes[i] = null;
  });

  const nowCtxTime = audioContext.currentTime;
  let actualPlayTime = scheduledPlayTime > nowCtxTime ? scheduledPlayTime : nowCtxTime;
  if (isGlobalSyncEnabled && globalBPM > 0 && !scheduledPlayTime) {
    actualPlayTime = getNextQuantizedTime(actualPlayTime, 1);
  }

  tapeTracks.forEach((track, idx) => {
    if (!track.buffer) return;
    const source = audioContext.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    const loopStart = track.loopStart < track.buffer.duration ? track.loopStart : 0;
    const loopEnd =
      track.loopEnd > loopStart && track.loopEnd <= track.buffer.duration
        ? track.loopEnd
        : track.buffer.duration;
    source.loopStart = loopStart;
    source.loopEnd = loopEnd;
    let rate = track.playbackRate;
    if (isGlobalSyncEnabled && track.recordedAtBPM > 0 && globalBPM > 0) {
      rate = globalBPM / track.recordedAtBPM;
      if (idx === currentTapeTrack) {
        currentPlaybackRate = rate;
        if (tapeLoopSpeedSlider) tapeLoopSpeedSlider.value = rate;
        if (tapeLoopSpeedValue) tapeLoopSpeedValue.textContent = rate.toFixed(2) + "x";
        if (tapeLoopSpeedSlider) tapeLoopSpeedSlider.disabled = true;
        if (tapeLoopResetSpeedBtn) tapeLoopResetSpeedBtn.disabled = true;
      }
    } else {
      if (idx === currentTapeTrack) {
        rate = parseFloat(tapeLoopSpeedSlider ? tapeLoopSpeedSlider.value : "1.0");
        if (tapeLoopSpeedSlider) tapeLoopSpeedSlider.disabled = false;
        if (tapeLoopResetSpeedBtn) tapeLoopResetSpeedBtn.disabled = false;
        currentPlaybackRate = rate;
      }
    }
    source.playbackRate.value = rate;
    if (tapeTrackGainNodes[idx]) {
      source.connect(tapeTrackGainNodes[idx]);
    } else {
      source.connect(masterGain);
    }
    const playOffset = loopStart + (idx === currentTapeTrack ? offsetWithinLoopSegment : 0);
    source.start(actualPlayTime, playOffset);
    tapeLoopSourceNodes[idx] = source;
  });

  tapeLoopSourceNode = tapeLoopSourceNodes[currentTapeTrack];
  tapeLoopSourceNodeStartTime = actualPlayTime;
  tapeLoopSourceNodeStartOffsetInLoop = offsetWithinLoopSegment;
  isTapeLoopPlaying = true;
  updateTapeLooperUI();
  updateMixerGUI();
  applySoloMuteToAllGroupsAudio();
}

function updateTapeLooperUI() {
  if (
    !tapeLoopRecordBtn ||
    !tapeLoopPlayBtn ||
    !tapeLoopStopBtn ||
    !tapeLoopClearBtn ||
    !tapeLoopStatusLabel
  ) {
    return;
  }

  const recordIcon = "⏺️";
  const stopRecIcon = "⏹️&nbsp;REC";
  const armedIcon = "❗&nbsp;ARMED";
  const playIcon = "▶️";
  const stopIcon = "⏹️";

  tapeLoopRecordBtn.disabled = false;
  tapeLoopPlayBtn.disabled = true;
  tapeLoopStopBtn.disabled = true;
  tapeLoopClearBtn.disabled = true;

  const hasBuffer = !!tapeLoopBuffer;
  const maxInteractiveDuration =
    tapeLoopEffectivelyRecordedDuration > 0
      ? tapeLoopEffectivelyRecordedDuration
      : hasBuffer
        ? tapeLoopBuffer.duration
        : configuredTapeLoopDurationSeconds;

  if (tapeLoopStartInput) {
    tapeLoopStartInput.disabled = !hasBuffer;
    tapeLoopStartInput.max = maxInteractiveDuration.toFixed(2);
  }
  if (tapeLoopEndInput) {
    tapeLoopEndInput.disabled = !hasBuffer;
    tapeLoopEndInput.max = maxInteractiveDuration.toFixed(2);
  }
  if (tapeLoopSetLoopPointsBtn) {
    tapeLoopSetLoopPointsBtn.disabled = !hasBuffer;
  }
  if (tapeLoopSpeedSlider) {
    tapeLoopSpeedSlider.disabled = isGlobalSyncEnabled || !hasBuffer;
  }
  if (tapeLoopResetSpeedBtn) {
    tapeLoopResetSpeedBtn.disabled = isGlobalSyncEnabled || !hasBuffer;
  }

  if (tapeLoopHandleStart) {
    tapeLoopHandleStart.style.display = hasBuffer ? "block" : "none";
  }
  if (tapeLoopHandleEnd) {
    tapeLoopHandleEnd.style.display = hasBuffer ? "block" : "none";
  }

  if (hasBuffer) {
    if (tapeWaveformCanvas && tapeWaveformCanvas.parentElement) {
      const parentElement = tapeWaveformCanvas.parentElement;
      let dimensionsChanged = false;
      if (
        parentElement.clientWidth > 0 &&
        tapeWaveformCanvas.width !== parentElement.clientWidth
      ) {
        tapeWaveformCanvas.width = parentElement.clientWidth;
        dimensionsChanged = true;
      }
      if (
        parentElement.clientHeight > 0 &&
        tapeWaveformCanvas.height !== parentElement.clientHeight
      ) {
        tapeWaveformCanvas.height = parentElement.clientHeight;
        dimensionsChanged = true;
      }
      if (dimensionsChanged) {
        waveformPathData = null;
      }
    }

    let currentStart = userDefinedLoopStart;
    let currentEnd =
      userDefinedLoopEnd === -1 ||
      userDefinedLoopEnd > maxInteractiveDuration ||
      userDefinedLoopEnd <= userDefinedLoopStart
        ? maxInteractiveDuration
        : userDefinedLoopEnd;

    currentStart = Math.max(
      0,
      Math.min(currentStart, maxInteractiveDuration - 0.01),
    );
    currentEnd = Math.max(
      currentStart + 0.01,
      Math.min(currentEnd, maxInteractiveDuration),
    );

    if (
      Math.abs(userDefinedLoopStart - currentStart) > 0.001 ||
      (userDefinedLoopStart === 0 &&
        currentStart === 0 &&
        waveformPathData === null)
    ) {
      userDefinedLoopStart = currentStart;
      waveformPathData = null;
    }
    const endToCheckAgainst =
      userDefinedLoopEnd === -1 && tapeLoopBuffer
        ? tapeLoopBuffer.duration
        : userDefinedLoopEnd;
    if (
      Math.abs(endToCheckAgainst - currentEnd) > 0.001 ||
      (userDefinedLoopEnd === currentEnd && waveformPathData === null)
    ) {
      userDefinedLoopEnd = currentEnd;
      waveformPathData = null;
    }

    if (tapeLoopStartInput)
      tapeLoopStartInput.value = userDefinedLoopStart.toFixed(2);
    if (tapeLoopEndInput)
      tapeLoopEndInput.value = userDefinedLoopEnd.toFixed(2);

    drawTapeWaveform();
  } else {
    if (tapeWaveformCtx && tapeWaveformCanvas) {
      tapeWaveformCtx.clearRect(
        0,
        0,
        tapeWaveformCanvas.width,
        tapeWaveformCanvas.height,
      );
    }
    waveformPathData = null;
    if (tapeLoopStartInput) tapeLoopStartInput.value = "0.00";
    if (tapeLoopEndInput)
      tapeLoopEndInput.value = configuredTapeLoopDurationSeconds.toFixed(2);
    if (tapeLoopTimer) tapeLoopTimer.textContent = formatTime(0);
  }

  if (tapeLoopRecordBtn.dataset.isArmed === "true") {
    tapeLoopRecordBtn.innerHTML = armedIcon;
    tapeLoopRecordBtn.classList.add("active");
    tapeLoopStatusLabel.textContent = "Armed (Wacht op tel...)";
    tapeLoopPlayBtn.disabled = true;
    tapeLoopStopBtn.disabled = true;
    tapeLoopClearBtn.disabled = true;
  } else if (isTapeLoopRecording) {
    tapeLoopRecordBtn.innerHTML = stopRecIcon;
    tapeLoopRecordBtn.classList.add("active");
    const sampleRate = audioContext?.sampleRate || 44100;
    const recordedTime = tapeLoopWritePosition / sampleRate;
    const totalConfiguredDuration = tapeLoopBuffer
      ? tapeLoopBuffer.duration.toFixed(1)
      : configuredTapeLoopDurationSeconds.toFixed(1);
    tapeLoopStatusLabel.textContent = `REC ${recordedTime.toFixed(1)}/${totalConfiguredDuration}s`;
    if (tapeLoopTimer) tapeLoopTimer.textContent = formatTime(recordedTime);
    tapeLoopPlayBtn.disabled = true;
    tapeLoopStopBtn.disabled = false;
    tapeLoopClearBtn.disabled = true;
  } else if (isTapeLoopPlaying) {
    tapeLoopRecordBtn.innerHTML = recordIcon;
    tapeLoopRecordBtn.classList.remove("active");
    tapeLoopRecordBtn.disabled = true;
    tapeLoopPlayBtn.disabled = true;
    tapeLoopStopBtn.disabled = false;
    tapeLoopClearBtn.disabled = false;
    tapeLoopStatusLabel.textContent = "LOOPING";
  } else {
    tapeLoopRecordBtn.innerHTML = recordIcon;
    tapeLoopRecordBtn.classList.remove("active");
    tapeLoopRecordBtn.disabled = false;
    tapeLoopRecordBtn.dataset.isArmed = "false";
    tapeLoopPlayBtn.disabled = !hasBuffer;
    tapeLoopPlayBtn.innerHTML = playIcon;
    tapeLoopStopBtn.disabled = true;
    tapeLoopStopBtn.innerHTML = stopIcon;
    tapeLoopClearBtn.disabled = !hasBuffer;
    tapeLoopStatusLabel.textContent = hasBuffer ? "READY" : "IDLE";
    if (tapeLoopTimer && !hasBuffer) tapeLoopTimer.textContent = formatTime(0);
  }

  if (tapeLoopSpeedSlider) tapeLoopSpeedSlider.value = currentPlaybackRate;
  if (tapeLoopSpeedValue)
    tapeLoopSpeedValue.textContent = currentPlaybackRate.toFixed(2) + "x";

  updateLoopRegionAndInputs();
  saveCurrentTapeTrack();
}

function clearTapeLoop() {
  stopTapeLoopPlayback();
  tapeLoopBuffer = null;
  tapeLoopWritePosition = 0;
  userDefinedLoopStart = 0;
  userDefinedLoopEnd = -1;
  tapeLoopEffectivelyRecordedDuration = 0;

  tapeDisplayStartTime = 0;
  tapeDisplayEndTime = configuredTapeLoopDurationSeconds;

  waveformPathData = null;
  if (tapeWaveformCtx && tapeWaveformCanvas) {
    tapeWaveformCtx.clearRect(
      0,
      0,
      tapeWaveformCanvas.width,
      tapeWaveformCanvas.height,
    );
  }
  if (tapeLoopTimer) tapeLoopTimer.textContent = formatTime(0);

  updateTapeLooperUI();
  updateMixerGUI();
  applySoloMuteToAllGroupsAudio();
  saveCurrentTapeTrack();
}

function stopTapeLoopPlayback() {
  if (tapeLoopRecordBtn) tapeLoopRecordBtn.dataset.isArmed = "false";
  tapeLoopRecordBtnClickable = true;
  scheduledTapeLoopEvents = scheduledTapeLoopEvents.filter(
    (e) =>
      e.action !== "startRec" &&
      e.action !== "startPlay" &&
      e.action !== "stopRecAndPlay",
  );

  if (isTapeLoopPlaying) {
    tapeLoopSourceNodes.forEach((node, i) => {
      if (node) {
        try {
          node.stop(0);
          node.disconnect();
        } catch (e) {
          console.warn("Fout bij stoppen/loskoppelen tapeLoopSourceNode:", e);
        }
      }
      tapeLoopSourceNodes[i] = null;
    });
  }
  tapeLoopSourceNode = null;
  isTapeLoopPlaying = false;

  if (isTapeLoopRecording) {
    isTapeLoopRecording = false;
    if (scriptNodeForTapeLoop) {
      try {
        scriptNodeForTapeLoop.disconnect();
      } catch (e) {}
      if (tapeLoopInputGate && scriptNodeForTapeLoop) {
        try {
          tapeLoopInputGate.disconnect(scriptNodeForTapeLoop);
        } catch (e) {}
      }
      scriptNodeForTapeLoop.onaudioprocess = null;
      scriptNodeForTapeLoop = null;
    }
    if (tapeLoopInputGate) {
      tapeLoopInputGate.gain.cancelScheduledValues(audioContext.currentTime);
      tapeLoopInputGate.gain.setValueAtTime(0.0, audioContext.currentTime);
    }
  }

  updateTapeLooperUI();
  updateMixerGUI();
  applySoloMuteToAllGroupsAudio();
}

function startTapeLoopRecording() {
  if (!audioContext || audioContext.state !== "running" || !masterGain) {
    alert("Audio context is niet actief. Start audio via Play.");
    return;
  }
  if (
    isTapeLoopRecording ||
    isTapeLoopPlaying ||
    (tapeLoopRecordBtn && tapeLoopRecordBtn.dataset.isArmed === "true")
  ) {
    return;
  }

  configuredTapeLoopDurationSeconds =
    parseFloat(tapeLoopDurationInput.value) || 4;
  let actualCalculatedBufferDurationSeconds = configuredTapeLoopDurationSeconds;

  if (isGlobalSyncEnabled && globalBPM > 0) {
    tapeLoopRecordedAtBPM = globalBPM;
    const secondsPerBeat = 60.0 / globalBPM;
    const durationInBeats = Math.max(
      1,
      Math.round(configuredTapeLoopDurationSeconds / secondsPerBeat),
    );
    actualCalculatedBufferDurationSeconds = durationInBeats * secondsPerBeat;
  } else {
    tapeLoopRecordedAtBPM = 0;
  }

  tapeLoopWritePosition = 0;
  actualTapeLoopRecordStartTime = 0;
  userDefinedLoopStart = 0;
  userDefinedLoopEnd = -1;
  waveformPathData = null;
  if (tapeWaveformCtx && tapeWaveformCanvas) {
    tapeWaveformCtx.clearRect(
      0,
      0,
      tapeWaveformCanvas.width,
      tapeWaveformCanvas.height,
    );
  }

  if (!tapeLoopInputGate) {
    tapeLoopInputGate = audioContext.createGain();
    tapeLoopInputGate.gain.value = 0;
    masterGain.connect(tapeLoopInputGate);
  } else {
    tapeLoopInputGate.gain.cancelScheduledValues(audioContext.currentTime);
    tapeLoopInputGate.gain.setValueAtTime(0, audioContext.currentTime);
  }

  const logicToActuallyStartProcessingAndRecording = (startTime) => {
    const currentSampleRate = audioContext.sampleRate;
    const currentNumberOfChannels = 2;
    const bufferLengthInSamples = Math.floor(
      currentSampleRate * actualCalculatedBufferDurationSeconds,
    );

    if (bufferLengthInSamples <= 0) {
      if (tapeLoopRecordBtn) tapeLoopRecordBtn.dataset.isArmed = "false";
      tapeLoopRecordBtnClickable = true;
      updateTapeLooperUI();
      return;
    }
    tapeLoopBuffer = audioContext.createBuffer(
      currentNumberOfChannels,
      bufferLengthInSamples,
      currentSampleRate,
    );
    tapeTracks[currentTapeTrack].buffer = tapeLoopBuffer;
    tapeTracks[currentTapeTrack].writePosition = 0;
    tapeTracks[currentTapeTrack].effectivelyRecordedDuration = 0;
    tapeTracks[currentTapeTrack].loopStart = 0;
    tapeTracks[currentTapeTrack].loopEnd = -1;
    tapeTracks[currentTapeTrack].playbackRate = currentPlaybackRate;
    tapeLoopWritePosition = 0;
    waveformPathData = null;

    const scriptBufferSize = 4096;
    scriptNodeForTapeLoop = audioContext.createScriptProcessor(
      scriptBufferSize,
      currentNumberOfChannels,
      currentNumberOfChannels,
    );

    scriptNodeForTapeLoop.onaudioprocess = (audioProcessingEvent) => {
      if (!isTapeLoopRecording || !tapeLoopBuffer) return;
      if (
        isGlobalSyncEnabled &&
        actualTapeLoopRecordStartTime > 0 &&
        audioContext.currentTime < actualTapeLoopRecordStartTime - 0.005
      ) {
        return;
      }

      const inputBuffer = audioProcessingEvent.inputBuffer;
      const currentBlockSize = inputBuffer.length;
      const localNumChannels = inputBuffer.numberOfChannels;

      for (let channel = 0; channel < localNumChannels; channel++) {
        const channelInputData = inputBuffer.getChannelData(channel);
        const tapeBufferData = tapeLoopBuffer.getChannelData(channel);
        for (let i = 0; i < currentBlockSize; i++) {
          if (tapeLoopWritePosition + i < tapeBufferData.length) {
            tapeBufferData[tapeLoopWritePosition + i] = channelInputData[i];
          } else {
            break;
          }
        }
      }
      tapeLoopWritePosition += currentBlockSize;
      tapeTracks[currentTapeTrack].writePosition = tapeLoopWritePosition;

      const sampleRateForCalc = audioContext?.sampleRate || 44100;
      const recordedTime = tapeLoopWritePosition / sampleRateForCalc;
      if (tapeLoopStatusLabel && isTapeLoopRecording) {
        const totalDuration = tapeLoopBuffer
          ? tapeLoopBuffer.duration.toFixed(1)
          : actualCalculatedBufferDurationSeconds.toFixed(1);
        tapeLoopStatusLabel.textContent = `REC ${recordedTime.toFixed(1)}/${totalDuration}s`;
      }
      if (tapeLoopTimer) tapeLoopTimer.textContent = formatTime(recordedTime);
    };

    tapeLoopInputGate.connect(scriptNodeForTapeLoop);
    scriptNodeForTapeLoop.connect(audioContext.destination);

    actualTapeLoopRecordStartTime = startTime;
    isTapeLoopRecording = true;
    if (tapeLoopRecordBtn) {
      tapeLoopRecordBtn.dataset.isArmed = "false";
    }
    tapeLoopRecordBtnClickable = true;

    if (tapeLoopInputGate) {
      tapeLoopInputGate.gain.setValueAtTime(1.0, startTime);
    }

    const bufferActualDuration = tapeLoopBuffer.duration;
    updateTapeLooperUI();
    updateMixerGUI();
    applySoloMuteToAllGroupsAudio();

    const stopTime = startTime + bufferActualDuration;
    if (tapeLoopInputGate) {
      tapeLoopInputGate.gain.setValueAtTime(0.0, stopTime);
    }

    scheduledTapeLoopEvents = scheduledTapeLoopEvents.filter(
      (e) => e.action !== "stopRecAndPlay",
    );
    scheduledTapeLoopEvents.push({
      time: stopTime,
      action: "stopRecAndPlay",
    });
  };

  if (isGlobalSyncEnabled && globalBPM > 0) {
    const quantizedStartTime = getNextQuantizedTime(
      audioContext.currentTime,
      1,
    );
    if (tapeLoopRecordBtn) {
      tapeLoopRecordBtn.dataset.isArmed = "true";
      tapeLoopRecordBtnClickable = false;
      setTimeout(() => {
        if (tapeLoopRecordBtn && tapeLoopRecordBtn.dataset.isArmed === "true") {
          tapeLoopRecordBtnClickable = true;
        }
      }, 350);
    }
    updateTapeLooperUI();

    scheduledTapeLoopEvents = scheduledTapeLoopEvents.filter(
      (e) => e.action !== "startRec",
    );
    scheduledTapeLoopEvents.push({
      time: quantizedStartTime,
      action: "startRec",
      callback: logicToActuallyStartProcessingAndRecording,
    });
  } else {
    logicToActuallyStartProcessingAndRecording(audioContext.currentTime);
  }
}

function processScheduledTapeEvents() {
  const now = audioContext.currentTime;
  let nextEvents = [];
  for (let event of scheduledTapeLoopEvents) {
    if (now >= event.time - 0.01) {
      if (event.action === "startRec") {
        if (tapeLoopRecordBtn && tapeLoopRecordBtn.dataset.isArmed === "true") {
          if (typeof event.callback === "function") {
            event.callback(event.time);
          }
        }
        tapeLoopRecordBtnClickable = true;
      } else if (event.action === "stopRecAndPlay") {
        if (isTapeLoopRecording) {
          isTapeLoopRecording = false;
          if (scriptNodeForTapeLoop) {
            try {
              scriptNodeForTapeLoop.disconnect();
            } catch (e) {}
            if (tapeLoopInputGate && scriptNodeForTapeLoop) {
              try {
                tapeLoopInputGate.disconnect(scriptNodeForTapeLoop);
              } catch (e) {}
            }
            scriptNodeForTapeLoop.onaudioprocess = null;
            scriptNodeForTapeLoop = null;
          }

          if (
            tapeLoopBuffer &&
            tapeLoopWritePosition > audioContext.sampleRate * 0.05
          ) {
            const actualRecordedDuration =
              tapeLoopWritePosition / audioContext.sampleRate;
            tapeLoopEffectivelyRecordedDuration = actualRecordedDuration;
            userDefinedLoopStart = 0;
            userDefinedLoopEnd = actualRecordedDuration;

            if (tapeLoopStartInput)
              tapeLoopStartInput.value = userDefinedLoopStart.toFixed(2);
            if (tapeLoopEndInput)
              tapeLoopEndInput.value = userDefinedLoopEnd.toFixed(2);

            waveformPathData = null;
            updateTapeLooperUI();
            playTapeLoop(event.time);
          } else {
            clearTapeLoop();
          }
        }
      } else if (event.action === "startPlay") {
        if (tapeLoopSourceNode) {
          tapeLoopSourceNode.start(event.time, event.offset);
          tapeLoopSourceNodeStartTime = event.time;
          tapeLoopSourceNodeStartOffsetInLoop =
            event.offset - tapeLoopSourceNode.loopStart;
          isTapeLoopPlaying = true;
          updateTapeLooperUI();
        }
      }
    } else {
      nextEvents.push(event);
    }
  }
  scheduledTapeLoopEvents = nextEvents;
}

function animationLoop() {
  animationFrameId = requestAnimationFrame(animationLoop);

  const now = audioContext ? audioContext.currentTime : performance.now() / 1000;
  const deltaTime = Math.max(0, Math.min(0.1, now - (previousFrameTime || now)));

  const queuedRadarStep = nodes.some(
    (n) =>
      n.type === CRANK_RADAR_TYPE &&
      (n.manualAdvanceIncrement || n.pulseAdvanceRemaining),
  );
  if (!(isAudioReady && isPlaying && audioContext && audioContext.state === "running")) {
    if (queuedRadarStep) {
      nodes.forEach((n) => {
        if (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE) {
          updateSpaceRadar(n, deltaTime);
        }
      });
    }
    draw();
    previousFrameTime = now;
    return;
  }

  processScheduledTapeEvents();
  updateTapeTimerDisplay();

  const secondsPerBeat = 60.0 / (globalBPM || 120);

  if (isGlobalSyncEnabled && beatIndicatorElement && secondsPerBeat > 0) {
    const epsilon = 0.01;
    if (now >= lastBeatTime + secondsPerBeat - epsilon) {
      if (!beatIndicatorElement.classList.contains("active")) {
        beatIndicatorElement.classList.add("active");
        setTimeout(() => {
          if (beatIndicatorElement) beatIndicatorElement.classList.remove("active");
        }, 50);
      }
      lastBeatTime = Math.floor(now / secondsPerBeat) * secondsPerBeat;
    }
  } else if (beatIndicatorElement && beatIndicatorElement.classList.contains("active")) {
    beatIndicatorElement.classList.remove("active");
    lastBeatTime = 0;
  }

  const masterMeterFillElement = document.getElementById('meterFill-master');
  if (masterMeterFillElement && masterAnalyser) {
    updateMeterVisual(masterAnalyser, masterMeterFillElement);
  }

  const delayReturnMeterFillElement = document.getElementById('meterFill-delay-return');
  if (delayReturnMeterFillElement && delayReturnAnalyser) {
    updateMeterVisual(delayReturnAnalyser, delayReturnMeterFillElement);
  }

  const reverbReturnMeterFillElement = document.getElementById('meterFill-reverb-return');
  if (reverbReturnMeterFillElement && reverbReturnAnalyser) {
    updateMeterVisual(reverbReturnAnalyser, reverbReturnMeterFillElement);
  }

  const radioMeterFillElement = document.getElementById('meterFill-radio');
  if (radioMeterFillElement && radioAnalyserNode) {
    updateMeterVisual(radioAnalyserNode, radioMeterFillElement);
  }
  const radioSendMeterFillElement = document.getElementById('meterFill-radio-send');
  if (radioSendMeterFillElement && radioAnalyserNode) {
    updateMeterVisual(radioAnalyserNode, radioSendMeterFillElement);
  }
  
  identifiedGroups.forEach(group => {
      if (group.analyserNode) {
          const groupMeterFillElement = document.getElementById(`meterFill-${group.id}`);
          if (groupMeterFillElement) {
              updateMeterVisual(group.analyserNode, groupMeterFillElement);
          }
          const sendMeterFillEl = document.getElementById(`meterFill-${group.id}-send`);
          if (sendMeterFillEl) {
              updateMeterVisual(group.analyserNode, sendMeterFillEl);
          }
      }
  });

  tapeTrackAnalyserNodes.forEach((analyser, idx) => {
    if (analyser) {
      const meterEl = document.getElementById(`meterFill-tape-${idx}`);
      if (meterEl) {
        updateMeterVisual(analyser, meterEl);
      }
    }
  });

  updateMistWetness();
  updateCrushWetness();

  try {
    nodes.forEach((node) => {
      if (node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE) {
        updateSpaceRadar(node, deltaTime);
        return;
      }
      if (node.type === MOTOR_ORB_TYPE) {
        updateMotorOrb(node, deltaTime);
        return;
      }
      if (node.type === CLOCKWORK_ORB_TYPE) {
        updateClockworkOrb(node, deltaTime);
        return;
      }
      if (
        node.isStartNode &&
        node.isEnabled &&
        node.audioParams &&
        (node.type === "pulsar_standard" ||
          node.type === "pulsar_random_volume" ||
          node.type === "pulsar_random_particles" ||
          node.type === "pulsar_rocket" ||
          node.type === "pulsar_ufo" ||
          node.type === "pulsar_triggerable" ||
          node.type === "pulsar_meteorshower")
      ) {
        let shouldPulse = false;
        let pulseData = {};

        if (node.type === "pulsar_random_particles") {
          if (
            node.nextRandomTriggerTime === undefined ||
            node.nextRandomTriggerTime === 0 ||
            node.nextRandomTriggerTime < now - 10
          ) {
            node.nextRandomTriggerTime =
              now + (Math.random() * 2) / PULSAR_RANDOM_TIMING_CHANCE_PER_SEC;
          }
          if (now >= node.nextRandomTriggerTime) {
            shouldPulse = true;
            node.nextRandomTriggerTime =
              now + (Math.random() * 2) / PULSAR_RANDOM_TIMING_CHANCE_PER_SEC;
          }
        } else {
          if (isGlobalSyncEnabled && !node.audioParams.ignoreGlobalSync) {
            const index =
              node.audioParams.syncSubdivisionIndex ??
              DEFAULT_SUBDIVISION_INDEX;
            if (index >= 0 && index < subdivisionOptions.length) {
              const subdiv = subdivisionOptions[index];
              if (
                subdiv &&
                typeof subdiv.value === "number" &&
                secondsPerBeat > 0
              ) {
                const nodeIntervalSeconds = secondsPerBeat * subdiv.value;
                if (nodeIntervalSeconds > 0) {
                  if (
                    node.nextSyncTriggerTime === undefined ||
                    node.nextSyncTriggerTime === 0 ||
                    node.nextSyncTriggerTime < now - nodeIntervalSeconds * 2
                  ) {
                    const currentBeatEquivalent = now / nodeIntervalSeconds;
                    node.nextSyncTriggerTime =
                      (Math.floor(currentBeatEquivalent) + 1) *
                      nodeIntervalSeconds;
                    if (node.nextSyncTriggerTime <= now + 0.005) {
                      node.nextSyncTriggerTime += nodeIntervalSeconds;
                    }
                  }
                  if (now >= node.nextSyncTriggerTime - 0.005) {
                    shouldPulse = true;
                    node.nextSyncTriggerTime += nodeIntervalSeconds;
                    if (node.nextSyncTriggerTime <= now) {
                      node.nextSyncTriggerTime =
                        Math.ceil(now / nodeIntervalSeconds) *
                        nodeIntervalSeconds;
                      if (node.nextSyncTriggerTime <= now)
                        node.nextSyncTriggerTime += nodeIntervalSeconds;
                    }
                  }
                }
              }
            }
          } else {
            if (
              node.lastTriggerTime === undefined ||
              node.lastTriggerTime < 0
            ) {
              node.lastTriggerTime =
                now -
                Math.random() *
                  (node.audioParams.triggerInterval ||
                    DEFAULT_TRIGGER_INTERVAL);
            }
            const interval =
              node.audioParams.triggerInterval || DEFAULT_TRIGGER_INTERVAL;
            if (
              interval > 0 &&
              now - node.lastTriggerTime >= interval - 0.005
            ) {
              shouldPulse = true;
              node.lastTriggerTime = now;
            }
          }
        }

        if (shouldPulse) {
            if (node.type === "pulsar_meteorshower") {
                startMeteorShower({ type: 'node', node: node, generation: 0 });
                node.animationState = 1;
                setTimeout(() => {
                    const checkNode = findNodeById(node.id);
                    if (checkNode) checkNode.animationState = 0;
                }, 150);
            } else {
                pulseData = {
                    intensity:
                    node.audioParams.pulseIntensity ?? DEFAULT_PULSE_INTENSITY,
                    color: node.color ?? null,
                    particleMultiplier: 1.0,
                };
                if (node.type === "pulsar_random_volume") {
                    pulseData.intensity =
                    MIN_PULSE_INTENSITY +
                    Math.random() * (MAX_PULSE_INTENSITY - MIN_PULSE_INTENSITY);
                }

                currentGlobalPulseId++;
                node.animationState = 1;
                setTimeout(() => {
                    const checkNode = findNodeById(node.id);
                    if (checkNode) checkNode.animationState = 0;
                }, 150);

                if (node.type === "pulsar_rocket" || node.type === "pulsar_ufo") {
                    launchRocket(node, pulseData);
                } else {
                    node.connections.forEach((neighborId) => {
                    const neighborNode = findNodeById(neighborId);
                    const connection = connections.find(
                        (c) =>
                        (c.nodeAId === node.id && c.nodeBId === neighborId) ||
                        (!c.directional && c.nodeAId === neighborId && c.nodeBId === node.id),
                    );

                    if (
                        neighborNode &&
                        neighborNode.type !== "nebula" &&
                        neighborNode.type !== PORTAL_NEBULA_TYPE &&
                        connection &&
                        connection.type !== "rope" &&
                        neighborNode.lastTriggerPulseId !== currentGlobalPulseId
                    ) {
                        const travelTime = connection.length * DELAY_FACTOR;
                        try {
                        createVisualPulse(
                            connection.id,
                            travelTime,
                            node.id,
                            Infinity,
                            "trigger",
                            pulseData.color,
                            pulseData.intensity,
                        );
                        propagateTrigger(
                            neighborNode,
                            travelTime,
                            currentGlobalPulseId,
                            node.id,
                            Infinity,
                            {
                            type: "trigger",
                            data: pulseData,
                            },
                            connection,
                        );
                        } catch (propError) {}
                    }
                    });
                }
            }
        }
      } else if (node.type === "gate" && node.currentAngle !== undefined) {
        node.currentAngle += GATE_ROTATION_SPEED * (deltaTime * 60);
        node.currentAngle %= 2 * Math.PI;
      } else if (node.type === "nebula" && node.pulsePhase !== undefined) {
        node.spinLfoPhase += NEBULA_SPIN_LFO_RATE * (deltaTime * 60);
        const spinMod =
          1 + Math.sin(node.spinLfoPhase) * NEBULA_SPIN_LFO_DEPTH;
        const actualSpinSpeed = (node.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) * spinMod;
        node.currentAngle = (node.currentAngle || 0) + actualSpinSpeed * (deltaTime * 60);
        node.currentAngle %= 2 * Math.PI;
        node.innerAngle =
          (node.innerAngle || 0) +
          NEBULA_ROTATION_SPEED_INNER * (deltaTime * 60);
        node.innerAngle %= 2 * Math.PI;
        node.pulsePhase += NEBULA_PULSE_SPEED * (deltaTime * 60);
        node.pulsePhase %= 2 * Math.PI;
      } else if (
        node.type === PORTAL_NEBULA_TYPE &&
        node.pulsePhase !== undefined
      ) {
        node.pulsePhase +=
          (PORTAL_NEBULA_DEFAULTS.pulseSpeed || 0.5) * (deltaTime * 60);
        node.pulsePhase %= 2 * Math.PI;
      } else if (
        node.type === ALIEN_DRONE_TYPE &&
        node.audioParams.orbitoneRotateSpeed > 0
        ) {
          node.orbitoneRotatePhase =
            (node.orbitoneRotatePhase || 0) +
            node.audioParams.orbitoneRotateSpeed * deltaTime;
          if (
            node.audioNodes &&
            node.audioParams.orbitonesEnabled &&
            node.audioParams.orbitoneCount > 0
          ) {
            const generalUpdateTimeConstant = 0.02;
            const orbitMix =
              node.audioParams.orbitoneMix !== undefined
                ? node.audioParams.orbitoneMix
                : 0.5;
            const baseMix = orbitMix / Math.max(1, node.audioParams.orbitoneCount);
            const baseAmp = node.audioNodes.baseGain || 1;
            const totalNotes = (node.audioParams.orbitoneCount || 0) + 1;
            const rotateSpread = node.audioParams.orbitoneRotateSpread ?? 1;

            if (node.audioNodes.mix && node.audioNodes.mix.gain) {
              let mainVol = baseAmp * (1.0 - orbitMix);
              const mainRotPos =
                ((node.orbitoneRotatePhase || 0) + 0 * rotateSpread) % 1;
              const mainAmpMod =
                ORBITONE_ROTATE_MIN_VOL +
                (1 - ORBITONE_ROTATE_MIN_VOL) *
                  (0.5 + 0.5 * Math.sin(mainRotPos * 2 * Math.PI));
              mainVol *= mainAmpMod;
              node.audioNodes.mix.gain.setTargetAtTime(
                Math.min(1.0, Math.max(0.01, mainVol)),
                now,
                generalUpdateTimeConstant,
              );
            }

            if (node.audioNodes.orbitoneIndividualGains) {
              const actualCount = node.audioNodes.orbitoneIndividualGains.length;
              for (let i = 0; i < actualCount; i++) {
                const gainNode = node.audioNodes.orbitoneIndividualGains[i];
                if (!gainNode) continue;
                let finalVol = 0;
                if (i < node.audioParams.orbitoneCount) {
                  finalVol = baseMix;
                  const phaseOffset =
                    (node.orbitoneRotatePhase || 0) +
                    ((i + 1) / totalNotes) * rotateSpread;
                  const rotPos = phaseOffset % 1;
                  const ampMod =
                    ORBITONE_ROTATE_MIN_VOL +
                    (1 - ORBITONE_ROTATE_MIN_VOL) *
                      (0.5 + 0.5 * Math.sin(rotPos * 2 * Math.PI));
                  finalVol *= ampMod;
                }
                gainNode.gain.setTargetAtTime(
                  Math.min(1.0, Math.max(0.01, finalVol)),
                  now,
                  generalUpdateTimeConstant,
                );
              }
            } else if (node.audioNodes.orbitoneSynths) {
              const baseAmp = node.audioNodes.baseGain || 1;
              const actualCount = node.audioNodes.orbitoneSynths.length;
              for (let i = 0; i < actualCount; i++) {
                const synth = node.audioNodes.orbitoneSynths[i];
                if (!synth || !synth.mix || !synth.mix.gain) continue;
                let finalVol = 0;
                if (i < node.audioParams.orbitoneCount) {
                  const targetAmp = synth.baseGain || 1;
                  finalVol = baseMix * baseAmp * targetAmp;
                  const phaseOffset =
                    (node.orbitoneRotatePhase || 0) +
                    ((i + 1) / totalNotes) * rotateSpread;
                  const rotPos = phaseOffset % 1;
                  const ampMod =
                    ORBITONE_ROTATE_MIN_VOL +
                    (1 - ORBITONE_ROTATE_MIN_VOL) *
                      (0.5 + 0.5 * Math.sin(rotPos * 2 * Math.PI));
                  finalVol *= ampMod;
                }
                synth.mix.gain.setTargetAtTime(
                  Math.min(1.0, Math.max(0.01, finalVol)),
                  now,
                  generalUpdateTimeConstant,
                );
              }
            }
          }
        while (
          node.orbitoneRotatePhase >= 1 &&
          node.audioParams.orbitoneIntervals &&
          node.audioParams.orbitoneIntervals.length > 0
        ) {
          const first = node.audioParams.orbitoneIntervals.shift();
          node.audioParams.orbitoneIntervals.push(first);
          node.orbitoneRotatePhase -= 1;
          updateNodeAudioParams(node);
        }
      } else if (node.type === TIMELINE_GRID_TYPE) {
        if (node.audioParams && node.audioParams.autoRotateEnabled) {
            let rotationIncrement = 0;
            if (isGlobalSyncEnabled && node.audioParams.autoRotateSyncSubdivisionIndex !== undefined && globalBPM > 0) {
                const subdivOpt = subdivisionOptions[node.audioParams.autoRotateSyncSubdivisionIndex];
                if (subdivOpt && typeof subdivOpt.value === 'number') {
                    const secondsPerFullRotation = (60.0 / globalBPM) * subdivOpt.value * 4; 
                    if (secondsPerFullRotation > 0) {
                         rotationIncrement = (Math.PI * 2 / secondsPerFullRotation) * deltaTime;
                    }
                }
            } else {
                rotationIncrement = (node.audioParams.autoRotateSpeedManual || TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SPEED_MANUAL) * (deltaTime * 60) ;
            }

            if (node.audioParams.autoRotateDirection === "counter-clockwise") {
                rotationIncrement *= -1;
            }
            node.audioParams.rotation = (node.audioParams.rotation || 0) + rotationIncrement;
            node.audioParams.rotation %= (Math.PI * 2);
            node.rotation = node.audioParams.rotation;
        }

        if (node.timelineIsPlaying) {
          const prevScanLinePositionRatio =
            ((node.scanLinePosition % 1) + 1) % 1;
          const gridRotation = node.audioParams?.rotation || 0;

          const cappedDeltaTime = Math.min(deltaTime, 1.0 / 15);
          let currentTimelineDurationSeconds;

          if (
            isGlobalSyncEnabled &&
            node.timelineMusicalDurationBars &&
            globalBPM > 0
          ) {
            const beatsPerBar = 4;
            currentTimelineDurationSeconds =
              node.timelineMusicalDurationBars *
              beatsPerBar *
              (60.0 / globalBPM);
          } else {
            currentTimelineDurationSeconds =
              node.timelineSpeed > 0 ?
              node.timelineSpeed :
              TIMELINE_GRID_DEFAULT_SPEED;
          }

          if (currentTimelineDurationSeconds <= 0) {
            currentTimelineDurationSeconds = TIMELINE_GRID_DEFAULT_SPEED;
          }

          let effectiveSpeedRatio =
            cappedDeltaTime / currentTimelineDurationSeconds;
          let boundaryReachedThisFrame = false;
          const wasPingPongForward = node.isPingPongForward;
          const startOffset = node.timelineStartOffset || 0;

          if (node.scanlineDirection === "forward") {
            node.scanLinePosition += effectiveSpeedRatio;
            if (node.scanLinePosition >= 1.0) {
              boundaryReachedThisFrame = true;
              if (node.timelineIsLooping) {
                node.scanLinePosition -= 1.0;
              } else {
                node.scanLinePosition = 1.0;
                node.timelineIsPlaying = false;
              }
            }
          } else if (node.scanlineDirection === "backward") {
            node.scanLinePosition -= effectiveSpeedRatio;
            if (node.scanLinePosition <= 0.0) {
              boundaryReachedThisFrame = true;
              if (node.timelineIsLooping) {
                node.scanLinePosition += 1.0;
              } else {
                node.scanLinePosition = 0.0;
                node.timelineIsPlaying = false;
              }
            }
          } else if (node.scanlineDirection === "ping-pong") {
            if (node.isPingPongForward) {
              node.scanLinePosition += effectiveSpeedRatio;
              if (node.scanLinePosition >= 1.0) {
                boundaryReachedThisFrame = true;
                node.scanLinePosition = 1.0 - (node.scanLinePosition - 1.0);
                node.isPingPongForward = false;
              }
            } else {
              node.scanLinePosition -= effectiveSpeedRatio;
              if (node.scanLinePosition <= 0.0) {
                boundaryReachedThisFrame = true;
                node.scanLinePosition = Math.abs(node.scanLinePosition);
                node.isPingPongForward = true;
              }
            }
          }
          if (!node.timelineIsLooping && boundaryReachedThisFrame) {
            node.scanLinePosition = Math.max(
              0.0,
              Math.min(1.0, node.scanLinePosition),
            );
          } else if (
            boundaryReachedThisFrame &&
            node.timelineIsLooping &&
            node.scanlineDirection !== "ping-pong"
          ) {
            node.scanLinePosition = 0;
            if (node.triggeredInThisSweep) node.triggeredInThisSweep.clear();
            else node.triggeredInThisSweep = new Set();
          }
          const prevScanLineLocalX =
            -node.width / 2 +
            (((prevScanLinePositionRatio % 1) + 1) % 1) * node.width;
          const currentScanLineLocalX =
            -node.width / 2 + (((node.scanLinePosition % 1) + 1) % 1) * node.width;

          let segmentsToTestLocal = [];
          if (boundaryReachedThisFrame) {
            if (node.timelineIsLooping) {
              if (node.scanlineDirection === "forward") {
                segmentsToTestLocal.push({
                  min: prevScanLineLocalX,
                  max: node.width / 2,
                });
                segmentsToTestLocal.push({
                  min: -node.width / 2,
                  max: currentScanLineLocalX,
                });
              } else if (node.scanlineDirection === "backward") {
                segmentsToTestLocal.push({
                  min: -node.width / 2,
                  max: prevScanLineLocalX,
                });
                segmentsToTestLocal.push({
                  min: currentScanLineLocalX,
                  max: node.width / 2,
                });
              } else if (node.scanlineDirection === "ping-pong") {
                segmentsToTestLocal.push({
                  min: Math.min(prevScanLineLocalX, currentScanLineLocalX),
                  max: Math.max(prevScanLineLocalX, currentScanLineLocalX),
                });
              }
            } else {
              segmentsToTestLocal.push({
                min: Math.min(prevScanLineLocalX, currentScanLineLocalX),
                max: Math.max(prevScanLineLocalX, currentScanLineLocalX),
              });
            }
            if (node.triggeredInThisSweep) node.triggeredInThisSweep.clear();
            else node.triggeredInThisSweep = new Set();
          } else {
            segmentsToTestLocal.push({
              min: Math.min(prevScanLineLocalX, currentScanLineLocalX),
              max: Math.max(prevScanLineLocalX, currentScanLineLocalX),
            });
          }

          if (Math.abs(prevScanLineLocalX - currentScanLineLocalX) > 0.0001) {
            nodes.forEach((otherNode) => {
              if (
                otherNode.id === node.id ||
                otherNode.type === TIMELINE_GRID_TYPE
              )
                return;
              if (
                !otherNode.audioParams &&
                !isDrumType(otherNode.type) &&
                otherNode.type !== "sound" &&
                otherNode.type !== PRORB_TYPE &&
                otherNode.type !== "nebula" &&
                otherNode.type !== PORTAL_NEBULA_TYPE &&
                otherNode.type !== "global_key_setter" 
              )
                return;

              const nodeApparentRadius = NODE_RADIUS_BASE * otherNode.size;
              const translatedX = otherNode.x - node.x;
              const translatedY = otherNode.y - node.y;
              const cosTheta = Math.cos(-gridRotation);
              const sinTheta = Math.sin(-gridRotation);
              const otherNodeLocalX =
                translatedX * cosTheta - translatedY * sinTheta;
              const otherNodeLocalY =
                translatedX * sinTheta + translatedY * cosTheta;

              if (
                otherNodeLocalY + nodeApparentRadius < -node.height / 2 ||
                otherNodeLocalY - nodeApparentRadius > node.height / 2
              ) {
                return;
              }

              for (const segment of segmentsToTestLocal) {
                const nodeLocalLeftEdge = otherNodeLocalX - nodeApparentRadius;
                const nodeLocalRightEdge = otherNodeLocalX + nodeApparentRadius;

                if (
                  Math.max(nodeLocalLeftEdge, segment.min) <=
                  Math.min(nodeLocalRightEdge, segment.max)
                ) {
                  if (
                    !node.triggeredInThisSweep ||
                    !node.triggeredInThisSweep.has(otherNode.id)
                  ) {
                    const timelinePulseData = {
                      intensity:
                        node.timelinePulseIntensity ||
                        TIMELINE_GRID_DEFAULT_PULSE_INTENSITY,
                      color:
                        node.audioParams &&
                        node.audioParams.color !== undefined &&
                        node.audioParams.color !== null ?
                        node.audioParams.color :
                        TIMELINE_GRID_DEFAULT_COLOR,
                      particleMultiplier: 0.6,
                      fromTimeline: true,
                    };

                    let transpositionOverride = null;
                    if (
                      node.audioParams?.isTransposeEnabled &&
                      otherNode.audioParams?.hasOwnProperty("scaleIndex")
                    ) {
                      const amount = node.audioParams.transposeAmount || 0;
                      const direction =
                        node.audioParams.transposeDirection === "+" ? 1 : -1;
                      const offset = direction * amount;
                      const originalScaleIndex =
                        otherNode.audioParams.scaleIndex;
                      const newScaleIndex = originalScaleIndex + offset;

                      transpositionOverride = {
                        scaleIndexOverride: Math.max(
                          MIN_SCALE_INDEX,
                          Math.min(MAX_SCALE_INDEX, newScaleIndex),
                        ),
                      };
                    }

                    if (otherNode.type === "global_key_setter") {
                        activateGlobalKeySetter(otherNode);
                    } else if (otherNode.type === "pulsar_triggerable") {
                      otherNode.isEnabled = !otherNode.isEnabled;
                      otherNode.animationState = 1;
                      if (otherNode.isEnabled) {
                        const nowTime = audioContext ?
                          audioContext.currentTime :
                          performance.now() / 1000;
                        otherNode.lastTriggerTime = -1;
                        otherNode.nextSyncTriggerTime = 0;
                        otherNode.nextRandomTriggerTime = 0;
                        if (
                          isGlobalSyncEnabled &&
                          !otherNode.audioParams.ignoreGlobalSync
                        ) {
                          const pulsarSecondsPerBeat =
                            60.0 / (globalBPM || 120);
                          const subdivIndex =
                            otherNode.audioParams.syncSubdivisionIndex ??
                            DEFAULT_SUBDIVISION_INDEX;
                          if (
                            subdivIndex >= 0 &&
                            subdivIndex < subdivisionOptions.length
                          ) {
                            const subdiv = subdivisionOptions[subdivIndex];
                            if (
                              subdiv &&
                              typeof subdiv.value === "number" &&
                              pulsarSecondsPerBeat > 0
                            ) {
                              const nodeIntervalSeconds =
                                pulsarSecondsPerBeat * subdiv.value;
                              if (nodeIntervalSeconds > 0) {
                                otherNode.nextSyncTriggerTime =
                                  Math.ceil(nowTime / nodeIntervalSeconds) *
                                  nodeIntervalSeconds;
                                if (
                                  otherNode.nextSyncTriggerTime <=
                                  nowTime + 0.01
                                ) {
                                  otherNode.nextSyncTriggerTime +=
                                    nodeIntervalSeconds;
                                }
                              }
                            }
                          }
                        } else {
                          const interval =
                            otherNode.audioParams.triggerInterval ||
                            DEFAULT_TRIGGER_INTERVAL;
                          otherNode.lastTriggerTime =
                            nowTime - interval * Math.random();
                        }
                      }
                    } else if (
                      (otherNode.type === "sound" || otherNode.type === PRORB_TYPE ||
                        isDrumType(otherNode.type)) &&
                      otherNode.audioParams &&
                      otherNode.audioParams.retriggerEnabled
                    ) {
                      startRetriggerSequence(
                        otherNode,
                        timelinePulseData,
                        transpositionOverride,
                      );
                    } else {
                      triggerNodeEffect(
                        otherNode,
                        timelinePulseData,
                        null,
                        0.3,
                        transpositionOverride,
                      );
                    }

                    if (!node.triggeredInThisSweep)
                      node.triggeredInThisSweep = new Set();
                    node.triggeredInThisSweep.add(otherNode.id);

                    otherNode.animationState = 1.0;
                    setTimeout(() => {
                      const stillNode = findNodeById(otherNode.id);
                      if (stillNode) {
                        if (stillNode.type === "pulsar_triggerable") {
                          if (
                            !stillNode.isEnabled &&
                            stillNode.animationState === 1
                          )
                            stillNode.animationState = 0;
                        } else if (
                          !stillNode.isTriggered &&
                          (!stillNode.activeRetriggers ||
                            stillNode.activeRetriggers.length === 0)
                        ) {
                          stillNode.animationState = 0;
                        }
                      }
                    }, 250);
                    break; 
                  }
                }
              }
            });
          }
        }
      }
    });

    try {
      updateNebulaInteractionAudio();
    } catch (nebError) {}

    if (currentTool === "brush" && isBrushing && lastBrushNode) {
      if (Math.random() < 0.3) {
        createParticles(lastBrushNode.x, lastBrushNode.y, 1);
      }
    }

    if (
      tapeWaveformCanvas &&
      tapeWaveformCtx &&
      tapeLoopBuffer &&
      tapeVisualPlayhead &&
      tapeVisualLoopRegion
    ) {
      const bufferDuration = tapeLoopBuffer.duration;
      if (bufferDuration > 0) {
        if (
          isTapeLoopPlaying &&
          tapeLoopSourceNode &&
          tapeLoopSourceNodeStartTime > 0
        ) {
          const playbackRate = tapeLoopSourceNode.playbackRate.value;
          const timeElapsedSinceAudioStart =
            (audioContext.currentTime - tapeLoopSourceNodeStartTime) *
            playbackRate;
          const loopSegmentDuration =
            tapeLoopSourceNode.loopEnd - tapeLoopSourceNode.loopStart;
          let currentPositionInLoopSegment =
            timeElapsedSinceAudioStart % loopSegmentDuration;
          if (currentPositionInLoopSegment < 0)
            currentPositionInLoopSegment += loopSegmentDuration;
          const absoluteBufferPosition =
            tapeLoopSourceNode.loopStart + currentPositionInLoopSegment;

          if (tapeVisualPlayhead && tapeLoopBuffer.duration > 0) {
            const displayWindowDuration = Math.max(
              0.01,
              tapeDisplayEndTime - tapeDisplayStartTime,
            );
            const playheadRelToDisplay =
              (absoluteBufferPosition - tapeDisplayStartTime) /
              displayWindowDuration;
            tapeVisualPlayhead.style.left = `${Math.min(100, Math.max(0, playheadRelToDisplay * 100))}%`;
          }
        } else if (isTapeLoopRecording) {
          const displayWindowDuration = Math.max(
            0.01,
            tapeDisplayEndTime - tapeDisplayStartTime,
          );
          const recordedTime = tapeLoopWritePosition / audioContext.sampleRate;
          const recordPercentRelToDisplay =
            (recordedTime - tapeDisplayStartTime) / displayWindowDuration;
          tapeVisualPlayhead.style.left = `${Math.min(100, Math.max(0, recordPercentRelToDisplay * 100))}%`;
        } else {
          const displayWindowDuration = Math.max(
            0.01,
            tapeDisplayEndTime - tapeDisplayStartTime,
          );
          const startPercentRelToDisplay =
            (userDefinedLoopStart - tapeDisplayStartTime) /
            displayWindowDuration;
          tapeVisualPlayhead.style.left = `${Math.min(100, Math.max(0, startPercentRelToDisplay * 100))}%`;
        }
      }
    }

    if (
      isTapeLoopPlaying ||
      isTapeLoopRecording ||
      (tapeLoopRecordBtn && tapeLoopRecordBtn.dataset.isArmed === "true")
    ) {
      let speedMultiplier = 1.0;
      if (isTapeLoopPlaying && tapeLoopSourceNode) {
        speedMultiplier = tapeLoopSourceNode.playbackRate.value;
      }
      tapeReelAngle += 2 * speedMultiplier * (deltaTime * 60);
      if (tapeReelLeft) {
        tapeReelLeft.style.transform = `rotate(${tapeReelAngle}deg)`;
      }
      if (tapeReelRight) {
        tapeReelRight.style.transform = `rotate(${tapeReelAngle}deg)`;
      }
    }
    draw();
  } catch (loopError) {
    console.error('animationLoop error', loopError);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
  previousFrameTime = now;
}


groupFluctuateToggle.addEventListener("change", (e) => {
  const isChecked = e.target.checked;

  currentConstellationGroup.forEach((nodeId) => {
    if (isChecked) {
      fluctuatingGroupNodeIDs.add(nodeId);
    } else {
      fluctuatingGroupNodeIDs.delete(nodeId);
    }
  });
  updateFluctuatingNodesLFO();
  groupFluctuateAmount.disabled = !isChecked;
  saveState();
});
groupFluctuateAmount.addEventListener("input", applyGroupFluctuationSettings);
groupFluctuateAmount.addEventListener("change", saveState);

function applyGroupFluctuationSettings() {
  updateFluctuatingNodesLFO();
  saveState();
}

function updateFluctuatingNodesLFO() {
  if (!isAudioReady) return;
  const fluctuationAmount = parseFloat(groupFluctuateAmount.value);
  const now = audioContext.currentTime;
  nodes.forEach((node) => {
    if (node.type === "sound" && node.audioNodes?.volLfoGain) {
      const shouldFluctuate = fluctuatingGroupNodeIDs.has(node.id);
      const targetDepth = shouldFluctuate
        ? fluctuationAmount
        : node.audioParams.volLfoDepth || 0;
      try {
        node.audioNodes.volLfoGain.gain.setTargetAtTime(targetDepth, now, 0.1);
      } catch (e) {}
    }
  });
}


function calculateGridSpacing() {
  if (isGlobalSyncEnabled) {
    const pixelsPerBeat =
      PIXELS_PER_SIXTEENTH_AT_REF_BPM * 4 * (REFERENCE_BPM / globalBPM);
    return Math.max(5, pixelsPerBeat / 4);
  } else {
    return DEFAULT_GRID_SIZE_PX;
  }
}

function snapToGrid(x, y) {
  const spacing = calculateGridSpacing();
  if (!isSnapEnabled || spacing <= 0) {
    return {
      x: x,
      y: y,
    };
  }
  const snappedX = Math.round(x / spacing) * spacing;
  const snappedY = Math.round(y / spacing) * spacing;
  return {
    x: snappedX,
    y: snappedY,
  };
}

function drawGrid() {
  const spacing = calculateGridSpacing();
  if (!isGridVisible || spacing <= 0) return;
  ctx.strokeStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--grid-color")
      .trim() || "rgba(100, 130, 180, 0.15)";
  ctx.lineWidth = 0.5 / viewScale;
  ctx.fillStyle = ctx.strokeStyle;
  const worldTopLeft = getWorldCoords(0, 0);
  const worldBottomRight = getWorldCoords(canvas.width, canvas.height);
  const startX = Math.floor(worldTopLeft.x / spacing) * spacing;
  const startY = Math.floor(worldTopLeft.y / spacing) * spacing;
  const endX = Math.ceil(worldBottomRight.x / spacing) * spacing;
  const endY = Math.ceil(worldBottomRight.y / spacing) * spacing;
  if (gridType === "lines") {
    ctx.beginPath();
    for (let x = startX; x < endX; x += spacing) {
      ctx.moveTo(x, worldTopLeft.y);
      ctx.lineTo(x, worldBottomRight.y);
    }
    for (let y = startY; y < endY; y += spacing) {
      ctx.moveTo(worldTopLeft.x, y);
      ctx.lineTo(worldBottomRight.x, y);
    }
    ctx.stroke();
  } else {
    const dotSize = 2 / viewScale;
    const dotOffset = dotSize / 2;
    ctx.beginPath();
    for (let x = startX; x < endX; x += spacing) {
      for (let y = startY; y < endY; y += spacing) {
        ctx.fillRect(x - dotOffset, y - dotOffset, dotSize, dotSize);
      }
    }
  }
}




function drawNode(node) {
  if (node.type === "nebula" && nebulaIdsToHide.has(node.id)) return;
  ctx.shadowBlur = 0;
  const isSelected = isElementSelected("node", node.id);
  const isSelectedAndOutlineNeeded = isSelected && currentTool === "edit";
  const flashDuration = 0.1;
  let preTriggerFlash = 0;
  let wobbleX = 0,
    wobbleY = 0;
  const now = audioContext
    ? audioContext.currentTime
    : performance.now() / 1000;
  const params = node.audioParams;

  if (
    isPlaying &&
    isGlobalSyncEnabled &&
    node.isStartNode &&
    isSelectedAndOutlineNeeded &&
    node.nextSyncTriggerTime > 0 &&
    node.type !== "pulsar_random_particles"
  ) {
    const timeToNext =
      node.nextSyncTriggerTime - (audioContext?.currentTime ?? 0);
    if (timeToNext > 0 && timeToNext < flashDuration) {
      preTriggerFlash = (1.0 - timeToNext / flashDuration) * 0.6;
    }
  }

  let isActiveRetriggerVisual =
    node.activeRetriggers &&
    node.activeRetriggers.length > 0 &&
    node.currentRetriggerVisualIndex !== -1;

  if (
    node.animationState > 0 &&
    !node.isTriggered &&
    !isActiveRetriggerVisual
  ) {
    node.animationState -=
      ["sound", "nebula", PORTAL_NEBULA_TYPE, PRORB_TYPE].includes(node.type) ||
      isDrumType(node.type)
        ? 0.03
        : 0.08;
  }
  node.animationState = Math.max(0, node.animationState);

  const bloomFactor = 1 + node.animationState * 0.5 + preTriggerFlash * 0.6;
  const currentRadius = NODE_RADIUS_BASE * node.size * bloomFactor;
  const r = currentRadius;
  let fillColor, borderColor, glowColor, osc2Color, accentColor;
  const styles = getComputedStyle(document.documentElement);
  const scaleBase = currentScale.baseHSL || {
    h: 200,
    s: 70,
    l: 70,
  };
  const isStartNodeDisabled = node.isStartNode && !node.isEnabled;
  const disabledFillColorGeneral = styles
    .getPropertyValue("--start-node-disabled-color")
    .trim();
  const disabledBorderColorGeneral = styles
    .getPropertyValue("--start-node-disabled-border")
    .trim();
  const baseAlpha =
    (node.type === "nebula"
      ? 0.5
      : node.type === PORTAL_NEBULA_TYPE
        ? 0.7
        : 0.6) +
    (node.size || 1.0) * 0.3;

  if (isPulsarType(node.type)) {
    const cssVarBase = `--${node.type.replace("_", "-")}`;
    fillColor = isStartNodeDisabled
      ? disabledFillColorGeneral
      : node.color ||
        styles
          .getPropertyValue(
            `${cssVarBase}-color`,
            styles.getPropertyValue("--start-node-color"),
          )
          .trim();
    borderColor = isStartNodeDisabled
      ? disabledBorderColorGeneral
      : node.color
        ? node.color.replace(/[\d\.]+\)$/g, "1)")
        : styles
            .getPropertyValue(
              `${cssVarBase}-border`,
              styles.getPropertyValue("--start-node-border"),
            )
            .trim();
    glowColor = isStartNodeDisabled ? "transparent" : borderColor;
  } else if (isDrumType(node.type)) {
    const typeName = node.type.replace("_", "-");
    fillColor = styles.getPropertyValue(`--${typeName}-color`).trim() || "grey";
    borderColor =
      styles.getPropertyValue(`--${typeName}-border`).trim() || "darkgrey";
    glowColor = borderColor;
  } else if (node.type === "gate") {
    fillColor = styles.getPropertyValue("--gate-node-color").trim();
    borderColor = styles.getPropertyValue("--gate-node-border").trim();
    glowColor = borderColor;
  } else if (node.type === "probabilityGate") {
    fillColor = styles.getPropertyValue("--probability-gate-node-color").trim();
    borderColor = styles
      .getPropertyValue("--probability-gate-node-border")
      .trim();
    glowColor = borderColor;
  } else if (node.type === "pitchShift") {
    fillColor = styles.getPropertyValue("--pitch-node-color").trim();
    borderColor = styles.getPropertyValue("--pitch-node-border").trim();
    glowColor = borderColor;
  } else if (node.type === "relay") {
    fillColor = styles.getPropertyValue("--relay-node-color").trim();
    borderColor = styles.getPropertyValue("--relay-node-border").trim();
    glowColor = borderColor;
  } else if (node.type === "reflector") {
    fillColor = styles.getPropertyValue("--reflector-node-color").trim();
    borderColor = styles.getPropertyValue("--reflector-node-border").trim();
    glowColor = borderColor;
  } else if (node.type === "switch") {
    fillColor = styles.getPropertyValue("--switch-node-color").trim();
    borderColor = styles.getPropertyValue("--switch-node-border").trim();
    glowColor = borderColor;
  } else if (node.type === CANVAS_SEND_ORB_TYPE) {
    fillColor = styles.getPropertyValue("--canvas-orb-send-color").trim();
    borderColor = styles.getPropertyValue("--canvas-orb-send-border").trim();
    glowColor = borderColor;
  } else if (node.type === CANVAS_RECEIVE_ORB_TYPE) {
    fillColor = styles.getPropertyValue("--canvas-orb-receive-color").trim();
    borderColor = styles.getPropertyValue("--canvas-orb-receive-border").trim();
    glowColor = borderColor;
  } else if (node.type === PRORB_TYPE) {
    const nodeBaseHue =
      (scaleBase.h + ((params?.scaleIndex || 0) % currentScale.notes.length) * HUE_STEP) %
      360;
    const lightness = scaleBase.l * (0.8 + node.size * 0.2);
    const saturation = scaleBase.s;
    fillColor = hslToRgba(nodeBaseHue, saturation, lightness, Math.min(0.95, baseAlpha));
    borderColor = hslToRgba(nodeBaseHue, saturation * 0.8, lightness * 0.6, 0.9);
    glowColor = borderColor;
    osc2Color = hslToRgba(nodeBaseHue, saturation * 0.7, Math.min(100, lightness * 1.2), Math.min(0.8, baseAlpha));
  } else if (node.type === MIDI_ORB_TYPE) {
    const nodeBaseHue =
      (scaleBase.h + ((params?.scaleIndex || 0) % currentScale.notes.length) * HUE_STEP) %
      360;
    const lightness = scaleBase.l * (0.8 + node.size * 0.2);
    const saturation = scaleBase.s * 0.85;
    fillColor = hslToRgba(nodeBaseHue, saturation, lightness, Math.min(0.95, baseAlpha));
    borderColor = hslToRgba(nodeBaseHue, saturation * 0.8, lightness * 0.6, 0.9);
    glowColor = borderColor;
  } else if (node.type === RADIO_ORB_TYPE) {
    const nodeBaseHue =
      (scaleBase.h + ((params?.scaleIndex || 0) % currentScale.notes.length) * HUE_STEP) %
      360;
    const lightness = scaleBase.l * (0.8 + node.size * 0.2);
    const saturation = scaleBase.s;
    fillColor = hslToRgba(nodeBaseHue, saturation, lightness, Math.min(0.95, baseAlpha));
    borderColor = hslToRgba(nodeBaseHue, saturation * 0.8, lightness * 0.6, 0.9);
    accentColor = hslToRgba(nodeBaseHue, saturation * 0.9, lightness * 0.3, Math.min(0.95, baseAlpha));
    glowColor = borderColor;
  } else if (
    node.type === "sound" ||
    node.type === ALIEN_ORB_TYPE ||
    node.type === ALIEN_DRONE_TYPE ||
    node.type === ARVO_DRONE_TYPE ||
    node.type === FM_DRONE_TYPE ||
    node.type === RESONAUTER_TYPE ||
    node.type === "nebula" ||
    node.type === PORTAL_NEBULA_TYPE
  ) {
    const nodeBaseHue =
      (node.type === "nebula" || node.type === PORTAL_NEBULA_TYPE) &&
      node.baseHue !== null &&
      node.baseHue !== undefined
        ? node.baseHue
        : (scaleBase.h +
            ((params?.scaleIndex || 0) % currentScale.notes.length) *
              HUE_STEP) %
          360;
    const lightness = scaleBase.l * (0.8 + node.size * 0.2);
    const saturation =
      scaleBase.s *
      (node.type === "nebula"
        ? 0.7
        : node.type === PORTAL_NEBULA_TYPE
          ? 0.9
          : 1.0);
    const alpha = baseAlpha;
    fillColor = hslToRgba(
      nodeBaseHue,
      saturation,
      lightness,
      Math.min(0.95, alpha),
    );
    borderColor = hslToRgba(
      nodeBaseHue,
      saturation * 0.8,
      lightness * 0.6,
      0.9,
    );
    glowColor = hslToRgba(nodeBaseHue, saturation, lightness * 1.1, 1.0);
  } else if (node.type === TIMELINE_GRID_TYPE) {
    const currentStylesTimeline = getComputedStyle(document.documentElement);
    const gridBoxStrokeFromCSSTimeline =
      currentStylesTimeline
        .getPropertyValue("--timeline-grid-default-border-color")
        .trim() || "rgba(120, 220, 120, 0.7)";
    fillColor =
      node.audioParams &&
      node.audioParams.color !== undefined &&
      node.audioParams.color !== null
        ? node.audioParams.color.replace(/[\d\.]+\)$/g, "0.05)")
        : gridBoxStrokeFromCSSTimeline.replace(/[\d\.]+\)$/g, "0.05)");
    borderColor =
      node.audioParams &&
      node.audioParams.color !== undefined &&
      node.audioParams.color !== null
        ? node.audioParams.color
        : gridBoxStrokeFromCSSTimeline;
    glowColor =
      node.audioParams &&
      node.audioParams.color !== undefined &&
      node.audioParams.color !== null
        ? node.audioParams.color
        : gridBoxStrokeFromCSSTimeline;
  } else if (node.type === GRID_SEQUENCER_TYPE) {
    const currentStylesTimeline = getComputedStyle(document.documentElement);
    const gridBoxStrokeFromCSS =
      currentStylesTimeline
        .getPropertyValue("--timeline-grid-default-border-color")
        .trim() || "rgba(220, 220, 220, 0.8)";
    fillColor = gridBoxStrokeFromCSS.replace(/[\d\.]+\)$/g, "0.05)");
    borderColor = gridBoxStrokeFromCSS;
    glowColor = gridBoxStrokeFromCSS;
  } else if (node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE) {
    const currentStylesRadar = getComputedStyle(document.documentElement);
    const radarStroke =
      currentStylesRadar
        .getPropertyValue("--spaceradar-border-color")
        .trim() || SPACERADAR_DEFAULT_COLOR;
    fillColor = radarStroke.replace(/[\d\.]+\)$/g, "0.05)");
    borderColor = radarStroke;
    glowColor = radarStroke;
  } else if (node.type === MOTOR_ORB_TYPE) {
    fillColor = styles.getPropertyValue("--motor-orb-color").trim() || "grey";
    borderColor = styles.getPropertyValue("--motor-orb-border").trim() || "darkgrey";
    glowColor = borderColor;
  } else {
    fillColor = "grey";
    borderColor = "darkgrey";
    glowColor = "white";
  }

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = borderColor;
  const baseLineWidth = node.isStartNode
    ? 2.5
    : node.type === "relay" ||
        node.type === "reflector" ||
        node.type === "switch"
      ? 1.0
      : node.type === TIMELINE_GRID_TYPE || node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE || node.type === GRID_SEQUENCER_TYPE || node.type === PRORB_TYPE
        ? 2.0
        : 1.5;
  ctx.lineWidth = Math.max(
    0.5 / viewScale,
    (isSelectedAndOutlineNeeded || node.isInResizeMode
      ? baseLineWidth + 1.5
      : baseLineWidth) / viewScale,
  );

  let needsRestore = false;
  if (
    node.type === TIMELINE_GRID_TYPE &&
    node.audioParams &&
    typeof node.audioParams.rotation === "number" &&
    node.audioParams.rotation !== 0
  ) {
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.rotate(node.audioParams.rotation);
    ctx.translate(-node.x, -node.y);
    needsRestore = true;
  } else if (
    (node.type === "gate" ||
      (node.type === "sound" &&
        node.type !== PRORB_TYPE &&
        params?.waveform?.startsWith("sampler_"))) &&
    node.currentAngle !== undefined
  ) {
    ctx.save();
    ctx.translate(node.x, node.y);
    if (node.type === "gate") {
      ctx.rotate(node.currentAngle);
    } else if (
      node.type === "sound" &&
      params.waveform.startsWith("sampler_")
    ) {
      node.currentAngle =
        (node.currentAngle + 0.005 * (performance.now() * 0.01)) %
        (Math.PI * 2);
      ctx.rotate(node.currentAngle);
    }
    ctx.translate(-node.x, -node.y);
    needsRestore = true;
  }

  if (
    node.isInConstellation &&
    currentTool === "edit" &&
    node.type !== TIMELINE_GRID_TYPE &&
    node.type !== GRID_SEQUENCER_TYPE &&
    node.type !== SPACERADAR_TYPE &&
    node.type !== CRANK_RADAR_TYPE
  ) {
    const highlightRadius = NODE_RADIUS_BASE * node.size + 5;
    ctx.fillStyle =
      styles.getPropertyValue("--constellation-highlight").trim() ||
      "rgba(255, 255, 150, 0.15)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, highlightRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (
    (node.animationState > 0 ||
      preTriggerFlash > 0 ||
      isSelectedAndOutlineNeeded ||
      node.isInResizeMode ||
      node.type === "nebula" ||
      node.type === PORTAL_NEBULA_TYPE ||
      node.type === PRORB_TYPE) &&
    !isStartNodeDisabled &&
    node.type !== TIMELINE_GRID_TYPE &&
    node.type !== GRID_SEQUENCER_TYPE &&
    node.type !== SPACERADAR_TYPE &&
    node.type !== CRANK_RADAR_TYPE
  ) {
    ctx.shadowColor = glowColor;
    let glowAmount =
      (isPulsarType(node.type) ||
      isDrumType(node.type) ||
      node.type === "nebula" ||
      node.type === PORTAL_NEBULA_TYPE ||
      node.type === PRORB_TYPE
        ? 5
        : 0) +
      (node.animationState + preTriggerFlash) * 15 +
      (isSelectedAndOutlineNeeded || node.isInResizeMode ? 5 : 0);
    if (
      node.type === "gate" ||
      node.type === "probabilityGate" ||
      node.type === "pitchShift" ||
      node.type === "relay" ||
      node.type === "reflector" ||
      node.type === "switch"
    ) {
      glowAmount =
        (isSelectedAndOutlineNeeded || node.isInResizeMode ? 5 : 0) +
        (node.animationState > 0 ? 10 + node.animationState * 10 : 0);
    } else if (node.type === "nebula") {
      const pulseEffect = (Math.sin(node.pulsePhase) * 0.5 + 0.5) * 8;
      glowAmount =
        3 +
        pulseEffect +
        (isSelectedAndOutlineNeeded || node.isInResizeMode ? 5 : 0);
    } else if (node.type === PORTAL_NEBULA_TYPE) {
      const pulseEffectGlow =
        (Math.sin(node.pulsePhase * 0.8) * 0.5 + 0.5) * 15;
      glowAmount =
        10 +
        pulseEffectGlow +
        (isSelectedAndOutlineNeeded || node.isInResizeMode ? 5 : 0);
    } else if (node.type === PRORB_TYPE) {
      glowAmount =
        (isSelectedAndOutlineNeeded ? 8 : 3) + node.animationState * 10;
    }
    ctx.shadowBlur = Math.min(40, glowAmount) / viewScale;
  } else {
    ctx.shadowBlur = 0;
  }

  const visualStyle = params?.visualStyle;

  if (node.type === TIMELINE_GRID_TYPE) {
    const rectX = node.x - node.width / 2;
    const rectY = node.y - node.height / 2;
    const currentStylesTimeline = getComputedStyle(document.documentElement);
    const gridBoxStrokeActual =
      node.audioParams &&
      node.audioParams.color !== undefined &&
      node.audioParams.color !== null
        ? node.audioParams.color
        : currentStylesTimeline
            .getPropertyValue("--timeline-grid-default-border-color")
            .trim() || "rgba(120, 220, 120, 0.7)";
    const gridBoxFillActual = gridBoxStrokeActual.replace(
      /[\d\.]+\)$/g,
      "0.05)",
    );
    const scanlineColor =
      currentStylesTimeline
        .getPropertyValue("--timeline-grid-default-scanline-color")
        .trim() || gridBoxStrokeActual.replace(/[\d\.]+\)$/g, "0.9)");
    const internalGridLineColor =
      currentStylesTimeline
        .getPropertyValue("--timeline-grid-internal-lines-color")
        .trim() || gridBoxStrokeActual.replace(/[\d\.]+\)$/g, "0.3)");

    ctx.fillStyle = gridBoxFillActual;
    ctx.fillRect(rectX, rectY, node.width, node.height);

    ctx.strokeStyle = gridBoxStrokeActual;
    let currentDefaultLineWidth = Math.max(0.8 / viewScale, 2 / viewScale);
    ctx.lineWidth = currentDefaultLineWidth;

    if (isSelectedAndOutlineNeeded || node.isInResizeMode) {
      const originalStrokeStyle = ctx.strokeStyle;
      const originalLineWidth = ctx.lineWidth;
      const originalShadowColor = ctx.shadowColor;
      const originalShadowBlur = ctx.shadowBlur;

      ctx.strokeStyle = "rgba(255, 255, 0, 0.9)";
      ctx.lineWidth = Math.max(
        0.5 / viewScale,
        (baseLineWidth + 2) / viewScale,
      );
      ctx.shadowColor = "rgba(255, 255, 0, 0.7)";
      ctx.shadowBlur = 10 / viewScale;
      ctx.strokeRect(rectX, rectY, node.width, node.height);

      ctx.strokeStyle = originalStrokeStyle;
      ctx.lineWidth = originalLineWidth;
      ctx.shadowColor = originalShadowColor;
      ctx.shadowBlur = originalShadowBlur;
    } else {
      ctx.strokeRect(rectX, rectY, node.width, node.height);
    }
    if (
      (node.type !== TIMELINE_GRID_TYPE && node.type !== GRID_SEQUENCER_TYPE && node.type !== SPACERADAR_TYPE && node.type !== CRANK_RADAR_TYPE) ||
      ((node.type === TIMELINE_GRID_TYPE || node.type === GRID_SEQUENCER_TYPE || node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE) &&
        ctx.shadowBlur !== 0 &&
        !(isSelectedAndOutlineNeeded || node.isInResizeMode))
    ) {
      ctx.shadowBlur = 0;
    }

    if (node.showInternalGrid && node.internalGridDivisions > 1) {
      const originalStrokeStyleInternal = ctx.strokeStyle;
      const originalLineWidthInternal = ctx.lineWidth;
      ctx.strokeStyle = internalGridLineColor;
      ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
      ctx.beginPath();
      for (let i = 1; i < node.internalGridDivisions; i++) {
        const lineX = rectX + i * (node.width / node.internalGridDivisions);
        ctx.moveTo(lineX, rectY);
        ctx.lineTo(lineX, rectY + node.height);
      }
      ctx.stroke();
      ctx.strokeStyle = originalStrokeStyleInternal;
      ctx.lineWidth = originalLineWidthInternal;
    }

    const displayScanPos = ((node.scanLinePosition % 1) + 1) % 1;
    if (displayScanPos >= 0 && displayScanPos <= 1.0) {
      const scanLineX = rectX + displayScanPos * node.width;
      const originalStrokeStyleScan = ctx.strokeStyle;
      const originalLineWidthScan = ctx.lineWidth;
      const originalShadowColorScan = ctx.shadowColor;
      const originalShadowBlurScan = ctx.shadowBlur;

      ctx.beginPath();
      ctx.moveTo(scanLineX, rectY);
      ctx.lineTo(scanLineX, rectY + node.height);
      ctx.strokeStyle = scanlineColor;
      ctx.lineWidth = Math.max(1 / viewScale, 2.5 / viewScale);
      ctx.shadowColor = scanlineColor;
      ctx.shadowBlur = 5 / viewScale;
      ctx.stroke();

      ctx.strokeStyle = originalStrokeStyleScan;
      ctx.lineWidth = originalLineWidthScan;
      ctx.shadowColor = originalShadowColorScan;
      ctx.shadowBlur = originalShadowBlurScan;
    }

    const shouldShowControls = isSelectedAndOutlineNeeded;
    if (shouldShowControls) {
      if (needsRestore) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(-(node.audioParams.rotation || 0));
        ctx.translate(-node.x, -node.y);
      }

      const iconSizeScreen = 16;
      const iconSizeWorld = iconSizeScreen / viewScale;
      const paddingScreen = 5;
      const paddingWorld = paddingScreen / viewScale;

      const resizeIconBoxX =
        node.x + node.width / 2 - iconSizeWorld - paddingWorld;
      const resizeIconBoxY = node.y - node.height / 2 + paddingWorld;
      const resizeIconCenterX = resizeIconBoxX + iconSizeWorld / 2;
      const resizeIconCenterY = resizeIconBoxY + iconSizeWorld / 2;

      const originalFillStyleIcon = ctx.fillStyle;
      const originalStrokeStyleIcon = ctx.strokeStyle;
      const originalLineWidthIcon = ctx.lineWidth;

      ctx.fillStyle = node.isInResizeMode
        ? "rgba(255, 200, 0, 0.85)"
        : "rgba(200, 200, 220, 0.65)";
      ctx.strokeStyle = "rgba(50, 50, 50, 0.9)";
      ctx.lineWidth = 1 / viewScale;
      ctx.beginPath();
      ctx.rect(resizeIconBoxX, resizeIconBoxY, iconSizeWorld, iconSizeWorld);
      ctx.fill();
      ctx.stroke();
      const resizeIconSymbol = node.isInResizeMode ? "▣" : "✥";
      const resizeIconFontSize = iconSizeWorld * 0.7;
      ctx.font = `bold ${resizeIconFontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillText(
        resizeIconSymbol,
        resizeIconCenterX,
        resizeIconCenterY + resizeIconFontSize * 0.05,
      );

      ctx.fillStyle = originalFillStyleIcon;
      ctx.strokeStyle = originalStrokeStyleIcon;
      ctx.lineWidth = originalLineWidthIcon;

      node.resizeToggleIconRect = {
        x1: resizeIconBoxX,
        y1: resizeIconBoxY,
        x2: resizeIconBoxX + iconSizeWorld,
        y2: resizeIconBoxY + iconSizeWorld,
      };

      const directionIconBoxX = node.x - node.width / 2 + paddingWorld;
      const directionIconBoxY = node.y - node.height / 2 + paddingWorld;
      const directionIconCenterX = directionIconBoxX + iconSizeWorld / 2;
      const directionIconCenterY = directionIconBoxY + iconSizeWorld / 2;

      const originalFillStyleDir = ctx.fillStyle;
      const originalStrokeStyleDir = ctx.strokeStyle;
      const originalLineWidthDir = ctx.lineWidth;

      ctx.fillStyle = "rgba(200, 220, 255, 0.65)";
      ctx.strokeStyle = "rgba(50, 50, 50, 0.9)";
      ctx.lineWidth = 1 / viewScale;
      ctx.beginPath();
      ctx.rect(
        directionIconBoxX,
        directionIconBoxY,
        iconSizeWorld,
        iconSizeWorld,
      );
      ctx.fill();
      ctx.stroke();
      let directionSymbol = "?";
      if (node.scanlineDirection === "forward") directionSymbol = "→";
      else if (node.scanlineDirection === "backward") directionSymbol = "←";
      else if (node.scanlineDirection === "ping-pong") directionSymbol = "↔";
      const directionIconFontSize =
        iconSizeWorld * (directionSymbol === "↔" ? 0.9 : 0.75);
      ctx.font = `bold ${directionIconFontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillText(
        directionSymbol,
        directionIconCenterX,
        directionIconCenterY + directionIconFontSize * 0.1,
      );

      ctx.fillStyle = originalFillStyleDir;
      ctx.strokeStyle = originalStrokeStyleDir;
      ctx.lineWidth = originalLineWidthDir;

      node.directionToggleIconRect = {
        x1: directionIconBoxX,
        y1: directionIconBoxY,
        x2: directionIconBoxX + iconSizeWorld,
        y2: directionIconBoxY + iconSizeWorld,
      };
      if (needsRestore) {
        ctx.restore();
      }
    } else {
      delete node.resizeToggleIconRect;
      delete node.directionToggleIconRect;
    }

    if (shouldShowControls && node.isInResizeMode) {
      if (needsRestore) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(-(node.audioParams.rotation || 0));
        ctx.translate(-node.x, -node.y);
      }
      const handleDrawSizeScreen = 8;
      const handleDrawSizeWorld = handleDrawSizeScreen / viewScale;
      const halfHandleDraw = handleDrawSizeWorld / 2;
      const handlesPositions = [
        { x: rectX, y: rectY },
        { x: rectX + node.width / 2, y: rectY },
        { x: rectX + node.width, y: rectY },
        { x: rectX, y: rectY + node.height / 2 },
        { x: rectX + node.width, y: rectY + node.height / 2 },
        { x: rectX, y: rectY + node.height },
        { x: rectX + node.width / 2, y: rectY + node.height },
        { x: rectX + node.width, y: rectY + node.height },
      ];
      const originalFillStyleHandles = ctx.fillStyle;
      const originalStrokeStyleHandles = ctx.strokeStyle;
      const originalLineWidthHandles = ctx.lineWidth;
      ctx.fillStyle = "rgba(255, 255, 0, 0.7)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.lineWidth = 1 / viewScale;
      handlesPositions.forEach((handlePos) => {
        ctx.beginPath();
        ctx.rect(
          handlePos.x - halfHandleDraw,
          handlePos.y - halfHandleDraw,
          handleDrawSizeWorld,
          handleDrawSizeWorld,
        );
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = originalFillStyleHandles;
      ctx.strokeStyle = originalStrokeStyleHandles;
      ctx.lineWidth = originalLineWidthHandles;
      if (needsRestore) {
        ctx.restore();
      }
    }
  } else if (node.type === GRID_SEQUENCER_TYPE) {
    const rectX = node.x - node.width / 2;
    const rectY = node.y - node.height / 2;
    const currentStyles = getComputedStyle(document.documentElement);
    const gridStroke =
      currentStyles
        .getPropertyValue("--timeline-grid-default-border-color")
        .trim() || "rgba(220, 220, 220, 0.8)";
    const internalColor =
      currentStyles
        .getPropertyValue("--timeline-grid-internal-lines-color")
        .trim() || gridStroke.replace(/[\d\.]+\)$/g, "0.3)");

    ctx.fillStyle = gridStroke.replace(/[\d\.]+\)$/g, "0.05)");
    ctx.fillRect(rectX, rectY, node.width, node.height);

    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = Math.max(1 / viewScale, 2 / viewScale);
    ctx.strokeRect(rectX, rectY, node.width, node.height);

    ctx.strokeStyle = internalColor;
    ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
    for (let i = 1; i < (node.cols || GRID_SEQUENCER_DEFAULT_COLS); i++) {
      const x = rectX + (i * node.width) / (node.cols || GRID_SEQUENCER_DEFAULT_COLS);
      ctx.beginPath();
      ctx.moveTo(x, rectY);
      ctx.lineTo(x, rectY + node.height);
      ctx.stroke();
    }
    for (let i = 1; i < (node.rows || GRID_SEQUENCER_DEFAULT_ROWS); i++) {
      const y = rectY + (i * node.height) / (node.rows || GRID_SEQUENCER_DEFAULT_ROWS);
      ctx.beginPath();
      ctx.moveTo(rectX, y);
      ctx.lineTo(rectX + node.width, y);
      ctx.stroke();
    }
  } else if (node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE) {
    const currentStylesRadar = getComputedStyle(document.documentElement);
    const radarStroke =
      currentStylesRadar
        .getPropertyValue("--spaceradar-border-color")
        .trim() || SPACERADAR_DEFAULT_COLOR;
    const scanlineColor =
      currentStylesRadar
        .getPropertyValue("--spaceradar-scanline-color")
        .trim() || radarStroke;
    const internalLineColor =
      currentStylesRadar
        .getPropertyValue("--spaceradar-internal-lines-color")
        .trim() || radarStroke.replace(/[\d\.]+\)$/g, "0.25)");

    ctx.beginPath();
    ctx.fillStyle = radarStroke.replace(/[\d\.]+\)$/g, "0.05)");
    ctx.strokeStyle = radarStroke;
    ctx.lineWidth = Math.max(1 / viewScale, 2 / viewScale);
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (node.showInternalGrid && node.internalGridDivisions > 1) {
      const originalStroke = ctx.strokeStyle;
      const originalWidth = ctx.lineWidth;
      ctx.strokeStyle = internalLineColor;
      ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
      ctx.beginPath();
      for (let i = 1; i < node.internalGridDivisions; i++) {
        const ang = (i / node.internalGridDivisions) * Math.PI * 2 + SPACERADAR_ANGLE_OFFSET;
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(
          node.x + Math.cos(ang) * node.radius,
          node.y + Math.sin(ang) * node.radius,
        );
      }
      ctx.stroke();
      ctx.strokeStyle = originalStroke;
      ctx.lineWidth = originalWidth;
    }

    const angle = ((node.scanAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.rotate(angle + SPACERADAR_ANGLE_OFFSET);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(node.radius, 0);
    ctx.strokeStyle = scanlineColor;
    ctx.lineWidth = Math.max(1 / viewScale, 2 / viewScale);
    ctx.shadowColor = scanlineColor;
    ctx.shadowBlur = 5 / viewScale;
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
    if (node.type === CRANK_RADAR_TYPE) {
      const pivotRadius = node.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
      const handleLength = node.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
      const drawingAngleForHandleRad =
        (node.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
      const pivotX =
        node.x + Math.cos(drawingAngleForHandleRad) * pivotRadius;
      const pivotY =
        node.y + Math.sin(drawingAngleForHandleRad) * pivotRadius;
      const handleAngle = drawingAngleForHandleRad + Math.PI / 2;
      const gripX = pivotX + Math.cos(handleAngle) * handleLength;
      const gripY = pivotY + Math.sin(handleAngle) * handleLength;
      const pivotDotRadius = 5 / viewScale;
      const gripRadius = 6 / viewScale;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(pivotX, pivotY);
      ctx.lineTo(gripX, gripY);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
      ctx.lineWidth = Math.max(0.5 / viewScale, 2 / viewScale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, pivotDotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(gripX, gripY, gripRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(0.5 / viewScale, 1.5 / viewScale);
      ctx.stroke();
    }
  } else if (node.type === PRORB_TYPE) {
    const r = NODE_RADIUS_BASE * node.size;
    const shape1 = prorbShapeForWaveform(params.osc1Waveform);
    const shape2 = prorbShapeForWaveform(params.osc2Waveform);

    
    ctx.save();
    ctx.beginPath();
    drawPrOrbShapePath(ctx, node.x, node.y, r * 1.05, shape2);
    ctx.fillStyle = osc2Color;
    ctx.strokeStyle = osc2Color;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    drawPrOrbShapePath(ctx, node.x, node.y, r * 0.95, shape1);
    ctx.clip();
    ctx.translate(node.x - r, node.y - r);
    drawWaveform(ctx, params.osc2Waveform, osc2Color, 1.0, r * 2, r * 2);
    drawWaveform(ctx, params.osc1Waveform, fillColor, 1.0, r * 2, r * 2);
    ctx.restore();

    ctx.beginPath();
    drawPrOrbShapePath(ctx, node.x, node.y, r, shape1);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.fill();
    ctx.stroke();
  } else if ((node.type === "sound" || node.type === RESONAUTER_TYPE || node.type === RADIO_ORB_TYPE) && visualStyle) {
    const planetColorsInternal = {
      planet_mercury: {
        fill: hslToRgba(30, 10, 55, baseAlpha),
        border: hslToRgba(30, 10, 40, 0.9),
        craters: hslToRgba(30, 10, 35, baseAlpha),
      },
      planet_venus: {
        fill: hslToRgba(45, 50, 70, baseAlpha),
        border: hslToRgba(45, 50, 55, 0.9),
        swirl1: hslToRgba(50, 55, 75, baseAlpha * 0.7),
        swirl2: hslToRgba(40, 45, 65, baseAlpha * 0.6),
      },
      planet_earth: {
        fill: hslToRgba(210, 60, 55, baseAlpha),
        border: hslToRgba(210, 60, 40, 0.9),
        land: hslToRgba(120, 40, 45, baseAlpha * 1.2),
        cloud: hslToRgba(200, 20, 90, baseAlpha * 0.5),
      },
      planet_mars: {
        fill: hslToRgba(15, 70, 50, baseAlpha),
        border: hslToRgba(15, 70, 35, 0.9),
        cap: hslToRgba(0, 0, 90, baseAlpha),
      },
      planet_jupiter: {
        fill: hslToRgba(35, 60, 65, baseAlpha),
        border: hslToRgba(35, 60, 50, 0.9),
        spot: hslToRgba(10, 70, 55, baseAlpha),
        band1: hslToRgba(40, 55, 60, baseAlpha),
        band2: hslToRgba(30, 65, 70, baseAlpha),
      },
      planet_saturn: {
        fill: hslToRgba(50, 55, 70, baseAlpha),
        border: hslToRgba(50, 55, 55, 0.9),
        ringOuter: hslToRgba(50, 35, 65, baseAlpha * 0.7),
        ringInner: hslToRgba(50, 30, 60, baseAlpha * 0.5),
      },
      planet_uranus: {
        fill: hslToRgba(180, 50, 65, baseAlpha),
        border: hslToRgba(180, 50, 50, 0.9),
      },
      planet_neptune: {
        fill: hslToRgba(230, 70, 60, baseAlpha),
        border: hslToRgba(230, 70, 45, 0.9),
        darkSpot: hslToRgba(230, 75, 40, baseAlpha),
      },
      fm_galaxy: {
        fill: hslToRgba(270, 70, 50, 0.7),
        border: hslToRgba(270, 70, 35, 0.9),
      },
      fm_crystal: {
        fill: hslToRgba(180, 80, 75, 0.8),
        border: hslToRgba(180, 80, 60, 0.9),
      },
      fm_chime: {
        fill: hslToRgba(60, 75, 65, 0.75),
        border: hslToRgba(60, 75, 50, 0.9),
      },
      fm_glass: {
        fill: hslToRgba(190, 40, 80, 0.6),
        border: hslToRgba(190, 40, 65, 0.8),
      },
      fm_organ: {
        fill: hslToRgba(30, 60, 60, 0.8),
        border: hslToRgba(30, 60, 45, 0.9),
      },
      fm_epiano: {
        fill: hslToRgba(220, 50, 65, 0.7),
        border: hslToRgba(220, 50, 50, 0.9),
      },
      fm_ethnic: {
        fill: hslToRgba(0, 65, 55, 0.75),
        border: hslToRgba(0, 65, 40, 0.9),
      },
      fm_metallic: {
        fill: hslToRgba(210, 15, 60, 0.8),
        border: hslToRgba(210, 15, 45, 0.9),
      },
      fm_harmonic: {
        fill: hslToRgba(150, 70, 60, 0.7),
        border: hslToRgba(150, 70, 45, 0.9),
      },
      fm_void: {
        fill: hslToRgba(0, 0, 20, 0.85),
        border: hslToRgba(0, 0, 10, 0.9),
      },
      fm_drone_swarm: {
        fill: hslToRgba(290, 70, 70, 0.8),
        border: hslToRgba(290, 70, 50, 0.9),
      },
      arvo_drone_default: {
        fill: hslToRgba(200, 40, 60, baseAlpha),
        border: hslToRgba(200, 40, 45, 0.9),
      },
      resonauter_default: {
        fill: hslToRgba(240, 60, 60, baseAlpha),
        border: hslToRgba(240, 60, 45, 0.9),
        ring: hslToRgba(240, 40, 70, baseAlpha * 0.8),
      },
      radio_orb_default: {
        fill: fillColor,
        border: borderColor,
        accent: accentColor || borderColor,
      },
    };
    const currentPlanetColors = planetColorsInternal[visualStyle];
    if (currentPlanetColors) {
      fillColor = currentPlanetColors.fill;
      borderColor = currentPlanetColors.border;
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = borderColor;
    }
    if (visualStyle !== "radio_orb_default" && visualStyle !== "fm_drone_swarm") {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (currentPlanetColors) {
      switch (visualStyle) {
        case "fm_drone_swarm": {
          const particleCount = 20;
          const size = r * 0.15;
          if (!node.swarmParticles) {
            node.swarmParticles = Array.from({ length: particleCount }, () => ({
              angle: Math.random() * Math.PI * 2,
              radius: r * (0.3 + Math.random() * 0.7),
              speed: 0.01 + Math.random() * 0.02,
            }));
          }
          node.swarmParticles.forEach((p) => {
            const rate = node.audioParams?.lfoRate || 0.5;
            p.angle += p.speed * (0.5 + rate);
            const px = node.x + Math.cos(p.angle) * p.radius;
            const py = node.y + Math.sin(p.angle) * p.radius;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = currentPlanetColors.fill;
            ctx.fill();
          });
          nodes.forEach((other) => {
            if (
              other !== node &&
              other.audioParams?.visualStyle === "fm_drone_swarm"
            ) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const dist = Math.hypot(dx, dy);
              if (dist < r * 4) {
                ctx.strokeStyle = currentPlanetColors.border;
                ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
              }
            }
          });
          break;
        }
        case "planet_mercury":
          for (let i = 0; i < 3; i++) {
            const cr = r * (0.1 + Math.random() * 0.15);
            const ca = Math.random() * Math.PI * 2;
            const cx = node.x + Math.cos(ca) * r * 0.5;
            const cy = node.y + Math.sin(ca) * r * 0.5;
            ctx.fillStyle = currentPlanetColors.craters;
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        case "planet_venus":
          ctx.save();
          ctx.clip();
          for (let i = 0; i < 2; i++) {
            const sx = node.x + (Math.random() - 0.5) * r * 0.8;
            const sy = node.y + (Math.random() - 0.5) * r * 0.8;
            const sr1 = r * (0.4 + Math.random() * 0.3);
            const sr2 = r * (0.2 + Math.random() * 0.2);
            ctx.fillStyle =
              i % 2 === 0
                ? currentPlanetColors.swirl1
                : currentPlanetColors.swirl2;
            ctx.beginPath();
            ctx.ellipse(
              sx,
              sy,
              sr1,
              sr2,
              Math.random() * Math.PI,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          ctx.restore();
          break;
        case "planet_earth":
          ctx.save();
          ctx.clip();
          ctx.fillStyle = currentPlanetColors.land;
          ctx.beginPath();
          ctx.ellipse(
            node.x - r * 0.2,
            node.y + r * 0.1,
            r * 0.5,
            r * 0.3,
            Math.PI / 4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(
            node.x + r * 0.3,
            node.y - r * 0.2,
            r * 0.4,
            r * 0.25,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.fillStyle = currentPlanetColors.cloud;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              node.x + (Math.random() - 0.5) * r,
              node.y + (Math.random() - 0.5) * r,
              r * (0.15 + Math.random() * 0.2),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          ctx.restore();
          break;
        case "planet_mars":
          ctx.fillStyle = currentPlanetColors.cap;
          ctx.beginPath();
          ctx.arc(node.x, node.y - r * 0.8, r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "planet_jupiter":
          ctx.save();
          ctx.clip();
          ctx.fillStyle = currentPlanetColors.band1;
          ctx.fillRect(node.x - r, node.y - r * 0.4, r * 2, r * 0.3);
          ctx.fillStyle = currentPlanetColors.band2;
          ctx.fillRect(node.x - r, node.y + r * 0.1, r * 2, r * 0.25);
          ctx.fillStyle = currentPlanetColors.spot;
          ctx.beginPath();
          ctx.ellipse(
            node.x + r * 0.3,
            node.y + r * 0.4,
            r * 0.35,
            r * 0.2,
            -Math.PI / 5,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
          break;
        case "planet_saturn":
          ctx.strokeStyle = currentPlanetColors.ringOuter;
          ctx.lineWidth = (r * 0.25) / viewScale;
          ctx.beginPath();
          ctx.ellipse(node.x, node.y, r * 1.6, r * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = currentPlanetColors.ringInner;
          ctx.lineWidth = (r * 0.15) / viewScale;
          ctx.beginPath();
          ctx.ellipse(node.x, node.y, r * 1.25, r * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "planet_neptune":
          ctx.fillStyle = currentPlanetColors.darkSpot;
          ctx.beginPath();
          ctx.ellipse(
            node.x - r * 0.3,
            node.y - r * 0.2,
            r * 0.4,
            r * 0.25,
            Math.PI / 6,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          break;
        case "resonauter_default": {
          const noteHue =
            (scaleBase.h +
              ((params?.scaleIndex || 0) % currentScale.notes.length) * HUE_STEP) %
            360;
          fillColor = hslToRgba(
            noteHue,
            scaleBase.s,
            scaleBase.l * (0.8 + node.size * 0.2),
            baseAlpha,
          );
          borderColor = hslToRgba(
            noteHue,
            scaleBase.s * 0.8,
            scaleBase.l * 0.6,
            0.9,
          );
          const ringColor = hslToRgba(
            noteHue,
            scaleBase.s * 0.6,
            Math.min(100, scaleBase.l * 1.2),
            baseAlpha * 0.8,
          );
          const triggerGlowColor = hslToRgba(
            (noteHue + 180) % 360,
            scaleBase.s,
            scaleBase.l,
            1.0,
          );
          glowColor = node.isTriggered ? triggerGlowColor : borderColor;

          ctx.save();
          ctx.lineWidth = (r * 0.15) / viewScale;
          ctx.strokeStyle = ringColor;
          for (let i = 0; i < 3; i++) {
            const rot = Math.PI / 2 + now * 0.5 + (i * Math.PI * 2) / 3;
            const ringR = r * (1.2 + i * 0.15);
            ctx.beginPath();
            ctx.ellipse(
              node.x,
              node.y,
              ringR * 1.4,
              ringR * 0.5,
              rot,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
          ctx.restore();

          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fillStyle = fillColor;
          ctx.strokeStyle = borderColor;
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.strokeStyle = borderColor + "80";
          ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
          const vLines = 4;
          for (let i = 0; i < vLines; i++) {
            const base = (i - (vLines - 1) / 2) * (r * 0.4);
            const jitter = Math.sin(now * 40 + i) * r * 0.1 * node.animationState;
            const xPos = node.x + base + jitter;
            ctx.beginPath();
            ctx.moveTo(xPos, node.y - r * 1.1);
            ctx.lineTo(xPos, node.y + r * 1.1);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }
        case "fm_galaxy":
          drawStarShape(ctx, node.x, node.y, 7, r, r * 0.4);
          ctx.fill();
          break;
        case "fm_crystal":
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + now * 0.1;
            ctx.beginPath();
            ctx.moveTo(
              node.x + Math.cos(angle) * r * 0.3,
              node.y + Math.sin(angle) * r * 0.3,
            );
            ctx.lineTo(
              node.x + Math.cos(angle + Math.PI * 0.15) * r,
              node.y + Math.sin(angle + Math.PI * 0.15) * r,
            );
            ctx.lineTo(
              node.x + Math.cos(angle - Math.PI * 0.15) * r,
              node.y + Math.sin(angle - Math.PI * 0.15) * r,
            );
            ctx.closePath();
            ctx.fill();
          }
          break;
        case "fm_chime":
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(
              node.x - r * 0.1 + i * r * 0.4 - r * 0.4,
              node.y - r * 0.8,
              r * 0.2,
              r * 1.6,
            );
          }
          break;
        case "fm_glass":
          ctx.beginPath();
          ctx.moveTo(node.x - r * 0.7, node.y + r * 0.7);
          ctx.lineTo(node.x - r * 0.3, node.y - r * 0.7);
          ctx.lineTo(node.x + r * 0.3, node.y - r * 0.7);
          ctx.lineTo(node.x + r * 0.7, node.y + r * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case "fm_organ":
          drawStarShape(ctx, node.x, node.y, 4, r, r * 0.8);
          ctx.fill();
          ctx.stroke();
          break;
        case "fm_epiano":
          ctx.beginPath();
          ctx.ellipse(node.x, node.y, r, r * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case "fm_ethnic":
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, Math.PI * 0.2, Math.PI * 0.8);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, Math.PI * 1.2, Math.PI * 1.8);
          ctx.fill();
          ctx.stroke();
          break;
        case "fm_metallic":
          ctx.beginPath();
          ctx.rect(node.x - r * 0.7, node.y - r * 0.7, r * 1.4, r * 1.4);
          ctx.fill();
          ctx.stroke();
          drawStarShape(ctx, node.x, node.y, 6, r * 0.5, r * 0.2);
          ctx.fillStyle = borderColor;
          ctx.fill();
          break;
        case "fm_harmonic":
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();
          for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, r * (1 - i * 0.2), 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case "fm_void":
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case "radio_orb_default": {
          const bodyW = r * 1.6;
          const bodyH = r * 1.1;
          ctx.beginPath();
          ctx.rect(node.x - bodyW / 2, node.y - bodyH / 2, bodyW, bodyH);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = accentColor || currentPlanetColors.accent;
          ctx.beginPath();
          ctx.arc(node.x - bodyW * 0.25, node.y, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(node.x + bodyW * 0.25, node.y + bodyH * 0.2, r * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(node.x + bodyW * 0.4, node.y - bodyH / 2);
          ctx.lineTo(node.x + bodyW * 0.4, node.y - bodyH * 0.9);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(node.x + bodyW * 0.4, node.y - bodyH * 0.9, r * 0.12, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        default:
          const waveform = params?.waveform;
          if (waveform === "sine" || !waveform) {
          } else if (waveform === "square") {
            ctx.beginPath();
            ctx.rect(node.x - r * 0.9, node.y - r * 0.9, r * 1.8, r * 1.8);
            ctx.fill();
            ctx.stroke();
          } else if (waveform === "triangle" || waveform === "sawtooth") {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y - r);
            ctx.lineTo(node.x + r * 0.866, node.y + r * 0.5);
            ctx.lineTo(node.x - r * 0.866, node.y + r * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (waveform === "fmBell" || waveform === "fmXylo") {
            drawStarShape(ctx, node.x, node.y, 5, r, r * 0.5);
            ctx.fill();
            ctx.stroke();
          } else if (waveform?.startsWith("sampler_")) {
            let arms = 1;
            const samplerType = waveform.replace("sampler_", "");
            const samplerDef = SAMPLER_DEFINITIONS.find(
              (s) => s.id === samplerType,
            );
            if (samplerDef && samplerDef.icon) {
            }
            drawSatelliteShape(ctx, node.x, node.y, r, arms);
          }
          break;
      }
    } else {
      const waveform = params?.waveform;
      if (waveform === "sine" || !waveform) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      } else if (waveform === "square") {
        ctx.beginPath();
        ctx.rect(node.x - r * 0.9, node.y - r * 0.9, r * 1.8, r * 1.8);
      } else if (waveform === "triangle" || waveform === "sawtooth") {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - r);
        ctx.lineTo(node.x + r * 0.866, node.y + r * 0.5);
        ctx.lineTo(node.x - r * 0.866, node.y + r * 0.5);
        ctx.closePath();
      } else if (waveform === "fmBell" || waveform === "fmXylo") {
        drawStarShape(ctx, node.x, node.y, 5, r, r * 0.5);
      } else if (waveform?.startsWith("sampler_")) {
        let arms = 1;
        const samplerType = waveform.replace("sampler_", "");
        const samplerDef = SAMPLER_DEFINITIONS.find(
          (s) => s.id === samplerType,
        );
        if (samplerDef && samplerDef.icon) {
          if (samplerDef.icon === "🎹") arms = 2;
          else if (samplerDef.icon === "🌬️") arms = 3;
          else if (samplerDef.icon === "🪵") arms = 4;
        }
        drawSatelliteShape(ctx, node.x, node.y, r, arms);
      } else {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      }
      if (!waveform?.startsWith("sampler_")) {
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.stroke();
  } else if (isDrumType(node.type)) {
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = fillColor;
    switch (node.type) {
      case "drum_kick":
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const innerKickR = r * (0.6 + node.animationState * 0.1);
        ctx.fillStyle = node.color
          ? hexToRgba(rgbaToHex(node.color), 0.6)
          : fillColor.replace(/[\d\.]+\)$/g, "0.6)");
        ctx.beginPath();
        ctx.arc(node.x, node.y, innerKickR, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "drum_snare":
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = borderColor + "80";
        ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
        const numWires = 3;
        for (let i = 0; i < numWires; i++) {
          const offset = (i - (numWires - 1) / 2) * (r * 0.4);
          ctx.beginPath();
          ctx.moveTo(node.x - r * 0.7, node.y + offset);
          ctx.lineTo(node.x + r * 0.7, node.y + offset);
          ctx.stroke();
        }
        ctx.restore();
        break;
      case "drum_hihat":
        const cymbalYOffset = r * 0.2;
        const cymbalWidth = r * 1.4;
        const cymbalControlY = r * 0.3;
        ctx.lineWidth = Math.max(
          0.5 / viewScale,
          (baseLineWidth * 0.8) / viewScale,
        );
        ctx.beginPath();
        ctx.moveTo(node.x - cymbalWidth / 2, node.y - cymbalYOffset);
        ctx.quadraticCurveTo(
          node.x,
          node.y - cymbalYOffset - cymbalControlY,
          node.x + cymbalWidth / 2,
          node.y - cymbalYOffset,
        );
        ctx.stroke();
        const bottomY =
          node.y + cymbalYOffset + node.animationState * (r * 0.35);
        ctx.beginPath();
        ctx.moveTo(node.x - cymbalWidth / 2, bottomY);
        ctx.quadraticCurveTo(
          node.x,
          bottomY + cymbalControlY,
          node.x + cymbalWidth / 2,
          bottomY,
        );
        ctx.stroke();
        const stickBaseY = node.y - r * 1.3;
        const stickTipY = node.y - r * 0.3 + node.animationState * (r * 0.7);
        const stickX = node.x + r * 0.6;
        ctx.save();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = Math.max(1 / viewScale, 2.5 / viewScale);
        ctx.beginPath();
        ctx.moveTo(stickX, stickBaseY);
        ctx.lineTo(stickX + r * 0.1, stickTipY);
        ctx.stroke();
        ctx.restore();
        break;
      case "drum_clap":
        const handWidth = r * 0.8;
        const handHeight = r * 1.0;
        const minGap = r * 0.1;
        const maxGap = r * 0.7;
        const currentGap =
          minGap + (1 - node.animationState) * (maxGap - minGap);
        const yPosClap = node.y - handHeight / 2;
        const borderRadiusClap = r * 0.25;
        ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
        drawRoundedRect(
          ctx,
          node.x - handWidth - currentGap / 2,
          yPosClap,
          handWidth,
          handHeight,
          borderRadiusClap,
        );
        ctx.fill();
        ctx.stroke();
        drawRoundedRect(
          ctx,
          node.x + currentGap / 2,
          yPosClap,
          handWidth,
          handHeight,
          borderRadiusClap,
        );
        ctx.fill();
        ctx.stroke();
        break;
      case "drum_tom1":
      case "drum_tom2":
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = borderColor + "90";
        ctx.lineWidth = Math.max(0.5 / viewScale, 1 / viewScale);
        ctx.beginPath();
        ctx.moveTo(node.x - r * 0.7, node.y);
        ctx.lineTo(node.x + r * 0.7, node.y);
        ctx.stroke();
        ctx.restore();
        break;
      case "drum_cowbell":
        const topWidth = r * 0.8;
        const bottomWidth = r * 1.3;
        const cHeight = r * 1.1;
        ctx.beginPath();
        ctx.moveTo(node.x - topWidth / 2, node.y - cHeight / 2);
        ctx.lineTo(node.x + topWidth / 2, node.y - cHeight / 2);
        ctx.lineTo(node.x + bottomWidth / 2, node.y + cHeight / 2);
        ctx.lineTo(node.x - bottomWidth / 2, node.y + cHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case "drum_fm_kick":
        drawStarShape(ctx, node.x, node.y, 5, r, r * 0.4);
        ctx.fill();
        ctx.stroke();
        break;
      case "drum_fm_snare":
        drawStarShape(ctx, node.x, node.y, 6, r, r * 0.4);
        ctx.fill();
        ctx.stroke();
        break;
      case "drum_fm_tom":
        drawStarShape(ctx, node.x, node.y, 4, r, r * 0.4);
        ctx.fill();
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.rect(node.x - r * 0.8, node.y - r * 0.8, r * 1.6, r * 1.6);
        ctx.fill();
        ctx.stroke();
        break;
    }
  } else if (node.type === MOTOR_ORB_TYPE) {
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const px = node.x + Math.cos(node.angle || 0) * r;
    const py = node.y + Math.sin(node.angle || 0) * r;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (node.type === CLOCKWORK_ORB_TYPE) {
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const px = node.x + Math.cos(node.angle || 0) * r;
    const py = node.y + Math.sin(node.angle || 0) * r;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (node.type === MIDI_ORB_TYPE || node.type === ALIEN_ORB_TYPE) {
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = fillColor;
    drawMidiOrbShape(ctx, node.x, node.y, r);
  } else if (node.type === "gate") {
    const innerRadius = r * 0.4;
    const shieldRadius = r * 0.85;
    const openingStartAngle = -GATE_ANGLE_SIZE / 2;
    const openingEndAngle = GATE_ANGLE_SIZE / 2;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.stroke();
    const gateBgFill = fillColor + "90";
    ctx.fillStyle = gateBgFill;
    ctx.fill();
    ctx.fillStyle = borderColor + "A0";
    ctx.beginPath();
    ctx.moveTo(
      node.x + Math.cos(openingEndAngle) * innerRadius,
      node.y + Math.sin(openingEndAngle) * innerRadius,
    );
    ctx.lineTo(
      node.x + Math.cos(openingEndAngle) * shieldRadius,
      node.y + Math.sin(openingEndAngle) * shieldRadius,
    );
    ctx.arc(
      node.x,
      node.y,
      shieldRadius,
      openingEndAngle,
      openingStartAngle + Math.PI * 2,
      false,
    );
    ctx.lineTo(
      node.x + Math.cos(openingStartAngle) * innerRadius,
      node.y + Math.sin(openingStartAngle) * innerRadius,
    );
    ctx.arc(
      node.x,
      node.y,
      innerRadius,
      openingStartAngle + Math.PI * 2,
      openingEndAngle,
      true,
    );
    ctx.closePath();
    ctx.fill();
    let shouldPassVisual = false;
    const mode = GATE_MODES[params?.gateModeIndex || 0];
    if (mode === "RAND") {
      shouldPassVisual = node.lastRandomGateResult;
    } else {
      const counterCheck = node.gateCounter || 0;
      switch (mode) {
        case "1/2":
          if (counterCheck % 2 === 0) shouldPassVisual = true;
          break;
        case "1/3":
          if (counterCheck % 3 === 0) shouldPassVisual = true;
          break;
        case "1/4":
          if (counterCheck % 4 === 0) shouldPassVisual = true;
          break;
        case "2/3":
          if (counterCheck % 3 !== 0) shouldPassVisual = true;
          break;
        case "3/4":
          if (counterCheck % 4 !== 0) shouldPassVisual = true;
          break;
      }
    }
    if (node.animationState > 0 && shouldPassVisual) {
      ctx.save();
      ctx.strokeStyle =
        styles.getPropertyValue("--pulse-visual-color").trim() ||
        "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = Math.max(1 / viewScale, 2.5 / viewScale);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10 / viewScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.9, openingStartAngle, openingEndAngle);
      ctx.stroke();
      ctx.restore();
    }
  } else if (node.type === "probabilityGate") {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const fontSize = Math.max(8 / viewScale, (r * 0.8) / viewScale);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = borderColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("%", node.x, node.y + fontSize * 0.1);
  } else if (node.type === "pitchShift") {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = fillColor + "90";
    ctx.fill();
    if (node.animationState < 0.5) {
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      const arrowSize = r * 0.5;
      const arrowY = node.y - arrowSize * 0.3;
      ctx.moveTo(node.x, arrowY - arrowSize / 2);
      ctx.lineTo(node.x - arrowSize / 2, arrowY + arrowSize / 2);
      ctx.lineTo(node.x + arrowSize / 2, arrowY + arrowSize / 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (node.type === "relay") {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (node.type === "reflector") {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const fontSize = Math.max(8 / viewScale, (r * 0.9) / viewScale);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = borderColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⟲", node.x, node.y + fontSize * 0.1);
  } else if (node.type === "switch") {
    ctx.beginPath();
    ctx.moveTo(node.x - r * 0.8, node.y + r * 0.8);
    ctx.lineTo(node.x, node.y - r);
    ctx.lineTo(node.x + r * 0.8, node.y + r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (node.type === "nebula") {
    wobbleX = Math.sin(now * 0.1 + node.id) * (2 / viewScale);
    wobbleY = Math.cos(now * 0.07 + node.id * 2) * (2 / viewScale);
    const nodeBaseHue =
      node.baseHue !== null && node.baseHue !== undefined
        ? node.baseHue
        : (scaleBase.h +
            ((params?.scaleIndex || 0) % currentScale.notes.length) *
              HUE_STEP) %
          360;
    const baseSaturation = scaleBase.s * 0.8;
    const baseLightness = scaleBase.l * (0.7 + node.size * 0.2);
    const hueShiftSpeed = 10;
    const currentHue = (nodeBaseHue + now * hueShiftSpeed) % 360;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(node.x + wobbleX, node.y + wobbleY);
    const numBlobs = 5;
    const baseRadiusNeb = NODE_RADIUS_BASE * node.size * 1.1;
    for (let i = 0; i < numBlobs; i++) {
      const angleOffset = now * (0.1 + i * 0.02) + node.id + i * 1.1;
      const distFactor =
        0.15 + ((Math.sin(now * 0.15 + i * 0.9) + 1) / 2) * 0.25;
      const offsetX = Math.cos(angleOffset) * baseRadiusNeb * distFactor;
      const offsetY = Math.sin(angleOffset) * baseRadiusNeb * distFactor;
      const radiusFactor =
        0.6 + ((Math.cos(now * 0.2 + i * 1.3) + 1) / 2) * 0.4;
      const blobRadius = baseRadiusNeb * radiusFactor * 0.7;
      const blobAlpha =
        0.15 + ((Math.sin(now * 0.25 + i * 1.5) + 1) / 2) * 0.15;
      const blobLightness =
        baseLightness * (0.95 + ((Math.cos(now * 0.18 + i) + 1) / 2) * 0.15);
      const blobSaturation =
        baseSaturation *
        (0.9 + ((Math.sin(now * 0.22 + i * 0.5) + 1) / 2) * 0.15);
      const finalBlobAlpha = Math.min(1.0, blobAlpha * 1.5);
      ctx.fillStyle = hslToRgba(
        currentHue,
        blobSaturation,
        blobLightness,
        finalBlobAlpha,
      );
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, blobRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    const coreRadius = baseRadiusNeb * 0.3;
    const coreAlpha = 0.3;
    ctx.fillStyle = hslToRgba(
      currentHue,
      baseSaturation * 1.1,
      baseLightness * 1.1,
      coreAlpha,
    );
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    const currentGlowColor = glowColor;
    ctx.shadowColor = currentGlowColor;
    const pulseEffect = (Math.sin(node.pulsePhase) * 0.5 + 0.5) * 8;
    const currentGlowAmount =
      3 + pulseEffect + (isSelectedAndOutlineNeeded ? 5 : 0);
    ctx.shadowBlur = Math.min(20 / viewScale, currentGlowAmount / viewScale);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.beginPath();
    ctx.arc(
      node.x + wobbleX,
      node.y + wobbleY,
      baseRadiusNeb * 0.8,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  } else if (node.type === PORTAL_NEBULA_TYPE) {
    const defaults = PORTAL_NEBULA_DEFAULTS;
    const pulseSpeed = defaults.pulseSpeed;
    const baseRadiusPortal = NODE_RADIUS_BASE * node.size;
    const nodeBaseHue = node.baseHue ?? defaults.baseColorHue;
    const hueShiftSpeed = 5;
    const currentHue = (nodeBaseHue + now * hueShiftSpeed) % 360;
    const saturation = scaleBase.s * 0.9;
    const lightness = scaleBase.l * 1.1;
    ctx.save();
    const currentGlowColor = glowColor;
    ctx.shadowColor = currentGlowColor;
    const pulseEffectGlow = (Math.sin(node.pulsePhase * 0.8) * 0.5 + 0.5) * 15;
    const currentGlowAmount =
      10 + pulseEffectGlow + (isSelectedAndOutlineNeeded ? 5 : 0);
    ctx.shadowBlur = Math.min(40 / viewScale, currentGlowAmount / viewScale);
    const irisRadiusFactor = 0.4 + Math.sin(node.pulsePhase * pulseSpeed) * 0.1;
    const irisRadius = baseRadiusPortal * irisRadiusFactor;
    const irisAlpha = 0.7 + Math.sin(node.pulsePhase * pulseSpeed) * 0.2;
    ctx.fillStyle = hslToRgba(
      currentHue,
      saturation * 1.1,
      lightness * 1.2,
      irisAlpha,
    );
    ctx.beginPath();
    ctx.arc(
      node.x,
      node.y,
      Math.max(1 / viewScale, irisRadius),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
    const numRings = 4;
    const originalLineWidth = ctx.lineWidth;
    ctx.lineWidth = Math.max(0.5 / viewScale, 1.5 / viewScale);
    for (let i = 1; i <= numRings; i++) {
      const ringPulsePhase = node.pulsePhase * (pulseSpeed * (1 + i * 0.1));
      const ringRadiusFactor = 0.6 + i * 0.25 + Math.sin(ringPulsePhase) * 0.08;
      const ringRadius = baseRadiusPortal * ringRadiusFactor;
      const ringAlpha =
        0.1 + (1 - i / numRings) * 0.3 + Math.sin(ringPulsePhase) * 0.05;
      const ringLightness = lightness * (1.0 - i * 0.1);
      ctx.strokeStyle = hslToRgba(
        currentHue,
        saturation * (1.0 - i * 0.05),
        ringLightness,
        ringAlpha,
      );
      ctx.beginPath();
      if (ringRadius > 0) {
        ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.lineWidth = originalLineWidth;
  } else if (node.type === ALIEN_DRONE_TYPE) {
    wobbleY = Math.sin(now * 0.8 + node.id) * (2 / viewScale);
    ctx.save();
    ctx.translate(node.x, node.y + wobbleY);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.1, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -r * 0.4, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();
    ctx.restore();
  } else if (node.type === ARVO_DRONE_TYPE) {
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (node.type === FM_DRONE_TYPE) {
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(0.5 / viewScale, baseLineWidth / viewScale);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isPulsarType(node.type)) {
    const outerR = r;
    const innerR = outerR * 0.4;
    const points = node.starPoints || 6;
    if (node.type === "pulsar_rocket") {
      ctx.save();
      ctx.translate(node.x, node.y);
      const drawingAngleRad =
        (node.audioParams.rocketDirectionAngle || 0) - Math.PI / 2;
      ctx.rotate(drawingAngleRad);
      ctx.beginPath();
      ctx.arc(0, 0, outerR * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(
        0.5 / viewScale,
        (isSelectedAndOutlineNeeded || node.isInResizeMode
          ? baseLineWidth + 1.5 / viewScale
          : baseLineWidth) * 0.8,
      );
      ctx.stroke();
      const barrelLength = outerR * 1.4;
      const barrelWidth = outerR * 0.5;
      ctx.fillStyle = borderColor;
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = Math.max(
        0.5 / viewScale,
        (baseLineWidth * 0.5) / viewScale,
      );
      ctx.beginPath();
      const barrelBaseOffset = outerR * 0.2;
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(
          barrelBaseOffset,
          -barrelWidth / 2,
          barrelLength - barrelBaseOffset,
          barrelWidth,
          barrelWidth / 3,
        );
      } else {
        ctx.rect(
          barrelBaseOffset,
          -barrelWidth / 2,
          barrelLength - barrelBaseOffset,
          barrelWidth,
        );
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (isSelectedAndOutlineNeeded || node.isInResizeMode) {
        const handleOrbitRadius = outerR * 1.6;
        const drawingAngleForHandleRad =
          (node.audioParams.rocketDirectionAngle || 0) - Math.PI / 2;
        const handleDisplayOffsetAngleRad = Math.PI / 4;
        const handleActualDisplayAngleRad =
          drawingAngleForHandleRad + handleDisplayOffsetAngleRad;
        const handleGripX =
          node.x + Math.cos(handleActualDisplayAngleRad) * handleOrbitRadius;
        const handleGripY =
          node.y + Math.sin(handleActualDisplayAngleRad) * handleOrbitRadius;
        const handleGripRadius = 6 / viewScale;
        ctx.beginPath();
        ctx.arc(handleGripX, handleGripY, handleGripRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = Math.max(0.5 / viewScale, 1.5 / viewScale);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          handleOrbitRadius * 0.9,
          drawingAngleForHandleRad - 0.5,
          drawingAngleForHandleRad + 0.5,
        );
        ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
        ctx.lineWidth = Math.max(0.5 / viewScale, 2 / viewScale);
        ctx.stroke();
      }
    } else if (node.type === "pulsar_ufo") {
      ctx.save();
      ctx.translate(node.x, node.y);
      const drawingAngleRad =
        (node.audioParams.rocketDirectionAngle || 0) - Math.PI / 2;
      ctx.rotate(drawingAngleRad);
      ctx.beginPath();
      ctx.ellipse(0, 0, outerR * 1.0, outerR * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(
        0.5 / viewScale,
        (isSelectedAndOutlineNeeded || node.isInResizeMode
          ? baseLineWidth + 1.5 / viewScale
          : baseLineWidth) * 0.8,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -outerR * 0.4, outerR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = borderColor;
      ctx.fill();
      ctx.restore();
      if (isSelectedAndOutlineNeeded || node.isInResizeMode) {
        const handleOrbitRadius = outerR * 1.6;
        const drawingAngleForHandleRad =
          (node.audioParams.rocketDirectionAngle || 0) - Math.PI / 2;
        const handleDisplayOffsetAngleRad = Math.PI / 4;
        const handleActualDisplayAngleRad =
          drawingAngleForHandleRad + handleDisplayOffsetAngleRad;
        const handleGripX =
          node.x + Math.cos(handleActualDisplayAngleRad) * handleOrbitRadius;
        const handleGripY =
          node.y + Math.sin(handleActualDisplayAngleRad) * handleOrbitRadius;
        const handleGripRadius = 6 / viewScale;
        ctx.beginPath();
        ctx.arc(handleGripX, handleGripY, handleGripRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = Math.max(0.5 / viewScale, 1.5 / viewScale);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          handleOrbitRadius * 0.9,
          drawingAngleForHandleRad - 0.5,
          drawingAngleForHandleRad + 0.5,
        );
        ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
        ctx.lineWidth = Math.max(0.5 / viewScale, 2 / viewScale);
        ctx.stroke();
      }
    } else {
      drawStarShape(ctx, node.x, node.y, points, outerR, innerR);
      ctx.fill();
      ctx.stroke();
      if (node.type === "pulsar_triggerable") {
        const lockSize = outerR * 0.5;
        ctx.fillStyle = isStartNodeDisabled
          ? disabledFillColorGeneral
          : borderColor;
        ctx.strokeStyle = isStartNodeDisabled
          ? disabledBorderColorGeneral
          : fillColor;
        ctx.lineWidth = (baseLineWidth * 0.5) / viewScale;
        ctx.beginPath();
        ctx.rect(
          node.x - lockSize * 0.3,
          node.y - lockSize * 0.25,
          lockSize * 0.6,
          lockSize * 0.5,
        );
        ctx.moveTo(node.x + lockSize * 0.3, node.y - lockSize * 0.25);
        ctx.arc(
          node.x,
          node.y - lockSize * 0.25,
          lockSize * 0.4,
          0,
          Math.PI,
          true,
        );
        ctx.stroke();
      }
    }
  } else {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (
    (isSelectedAndOutlineNeeded || node.isInResizeMode) &&
    node.type !== "pulsar_rocket" &&
    node.type !== "pulsar_ufo" &&
    node.type !== TIMELINE_GRID_TYPE &&
    node.type !== GRID_SEQUENCER_TYPE &&
    node.type !== SPACERADAR_TYPE &&
    node.type !== CRANK_RADAR_TYPE &&
    node.type !== PRORB_TYPE
  ) {
    const originalShadowBlur = ctx.shadowBlur;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 0, 0.9)";
    ctx.lineWidth = Math.max(0.5 / viewScale, 1.5 / viewScale);
    ctx.beginPath();
    const outlineRadius = NODE_RADIUS_BASE * node.size + 2;
    const finalOutlineX = node.x + wobbleX;
    const finalOutlineY = node.y + wobbleY;
    ctx.arc(finalOutlineX, finalOutlineY, outlineRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = originalShadowBlur;
  }

  if (needsRestore) {
    ctx.restore();
  }
  if (
    (node.type !== TIMELINE_GRID_TYPE && node.type !== GRID_SEQUENCER_TYPE && node.type !== SPACERADAR_TYPE && node.type !== CRANK_RADAR_TYPE) ||
    ((node.type === TIMELINE_GRID_TYPE || node.type === GRID_SEQUENCER_TYPE || node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE) &&
      ctx.shadowBlur !== 0 &&
      !(isSelectedAndOutlineNeeded || node.isInResizeMode))
  ) {
    ctx.shadowBlur = 0;
  }

  if (
    params &&
    params.retriggerEnabled &&
    params.retriggerVolumeSteps &&
    params.retriggerVolumeSteps.length > 0
  ) {
    const steps = params.retriggerVolumeSteps;
    const count = steps.length;
    const activeVisualIndex = node.currentRetriggerVisualIndex;
    const nodeBaseDrawRadiusForVisuals = NODE_RADIUS_BASE * node.size;
    const visualOffsetFromNodeEdgeScaled = nodeBaseDrawRadiusForVisuals * 0.35;
    const visualStartRadiusScaled =
      nodeBaseDrawRadiusForVisuals + visualOffsetFromNodeEdgeScaled;
    const totalAngleSpan = Math.PI * 1.9;
    const segmentAngle =
      count > 1 ? totalAngleSpan / Math.max(1, count - 1) : 0;
    let nodeCanvasRotation = 0;
    if (node.type === "gate" && node.currentAngle !== undefined) {
      nodeCanvasRotation = node.currentAngle;
    }
    const startAngleRad =
      -Math.PI / 2 - (count > 1 ? totalAngleSpan / 2 : 0) + nodeCanvasRotation;
    for (let i = 0; i < count; i++) {
      const volumeFactor = steps[i] || 0;
      const isActive = i === activeVisualIndex;
      const angle = startAngleRad + i * segmentAngle;
      const gasBaseLength = 6 / viewScale;
      const gasVolumeLength = (volumeFactor * 12) / viewScale;
      const totalVisualLength = gasBaseLength + gasVolumeLength;
      const gasWidth = Math.max(
        1 / viewScale,
        3 / viewScale + (volumeFactor * 6) / viewScale,
      );
      const radialStartX = node.x + Math.cos(angle) * visualStartRadiusScaled;
      const radialStartY = node.y + Math.sin(angle) * visualStartRadiusScaled;
      const radialEndX =
        node.x +
        Math.cos(angle) * (visualStartRadiusScaled + totalVisualLength);
      const radialEndY =
        node.y +
        Math.sin(angle) * (visualStartRadiusScaled + totalVisualLength);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(radialStartX, radialStartY);
      ctx.lineTo(radialEndX, radialEndY);
      let Rval = 160,
        Gval = 190,
        Bval = 230;
      let nodeFillColor = fillColor;
      try {
        const rgbaMatch = nodeFillColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d\.]+)?\)/,
        );
        if (rgbaMatch) {
          Rval = parseInt(rgbaMatch[1]);
          Gval = parseInt(rgbaMatch[2]);
          Bval = parseInt(rgbaMatch[3]);
        }
      } catch (e) {}
      if (isActive) {
        Rval = Math.min(255, Rval + 80);
        Gval = Math.min(255, Gval + 60);
        Bval = Math.max(30, Bval - 60);
      }
      const alphaVal = 0.25 + volumeFactor * 0.5 + (isActive ? 0.35 : 0);
      ctx.strokeStyle = `rgba(${Rval},${Gval},${Bval},${Math.min(0.9, alphaVal)})`;
      ctx.lineWidth = gasWidth;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(${Rval},${Gval},${Bval},${Math.min(0.7, alphaVal * 0.8)})`;
      ctx.shadowBlur = (isActive ? 10 : 5) / viewScale;
      ctx.stroke();
      ctx.restore();
    }
  }
  if (
    node.type === "sound" &&
    node.type !== PRORB_TYPE &&
    params?.orbitonesEnabled &&
    params.orbitoneCount > 0 &&
    node.audioNodes?.orbitoneOscillators
  ) {
    const orbitBaseRadius = NODE_RADIUS_BASE * node.size * 1.5;
    const orbitoneVisualSize = NODE_RADIUS_BASE * node.size * 0.25;
    const numVisualOrbitones = params.orbitoneCount;
    const mainNodeFillColor = fillColor;
    for (let i = 0; i < numVisualOrbitones; i++) {
      const angleIncrement = (Math.PI * 2) / numVisualOrbitones;
      const baseAngle = i * angleIncrement;
      const orbitSpeedFactor = 0.15 + i * 0.03;
      const currentAngle = baseAngle + (now * orbitSpeedFactor + node.id * 0.3);
      const orbitRadiusVariation =
        Math.sin(now * 0.4 + i * 0.7) * (orbitBaseRadius * 0.1);
      const currentOrbitRadius = orbitBaseRadius + orbitRadiusVariation;
      const ox = node.x + Math.cos(currentAngle) * currentOrbitRadius;
      const oy = node.y + Math.sin(currentAngle) * currentOrbitRadius;
      let orbitFill = "rgba(200, 220, 255, 0.3)";
      let orbitStroke = "rgba(230, 240, 255, 0.5)";
      try {
        const mainRgbMatch = mainNodeFillColor.match(/\d+/g);
        if (mainRgbMatch && mainRgbMatch.length >= 3) {
          const mainRgb = mainRgbMatch.map(Number);
          const baseAlphaOrbitone = 0.3 + params.orbitoneVolumeVariation * 0.2;
          orbitFill = `rgba(${Math.min(255, mainRgb[0] + i * 5 + 10)}, ${Math.min(255, mainRgb[1] - i * 3 + 5)}, ${Math.max(0, mainRgb[2] - i * 8 + 15)}, ${baseAlphaOrbitone})`;
          orbitStroke = `rgba(${Math.min(255, mainRgb[0] + i * 3 + 30)}, ${Math.min(255, mainRgb[1] + 15)}, ${Math.max(0, mainRgb[2] + 5)}, ${baseAlphaOrbitone + 0.2})`;
        }
      } catch (e) {}
      ctx.fillStyle = orbitFill;
      ctx.strokeStyle = orbitStroke;
      ctx.lineWidth = Math.max(0.5 / viewScale, 0.8 / viewScale);
      ctx.beginPath();
      ctx.arc(
        ox,
        oy,
        Math.max(1 / viewScale, orbitoneVisualSize),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      if (
        isSelectedAndOutlineNeeded ||
        node.isInResizeMode ||
        node.animationState > 0.05
      ) {
        ctx.shadowColor = orbitStroke;
        ctx.shadowBlur = (3 + node.animationState * 5) / viewScale;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.stroke();
      }
    }
  }

  if (isInfoTextVisible) {
    const originalFillStyleText = ctx.fillStyle;
    const originalFontText = ctx.font;
    const originalTextAlign = ctx.textAlign;
    const originalTextBaseline = ctx.textBaseline;

    const fontSize = Math.max(8 / viewScale, 10 / viewScale);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let labelText = "";
    let secondLineText = "";
    const baseRadiusForLabel = NODE_RADIUS_BASE * node.size;
    let labelYOffset =
      baseRadiusForLabel * 1.1 + fontSize / 1.5 + 2 / viewScale;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  if (node.type === PRORB_TYPE) {
    labelText = getNoteNameFromScaleIndex(
      currentScale,
      params.scaleIndex,
      NOTE_NAMES,
      currentRootNote,
      globalTransposeOffset,
    );
    secondLineText = "PrOrb";
  } else if (node.type === MIDI_ORB_TYPE) {
    labelText = getNoteNameFromScaleIndex(
      currentScale,
      params.scaleIndex,
      NOTE_NAMES,
      currentRootNote,
      globalTransposeOffset,
    );
    secondLineText = "MIDI";
  } else if (node.type === RADIO_ORB_TYPE) {
    labelText = `Pad ${(params.sampleIndex ?? 0) + 1}`;
  } else if (node.type === ALIEN_ORB_TYPE) {
    labelText = getNoteNameFromScaleIndex(
      currentScale,
      params.scaleIndex,
      NOTE_NAMES,
      currentRootNote,
      globalTransposeOffset,
    );
    secondLineText = "Alien Technology";
  } else if (node.type === ALIEN_DRONE_TYPE) {
    labelText = getNoteNameFromScaleIndex(
      currentScale,
      params.scaleIndex,
      NOTE_NAMES,
      currentRootNote,
      globalTransposeOffset,
    );
    secondLineText = "Alien Drone";
  } else if (node.type === "sound" || node.type === "nebula") {
      labelText = getNoteNameFromScaleIndex(
        currentScale,
        params.scaleIndex,
        NOTE_NAMES,
        currentRootNote,
        globalTransposeOffset,
      );
      const presetDef =
        analogWaveformPresets.find((p) => p.type === params.waveform) ||
        fmSynthPresets.find((p) => p.type === params.waveform);
      if (presetDef && presetDef.label !== labelText) {
        secondLineText = presetDef.label;
      }
      if (
        node.type === "sound" &&
        params.orbitonesEnabled &&
        params.orbitoneCount > 0
      ) {
        secondLineText =
          (secondLineText ? secondLineText + " " : "") +
          `(+${params.orbitoneCount} Orb)`;
      }
      if (node.type === "sound" && params.waveform?.startsWith("sampler_")) {
        labelYOffset =
          baseRadiusForLabel * 1.3 + fontSize / 1.5 + 2 / viewScale;
      } else if (node.type === "nebula") {
        labelYOffset =
          baseRadiusForLabel * 1.1 * 1.2 + fontSize / 1.5 + 2 / viewScale;
      }
  } else if (node.type === RESONAUTER_TYPE) {
      labelText = getNoteNameFromScaleIndex(
        currentScale,
        params.scaleIndex,
        NOTE_NAMES,
        currentRootNote,
        globalTransposeOffset,
      );
      secondLineText = "Resonautor";
  } else if (node.type === PORTAL_NEBULA_TYPE) {
      labelText = "Portal";
      labelYOffset = baseRadiusForLabel * 1.1 + fontSize / 1.5 + 2 / viewScale;
    } else if (isPulsarType(node.type)) {
      let typeLabel =
        pulsarTypes.find((pt) => pt.type === node.type)?.label || "Pulsar";
      labelText = typeLabel;
      if (!node.isEnabled && node.type !== "pulsar_manual")
        labelText += " (Off)";
      if (node.type === "pulsar_random_volume") {
        secondLineText = `Int: Random`;
      } else if (node.type === "pulsar_manual") {
        secondLineText = `Int: ${(params.pulseIntensity ?? DEFAULT_PULSE_INTENSITY).toFixed(1)}`;
      } else if (node.type !== "pulsar_rocket" && node.type !== "pulsar_ufo") {
        if (node.type === "pulsar_random_particles") {
          secondLineText = "Timing: Random";
        } else if (isGlobalSyncEnabled && !node.audioParams.ignoreGlobalSync) {
          const subdivIndexToUse =
            node.audioParams.syncSubdivisionIndex ?? DEFAULT_SUBDIVISION_INDEX;
          const subdiv = subdivisionOptions[subdivIndexToUse];
          secondLineText = `Sync: ${subdiv?.label ?? "?"}`;
        } else {
          secondLineText = `Intv: ${(params.triggerInterval || DEFAULT_TRIGGER_INTERVAL).toFixed(1)}s`;
        }
        if (node.type !== "pulsar_random_volume") {
          secondLineText += ` | Int: ${(params.pulseIntensity ?? DEFAULT_PULSE_INTENSITY).toFixed(1)}`;
        }
      } else if (node.type === "pulsar_rocket" || node.type === "pulsar_ufo") {
        const angleDeg = (
          ((params.rocketDirectionAngle || 0) * 180) /
          Math.PI
        ).toFixed(0);
        secondLineText = `Dir: ${angleDeg}°`;
      }
    } else if (isDrumType(node.type)) {
      labelText = DRUM_ELEMENT_DEFAULTS[node.type]?.label || "Drum";
      labelYOffset = baseRadiusForLabel + fontSize / 1.5 + 2 / viewScale;
    } else if (node.type === "gate") {
      labelText = GATE_MODES[params?.gateModeIndex || 0];
    } else if (node.type === "probabilityGate") {
      labelText = `${((params?.probability ?? DEFAULT_PROBABILITY) * 100).toFixed(0)}%`;
    } else if (node.type === "pitchShift") {
      const amount = PITCH_SHIFT_AMOUNTS[params?.pitchShiftIndex || 0];
      labelText =
        (amount > 0 ? "+" : "") +
        amount +
        (params?.pitchShiftAlternating ? " ⇄" : "");
    } else if (node.type === "relay") {
      labelText = "Relay";
      labelYOffset = baseRadiusForLabel * 0.6 + fontSize / 1.5 + 2 / viewScale;
    } else if (node.type === "reflector") {
      labelText = "Reflector";
    } else if (node.type === "switch") {
      labelText = "Switch";
      labelYOffset = baseRadiusForLabel * 0.9 + fontSize / 1.5 + 2 / viewScale;
    } else if (node.type === TIMELINE_GRID_TYPE) {
      labelText = `Timeline`;
      if (isGlobalSyncEnabled && node.timelineMusicalDurationBars) {
        const barLabel =
          node.timelineMusicalDurationBars === 1 ? "Bar" : "Bars";
        const beatCount = node.timelineMusicalDurationBars * 4;
        const beatLabel = beatCount === 1 ? "Beat" : "Beats";
        if (node.timelineMusicalDurationBars >= 0.25) {
          if (node.timelineMusicalDurationBars < 1) {
            labelText = `Timeline (${beatCount} ${beatLabel})`;
          } else {
            labelText = `Timeline (${node.timelineMusicalDurationBars} ${barLabel})`;
          }
        } else {
          labelText = `Timeline (${node.timelineSpeed.toFixed(1)}s)`;
        }
      } else {
        labelText = `Timeline (${(node.timelineSpeed || TIMELINE_GRID_DEFAULT_SPEED).toFixed(1)}s)`;
      }
      secondLineText = node.timelineIsPlaying ? "Playing" : "Paused";
      if (node.timelineIsLooping) secondLineText += " (Loop)";
      let directionSymbol = "";
      if (node.scanlineDirection === "forward") directionSymbol = " →";
      else if (node.scanlineDirection === "backward") directionSymbol = " ←";
      else if (node.scanlineDirection === "ping-pong") directionSymbol = " ↔";
      secondLineText += directionSymbol;

      if (
        node.audioParams &&
        typeof node.audioParams.rotation === "number" &&
        node.audioParams.rotation !== 0
      ) {
        const rotationDeg = (
          (node.audioParams.rotation * 180) /
          Math.PI
        ).toFixed(0);
        secondLineText += ` (Rot: ${rotationDeg}°)`;
      }
      labelYOffset = node.height / 2 + fontSize * 1.2;
    }

    const finalLabelX = node.x + wobbleX;
    const finalLabelYBase = node.y + wobbleY;

    let textNeedsRestore = false;
    if (
      node.type === TIMELINE_GRID_TYPE &&
      node.audioParams &&
      typeof node.audioParams.rotation === "number" &&
      node.audioParams.rotation !== 0
    ) {
      ctx.save();
      ctx.translate(finalLabelX, finalLabelYBase + labelYOffset);
      ctx.rotate(node.audioParams.rotation);
      if (labelText) {
        ctx.fillText(labelText, 0, 0);
      }
      if (secondLineText) {
        ctx.fillText(secondLineText, 0, fontSize * 1.1);
      }
      ctx.restore();
      textNeedsRestore = true;
    } else {
      if (labelText) {
        ctx.fillText(labelText, finalLabelX, finalLabelYBase + labelYOffset);
      }
      if (secondLineText) {
        ctx.fillText(
          secondLineText,
          finalLabelX,
          finalLabelYBase + labelYOffset + fontSize * 1.1,
        );
      }
    }
    ctx.fillStyle = originalFillStyleText;
    ctx.font = originalFontText;
    ctx.textAlign = originalTextAlign;
    ctx.textBaseline = originalTextBaseline;
  }
}



function drawTemporaryConnection() {
  if (isConnecting && connectingNode) {
    ctx.save();

    let strokeStyle = "rgba(255, 255, 255, 0.5)";
    let lineWidth = 1 / viewScale;
    let lineDash = [5 / viewScale, 5 / viewScale];

    if (connectionTypeToAdd === "string_violin") {
      strokeStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--string-violin-connection-color")
          .trim() || "#ffccaa";
      lineWidth = 2 / viewScale;
      lineDash = [5 / viewScale, 3 / viewScale];
    } else if (connectionTypeToAdd === "glide") {
      strokeStyle = GLIDE_LINE_COLOR;
      lineWidth = GLIDE_LINE_WIDTH / viewScale;
      lineDash = [8 / viewScale, 4 / viewScale];
    } else if (connectionTypeToAdd === "wavetrail") {
      strokeStyle = "rgba(150, 255, 150, 1.0)";
      lineWidth = 3 / viewScale;
      lineDash = [];
      ctx.globalAlpha = 1.0;
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = Math.max(0.5, lineWidth);
    ctx.setLineDash(lineDash);

    ctx.beginPath();
    ctx.moveTo(connectingNode.x, connectingNode.y);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.stroke();

    ctx.restore();
  }
}

function drawSelectionRect() {
  if (isSelecting && selectionRect.active) {
    const x = Math.min(selectionRect.startX, selectionRect.endX);
    const y = Math.min(selectionRect.startY, selectionRect.endY);
    const w = Math.abs(selectionRect.startX - selectionRect.endX);
    const h = Math.abs(selectionRect.startY - selectionRect.endY);
    const rectColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--selection-rect-color")
        .trim() || "rgba(150,200,255,0.3)";
    ctx.fillStyle = rectColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1 / viewScale;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawAddPreview() {
  if (
    currentTool === "add" &&
    nodeTypeToAdd &&
    nodeTypeToAdd !== TIMELINE_GRID_TYPE
  ) {
    if (nodeTypeToAdd === GRID_SEQUENCER_TYPE) {
      const previewNode = {
        id: -1,
        x: mousePos.x,
        y: mousePos.y,
        width: GRID_SEQUENCER_DEFAULT_WIDTH,
        height: GRID_SEQUENCER_DEFAULT_HEIGHT,
        rows: GRID_SEQUENCER_DEFAULT_ROWS,
        cols: GRID_SEQUENCER_DEFAULT_COLS,
        type: GRID_SEQUENCER_TYPE,
      };
      drawNode(previewNode);
    } else {
      const previewNode = {
        id: -1,
        x: mousePos.x,
        y: mousePos.y,
        size: 1,
        type: nodeTypeToAdd,
        audioParams: { scaleIndex: 0 },
        isStartNode: isPulsarType(nodeTypeToAdd),
        starPoints: isPulsarType(nodeTypeToAdd) ? 6 : 5,
        isEnabled: true,
        animationState: 0,
        pulsePhase: 0,
      };
      drawNode(previewNode);
    }
  }
}

function drawParamGroupLinks() {
  if (paramGroups.length === 0) return;
  ctx.save();
  ctx.strokeStyle = "rgba(180,220,255,0.4)";
  ctx.lineWidth = 1 / viewScale;
  paramGroups.forEach((group) => {
    const ids = Array.from(group.nodeIds);
    for (let i = 0; i < ids.length; i++) {
      const nA = findNodeById(ids[i]);
      if (!nA) continue;
      for (let j = i + 1; j < ids.length; j++) {
        const nB = findNodeById(ids[j]);
        if (!nB) continue;
        ctx.beginPath();
        ctx.moveTo(nA.x, nA.y);
        ctx.lineTo(nB.x, nB.y);
        ctx.stroke();
      }
    }
  });
  ctx.restore();
}


function draw() {
    const now = audioContext
        ? audioContext.currentTime
        : performance.now() / 1000;

    const localDeltaTime = Math.max(
        0,
        Math.min(0.1, now - (previousFrameTime || now)),
    );

    if (wandBeamTimer > 0) {
        wandBeamTimer -= localDeltaTime;
        if (wandBeamTimer < 0) wandBeamTimer = 0;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(viewScale, viewScale);

    drawBackground(
        now,
        getWorldCoords,
        viewOffsetX,
        viewOffsetY,
        previousFrameTime,
        masterAnalyser,
        currentScale,
        rgbaToHsl
    );
    drawGrid();
    updateAndDrawParticles(localDeltaTime, now);

    updateAndDrawRockets(localDeltaTime, now);
    updateAndDrawPlayerUfo(localDeltaTime);

    nebulaIdsToHide.clear();
    const nebulas = nodes.filter((n) => n.type === "nebula");
    for (let i = 0; i < nebulas.length; i++) {
        for (let j = i + 1; j < nebulas.length; j++) {
            const a = nebulas[i];
            const b = nebulas[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < NEBULA_INTERACTION_DISTANCE) {
                nebulaIdsToHide.add(a.id);
                nebulaIdsToHide.add(b.id);
            }
        }
    }

    updateRopeConnections();
    updateAllConnectionLengths();
    drawParamGroupLinks();
    connections.forEach(drawConnection);
    nodes.forEach((node) => drawNode(node));

    for (let i = 0; i < nebulas.length; i++) {
        for (let j = i + 1; j < nebulas.length; j++) {
            const a = nebulas[i];
            const b = nebulas[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < NEBULA_INTERACTION_DISTANCE) {
                const alpha = NEBULA_BRIDGE_ALPHA_BASE * Math.max(0, 1 - dist / NEBULA_INTERACTION_DISTANCE);
                drawPlasmaBridge(ctx, a, b, alpha);
            }
        }
    }

    updateAndDrawPulses(now);

    if (typeof updateAndDrawMeteorShowers === "function") {
        updateAndDrawMeteorShowers(localDeltaTime, now);
    }

    if (
        isConnecting &&
        (currentTool === "connect" ||
            currentTool === "connect_string" ||
            currentTool === "connect_glide" ||
            currentTool === "connect_rope" ||
            currentTool === "connect_wavetrail" ||
            currentTool === "connect_oneway")
    ) {
        drawTemporaryConnection();
    } else if (currentTool === "brush" && isBrushing && lastBrushNode) {
        ctx.save();
        const brushLineColor = "rgba(255, 255, 100, 0.7)";
        const brushLineWidth = Math.max(0.6, 1.2 / viewScale);
        const brushLineDash = [5 / viewScale, 3 / viewScale];
        ctx.strokeStyle = brushLineColor;
        ctx.lineWidth = brushLineWidth;
        ctx.setLineDash(brushLineDash);
        ctx.beginPath();
        ctx.moveTo(lastBrushNode.x, lastBrushNode.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.restore();
    }

    drawSelectionRect();
    drawAddPreview();

    if (currentTool === "wand") {
        ctx.save();
        const len = 20 / viewScale;
        const tipX = mousePos.x;
        const tipY = mousePos.y;
        const baseX = tipX - len;
        const baseY = tipY + len;
        ctx.strokeStyle = "rgba(220,220,220,0.8)";
        ctx.lineWidth = 2 / viewScale;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        const pulseR = 4 / viewScale;
        const glow = 0.7 + 0.3 * Math.sin(performance.now() / 100);
        ctx.beginPath();
        ctx.arc(tipX, tipY, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 150, ${glow})`;
        ctx.fill();
        if (wandBeamTimer > 0 && wandBeamEnd) {
            ctx.strokeStyle = `rgba(255, 200, 250, ${wandBeamTimer / WAND_BEAM_DURATION})`;
            ctx.lineWidth = 3 / viewScale;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(wandBeamEnd.x, wandBeamEnd.y);
            ctx.stroke();
        }
        ctx.restore();
    }
  
    

    if (stringPanel && !stringPanel.classList.contains('hidden')) {
        const connId = stringPanel.dataset.connectionId;
        const conn = findConnectionById(parseInt(connId));
        if (conn) {
            positionStringPanel(conn);
        }
    }

  ctx.restore();
  ctx.setLineDash([]);
  updateMistPatchPositions();
  updateCrushPatchPositions();


    if (stringPanel && !stringPanel.classList.contains('hidden')) {
        const sel = Array.from(selectedElements);
        if (sel.length === 1 && sel[0].type === 'connection') {
            const c = findConnectionById(sel[0].id);
            if (c && c.type === 'string_violin') {
                positionStringPanel(c);
            } else {
                hideStringPanel();
                hideStringConnectionMenu();
            }
        } else {
            hideStringPanel();
            hideStringConnectionMenu();
        }
    }
}

function updateNebulaInteractionAudio() {
  if (!audioContext || !nodes || nodes.length < 2) return;

  const now = audioContext.currentTime;
  const interactionTimeConstant = 0.1;
  const nebulas = nodes.filter((n) => n.type === "nebula");
  const currentInteractingKeys = new Set();
  const previouslyCloseKeys = new Set(activeNebulaInteractions.keys());

  for (let i = 0; i < nebulas.length; i++) {
    for (let j = i + 1; j < nebulas.length; j++) {
      const a = nebulas[i];
      const b = nebulas[j];

      if (
        !a.audioNodes?.filterNode ||
        !b.audioNodes?.filterNode ||
        !a.audioNodes.oscillators ||
        !b.audioNodes.oscillators ||
        !a.audioNodes.filterLfo?.frequency ||
        !b.audioNodes.filterLfo?.frequency
      )
        continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pairKey = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;

      if (dist < NEBULA_INTERACTION_DISTANCE) {
        currentInteractingKeys.add(pairKey);

        const modFactor = Math.max(0, Math.min(1, 1.0 - dist / NEBULA_INTERACTION_DISTANCE));
        activeNebulaInteractions.set(pairKey, {
          a,
          b,
          modFactor,
        });

        try {
          const baseFreqA = a.audioParams.pitch;
          const sizeRangeA = MAX_NODE_SIZE - MIN_NODE_SIZE;
          const normalizedSizeA = (a.size - MIN_NODE_SIZE) / (sizeRangeA || 1);

          const defaultFilterFreqA =
            baseFreqA * 2 +
            normalizedSizeA *
              baseFreqA *
              (a.audioParams.filterFreqFactor || 12);

          const targetFilterFreqA =
            defaultFilterFreqA - modFactor * (defaultFilterFreqA * 0.6);
          a.audioNodes.filterNode.frequency.setTargetAtTime(
            Math.max(20, targetFilterFreqA),
            now,
            interactionTimeConstant,
          );

          const baseFreqB = b.audioParams.pitch;
          const sizeRangeB = MAX_NODE_SIZE - MIN_NODE_SIZE;
          const normalizedSizeB = (b.size - MIN_NODE_SIZE) / (sizeRangeB || 1);
          const defaultFilterFreqB =
            baseFreqB * 2 +
            normalizedSizeB *
              baseFreqB *
              (b.audioParams.filterFreqFactor || 12);
          const targetFilterFreqB =
            defaultFilterFreqB - modFactor * (defaultFilterFreqB * 0.6);
          b.audioNodes.filterNode.frequency.setTargetAtTime(
            Math.max(20, targetFilterFreqB),
            now,
            interactionTimeConstant,
          );

          const baseDetune = a.audioParams.detune || NEBULA_OSC_DETUNE || 7;
          const maxAdditionalDetune = baseDetune * 2.0;
          const targetDetune = baseDetune + modFactor * maxAdditionalDetune;

          a.audioNodes.oscillators.forEach((osc, osc_idx) => {
            if (osc_idx > 0 && osc.detune) {
              const direction =
                (osc_idx % 2 === 0 ? 1 : -1) * Math.ceil(osc_idx / 2);
              osc.detune.setTargetAtTime(
                direction * targetDetune,
                now,
                interactionTimeConstant,
              );
            }
          });
          b.audioNodes.oscillators.forEach((osc, osc_idx) => {
            if (osc_idx > 0 && osc.detune) {
              const direction =
                (osc_idx % 2 === 0 ? 1 : -1) * Math.ceil(osc_idx / 2);
              osc.detune.setTargetAtTime(
                direction * targetDetune,
                now,
                interactionTimeConstant,
              );
            }
          });

          const spinRateA = Math.abs(a.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) * NEBULA_LFO_SPIN_MULTIPLIER;
          const spinRateB = Math.abs(b.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) * NEBULA_LFO_SPIN_MULTIPLIER;
          const baseLfoRate = NEBULA_FILTER_LFO_RATE + (spinRateA + spinRateB) / 2;
          const maxLfoRateVariation = baseLfoRate * 2.0;

          const targetLfoRateA = baseLfoRate + modFactor * maxLfoRateVariation;
          const targetLfoRateB = baseLfoRate - modFactor * (baseLfoRate * 0.75);

          a.audioNodes.filterLfo.frequency.setTargetAtTime(
            Math.max(0.01, targetLfoRateA),
            now,
            interactionTimeConstant,
          );
          b.audioNodes.filterLfo.frequency.setTargetAtTime(
            Math.max(0.01, targetLfoRateB),
            now,
            interactionTimeConstant,
          );
        } catch (e) {
          console.error(`Error applying interaction effect for ${pairKey}:`, e);
        }
      }
    }
  }

  activeNebulaInteractions.forEach((interactionData, pairKey) => {
    if (!currentInteractingKeys.has(pairKey)) {
      const { a, b } = interactionData;
      try {
        if (a?.audioNodes && b?.audioNodes) {
          if (a.audioNodes.filterNode?.frequency) {
            const baseFreqA = a.audioParams.pitch;
            const sizeRangeA = MAX_NODE_SIZE - MIN_NODE_SIZE;
            const normalizedSizeA =
              (a.size - MIN_NODE_SIZE) / (sizeRangeA || 1);
            const defaultFilterFreqA =
              baseFreqA * 2 +
              normalizedSizeA *
                baseFreqA *
                (a.audioParams.filterFreqFactor || 12);
            a.audioNodes.filterNode.frequency.setTargetAtTime(
              defaultFilterFreqA,
              now,
              interactionTimeConstant,
            );
          }

          if (b.audioNodes.filterNode?.frequency) {
            const baseFreqB = b.audioParams.pitch;
            const sizeRangeB = MAX_NODE_SIZE - MIN_NODE_SIZE;
            const normalizedSizeB =
              (b.size - MIN_NODE_SIZE) / (sizeRangeB || 1);
            const defaultFilterFreqB =
              baseFreqB * 2 +
              normalizedSizeB *
                baseFreqB *
                (b.audioParams.filterFreqFactor || 12);
            b.audioNodes.filterNode.frequency.setTargetAtTime(
              defaultFilterFreqB,
              now,
              interactionTimeConstant,
            );
          }

          const baseDetuneA = a.audioParams.detune || NEBULA_OSC_DETUNE || 7;
          a.audioNodes.oscillators?.forEach((osc, osc_idx) => {
            if (osc_idx > 0 && osc.detune) {
              const direction =
                (osc_idx % 2 === 0 ? 1 : -1) * Math.ceil(osc_idx / 2);
              osc.detune.setTargetAtTime(
                direction * baseDetuneA,
                now,
                interactionTimeConstant,
              );
            }
          });

          const baseDetuneB = b.audioParams.detune || NEBULA_OSC_DETUNE || 7;
          b.audioNodes.oscillators?.forEach((osc, osc_idx) => {
            if (osc_idx > 0 && osc.detune) {
              const direction =
                (osc_idx % 2 === 0 ? 1 : -1) * Math.ceil(osc_idx / 2);
              osc.detune.setTargetAtTime(
                direction * baseDetuneB,
                now,
                interactionTimeConstant,
              );
            }
          });

          if (a.audioNodes.filterLfo?.frequency) {
            const spinRateA = Math.abs(a.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) * NEBULA_LFO_SPIN_MULTIPLIER;
            a.audioNodes.filterLfo.frequency.setTargetAtTime(
              NEBULA_FILTER_LFO_RATE + spinRateA,
              now,
              interactionTimeConstant,
            );
          }

          if (b.audioNodes.filterLfo?.frequency) {
            const spinRateB = Math.abs(b.spinSpeed || NEBULA_ROTATION_SPEED_OUTER) * NEBULA_LFO_SPIN_MULTIPLIER;
            b.audioNodes.filterLfo.frequency.setTargetAtTime(
              NEBULA_FILTER_LFO_RATE + spinRateB,
              now,
              interactionTimeConstant,
            );
          }
        }
      } catch (e) {
        console.error(`Error resetting interaction effect for ${pairKey}:`, e);
      }

      activeNebulaInteractions.delete(pairKey);
    }
  });
}

function drawPlasmaBridge(ctx, nodeA, nodeB, alpha) {
  const midX = (nodeA.x + nodeB.x) / 2;
  const midY = (nodeA.y + nodeB.y) / 2;
  const now = audioContext
    ? audioContext.currentTime
    : performance.now() / 1000;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const scaleBase = currentScale.baseHSL || {
    h: 200,
    s: 70,
    l: 70,
  };
  const noteIndexA = nodeA.audioParams.scaleIndex % currentScale.notes.length;
  const hueA = (scaleBase.h + noteIndexA * HUE_STEP) % 360;
  const lightnessA = scaleBase.l * (0.8 + nodeA.size * 0.2);
  const saturationA = scaleBase.s * 0.7;

  const noteIndexB = nodeB.audioParams.scaleIndex % currentScale.notes.length;
  const hueB = (scaleBase.h + noteIndexB * HUE_STEP) % 360;
  const lightnessB = scaleBase.l * (0.8 + nodeB.size * 0.2);
  const saturationB = scaleBase.s * 0.7;

  let avgHue = (hueA + hueB) / 2;
  if (Math.abs(hueA - hueB) > 180) {
    avgHue = ((hueA + hueB + 360) / 2) % 360;
  }
  const avgSaturation = (saturationA + saturationB) / 2;
  const avgLightness = ((lightnessA + lightnessB) / 2) * 1.1;

  const pulseSpeed = 2.5;
  const minRadiusFactor = 0.8;
  const maxRadiusFactor = 1.1;
  const pulseRange = maxRadiusFactor - minRadiusFactor;
  const pulseFactor =
    minRadiusFactor + ((Math.sin(now * pulseSpeed) + 1) / 2) * pulseRange;

  const baseOuterRadius = 60;
  const dynamicFactor = 1 + Math.sin(now + nodeA.id + nodeB.id) * 0.1;
  const outerRadius = baseOuterRadius * pulseFactor * dynamicFactor;
  const innerRadius = 10 * pulseFactor;

  try {
    const grad = ctx.createRadialGradient(
      midX,
      midY,
      innerRadius,
      midX,
      midY,
      outerRadius,
    );

    grad.addColorStop(
      0,
      hslToRgba(avgHue, avgSaturation, avgLightness * 1.1, alpha * 0.9),
    );

    grad.addColorStop(
      0.5,
      hslToRgba(avgHue, avgSaturation, avgLightness, alpha * 0.5),
    );

    grad.addColorStop(
      1,
      hslToRgba(avgHue, avgSaturation, avgLightness * 0.9, 0),
    );

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(midX, midY, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  } catch (e) {
    console.error("Error creating/drawing plasma gradient:", e);

    ctx.fillStyle = hslToRgba(avgHue, avgSaturation, avgLightness, alpha * 0.3);
    ctx.beginPath();
    ctx.arc(midX, midY, baseOuterRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


function launchRocket(pulsarNode, pulseData) {
  if (!audioContext) {
    console.warn("[launchRocket] AudioContext not ready, aborting.");
    return;
  }
  const params = pulsarNode.audioParams;
  const directionAngleFromUI_rad = params.rocketDirectionAngle || 0;
  const speed = params.rocketSpeed || ROCKET_DEFAULT_SPEED;

  const effectiveLaunchAngleRad = directionAngleFromUI_rad - Math.PI / 2;

  const rocket = {
    id: rocketIdCounter++,
    sourcePulsarId: pulsarNode.id,
    startX: pulsarNode.x,
    startY: pulsarNode.y,
    currentX: pulsarNode.x,
    currentY: pulsarNode.y,
    vx: speed * Math.cos(effectiveLaunchAngleRad),
    vy: speed * Math.sin(effectiveLaunchAngleRad),
    gravity: params.rocketGravity || ROCKET_DEFAULT_GRAVITY,
    speed: speed,
    range: params.rocketRange || ROCKET_DEFAULT_RANGE,
    creationTime: audioContext.currentTime,
    distanceTraveled: 0,
    pulseData: {
      ...pulseData,
      color:
        pulsarNode.color ||
        pulseData.color ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--pulse-visual-color")
          .trim(),
    },
    maxLifeTime: (params.rocketRange || ROCKET_DEFAULT_RANGE) / speed,
    previousX: pulsarNode.x,
    previousY: pulsarNode.y,
    isTorpedo: pulseData.isTorpedo || false,
  };
  activeRockets.push(rocket);
}

function updateAndDrawRockets(deltaTime, now) {
  if (activeRockets.length > 0) {}

  activeRockets = activeRockets.filter((rocket) => {
    rocket.previousX = rocket.currentX;
    rocket.previousY = rocket.currentY;

    rocket.currentX += rocket.vx * deltaTime;
    rocket.currentY += rocket.vy * deltaTime;
    rocket.vy += rocket.gravity * deltaTime;
    rocket.distanceTraveled += Math.sqrt(
      Math.pow(rocket.vx * deltaTime, 2) + Math.pow(rocket.vy * deltaTime, 2),
    );

    if (
      rocket.distanceTraveled >= rocket.range ||
      now - rocket.creationTime > rocket.maxLifeTime * 1.1
    ) {
      createExplosionAnimation(
        rocket.currentX,
        rocket.currentY,
        rocket.pulseData.color,
      );
      return false;
    }

    const hitNode = checkRocketNodeCollision(rocket);
    if (hitNode) {
      createExplosionAnimation(
        rocket.currentX,
        rocket.currentY,
        rocket.pulseData.color,
      );
      if (rocket.isTorpedo) {
        removeNode(hitNode);
      } else {
        const uniquePulseIdForHit = currentGlobalPulseId + rocket.id + hitNode.id;
        propagateTrigger(
          hitNode,
          0,
          uniquePulseIdForHit,
          rocket.sourcePulsarId,
          Infinity,
          {
            type: "trigger",
            data: rocket.pulseData,
          },
          null,
        );
      }
      return false;
    }

    const hitConnection = checkRocketConnectionCollision(rocket);
    if (hitConnection) {
      createExplosionAnimation(
        rocket.currentX,
        rocket.currentY,
        rocket.pulseData.color,
      );
      const nodeA = findNodeById(hitConnection.nodeAId);
      const nodeB = findNodeById(hitConnection.nodeBId);
      if (rocket.isTorpedo) {
        removeConnection(hitConnection);
      } else if (nodeA && nodeB) {
        const uniquePulseIdForConnA =
          currentGlobalPulseId + rocket.id + nodeA.id + hitConnection.id;
        const uniquePulseIdForConnB =
          currentGlobalPulseId + rocket.id + nodeB.id + hitConnection.id;
        createVisualPulse(
          hitConnection.id,
          hitConnection.length * DELAY_FACTOR,
          nodeA.id,
          Infinity,
          "trigger",
          rocket.pulseData.color,
          rocket.pulseData.intensity,
        );
        propagateTrigger(
          nodeB,
          hitConnection.length * DELAY_FACTOR,
          uniquePulseIdForConnA,
          nodeA.id,
          Infinity,
          {
            type: "trigger",
            data: rocket.pulseData,
          },
          hitConnection,
        );
        createVisualPulse(
          hitConnection.id,
          hitConnection.length * DELAY_FACTOR,
          nodeB.id,
          Infinity,
          "trigger",
          rocket.pulseData.color,
          rocket.pulseData.intensity,
        );
        propagateTrigger(
          nodeA,
          hitConnection.length * DELAY_FACTOR,
          uniquePulseIdForConnB,
          nodeB.id,
          Infinity,
          {
            type: "trigger",
            data: rocket.pulseData,
          },
          hitConnection,
        );
      }
      return false;
    }

    ctx.save();
    const rocketColor =
      rocket.isTorpedo
        ? rocket.pulseData.color || "rgba(200, 60, 60, 0.95)"
        : rocket.pulseData.color || "rgba(255, 220, 150, 0.95)";
    const visualSize = ROCKET_PULSE_VISUAL_SIZE / viewScale;

    ctx.fillStyle = rocketColor;
    ctx.shadowColor = rocketColor;
    ctx.shadowBlur = 8 / viewScale;
    if (rocket.isTorpedo) {
      const angle = Math.atan2(rocket.vy, rocket.vx);
      ctx.save();
      ctx.translate(rocket.currentX, rocket.currentY);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -visualSize * 2.2);
      ctx.lineTo(-visualSize * 0.9, visualSize * 2.0);
      ctx.lineTo(visualSize * 0.9, visualSize * 2.0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(rocket.currentX, rocket.currentY, visualSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    const tailLength = Math.max(
      visualSize * (rocket.isTorpedo ? 3 : 1.5),
      15 / viewScale,
    );
    const angle = Math.atan2(rocket.vy, rocket.vx);
    const tailGradient = ctx.createLinearGradient(
      rocket.currentX,
      rocket.currentY,
      rocket.currentX - tailLength * Math.cos(angle),
      rocket.currentY - tailLength * Math.sin(angle),
    );
    try {
      tailGradient.addColorStop(0, rocketColor.replace(/[\d\.]+\)$/g, "0.7)"));
      tailGradient.addColorStop(1, rocketColor.replace(/[\d\.]+\)$/g, "0)"));
    } catch (e) {}

    ctx.strokeStyle = tailGradient;
    ctx.lineWidth = Math.max(1, visualSize * 1.2);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rocket.currentX, rocket.currentY);
    ctx.lineTo(
      rocket.currentX - tailLength * Math.cos(angle) * 0.8,
      rocket.currentY - tailLength * Math.sin(angle) * 0.8,
    );
    ctx.stroke();
    ctx.restore();

    return true;
  });
}

function checkRocketNodeCollision(rocket) {
  for (const node of nodes) {
    if (node.id === rocket.sourcePulsarId) continue;
    if (node.type === "nebula" || node.type === PORTAL_NEBULA_TYPE) continue;

    const collisionRadius = NODE_RADIUS_BASE * node.size * 0.8;
    const dist = distance(rocket.currentX, rocket.currentY, node.x, node.y);

    if (dist < collisionRadius) {
      return node;
    }
  }
  return null;
}

function checkRocketConnectionCollision(rocket) {
  const collisionThreshold = 15 / viewScale;
  for (const conn of connections) {
    const nA = findNodeById(conn.nodeAId);
    const nB = findNodeById(conn.nodeBId);
    if (!nA || !nB) continue;

    const midControlX = (pA.x + pB.x) / 2 + conn.controlPointOffsetX;
    const midControlY = (pA.y + pB.y) / 2 + conn.controlPointOffsetY;

    const curveMidX = lerp(
      lerp(pA.x, midControlX, 0.5),
      lerp(midControlX, pB.x, 0.5),
      0.5,
    );
    const curveMidY = lerp(
      lerp(pA.y, midControlY, 0.5),
      lerp(midControlY, pB.y, 0.5),
      0.5,
    );

    const distToMid = distance(
      rocket.currentX,
      rocket.currentY,
      curveMidX,
      curveMidY,
    );

    if (distToMid < collisionThreshold + conn.length / 15) {
      const lineMinX = Math.min(pA.x, pB.x) - collisionThreshold;
      const lineMaxX = Math.max(pA.x, pB.x) + collisionThreshold;
      const lineMinY = Math.min(pA.y, pB.y) - collisionThreshold;
      const lineMaxY = Math.max(pA.y, pB.y) + collisionThreshold;

      if (
        rocket.currentX >= lineMinX &&
        rocket.currentX <= lineMaxX &&
        rocket.currentY >= lineMinY &&
        rocket.currentY <= lineMaxY
      ) {
        const dxToCurve = curveMidX - rocket.currentX;
        const dyToCurve = curveMidY - rocket.currentY;

        const dotProduct = rocket.vx * dxToCurve + rocket.vy * dyToCurve;

        if (dotProduct > 0) {
          return conn;
        }
      }
    }
  }
  return null;
}

function updateSpaceRadar(node, deltaTime) {
  if (node.type === CRANK_RADAR_TYPE) {
    if (!node.radarIsPlaying && !node.manualAdvanceIncrement && !node.pulseAdvanceRemaining) return;
  } else if (!node.radarIsPlaying && !node.manualAdvanceIncrement) {
    return;
  }

  let duration;
  if (isGlobalSyncEnabled && node.radarMusicalDurationBars && globalBPM > 0) {
    const beatsPerBar = 4;
    duration = node.radarMusicalDurationBars * beatsPerBar * (60.0 / globalBPM);
  } else {
    duration = node.radarSpeed > 0 ? node.radarSpeed : SPACERADAR_DEFAULT_SPEED;
  }

  let increment = 0;
  if (node.manualAdvanceIncrement) {
    increment = node.manualAdvanceIncrement;
    const twoPi = Math.PI * 2;
    increment = ((increment % twoPi) + twoPi) % twoPi;
    if (increment > Math.PI) increment -= twoPi;
    node.manualAdvanceIncrement = 0;
  } else if (node.radarIsPlaying) {
    increment = (2 * Math.PI * deltaTime) / duration;
  }

  if (node.type === CRANK_RADAR_TYPE && node.pulseAdvanceRemaining) {
    const force = node.pulseForce || PULSE_FORCE_DEFAULT;
    const decay = node.pulseDecay || PULSE_DECAY_DEFAULT;
    const pushFrac = (deltaTime * force) / decay;
    let step = pushFrac * node.pulseAdvanceRemaining;
    if (Math.abs(step) >= Math.abs(node.pulseAdvanceRemaining)) {
      step = node.pulseAdvanceRemaining;
      node.pulseAdvanceRemaining = 0;
    } else {
      node.pulseAdvanceRemaining -= step;
    }
    increment += step;
  }
  let angle = node.scanAngle || 0;
  let dir = node.radarDirection || 1;
  const segments = [];

  function addSegment(start, end, d) {
    segments.push({ start, end, dir: d });
  }

  if (node.radarMode === SPACERADAR_MODE_REVERSE) {
    let remaining = increment;
    while (remaining > 0) {
      if (dir === 1) {
        const toEdge = Math.PI * 2 - angle;
        if (remaining <= toEdge) {
          addSegment(angle, angle + remaining, 1);
          angle += remaining;
          remaining = 0;
        } else {
          addSegment(angle, Math.PI * 2, 1);
          remaining -= toEdge;
          angle = Math.PI * 2;
          dir = -1;
          if (node.triggeredInThisSweep) node.triggeredInThisSweep.clear();
          else node.triggeredInThisSweep = new Set();
        }
      } else {
        const toEdge = angle;
        if (remaining <= toEdge) {
          addSegment(angle, angle - remaining, -1);
          angle -= remaining;
          remaining = 0;
        } else {
          addSegment(angle, 0, -1);
          remaining -= toEdge;
          angle = 0;
          dir = 1;
          if (node.triggeredInThisSweep) node.triggeredInThisSweep.clear();
          else node.triggeredInThisSweep = new Set();
        }
      }
    }
  } else {
    const prevAngle = angle;
    let newAngle = angle + increment;
    newAngle = ((newAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const movingForward = increment >= 0;
    if (movingForward) {
      if (newAngle < prevAngle) {
        addSegment(prevAngle, Math.PI * 2, 1);
        addSegment(0, newAngle, 1);
        if (node.triggeredInThisSweep) node.triggeredInThisSweep.clear();
        else node.triggeredInThisSweep = new Set();
      } else {
        addSegment(prevAngle, newAngle, 1);
      }
    } else {
      if (newAngle > prevAngle) {
        addSegment(prevAngle, 0, -1);
        addSegment(Math.PI * 2, newAngle, -1);
        if (node.triggeredInThisSweep) node.triggeredInThisSweep.clear();
        else node.triggeredInThisSweep = new Set();
      } else {
        addSegment(prevAngle, newAngle, -1);
      }
    }
    angle = newAngle;
    dir = movingForward ? 1 : -1;
  }

  node.scanAngle = angle;
  node.radarDirection = dir;
  nodes.forEach((otherNode) => {
    if (
      otherNode.id === node.id ||
      otherNode.type === SPACERADAR_TYPE ||
      otherNode.type === CRANK_RADAR_TYPE ||
      otherNode.type === TIMELINE_GRID_TYPE
    )
      return;
    if (
      !otherNode.audioParams &&
      !isDrumType(otherNode.type) &&
      otherNode.type !== "sound" &&
      otherNode.type !== PRORB_TYPE &&
      otherNode.type !== "nebula" &&
      otherNode.type !== PORTAL_NEBULA_TYPE &&
      otherNode.type !== "global_key_setter"
    )
      return;

    const nodeApparentRadius = NODE_RADIUS_BASE * otherNode.size;
    const dx = otherNode.x - node.x;
    const dy = otherNode.y - node.y;
    const dist = Math.hypot(dx, dy);
    if (dist - nodeApparentRadius > node.radius) return;
    const ang =
      ((Math.atan2(dy, dx) + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) %
      (2 * Math.PI);
    for (const seg of segments) {
      const inSeg =
        seg.dir === 1
          ? seg.start <= seg.end
            ? ang >= seg.start && ang <= seg.end
            : ang >= seg.start || ang <= seg.end
          : seg.start >= seg.end
          ? ang <= seg.start && ang >= seg.end
          : ang <= seg.start || ang >= seg.end;
      if (inSeg) {
        if (!node.triggeredInThisSweep || !node.triggeredInThisSweep.has(otherNode.id)) {
          const pulse = {
            intensity: node.radarPulseIntensity || SPACERADAR_DEFAULT_PULSE_INTENSITY,
            color: SPACERADAR_DEFAULT_COLOR,
            particleMultiplier: 0.6,
            fromTimeline: true,
          };
          triggerNodeEffect(otherNode, pulse);
          if (!node.triggeredInThisSweep) node.triggeredInThisSweep = new Set();
          node.triggeredInThisSweep.add(otherNode.id);
          otherNode.animationState = 1.0;
          setTimeout(() => {
            const still = findNodeById(otherNode.id);
            if (still && !still.isTriggered && (!still.activeRetriggers || still.activeRetriggers.length === 0)) {
              still.animationState = 0;
            }
          }, 250);
        }
        break;
      }
    }
  });
}

function toggleUfoMode() {
  isUfoModeActive = !isUfoModeActive;
  if (isUfoModeActive) {
    const center = getWorldCoords(canvas.width / 2, canvas.height / 2);
    playerUfo = { x: center.x, y: center.y, angle: 0, vx: 0, vy: 0 };
    ufoKeys.up = ufoKeys.down = ufoKeys.left = ufoKeys.right = false;
    tractorBeamActive = false;
    tractorBeamTarget = null;
  } else {
    playerUfo = null;
    tractorBeamActive = false;
    tractorBeamTarget = null;
  }
}

function shootUfo() {
  if (!playerUfo) return;
  const dummyNode = {
    id: -999,
    x: playerUfo.x,
    y: playerUfo.y,
    type: "pulsar_ufo",
    color: null,
    audioParams: {
      rocketDirectionAngle: playerUfo.angle,
      rocketSpeed: ROCKET_DEFAULT_SPEED,
      rocketRange: ROCKET_DEFAULT_RANGE,
      rocketGravity: ROCKET_DEFAULT_GRAVITY,
    },
  };
  launchRocket(dummyNode, { intensity: 1.0 });
}

function fireUfoTorpedo() {
  if (!playerUfo) return;
  const dummyNode = {
    id: -998,
    x: playerUfo.x,
    y: playerUfo.y,
    type: "pulsar_ufo",
    color: null,
    audioParams: {
      rocketDirectionAngle: playerUfo.angle,
      rocketSpeed: ROCKET_DEFAULT_SPEED,
      rocketRange: ROCKET_DEFAULT_RANGE,
      rocketGravity: ROCKET_DEFAULT_GRAVITY,
    },
  };
  launchRocket(dummyNode, { intensity: 1.0, isTorpedo: true });
}

function shootUfoConnector() {
  if (!playerUfo) return;
  const target = findNearestConnectableNode(
    playerUfo.x,
    playerUfo.y,
    NODE_RADIUS_BASE * 4,
  );
  if (!target) return;
  if (!ufoConnectorFirstNode) {
    ufoConnectorFirstNode = target;
    createParticles(target.x, target.y, 10);
  } else {
    if (target.id !== ufoConnectorFirstNode.id) {
      connectNodes(ufoConnectorFirstNode, target, connectionTypeToAdd);
      createParticles(target.x, target.y, 10);
    }
    ufoConnectorFirstNode = null;
  }
}

function placeOrbFromUfo() {
  if (!playerUfo) return;
  const prevNote = noteIndexToAdd;
  noteIndexToAdd = -1;
  const n = addNode(playerUfo.x, playerUfo.y + NODE_RADIUS_BASE * 1.5, "sound", ufoOrbWaveform);
  noteIndexToAdd = prevNote;
  return n;
}

function updateAndDrawPlayerUfo(deltaTime) {
  if (!isUfoModeActive || !playerUfo) return;
  if (ufoKeys.up) playerUfo.vy -= UFO_ACCEL * deltaTime;
  if (ufoKeys.down) playerUfo.vy += UFO_ACCEL * deltaTime;
  if (ufoKeys.left) playerUfo.vx -= UFO_ACCEL * deltaTime;
  if (ufoKeys.right) playerUfo.vx += UFO_ACCEL * deltaTime;

  const speed = Math.hypot(playerUfo.vx, playerUfo.vy);
  if (speed > UFO_MOVE_SPEED) {
    const scale = UFO_MOVE_SPEED / speed;
    playerUfo.vx *= scale;
    playerUfo.vy *= scale;
  }

  playerUfo.vx -= playerUfo.vx * UFO_FRICTION * deltaTime;
  playerUfo.vy -= playerUfo.vy * UFO_FRICTION * deltaTime;

  playerUfo.x += playerUfo.vx * deltaTime;
  playerUfo.y += playerUfo.vy * deltaTime;

  if (playerUfo.vx !== 0 || playerUfo.vy !== 0) {
    playerUfo.angle = Math.atan2(playerUfo.vy, playerUfo.vx) + Math.PI / 2;
  }

  if (tractorBeamActive) {
    if (!tractorBeamTarget) {
      tractorBeamTarget = findNearestOrb(playerUfo.x, playerUfo.y, NODE_RADIUS_BASE * 3);
      if (tractorBeamTarget) {
        tractorBeamTarget._tractorVX = 0;
        tractorBeamTarget._tractorVY = 0;
      }
    }
    if (tractorBeamTarget) {
      const drawingAngleRad = playerUfo.angle - Math.PI / 2;
      const bottomDist = NODE_RADIUS_BASE * 3.5;
      const targetX = playerUfo.x - bottomDist * Math.sin(drawingAngleRad);
      const targetY = playerUfo.y + bottomDist * Math.cos(drawingAngleRad);
      const stiff = 8;
      const damp = 0.8;
      tractorBeamTarget._tractorVX =
        (tractorBeamTarget._tractorVX || 0) + (targetX - tractorBeamTarget.x) * stiff * deltaTime;
      tractorBeamTarget._tractorVY =
        (tractorBeamTarget._tractorVY || 0) + (targetY - tractorBeamTarget.y) * stiff * deltaTime;
      tractorBeamTarget._tractorVX *= damp;
      tractorBeamTarget._tractorVY *= damp;
      tractorBeamTarget.x += tractorBeamTarget._tractorVX * deltaTime * 60;
      tractorBeamTarget.y += tractorBeamTarget._tractorVY * deltaTime * 60;
    }
  }

  const centerScreenX = canvas.width / 2;
  const centerScreenY = canvas.height / 2;
  viewOffsetX = centerScreenX - playerUfo.x * viewScale;
  viewOffsetY = centerScreenY - playerUfo.y * viewScale;
  drawPlayerUfo();
}

function drawPlayerUfo() {
  if (!playerUfo) return;
  const outerR = NODE_RADIUS_BASE;
  const drawingAngleRad = playerUfo.angle - Math.PI / 2;
  ctx.save();
  ctx.translate(playerUfo.x, playerUfo.y);
  ctx.rotate(drawingAngleRad);
  if (tractorBeamActive) {
    const topY = outerR * 0.6;
    const bottomY = outerR * 3.5;
    const beamW = outerR * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(-beamW, bottomY);
    ctx.lineTo(beamW, bottomY);
    ctx.closePath();
    const scaleBase = currentScale.baseHSL || { h: 200, s: 70, l: 70 };
    const hue = (scaleBase.h + 100) % 360;
    const beamGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
    beamGrad.addColorStop(0, hslToRgba(hue, scaleBase.s, scaleBase.l * 1.1, 0.4));
    beamGrad.addColorStop(1, hslToRgba(hue, scaleBase.s, scaleBase.l * 1.1, 0));
    ctx.fillStyle = beamGrad;
    ctx.fill();
    ctx.strokeStyle = hslToRgba(hue, scaleBase.s, scaleBase.l * 1.1, 0.8);
    ctx.lineWidth = 2 / viewScale;
    const t = performance.now() / 150;
    for (let i = -2; i <= 2; i++) {
      const offsetX = (i / 2) * beamW * 0.8;
      const wiggleTop = Math.sin(t + i) * outerR * 0.05;
      const wiggleBottom = Math.sin(t + i + 0.5) * outerR * 0.05;
      ctx.beginPath();
      ctx.moveTo(offsetX + wiggleTop, topY);
      ctx.lineTo(offsetX + wiggleBottom, bottomY);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  const scaleBaseBody = currentScale.baseHSL || { h: 200, s: 70, l: 70 };
  const bodyHue = (scaleBaseBody.h + 100) % 360;
  const bodyGrad = ctx.createRadialGradient(0, -outerR * 0.2, outerR * 0.2, 0, 0, outerR);
  bodyGrad.addColorStop(0, hslToRgba(bodyHue, scaleBaseBody.s * 0.5, Math.min(100, scaleBaseBody.l * 1.3), 1));
  bodyGrad.addColorStop(1, hslToRgba(bodyHue, scaleBaseBody.s, scaleBaseBody.l * 0.9, 1));
  ctx.ellipse(0, 0, outerR, outerR * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = hslToRgba(bodyHue, scaleBaseBody.s * 0.8, scaleBaseBody.l * 0.4, 1);
  ctx.lineWidth = 2 / viewScale;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -outerR * 0.4, outerR * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = hslToRgba(bodyHue, scaleBaseBody.s * 0.5, scaleBaseBody.l * 0.2, 1);
  ctx.fill();
  ctx.restore();
}

function updateMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  screenMousePos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  mousePos = getWorldCoords(screenMousePos.x, screenMousePos.y);
}

function handlePitchCycle(element) {
  let node, connection;
  if (element.type === "node") node = findNodeById(element.id);
  else if (element.type === "connection")
    connection = findConnectionById(element.id);
  if (!node && !connection) return;
  const target = node || connection;
  if (
    (node && !["sound", "nebula"].includes(node.type)) ||
    (connection && connection.type !== "string_violin")
  )
    return;
  const oldIndex = target.audioParams.scaleIndex;
  target.audioParams.scaleIndex = Math.min(
    MAX_SCALE_INDEX,
    (target.audioParams.scaleIndex ?? 0) + 1,
  );
  target.audioParams.pitch = getFrequency(
    currentScale,
    target.audioParams.scaleIndex,
    0,
    currentRootNote,
    globalTransposeOffset,
  );
  if (node) updateNodeAudioParams(node);
  else updateConnectionAudioParams(connection);
  target.animationState = 0.1;
  setTimeout(() => {
    const checkElem = node
      ? findNodeById(node.id)
      : findConnectionById(connection.id);
    if (checkElem && checkElem.animationState > 0 && !checkElem.isTriggered)
      checkElem.animationState = 0;
  }, 150);
  if (oldIndex !== target.audioParams.scaleIndex) {
    populateEditPanel();
    saveState();
  }
}

function handlePitchCycleDown(element) {
  let node, connection;
  if (element.type === "node") node = findNodeById(element.id);
  else if (element.type === "connection")
    connection = findConnectionById(element.id);
  if (!node && !connection) return;
  const target = node || connection;
  if (
    (node && !["sound", "nebula"].includes(node.type)) ||
    (connection && connection.type !== "string_violin")
  )
    return;
  const oldIndex = target.audioParams.scaleIndex;
  target.audioParams.scaleIndex = Math.max(
    MIN_SCALE_INDEX,
    (target.audioParams.scaleIndex ?? 0) - 1,
  );
  target.audioParams.pitch = getFrequency(
    currentScale,
    target.audioParams.scaleIndex,
    0,
    currentRootNote,
    globalTransposeOffset,
  );
  if (node) updateNodeAudioParams(node);
  else updateConnectionAudioParams(connection);
  target.animationState = 0.1;
  setTimeout(() => {
    const checkElem = node
      ? findNodeById(node.id)
      : findConnectionById(connection.id);
    if (checkElem && checkElem.animationState > 0 && !checkElem.isTriggered)
      checkElem.animationState = 0;
  }, 150);
  if (oldIndex !== target.audioParams.scaleIndex) {
    populateEditPanel();
    saveState();
  }
}

function handleTapTempo(node) {
  if (
    !isAudioReady ||
    !node ||
    !node.isStartNode ||
    isGlobalSyncEnabled ||
    node.type === "pulsar_triggerable" ||
    node.type === "pulsar_random_particles"
  )
    return;
  const oldInterval = node.audioParams.triggerInterval;
  const nowMs = performance.now();
  if (
    tapTempoTimes.length > 0 &&
    nowMs - tapTempoTimes[tapTempoTimes.length - 1] > MAX_TAP_INTERVAL
  ) {
    tapTempoTimes = [];
  }
  tapTempoTimes.push(nowMs);
  if (tapTempoTimes.length > MAX_TAP_TIMES) {
    tapTempoTimes.shift();
  }
  if (tapTempoTimes.length > 1) {
    let totalInterval = 0;
    for (let i = 1; i < tapTempoTimes.length; i++) {
      totalInterval += tapTempoTimes[i] - tapTempoTimes[i - 1];
    }
    const avgIntervalMs = totalInterval / (tapTempoTimes.length - 1);
    const newIntervalSec = avgIntervalMs / 1000;
    node.audioParams.triggerInterval = Math.max(
      0.1,
      Math.min(10.0, newIntervalSec),
    );
    node.animationState = 0.5;
    setTimeout(() => {
      const checkNode = findNodeById(node.id);
      if (checkNode && !checkNode.isTriggered) checkNode.animationState = 0;
    }, 100);
    if (oldInterval !== node.audioParams.triggerInterval) {
      populateEditPanel();
      saveState();
    }
  } else {
    node.animationState = 0.2;
    setTimeout(() => {
      const checkNode = findNodeById(node.id);
      if (checkNode && !checkNode.isTriggered) checkNode.animationState = 0;
    }, 100);
  }
}

function handleSubdivisionCycle(node) {
  if (
    !node ||
    !node.isStartNode ||
    !isGlobalSyncEnabled ||
    node.type === "pulsar_triggerable" ||
    node.type === "pulsar_random_particles"
  )
    return;
  const oldIndex = node.syncSubdivisionIndex;
  node.syncSubdivisionIndex =
    (node.syncSubdivisionIndex + 1) % subdivisionOptions.length;
  node.nextSyncTriggerTime = 0;
  node.animationState = 0.3;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode && !checkNode.isTriggered) checkNode.animationState = 0;
  }, 100);
  if (oldIndex !== node.syncSubdivisionIndex) {
    populateEditPanel();
    saveState();
  }
}

function handleGateCycle(node) {
  if (!node || node.type !== "gate") return;
  const oldIndex = node.gateModeIndex;
  node.gateModeIndex = (node.gateModeIndex + 1) % GATE_MODES.length;
  node.gateCounter = 0;
  node.animationState = 0.3;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode) checkNode.animationState = 0;
  }, 100);
  if (oldIndex !== node.gateModeIndex) {
    populateEditPanel();
    saveState();
  }
}

function handleProbabilityCycle(node) {
  if (!node || node.type !== "probabilityGate") return;
  const oldProbability = node.audioParams.probability;
  let newProbability = Math.round((oldProbability + 0.1) * 10) / 10;
  if (newProbability > 1.0) {
    newProbability = 0.1;
  }
  node.audioParams.probability = newProbability;
  node.animationState = 0.3;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode) checkNode.animationState = 0;
  }, 100);
  if (oldProbability !== node.audioParams.probability) {
    populateEditPanel();
    saveState();
  }
}

function handlePitchShiftCycle(node) {
  if (!node || node.type !== "pitchShift") return;
  const oldIndex = node.pitchShiftIndex;
  node.pitchShiftIndex =
    (node.pitchShiftIndex + 1) % PITCH_SHIFT_AMOUNTS.length;
  node.pitchShiftAmount = PITCH_SHIFT_AMOUNTS[node.pitchShiftIndex];
  node.animationState = 0.3;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode) checkNode.animationState = 0;
  }, 100);
  if (oldIndex !== node.pitchShiftIndex) {
    populateEditPanel();
    saveState();
  }
}

function handleWaveformCycle(node) {
  if (!node || node.type !== "nebula") return;
  const nebulaWaveforms = NEBULA_PRESET_OPTIONS.map((p) => p.type);

  if (nebulaWaveforms.length === 0) {
    console.warn(
      "handleWaveformCycle: No waveforms available for Nebula.",
    );
    return;
  }

  const currentWaveform = node.audioParams.waveform || "sawtooth";
  let currentIndex = nebulaWaveforms.indexOf(currentWaveform);

  if (currentIndex === -1) {
    currentIndex = 0;
  }

  const nextIndex = (currentIndex + 1) % nebulaWaveforms.length;
  const newWaveform = nebulaWaveforms[nextIndex];

  node.audioParams.waveform = newWaveform;

  if (node.audioNodes && node.audioNodes.oscillators) {
    node.audioNodes.oscillators.forEach((osc) => {
      if (osc.type !== newWaveform) {
        try {
          osc.type = newWaveform;
        } catch (e) {
          console.error(
            `Error setting oscillator type to ${newWaveform} for Nebula:`,
            e,
          );

          osc.type = "sawtooth";
          node.audioParams.waveform = "sawtooth";
        }
      }
    });
  }

  updateNodeAudioParams(node);
  node.animationState = 0.3;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode && !checkNode.isTriggered) checkNode.animationState = 0;
  }, 150);

  populateEditPanel();
  saveState();
}


function handlePulsarTriggerToggle(node) {
  if (!node || !isPulsarType(node.type)) return;
  node.isEnabled = !node.isEnabled;
  if (!node.isEnabled && node.type !== "pulsar_triggerable") {
    node.lastTriggerTime = -1;
    node.nextSyncTriggerTime = 0;
    node.nextGridTriggerTime = 0;
  } else if (node.isEnabled && node.type === "pulsar_triggerable") {
    node.lastTriggerTime = -1;
    node.nextSyncTriggerTime = 0;
    node.nextGridTriggerTime = 0;
    if (node.type === "pulsar_random_particles") {
      const nowTime = audioContext
        ? audioContext.currentTime
        : performance.now() / 1000;
      node.nextRandomTriggerTime =
        nowTime + (Math.random() * 2) / PULSAR_RANDOM_TIMING_CHANCE_PER_SEC;
    }
  }
  node.animationState = 0.3;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode) checkNode.animationState = 0;
  }, 150);
  populateEditPanel();
  saveState();
}

function createExplosionAnimation(x, y, color) {
  const explosionColor = color || "rgba(255, 100, 60, 0.95)";
  for (let i = 0; i < ROCKET_EXPLOSION_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    const life = 0.5 + Math.random() * 0.5;
    activeParticles.push({
      id: particleIdCounter++,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      radius: 2.0 + Math.random() * 3.0,
      color: explosionColor,
    });
  }
}

let _tempWasSelectedAtMouseDown = false;

function handleMouseDown(event) {
  
  if (event.button === 2) return;

  if (!isAudioReady) return;

  if (!isPlaying && event.target === canvas) {
    togglePlayPause();
  }

  const targetIsPanelControl =
    hamburgerMenuPanel.contains(event.target) ||
    sideToolbar.contains(event.target) ||
    transportControlsDiv.contains(event.target) ||
    mixerPanel.contains(event.target);
  if (targetIsPanelControl) {
    return;
  }

  if (currentTool === "wand" && event.button === 0) {
    updateMousePos(event);
    const newNode = addNode(mousePos.x, mousePos.y, PORTAL_NEBULA_TYPE);
    if (newNode) {
      wandBeamEnd = { x: mousePos.x, y: mousePos.y };
      wandBeamTimer = WAND_BEAM_DURATION;
      currentGlobalPulseId++;
      propagateTrigger(newNode, 0, currentGlobalPulseId, -1, Infinity, {
        type: "trigger",
        data: { intensity: 1.0 },
      });
    }
    return;
  }

  updateMousePos(event);

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const ctrlLike = isMac ? event.metaKey : event.ctrlKey;
  ctrlLikeAtMouseDown = ctrlLike;

  _tempWasSelectedAtMouseDown = false;
  isDragging = false;
  isConnecting = false;
  isResizing = false;
  isSelecting = false;
  isPanning = false;
  didDrag = false;
  selectionRect.active = false;
  isRotatingRocket = null;
  isCrankingRadar = null;
  isResizingTimelineGrid = false;
  resizingTimelineGridNode = null;
  resizeHandleType = null;

  isDrawingNewTimelineGrid = false;
  newTimelineGridInitialCorner = null;

  nodeClickedAtMouseDown = null;
  connectionClickedAtMouseDown = null;
  elementClickedAtMouseDown = null;
  mouseDownPos = { ...mousePos };

  isRotatingTimelineGrid = false;
  rotatingTimelineGridNode = null;
  rotationTimelineGridStartAngle = 0;
  initialTimelineGridRotation = 0;

  const potentialNodeClickedGeneral = findNodeAt(mousePos.x, mousePos.y);

  if (
    potentialNodeClickedGeneral &&
    potentialNodeClickedGeneral.type === TIMELINE_GRID_TYPE &&
    event.shiftKey &&
    event.ctrlKey &&
    currentTool === "edit"
  ) {
    isRotatingTimelineGrid = true;
    rotatingTimelineGridNode = potentialNodeClickedGeneral;
    const dx = mousePos.x - rotatingTimelineGridNode.x;
    const dy = mousePos.y - rotatingTimelineGridNode.y;
    rotationTimelineGridStartAngle = Math.atan2(dy, dx);
    initialTimelineGridRotation =
      rotatingTimelineGridNode.audioParams.rotation || 0;
    didDrag = false;
    canvas.style.cursor = "grabbing";

    isDragging = false;
    isResizing = false;
    isConnecting = false;
    isSelecting = false;
    isResizingTimelineGrid = false;

    nodeClickedAtMouseDown = potentialNodeClickedGeneral;
    elementClickedAtMouseDown = {
      type: "node",
      id: potentialNodeClickedGeneral.id,
      nodeRef: potentialNodeClickedGeneral,
    };
    _tempWasSelectedAtMouseDown = isElementSelected(
      "node",
      potentialNodeClickedGeneral.id,
    );
    return;
  }

  if (currentTool === "add" && nodeTypeToAdd === TIMELINE_GRID_TYPE) {
    isDrawingNewTimelineGrid = true;

    newTimelineGridInitialCorner = isSnapEnabled
      ? snapToGrid(mousePos.x, mousePos.y)
      : { ...mousePos };

    const tempDimensions = { width: 5, height: 5 };
    const newNode = addNode(
      newTimelineGridInitialCorner.x,
      newTimelineGridInitialCorner.y,
      TIMELINE_GRID_TYPE,
      null,
      tempDimensions,
    );
    if (newNode) {
      currentlyPlacingTimelineNodeId = newNode.id;
      newNode.isInResizeMode = false;
      selectedElements.clear();
      selectedElements.add({ type: "node", id: newNode.id });
      _tempWasSelectedAtMouseDown = true;
      nodeClickedAtMouseDown = newNode;
      elementClickedAtMouseDown = {
        type: "node",
        id: newNode.id,
        nodeRef: newNode,
      };
    } else {
      isDrawingNewTimelineGrid = false;
    }
    didDrag = false;
    canvas.style.cursor = "crosshair";
    return;
  }

  let activeSelectedNode = null;
  if (currentTool === "edit" && selectedElements.size > 0) {
    const firstSelectedElement = Array.from(selectedElements)[0];
    if (firstSelectedElement && firstSelectedElement.type === "node") {
      activeSelectedNode = findNodeById(firstSelectedElement.id);
    }
  }

  if (
    activeSelectedNode &&
    activeSelectedNode.type === TIMELINE_GRID_TYPE &&
    !isPanning
  ) {
    const node = activeSelectedNode;

    if (
      node.resizeToggleIconRect &&
      mousePos.x >= node.resizeToggleIconRect.x1 &&
      mousePos.x <= node.resizeToggleIconRect.x2 &&
      mousePos.y >= node.resizeToggleIconRect.y1 &&
      mousePos.y <= node.resizeToggleIconRect.y2
    ) {
      node.isInResizeMode = !node.isInResizeMode;
      if (node.audioParams)
        node.audioParams.isInResizeMode = node.isInResizeMode;
      saveState();
      nodeClickedAtMouseDown = node;
      elementClickedAtMouseDown = { type: "node", id: node.id, nodeRef: node };
      _tempWasSelectedAtMouseDown = true;
      didDrag = false;
      return;
    }

    if (
      node.directionToggleIconRect &&
      mousePos.x >= node.directionToggleIconRect.x1 &&
      mousePos.x <= node.directionToggleIconRect.x2 &&
      mousePos.y >= node.directionToggleIconRect.y1 &&
      mousePos.y <= node.directionToggleIconRect.y2
    ) {
      const directions = ["forward", "backward", "ping-pong"];
      let currentIndex = directions.indexOf(
        node.scanlineDirection || "forward",
      );
      currentIndex = (currentIndex + 1) % directions.length;
      node.scanlineDirection = directions[currentIndex];
      if (node.scanlineDirection === "ping-pong") {
        node.isPingPongForward = true;
      }
      if (node.audioParams)
        node.audioParams.scanlineDirection = node.scanlineDirection;
      saveState();
      nodeClickedAtMouseDown = node;
      elementClickedAtMouseDown = { type: "node", id: node.id, nodeRef: node };
      _tempWasSelectedAtMouseDown = true;
      didDrag = false;
      return;
    }

    if (node.isInResizeMode) {
      const handleDetectionPixelMargin = 12;
      const handleHitAreaWorld = handleDetectionPixelMargin / viewScale;
      const hArea = handleHitAreaWorld / 2;
      const rX = node.x - node.width / 2;
      const rY = node.y - node.height / 2;
      const rCX = node.x;
      const rCY = node.y;
      const rXW = node.x + node.width / 2;
      const rYH = node.y + node.height / 2;
      const handles = [
        { x: rX, y: rY, type: "top-left", cursor: "nwse-resize" },
        { x: rCX, y: rY, type: "top", cursor: "ns-resize" },
        { x: rXW, y: rY, type: "top-right", cursor: "nesw-resize" },
        { x: rX, y: rCY, type: "left", cursor: "ew-resize" },
        { x: rXW, y: rCY, type: "right", cursor: "ew-resize" },
        { x: rX, y: rYH, type: "bottom-left", cursor: "nesw-resize" },
        { x: rCX, y: rYH, type: "bottom", cursor: "ns-resize" },
        { x: rXW, y: rYH, type: "bottom-right", cursor: "nwse-resize" },
      ];
      for (const handle of handles) {
        if (
          mousePos.x >= handle.x - hArea &&
          mousePos.x <= handle.x + hArea &&
          mousePos.y >= handle.y - hArea &&
          mousePos.y <= handle.y + hArea
        ) {
          isResizingTimelineGrid = true;
          resizingTimelineGridNode = node;
          resizeHandleType = handle.type;
          resizeStartMousePos = { ...mousePos };
          initialNodeDimensions = {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
          };
          nodeClickedAtMouseDown = node;
          elementClickedAtMouseDown = {
            type: "node",
            id: node.id,
            nodeRef: node,
          };
          _tempWasSelectedAtMouseDown = true;
          didDrag = false;
          canvas.style.cursor = handle.cursor;
          return;
        }
      }
    }
  }

  const potentialConnectionClickedGeneral = !potentialNodeClickedGeneral
    ? findConnectionNear(mousePos.x, mousePos.y)
    : null;

  if (potentialNodeClickedGeneral) {
    elementClickedAtMouseDown = {
      type: "node",
      id: potentialNodeClickedGeneral.id,
      nodeRef: potentialNodeClickedGeneral,
    };
    _tempWasSelectedAtMouseDown = isElementSelected(
      "node",
      potentialNodeClickedGeneral.id,
    );
  } else if (potentialConnectionClickedGeneral) {
    elementClickedAtMouseDown = {
      type: "connection",
      id: potentialConnectionClickedGeneral.id,
      connRef: potentialConnectionClickedGeneral,
    };
    _tempWasSelectedAtMouseDown = isElementSelected(
      "connection",
      potentialConnectionClickedGeneral.id,
    );
  }
  nodeClickedAtMouseDown = potentialNodeClickedGeneral;
  connectionClickedAtMouseDown = potentialConnectionClickedGeneral;

  if (nodeClickedAtMouseDown) {
  }

  if (
    potentialNodeClickedGeneral &&
    (potentialNodeClickedGeneral.type === "pulsar_rocket" ||
      potentialNodeClickedGeneral.type === "pulsar_ufo") &&
    isElementSelected("node", potentialNodeClickedGeneral.id) &&
    currentTool === "edit"
  ) {
    const outerR =
      NODE_RADIUS_BASE *
      potentialNodeClickedGeneral.size *
      (1 + potentialNodeClickedGeneral.animationState * 0.5);
    const handleOrbitRadius = outerR * 1.6;
    const handleGripRadius = 7 / viewScale;
    const drawingAngleRad =
      (potentialNodeClickedGeneral.audioParams.rocketDirectionAngle || 0) -
      Math.PI / 2;
    const handleDisplayAngleRad = drawingAngleRad + Math.PI / 4;
    const handleGripX_world =
      potentialNodeClickedGeneral.x +
      Math.cos(handleDisplayAngleRad) * handleOrbitRadius;
    const handleGripY_world =
      potentialNodeClickedGeneral.y +
      Math.sin(handleDisplayAngleRad) * handleOrbitRadius;
    const distToHandle = distance(
      mousePos.x,
      mousePos.y,
      handleGripX_world,
      handleGripY_world,
    );

    if (distToHandle < handleGripRadius) {
      isRotatingRocket = potentialNodeClickedGeneral;
      isDragging = false;
      const initialMouseAngleToNodeCenterRad = Math.atan2(
        mousePos.y - isRotatingRocket.y,
        mousePos.x - isRotatingRocket.x,
      );
      rotationStartDetails = {
        screenX: screenMousePos.x,
        screenY: screenMousePos.y,
        initialNodeUIAngleRad:
          isRotatingRocket.audioParams.rocketDirectionAngle || 0,
        initialMouseMathAngleRad: initialMouseAngleToNodeCenterRad,
      };
      canvas.style.cursor = "grabbing";
      nodeClickedAtMouseDown = null;
      elementClickedAtMouseDown = null;
      connectionClickedAtMouseDown = null;
      return;
    }
  }

  let radarHandleNode = null;
  if (
    potentialNodeClickedGeneral &&
    potentialNodeClickedGeneral.type === CRANK_RADAR_TYPE
  ) {
    radarHandleNode = potentialNodeClickedGeneral;
  } else {
    radarHandleNode = findCrankRadarHandleAt(mousePos.x, mousePos.y);
  }

  if (radarHandleNode && currentTool === "edit") {
    const pivotRadius =
      radarHandleNode.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
    const handleLength =
      radarHandleNode.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
    const drawingAngleRad =
      (radarHandleNode.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
    const pivotX_world =
      radarHandleNode.x + Math.cos(drawingAngleRad) * pivotRadius;
    const pivotY_world =
      radarHandleNode.y + Math.sin(drawingAngleRad) * pivotRadius;
    const handleAngleRad = drawingAngleRad + Math.PI / 2;
    const handleGripX_world =
      pivotX_world + Math.cos(handleAngleRad) * handleLength;
    const handleGripY_world =
      pivotY_world + Math.sin(handleAngleRad) * handleLength;
    const pivotRadiusDetect = 6 / viewScale;
    const handleGripRadius = 7 / viewScale;
    const distToGrip = distance(
      mousePos.x,
      mousePos.y,
      handleGripX_world,
      handleGripY_world,
    );
    const distToPivot = distance(mousePos.x, mousePos.y, pivotX_world, pivotY_world);

    if (distToGrip < handleGripRadius || distToPivot < pivotRadiusDetect) {
      if (!isElementSelected("node", radarHandleNode.id)) {
        selectedElements.clear();
        selectedElements.add({ type: "node", id: radarHandleNode.id });
        populateEditPanel();
      }
      isCrankingRadar = radarHandleNode;
      isDragging = false;
      crankStartDetails = {
        previousMouseAngleRad: Math.atan2(
          mousePos.y - radarHandleNode.y,
          mousePos.x - radarHandleNode.x,
        ),
      };
      canvas.style.cursor = "grabbing";
      nodeClickedAtMouseDown = null;
      elementClickedAtMouseDown = null;
      connectionClickedAtMouseDown = null;
      if (!animationFrameId) startAnimationLoop();
      return;
    }
  }

  if (event.button === 1 || (isSpacebarDown && event.button === 0)) {
    isPanning = true;
    panStart = { ...screenMousePos };
    canvas.style.cursor = "grabbing";
    nodeClickedAtMouseDown = null;
    connectionClickedAtMouseDown = null;
    elementClickedAtMouseDown = null;
    isRotatingRocket = null;
    isCrankingRadar = null;
    isResizingTimelineGrid = false;
    return;
  }

  if (isRotatingRocket || isCrankingRadar || isResizingTimelineGrid || isRotatingTimelineGrid) {
    return;
  }

  if (elementClickedAtMouseDown) {
    const element = elementClickedAtMouseDown;
    const node = element.type === "node" ? nodeClickedAtMouseDown : null;

    if (
      event.shiftKey &&
      currentTool === "edit" &&
      node &&
      node.type !== TIMELINE_GRID_TYPE &&
      node.type !== GRID_SEQUENCER_TYPE &&
      node.type !== SPACERADAR_TYPE &&
      node.type !== CRANK_RADAR_TYPE
    ) {
      isResizing = true;
      resizeStartSize = node.size;
      resizeStartY = screenMousePos.y;
      canvas.style.cursor = "ns-resize";
    } else if ((event.shiftKey || ctrlLike) && currentTool !== "edit") {
      if (isElementSelected(element.type, element.id)) {
        selectedElements = new Set(
          [...selectedElements].filter(
            (el) => !(el.type === element.type && el.id === element.id),
          ),
        );
      } else {
        selectedElements.add({ type: element.type, id: element.id });
      }
      if (currentTool === "edit") updateConstellationGroup();
      updateGroupControlsUI();
      populateEditPanel();

      nodeClickedAtMouseDown = null;
      connectionClickedAtMouseDown = null;
      elementClickedAtMouseDown = null;
    } else {
      if (
        currentTool === "connect" ||
        currentTool === "connect_string" ||
        currentTool === "connect_glide" ||
        currentTool === "connect_rope" ||
        currentTool === "connect_wavetrail" ||
        currentTool === "connect_oneway"
      ) {
        if (
          node &&
          !["nebula", PORTAL_NEBULA_TYPE, TIMELINE_GRID_TYPE, SPACERADAR_TYPE, CRANK_RADAR_TYPE].includes(
            node.type,
          )
        ) {
          isConnecting = true;
          connectingNode = node;
          if (currentTool === "connect_string")
            connectionTypeToAdd = "string_violin";
          else if (currentTool === "connect_glide")
            connectionTypeToAdd = "glide";
          else if (currentTool === "connect_rope")
            connectionTypeToAdd = "rope";
          else if (currentTool === "connect_wavetrail")
            connectionTypeToAdd = "wavetrail";
          else if (currentTool === "connect_oneway")
            connectionTypeToAdd = ONE_WAY_TYPE;
          else connectionTypeToAdd = "standard";
          canvas.style.cursor = "grabbing";
        }
      } else if (currentTool === "delete" || currentTool === "eraser") {
        if (node) removeNode(node);
        else if (connectionClickedAtMouseDown)
          removeConnection(connectionClickedAtMouseDown);
        nodeClickedAtMouseDown = null;
        connectionClickedAtMouseDown = null;
        elementClickedAtMouseDown = null;
      } else if (currentTool === "edit") {
        let selectionChanged = false;
        if (!isElementSelected(element.type, element.id)) {
          selectedElements.forEach((selEl) => {
            if (selEl.type === "node") {
              const n = findNodeById(selEl.id);
              if (n && n.type === TIMELINE_GRID_TYPE) n.isInResizeMode = false;
            }
          });
          selectedElements.clear();
          selectedElements.add({ type: element.type, id: element.id });
          selectionChanged = true;
        }
        if (node) {
          isDragging = true;
          dragStartPos = { ...mousePos };
          nodeDragOffsets.clear();
          selectedElements.forEach((el) => {
            if (el.type === "node") {
              const n = findNodeById(el.id);
              if (n)
                nodeDragOffsets.set(el.id, {
                  x: n.x - mousePos.x,
                  y: n.y - mousePos.y,
                });
            }
          });
          canvas.style.cursor = "move";
        }
        if (selectionChanged) {
          updateConstellationGroup();
          populateEditPanel();
        }
      }
    }
  } else {
    if (currentTool === "edit") {
      isSelecting = true;
      selectionRect = {
        startX: mousePos.x,
        startY: mousePos.y,
        endX: mousePos.x,
        endY: mousePos.y,
        active: false,
      };
      if (!(event.shiftKey || ctrlLike)) {
        if (selectedElements.size > 0) {
          selectedElements.forEach((selEl) => {
            if (selEl.type === "node") {
              const n = findNodeById(selEl.id);
              if (n && n.type === TIMELINE_GRID_TYPE) n.isInResizeMode = false;
            }
          });
          selectedElements.clear();
          updateConstellationGroup();
          populateEditPanel();
        }
      }
    } else if (
      currentTool === "add" &&
      nodeTypeToAdd !== null &&
      nodeTypeToAdd !== TIMELINE_GRID_TYPE
    ) {
      if (!(event.shiftKey || ctrlLike) && selectedElements.size > 0) {
        selectedElements.clear();
        updateConstellationGroup();
        populateEditPanel();
      }
    } else if (
      ![
        "connect",
        "connect_string",
        "connect_glide",
        "connect_wavetrail",
        "delete",
      ].includes(currentTool) &&
      !(currentTool === "add" && nodeTypeToAdd === TIMELINE_GRID_TYPE)
    ) {
      if (selectedElements.size > 0 && !(event.shiftKey || ctrlLike)) {
        selectedElements.forEach((selEl) => {
          if (selEl.type === "node") {
            const n = findNodeById(selEl.id);
            if (n && n.type === TIMELINE_GRID_TYPE) n.isInResizeMode = false;
          }
        });
        selectedElements.clear();
        updateGroupControlsUI();
        populateEditPanel();
      }
    }
  }
  hideOverlappingPanels();
}

function handleMouseMove(event) {
  if (!isAudioReady) return;
  updateMousePos(event);

  const effectiveGlobalSnap = isSnapEnabled && !event.shiftKey;

  if (currentTool === "wand") {
    const n = findNodeAt(mousePos.x, mousePos.y);
    const nowTime = audioContext
      ? audioContext.currentTime
      : performance.now() / 1000;
    if (n && isPlayableNode(n)) {
      if (
        nowTime - wandLastTriggerTime > WAND_TRIGGER_COOLDOWN ||
        wandHoveredNodeId !== n.id
      ) {
        wandLastTriggerTime = nowTime;
        wandHoveredNodeId = n.id;
        currentGlobalPulseId++;
        propagateTrigger(n, 0, currentGlobalPulseId, -1, Infinity, {
          type: "trigger",
          data: { intensity: 1.0 },
        });
      }
    } else {
      wandHoveredNodeId = null;
    }
    canvas.style.cursor = "crosshair";
    return;
  }

  if (isRotatingTimelineGrid && rotatingTimelineGridNode) {
    const dx = mousePos.x - rotatingTimelineGridNode.x;
    const dy = mousePos.y - rotatingTimelineGridNode.y;
    const currentAngle = Math.atan2(dy, dx);
    let angleChange = currentAngle - rotationTimelineGridStartAngle;
    rotatingTimelineGridNode.audioParams.rotation =
      initialTimelineGridRotation + angleChange;
    rotatingTimelineGridNode.rotation =
      rotatingTimelineGridNode.audioParams.rotation;
    didDrag = true;
    canvas.style.cursor = "grabbing";
    return;
  }

  if (isDrawingNewTimelineGrid && currentlyPlacingTimelineNodeId !== null) {
    didDrag = true;
    const node = findNodeById(currentlyPlacingTimelineNodeId);
    if (node && node.type === TIMELINE_GRID_TYPE) {
      let startX = newTimelineGridInitialCorner.x;
      let startY = newTimelineGridInitialCorner.y;

      let currentX = mousePos.x;
      let currentY = mousePos.y;

      if (effectiveGlobalSnap) {
        const snappedCurrentPos = snapToGrid(currentX, currentY);
        currentX = snappedCurrentPos.x;
        currentY = snappedCurrentPos.y;
      }

      const newWidth = Math.abs(currentX - startX);
      const newHeight = Math.abs(currentY - startY);
      const newCenterX = Math.min(startX, currentX) + newWidth / 2;
      const newCenterY = Math.min(startY, currentY) + newHeight / 2;

      node.x = newCenterX;
      node.y = newCenterY;
      node.width = Math.max(10, newWidth);
      node.height = Math.max(10, newHeight);

      if (node.audioParams) {
        node.audioParams.width = node.width;
        node.audioParams.height = node.height;
      }
    }
    canvas.style.cursor = "crosshair";
    return;
  }

  if (isRotatingRocket) {
    const dx = mousePos.x - isRotatingRocket.x;
    const dy = mousePos.y - isRotatingRocket.y;
    const currentMouseMathAngleRad = Math.atan2(dy, dx);

    let angleDiffRad =
      currentMouseMathAngleRad - rotationStartDetails.initialMouseMathAngleRad;
    let newUIAngleRad =
      rotationStartDetails.initialNodeUIAngleRad + angleDiffRad;

    newUIAngleRad =
      ((newUIAngleRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    isRotatingRocket.audioParams.rocketDirectionAngle = newUIAngleRad;

    if (
      !hamburgerMenuPanel.classList.contains("hidden") &&
      selectedElements.has({
        type: "node",
        id: isRotatingRocket.id,
      })
    ) {
      populateEditPanel();
    }
    didDrag = true;
    canvas.style.cursor = "grabbing";
    return;
  }

  if (isCrankingRadar) {
    const dx = mousePos.x - isCrankingRadar.x;
    const dy = mousePos.y - isCrankingRadar.y;
    const currentMouseAngleRad = Math.atan2(dy, dx);
    let delta = currentMouseAngleRad - crankStartDetails.previousMouseAngleRad;
    delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
    isCrankingRadar.manualAdvanceIncrement =
      (isCrankingRadar.manualAdvanceIncrement || 0) + delta;
    crankStartDetails.previousMouseAngleRad = currentMouseAngleRad;
    didDrag = true;
    canvas.style.cursor = "grabbing";
    if (!animationFrameId) startAnimationLoop();
    return;
  }

  const dragThreshold = 7;
  if (
    !didDrag &&
    (isDragging ||
      isResizing ||
      isConnecting ||
      isSelecting ||
      isPanning ||
      isResizingTimelineGrid) &&
    distance(
      screenMousePos.x,
      screenMousePos.y,
      mouseDownPos.x * viewScale + viewOffsetX,
      mouseDownPos.y * viewScale + viewOffsetY,
    ) > dragThreshold
  ) {
    didDrag = true;
    if (isSelecting) {
      selectionRect.active = true;
    }
  }

  if (isPanning) {
    const dx = screenMousePos.x - panStart.x;
    const dy = screenMousePos.y - panStart.y;
    viewOffsetX += dx;
    viewOffsetY += dy;
    panStart = { ...screenMousePos };
    canvas.style.cursor = "grabbing";
  } else if (isResizingTimelineGrid && resizingTimelineGridNode && didDrag) {
    const dx = mousePos.x - resizeStartMousePos.x;
    const dy = mousePos.y - resizeStartMousePos.y;
    let newX = initialNodeDimensions.x;
    let newY = initialNodeDimensions.y;
    let newWidth = initialNodeDimensions.width;
    let newHeight = initialNodeDimensions.height;
    const minDim = 20;

    let finalLeft = initialNodeDimensions.x - initialNodeDimensions.width / 2;
    let finalRight = initialNodeDimensions.x + initialNodeDimensions.width / 2;
    let finalTop = initialNodeDimensions.y - initialNodeDimensions.height / 2;
    let finalBottom =
      initialNodeDimensions.y + initialNodeDimensions.height / 2;

    const initialLeft =
      initialNodeDimensions.x - initialNodeDimensions.width / 2;
    const initialRight =
      initialNodeDimensions.x + initialNodeDimensions.width / 2;
    const initialTop =
      initialNodeDimensions.y - initialNodeDimensions.height / 2;
    const initialBottom =
      initialNodeDimensions.y + initialNodeDimensions.height / 2;

    let currentResizeMouseX = mousePos.x;
    let currentResizeMouseY = mousePos.y;

    if (effectiveGlobalSnap) {
      const snappedResizeMouse = snapToGrid(mousePos.x, mousePos.y);
      currentResizeMouseX = snappedResizeMouse.x;
      currentResizeMouseY = snappedResizeMouse.y;
    }
    const snappedDx =
      currentResizeMouseX -
      (effectiveGlobalSnap
        ? snapToGrid(resizeStartMousePos.x, resizeStartMousePos.y).x
        : resizeStartMousePos.x);
    const snappedDy =
      currentResizeMouseY -
      (effectiveGlobalSnap
        ? snapToGrid(resizeStartMousePos.x, resizeStartMousePos.y).y
        : resizeStartMousePos.y);

    if (resizeHandleType.includes("left")) {
      let targetLeft = initialLeft + snappedDx;
      finalLeft = Math.min(initialRight - minDim, targetLeft);
    }
    if (resizeHandleType.includes("right")) {
      let targetRight = initialRight + snappedDx;
      finalRight = Math.max(initialLeft + minDim, targetRight);
    }
    if (resizeHandleType.includes("top")) {
      let targetTop = initialTop + snappedDy;
      finalTop = Math.min(initialBottom - minDim, targetTop);
    }
    if (resizeHandleType.includes("bottom")) {
      let targetBottom = initialBottom + snappedDy;
      finalBottom = Math.max(initialTop + minDim, targetBottom);
    }

    newWidth = Math.max(minDim, finalRight - finalLeft);
    newHeight = Math.max(minDim, finalBottom - finalTop);

    if (effectiveGlobalSnap) {
      const spacing = calculateGridSpacing();
      newWidth = Math.max(spacing, Math.round(newWidth / spacing) * spacing);
      newHeight = Math.max(spacing, Math.round(newHeight / spacing) * spacing);
    }

    if (resizeHandleType.includes("left")) finalLeft = finalRight - newWidth;
    else if (!resizeHandleType.includes("right"))
      finalRight = finalLeft + newWidth;

    if (resizeHandleType.includes("top")) finalTop = finalBottom - newHeight;
    else if (!resizeHandleType.includes("bottom"))
      finalBottom = finalTop + newHeight;

    newX = finalLeft + newWidth / 2;
    newY = finalTop + newHeight / 2;

    resizingTimelineGridNode.x = newX;
    resizingTimelineGridNode.y = newY;
    resizingTimelineGridNode.width = newWidth;
    resizingTimelineGridNode.height = newHeight;

    if (resizingTimelineGridNode.audioParams) {
      resizingTimelineGridNode.audioParams.width = newWidth;
      resizingTimelineGridNode.audioParams.height = newHeight;
    }
    populateEditPanel();

    const handles = [
      { x: 0, y: 0, type: "top-left", cursor: "nwse-resize" },
      { x: 0, y: 0, type: "top", cursor: "ns-resize" },
      { x: 0, y: 0, type: "top-right", cursor: "nesw-resize" },
      { x: 0, y: 0, type: "left", cursor: "ew-resize" },
      { x: 0, y: 0, type: "right", cursor: "ew-resize" },
      { x: 0, y: 0, type: "bottom-left", cursor: "nesw-resize" },
      { x: 0, y: 0, type: "bottom", cursor: "ns-resize" },
      { x: 0, y: 0, type: "bottom-right", cursor: "nwse-resize" },
    ];
    if (canvas.style.cursor !== resizeHandleType)
      canvas.style.cursor =
        handles.find((h) => h.type === resizeHandleType)?.cursor || "grabbing";

    return;
  } else if (isResizing && nodeClickedAtMouseDown) {
    const dy_screen = screenMousePos.y - resizeStartY;
    const scaleFactor = 1 + dy_screen / 100;
    const targetNode = findNodeById(nodeClickedAtMouseDown.id);
    if (targetNode && targetNode.type !== TIMELINE_GRID_TYPE) {
      targetNode.size = Math.max(
        MIN_NODE_SIZE,
        Math.min(MAX_NODE_SIZE, resizeStartSize * scaleFactor),
      );
      updateNodeAudioParams(targetNode);
    }
    canvas.style.cursor = "ns-resize";
  } else if (isConnecting) {
    canvas.style.cursor = "grabbing";
  } else if (isSelecting && didDrag) {
    selectionRect.endX = mousePos.x;
    selectionRect.endY = mousePos.y;
    canvas.style.cursor = "crosshair";
  } else if (isDragging && didDrag) {
    const dx_world = mousePos.x - dragStartPos.x;
    const dy_world = mousePos.y - dragStartPos.y;

    selectedElements.forEach((el) => {
      if (el.type === "node") {
        const n = findNodeById(el.id);
        const offset = nodeDragOffsets.get(el.id);
        if (n && offset) {
          let targetX = dragStartPos.x + offset.x + dx_world;
          let targetY = dragStartPos.y + offset.y + dy_world;

          let snappedToAnInternalGrid = false;
          if (n.type !== TIMELINE_GRID_TYPE && n.type !== SPACERADAR_TYPE && n.type !== CRANK_RADAR_TYPE) {
            for (const timelineGridNode of nodes) {
              if (
                timelineGridNode.type === TIMELINE_GRID_TYPE &&
                timelineGridNode.snapToInternalGrid &&
                timelineGridNode.internalGridDivisions > 1
              ) {
                const distToTimelineCenter = distance(
                  targetX,
                  targetY,
                  timelineGridNode.x,
                  timelineGridNode.y,
                );
                const maxDist =
                  Math.max(timelineGridNode.width, timelineGridNode.height) /
                    2 +
                  n.radius;

                if (distToTimelineCenter < maxDist) {
                  const translatedNodeX = targetX - timelineGridNode.x;
                  const translatedNodeY = targetY - timelineGridNode.y;
                  const cosNegTheta = Math.cos(
                    -(timelineGridNode.audioParams?.rotation || 0),
                  );
                  const sinNegTheta = Math.sin(
                    -(timelineGridNode.audioParams?.rotation || 0),
                  );
                  const localNodeX =
                    translatedNodeX * cosNegTheta -
                    translatedNodeY * sinNegTheta;
                  const localNodeY =
                    translatedNodeX * sinNegTheta +
                    translatedNodeY * cosNegTheta;

                  if (
                    Math.abs(localNodeX) <= timelineGridNode.width / 2 &&
                    Math.abs(localNodeY) <= timelineGridNode.height / 2
                  ) {
                    const internalSnapPos = snapToInternalGrid(
                      { x: targetX, y: targetY },
                      timelineGridNode,
                    );
                    targetX = internalSnapPos.x;
                    targetY = internalSnapPos.y;
                    snappedToAnInternalGrid = true;
                    break;
                  }
                }
              }
            }
            if (!snappedToAnInternalGrid) {
              for (const radarNode of nodes) {
                if (
                  (radarNode.type === SPACERADAR_TYPE || radarNode.type === CRANK_RADAR_TYPE) &&
                  radarNode.snapToInternalGrid &&
                  radarNode.internalGridDivisions > 1
                ) {
                  const distToRadarCenter = distance(
                    targetX,
                    targetY,
                    radarNode.x,
                    radarNode.y,
                  );
                  if (distToRadarCenter <= radarNode.radius) {
                    const snapPos = snapToSpaceRadarInternalGrid(
                      { x: targetX, y: targetY },
                      radarNode,
                    );
                    targetX = snapPos.x;
                    targetY = snapPos.y;
                    snappedToAnInternalGrid = true;
                    break;
                  }
                }
              }
            }
          }

          if (!snappedToAnInternalGrid && effectiveGlobalSnap) {
            const globalSnapped = snapToGrid(targetX, targetY);
            targetX = globalSnapped.x;
            targetY = globalSnapped.y;
          }
          n.x = targetX;
          n.y = targetY;
        }
      }
    });
    connections.forEach((conn) => {
      const nodeASelected = isElementSelected("node", conn.nodeAId);
      const nodeBSelected = isElementSelected("node", conn.nodeBId);
      if (nodeASelected || nodeBSelected) {
        const nA = findNodeById(conn.nodeAId);
        const nB = findNodeById(conn.nodeBId);
        if (nA && nB) {
          const pA = getConnectionPoint(nA, conn.nodeAHandle);
          const pB = getConnectionPoint(nB, conn.nodeBHandle);
          conn.length = distance(pA.x, pA.y, pB.x, pB.y);
        }
      }
    });
    updateMistWetness();
    updateCrushWetness();
    canvas.style.cursor = "move";
  } else {
    let cursorSetByHandle = false;
    if (
      !isPanning &&
      !isConnecting &&
      !isDragging &&
      !isRotatingRocket &&
      !isResizingTimelineGrid &&
      !isDrawingNewTimelineGrid &&
      currentTool === "edit"
    ) {
      const selectedTimelineGrids = Array.from(selectedElements)
        .map((sel) => findNodeById(sel.id))
        .filter((n) => n && n.type === TIMELINE_GRID_TYPE);

      if (selectedTimelineGrids.length > 0) {
        const node = selectedTimelineGrids[0];
        if (node.isInResizeMode) {
          const handleDetectionPixelMargin = 12;
          const handleHitAreaWorld = handleDetectionPixelMargin / viewScale;
          const hArea = handleHitAreaWorld / 2;

          const nodeRectX = node.x - node.width / 2;
          const nodeRectY = node.y - node.height / 2;
          const nodeCX = node.x;
          const nodeCY = node.y;
          const nodeRXW = node.x + node.width / 2;
          const nodeRYH = node.y + node.height / 2;

          const handlesInfo = [
            {
              x: nodeRectX,
              y: nodeRectY,
              cursor: "nwse-resize",
              type: "top-left",
            },
            { x: nodeCX, y: nodeRectY, cursor: "ns-resize", type: "top" },
            {
              x: nodeRXW,
              y: nodeRectY,
              cursor: "nesw-resize",
              type: "top-right",
            },
            { x: nodeRectX, y: nodeCY, cursor: "ew-resize", type: "left" },
            { x: nodeRXW, y: nodeCY, cursor: "ew-resize", type: "right" },
            {
              x: nodeRectX,
              y: nodeRYH,
              cursor: "nesw-resize",
              type: "bottom-left",
            },
            { x: nodeCX, y: nodeRYH, cursor: "ns-resize", type: "bottom" },
            {
              x: nodeRXW,
              y: nodeRYH,
              cursor: "nwse-resize",
              type: "bottom-right",
            },
          ];

          for (const handle of handlesInfo) {
            let checkX = handle.x;
            let checkY = handle.y;
            const gridRotation = node.audioParams?.rotation || 0;

            if (gridRotation !== 0) {
              const translatedHandleX = handle.x - node.x;
              const translatedHandleY = handle.y - node.y;
              const cosTheta = Math.cos(gridRotation);
              const sinTheta = Math.sin(gridRotation);
              checkX =
                translatedHandleX * cosTheta -
                translatedHandleY * sinTheta +
                node.x;
              checkY =
                translatedHandleX * sinTheta +
                translatedHandleY * cosTheta +
                node.y;
            }

            if (
              mousePos.x >= checkX - hArea &&
              mousePos.x <= checkX + hArea &&
              mousePos.y >= checkY - hArea &&
              mousePos.y <= checkY + hArea
            ) {
              canvas.style.cursor = handle.cursor;
              cursorSetByHandle = true;
              break;
            }
          }
        }
      }
    }

    if (!cursorSetByHandle && !isDrawingNewTimelineGrid) {
      const hN = findNodeAt(mousePos.x, mousePos.y);
      const hC = !hN ? findConnectionNear(mousePos.x, mousePos.y) : null;
      if (
        currentTool === "edit" &&
        event.altKey &&
        hN &&
        (hN.type === "sound" ||
          hN.type === "nebula" ||
          hN.type === "pitchShift" ||
          hN.type === PRORB_TYPE)
      ) {
        canvas.style.cursor = "pointer";
      } else if (
        currentTool === "edit" &&
        event.altKey &&
        hC &&
        hC.type === "string_violin"
      ) {
        canvas.style.cursor = "pointer";
      } else if (
        currentTool === "edit" &&
        event.shiftKey &&
        hN &&
        hN.type !== "pulsar_rocket" &&
        hN.type !== "pulsar_ufo" &&
        hN.type !== TIMELINE_GRID_TYPE
      ) {
        canvas.style.cursor = "ns-resize";
      } else if (
        currentTool === "edit" &&
        hN &&
        (hN.type === "pulsar_rocket" || hN.type === "pulsar_ufo") &&
        isElementSelected("node", hN.id)
      ) {
        const outerR =
          NODE_RADIUS_BASE * hN.size * (1 + hN.animationState * 0.5);
        const handleOrbitRadius = outerR * 1.6;
        const handleGripRadiusView = 7 / viewScale;
        const drawingAngleRad =
          (hN.audioParams.rocketDirectionAngle || 0) - Math.PI / 2;
        const handleDisplayAngleRad = drawingAngleRad + Math.PI / 4;
        const handleGripX_world =
          hN.x + Math.cos(handleDisplayAngleRad) * handleOrbitRadius;
        const handleGripY_world =
          hN.y + Math.sin(handleDisplayAngleRad) * handleOrbitRadius;
        const distToHandle = distance(
          mousePos.x,
          mousePos.y,
          handleGripX_world,
          handleGripY_world,
        );
        if (distToHandle < handleGripRadiusView * viewScale) {
          canvas.style.cursor = "grab";
        } else {
          canvas.style.cursor = "move";
        }
      } else if (
        currentTool === "edit" &&
        ((hN &&
          hN.type === CRANK_RADAR_TYPE &&
          isElementSelected("node", hN.id)) ||
          (!hN &&
            (() => {
              const hn = findCrankRadarHandleAt(mousePos.x, mousePos.y);
              return hn && isElementSelected("node", hn.id);
            })()))
      ) {
        const target = hN || findCrankRadarHandleAt(mousePos.x, mousePos.y);
        const pivotRadius =
          target.radius * CRANK_RADAR_PIVOT_OFFSET_FACTOR;
        const handleLength =
          target.radius * CRANK_RADAR_HANDLE_LENGTH_FACTOR;
        const drawingAngleRad =
          (target.scanAngle || 0) + SPACERADAR_ANGLE_OFFSET;
        const pivotX = target.x + Math.cos(drawingAngleRad) * pivotRadius;
        const pivotY = target.y + Math.sin(drawingAngleRad) * pivotRadius;
        const handleAngleRad = drawingAngleRad + Math.PI / 2;
        const gripX = pivotX + Math.cos(handleAngleRad) * handleLength;
        const gripY = pivotY + Math.sin(handleAngleRad) * handleLength;
        const pivotDetectR = 6 / viewScale;
        const distToGrip = distance(
          mousePos.x,
          mousePos.y,
          gripX,
          gripY,
        );
        const distToPivot = distance(mousePos.x, mousePos.y, pivotX, pivotY);
        if (
          distToGrip < (7 / viewScale) * viewScale ||
          distToPivot < pivotDetectR * viewScale
        ) {
          canvas.style.cursor = "grab";
        } else {
          canvas.style.cursor = "move";
        }
      } else if (
        (currentTool === "connect" ||
          currentTool === "connect_string" ||
          currentTool === "connect_glide" ||
          currentTool === "connect_wavetrail" ||
          currentTool === "connect_oneway") &&
        hN &&
        !["nebula", PORTAL_NEBULA_TYPE, TIMELINE_GRID_TYPE, SPACERADAR_TYPE, CRANK_RADAR_TYPE].includes(hN.type)
      ) {
        canvas.style.cursor = "grab";
      } else if ((currentTool === "delete" || currentTool === "eraser") && (hN || hC)) {
        canvas.style.cursor = "pointer";
      } else if (currentTool === "edit" && (hN || hC)) {
        canvas.style.cursor = "move";
      } else if (currentTool === "add" || currentTool === "brush") {
        canvas.style.cursor = "copy";
      } else {
        canvas.style.cursor = "crosshair";
      }
    }
  }
}

function handleMouseUp(event) {
  if (event.button === 2) return;

  if (!isAudioReady) return;
  const targetIsPanelControl =
      hamburgerMenuPanel.contains(event.target) ||
      sideToolbar.contains(event.target) ||
      transportControlsDiv.contains(event.target) ||
      mixerPanel.contains(event.target);

  if (targetIsPanelControl) {
      isDragging = false;
      isConnecting = false;
      isResizing = false;
      isSelecting = false;
      isPanning = false;
      isRotatingRocket = null;
      isCrankingRadar = null;
      isResizingTimelineGrid = false;
      isDrawingNewTimelineGrid = false;
      selectionRect.active = false;
      connectingNode = null;
      nodeClickedAtMouseDown = null;
      connectionClickedAtMouseDown = null;
      currentlyPlacingTimelineNodeId = null;
      newTimelineGridInitialCorner = null;
      canvas.style.cursor = "crosshair";
      return;
  }

  updateMousePos(event);
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const ctrlLike = (isMac ? event.metaKey : event.ctrlKey) || ctrlLikeAtMouseDown;
  let stateWasChanged = false;
  let actionHandledInMainBlock = false;

  const wasSelectedAtStart = _tempWasSelectedAtMouseDown;
  _tempWasSelectedAtMouseDown = false;

  const wasResizingNode = isResizing;
  const wasConnectingNodes = isConnecting;
  const wasDraggingNode = isDragging;
  const wasCreatingSelectionRect = isSelecting && didDrag;
  const wasPanningView = isPanning;
  const wasRotatingARocketNode = isRotatingRocket;
  const wasCrankingRadar = isCrankingRadar;
  const wasResizingTimeline = isResizingTimelineGrid;
  const wasDrawingNewTimeline = isDrawingNewTimelineGrid;

  const wasRotatingTimelineGridObject = isRotatingTimelineGrid;
  const rotatedTimelineGridNodeObject = rotatingTimelineGridNode;

  isResizing = false;
  isConnecting = false;
  isDragging = false;
  isSelecting = false;
  isPanning = false;
  isRotatingRocket = null;
  isCrankingRadar = null;
  isResizingTimelineGrid = false;
  selectionRect.active = false;
  canvas.style.cursor = "crosshair";

  isRotatingTimelineGrid = false;
  rotatingTimelineGridNode = null;

  const nodeClickedStart = nodeClickedAtMouseDown;
  const connectionClickedStart = connectionClickedAtMouseDown;
  const elementClickedStartOriginal = nodeClickedStart ?
      { type: "node", id: nodeClickedStart.id, nodeRef: nodeClickedStart } :
      connectionClickedStart ?
      {
          type: "connection",
          id: connectionClickedStart.id,
          connRef: connectionClickedStart,
      } :
      null;

  let nodeUnderCursorOnUp = findNodeAt(mousePos.x, mousePos.y);
  let connectToCrankHandle = false;
  const handleCandidate = findCrankRadarHandleAt(mousePos.x, mousePos.y);
  if (handleCandidate && (!nodeUnderCursorOnUp || handleCandidate.id === nodeUnderCursorOnUp.id)) {
      nodeUnderCursorOnUp = handleCandidate;
      connectToCrankHandle = true;
  }
  const connectionUnderCursorOnUp = !nodeUnderCursorOnUp ?
      findConnectionNear(mousePos.x, mousePos.y) :
      null;
  let elementUnderCursorAtUp = null;
  if (nodeUnderCursorOnUp)
      elementUnderCursorAtUp = {
          type: "node",
          id: nodeUnderCursorOnUp.id,
          nodeRef: nodeUnderCursorOnUp,
      };
  else if (connectionUnderCursorOnUp)
      elementUnderCursorAtUp = {
          type: "connection",
          id: connectionUnderCursorOnUp.id,
          connRef: connectionUnderCursorOnUp,
      };

  if (wasRotatingTimelineGridObject) {
      actionHandledInMainBlock = true;
      if (didDrag && rotatedTimelineGridNodeObject) {
          rotatedTimelineGridNodeObject.rotation =
              rotatedTimelineGridNodeObject.audioParams.rotation;
          stateWasChanged = true;
      }
  } else if (wasDrawingNewTimeline) {
      actionHandledInMainBlock = true;
      const node = findNodeById(currentlyPlacingTimelineNodeId);
      if (node && node.type === TIMELINE_GRID_TYPE) {
          let startX = newTimelineGridInitialCorner.x;
          let startY = newTimelineGridInitialCorner.y;

          let currentX = mousePos.x;
          let currentY = mousePos.y;

          let finalWidth, finalHeight, finalLeft, finalTop;
          const effectiveSnapOnDrawEnd =
              isSnapEnabled && !(event && event.shiftKey);

          if (effectiveSnapOnDrawEnd) {
              const spacing = calculateGridSpacing();
              const snappedCurrentPos = snapToGrid(currentX, currentY);
              currentX = snappedCurrentPos.x;
              currentY = snappedCurrentPos.y;

              finalWidth = Math.abs(currentX - startX);
              finalHeight = Math.abs(currentY - startY);

              finalWidth = Math.max(
                  spacing,
                  Math.round(finalWidth / spacing) * spacing,
              );
              finalHeight = Math.max(
                  spacing,
                  Math.round(finalHeight / spacing) * spacing,
              );

              if (currentX < startX) {
                  finalLeft = startX - finalWidth;
              } else {
                  finalLeft = startX;
              }
              if (currentY < startY) {
                  finalTop = startY - finalHeight;
              } else {
                  finalTop = startY;
              }
          } else {
              finalLeft = Math.min(startX, currentX);
              finalTop = Math.min(startY, currentY);
              finalWidth = Math.abs(currentX - startX);
              finalHeight = Math.abs(currentY - startY);
          }

          finalWidth = Math.max(20, finalWidth);
          finalHeight = Math.max(20, finalHeight);

          node.x = finalLeft + finalWidth / 2;
          node.y = finalTop + finalHeight / 2;
          node.width = finalWidth;
          node.height = finalHeight;
          node.isInResizeMode = true;
          node.rotation = 0;

          if (node.audioParams) {
              node.audioParams.width = node.width;
              node.audioParams.height = node.height;
              node.audioParams.isInResizeMode = node.isInResizeMode;
              node.audioParams.rotation = 0;
          }

          selectedElements.clear();
          selectedElements.add({ type: "node", id: node.id });
          populateEditPanel();
          stateWasChanged = true;
      }
      isDrawingNewTimelineGrid = false;
      newTimelineGridInitialCorner = null;
      currentlyPlacingTimelineNodeId = null;

      const addTimelineGridBtn = document.getElementById("addTimelineGridBtn");
      if (addTimelineGridBtn && addTimelineGridBtn.classList.contains("active")) {
          addTimelineGridBtn.classList.remove("active");
      }
  } else if (wasRotatingARocketNode) {
      actionHandledInMainBlock = true;
      stateWasChanged = true;
  } else if (wasCrankingRadar) {
      actionHandledInMainBlock = true;
      stateWasChanged = true;
  } else if (wasResizingTimeline) {
      actionHandledInMainBlock = true;
      if (resizingTimelineGridNode) {
          resizingTimelineGridNode.isInResizeMode = true;
          if (resizingTimelineGridNode.audioParams)
              resizingTimelineGridNode.audioParams.isInResizeMode = true;
      }
      resizingTimelineGridNode = null;
      resizeHandleType = null;
      stateWasChanged = true;
  } else if (wasConnectingNodes) {
      actionHandledInMainBlock = true;
      if (
          connectingNode &&
          nodeUnderCursorOnUp &&
          nodeUnderCursorOnUp !== connectingNode &&
          (!["nebula", PORTAL_NEBULA_TYPE, TIMELINE_GRID_TYPE, SPACERADAR_TYPE, CRANK_RADAR_TYPE].includes(
              nodeUnderCursorOnUp.type,
          ) || connectToCrankHandle)
      ) {
          connectNodes(connectingNode, nodeUnderCursorOnUp, connectionTypeToAdd, { nodeBHandle: connectToCrankHandle });
          stateWasChanged = true;
      }
      connectingNode = null;
  } else if (wasResizingNode) {
      actionHandledInMainBlock = true;
      stateWasChanged = true;
  } else if (wasDraggingNode) {
      actionHandledInMainBlock = true;
      stateWasChanged = true;
      identifyAndRouteAllGroups();
      updateMistWetness();
      updateCrushWetness();
  } else if (wasCreatingSelectionRect) {
      actionHandledInMainBlock = true;
      const selX1 = Math.min(selectionRect.startX, selectionRect.endX);
      const selY1 = Math.min(selectionRect.startY, selectionRect.endY);
      const selX2 = Math.max(selectionRect.startX, selectionRect.endX);
      const selY2 = Math.max(selectionRect.startY, selectionRect.endY);
      if (!(event.shiftKey || ctrlLike)) selectedElements.clear();
      nodes.forEach((n) => {
          if (n.x >= selX1 && n.x <= selX2 && n.y >= selY1 && n.y <= selY2) {
              selectedElements.add({ type: "node", id: n.id });
          }
      });
      connections.forEach((c) => {
          const nA = findNodeById(c.nodeAId);
          const nB = findNodeById(c.nodeBId);
          if (nA && nB) {
              const pA = getConnectionPoint(nA, c.nodeAHandle);
              const pB = getConnectionPoint(nB, c.nodeBHandle);
              const midX = (pA.x + pB.x) / 2 + c.controlPointOffsetX;
              const midY = (pA.y + pB.y) / 2 + c.controlPointOffsetY;
              if (midX >= selX1 && midX <= selX2 && midY >= selY1 && midY <= selY2) {
                  selectedElements.add({ type: "connection", id: c.id });
              }
          }
      });
      stateWasChanged = true;
      updateConstellationGroup();
      populateEditPanel();
  } else if (!didDrag) {
      actionHandledInMainBlock = true;
      if (currentTool === "brush") {
          if (!elementUnderCursorAtUp) {
              let typeToPlace = brushNodeType;
              let subtypeToPlace = brushNodeType === "sound" ? brushWaveform : null;
              if (!isBrushing && brushStartWithPulse) {
                  typeToPlace = "pulsar_standard";
                  subtypeToPlace = null;
              }
              let prevNote = noteIndexToAdd;
              if (brushNoteSequence.length > 0) {
                  noteIndexToAdd = brushNoteSequence[brushNoteSequenceIndex];
                  brushNoteSequenceIndex = (brushNoteSequenceIndex + 1) % brushNoteSequence.length;
              }
              const newNode = addNode(
                  mousePos.x,
                  mousePos.y,
                  typeToPlace,
                  subtypeToPlace,
              );
              noteIndexToAdd = prevNote;
              if (newNode) {
                  stateWasChanged = true;
                  if (isBrushing && lastBrushNode) {
                      connectNodes(lastBrushNode, newNode, "standard");
                  }
                  lastBrushNode = newNode;
                  if (isPulsarType(newNode.type)) {
                      triggerPulsarOnce(newNode);
                  }
                  isBrushing = true;
                  selectedElements.clear();
                  selectedElements.add({ type: "node", id: newNode.id });
                  populateEditPanel();
              }
          } else {
              isBrushing = false;
              lastBrushNode = null;
              brushNoteSequenceIndex = 0;

              if (
                  !isElementSelected(
                      elementUnderCursorAtUp.type,
                      elementUnderCursorAtUp.id,
                  ) ||
                  (selectedElements.size > 1 && !(event.shiftKey || ctrlLike))
              ) {
                  if (!(event.shiftKey || ctrlLike)) {
                      selectedElements.forEach((selEl) => {
                          if (selEl.type === "node") {
                              const n = findNodeById(selEl.id);
                              if (n && n.type === TIMELINE_GRID_TYPE)
                                  n.isInResizeMode = false;
                          }
                      });
                      selectedElements.clear();
                  }
                  selectedElements.add(elementUnderCursorAtUp);
                  if (
                      elementUnderCursorAtUp.type === "node" &&
                      elementUnderCursorAtUp.nodeRef?.type === TIMELINE_GRID_TYPE
                  ) {
                      const nodeRef = elementUnderCursorAtUp.nodeRef;
                      if (nodeRef) {
                          nodeRef.isInResizeMode = true;
                          if (nodeRef.audioParams)
                              nodeRef.audioParams.isInResizeMode = true;
                      }
                  }
                  stateWasChanged = true;
              } else if (
                  (event.shiftKey || ctrlLike) &&
                  isElementSelected(
                      elementUnderCursorAtUp.type,
                      elementUnderCursorAtUp.id,
                  )
              ) {
                  selectedElements = new Set(
                      [...selectedElements].filter(
                          (el) =>
                          !(
                              el.type === elementUnderCursorAtUp.type &&
                              el.id === elementUnderCursorAtUp.id
                          ),
                      ),
                  );
                  stateWasChanged = true;
              }
              if (stateWasChanged) {
                  updateConstellationGroup();
                  populateEditPanel();
              }
          }
      } else if (currentTool === "edit") {
          if (
              elementClickedStartOriginal &&
              elementUnderCursorAtUp &&
              elementClickedStartOriginal.type === elementUnderCursorAtUp.type &&
              elementClickedStartOriginal.id === elementUnderCursorAtUp.id
          ) {
              const targetElement = elementClickedStartOriginal;
              const node = targetElement.type === "node" ? nodeClickedStart : null;
              const connection =
                  targetElement.type === "connection" ? connectionClickedStart : null;
              if (event.button === 0) {
                  if (event.altKey) {
                      if (
                          node &&
                          (node.type === "sound" ||
                              node.type === "nebula" ||
                              node.type === "pitchShift" ||
                              node.type === PRORB_TYPE)
                      ) {
                          handlePitchCycleDown(targetElement);
                          stateWasChanged = true;
                      } else if (connection && connection.type === "string_violin") {
                          handlePitchCycleDown(targetElement);
                          stateWasChanged = true;
                      }
                  } else if (!(event.shiftKey || ctrlLike)) {
                      if (wasSelectedAtStart) {
                          if (node) {
                              if (node.type === "pulsar_manual") triggerManualPulsar(node);
                              else if (
                                  node.isStartNode &&
                                  node.type !== "pulsar_triggerable" &&
                                  node.type !== "pulsar_random_particles" &&
                                  node.type !== "pulsar_rocket" &&
                                  node.type !== "pulsar_ufo"
                              ) {
                                  if (isGlobalSyncEnabled) handleSubdivisionCycle(node);
                                  else handleTapTempo(node);
                                  stateWasChanged = true;
                              } else if (
                                  node.type === "sound" ||
                                  node.type === "nebula" ||
                                  node.type === PRORB_TYPE
                              ) {
                                  handlePitchCycle(targetElement);
                                  stateWasChanged = true;
                              } else if (node.type === "gate") {
                                  handleGateCycle(node);
                                  stateWasChanged = true;
                              } else if (node.type === "probabilityGate") {
                                  handleProbabilityCycle(node);
                                  stateWasChanged = true;
                              } else if (node.type === "pitchShift") {
                                  handlePitchShiftCycle(node);
                                  stateWasChanged = true;
                              } else if (isDrumType(node.type)) triggerNodeEffect(node);
                              else if (node.type === TIMELINE_GRID_TYPE) {
                                  node.isInResizeMode = !node.isInResizeMode;
                                  if (node.audioParams)
                                      node.audioParams.isInResizeMode = node.isInResizeMode;
                                  stateWasChanged = true;
                                  populateEditPanel();
                              }
                          } else if (connection && connection.type === "string_violin") {
                              handlePitchCycle(targetElement);
                              stateWasChanged = true;
                          }
                      } else {
                          if (
                              !isElementSelected(targetElement.type, targetElement.id) ||
                              selectedElements.size > 1
                          ) {
                              selectedElements.clear();
                              selectedElements.add(targetElement);
                              if (node && node.type === TIMELINE_GRID_TYPE) {
                                  node.isInResizeMode = true;
                                  if (node.audioParams) node.audioParams.isInResizeMode = true;
                              } else if (
                                  node &&
                                  node.type !== TIMELINE_GRID_TYPE &&
                                  node.type !== GRID_SEQUENCER_TYPE &&
                                  node.type !== SPACERADAR_TYPE &&
                                  node.type !== CRANK_RADAR_TYPE &&
                                  node.hasOwnProperty("isInResizeMode")
                              )
                                  node.isInResizeMode = false;
                              if (
                                  node &&
                                  node.audioParams &&
                                  node.audioParams.hasOwnProperty("isInResizeMode")
                              )
                                  node.audioParams.isInResizeMode = node.isInResizeMode;

                              updateConstellationGroup();
                              populateEditPanel();
                              stateWasChanged = true;
                          }
                      }
                  }
              }
          } else if (
              !elementClickedStartOriginal &&
              !(event.shiftKey || ctrlLike) &&
              currentTool === "edit"
          ) {
              if (selectedElements.size > 0) {
                  selectedElements.forEach((selEl) => {
                      if (selEl.type === "node") {
                          const n = findNodeById(selEl.id);
                          if (n && n.type === TIMELINE_GRID_TYPE) {
                              n.isInResizeMode = false;
                              if (n.audioParams) n.audioParams.isInResizeMode = false;
                          }
                      }
                  });
                  selectedElements.clear();
                  updateConstellationGroup();
                  populateEditPanel();
                  stateWasChanged = true;
              }
          }
      } else if (
          currentTool === "add" &&
          nodeTypeToAdd !== TIMELINE_GRID_TYPE &&
          !didDrag
      ) {
          actionHandledInMainBlock = true;
          const clickedOnTimelineGridOriginal =
              elementClickedStartOriginal &&
              elementClickedStartOriginal.type === "node" &&
              elementClickedStartOriginal.nodeRef &&
              elementClickedStartOriginal.nodeRef.type === TIMELINE_GRID_TYPE;
          const clickedOnSpaceRadarOriginal =
              elementClickedStartOriginal &&
              elementClickedStartOriginal.type === "node" &&
              elementClickedStartOriginal.nodeRef &&
              (elementClickedStartOriginal.nodeRef.type === SPACERADAR_TYPE ||
                  elementClickedStartOriginal.nodeRef.type === CRANK_RADAR_TYPE);
          const clickedOnEmptySpaceOriginal = !elementClickedStartOriginal;
          const canPlaceNodeHereOriginal =
              clickedOnEmptySpaceOriginal ||
              clickedOnTimelineGridOriginal ||
              clickedOnSpaceRadarOriginal;

          if (canPlaceNodeHereOriginal) {
              const canActuallyAddThisNode =
                  (nodeTypeToAdd !== "sound" && nodeTypeToAdd !== "nebula") ||
                  (nodeTypeToAdd === "sound" && waveformToAdd) ||
                  (nodeTypeToAdd === "nebula" && waveformToAdd) ||
                  isPulsarType(nodeTypeToAdd) ||
                  isDrumType(nodeTypeToAdd) ||
                  nodeTypeToAdd === PRORB_TYPE ||
                  nodeTypeToAdd === ALIEN_ORB_TYPE ||
                  nodeTypeToAdd === ALIEN_DRONE_TYPE ||
                  [
                      "gate",
                      "probabilityGate",
                      "pitchShift",
                      "relay",
                      "reflector",
                      "switch",
                      PORTAL_NEBULA_TYPE,
                  ].includes(nodeTypeToAdd);

              if (canActuallyAddThisNode) {
                  let finalX = mousePos.x;
                  let finalY = mousePos.y;
                  const effectiveGlobalSnapForAdd =
                      isSnapEnabled && !(event && event.shiftKey);

                  if (nodeTypeToAdd !== TIMELINE_GRID_TYPE && nodeTypeToAdd !== SPACERADAR_TYPE && nodeTypeToAdd !== CRANK_RADAR_TYPE) {
                      for (const timelineGridNode of nodes) {
                          if (
                              timelineGridNode.type === TIMELINE_GRID_TYPE &&
                              timelineGridNode.snapToInternalGrid &&
                              timelineGridNode.internalGridDivisions > 1
                          ) {
                              const cosRot = Math.cos(
                                  -(timelineGridNode.audioParams?.rotation || 0),
                              );
                              const sinRot = Math.sin(
                                  -(timelineGridNode.audioParams?.rotation || 0),
                              );
                              const tX = mousePos.x - timelineGridNode.x;
                              const tY = mousePos.y - timelineGridNode.y;
                              const localMouseX = tX * cosRot - tY * sinRot;
                              const localMouseY = tX * sinRot + tY * cosRot;

                              if (
                                  localMouseX >= -timelineGridNode.width / 2 &&
                                  localMouseX <= timelineGridNode.width / 2 &&
                                  localMouseY >= -timelineGridNode.height / 2 &&
                                  localMouseY <= timelineGridNode.height / 2
                              ) {
                                  const internalSnapPos = snapToInternalGrid(
                                      { x: mousePos.x, y: mousePos.y },
                                      timelineGridNode,
                                  );
                                  finalX = internalSnapPos.x;
                                  finalY = internalSnapPos.y;
                                  break;
                              }
                          }
                      }
                      if (finalX === mousePos.x && finalY === mousePos.y) {
                          for (const radarNode of nodes) {
                              if (
                                  (radarNode.type === SPACERADAR_TYPE || radarNode.type === CRANK_RADAR_TYPE) &&
                                  radarNode.snapToInternalGrid &&
                                  radarNode.internalGridDivisions > 1
                              ) {
                                  const distToCenter = distance(mousePos.x, mousePos.y, radarNode.x, radarNode.y);
                                  if (distToCenter <= radarNode.radius) {
                                      const snapPos = snapToSpaceRadarInternalGrid(
                                          { x: mousePos.x, y: mousePos.y },
                                          radarNode,
                                      );
                                      finalX = snapPos.x;
                                      finalY = snapPos.y;
                                      break;
                                  }
                              }
                          }
                      }
                  }

                  if (
                      effectiveGlobalSnapForAdd &&
                      nodeTypeToAdd !== TIMELINE_GRID_TYPE
                  ) {
                      let wasSnappedToInternal = false;
                      for (const timelineGridNode of nodes) {
                          if (
                              timelineGridNode.type === TIMELINE_GRID_TYPE &&
                              timelineGridNode.snapToInternalGrid
                          ) {
                              const cosRot = Math.cos(
                                  -(timelineGridNode.audioParams?.rotation || 0),
                              );
                              const sinRot = Math.sin(
                                  -(timelineGridNode.audioParams?.rotation || 0),
                              );
                              const tX = mousePos.x - timelineGridNode.x;
                              const tY = mousePos.y - timelineGridNode.y;
                              const localMouseX = tX * cosRot - tY * sinRot;
                              const localMouseY = tX * sinRot + tY * cosRot;
                              if (
                                  localMouseX >= -timelineGridNode.width / 2 &&
                                  localMouseX <= timelineGridNode.width / 2 &&
                                  localMouseY >= -timelineGridNode.height / 2 &&
                                  localMouseY <= timelineGridNode.height / 2
                              ) {
                                  wasSnappedToInternal = true;
                                  break;
                              }
                          }
                      }
                      if (!wasSnappedToInternal) {
                          for (const radarNode of nodes) {
                              if (
                                  (radarNode.type === SPACERADAR_TYPE || radarNode.type === CRANK_RADAR_TYPE) &&
                                  radarNode.snapToInternalGrid
                              ) {
                                  const dist = distance(mousePos.x, mousePos.y, radarNode.x, radarNode.y);
                                  if (dist <= radarNode.radius) {
                                      wasSnappedToInternal = true;
                                      break;
                                  }
                              }
                          }
                      }
                      if (!wasSnappedToInternal) {
                          const globalSnapped = snapToGrid(finalX, finalY);
                          finalX = globalSnapped.x;
                          finalY = globalSnapped.y;
                      }
                  }

                  const newNode = addNode(finalX, finalY, nodeTypeToAdd, waveformToAdd);
                  if (newNode) {
                      if (!(event.shiftKey || ctrlLike)) selectedElements.clear();
                      selectedElements.add({ type: "node", id: newNode.id });
                      if (newNode.type === PRORB_TYPE) newNode.isSelected = true;
                      populateEditPanel();
                      stateWasChanged = true;
                  }
              }
          }
      } else if (
          currentTool === "delete" &&
          elementClickedStartOriginal &&
          !didDrag
      ) {
          actionHandledInMainBlock = true;
          if (elementClickedStartOriginal.type === "node")
              removeNode(nodeClickedStart);
          else if (elementClickedStartOriginal.type === "connection")
              removeConnection(connectionClickedStart);
          stateWasChanged = true;
      } else if (
          !elementClickedStartOriginal &&
          !(event.shiftKey || ctrlLike) &&
          !didDrag &&
          currentTool !== "add" &&
          currentTool !== "brush" &&
          currentTool !== "delete" &&
          currentTool !== "connect" &&
          currentTool !== "connect_string" &&
          currentTool !== "connect_glide" &&
          currentTool !== "connect_rope" &&
          currentTool !== "connect_wavetrail" &&
          currentTool !== "connect_oneway"
      ) {
          actionHandledInMainBlock = true;
          if (selectedElements.size > 0) {
              selectedElements.forEach((selEl) => {
                  if (selEl.type === "node") {
                      const n = findNodeById(selEl.id);
                      if (n && n.type === TIMELINE_GRID_TYPE) {
                          n.isInResizeMode = false;
                          if (n.audioParams) n.audioParams.isInResizeMode = false;
                      }
                  }
              });
              selectedElements.clear();
              updateGroupControlsUI();
              populateEditPanel();
              stateWasChanged = true;
          }
      }
  }

  didDrag = false;

  nodeClickedAtMouseDown = null;
  connectionClickedAtMouseDown = null;
  elementClickedAtMouseDown = null;
  nodeDragOffsets.clear();
  panStart = { x: 0, y: 0 };

  if (
      currentTool !== "connect" &&
      currentTool !== "connect_string" &&
      currentTool !== "connect_glide" &&
      currentTool !== "connect_rope" &&
      currentTool !== "connect_wavetrail" &&
      currentTool !== "connect_oneway"
  ) {
      connectionTypeToAdd = "standard";
  }

  resizingTimelineGridNode = null;
  resizeHandleType = null;

  if (!isDrawingNewTimelineGrid) {
      newTimelineGridInitialCorner = null;
      currentlyPlacingTimelineNodeId = null;
  }

  if (currentTool !== "brush" && isBrushing) {
      isBrushing = false;
      lastBrushNode = null;
      brushNoteSequenceIndex = 0;
  }

  if (stateWasChanged && !isPerformingUndoRedo) {
      saveState();
  }
  updateGroupControlsUI();
  const selectedArray = Array.from(selectedElements);

  if (selectedArray.length === 1 && selectedArray[0].type === 'node' && currentTool === 'edit') {
      const selectedNode = findNodeById(selectedArray[0].id);
      if (selectedNode && selectedNode.type === PRORB_TYPE) {
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
      } else if (selectedNode && (selectedNode.type === ALIEN_ORB_TYPE || selectedNode.type === ALIEN_DRONE_TYPE)) {
          showAlienOrbMenu(selectedNode);
          hideResonauterOrbMenu();
          hideArvoDroneOrbMenu();
      } else if (selectedNode && selectedNode.type === ARVO_DRONE_TYPE) {
          showArvoDroneOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideRadioOrbMenu();
          hideFmDroneOrbMenu();
      } else if (selectedNode && selectedNode.type === FM_DRONE_TYPE) {
          showFmDroneOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideRadioOrbMenu();
          hideArvoDroneOrbMenu();
          hideSamplerOrbMenu();
      } else if (selectedNode && (selectedNode.type === RESONAUTER_TYPE)) {
          showResonauterOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideRadioOrbMenu();
          hideArvoDroneOrbMenu();
      } else if (selectedNode && selectedNode.type === MOTOR_ORB_TYPE) {
          showMotorOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideRadioOrbMenu();
          hideArvoDroneOrbMenu();
      } else if (selectedNode && selectedNode.type === CLOCKWORK_ORB_TYPE) {
          showClockworkOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideRadioOrbMenu();
          hideArvoDroneOrbMenu();
      } else if (selectedNode && selectedNode.type === RADIO_ORB_TYPE) {
          showRadioOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideArvoDroneOrbMenu();
      } else if (selectedNode && selectedNode.type === "sound" && selectedNode.audioParams.engine === 'tone') {
        showAnalogOrbMenu(selectedNode);
        hideAlienOrbMenu();
        hideResonauterOrbMenu();
        hideRadioOrbMenu();
        hideArvoDroneOrbMenu();
        hideSamplerOrbMenu();
      } else if (selectedNode && selectedNode.type === "sound" && selectedNode.audioParams.engine === 'tonefm') {
        showToneFmSynthMenu(selectedNode);
        hideAlienOrbMenu();
        hideResonauterOrbMenu();
        hideRadioOrbMenu();
        hideArvoDroneOrbMenu();
        hideSamplerOrbMenu();
      } else if (selectedNode && selectedNode.type === "sound" && selectedNode.audioParams.waveform && selectedNode.audioParams.waveform.startsWith("sampler_")) {
          showSamplerOrbMenu(selectedNode);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideRadioOrbMenu();
          hideArvoDroneOrbMenu();
      } else {
        hideAlienOrbMenu();
        hideResonauterOrbMenu();
        hideArvoDroneOrbMenu();
        hideFmDroneOrbMenu();
        hideRadioOrbMenu();
        hideMotorOrbMenu();
        hideMotorOrbPanel();
        hideClockworkOrbMenu();
        hideClockworkOrbPanel();
        hideStringConnectionMenu();
        hideAlienPanel();
        hideResonauterPanel();
        hideArvoPanel();
        hideTonePanel();
        hideAnalogOrbMenu();
        hideSamplerPanel();
        hideStringPanel();
      }
  } else if (selectedArray.length === 1 && selectedArray[0].type === 'connection') {
      const selectedConn = findConnectionById(selectedArray[0].id);
      if (selectedConn && selectedConn.type === 'string_violin') {
          showStringConnectionMenu(selectedConn);
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideAnalogOrbMenu();
          hideSamplerOrbMenu();
          hideRadioOrbMenu();
          hideMotorOrbMenu();
          hideMotorOrbPanel();
          hideClockworkOrbMenu();
          hideClockworkOrbPanel();
          hideArvoDroneOrbMenu();
      } else {
          hideStringConnectionMenu();
          hideAlienOrbMenu();
          hideResonauterOrbMenu();
          hideAnalogOrbMenu();
          hideSamplerOrbMenu();
          hideRadioOrbMenu();
          hideMotorOrbMenu();
          hideMotorOrbPanel();
          hideArvoDroneOrbMenu();
          hideStringPanel();
      }
  } else {
    hideAlienOrbMenu();
    hideResonauterOrbMenu();
    hideAnalogOrbMenu();
    hideSamplerOrbMenu();
    hideRadioOrbMenu();
    hideMotorOrbMenu();
    hideMotorOrbPanel();
    hideClockworkOrbMenu();
    hideClockworkOrbPanel();
    hideArvoDroneOrbMenu();
    hideStringConnectionMenu();
    hideAlienPanel();
    hideResonauterPanel();
    hideArvoPanel();
    hideTonePanel();
    hideSamplerPanel();
    hideStringPanel();
  }
  ctrlLikeAtMouseDown = false;
}

function snapToInternalGrid(positionToSnap, timelineGridNode) {
  if (
    !timelineGridNode ||
    timelineGridNode.type !== TIMELINE_GRID_TYPE ||
    !timelineGridNode.snapToInternalGrid ||
    timelineGridNode.internalGridDivisions <= 1
  ) {
    return { x: positionToSnap.x, y: positionToSnap.y };
  }

  const rotation = timelineGridNode.audioParams?.rotation || 0;
  const { x: worldX, y: worldY } = positionToSnap;
  const {
    x: gridCenterX,
    y: gridCenterY,
    width: gridWidth,
    height: gridHeight,
  } = timelineGridNode;

  const translatedX = worldX - gridCenterX;
  const translatedY = worldY - gridCenterY;

  const cosNegTheta = Math.cos(-rotation);
  const sinNegTheta = Math.sin(-rotation);
  const localMouseX = translatedX * cosNegTheta - translatedY * sinNegTheta;
  const localMouseY = translatedX * sinNegTheta + translatedY * cosNegTheta;

  const localGridLeftEdge = -gridWidth / 2;
  const divisionWidth = gridWidth / timelineGridNode.internalGridDivisions;
  const relativeXFromLocalLeft = localMouseX - localGridLeftEdge;
  const nearestDivisionIndex = Math.round(
    relativeXFromLocalLeft / divisionWidth,
  );
  let snappedLocalX = localGridLeftEdge + nearestDivisionIndex * divisionWidth;
  snappedLocalX = Math.max(
    localGridLeftEdge,
    Math.min(snappedLocalX, gridWidth / 2),
  );

  const finalLocalY = Math.max(
    -gridHeight / 2,
    Math.min(localMouseY, gridHeight / 2),
  );

  const cosTheta = Math.cos(rotation);
  const sinTheta = Math.sin(rotation);
  const rotatedSnappedX = snappedLocalX * cosTheta - finalLocalY * sinTheta;
  const rotatedSnappedY = snappedLocalX * sinTheta + finalLocalY * cosTheta;

  const snappedWorldX = rotatedSnappedX + gridCenterX;
  const snappedWorldY = rotatedSnappedY + gridCenterY;

  return { x: snappedWorldX, y: snappedWorldY };
}

function snapToSpaceRadarInternalGrid(positionToSnap, radarNode) {
  if (
    !radarNode ||
    (radarNode.type !== SPACERADAR_TYPE && radarNode.type !== CRANK_RADAR_TYPE) ||
    !radarNode.snapToInternalGrid ||
    radarNode.internalGridDivisions <= 1
  ) {
    return { x: positionToSnap.x, y: positionToSnap.y };
  }
  const { x: worldX, y: worldY } = positionToSnap;
  const dx = worldX - radarNode.x;
  const dy = worldY - radarNode.y;
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const radius = Math.min(radarNode.radius, Math.hypot(dx, dy));
  const divisionAngle = (Math.PI * 2) / radarNode.internalGridDivisions;
  const snappedAngle = Math.round(angle / divisionAngle) * divisionAngle;
  return {
    x: radarNode.x + Math.cos(snappedAngle - Math.PI / 2) * radius,
    y: radarNode.y + Math.sin(snappedAngle - Math.PI / 2) * radius,
  };
}

function handleWheel(event) {
  event.preventDefault();
  if (
    isDragging ||
    isSelecting ||
    isConnecting ||
    isResizing ||
    isResizingTimelineGrid ||
    isPanning ||
    isDrawingNewTimelineGrid ||
    isRotatingRocket ||
    isRotatingTimelineGrid ||
    isBrushing ||
    patchState.isMisting ||
    patchState.isCrushing ||
    patchState.isErasing
  ) {
    return;
  }
  const zoomAmount = event.deltaY * ZOOM_SENSITIVITY;
  const worldCoords = getWorldCoords(event.clientX, event.clientY);
  const oldScale = viewScale;
  viewScale -= zoomAmount;
  viewScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewScale));
  if (oldScale !== viewScale) {
    viewOffsetX = event.clientX - worldCoords.x * viewScale;
    viewOffsetY = event.clientY - worldCoords.y * viewScale;
  }
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const stateToLoad = historyStack[historyIndex]; 
    if (stateToLoad) {
      loadState(stateToLoad);
    } else {
      console.error("Undo failed: state in history is invalid.");
      historyIndex++; 
    }
  }
  resetSideToolbars();
  setActiveTool("edit");
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    const stateToLoad = historyStack[historyIndex]; 
    if (stateToLoad) {
      loadState(stateToLoad);
    } else {
      console.error("Redo failed: state in history is invalid.");
      historyIndex--; 
    }
  }
  resetSideToolbars();
  setActiveTool("edit");
}

function removeNoteSelector() {
  if (noteSelectContainer && noteSelectContainer.parentNode) {
    noteSelectContainer.parentNode.removeChild(noteSelectContainer);
  }
  noteSelectContainer = null;
}

function createNoteSelector(
  parentElement = sideToolbarContent,
  targetElementsData = [],
) {
  removeNoteSelector();
  const container = document.createElement("div");
  container.classList.add("panel-section");
  const label = document.createElement("label");
  label.textContent = "Note:";
  label.htmlFor = "noteSelect";
  container.appendChild(label);
  const select = document.createElement("select");
  select.id = "noteSelect";
  let initialValue = -2;
  let hasMultipleValues = false;
  let firstValueFound = false;

  if (targetElementsData.length > 0) {
    targetElementsData.forEach((elData) => {
      const el =
        elData.type === "node"
          ? findNodeById(elData.id)
          : findConnectionById(elData.id);
      if (
        el &&
        el.audioParams &&
        typeof el.audioParams.scaleIndex === "number"
      ) {
        if (!firstValueFound) {
          initialValue = el.audioParams.scaleIndex;
          firstValueFound = true;
        } else if (el.audioParams.scaleIndex !== initialValue) {
          hasMultipleValues = true;
        }
      }
    });
  }

  const optionsArray = [];
  const numNotes = currentScale.notes.length;
  const octavesToCover = 4;
  const startingScaleIndex = MIN_SCALE_INDEX;
  const endingScaleIndex = Math.min(
    MAX_SCALE_INDEX,
    startingScaleIndex + numNotes * octavesToCover,
  );

  for (let i = startingScaleIndex; i < endingScaleIndex; i++) {
    const noteName = getNoteNameFromScaleIndex(
      currentScale,
      i,
      NOTE_NAMES,
      currentRootNote,
      globalTransposeOffset,
    );
    if (noteName && noteName !== "?") {
      const notes = currentScale.notes;
      const numNotesInScale = notes.length;
      const noteIdx = i % numNotesInScale;
      const effectiveNoteIndex =
        noteIdx < 0 ? noteIdx + numNotesInScale : noteIdx;
      const octOffset = Math.floor(i / numNotesInScale);
      const semitonesInScale = notes[effectiveNoteIndex];
      const totalSemitonesFromScaleBase = semitonesInScale + octOffset * 12;
      const baseFreqWithOffsets =
        currentScale.baseFreq *
        Math.pow(2, (currentRootNote + globalTransposeOffset) / 12);
      const baseMidiNote = frequencyToMidi(baseFreqWithOffsets);
      const finalAbsoluteMidiNote = !isNaN(baseMidiNote)
        ? baseMidiNote + totalSemitonesFromScaleBase
        : NaN;
      if (!isNaN(finalAbsoluteMidiNote)) {
        optionsArray.push({
          value: i,
          text: noteName,
          midi: Math.round(finalAbsoluteMidiNote),
        });
      }
    }
  }

  optionsArray.sort((a, b) => a.midi - b.midi);

  if (hasMultipleValues || !firstValueFound) {
    const multiOpt = document.createElement("option");
    multiOpt.value = "-2";
    multiOpt.textContent = "---";
    multiOpt.disabled = true;
    multiOpt.selected = true;
    select.appendChild(multiOpt);
  }

  const randomOpt = document.createElement("option");
  randomOpt.value = -1;
  randomOpt.textContent = "Random";
  select.appendChild(randomOpt);

  optionsArray.forEach((optionData) => {
    const opt = document.createElement("option");
    opt.value = optionData.value;
    opt.textContent = optionData.text;
    select.appendChild(opt);
  });

  select.value =
    hasMultipleValues || !firstValueFound
      ? "-2"
      : initialValue === -1
        ? "-1"
        : initialValue.toString();
  if (parentElement === sideToolbarContent && initialValue === -2) {
    select.value = "-1";
    noteIndexToAdd = -1;
  }

  select.addEventListener("change", (e) => {
    const newIndex = parseInt(e.target.value, 10);
    if (newIndex === -2) return;
    if (targetElementsData.length > 0) {
      if (newIndex === -1) {
        applyRandomScaleIndexToSelection(targetElementsData);
      } else {
        applyScaleIndexToSelection(newIndex, targetElementsData);
      }
    } else {
      noteIndexToAdd = newIndex;
    }
  });
  container.appendChild(select);
  parentElement.appendChild(container);
  noteSelectContainer = container;
}

function createHexNoteSelectorDOM(
  parentElement = sideToolbarContent,
  targetElementsData = [],
) {
  removeNoteSelector();
  const existingHexContainer = parentElement.querySelector(
    "#hexNoteSelectorContainer",
  );
  if (existingHexContainer) {
    existingHexContainer.remove();
  }
  const existingToggleButton = parentElement.querySelector(
    "#hexRandomToggleBtn",
  );
  if (existingToggleButton) {
    existingToggleButton.remove();
  }

  const container = document.createElement("div");
  container.id = "hexNoteSelectorContainer";
  container.classList.add("hex-note-container");

  let initialScaleIndex = -2;
  let hasMultipleValues = false;
  let firstValueFound = false;
  let currentSelectedValue = null;
  let isEditing = targetElementsData.length > 0;
  let isRandomActive = !isEditing;

  if (isEditing) {
    targetElementsData.forEach((elData) => {
      const el =
        elData.type === "node"
          ? findNodeById(elData.id)
          : findConnectionById(elData.id);
      if (
        el &&
        el.audioParams &&
        typeof el.audioParams.scaleIndex === "number"
      ) {
        if (!firstValueFound) {
          initialScaleIndex = el.audioParams.scaleIndex;
          firstValueFound = true;
        } else if (el.audioParams.scaleIndex !== initialScaleIndex) {
          hasMultipleValues = true;
        }
      }
    });
    if (!hasMultipleValues && firstValueFound) {
      currentSelectedValue = initialScaleIndex;
      isRandomActive = false;
    } else {
      isRandomActive = false;
      currentSelectedValue = null;
    }
  } else {
    currentSelectedValue = null;
    isRandomActive = true;
    noteIndexToAdd = -1;
  }

  const randomToggleButton = document.createElement("button");
  randomToggleButton.id = "hexRandomToggleBtn";
  randomToggleButton.classList.add("hex-random-toggle");
  randomToggleButton.textContent = "Random Note";
  randomToggleButton.classList.toggle("active", isRandomActive);
  randomToggleButton.type = "button";
  randomToggleButton.addEventListener("mousedown", (e) => e.stopPropagation());
  randomToggleButton.addEventListener("mouseup", (e) => e.stopPropagation());

  randomToggleButton.addEventListener("click", () => {
    if (!isRandomActive) {
      isRandomActive = true;
      randomToggleButton.classList.add("active");
      container
        .querySelectorAll(".hexagon-note.hex-selected")
        .forEach((hex) => hex.classList.remove("hex-selected"));
      currentSelectedValue = null;
      noteIndexToAdd = -1;
    }

    if (isEditing && targetElementsData.length > 0) {
      applyRandomScaleIndexToSelection(targetElementsData);
    }
  });
  parentElement.insertBefore(randomToggleButton, parentElement.firstChild);

  const midiStartNote = 0;
  const octavesToDisplay = 5;
  const noteCount = 12 * octavesToDisplay + 1;

  const columns = 5;
  const baseHeight = Math.floor(noteCount / columns);
  const extra = noteCount % columns;
  const baseHexColumnsLayout = Array.from({ length: columns }, (_, idx) =>
    idx < extra ? baseHeight + 1 : baseHeight,
  );
  const hexColumnsLayout = baseHexColumnsLayout;
  let currentHexIndex = 0;
  const scaleIndexToMidiMap = new Map();

  const relevantStartIndex = -12;
  const relevantEndIndex = 36;
  for (let i = relevantStartIndex; i < relevantEndIndex; i++) {
    const midi = Math.round(
      frequencyToMidi(
        getFrequency(
          currentScale,
          i,
          0,
          currentRootNote,
          globalTransposeOffset,
        ),
      ),
    );
    if (!isNaN(midi)) {
      scaleIndexToMidiMap.set(i, midi);
    }
  }

  const horizontalStep = 2;
  const verticalStep = 7;

  for (const [colIndex, hexesInColumn] of hexColumnsLayout.entries()) {
    const columnDiv = document.createElement("div");
    columnDiv.classList.add("hex-column");
    columnDiv.style.setProperty("--column", colIndex + 1);

    for (let i = 0; i < hexesInColumn; i++) {
      if (currentHexIndex >= noteCount) break;
      const midiNote =
        midiStartNote + colIndex * horizontalStep + i * verticalStep;
      const noteName = getNoteName(midiNote, NOTE_NAMES);
      const hexDiv = document.createElement("div");
      hexDiv.classList.add("hexagon-note");
      hexDiv.textContent = noteName;
      hexDiv.dataset.midiNote = midiNote;

      const noteModulo = midiNote % 12;
      const rootModulo = currentRootNote % 12;
      const intervalFromRoot = (noteModulo - rootModulo + 12) % 12;
      const isRoot = noteModulo === rootModulo;
      const isInScale = currentScale.notes.includes(intervalFromRoot);
      let closestScaleIndex = null;
      let minDiff = Infinity;

      for (const [scaleIndex, scaleMidi] of scaleIndexToMidiMap.entries()) {
        const diff = Math.abs(midiNote - scaleMidi);
        if (diff === 0) {
          minDiff = diff;
          closestScaleIndex = scaleIndex;
          break;
        }
        if (diff < minDiff) {
          minDiff = diff;
          closestScaleIndex = scaleIndex;
        }
      }

      if (closestScaleIndex === null) closestScaleIndex = 0;
      hexDiv.dataset.scaleIndex = closestScaleIndex;

      if (isRoot) {
        hexDiv.classList.add("hex-root");
      } else if (isInScale) {
        hexDiv.classList.add("hex-in-scale");
      } else {
        hexDiv.classList.add("hex-disabled");
      }

      if (
        !isRandomActive &&
        closestScaleIndex === currentSelectedValue &&
        !hexDiv.classList.contains("hex-disabled")
      ) {
        hexDiv.classList.add("hex-selected");
      }

      hexDiv.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (e.currentTarget.classList.contains("hex-disabled")) {
          return;
        }

        const clickedScaleIndexStr = e.currentTarget.dataset.scaleIndex;
        const clickedMidiNote = e.currentTarget.dataset.midiNote;

        if (
          clickedScaleIndexStr === undefined ||
          clickedScaleIndexStr === null
        ) {
          console.error("Clicked hex is missing data-scale-index attribute.");
          return;
        }
        const clickedScaleIndex = parseInt(clickedScaleIndexStr, 10);

        isRandomActive = false;
        randomToggleButton.classList.remove("active");
        currentSelectedValue = clickedScaleIndex;

        if (isEditing) {
          applyScaleIndexToSelection(clickedScaleIndex, targetElementsData);
        } else {
          noteIndexToAdd = clickedScaleIndex;
        }

        const previouslySelected = container.querySelectorAll(
          ".hexagon-note.hex-selected",
        );

        previouslySelected.forEach((selectedHex) => {
          selectedHex.classList.remove("hex-selected");
        });

        e.currentTarget.classList.add("hex-selected");
      });
      hexDiv.addEventListener("mouseup", (e) => e.stopPropagation());
      columnDiv.appendChild(hexDiv);
      currentHexIndex++;
    }
    if (columnDiv.hasChildNodes()) {
      container.appendChild(columnDiv);
    }
    if (currentHexIndex >= noteCount) break;
  }
  parentElement.appendChild(container);
}

function applyScaleIndexToSelection(scaleIndex, targetElementsData) {
  let changed = false;
  targetElementsData.forEach((elData) => {
    const element =
      elData.type === "node"
        ? findNodeById(elData.id)
        : findConnectionById(elData.id);
    if (element && element.audioParams) {
      if (element.audioParams.scaleIndex !== scaleIndex) {
        element.audioParams.scaleIndex = scaleIndex;
        element.audioParams.pitch = getFrequency(
          currentScale,
          scaleIndex,
          0,
          currentRootNote,
          globalTransposeOffset,
        );
        if (elData.type === "node") {
          updateNodeAudioParams(element);
        if (
          (element.type === ALIEN_ORB_TYPE ||
            element.type === ALIEN_DRONE_TYPE) &&
          element.audioNodes
        ) {
          updateAlienNodesParams(
            element.audioNodes,
            element.audioParams.engine,
            element.audioParams.pitch,
          );
          if (element.audioNodes.orbitoneSynths) {
            const freqs = getOrbitoneFrequencies(
              element.audioParams.scaleIndex,
              element.audioParams.orbitoneCount,
              element.audioParams.orbitoneIntervals,
              0,
              currentScale,
              element.audioParams.pitch,
            ).slice(1);
            element.audioNodes.orbitoneSynths.forEach((s, idx) => {
              if (idx < freqs.length) {
                updateAlienNodesParams(
                  s,
                  element.audioParams.engine,
                  freqs[idx],
                );
              }
            });
          }
          updateAlienParams();
        }
        } else if (elData.type === "connection") {
          updateConnectionAudioParams(element);
        }
        changed = true;
        element.animationState = 0.1;
        setTimeout(() => {
          const checkElem =
            elData.type === "node"
              ? findNodeById(elData.id)
              : findConnectionById(elData.id);
          if (
            checkElem &&
            checkElem.animationState > 0 &&
            !checkElem.isTriggered
          ) {
            checkElem.animationState = 0;
          }
        }, 150);
      }
    }
  });
  if (changed) {
    saveState();
  }
}

function getRandomScaleIndex() {
  const randomIndex =
    Math.floor(Math.random() * currentScale.notes.length * 3) -
    currentScale.notes.length;
  return Math.max(
    MIN_SCALE_INDEX,
    Math.min(MAX_SCALE_INDEX, randomIndex),
  );
}

function applyRandomScaleIndexToSelection(targetElementsData) {
  let changed = false;
  targetElementsData.forEach((elData) => {
    const element =
      elData.type === "node"
        ? findNodeById(elData.id)
        : findConnectionById(elData.id);
    if (element && element.audioParams) {
      const randomIndex = getRandomScaleIndex();
      element.audioParams.scaleIndex = randomIndex;
      element.audioParams.pitch = getFrequency(
        currentScale,
        randomIndex,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
      if (elData.type === "node") {
        updateNodeAudioParams(element);
        if (
          (element.type === ALIEN_ORB_TYPE ||
            element.type === ALIEN_DRONE_TYPE) &&
          element.audioNodes
        ) {
          updateAlienNodesParams(
            element.audioNodes,
            element.audioParams.engine,
            element.audioParams.pitch,
          );
          if (element.audioNodes.orbitoneSynths) {
            const freqs = getOrbitoneFrequencies(
              element.audioParams.scaleIndex,
              element.audioParams.orbitoneCount,
              element.audioParams.orbitoneIntervals,
              0,
              currentScale,
              element.audioParams.pitch,
            ).slice(1);
            element.audioNodes.orbitoneSynths.forEach((s, idx) => {
              if (idx < freqs.length) {
                updateAlienNodesParams(
                  s,
                  element.audioParams.engine,
                  freqs[idx],
                );
              }
            });
          }
          updateAlienParams();
        }
      } else if (elData.type === "connection") {
        updateConnectionAudioParams(element);
      }
      changed = true;
      element.animationState = 0.1;
      setTimeout(() => {
        const checkElem =
          elData.type === "node"
            ? findNodeById(elData.id)
            : findConnectionById(elData.id);
        if (checkElem && checkElem.animationState > 0 && !checkElem.isTriggered) {
          checkElem.animationState = 0;
        }
      }, 150);
    }
  });
  if (changed) {
    saveState();
  }
}

function resetSideToolbars() {
  sideToolbar.classList.add("hidden");
  sideToolbar.classList.remove("narrow");
  hamburgerMenuPanel.classList.add("hidden");
  hamburgerBtn.classList.remove("active");
  const sideButtons = sideToolbarContent.querySelectorAll(
    ".type-button, .waveform-button, .drum-element-button",
  );
  sideButtons.forEach((btn) => btn.classList.remove("selected"));
  removeNoteSelector();
  editPanelContent.innerHTML = "";
}

function setActiveTool(toolName) {
    if (currentTool === "brush" && toolName !== "brush") {
        isBrushing = false;
        lastBrushNode = null;
        brushNoteSequenceIndex = 0;
        if (brushBtn) brushBtn.classList.remove("active");
    }
    if (currentTool === "mist" && toolName !== "mist") {
        patchState.isMisting = false;
        if (mistBtn) mistBtn.classList.remove("active");
        if (mistLayer && toolName !== "eraser")
            mistLayer.classList.remove("mist-active");
    }
    if (currentTool === "crush" && toolName !== "crush") {
        patchState.isCrushing = false;
        if (crushBtn) crushBtn.classList.remove("active");
        if (crushLayer) crushLayer.classList.remove("crush-active");
    }
    if (currentTool === "eraser" && toolName !== "eraser") {
        patchState.isErasing = false;
        if (eraserBtn) eraserBtn.classList.remove("active");
        if (mistLayer) mistLayer.classList.remove("eraser-active");
        if (crushLayer) crushLayer.classList.remove("eraser-active");
    }

    if (
        (currentTool === "add" || currentTool === "brush") &&
        toolName !== "add" &&
        toolName !== "brush"
    ) {
        nodeTypeToAdd = null;
        waveformToAdd = null;
        soundEngineToAdd = null;
        noteIndexToAdd = -1;
        const addAndSoundButtons = toolbar.querySelectorAll(
            "#toolbar-pulsars button, #toolbar-logic-nodes button, #toolbar-environment-nodes button, #toolbar-sound-generators button, #toolbar-drones button",
        );
        addAndSoundButtons.forEach((btn) => btn.classList.remove("active"));
        if (brushBtn) brushBtn.classList.remove("active");
    }

    currentTool = toolName;
    connectingNode = null;
    isConnecting = false;

    if (toolName !== "edit") {
        nodes.forEach((node) => {
            if (node.type === TIMELINE_GRID_TYPE) {
                node.isInResizeMode = false;
                if (node.audioParams) {
                    node.audioParams.isInResizeMode = false;
                }
            }
        });
    }

    editBtn.classList.toggle("active", toolName === "edit");
    if (connectBtn)
        connectBtn.classList.toggle("active", toolName === "connect");
    if (connectStringBtn)
        connectStringBtn.classList.toggle("active", toolName === "connect_string");
    if (glideToolButton)
        glideToolButton.classList.toggle("active", toolName === "connect_glide");
    if (connectRopeBtn)
        connectRopeBtn.classList.toggle("active", toolName === "connect_rope");
    if (connectWaveTrailBtn)
        connectWaveTrailBtn.classList.toggle(
            "active",
            toolName === "connect_wavetrail",
        );
    if (connectOneWayBtn)
        connectOneWayBtn.classList.toggle("active", toolName === "connect_oneway");
    deleteBtn.classList.toggle("active", toolName === "delete");
    if (eraserBtn) eraserBtn.classList.toggle("active", toolName === "eraser");
    if (wandBtn) wandBtn.classList.toggle("active", toolName === "wand");
    if (brushBtn) brushBtn.classList.toggle("active", toolName === "brush");
    if (mistBtn) mistBtn.classList.toggle("active", toolName === "mist");
    if (mistLayer) {
        mistLayer.classList.toggle(
            "mist-active",
            toolName === "mist" || toolName === "eraser",
        );
        mistLayer.classList.toggle("eraser-active", toolName === "eraser");
    }
    if (crushBtn) crushBtn.classList.toggle("active", toolName === "crush");
    if (crushLayer) {
        crushLayer.classList.toggle(
            "crush-active",
            toolName === "crush" || toolName === "eraser",
        );
        crushLayer.classList.toggle("eraser-active", toolName === "eraser");
    }

    if (toolName !== "add" && toolName !== "brush") {
        hideOverlappingPanels();
    } else if (toolName === "add" || toolName === "brush") {
        if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
        if (hamburgerBtn) hamburgerBtn.classList.remove("active");
    }

    if (
        toolName !== "edit" ||
        (hamburgerMenuPanel && hamburgerMenuPanel.classList.contains("hidden"))
    ) {
        if (sideToolbar && toolName !== "add" && toolName !== "brush")
            sideToolbar.classList.add("hidden");
        if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
        if (hamburgerBtn) hamburgerBtn.classList.remove("active");
    }

    isResizing = false;
    isSelecting = false;
    selectionRect.active = false;
    isPanning = false;

    updateGroupControlsUI();
    updateRestartPulsarsButtonVisibility();

    if (toolName === "edit") {
        populateEditPanel();
    } else {
        if (editPanelContent) editPanelContent.innerHTML = "";
    }
    
}


function populateEditPanel() {
    editPanelContent.innerHTML = "";
    updateReplaceMenuState();
    if (currentTool !== "edit" || selectedElements.size === 0) {
        if (
            hamburgerMenuPanel &&
            !hamburgerMenuPanel.classList.contains("hidden") &&
            selectedElements.size === 0
        ) {
            hamburgerMenuPanel.classList.add("hidden");
            if (hamburgerBtn) hamburgerBtn.classList.remove("active");
        }
        return;
    }

    const selectedArray = Array.from(selectedElements);
    const firstElementData = selectedArray[0];
    const fragment = document.createDocumentFragment();
    const title = document.createElement("p");
    const nodeTypes = new Set(
        selectedArray
        .filter((el) => el.type === "node")
        .map((el) => findNodeById(el.id)?.type),
    );
    const connectionTypesSet = new Set(
        selectedArray
        .filter((el) => el.type === "connection")
        .map((el) => findConnectionById(el.id)?.type),
    );
    let titleText = "";
    let allSameLogicalType = false;
    let logicalType = "";

    if (selectedArray.length === 1) {
        const element =
            firstElementData.type === "node" ?
            findNodeById(firstElementData.id) :
            findConnectionById(firstElementData.id);
        if (element) {
            logicalType = element.type.replace(/_/g, " ");
            titleText = `Edit ${logicalType} #${element.id}`;
            allSameLogicalType = true;
        } else {
            titleText = "Edit Element";
        }
    } else {
        const types = new Set([...nodeTypes, ...connectionTypesSet]);
        if (types.size === 1) {
            logicalType = [...types][0].replace(/_/g, " ");
            titleText = `Edit ${selectedArray.length} ${logicalType}s`;
            allSameLogicalType = true;
        } else {
            titleText = `Edit ${selectedArray.length} Elements (Mixed Types)`;
            allSameLogicalType = false;
        }
    }
    title.innerHTML = `<strong>${titleText}</strong>`;
    fragment.appendChild(title);

    if (selectedArray.length > 1) {
        let hasNodesSelected = false;
        for (const elData of selectedArray) {
            if (elData.type === 'node') {
                hasNodesSelected = true;
                break;
            }
        }

        if (hasNodesSelected) {
            const makeGroupButton = document.createElement("button");
            makeGroupButton.textContent = "Make User-Defined Group";
            makeGroupButton.id = "edit-panel-make-group-btn";
            makeGroupButton.classList.add("panel-button-like");
            makeGroupButton.style.marginTop = "10px";
            makeGroupButton.style.marginBottom = "10px";
            makeGroupButton.style.display = "block";
            makeGroupButton.style.width = "100%";

            makeGroupButton.addEventListener("click", () => {
                if (typeof makeUserDefinedGroup === "function") {
                    makeUserDefinedGroup();
                    populateEditPanel();
                } else {
                    alert("Error: Grouping function not available.");
                }
            });
            fragment.appendChild(makeGroupButton);

            const linkParamsButton = document.createElement("button");
            linkParamsButton.textContent = "Link Parameters";
            linkParamsButton.id = "edit-panel-link-params-btn";
            linkParamsButton.classList.add("panel-button-like");
            linkParamsButton.style.marginBottom = "10px";
            linkParamsButton.style.display = "block";
            linkParamsButton.style.width = "100%";
            linkParamsButton.addEventListener("click", () => {
                makeParameterGroup();
                populateEditPanel();
            });
            fragment.appendChild(linkParamsButton);

            const replaceButton = document.createElement("button");
            replaceButton.textContent = "Replace";
            replaceButton.id = "edit-panel-replace-btn";
            replaceButton.classList.add("panel-button-like");
            replaceButton.style.marginBottom = "10px";
            replaceButton.style.display = "block";
            replaceButton.style.width = "100%";
            replaceButton.addEventListener("click", () => {
                openReplaceInstrumentMenu();
            });
            fragment.appendChild(replaceButton);

            const allTimelines = selectedArray.every((elData) => {
                const n = findNodeById(elData.id);
                return elData.type === 'node' && n && n.type === TIMELINE_GRID_TYPE;
            });
            if (allTimelines && selectedArray.length > 1) {
                const syncBtn = document.createElement('button');
                syncBtn.textContent = 'Sync Timelines';
                syncBtn.id = 'edit-panel-sync-timeline-btn';
                syncBtn.classList.add('panel-button-like');
                syncBtn.style.marginBottom = '10px';
                syncBtn.style.display = 'block';
                syncBtn.style.width = '100%';
                syncBtn.addEventListener('click', () => {
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE) {
                            n.scanLinePosition = 0;
                            n.isPingPongForward = true;
                            if (n.triggeredInThisSweep) n.triggeredInThisSweep.clear();
                            else n.triggeredInThisSweep = new Set();
                        }
                    });
                    saveState();
                });
                fragment.appendChild(syncBtn);
            }
        }
    }

    const elementsWithNote = selectedArray.filter((elData) => {
        const el =
            elData.type === "node" ?
            findNodeById(elData.id) :
            findConnectionById(elData.id);
        return (
            el &&
            (el.type === "sound" ||
                el.type === "nebula" ||
                el.type === PRORB_TYPE ||
                el.type === MIDI_ORB_TYPE ||
                el.type === ALIEN_ORB_TYPE ||
                el.type === ALIEN_DRONE_TYPE ||
                el.type === ARVO_DRONE_TYPE ||
                el.type === FM_DRONE_TYPE ||
                el.type === RESONAUTER_TYPE ||
                (elData.type === "connection" && el.type === "string_violin"))
        );
    });

    if (elementsWithNote.length > 0) {
        const targetDataForNoteSelector = elementsWithNote.map((el) => ({
            type: el.type,
            id: el.id,
        }));
        createHexNoteSelectorDOM(fragment, targetDataForNoteSelector);
    }

    if (allSameLogicalType) {
        if (firstElementData.type === "node") {
            const node = findNodeById(firstElementData.id);

            if (node && node.type === TIMELINE_GRID_TYPE) {
                const section = document.createElement("div");
                section.classList.add("panel-section");

                const playingLabel = document.createElement("label");
                playingLabel.htmlFor = `edit-timeline-playing-${node.id}`;
                playingLabel.textContent = "Playing:";
                section.appendChild(playingLabel);
                const playingCheckbox = document.createElement("input");
                playingCheckbox.type = "checkbox";
                playingCheckbox.id = `edit-timeline-playing-${node.id}`;
                playingCheckbox.checked = node.timelineIsPlaying;
                playingCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE) {
                            n.timelineIsPlaying = e.target.checked;
                            if (
                                n.timelineIsPlaying &&
                                n.timelineIsLooping
                            ) {
                                n.scanLinePosition = 0;
                                if (n.triggeredInThisSweep) n.triggeredInThisSweep.clear();
                                else n.triggeredInThisSweep = new Set();
                            }
                            if (n.audioParams)
                                n.audioParams.timelineIsPlaying = n.timelineIsPlaying;
                        }
                    });
                    saveState();
                });
                section.appendChild(playingCheckbox);
                section.appendChild(document.createElement("br"));

                const loopingLabel = document.createElement("label");
                loopingLabel.htmlFor = `edit-timeline-looping-${node.id}`;
                loopingLabel.textContent = "Looping:";
                section.appendChild(loopingLabel);
                const loopingCheckbox = document.createElement("input");
                loopingCheckbox.type = "checkbox";
                loopingCheckbox.id = `edit-timeline-looping-${node.id}`;
                loopingCheckbox.checked = node.timelineIsLooping;
                loopingCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE) {
                            n.timelineIsLooping = e.target.checked;
                            if (n.audioParams)
                                n.audioParams.timelineIsLooping = n.timelineIsLooping;
                        }
                    });
                    saveState();
                });
                section.appendChild(loopingCheckbox);
                section.appendChild(document.createElement("br"));

                if (isGlobalSyncEnabled) {
                    const durationLabel = document.createElement("label");
                    durationLabel.htmlFor = `edit-timeline-duration-bars-${node.id}`;
                    durationLabel.textContent = "Duration (Sync):";
                    section.appendChild(durationLabel);
                    const durationSelect = document.createElement("select");
                    durationSelect.id = `edit-timeline-duration-bars-${node.id}`;
                    const barOptions = [
                        { label: "1/4 Bar (1 Beat)", value: 0.25 },
                        { label: "1/2 Bar (2 Beats)", value: 0.5 },
                        { label: "1 Bar (4 Beats)", value: 1 },
                        { label: "2 Bars (8 Beats)", value: 2 },
                        { label: "4 Bars (16 Beats)", value: 4 },
                        { label: "8 Bars (32 Beats)", value: 8 },
                    ];
                    let currentMusicalDuration = node.timelineMusicalDurationBars || 1;
                    barOptions.forEach((opt) => {
                        const optionEl = document.createElement("option");
                        optionEl.value = opt.value;
                        optionEl.textContent = opt.label;
                        if (parseFloat(opt.value) === parseFloat(currentMusicalDuration)) {
                            optionEl.selected = true;
                        }
                        durationSelect.appendChild(optionEl);
                    });
                    durationSelect.addEventListener("change", (e) => {
                        const newBars = parseFloat(e.target.value);
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE) {
                                n.timelineMusicalDurationBars = newBars;
                                if (n.audioParams)
                                    n.audioParams.timelineMusicalDurationBars = newBars;
                            }
                        });
                        saveState();
                    });
                    section.appendChild(durationSelect);
                } else {
                    const currentSpeed =
                        node.timelineSpeed || TIMELINE_GRID_DEFAULT_SPEED;
                    const speedVal = currentSpeed.toFixed(1);
                    const speedSliderContainer = createSlider(
                        `edit-timeline-speed-${node.id}`,
                        `Speed (${speedVal}s / sweep):`,
                        0.2,
                        30.0,
                        0.1,
                        currentSpeed,
                        saveState,
                        (e_input) => {
                            const newSpeed = parseFloat(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === TIMELINE_GRID_TYPE) {
                                    n.timelineSpeed = newSpeed;
                                    if (n.audioParams) n.audioParams.timelineSpeed = newSpeed;
                                }
                            });
                            e_input.target.previousElementSibling.textContent = `Speed (${newSpeed.toFixed(1)}s / sweep):`;
                        },
                    );
                    section.appendChild(speedSliderContainer);
                }

                const MIN_TIMELINE_PIXEL_WIDTH = 50;
                const MAX_TIMELINE_PIXEL_WIDTH = 1200;
                const MIN_TIMELINE_PIXEL_HEIGHT = 50;
                const MAX_TIMELINE_PIXEL_HEIGHT = 800;
                const PIXEL_STEP = 10;

                const gridSpacing = calculateGridSpacing();
                const halfGridSquare =
                    isSnapEnabled && gridSpacing > 0.1 ? gridSpacing / 2 : 0;

                let widthSliderMin,
                    widthSliderMax,
                    widthSliderStep,
                    currentWidthInUnits,
                    widthLabelUnitText;
                const currentPixelWidth = node.width || TIMELINE_GRID_DEFAULT_WIDTH;

                if (isSnapEnabled && halfGridSquare > 0) {
                    widthSliderMin = Math.max(
                        1,
                        Math.round(MIN_TIMELINE_PIXEL_WIDTH / halfGridSquare),
                    );
                    widthSliderMax = Math.round(
                        MAX_TIMELINE_PIXEL_WIDTH / halfGridSquare,
                    );
                    widthSliderStep = 1;
                    currentWidthInUnits = Math.round(currentPixelWidth / halfGridSquare);
                    widthLabelUnitText = " units";
                } else {
                    widthSliderMin = MIN_TIMELINE_PIXEL_WIDTH;
                    widthSliderMax = MAX_TIMELINE_PIXEL_WIDTH;
                    widthSliderStep = PIXEL_STEP;
                    currentWidthInUnits = currentPixelWidth;
                    widthLabelUnitText = "px";
                }

                const widthDisplayValText =
                    isSnapEnabled && halfGridSquare > 0 ?
                    currentWidthInUnits.toFixed(0) :
                    currentPixelWidth.toFixed(0);
                const widthSliderContainer = createSlider(
                    `edit-timeline-width-${node.id}`,
                    `Width (${widthDisplayValText}${widthLabelUnitText}):`,
                    widthSliderMin,
                    widthSliderMax,
                    widthSliderStep,
                    currentWidthInUnits,
                    saveState,
                    (e_input) => {
                        const newSliderValue = parseFloat(e_input.target.value);
                        let newPixelWidth;
                        if (isSnapEnabled && halfGridSquare > 0) {
                            newPixelWidth = newSliderValue * halfGridSquare;
                            newPixelWidth = Math.max(
                                halfGridSquare,
                                Math.round(newPixelWidth / halfGridSquare) * halfGridSquare,
                            );
                        } else {
                            newPixelWidth = newSliderValue;
                        }
                        newPixelWidth = Math.max(MIN_TIMELINE_PIXEL_WIDTH, newPixelWidth);

                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE) {
                                n.width = newPixelWidth;
                                if (n.audioParams) n.audioParams.width = newPixelWidth;
                            }
                        });
                        const displayVal =
                            isSnapEnabled && halfGridSquare > 0 ?
                            (newPixelWidth / halfGridSquare).toFixed(0) :
                            newPixelWidth.toFixed(0);
                        const displayUnit =
                            isSnapEnabled && halfGridSquare > 0 ? " units" : "px";
                        e_input.target.previousElementSibling.textContent = `Width (${displayVal}${displayUnit}):`;
                    },
                );
                section.appendChild(widthSliderContainer);

                let heightSliderMin,
                    heightSliderMax,
                    heightSliderStep,
                    currentHeightInUnits,
                    heightLabelUnitText;
                const currentPixelHeight = node.height || TIMELINE_GRID_DEFAULT_HEIGHT;

                if (isSnapEnabled && halfGridSquare > 0) {
                    heightSliderMin = Math.max(
                        1,
                        Math.round(MIN_TIMELINE_PIXEL_HEIGHT / halfGridSquare),
                    );
                    heightSliderMax = Math.round(
                        MAX_TIMELINE_PIXEL_HEIGHT / halfGridSquare,
                    );
                    heightSliderStep = 1;
                    currentHeightInUnits = Math.round(
                        currentPixelHeight / halfGridSquare,
                    );
                    heightLabelUnitText = " units";
                } else {
                    heightSliderMin = MIN_TIMELINE_PIXEL_HEIGHT;
                    heightSliderMax = MAX_TIMELINE_PIXEL_HEIGHT;
                    heightSliderStep = PIXEL_STEP;
                    currentHeightInUnits = currentPixelHeight;
                    heightLabelUnitText = "px";
                }

                const heightDisplayValText =
                    isSnapEnabled && halfGridSquare > 0 ?
                    currentHeightInUnits.toFixed(0) :
                    currentPixelHeight.toFixed(0);
                const heightSliderContainer = createSlider(
                    `edit-timeline-height-${node.id}`,
                    `Height (${heightDisplayValText}${heightLabelUnitText}):`,
                    heightSliderMin,
                    heightSliderMax,
                    heightSliderStep,
                    currentHeightInUnits,
                    saveState,
                    (e_input) => {
                        const newSliderValue = parseFloat(e_input.target.value);
                        let newPixelHeight;
                        if (isSnapEnabled && halfGridSquare > 0) {
                            newPixelHeight = newSliderValue * halfGridSquare;
                            newPixelHeight = Math.max(
                                halfGridSquare,
                                Math.round(newPixelHeight / halfGridSquare) * halfGridSquare,
                            );
                        } else {
                            newPixelHeight = newSliderValue;
                        }
                        newPixelHeight = Math.max(
                            MIN_TIMELINE_PIXEL_HEIGHT,
                            newPixelHeight,
                        );

                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE) {
                                n.height = newPixelHeight;
                                if (n.audioParams) n.audioParams.height = newPixelHeight;
                            }
                        });
                        const displayVal =
                            isSnapEnabled && halfGridSquare > 0 ?
                            (newPixelHeight / halfGridSquare).toFixed(0) :
                            newPixelHeight.toFixed(0);
                        const displayUnit =
                            isSnapEnabled && halfGridSquare > 0 ? " units" : "px";
                        e_input.target.previousElementSibling.textContent = `Height (${displayVal}${displayUnit}):`;
                    },
                );
                section.appendChild(heightSliderContainer);

                const currentRotationDeg = ((node.audioParams?.rotation || 0) * 180 / Math.PI).toFixed(0);
                const rotationSliderContainer = createSlider(
                    `edit-timeline-rotation-${node.id}`,
                    `Rotation (${currentRotationDeg}°):`,
                    -180,
                    180,
                    1,
                    parseFloat(currentRotationDeg),
                    saveState,
                    (e_input) => {
                        const newDeg = parseFloat(e_input.target.value);
                        const newRad = (newDeg * Math.PI) / 180;
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE) {
                                if(!n.audioParams) n.audioParams = {};
                                n.audioParams.rotation = newRad;
                                n.rotation = newRad;
                            }
                        });
                        e_input.target.previousElementSibling.textContent = `Rotation (${newDeg}°):`;
                    },
                );
                section.appendChild(rotationSliderContainer);

                const rotationBtnContainer = document.createElement('div');
                rotationBtnContainer.style.display = 'flex';
                rotationBtnContainer.style.gap = '5px';

                const resetRotBtn = document.createElement('button');
                resetRotBtn.textContent = 'Reset Rotation';
                resetRotBtn.classList.add('panel-button-like');
                resetRotBtn.addEventListener('click', () => {
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if(n && n.type === TIMELINE_GRID_TYPE){
                            n.rotation = 0;
                            if(n.audioParams) n.audioParams.rotation = 0;
                        }
                    });
                    saveState();
                    populateEditPanel();
                });
                rotationBtnContainer.appendChild(resetRotBtn);

                const rotLeftBtn = document.createElement('button');
                rotLeftBtn.textContent = '⟲90°';
                rotLeftBtn.classList.add('panel-button-like');
                rotLeftBtn.addEventListener('click', () => {
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if(n && n.type === TIMELINE_GRID_TYPE){
                            let r = (n.audioParams?.rotation || 0) - Math.PI/2;
                            n.rotation = r;
                            if(n.audioParams) n.audioParams.rotation = r;
                        }
                    });
                    saveState();
                    populateEditPanel();
                });
                rotationBtnContainer.appendChild(rotLeftBtn);

                const rotRightBtn = document.createElement('button');
                rotRightBtn.textContent = '90°⟳';
                rotRightBtn.classList.add('panel-button-like');
                rotRightBtn.addEventListener('click', () => {
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if(n && n.type === TIMELINE_GRID_TYPE){
                            let r = (n.audioParams?.rotation || 0) + Math.PI/2;
                            n.rotation = r;
                            if(n.audioParams) n.audioParams.rotation = r;
                        }
                    });
                    saveState();
                    populateEditPanel();
                });
                rotationBtnContainer.appendChild(rotRightBtn);

                section.appendChild(rotationBtnContainer);
                const currentPulseIntensity =
                    node.timelinePulseIntensity || TIMELINE_GRID_DEFAULT_PULSE_INTENSITY;
                const intensityVal = currentPulseIntensity.toFixed(2);
                const intensitySliderContainer = createSlider(
                    `edit-timeline-intensity-${node.id}`,
                    `Trigger Intensity (${intensityVal}):`,
                    0.1,
                    1.5,
                    0.01,
                    currentPulseIntensity,
                    saveState,
                    (e_input) => {
                        const newIntensity = parseFloat(e_input.target.value);
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE) {
                                n.timelinePulseIntensity = newIntensity;
                                if (n.audioParams)
                                    n.audioParams.timelinePulseIntensity = newIntensity;
                            }
                        });
                        e_input.target.previousElementSibling.textContent = `Trigger Intensity (${newIntensity.toFixed(2)}):`;
                    },
                );
                section.appendChild(intensitySliderContainer);

                const internalGridSection = document.createElement("div");
                internalGridSection.classList.add("panel-section");
                internalGridSection.style.borderTop = "1px solid var(--button-hover)";
                internalGridSection.style.marginTop = "10px";
                internalGridSection.style.paddingTop = "10px";

                const showInternalGridLabel = document.createElement("label");
                showInternalGridLabel.textContent = "Show Internal Grid: ";
                const showInternalGridCheckbox = document.createElement("input");
                showInternalGridCheckbox.type = "checkbox";
                showInternalGridCheckbox.checked =
                    node.showInternalGrid !== undefined ? node.showInternalGrid : true;
                showInternalGridCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE) {
                            n.showInternalGrid = e.target.checked;
                            if (n.audioParams)
                                n.audioParams.showInternalGrid = n.showInternalGrid;
                        }
                    });
                    saveState();
                });
                internalGridSection.appendChild(showInternalGridLabel);
                internalGridSection.appendChild(showInternalGridCheckbox);
                internalGridSection.appendChild(document.createElement("br"));

                const snapToInternalGridLabel = document.createElement("label");
                snapToInternalGridLabel.textContent = "Snap Nodes to Internal Grid: ";
                const snapToInternalGridCheckbox = document.createElement("input");
                snapToInternalGridCheckbox.type = "checkbox";
                snapToInternalGridCheckbox.checked =
                    node.snapToInternalGrid !== undefined ?
                    node.snapToInternalGrid :
                    true;
                snapToInternalGridCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE) {
                            n.snapToInternalGrid = e.target.checked;
                            if (n.audioParams)
                                n.audioParams.snapToInternalGrid = n.snapToInternalGrid;
                        }
                    });
                    saveState();
                });
                internalGridSection.appendChild(snapToInternalGridLabel);
                internalGridSection.appendChild(snapToInternalGridCheckbox);
                internalGridSection.appendChild(document.createElement("br"));

                const currentDivisions = node.internalGridDivisions || 8;
                const divisionsLabel = document.createElement("label");
                divisionsLabel.htmlFor = `edit-timeline-divisions-select-${node.id}`;
                divisionsLabel.textContent = "Internal Grid Subdivisions:";
                internalGridSection.appendChild(divisionsLabel);

                const divisionsSelect = document.createElement("select");
                divisionsSelect.id = `edit-timeline-divisions-select-${node.id}`;
                const divisionOptions = [
                    { label: "None (1)", value: 1 }, { label: "Halves (2)", value: 2 },
                    { label: "Thirds (3)", value: 3 }, { label: "Quarters (4)", value: 4 },
                    { label: "Sixths (6)", value: 6 }, { label: "Eighths (8)", value: 8 },
                    { label: "Twelfths (12 - triplets)", value: 12 }, { label: "Sixteenths (16)", value: 16 },
                    { label: "24ths (16th triplets)", value: 24 }, { label: "32nds (32)", value: 32 },
                    { label: "64ths (64)", value: 64 },
                ];
                let currentDivisionValueForSelect = node.internalGridDivisions || 8;
                divisionOptions.forEach((opt) => {
                    const optionEl = document.createElement("option");
                    optionEl.value = opt.value;
                    optionEl.textContent = opt.label;
                    if (parseInt(opt.value) === parseInt(currentDivisionValueForSelect)) {
                        optionEl.selected = true;
                    }
                    divisionsSelect.appendChild(optionEl);
                });
                divisionsSelect.addEventListener("change", (e) => {
                    const newDivisions = parseInt(e.target.value);
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE) {
                            n.internalGridDivisions = newDivisions;
                            if (n.audioParams)
                                n.audioParams.internalGridDivisions = newDivisions;
                        }
                    });
                    saveState();
                });
                internalGridSection.appendChild(divisionsSelect);
                section.appendChild(internalGridSection);

                const transposeSection = document.createElement("div");
                transposeSection.classList.add("panel-section");
                transposeSection.style.borderTop = "1px solid var(--button-hover)";
                transposeSection.style.marginTop = "10px";
                transposeSection.style.paddingTop = "10px";
                transposeSection.innerHTML = "<p><strong>Timeline Transposition:</strong></p>";

                const enableTransposeLabel = document.createElement("label");
                enableTransposeLabel.htmlFor = `edit-timeline-transpose-enable-${node.id}`;
                enableTransposeLabel.textContent = "Enable Transposition: ";
                const enableTransposeCheckbox = document.createElement("input");
                enableTransposeCheckbox.type = "checkbox";
                enableTransposeCheckbox.id = `edit-timeline-transpose-enable-${node.id}`;
                enableTransposeCheckbox.checked =
                    node.audioParams?.isTransposeEnabled || false;
                enableTransposeCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                            n.audioParams.isTransposeEnabled = e.target.checked;
                        }
                    });
                    saveState();
                    populateEditPanel();
                });
                transposeSection.appendChild(enableTransposeLabel);
                transposeSection.appendChild(enableTransposeCheckbox);
                transposeSection.appendChild(document.createElement("br"));

                if (node.audioParams?.isTransposeEnabled) {
                    const directionContainer = document.createElement("div");
                    directionContainer.style.marginBottom = "5px";
                    const directionLabel = document.createElement("label");
                    directionLabel.textContent = "Direction: ";
                    directionLabel.style.marginRight = "5px";
                    directionContainer.appendChild(directionLabel);

                    const plusButton = document.createElement("button");
                    plusButton.textContent = "+";
                    plusButton.classList.add("panel-button-like");
                    if (node.audioParams.transposeDirection === "+") {
                        plusButton.classList.add("active");
                    }
                    plusButton.addEventListener("click", () => {
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                                n.audioParams.transposeDirection = "+";
                            }
                        });
                        saveState();
                        populateEditPanel();
                    });
                    directionContainer.appendChild(plusButton);

                    const minusButton = document.createElement("button");
                    minusButton.textContent = "-";
                    minusButton.classList.add("panel-button-like");
                    if (node.audioParams.transposeDirection === "-") {
                        minusButton.classList.add("active");
                    }
                    minusButton.addEventListener("click", () => {
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                                n.audioParams.transposeDirection = "-";
                            }
                        });
                        saveState();
                        populateEditPanel();
                    });
                    directionContainer.appendChild(minusButton);
                    transposeSection.appendChild(directionContainer);

                    const currentTransposeAmount = node.audioParams.transposeAmount || 0;
                    const amountSliderContainer = createSlider(
                        `edit-timeline-transpose-amount-${node.id}`,
                        `Amount (${currentTransposeAmount} scale steps):`,
                        0,
                        24,
                        1,
                        currentTransposeAmount,
                        () => {
                            saveState();
                        },
                        (e_input) => {
                            const newAmount = parseInt(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                                    n.audioParams.transposeAmount = newAmount;
                                }
                            });
                            const labelElement = e_input.target.previousElementSibling;
                            if (labelElement) {
                                labelElement.textContent = `Amount (${newAmount} scale steps):`;
                            }
                        },
                    );
                    transposeSection.appendChild(amountSliderContainer);
                }
                section.appendChild(transposeSection);

                const autoRotateSection = document.createElement("div");
                autoRotateSection.classList.add("panel-section");
                autoRotateSection.style.borderTop = "1px solid var(--button-hover)";
                autoRotateSection.style.marginTop = "10px";
                autoRotateSection.style.paddingTop = "10px";
                autoRotateSection.innerHTML = "<p><strong>Timeline Auto-Rotation:</strong></p>";

                const enableAutoRotateLabel = document.createElement("label");
                enableAutoRotateLabel.htmlFor = `edit-timeline-autorotate-enable-${node.id}`;
                enableAutoRotateLabel.textContent = "Enable Auto-Rotate: ";
                const enableAutoRotateCheckbox = document.createElement("input");
                enableAutoRotateCheckbox.type = "checkbox";
                enableAutoRotateCheckbox.id = `edit-timeline-autorotate-enable-${node.id}`;
                enableAutoRotateCheckbox.checked = node.audioParams?.autoRotateEnabled ?? TIMELINE_GRID_DEFAULT_AUTO_ROTATE_ENABLED;
                enableAutoRotateCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                            n.audioParams.autoRotateEnabled = e.target.checked;
                        }
                    });
                    saveState();
                    populateEditPanel();
                });
                autoRotateSection.appendChild(enableAutoRotateLabel);
                autoRotateSection.appendChild(enableAutoRotateCheckbox);
                autoRotateSection.appendChild(document.createElement("br"));

                if (node.audioParams?.autoRotateEnabled) {
                    const directionRotateLabel = document.createElement("label");
                    directionRotateLabel.htmlFor = `edit-timeline-autorotate-direction-${node.id}`;
                    directionRotateLabel.textContent = "Direction: ";
                    autoRotateSection.appendChild(directionRotateLabel);

                    const directionRotateSelect = document.createElement("select");
                    directionRotateSelect.id = `edit-timeline-autorotate-direction-${node.id}`;
                    ["clockwise", "counter-clockwise"].forEach(dir => {
                        const option = document.createElement("option");
                        option.value = dir;
                        option.textContent = dir.charAt(0).toUpperCase() + dir.slice(1);
                        if (dir === (node.audioParams?.autoRotateDirection ?? TIMELINE_GRID_DEFAULT_AUTO_ROTATE_DIRECTION)) {
                            option.selected = true;
                        }
                        directionRotateSelect.appendChild(option);
                    });
                    directionRotateSelect.addEventListener("change", (e) => {
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                                n.audioParams.autoRotateDirection = e.target.value;
                            }
                        });
                        saveState();
                    });
                    autoRotateSection.appendChild(directionRotateSelect);
                    autoRotateSection.appendChild(document.createElement("br"));

                    if (isGlobalSyncEnabled) {
                        const syncSpeedLabel = document.createElement("label");
                        syncSpeedLabel.htmlFor = `edit-timeline-autorotate-syncspeed-${node.id}`;
                        syncSpeedLabel.textContent = "Synced Speed (Full Rotation per):";
                        autoRotateSection.appendChild(syncSpeedLabel);

                        const syncSpeedSelect = document.createElement("select");
                        syncSpeedSelect.id = `edit-timeline-autorotate-syncspeed-${node.id}`;

                        const syncSubdivisionForRotation = [
                            { label: "1/8 Note", originalIndex: 2 },
                            { label: "1/4 Note", originalIndex: 4 },
                            { label: "1/2 Note", originalIndex: 6 },
                            { label: "1 Beat", originalIndex: 8 },
                            { label: "2 Beats", originalIndex: 9 },
                            { label: "1 Bar", originalIndex: 10 },
                            { label: "2 Bars", originalIndex: 10, multiplier: 2 },
                            { label: "4 Bars", originalIndex: 10, multiplier: 4 },
                            { label: "8 Bars", originalIndex: 10, multiplier: 8 },
                        ];

                        syncSubdivisionForRotation.forEach((opt, pseudoIndex) => {
                            const optionEl = document.createElement("option");
                            optionEl.value = pseudoIndex;
                            optionEl.textContent = opt.label;
                            if (pseudoIndex === (node.audioParams?.autoRotateSyncSubdivisionIndex ?? TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SYNC_SUBDIVISION_INDEX)) {
                                optionEl.selected = true;
                            }
                            syncSpeedSelect.appendChild(optionEl);
                        });
                        syncSpeedSelect.addEventListener("change", (e) => {
                            const newPseudoIndex = parseInt(e.target.value, 10);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                                    n.audioParams.autoRotateSyncSubdivisionIndex = newPseudoIndex;
                                }
                            });
                            saveState();
                        });
                        autoRotateSection.appendChild(syncSpeedSelect);

                    } else {
                        const currentManualSpeed = node.audioParams?.autoRotateSpeedManual ?? TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SPEED_MANUAL;
                        const speedValManual = currentManualSpeed.toFixed(4);
                        const speedManualSlider = createSlider(
                            `edit-timeline-autorotate-speedmanual-${node.id}`,
                            `Manual Speed (${speedValManual} rad/update):`,
                            0.0001, 0.02, 0.0001, currentManualSpeed,
                            saveState,
                            (e_input) => {
                                const newSpeed = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n && n.type === TIMELINE_GRID_TYPE && n.audioParams) {
                                        n.audioParams.autoRotateSpeedManual = newSpeed;
                                    }
                                });
                                e_input.target.previousElementSibling.textContent = `Manual Speed (${newSpeed.toFixed(4)} rad/update):`;
                            }
                        );
                        autoRotateSection.appendChild(speedManualSlider);
                    }
                }
                section.appendChild(autoRotateSection);
                fragment.appendChild(section);

            } else if (node && (node.type === SPACERADAR_TYPE || node.type === CRANK_RADAR_TYPE)) {
                const section = document.createElement("div");
                section.classList.add("panel-section");

                const crankLabel = document.createElement("label");
                crankLabel.textContent = "Crank Mode:";
                const crankToggle = document.createElement("input");
                crankToggle.type = "checkbox";
                crankToggle.checked = node.type === CRANK_RADAR_TYPE;
                crankToggle.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if (n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE)) {
                            n.type = e.target.checked ? CRANK_RADAR_TYPE : SPACERADAR_TYPE;
                            n.radarIsPlaying = n.type === SPACERADAR_TYPE;
                            if (n.audioParams) n.audioParams.radarIsPlaying = n.radarIsPlaying;
                        }
                    });
                    saveState();
                    populateEditPanel();
                });
                section.appendChild(crankLabel);
                section.appendChild(crankToggle);
                section.appendChild(document.createElement("br"));

                const playLabel = document.createElement("label");
                playLabel.htmlFor = `edit-radar-playing-${node.id}`;
                playLabel.textContent = "Playing:";
                section.appendChild(playLabel);
                const playCheckbox = document.createElement("input");
                playCheckbox.type = "checkbox";
                playCheckbox.id = `edit-radar-playing-${node.id}`;
                playCheckbox.checked = node.radarIsPlaying;
                playCheckbox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                            n.radarIsPlaying = e.target.checked;
                            if (n.audioParams) n.audioParams.radarIsPlaying = n.radarIsPlaying;
                        }
                    });
                    saveState();
                });
                section.appendChild(playCheckbox);
                section.appendChild(document.createElement("br"));

                if (isGlobalSyncEnabled) {
                    const durLabel = document.createElement("label");
                    durLabel.htmlFor = `edit-radar-duration-bars-${node.id}`;
                    durLabel.textContent = "Duration (Bars):";
                    section.appendChild(durLabel);
                    const durSelect = document.createElement("select");
                    durSelect.id = `edit-radar-duration-bars-${node.id}`;
                    const barOpts = [
                        { label: "1/4", value: 0.25 },
                        { label: "1/2", value: 0.5 },
                        { label: "1", value: 1 },
                        { label: "2", value: 2 },
                        { label: "4", value: 4 },
                        { label: "8", value: 8 },
                    ];
                    let curBars = node.radarMusicalDurationBars || SPACERADAR_DEFAULT_MUSICAL_BARS;
                    barOpts.forEach((opt) => {
                        const optionEl = document.createElement("option");
                        optionEl.value = opt.value;
                        optionEl.textContent = opt.label;
                        if (parseFloat(opt.value) === parseFloat(curBars)) optionEl.selected = true;
                        durSelect.appendChild(optionEl);
                    });
                    durSelect.addEventListener("change", (e) => {
                        const newBars = parseFloat(e.target.value);
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                                n.radarMusicalDurationBars = newBars;
                                if (n.audioParams) n.audioParams.radarMusicalDurationBars = newBars;
                            }
                        });
                        saveState();
                    });
                    section.appendChild(durSelect);
                } else {
                    const curSpeed = node.radarSpeed || SPACERADAR_DEFAULT_SPEED;
                    const speedSlider = createSlider(
                        `edit-radar-speed-${node.id}`,
                        `Speed (${curSpeed.toFixed(1)}s):`,
                        0.2,
                        30,
                        0.1,
                        curSpeed,
                        saveState,
                        (e_input) => {
                            const newSpeed = parseFloat(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                                    n.radarSpeed = newSpeed;
                                    if (n.audioParams) n.audioParams.radarSpeed = newSpeed;
                                }
                            });
                            e_input.target.previousElementSibling.textContent = `Speed (${newSpeed.toFixed(1)}s):`;
                        }
                    );
                    section.appendChild(speedSlider);
                }

                const radiusSlider = createSlider(
                    `edit-radar-radius-${node.id}`,
                    `Radius (${Math.round(node.radius)}):`,
                    30,
                    600,
                    1,
                    node.radius,
                    saveState,
                    (e_input) => {
                        const newR = parseFloat(e_input.target.value);
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                                n.radius = newR;
                                if (n.audioParams) n.audioParams.radius = newR;
                            }
                        });
                        e_input.target.previousElementSibling.textContent = `Radius (${Math.round(newR)}):`;
                    }
                );
                section.appendChild(radiusSlider);

                const curIntensity =
                    node.radarPulseIntensity ?? SPACERADAR_DEFAULT_PULSE_INTENSITY;
                const intensitySlider = createSlider(
                    `edit-radar-intensity-${node.id}`,
                    `Pulse Intensity (${curIntensity.toFixed(2)}):`,
                    MIN_PULSE_INTENSITY,
                    MAX_PULSE_INTENSITY,
                    0.01,
                    curIntensity,
                    saveState,
                    (e_input) => {
                        const newVal = parseFloat(e_input.target.value);
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE)) {
                                n.radarPulseIntensity = newVal;
                                if (n.audioParams) n.audioParams.radarPulseIntensity = newVal;
                            }
                        });
                        e_input.target.previousElementSibling.textContent = `Pulse Intensity (${newVal.toFixed(2)}):`;
                    }
                );
                section.appendChild(intensitySlider);

                if (node.type === CRANK_RADAR_TYPE) {
                    const curForce = node.pulseForce || PULSE_FORCE_DEFAULT;
                    const forceSlider = createSlider(
                        `edit-radar-pulseforce-${node.id}`,
                        `Pulse Force (${curForce.toFixed(2)}):`,
                        0.1,
                        3.0,
                        0.1,
                        curForce,
                        saveState,
                        (e_input) => {
                            const newForce = parseFloat(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === CRANK_RADAR_TYPE) {
                                    n.pulseForce = newForce;
                                    if (n.audioParams) n.audioParams.pulseForce = newForce;
                                }
                            });
                            e_input.target.previousElementSibling.textContent = `Pulse Force (${newForce.toFixed(2)}):`;
                        }
                    );
                    section.appendChild(forceSlider);

                    const curDecay = node.pulseDecay || PULSE_DECAY_DEFAULT;
                    const decaySlider = createSlider(
                        `edit-radar-pulsedecay-${node.id}`,
                        `Pulse Decay (${curDecay.toFixed(2)}):`,
                        0.1,
                        2.0,
                        0.05,
                        curDecay,
                        saveState,
                        (e_input) => {
                            const newDecay = parseFloat(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === CRANK_RADAR_TYPE) {
                                    n.pulseDecay = newDecay;
                                    if (n.audioParams) n.audioParams.pulseDecay = newDecay;
                                }
                            });
                            e_input.target.previousElementSibling.textContent = `Pulse Decay (${newDecay.toFixed(2)}):`;
                        }
                    );
                    section.appendChild(decaySlider);
                }

                const modeLabel = document.createElement("label");
                modeLabel.textContent = "Mode:";
                const modeSelect = document.createElement("select");
                [
                    { val: SPACERADAR_MODE_NORMAL, text: "Normal" },
                    { val: SPACERADAR_MODE_REVERSE, text: "Reverse Sweep" },
                ].forEach(opt => {
                    const o = document.createElement("option");
                    o.value = opt.val;
                    o.textContent = opt.text;
                    if ((node.radarMode || SPACERADAR_DEFAULT_MODE) === opt.val) o.selected = true;
                    modeSelect.appendChild(o);
                });
                modeSelect.addEventListener("change", e => {
                    selectedArray.forEach(el => {
                        const n = findNodeById(el.id);
                        if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                            n.radarMode = e.target.value;
                            if (n.audioParams) n.audioParams.radarMode = n.radarMode;
                        }
                    });
                    saveState();
                });
                section.appendChild(modeLabel);
                section.appendChild(modeSelect);
                section.appendChild(document.createElement("br"));

                const gridSection = document.createElement("div");
                gridSection.classList.add("panel-section");
                gridSection.style.borderTop = "1px solid var(--button-hover)";
                gridSection.style.marginTop = "10px";
                gridSection.style.paddingTop = "10px";

                const showLabel = document.createElement("label");
                showLabel.textContent = "Show Internal Grid: ";
                const showBox = document.createElement("input");
                showBox.type = "checkbox";
                showBox.checked = node.showInternalGrid !== undefined ? node.showInternalGrid : true;
                showBox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                            n.showInternalGrid = e.target.checked;
                            if (n.audioParams) n.audioParams.showInternalGrid = n.showInternalGrid;
                        }
                    });
                    saveState();
                });
                gridSection.appendChild(showLabel);
                gridSection.appendChild(showBox);
                gridSection.appendChild(document.createElement("br"));

                const snapLabel = document.createElement("label");
                snapLabel.textContent = "Snap Nodes to Internal Grid: ";
                const snapBox = document.createElement("input");
                snapBox.type = "checkbox";
                snapBox.checked = node.snapToInternalGrid !== undefined ? node.snapToInternalGrid : true;
                snapBox.addEventListener("change", (e) => {
                    selectedArray.forEach((elData) => {
                        const n = findNodeById(elData.id);
                        if ((n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE))) {
                            n.snapToInternalGrid = e.target.checked;
                            if (n.audioParams) n.audioParams.snapToInternalGrid = n.snapToInternalGrid;
                        }
                    });
                    saveState();
                });
                gridSection.appendChild(snapLabel);
                gridSection.appendChild(snapBox);
                gridSection.appendChild(document.createElement("br"));

                const divLabel = document.createElement("label");
                divLabel.textContent = "Internal Divisions:";
                const divSelect = document.createElement("select");
                const divOpts = [1,2,3,4,6,8,12,16,24,32,64];
                let curDiv = node.internalGridDivisions || 8;
                divOpts.forEach((val)=>{
                    const optEl = document.createElement("option");
                    optEl.value = val;
                    optEl.textContent = val.toString();
                    if (val === curDiv) optEl.selected = true;
                    divSelect.appendChild(optEl);
                });
                divSelect.addEventListener("change", (e)=>{
                    const newDiv = parseInt(e.target.value,10);
                    selectedArray.forEach((elData)=>{
                        const n = findNodeById(elData.id);
                        if(n && (n.type === SPACERADAR_TYPE || n.type === CRANK_RADAR_TYPE)){
                            n.internalGridDivisions = newDiv;
                            if(n.audioParams) n.audioParams.internalGridDivisions = newDiv;
                        }
                    });
                    saveState();
                });
                gridSection.appendChild(divLabel);
                gridSection.appendChild(divSelect);
                section.appendChild(gridSection);

                fragment.appendChild(section);

            } else if (node && node.type === "global_key_setter") {
                const keySetterSection = document.createElement("div");
                keySetterSection.classList.add("panel-section");

                const modeDiv = document.createElement("div");
                modeDiv.style.marginBottom = "10px";
                const modeLabel = document.createElement("label");
                modeLabel.textContent = "Mode: ";
                modeDiv.appendChild(modeLabel);

                const modes = ["key", "offset"];
                modes.forEach(modeValue => {
                    const radioLabel = document.createElement("label");
                    radioLabel.style.marginRight = "10px";
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = `keysetter-mode-${node.id}`;
                    radio.value = modeValue;
                    radio.checked = (node.audioParams.keySetterMode || "key") === modeValue;
                    radio.addEventListener("change", (e) => {
                        if (e.target.checked) {
                            selectedArray.forEach(el => {
                                const n = findNodeById(el.id);
                                if (n && n.type === "global_key_setter") n.audioParams.keySetterMode = e.target.value;
                            });
                            saveState();
                            populateEditPanel();
                        }
                    });
                    radioLabel.appendChild(radio);
                    radioLabel.appendChild(document.createTextNode(" " + modeValue.charAt(0).toUpperCase() + modeValue.slice(1)));
                    modeDiv.appendChild(radioLabel);
                });
                keySetterSection.appendChild(modeDiv);

                if ((node.audioParams.keySetterMode || "key") === "key") {
                    const keySelectLabel = document.createElement("label");
                    keySelectLabel.htmlFor = `edit-keysetter-key-${node.id}`;
                    keySelectLabel.textContent = "Target Key for Project Root (C):";
                    keySetterSection.appendChild(keySelectLabel);

                    const keySelect = document.createElement("select");
                    keySelect.id = `edit-keysetter-key-${node.id}`;
                    NOTE_NAMES.forEach((name, index) => {
                        const option = document.createElement("option");
                        option.value = index;
                        option.textContent = name;
                        if ((node.audioParams.targetKeyNote || 0) === index) {
                            option.selected = true;
                        }
                        keySelect.appendChild(option);
                    });
                    keySelect.addEventListener("change", (e) => {
                        const newKeyNote = parseInt(e.target.value);
                        selectedArray.forEach(el => {
                            const n = findNodeById(el.id);
                            if (n && n.type === "global_key_setter") n.audioParams.targetKeyNote = newKeyNote;
                        });
                        saveState();
                    });
                    keySetterSection.appendChild(keySelect);

                } else {
                    const currentOffset = node.audioParams.targetTransposeOffset || 0;
                    const offsetSliderContainer = createSlider(
                        `edit-keysetter-offset-${node.id}`,
                        `Target Global Transpose (${currentOffset > 0 ? '+' : ''}${currentOffset} st):`,
                        -24, 24, 1, currentOffset,
                        saveState,
                        (e_input) => {
                            const newOffset = parseInt(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === "global_key_setter" && n.audioParams) {
                                    n.audioParams.targetTransposeOffset = newOffset;
                                }
                            });
                            e_input.target.previousElementSibling.textContent = `Target Global Transpose (${newOffset > 0 ? '+' : ''}${newOffset} st):`;
                        }
                    );
                    keySetterSection.appendChild(offsetSliderContainer);
                }
                fragment.appendChild(keySetterSection);

            } else if (node && node.type === CANVAS_SEND_ORB_TYPE) {
                const section = document.createElement('div');
                section.classList.add('panel-section');

                const targetLabel = document.createElement('label');
                targetLabel.textContent = 'Target Canvas: ';
                targetLabel.htmlFor = `edit-canvas-target-${node.id}`;
                section.appendChild(targetLabel);

                const targetSelect = document.createElement('select');
                targetSelect.id = `edit-canvas-target-${node.id}`;
                canvases.forEach((c, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx;
                    opt.textContent = `Canvas ${idx + 1}`;
                    if (idx === (node.targetCanvasIndex || 0)) opt.selected = true;
                    targetSelect.appendChild(opt);
                });
                targetSelect.addEventListener('change', (e) => {
                    const newIndex = parseInt(e.target.value, 10);
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === CANVAS_SEND_ORB_TYPE) n.targetCanvasIndex = newIndex;
                    });
                    saveState();
                });
                section.appendChild(targetSelect);

                const receiverLabel = document.createElement('label');
                receiverLabel.textContent = ' Receiver:';
                receiverLabel.htmlFor = `edit-canvas-receiver-${node.id}`;
                receiverLabel.style.marginLeft = '10px';
                section.appendChild(receiverLabel);

                const receiverSelect = document.createElement('select');
                receiverSelect.id = `edit-canvas-receiver-${node.id}`;
                const noneOpt = document.createElement('option');
                noneOpt.value = '';
                noneOpt.textContent = 'None';
                if (!node.receiverId) noneOpt.selected = true;
                receiverSelect.appendChild(noneOpt);

                const allReceivers = [];
                nodes.forEach(nd => {
                    if (nd.type === CANVAS_RECEIVE_ORB_TYPE) {
                        allReceivers.push({ node: nd, canvas: getCurrentCanvasIndex ? getCurrentCanvasIndex() : 0 });
                    }
                });
                canvasStates.forEach((state, idx) => {
                    if (!state || !state.nodes) return;
                    state.nodes.forEach(nd => {
                        if (nd.type === CANVAS_RECEIVE_ORB_TYPE) {
                            allReceivers.push({ node: nd, canvas: idx });
                        }
                    });
                });

                allReceivers.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.node.id;
                    opt.textContent = `Canvas ${r.canvas + 1} - Receive #${r.node.id}`;
                    if (r.node.id === node.receiverId) opt.selected = true;
                    receiverSelect.appendChild(opt);
                });
                receiverSelect.addEventListener('change', (e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    selectedArray.forEach(elData => {
                        const n = findNodeById(elData.id);
                        if (n && n.type === CANVAS_SEND_ORB_TYPE) n.receiverId = val;
                    });
                    saveState();
                });
                section.appendChild(receiverSelect);

                fragment.appendChild(section);

            } else if (node && node.audioParams) {
                let sectionCreatedForThisType = false;
                let currentSection;

                if (isPulsarType(node.type) || node.type === "sound" || isDrumType(node.type) || node.type === PRORB_TYPE ) {
                    currentSection = document.createElement("div");
                    currentSection.classList.add("panel-section");
                    sectionCreatedForThisType = true;

                    const syncIgnoreSection = document.createElement("div");
                    syncIgnoreSection.classList.add("panel-section");
                    const ignoreSyncLabel = document.createElement("label");
                    ignoreSyncLabel.htmlFor = `edit-node-ignore-sync-${node.id}`;
                    ignoreSyncLabel.textContent = "Ignore Global Sync:";
                    ignoreSyncLabel.style.marginRight = "5px";
                    syncIgnoreSection.appendChild(ignoreSyncLabel);
                    const ignoreSyncCheckbox = document.createElement("input");
                    ignoreSyncCheckbox.type = "checkbox";
                    ignoreSyncCheckbox.id = `edit-node-ignore-sync-${node.id}`;
                    ignoreSyncCheckbox.checked =
                        node.audioParams.ignoreGlobalSync || false;
                    ignoreSyncCheckbox.addEventListener("change", (e) => {
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.audioParams) {
                                n.audioParams.ignoreGlobalSync = e.target.checked;
                                if (isPulsarType(n.type)) {
                                    n.lastTriggerTime = -1;
                                    n.nextSyncTriggerTime = 0;
                                }
                            }
                        });
                        identifyAndRouteAllGroups();
                        saveState();
                        populateEditPanel();
                    });
                    syncIgnoreSection.appendChild(ignoreSyncCheckbox);
                    currentSection.appendChild(syncIgnoreSection);
                } else {
                    currentSection = document.createElement("div");
                    currentSection.classList.add("panel-section");
                    sectionCreatedForThisType = true;
                }

                if (isPulsarType(node.type)) {
                    const enableLabel = document.createElement("label");
                    enableLabel.htmlFor = `edit-pulsar-enable-${node.id}`;
                    enableLabel.textContent =
                        node.type === "pulsar_triggerable" ? "Current State:" : "Enabled:";
                    currentSection.appendChild(enableLabel);
                    const enableCheckbox = document.createElement("input");
                    enableCheckbox.type = "checkbox";
                    enableCheckbox.id = `edit-pulsar-enable-${node.id}`;
                    enableCheckbox.checked = node.isEnabled;
                    enableCheckbox.disabled =
                        selectedArray.length > 1 && node.type === "pulsar_triggerable";
                    enableCheckbox.addEventListener("change", () => {
                        handlePulsarTriggerToggle(node);
                        identifyAndRouteAllGroups();
                    });
                    currentSection.appendChild(enableCheckbox);
                    currentSection.appendChild(document.createElement("br"));
                    const showSyncControls =
                        isGlobalSyncEnabled && !node.audioParams.ignoreGlobalSync;
                    if (
                        node.type !== "pulsar_random_particles" &&
                        node.type !== "pulsar_manual"
                    ) {
                        if (showSyncControls) {
                            const subdivLabel = document.createElement("label");
                            subdivLabel.htmlFor = `edit-pulsar-subdiv-${node.id}`;
                            subdivLabel.textContent = "Sync Subdivision:";
                            currentSection.appendChild(subdivLabel);
                            const subdivSelect = document.createElement("select");
                            subdivSelect.id = `edit-pulsar-subdiv-${node.id}`;
                            subdivSelect.disabled = selectedArray.length > 1;
                            subdivisionOptions.forEach((opt, index) => {
                                const option = document.createElement("option");
                                option.value = index;
                                option.textContent = opt.label;
                                if (
                                    index ===
                                    (node.audioParams.syncSubdivisionIndex ??
                                        DEFAULT_SUBDIVISION_INDEX)
                                )
                                    option.selected = true;
                                subdivSelect.appendChild(option);
                            });
                            subdivSelect.addEventListener("change", (e) => {
                                const newIndex = parseInt(e.target.value, 10);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (
                                        n &&
                                        n.audioParams &&
                                        isPulsarType(n.type) &&
                                        n.type !== "pulsar_random_particles" &&
                                        n.type !== "pulsar_manual"
                                    ) {
                                        n.audioParams.syncSubdivisionIndex = newIndex;
                                        if (n.syncSubdivisionIndex !== undefined)
                                            n.syncSubdivisionIndex = newIndex;
                                        n.nextSyncTriggerTime = 0;
                                    }
                                });
                                identifyAndRouteAllGroups();
                                saveState();
                            });
                            currentSection.appendChild(subdivSelect);
                        } else {
                            const currentInterval =
                                node.audioParams?.triggerInterval ?? DEFAULT_TRIGGER_INTERVAL;
                            const intervalVal = currentInterval.toFixed(1);
                            const intervalSliderContainer = createSlider(
                                `edit-pulsar-interval-${node.id}`,
                                `Interval (${intervalVal}s):`,
                                0.1,
                                10.0,
                                0.1,
                                currentInterval,
                                () => { identifyAndRouteAllGroups(); saveState(); },
                                (e_input) => {
                                    const newInterval = parseFloat(e_input.target.value);
                                    selectedArray.forEach((elData) => {
                                        const n = findNodeById(elData.id);
                                        if (n?.audioParams && n.type !== "pulsar_random_particles" && n.type !== "pulsar_manual")
                                            n.audioParams.triggerInterval = newInterval;
                                    });
                                    e_input.target.previousElementSibling.textContent = `Interval (${newInterval.toFixed(1)}s):`;
                                },
                            );
                            currentSection.appendChild(intervalSliderContainer);
                        }
                    } else if (node.type === "pulsar_random_particles") {
                        const timingInfo = document.createElement("small");
                        timingInfo.textContent = `Timing: Random (~${PULSAR_RANDOM_TIMING_CHANCE_PER_SEC.toFixed(1)}/sec avg)`;
                        currentSection.appendChild(timingInfo);
                    }
                    currentSection.appendChild(document.createElement("br"));
                    if (node.type !== "pulsar_random_volume") {
                        const currentIntensity =
                            node.audioParams?.pulseIntensity ?? DEFAULT_PULSE_INTENSITY;
                        const intensityVal = currentIntensity.toFixed(2);
                        const intensitySliderContainer = createSlider(
                            `edit-pulsar-intensity-${node.id}`,
                            `Pulse Intensity (${intensityVal}):`,
                            MIN_PULSE_INTENSITY,
                            MAX_PULSE_INTENSITY,
                            0.01,
                            currentIntensity,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newIntensity = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n?.audioParams && n.type !== "pulsar_random_volume")
                                        n.audioParams.pulseIntensity = newIntensity;
                                });
                                e_input.target.previousElementSibling.textContent = `Pulse Intensity (${newIntensity.toFixed(2)}):`;
                            },
                        );
                        currentSection.appendChild(intensitySliderContainer);
                    } else {
                        const intensityInfo = document.createElement("small");
                        intensityInfo.textContent = `Intensity: Random (${MIN_PULSE_INTENSITY.toFixed(1)} - ${MAX_PULSE_INTENSITY.toFixed(1)})`;
                        currentSection.appendChild(intensityInfo);
                    }
                    currentSection.appendChild(document.createElement("br"));

                    if (node.type === "pulsar_meteorshower") {
                        const meteorSubSection = document.createElement("div");
                        meteorSubSection.classList.add("panel-section");
                        meteorSubSection.style.marginTop = "10px";
                        meteorSubSection.style.borderTop = "1px dashed var(--button-hover)";
                        const meteorTitle = document.createElement("p");
                        meteorTitle.innerHTML = "<strong>Meteor Shower Settings:</strong>";
                        meteorSubSection.appendChild(meteorTitle);

                        const currentMaxRadius = node.audioParams?.meteorMaxRadius || METEOR_SHOWER_DEFAULT_MAX_RADIUS;
                        const radiusSlider = createSlider(
                            `edit-meteor-radius-${node.id}`,
                            `Shower Max Radius (${currentMaxRadius.toFixed(0)}px):`,
                            50, 800, 10, currentMaxRadius,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newVal = parseFloat(e_input.target.value);
                                selectedArray.forEach(elData => {
                                    const n = findNodeById(elData.id);
                                    if (n && n.type === "pulsar_meteorshower" && n.audioParams) n.audioParams.meteorMaxRadius = newVal;
                                });
                                e_input.target.previousElementSibling.textContent = `Shower Max Radius (${newVal.toFixed(0)}px):`;
                            }
                        );
                        meteorSubSection.appendChild(radiusSlider);

                        const currentGrowthRate = node.audioParams?.meteorGrowthRate || METEOR_SHOWER_DEFAULT_GROWTH_RATE;
                        const growthSlider = createSlider(
                            `edit-meteor-growth-${node.id}`,
                            `Shower Growth Rate (${currentGrowthRate.toFixed(0)}px/s):`,
                            20, 500, 5, currentGrowthRate,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newVal = parseFloat(e_input.target.value);
                                selectedArray.forEach(elData => {
                                    const n = findNodeById(elData.id);
                                    if (n && n.type === "pulsar_meteorshower" && n.audioParams) n.audioParams.meteorGrowthRate = newVal;
                                });
                                e_input.target.previousElementSibling.textContent = `Shower Growth Rate (${newVal.toFixed(0)}px/s):`;
                            }
                        );
                        meteorSubSection.appendChild(growthSlider);
                        currentSection.appendChild(meteorSubSection);
                    }

                    const colorLabel = document.createElement("label");
                    colorLabel.htmlFor = `edit-pulsar-color-${node.id}`;
                    colorLabel.textContent = "Pulsar Color:";
                    currentSection.appendChild(colorLabel);
                    const colorInput = document.createElement("input");
                    colorInput.type = "color";
                    colorInput.id = `edit-pulsar-color-${node.id}`;
                    const styles = getComputedStyle(document.documentElement);
                    const defaultColorVar = `--${node.type.replace("_", "-")}-color`;
                    const fallbackColorVar = "--start-node-color";
                    const defaultColorRgba =
                        styles.getPropertyValue(defaultColorVar).trim() ||
                        styles.getPropertyValue(fallbackColorVar).trim();
                    const defaultColorHex = rgbaToHex(defaultColorRgba);
                    colorInput.value = node.color ?
                        rgbaToHex(node.color) :
                        defaultColorHex;
                    colorInput.addEventListener("input", (e) => {
                        const newColor = hexToRgba(e.target.value, 0.9);
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n) n.color = newColor;
                        });
                    });
                    colorInput.addEventListener("change", () => {
                        identifyAndRouteAllGroups();
                        saveState();
                    });
                    currentSection.appendChild(colorInput);

                    if (node.type === "pulsar_rocket" || node.type === "pulsar_ufo") {
                        const rocketSubSection = document.createElement("div");
                        rocketSubSection.classList.add("panel-section");
                        const rocketTitle = document.createElement("p");
                        rocketTitle.innerHTML = "<strong>Rocket Settings:</strong>";
                        rocketSubSection.appendChild(rocketTitle);
                        let currentAngleDegVal = parseFloat(
                            (
                                ((node.audioParams.rocketDirectionAngle || 0) * 180) /
                                Math.PI
                            ).toFixed(0),
                        );
                        const dirSliderContainer = createSlider(
                            `edit-rocket-dir-${node.id}`,
                            `Direction (${currentAngleDegVal}°):`, 0, 359, 1, currentAngleDegVal,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newAngleDeg = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n && (n.type === "pulsar_rocket" || n.type === "pulsar_ufo") && n.audioParams) {
                                        n.audioParams.rocketDirectionAngle = (newAngleDeg / 180) * Math.PI;
                                    }
                                });
                                e_input.target.previousElementSibling.textContent = `Direction (${newAngleDeg.toFixed(0)}°):`;
                            },
                        );
                        rocketSubSection.appendChild(dirSliderContainer);
                        let currentSpeedVal = parseFloat((node.audioParams.rocketSpeed || ROCKET_DEFAULT_SPEED).toFixed(1));
                        const speedSliderContainer = createSlider(
                            `edit-rocket-speed-${node.id}`, `Speed (${currentSpeedVal.toFixed(1)}):`, 50, 500, 1, currentSpeedVal,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newSpeed = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n && (n.type === "pulsar_rocket" || n.type === "pulsar_ufo") && n.audioParams) {
                                        n.audioParams.rocketSpeed = newSpeed;
                                    }
                                });
                                e_input.target.previousElementSibling.textContent = `Speed (${newSpeed.toFixed(1)}):`;
                            },
                        );
                        rocketSubSection.appendChild(speedSliderContainer);
                        let currentRangeVal = parseFloat((node.audioParams.rocketRange || ROCKET_DEFAULT_RANGE).toFixed(0));
                        const rangeSliderContainer = createSlider(
                            `edit-rocket-range-${node.id}`, `Range (${currentRangeVal.toFixed(0)}):`, 50, 2000, 10, currentRangeVal,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newRange = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n && (n.type === "pulsar_rocket" || n.type === "pulsar_ufo") && n.audioParams) {
                                        n.audioParams.rocketRange = newRange;
                                    }
                                });
                                e_input.target.previousElementSibling.textContent = `Range (${newRange.toFixed(0)}):`;
                            },
                        );
                        rocketSubSection.appendChild(rangeSliderContainer);
                        let currentGravityVal = parseFloat((node.audioParams.rocketGravity || ROCKET_DEFAULT_GRAVITY).toFixed(0));
                        const gravitySliderContainer = createSlider(
                            `edit-rocket-gravity-${node.id}`, `Gravity (${currentGravityVal.toFixed(0)}):`, -200, 200, 1, currentGravityVal,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newGravity = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n && (n.type === "pulsar_rocket" || n.type === "pulsar_ufo") && n.audioParams) {
                                        n.audioParams.rocketGravity = newGravity;
                                    }
                                });
                                e_input.target.previousElementSibling.textContent = `Gravity (${newGravity.toFixed(0)}):`;
                            },
                        );
                        rocketSubSection.appendChild(gravitySliderContainer);
                        currentSection.appendChild(rocketSubSection);
                    }

                } else if (
                    node.type === "sound" ||
                    node.type === ALIEN_ORB_TYPE ||
                    node.type === ALIEN_DRONE_TYPE
                ) {
                    const orbitoneMainSection = document.createElement("div");
                    orbitoneMainSection.classList.add("panel-section");
                    orbitoneMainSection.innerHTML = "<p><strong>Orbitone Settings:</strong></p>";

                    const enableOrbitonesLabel = document.createElement("label");
                    enableOrbitonesLabel.htmlFor = `edit-node-orbitones-enable-${node.id}`;
                    enableOrbitonesLabel.textContent = "Enable Orbitones:";
                    enableOrbitonesLabel.style.marginRight = "8px";
                    orbitoneMainSection.appendChild(enableOrbitonesLabel);

                    const enableOrbitonesCheckbox = document.createElement("input");
                    enableOrbitonesCheckbox.type = "checkbox";
                    enableOrbitonesCheckbox.id = `edit-node-orbitones-enable-${node.id}`;
                    enableOrbitonesCheckbox.checked = node.audioParams.orbitonesEnabled || false;
                    enableOrbitonesCheckbox.addEventListener("change", (e) => {
                        const isEnabled = e.target.checked;
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (
                                n &&
                                n.audioParams &&
                                (n.type === "sound" ||
                                    n.type === ALIEN_ORB_TYPE ||
                                    n.type === ALIEN_DRONE_TYPE)
                            ) {
                                n.audioParams.orbitonesEnabled = isEnabled;
                                stopNodeAudio(n);
                                n.audioNodes = createAudioNodesForNode(n);
                                if (n.audioNodes) updateNodeAudioParams(n);
                            }
                        });
                        identifyAndRouteAllGroups();
                        saveState();
                        populateEditPanel();
                    });
                    orbitoneMainSection.appendChild(enableOrbitonesCheckbox);
                    fragment.appendChild(orbitoneMainSection);

                    if (node.audioParams.orbitonesEnabled) {
                        const orbitoneSettingsSection = document.createElement("div");
                        orbitoneSettingsSection.classList.add("panel-section");
                        orbitoneSettingsSection.style.paddingLeft = "15px";
                        orbitoneSettingsSection.style.borderLeft = "2px solid var(--button-bg)";
                        orbitoneSettingsSection.style.marginTop = "5px";

                        const currentOrbitoneCount = node.audioParams.orbitoneCount || 0;
                        const orbitoneCountSliderContainer = createSlider(
                            `edit-node-orbitone-count-${node.id}`,
                            `Number of extra Orbitones (${currentOrbitoneCount}):`, 0, 5, 1, currentOrbitoneCount,
                            (e_change_event) => {
                                const newCount = parseInt(e_change_event.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (
                                        n &&
                                        n.audioParams &&
                                        (n.type === "sound" ||
                                            n.type === ALIEN_ORB_TYPE ||
                                            n.type === ALIEN_DRONE_TYPE)
                                    ) {
                                        n.audioParams.orbitoneCount = newCount;
                                        applyOrbitoneVoicingFromPhase(n);
                                        applyOrbitoneTimingFromPhase(n);
                                        stopNodeAudio(n); n.audioNodes = createAudioNodesForNode(n); if (n.audioNodes) updateNodeAudioParams(n);
                                    }
                                });
                                identifyAndRouteAllGroups(); saveState(); populateEditPanel();
                            },
                            (e_input) => {
                                e_input.target.previousElementSibling.textContent = `Number of extra Orbitones (${e_input.target.value}):`;
                            },
                        );
                        orbitoneSettingsSection.appendChild(orbitoneCountSliderContainer);

                        if (node.audioParams.orbitoneCount > 0) {
                            const currentVoicingPhase = node.audioParams.orbitoneVoicingPhase || 0;
                            const voicingPhaseSlider = createSlider(
                                `edit-orbitone-voicing-phase-${node.id}`, `Orbitone Voicing Style (${currentVoicingPhase}):`, 0, 100, 1, currentVoicingPhase,
                                (e_change) => {
                                    const val = parseInt(e_change.target.value);
                                    selectedArray.forEach((el) => {
                                        const n = findNodeById(el.id);
                                        if (
                                            n &&
                                            n.audioParams &&
                                            (n.type === "sound" ||
                                                n.type === ALIEN_ORB_TYPE ||
                                                n.type === ALIEN_DRONE_TYPE)
                                        ) {
                                            n.audioParams.orbitoneVoicingPhase = val;
                                            applyOrbitoneVoicingFromPhase(n);
                                            stopNodeAudio(n); n.audioNodes = createAudioNodesForNode(n); if (n.audioNodes) updateNodeAudioParams(n);
                                        }
                                    });
                                    identifyAndRouteAllGroups(); saveState(); populateEditPanel();
                                },
                                (e_input) => { e_input.target.previousElementSibling.textContent = `Orbitone Voicing Style (${e_input.target.value}):`; },
                            );
                            orbitoneSettingsSection.appendChild(voicingPhaseSlider);

                            const currentTimingPhase = node.audioParams.orbitoneTimingPhase || 0;
                            const applyTimingPhase = (val) => {
                                selectedArray.forEach((el) => {
                                    const n = findNodeById(el.id);
                                    if (
                                        n &&
                                        n.audioParams &&
                                        (n.type === "sound" ||
                                            n.type === ALIEN_ORB_TYPE ||
                                            n.type === ALIEN_DRONE_TYPE)
                                    ) {
                                        n.audioParams.orbitoneTimingPhase = val;
                                        applyOrbitoneTimingFromPhase(n);
                                        updateNodeAudioParams(n);
                                    }
                                });
                            };
                            const timingPhaseSlider = createSlider(
                                `edit-orbitone-timing-phase-${node.id}`, `Orbitone Timing Style (${currentTimingPhase}):`, 0, 100, 1, currentTimingPhase,
                                (e_change) => {
                                    const val = parseInt(e_change.target.value);
                                    applyTimingPhase(val);
                                    identifyAndRouteAllGroups();
                                    saveState();
                                },
                                (e_input) => {
                                    const val = parseInt(e_input.target.value);
                                    applyTimingPhase(val);
                                    e_input.target.previousElementSibling.textContent = `Orbitone Timing Style (${val}):`;
                                },
                            );
                            orbitoneSettingsSection.appendChild(timingPhaseSlider);

                            const currentSpread = node.audioParams.orbitoneSpread || 0;
                            const applySpread = (val) => {
                                selectedArray.forEach((el) => {
                                    const n = findNodeById(el.id);
                                    if (
                                        n &&
                                        n.audioParams &&
                                        (n.type === "sound" ||
                                            n.type === ALIEN_ORB_TYPE ||
                                            n.type === ALIEN_DRONE_TYPE)
                                    ) {
                                        n.audioParams.orbitoneSpread = val;
                                        applyOrbitoneTimingFromPhase(n);
                                        updateNodeAudioParams(n);
                                    }
                                });
                            };
                            const spreadSliderContainer = createSlider(
                                `edit-node-orbitone-spread-${node.id}`, `Orbitone Spread (${currentSpread.toFixed(1)}):`, 0, 3, 0.1, currentSpread,
                                (e_change_event) => {
                                    const newVal = parseFloat(e_change_event.target.value);
                                    applySpread(newVal);
                                    identifyAndRouteAllGroups();
                                    saveState();
                                },
                                (e_input) => {
                                    const val = parseFloat(e_input.target.value);
                                    applySpread(val);
                                    e_input.target.previousElementSibling.textContent = `Orbitone Spread (${val.toFixed(1)}):`;
                                },
                            );
                            orbitoneSettingsSection.appendChild(spreadSliderContainer);

                            const currentMix = node.audioParams.orbitoneMix !== undefined ? node.audioParams.orbitoneMix : 0.5;
                            const mixSliderContainer = createSlider(
                                `edit-node-orbitone-mix-${node.id}`, `Orbitone Mix (Main <-> Orbitones) (${currentMix.toFixed(2)}):`, 0, 1, 0.05, currentMix,
                                (e_change_event) => {
                                    const newMix = parseFloat(e_change_event.target.value);
                                    selectedArray.forEach((elData) => {
                                        const n = findNodeById(elData.id);
                                        if (
                                            n &&
                                            n.audioParams &&
                                            (n.type === "sound" ||
                                                n.type === ALIEN_ORB_TYPE ||
                                                n.type === ALIEN_DRONE_TYPE)
                                        ) {
                                            n.audioParams.orbitoneMix = newMix; updateNodeAudioParams(n);
                                        }
                                    });
                                    identifyAndRouteAllGroups(); saveState();
                                },
                                (e_input) => { e_input.target.previousElementSibling.textContent = `Orbitone Mix (Main <-> Orbitones) (${parseFloat(e_input.target.value).toFixed(2)}):`; },
                            );
                            orbitoneSettingsSection.appendChild(mixSliderContainer);

                            const currentRotate = node.audioParams.orbitoneRotateSpeed || 0;
                              const rotateSliderContainer = createSlider(
                                  `edit-node-orbitone-rotate-${node.id}`, `Orbitone Key Rotate Speed (${currentRotate.toFixed(2)}):`, 0, 5, 0.1, currentRotate,
                                  (e_change_event) => {
                                      const newVal = parseFloat(e_change_event.target.value);
                                      selectedArray.forEach((elData) => {
                                          const n = findNodeById(elData.id);
                                          if (
                                              n &&
                                              n.audioParams &&
                                              n.type === ALIEN_DRONE_TYPE
                                          ) {
                                              n.audioParams.orbitoneRotateSpeed = newVal;
                                              if (n.audioNodes && newVal === 0) {
                                                  updateNodeAudioParams(n);
                                              }
                                          }
                                      });
                                      saveState();
                                  },
                                  (e_input) => {
                                      const val = parseFloat(e_input.target.value);
                                      e_input.target.previousElementSibling.textContent = `Orbitone Key Rotate Speed (${val.toFixed(2)}):`;
                                  },
                              );
                              orbitoneSettingsSection.appendChild(rotateSliderContainer);

                              const currentRotateSpread = node.audioParams.orbitoneRotateSpread ?? 1;
                              const rotateSpreadSlider = createSlider(
                                  `edit-node-orbitone-rotate-spread-${node.id}`,
                                  `Orbitone Rotate Spread (${currentRotateSpread.toFixed(2)}):`,
                                  0,
                                  1,
                                  0.05,
                                  currentRotateSpread,
                                  (e_change_event) => {
                                      const newVal = parseFloat(e_change_event.target.value);
                                      selectedArray.forEach((elData) => {
                                          const n = findNodeById(elData.id);
                                          if (
                                              n &&
                                              n.audioParams &&
                                              n.type === ALIEN_DRONE_TYPE
                                          ) {
                                              n.audioParams.orbitoneRotateSpread = newVal;
                                          }
                                      });
                                      saveState();
                                  },
                                  (e_input) => {
                                      const val = parseFloat(e_input.target.value);
                                      e_input.target.previousElementSibling.textContent = `Orbitone Rotate Spread (${val.toFixed(2)}):`;
                                  },
                              );
                              orbitoneSettingsSection.appendChild(rotateSpreadSlider);

                            const orbitoneDisplay = createOrbitoneNoteDisplay(node);
                            orbitoneSettingsSection.appendChild(orbitoneDisplay);
                        }
                        fragment.appendChild(orbitoneSettingsSection);
                    }
                } else if (isDrumType(node.type)) {
                    const params = node.audioParams;
                    const defaults = DRUM_ELEMENT_DEFAULTS[node.type];
                    const soundDiv = document.createElement("div");
                    soundDiv.classList.add("edit-drum-sound");
                    const soundLabel = document.createElement("strong");
                    soundLabel.textContent = defaults.label;
                    soundDiv.appendChild(soundLabel);

                    const currentBaseFreq = params?.baseFreq ?? defaults?.baseFreq ?? 60;
                    const tuneVal = currentBaseFreq.toFixed(0);
                    const tuneSliderContainer = createSlider(
                        `edit-drum-tune-${node.id}`, `Tune (${tuneVal}Hz):`, 20, node.type === "drum_hihat" ? 15000 : (node.type === "drum_cowbell" || node.type === "drum_clap" ? 2000 : 1000), 1, currentBaseFreq,
                        () => { identifyAndRouteAllGroups(); saveState(); },
                        (e_input) => {
                            const newFreq = parseFloat(e_input.target.value);
                            selectedArray.forEach((elData) => { const n = findNodeById(elData.id); if (n?.audioParams) n.audioParams.baseFreq = newFreq; });
                            e_input.target.previousElementSibling.textContent = `Tune (${newFreq.toFixed(0)}Hz):`;
                        }
                    );
                    soundDiv.appendChild(tuneSliderContainer);

                    if (params?.decay !== undefined || defaults?.decay !== undefined) {
                        const currentDecay = params?.decay ?? defaults?.decay ?? 0.5;
                        const decayVal = currentDecay.toFixed(2);
                        const decaySliderContainer = createSlider(
                            `edit-drum-decay-${node.id}`, `Decay (${decayVal}s):`, 0.01, 1.5, 0.01, currentDecay,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newDecay = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => { const n = findNodeById(elData.id); if (n?.audioParams) n.audioParams.decay = newDecay; });
                                e_input.target.previousElementSibling.textContent = `Decay (${newDecay.toFixed(2)}s):`;
                            }
                        );
                        soundDiv.appendChild(decaySliderContainer);
                    }
                    if (params?.noiseDecay !== undefined || defaults?.noiseDecay !== undefined) {
                        const currentNoiseDecay = params?.noiseDecay ?? defaults?.noiseDecay ?? 0.1;
                        const noiseDecayVal = currentNoiseDecay.toFixed(2);
                        const noiseDecaySliderContainer = createSlider(
                            `edit-drum-noisedecay-${node.id}`, `Noise Decay (${noiseDecayVal}s):`, 0.01, 0.5, 0.01, currentNoiseDecay,
                            () => { identifyAndRouteAllGroups(); saveState(); },
                            (e_input) => {
                                const newNoiseDecay = parseFloat(e_input.target.value);
                                selectedArray.forEach((elData) => { const n = findNodeById(elData.id); if (n?.audioParams) n.audioParams.noiseDecay = newNoiseDecay; });
                                e_input.target.previousElementSibling.textContent = `Noise Decay (${newNoiseDecay.toFixed(2)}s):`;
                            }
                        );
                        soundDiv.appendChild(noiseDecaySliderContainer);
                    }

                    const currentVolume = params?.volume ?? defaults?.volume ?? 1.0;
                    const volVal = currentVolume.toFixed(2);
                    const volSliderContainer = createSlider(
                        `edit-drum-vol-${node.id}`, `Volume (${volVal}):`, 0, 1.5, 0.01, currentVolume,
                        () => { identifyAndRouteAllGroups(); saveState(); },
                        (e_input) => {
                            const newVol = parseFloat(e_input.target.value);
                            selectedArray.forEach((elData) => {
                                const n = findNodeById(elData.id);
                                if (n?.audioParams) { n.audioParams.volume = newVol; updateNodeAudioParams(n); }
                            });
                            e_input.target.previousElementSibling.textContent = `Volume (${newVol.toFixed(2)}):`;
                        }
                    );
                    soundDiv.appendChild(volSliderContainer);
                    currentSection.appendChild(soundDiv);
                } else if (node.type === "switch" && selectedArray.length === 1) {
                    const label = document.createElement("label");
                    label.textContent = "Primary Input Connection:";
                    currentSection.appendChild(label);

                    const select = document.createElement("select");
                    select.id = `edit-switch-primary-${node.id}`;
                    const noneOpt = document.createElement("option");
                    noneOpt.value = "null";
                    noneOpt.textContent = "None (Set on next pulse)";
                    select.appendChild(noneOpt);
                    node.connections.forEach(neighborId => {
                        const conn = connections.find(c => (c.nodeAId === node.id && c.nodeBId === neighborId) || (!c.directional && c.nodeAId === neighborId && c.nodeBId === node.id));
                        if (conn) {
                            const otherNode = findNodeById(neighborId);
                            const option = document.createElement("option");
                            option.value = conn.id;
                            option.textContent = `From Node #${neighborId} (${otherNode?.type || '?'})`;
                            if (conn.id === node.primaryInputConnectionId) option.selected = true;
                            select.appendChild(option);
                        }
                    });
                    select.addEventListener("change", (e) => {
                        node.primaryInputConnectionId = e.target.value === "null" ? null : parseInt(e.target.value, 10);
                        identifyAndRouteAllGroups(); saveState();
                    });
                    currentSection.appendChild(select);
                }

                if (node && (node.type === "sound" || isDrumType(node.type))) {
                    const retriggerSection = document.createElement("div");
                    retriggerSection.classList.add("panel-section");
                    retriggerSection.style.borderTop = "1px solid var(--button-hover)";
                    retriggerSection.style.marginTop = "10px";
                    retriggerSection.style.paddingTop = "10px";

                    const retriggerTitle = document.createElement("p");
                    retriggerTitle.innerHTML = "<strong>Retrigger Settings:</strong>";
                    retriggerSection.appendChild(retriggerTitle);

                    const enableRetriggerLabel = document.createElement("label");
                    enableRetriggerLabel.htmlFor = `edit-node-retrigger-enable-${node.id}`;
                    enableRetriggerLabel.textContent = "Enable Retrigger Mode:";
                    enableRetriggerLabel.style.marginRight = "8px";
                    retriggerSection.appendChild(enableRetriggerLabel);

                    const enableRetriggerCheckbox = document.createElement("input");
                    enableRetriggerCheckbox.type = "checkbox";
                    enableRetriggerCheckbox.id = `edit-node-retrigger-enable-${node.id}`;
                    enableRetriggerCheckbox.checked = (node.audioParams && node.audioParams.retriggerEnabled) || false;

                    enableRetriggerCheckbox.addEventListener("change", (e) => {
                        const isEnabled = e.target.checked;
                        selectedArray.forEach((elData) => {
                            const n = findNodeById(elData.id);
                            if (n && n.audioParams && (n.type === "sound" || isDrumType(n.type))) {
                                n.audioParams.retriggerEnabled = isEnabled;
                                if (isEnabled) {
                                    const defaultSteps = [0.8, 0.65, 0.5];
                                    const numSteps = (n.audioParams.retriggerVolumeSteps && n.audioParams.retriggerVolumeSteps.length > 0) ? n.audioParams.retriggerVolumeSteps.length : defaultSteps.length;

                                    if (!n.audioParams.retriggerVolumeSteps || n.audioParams.retriggerVolumeSteps.length === 0) {
                                        n.audioParams.retriggerVolumeSteps = Array(numSteps).fill(0).map((_, i) => defaultSteps[i] !== undefined ? defaultSteps[i] : 0.5);
                                    }
                                     if (!n.audioParams.retriggerPitchSteps || n.audioParams.retriggerPitchSteps.length !== numSteps) {
                                        n.audioParams.retriggerPitchSteps = Array(numSteps).fill(0);
                                    }
                                    if (!n.audioParams.retriggerFilterSteps || n.audioParams.retriggerFilterSteps.length !== numSteps) {
                                        n.audioParams.retriggerFilterSteps = Array(numSteps).fill(0);
                                    }
                                    if (!n.audioParams.retriggerMuteSteps || n.audioParams.retriggerMuteSteps.length !== numSteps) {
                                        n.audioParams.retriggerMuteSteps = Array(numSteps).fill(false);
                                    }
                                    if (n.audioParams.retriggerIntervalMs === undefined) n.audioParams.retriggerIntervalMs = 100;
                                    if (n.audioParams.retriggerRateMode === undefined) n.audioParams.retriggerRateMode = "constant";
                                    if (n.audioParams.retriggerSyncSubdivisionIndex === undefined) n.audioParams.retriggerSyncSubdivisionIndex = DEFAULT_SUBDIVISION_INDEX;
                                }
                            }
                        });
                        saveState();
                        populateEditPanel();
                    });
                    retriggerSection.appendChild(enableRetriggerCheckbox);
                    fragment.appendChild(retriggerSection);

                    if (node.audioParams && node.audioParams.retriggerEnabled) {
                        const retriggerControlsSection = document.createElement("div");
                        retriggerControlsSection.classList.add("panel-section");
                        retriggerControlsSection.style.paddingLeft = "15px";
                        retriggerControlsSection.style.borderLeft = "2px solid var(--button-bg)";
                        retriggerControlsSection.style.marginTop = "5px";

                        const firstNodeWithRetrigger = selectedArray
                            .map(elData => findNodeById(elData.id))
                            .find(n => n && n.audioParams && n.audioParams.retriggerEnabled);

                        const currentStepCount = firstNodeWithRetrigger ? (firstNodeWithRetrigger.audioParams.retriggerVolumeSteps || [0.8, 0.65, 0.5]).length : 3;

                        const stepsSliderContainer = createSlider(
                            `edit-node-retrigger-steps-${node.id}`,
                            `Number of Steps (${currentStepCount}):`, 1, 16, 1, currentStepCount,
                            (e_change) => {
                                const newCount = parseInt(e_change.target.value);
                                selectedArray.forEach((elData) => {
                                    const n = findNodeById(elData.id);
                                    if (n && n.audioParams && n.audioParams.retriggerEnabled) {
                                        const oldVolumeSteps = n.audioParams.retriggerVolumeSteps || [];
                                        const oldPitchSteps = n.audioParams.retriggerPitchSteps || [];
                                        const oldFilterSteps = n.audioParams.retriggerFilterSteps || [];
                                        const oldMuteSteps = n.audioParams.retriggerMuteSteps || [];
                                        const defaultBaseVolumes = [0.8, 0.65, 0.5];

                                        n.audioParams.retriggerVolumeSteps = Array(newCount).fill(0).map((_, i) => oldVolumeSteps[i] !== undefined ? oldVolumeSteps[i] : (defaultBaseVolumes[i] !== undefined ? defaultBaseVolumes[i] : 0.5));
                                        n.audioParams.retriggerPitchSteps = Array(newCount).fill(0).map((_, i) => oldPitchSteps[i] !== undefined ? oldPitchSteps[i] : 0);
                                        n.audioParams.retriggerFilterSteps = Array(newCount).fill(0).map((_, i) => oldFilterSteps[i] !== undefined ? oldFilterSteps[i] : 0);
                                        n.audioParams.retriggerMuteSteps = Array(newCount).fill(false).map((_, i) => oldMuteSteps[i] !== undefined ? oldMuteSteps[i] : false);
                                    }
                                });
                                saveState();
                                populateEditPanel();
                            },
                            (e_input) => {
                                e_input.target.previousElementSibling.textContent = `Number of Steps (${e_input.target.value}):`;
                            }
                        );
                        retriggerControlsSection.appendChild(stepsSliderContainer);

                        const showSyncRetrigger = isGlobalSyncEnabled && !(node.audioParams.ignoreGlobalSync || false);
                        if (showSyncRetrigger) {
                            const subdivRetriggerLabel = document.createElement("label");
                            subdivRetriggerLabel.htmlFor = `edit-retrigger-sync-subdiv-${node.id}`;
                            subdivRetriggerLabel.textContent = "Retrigger Interval (Synced):";
                            retriggerControlsSection.appendChild(subdivRetriggerLabel);

                            const subdivRetriggerSelect = document.createElement("select");
                            subdivRetriggerSelect.id = `edit-retrigger-sync-subdiv-${node.id}`;
                            subdivisionOptions.forEach((opt, index) => {
                                const option = document.createElement("option");
                                option.value = index;
                                option.textContent = opt.label;
                                if (index === (node.audioParams.retriggerSyncSubdivisionIndex ?? DEFAULT_SUBDIVISION_INDEX)) option.selected = true;
                                subdivRetriggerSelect.appendChild(option);
                            });
                            subdivRetriggerSelect.addEventListener("change", (e) => {
                                const newIdx = parseInt(e.target.value, 10);
                                selectedArray.forEach(elData => {
                                    const n = findNodeById(elData.id);
                                    if (n && n.audioParams && n.audioParams.retriggerEnabled) n.audioParams.retriggerSyncSubdivisionIndex = newIdx;
                                });
                                saveState();
                            });
                            retriggerControlsSection.appendChild(subdivRetriggerSelect);
                            retriggerControlsSection.appendChild(document.createElement("br"));
                        } else {
                            const currentIntervalMs = node.audioParams.retriggerIntervalMs || 100;
                            const intervalSliderContainer = createSlider(
                                `edit-node-retrigger-interval-${node.id}`,
                                `Interval (${currentIntervalMs}ms):`, 20, 500, 5, currentIntervalMs,
                                saveState,
                                (e_input) => {
                                    const newMs = parseInt(e_input.target.value);
                                    selectedArray.forEach((elData) => {
                                        const n = findNodeById(elData.id);
                                        if (n && n.audioParams && n.audioParams.retriggerEnabled) n.audioParams.retriggerIntervalMs = newMs;
                                    });
                                    e_input.target.previousElementSibling.textContent = `Interval (${newMs}ms):`;
                                }
                            );
                            retriggerControlsSection.appendChild(intervalSliderContainer);
                        }

                        const rateModeLabel = document.createElement("label");
                        rateModeLabel.htmlFor = `edit-node-retrigger-ratemode-${node.id}`;
                        rateModeLabel.textContent = "Rate Mode:";
                        retriggerControlsSection.appendChild(rateModeLabel);

                        const rateModeSelect = document.createElement("select");
                        rateModeSelect.id = `edit-node-retrigger-ratemode-${node.id}`;
                        const rateModes = ["constant", "accelerate", "decelerate", "random"];
                        rateModes.forEach(modeVal => {
                            const option = document.createElement("option");
                            option.value = modeVal;
                            option.textContent = modeVal.charAt(0).toUpperCase() + modeVal.slice(1);
                            if (modeVal === (node.audioParams.retriggerRateMode || "constant")) option.selected = true;
                            rateModeSelect.appendChild(option);
                        });
                        rateModeSelect.addEventListener("change", (e) => {
                            const newMode = e.target.value;
                            selectedArray.forEach(elData => {
                                const n = findNodeById(elData.id);
                                if (n && n.audioParams && n.audioParams.retriggerEnabled) n.audioParams.retriggerRateMode = newMode;
                            });
                            saveState();
                        });
                        retriggerControlsSection.appendChild(rateModeSelect);
                        retriggerControlsSection.appendChild(document.createElement("br"));

                        if (typeof createRetriggerVisualEditor === "function") {
                             const retriggerEditor = createRetriggerVisualEditor(node, selectedArray);
                             if (retriggerEditor) {
                                retriggerControlsSection.appendChild(retriggerEditor);
                             }
                        }
                        fragment.appendChild(retriggerControlsSection);
                    }
                }

                if (node.type === "nebula") {
                    const spinSection = document.createElement("div");
                    spinSection.classList.add("panel-section");
                    const currentSpin = (node.spinSpeed || NEBULA_ROTATION_SPEED_OUTER).toFixed(4);
                    const spinSliderContainer = createSlider(
                        `edit-nebula-spin-${node.id}`,
                        `Spin Speed (${currentSpin}):`,
                        -0.001,
                        0.001,
                        0.0001,
                        node.spinSpeed || NEBULA_ROTATION_SPEED_OUTER,
                        saveState,
                        (e_input) => {
                            const newVal = parseFloat(e_input.target.value);
                            selectedArray.forEach(elData => {
                                const n = findNodeById(elData.id);
                                if (n && n.type === "nebula") {
                                    n.spinSpeed = newVal;
                                    updateNodeAudioParams(n);
                                }
                            });
                            e_input.target.previousElementSibling.textContent = `Spin Speed (${newVal.toFixed(4)}):`;
                        }
                    );
                    spinSection.appendChild(spinSliderContainer);
                    fragment.appendChild(spinSection);
                }

                if (node.type === PRORB_TYPE) {
                    const prorbSection = document.createElement("div");
                    prorbSection.classList.add("panel-section");
                    prorbSection.innerHTML = "<p><strong>PrOrb Synth Settings:</strong></p>";
                    fragment.appendChild(prorbSection);
                }



                if (sectionCreatedForThisType && currentSection && currentSection.hasChildNodes()) {
                    fragment.appendChild(currentSection);
                }
            }
        } else if (firstElementData.type === "connection") {
            const connection = findConnectionById(firstElementData.id);
            if (connection) {
                const section = document.createElement("div");
                section.classList.add("panel-section");

                if (connection.type === "string_violin") {
                } else if (connection.type === "wavetrail") {
                    section.classList.add("panel-section");

                    const fileLabel = document.createElement("label");
                    fileLabel.htmlFor = `edit-wavetrail-file-${connection.id}`;
                    fileLabel.textContent = "Audio File:";
                    section.appendChild(fileLabel);

                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.id = `edit-wavetrail-file-${connection.id}`;
                    fileInput.accept = ".wav,.mp3,audio/*";
                    fileInput.style.marginBottom = "5px";
                    fileInput.addEventListener("change", (e) => handleWaveTrailFileInputChange(e, connection));
                    section.appendChild(fileInput);

                    const fileNameDisplay = document.createElement("small");
                    fileNameDisplay.id = `edit-wavetrail-filename-${connection.id}`;
                    if (!connection.audioParams) {
                        connection.audioParams = {};
                    }
                    fileNameDisplay.textContent = `Current: ${connection.audioParams?.fileName || "None selected"}`;
                    fileNameDisplay.style.display = "block";
                    section.appendChild(fileNameDisplay);

                    if (connection.audioParams?.buffer) {
                        const bufferDuration = connection.audioParams.buffer.duration;
                        const currentStartOffset = connection.audioParams.startTimeOffset || 0;
                        const currentEndOffset = connection.audioParams.endTimeOffset ?? bufferDuration;
                        const currentGrainDuration = connection.audioParams.grainDuration || 0.09;
                        const currentGrainOverlap = connection.audioParams.grainOverlap || 0.07;
                        const currentPlaybackRate = connection.audioParams.playbackRate || 1.0;

                        const offsetLabel = document.createElement("label");
                        offsetLabel.htmlFor = `edit-wavetrail-start-${connection.id}`;
                        offsetLabel.style.marginTop = "10px";
                        offsetLabel.textContent = `Start Offset (${currentStartOffset.toFixed(2)}s):`;
                        section.appendChild(offsetLabel);
                        const offsetSlider = document.createElement("input");
                        offsetSlider.type = "range";
                        offsetSlider.id = `edit-wavetrail-start-${connection.id}`;
                        offsetSlider.min = "0";
                        offsetSlider.max = bufferDuration.toFixed(3);
                        offsetSlider.step = "0.01";
                        offsetSlider.value = currentStartOffset;
                        offsetSlider.title = "Scrub Start Time";
                        const offsetValueDisplay = document.createElement("span");
                        offsetValueDisplay.id = `edit-wavetrail-start-value-${connection.id}`;
                        offsetValueDisplay.textContent = `${currentStartOffset.toFixed(2)}s`;
                        offsetValueDisplay.style.cssText = "font-size: 0.8em; margin-left: 5px; opacity: 0.8;";
                        section.appendChild(offsetSlider);
                        section.appendChild(offsetValueDisplay);

                        const endOffsetLabel = document.createElement("label");
                        endOffsetLabel.htmlFor = `edit-wavetrail-end-${connection.id}`;
                        endOffsetLabel.style.marginTop = "10px";
                        endOffsetLabel.textContent = `End Offset (${currentEndOffset.toFixed(2)}s):`;
                        section.appendChild(endOffsetLabel);
                        const endOffsetSlider = document.createElement("input");
                        endOffsetSlider.type = "range";
                        endOffsetSlider.id = `edit-wavetrail-end-${connection.id}`;
                        endOffsetSlider.min = currentStartOffset.toFixed(3);
                        endOffsetSlider.max = bufferDuration.toFixed(3);
                        endOffsetSlider.step = "0.01";
                        endOffsetSlider.value = currentEndOffset;
                        endOffsetSlider.title = "Scrub End Time";
                        const endOffsetValueDisplay = document.createElement("span");
                        endOffsetValueDisplay.id = `edit-wavetrail-end-value-${connection.id}`;
                        endOffsetValueDisplay.textContent = `${currentEndOffset.toFixed(2)}s`;
                        endOffsetValueDisplay.style.cssText = "font-size: 0.8em; margin-left: 5px; opacity: 0.8;";
                        section.appendChild(endOffsetSlider);
                        section.appendChild(endOffsetValueDisplay);

                        offsetSlider.addEventListener("input", (e_input) => {
                            const newStart = parseFloat(e_input.target.value);
                            const localConn = findConnectionById(connection.id);
                            if (localConn && localConn.audioParams) {
                                localConn.audioParams.startTimeOffset = newStart;
                                const endSlider = document.getElementById(`edit-wavetrail-end-${localConn.id}`);
                                if (endSlider) endSlider.min = newStart.toFixed(3);
                                if (localConn.audioParams.endTimeOffset !== null && localConn.audioParams.endTimeOffset < newStart) {
                                    localConn.audioParams.endTimeOffset = newStart + 0.01;
                                    if (endSlider) endSlider.value = localConn.audioParams.endTimeOffset;
                                    const endValDisplay = document.getElementById(`edit-wavetrail-end-value-${localConn.id}`);
                                    if (endValDisplay) endValDisplay.textContent = `${localConn.audioParams.endTimeOffset.toFixed(2)}s`;
                                }
                            }
                            const valDisplay = document.getElementById(`edit-wavetrail-start-value-${localConn ? localConn.id : connection.id}`);
                            if (valDisplay) valDisplay.textContent = `${newStart.toFixed(2)}s`;
                            if (localConn && localConn.audioParams?.buffer) {
                                localConn.audioParams.waveformPath = generateWaveformPath(localConn.audioParams.buffer, 200);
                            }
                        });
                        offsetSlider.addEventListener("change", () => { identifyAndRouteAllGroups(); saveState(); });

                        endOffsetSlider.addEventListener("input", (e_input) => {
                            const newEnd = parseFloat(e_input.target.value);
                            const localConn = findConnectionById(connection.id);
                            if (localConn && localConn.audioParams) {
                                localConn.audioParams.endTimeOffset = newEnd;
                            }
                            const valDisplay = document.getElementById(`edit-wavetrail-end-value-${localConn ? localConn.id : connection.id}`);
                            if (valDisplay) valDisplay.textContent = `${newEnd.toFixed(2)}s`;
                            if (localConn && localConn.audioParams?.buffer) {
                                localConn.audioParams.waveformPath = generateWaveformPath(localConn.audioParams.buffer, 200);
                            }
                        });
                        endOffsetSlider.addEventListener("change", () => { identifyAndRouteAllGroups(); saveState(); });

                        const grainDurSlider = createSlider(`edit-wavetrail-graindur-${connection.id}`, `Grain Duration (${currentGrainDuration.toFixed(3)}s):`, 0.005, 0.5, 0.001, currentGrainDuration, saveState, (e) => {
                            const localConn = findConnectionById(connection.id);
                            if (localConn && localConn.audioParams) localConn.audioParams.grainDuration = parseFloat(e.target.value);
                            e.target.previousElementSibling.textContent = `Grain Duration (${parseFloat(e.target.value).toFixed(3)}s):`;
                        });
                        section.appendChild(grainDurSlider);
                        const grainOvlSlider = createSlider(`edit-wavetrail-grainovl-${connection.id}`, `Grain Overlap (${currentGrainOverlap.toFixed(3)}s):`, 0.001, 0.49, 0.001, currentGrainOverlap, saveState, (e) => {
                            const localConn = findConnectionById(connection.id);
                            if (localConn && localConn.audioParams) localConn.audioParams.grainOverlap = parseFloat(e.target.value);
                            e.target.previousElementSibling.textContent = `Grain Overlap (${parseFloat(e.target.value).toFixed(3)}s):`;
                        });
                        section.appendChild(grainOvlSlider);
                        const rateSlider = createSlider(`edit-wavetrail-rate-${connection.id}`, `Playback Rate (${currentPlaybackRate.toFixed(2)}x):`, 0.1, 4.0, 0.05, currentPlaybackRate, saveState, (e) => {
                            const localConn = findConnectionById(connection.id);
                            if (localConn && localConn.audioParams) localConn.audioParams.playbackRate = parseFloat(e.target.value);
                            e.target.previousElementSibling.textContent = `Playback Rate (${parseFloat(e.target.value).toFixed(2)}x):`;
                        });
                        section.appendChild(rateSlider);
                    } else {
                        const noBufferMsg = document.createElement("small");
                        noBufferMsg.textContent = " (Upload an audio file to enable more controls)";
                        noBufferMsg.style.display = "block";
                        noBufferMsg.style.opacity = "0.7";
                        section.appendChild(noBufferMsg);
                    }
                }
                if (section.hasChildNodes()) fragment.appendChild(section);
            }
        }
    } else {
        const multiInfo = document.createElement("small");
        multiInfo.textContent = "Editing multiple elements of different types. Only common properties might be available if implemented.";
        fragment.appendChild(multiInfo);
    }

    editPanelContent.appendChild(fragment);

    if (hamburgerMenuPanel && currentTool === "edit" && selectedElements.size > 0) {
        if (hamburgerMenuPanel.classList.contains("hidden")) {
            hamburgerMenuPanel.classList.remove("hidden");
            if (hamburgerBtn) hamburgerBtn.classList.add("active");
        }
    } else if (hamburgerMenuPanel && !hamburgerMenuPanel.classList.contains("hidden")) {
        hamburgerMenuPanel.classList.add("hidden");
        if (hamburgerBtn) hamburgerBtn.classList.remove("active");
    }

    if (sideToolbar && !sideToolbar.classList.contains("hidden")) {
        sideToolbar.classList.add("hidden");
        const addBrushButtons = toolbar.querySelectorAll(
            "#toolbar-add-elements button, #toolbar-sound-generators button, #toolbar-drones button, #toolbar-pulsars button, #toolbar-logic-nodes button, #toolbar-environment-nodes button"
        );
        addBrushButtons.forEach(btn => btn.classList.remove("active"));
        if (brushBtn) brushBtn.classList.remove("active");
    }
}

let isReplaceMode = false;

function openReplaceInstrumentMenu() {
  isReplaceMode = true;
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Replace";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const instruments = [
    { icon: "🔔", label: "FM Synth", handler: () => populateReplacePresetMenu('fmSynths', 'FM Synths') },
    { icon: "🛰️", label: "Sampler", handler: () => populateReplacePresetMenu('samplers', 'Samplers') },
    { icon: "🥁", label: "Drum", handler: () => populateReplacePresetMenu('drumElements', 'Drum Elements') },
    { icon: "⚙️", label: "Motor Orb", handler: () => setupAddTool(null, MOTOR_ORB_TYPE, false) },
  ];
  instruments.forEach(inst => {
    const btn = document.createElement('button');
    btn.classList.add('type-button');
    btn.innerHTML = `<span class="type-icon">${inst.icon}</span> <span>${inst.label}</span>`;
    btn.addEventListener('click', () => inst.handler());
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add('narrow');
  sideToolbar.classList.remove('hidden');
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add('hidden');
  if (hamburgerBtn) hamburgerBtn.classList.remove('active');
}

function populateReplacePresetMenu(contentType, title) {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = '';
  sideToolbarTitle.textContent = title;

  const groupDiv = document.createElement('div');
  groupDiv.classList.add('type-group');

  let presets = [];
  if (contentType === 'analogWaveforms') presets = analogWaveformPresets;
  else if (contentType === 'fmSynths') presets = fmSynthPresets;
  else if (contentType === 'samplers') presets = samplerWaveformTypes;
  else if (contentType === 'drumElements') presets = drumElementTypes;
  else if (contentType === 'radio') presets = Array.from({length:8}, (_,i)=>({type:`radio_pad_${i}`,label:`Pad ${i+1}`}));

  presets.forEach(p => {
    const btn = document.createElement('button');
    const cls = contentType === 'drumElements' ? 'drum-element-button' : 'waveform-button';
    btn.classList.add(cls);
    btn.dataset.type = p.type;
    btn.textContent = p.label;
    btn.addEventListener('click', () => applyReplacement(p.type, contentType));
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add('narrow');
  sideToolbar.classList.remove('hidden');
}

function applyReplacement(presetType, contentType) {
  isReplaceMode = false;
  selectedElements.forEach(elData => {
    if (elData.type !== 'node') return;
    const node = findNodeById(elData.id);
    if (!node) return;
    const oldPitch = node.audioParams?.pitch;
    const oldScale = node.audioParams?.scaleIndex;
    stopNodeAudio(node);

    if (contentType === 'drumElements') {
      node.type = presetType;
      if (!node.audioParams) node.audioParams = {};
      const def = DRUM_ELEMENT_DEFAULTS[presetType] || {};
      Object.assign(node.audioParams, def);
    } else if (contentType === 'radio') {
      node.type = RADIO_ORB_TYPE;
      if (!node.audioParams) node.audioParams = {};
      const idx = parseInt(presetType.replace('radio_pad_','')) || 0;
      node.audioParams.sampleIndex = idx;
      node.audioParams.visualStyle = 'radio_orb_default';
    } else {
      node.type = 'sound';
      if (!node.audioParams) node.audioParams = {};
      node.audioParams.waveform = presetType;
      const preset = analogWaveformPresets.find(a=>a.type===presetType) || fmSynthPresets.find(f=>f.type===presetType);
      if (preset && preset.details && preset.details.visualStyle) {
        node.audioParams.visualStyle = preset.details.visualStyle;
      } else if (presetType.startsWith('sampler_')) {
        node.audioParams.visualStyle = presetType;
      }
    }

    if (oldPitch !== undefined) node.audioParams.pitch = oldPitch;
    if (oldScale !== undefined) node.audioParams.scaleIndex = oldScale;

    node.audioNodes = createAudioNodesForNode(node);
    if (node.audioNodes) updateNodeAudioParams(node);
  });

  saveState();
  sideToolbar.classList.add('hidden');
  populateEditPanel();
}

function populateInstrumentMenu() {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Instruments";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const instruments = [
    {
      icon: "🔔",
      label: "FM Synth",
      handler: () => {
        soundEngineToAdd = "tonefm";
        setupAddTool(null, "sound", true, "fmSynths", "FM Synths");
      },
    },
    {
      icon: "🎶",
      label: "Tone Synth",
      handler: () => {
        soundEngineToAdd = "tone";
        setupAddTool(null, "sound", true, "analogWaveforms", "Tone Synths");
      },
    },
    {
      icon: "🛰️",
      label: "Sampler",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, "sound", true, "samplers", "Samplers");
      },
    },
    {
      icon: "🥁",
      label: "Drum",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, null, true, "drumElements", "Drum Elements");
      },
    },
    {
      icon: "🔮",
      label: "MIDI Orb",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, MIDI_ORB_TYPE, false);
      },
    },
    {
      icon: "👽",
      label: "Alien Orb",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, ALIEN_ORB_TYPE, false);
      },
    },
    {
      icon: "🎐",
      label: "Resonautor",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, RESONAUTER_TYPE, false);
      },
    },
    {
      icon: "⚙️",
      label: "Motor Orb",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, MOTOR_ORB_TYPE, false);
      },
    },
  ];
  instruments.forEach((inst) => {
    const btn = document.createElement("button");
    btn.classList.add("type-button");
    btn.innerHTML = `<span class="type-icon">${inst.icon}</span> <span>${inst.label}</span>`;
    btn.addEventListener("click", () => {
      inst.handler();
      if (
        helpWizard &&
        !helpWizard.classList.contains("hidden") &&
        currentHelpStep === 3 &&
        inst.label === "Tone Synth"
      ) {
        nextHelpStep();
      }
    });
    if (inst.label === "Tone Synth") {
      toneSynthBtn = btn;
      helpSteps[3].target = btn;
    }
    groupDiv.appendChild(btn);
  });

  if (
    helpWizard &&
    !helpWizard.classList.contains("hidden") &&
    currentHelpStep === 3
  ) {
    showHelpStep();
  }

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add("narrow");
  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function populateToolMenu() {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Tools";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const tools = [
    { icon: "🚦", label: "Gate", handler: () => setupAddTool(null, "gate") },
    {
      icon: "%",
      label: "Probability Gate",
      handler: () => setupAddTool(null, "probabilityGate"),
    },
    { icon: "·", label: "Relay", handler: () => setupAddTool(null, "relay") },
    {
      icon: "⟲",
      label: "Reflector",
      handler: () => setupAddTool(null, "reflector"),
    },
    { icon: "⭬", label: "Switch", handler: () => setupAddTool(null, "switch") },
    {
      icon: "🔑",
      label: "Key Setter",
      handler: () => setupAddTool(null, "global_key_setter"),
    },
    {
      icon: "⚡",
      label: "Send Canvas Orb",
      handler: () => setupAddTool(null, CANVAS_SEND_ORB_TYPE, false),
    },
    {
      icon: "🎯",
      label: "Receive Canvas Orb",
      handler: () => setupAddTool(null, CANVAS_RECEIVE_ORB_TYPE, false),
    },
  ];

  tools.forEach((t) => {
    const btn = document.createElement("button");
    btn.classList.add("type-button");
    btn.innerHTML = `<span class="type-icon">${t.icon}</span> <span>${t.label}</span>`;
    btn.addEventListener("click", () => t.handler());
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add("narrow");
  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function populateConnectionMenu() {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Connections";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const connectionTools = [
    { icon: "🔗", label: "Standard", handler: () => setActiveTool("connect") },
    {
      icon: "🎻",
      label: "String",
      handler: () => setActiveTool("connect_string"),
    },
    {
      icon: "🌠",
      label: "Glide",
      handler: () => setActiveTool("connect_glide"),
    },
    {
      icon: "\uD83E\uDDFE",
      label: "Rope",
      handler: () => setActiveTool("connect_rope"),
    },
    {
      icon: "〰️",
      label: "WaveTrail",
      handler: () => setActiveTool("connect_wavetrail"),
    },
    {
      icon: "➡️",
      label: "One Way",
      handler: () => setActiveTool("connect_oneway"),
    },
  ];

  connectionTools.forEach((t) => {
    const btn = document.createElement("button");
    btn.classList.add("type-button");
    btn.innerHTML = `<span class="type-icon">${t.icon}</span> <span>${t.label}</span>`;
    btn.addEventListener("click", () => t.handler());
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add("narrow");
  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function populateDroneMenu() {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Drones";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const drones = [
    {
      icon: "🌌",
      label: "Nebula",
      handler: () =>
        setupAddTool(null, "nebula", true, "waveforms", "Nebula Sounds"),
    },
    {
      icon: "🌀",
      label: "Portal Nebula",
      handler: () => setupAddTool(null, PORTAL_NEBULA_TYPE, false),
    },
    {
      icon: "🛸",
      label: "Alien Drone",
      handler: () => setupAddTool(null, ALIEN_DRONE_TYPE, false),
    },
    {
      icon: "🎐",
      label: "Arvo Drone",
      handler: () => setupAddTool(null, ARVO_DRONE_TYPE, false),
    },
    {
      icon: "♾️",
      label: "Flux Drone",
      handler: () => setupAddTool(null, FM_DRONE_TYPE, false),
    },
  ];

  drones.forEach((d) => {
    const btn = document.createElement("button");
    btn.classList.add("type-button");
    btn.innerHTML = `<span class="type-icon">${d.icon}</span> <span>${d.label}</span>`;
    btn.addEventListener("click", () => d.handler());
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add("narrow");
  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function populateMistMenu() {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Mists & Eraser";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const mistTools = [
    { icon: "🌁", label: "Mist", handler: () => setActiveTool("mist") },
    { icon: "🪐", label: "Nebula Crunch", handler: () => setActiveTool("crush") },
    { icon: "🧽", label: "Eraser", handler: () => setActiveTool("eraser") },
  ];

  mistTools.forEach((t) => {
    const btn = document.createElement("button");
    btn.classList.add("type-button");
    btn.innerHTML = `<span class="type-icon">${t.icon}</span> <span>${t.label}</span>`;
    btn.addEventListener("click", () => t.handler());
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add("narrow");
  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function populateMotionMenu() {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Motion";

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  const motionItems = [
    {
      icon: "⚙️",
      label: "Motor Orb",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, MOTOR_ORB_TYPE, false);
      },
    },
    {
      icon: "🕰️",
      label: "Clockwork",
      handler: () => {
        soundEngineToAdd = null;
        setupAddTool(null, CLOCKWORK_ORB_TYPE, false);
      },
    },
  ];

  motionItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.classList.add("type-button");
    btn.innerHTML = `<span class="type-icon">${item.icon}</span> <span>${item.label}</span>`;
    btn.addEventListener("click", () => item.handler());
    groupDiv.appendChild(btn);
  });

  sideToolbarContent.appendChild(groupDiv);
  sideToolbar.classList.add("narrow");
  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function positionResonauterPanel(node) {
    if (!resonauterPanel) return;
    const coords = getScreenCoords(node.x, node.y);
    const offsetX = 80;
    resonauterPanel.style.position = 'fixed';
    resonauterPanel.style.left = `${coords.x + offsetX}px`;
    resonauterPanel.style.top = `${coords.y}px`;
    resonauterPanel.style.right = 'auto';
    resonauterPanel.style.transform = 'translate(0, -50%)';
}

function showResonauterPanel(node) {
    if (!resonauterPanel) return;
    resonauterPanel.classList.remove('hidden');
    resonauterPanel.dataset.nodeId = node.id;
    positionResonauterPanel(node);
}

function hideResonauterPanel() {
    if (resonauterPanel) resonauterPanel.classList.add('hidden');
}
function positionSamplerPanel(node) {
    if (!samplerPanel) return;
    const coords = getScreenCoords(node.x, node.y);
    const offsetX = 80;
    samplerPanel.style.position = "fixed";
    samplerPanel.style.left = `${coords.x + offsetX}px`;
    samplerPanel.style.top = `${coords.y}px`;
    samplerPanel.style.right = "auto";
    samplerPanel.style.transform = "translate(0, -50%)";
}

function showSamplerPanel(node) {
    if (!samplerPanel) return;
    samplerPanel.classList.remove("hidden");
    samplerPanel.dataset.nodeId = node.id;
    positionSamplerPanel(node);
}

function hideSamplerPanel() {
    if (samplerPanel) samplerPanel.classList.add("hidden");
}


function positionRadioOrbPanel(node) {
    if (!radioOrbPanel) return;
    const coords = getScreenCoords(node.x, node.y);
    const offsetX = 80;
    radioOrbPanel.style.position = 'fixed';
    radioOrbPanel.style.left = `${coords.x + offsetX}px`;
    radioOrbPanel.style.top = `${coords.y}px`;
    radioOrbPanel.style.right = 'auto';
    radioOrbPanel.style.transform = 'translate(0, -50%)';
}

function showRadioOrbPanel(node) {
    if (!radioOrbPanel) return;
    radioOrbPanel.classList.remove('hidden');
    radioOrbPanel.dataset.nodeId = node.id;
    positionRadioOrbPanel(node);
}

function hideRadioOrbPanel() {
    if (radioOrbPanel) radioOrbPanel.classList.add('hidden');
}

function positionStringPanel(connection) {
    if (!stringPanel) return;
    const nA = findNodeById(connection.nodeAId);
    const nB = findNodeById(connection.nodeBId);
    if (!nA || !nB) return;
    const pA = getConnectionPoint(nA, connection.nodeAHandle);
    const pB = getConnectionPoint(nB, connection.nodeBHandle);
    const mX = (pA.x + pB.x) / 2 + connection.controlPointOffsetX;
    const mY = (pA.y + pB.y) / 2 + connection.controlPointOffsetY;
    const coords = getScreenCoords(mX, mY);
    const offsetX = 60;
    stringPanel.style.position = 'fixed';
    stringPanel.style.left = `${coords.x + offsetX}px`;
    stringPanel.style.top = `${coords.y}px`;
    stringPanel.style.right = 'auto';
    stringPanel.style.transform = 'translate(0, -50%)';
}

function showStringPanel(connection) {
    if (!stringPanel) return;
    stringPanel.classList.remove('hidden');
    stringPanel.dataset.connectionId = connection.id;
    positionStringPanel(connection);
}

function hideStringPanel() {
    if (stringPanel) stringPanel.classList.add('hidden');
}




export function createOp1HBar(id, info, node) {
    const wrap = document.createElement('div');
    wrap.className = 'prorb-hbar-wrapper';
    const bar = document.createElement('div');
    bar.className = 'prorb-hbar';
    const geez = document.createElement('div');
    geez.className = 'geez-display';
    const setFromVal = (v) => {
        const pct = ((v - info.min) / (info.max - info.min)) * 100;
        bar.style.width = `${Math.max(2, Math.min(100, pct))}%`;
    };
    setFromVal(node.audioParams[info.id]);
    if (node.type === ALIEN_ORB_TYPE || node.type === ALIEN_DRONE_TYPE) {
        geez.textContent = randomGeez(3 + Math.floor(Math.random()*3));
    }
    wrap.appendChild(bar);
    wrap.appendChild(geez);
    let dragging = false;
    const updateFromX = (x) => {
        const rect = wrap.getBoundingClientRect();
        let ratio = (x - rect.left) / rect.width;
        ratio = Math.max(0, Math.min(1, ratio));
        const newVal = info.min + ratio * (info.max - info.min);
        node.audioParams[info.id] = newVal;
        setFromVal(newVal);
        if (node.type === ALIEN_ORB_TYPE || node.type === ALIEN_DRONE_TYPE) {
            geez.textContent = randomGeez(3 + Math.floor(Math.random()*3));
        }
        if (node.type === ALIEN_ORB_TYPE) {
            if (info.id === 'lfoRate') setAlienLfoRate(newVal);
            if (info.id === 'lfoAmount') setAlienLfoAmount(newVal);
            updateAlienParams();
        } else {
            updateNodeAudioParams(node);
            drawPrOrbDisplay(node, currentPrOrbSection);
        }
    };
    wrap.addEventListener('mousedown', (e) => {
        dragging = true;
        updateFromX(e.clientX);
        const moveHandler = (ev) => {
            if (dragging) updateFromX(ev.clientX);
        };
        const upHandler = () => {
            if (dragging) {
                dragging = false;
                saveState();
            }
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    });
    return wrap;
}

let currentPrOrbSection = 'OSC';


function drawWaveform(ctx, type, color, amp, width, height) {
    
    if (type && type.startsWith('analog_')) {
        type = type.replace('analog_', '');
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const midY = height / 2;
    if (type === 'square') {
        ctx.moveTo(0, midY);
        ctx.lineTo(width * 0.25, midY - amp * midY);
        ctx.lineTo(width * 0.75, midY - amp * midY);
        ctx.lineTo(width * 0.75, midY + amp * midY);
        ctx.lineTo(width, midY + amp * midY);
    } else if (type === 'triangle') {
        ctx.moveTo(0, midY);
        ctx.lineTo(width * 0.5, midY - amp * midY);
        ctx.lineTo(width, midY);
    } else if (type === 'sawtooth') {
        ctx.moveTo(0, midY + amp * midY);
        ctx.lineTo(width, midY - amp * midY);
        ctx.lineTo(width, midY + amp * midY);
    } else {
        for (let x = 0; x <= width; x++) {
            const t = (x / width) * 2 * Math.PI;
            const y = Math.sin(t) * amp * midY;
            if (x === 0) ctx.moveTo(x, midY - y);
            else ctx.lineTo(x, midY - y);
        }
    }
    ctx.stroke();
}

function prorbShapeForWaveform(type) {
    if (!type) return 'circle';
    if (type.startsWith('analog_')) type = type.replace('analog_', '');
    switch (type) {
        case 'square':
            return 'square';
        case 'triangle':
            return 'triangle';
        case 'sawtooth':
            return 'saw';
        default:
            return 'circle';
    }
}

function drawPrOrbShapePath(ctx, x, y, r, shape) {
    if (shape === 'square') {
        ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (shape === 'triangle') {
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y + r);
        ctx.lineTo(x - r, y + r);
        ctx.closePath();
    } else if (shape === 'pentagon' || shape === 'hexagon') {
        const sides = shape === 'pentagon' ? 5 : 6;
        for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shape === 'star') {
        const points = 5;
        for (let i = 0; i <= points * 2; i++) {
            const radius = (i % 2 === 0) ? r : r * 0.5;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shape === 'pentagon' || shape === 'hexagon') {
        const sides = shape === 'pentagon' ? 5 : 6;
        for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shape === 'star') {
        const points = 5;
        for (let i = 0; i <= points * 2; i++) {
            const radius = (i % 2 === 0) ? r : r * 0.5;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shape === 'pentagon' || shape === 'hexagon') {
        const sides = shape === 'pentagon' ? 5 : 6;
        for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shape === 'star') {
        const points = 5;
        for (let i = 0; i <= points * 2; i++) {
            const radius = (i % 2 === 0) ? r : r * 0.5;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(a) * radius;
            const py = y + Math.sin(a) * radius;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else if (shape === 'saw') {
        ctx.moveTo(x - r, y + r);
        ctx.lineTo(x - r, y - r);
        ctx.lineTo(x + r, y + r);
        ctx.closePath();
    } else {
        ctx.arc(x, y, r, 0, Math.PI * 2);
    }
}

function drawAmpEnv(ctx, params, width, height) {
    ctx.beginPath();
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    const total =
        params.ampEnvAttack +
        params.ampEnvDecay +
        params.ampEnvRelease +
        0.2; 
    const unit = width / total;
    const startY = height;
    ctx.moveTo(0, startY);
    let x = params.ampEnvAttack * unit;
    ctx.lineTo(x, 0);
    const sustainY = height * (1 - params.ampEnvSustain);
    let x2 = x + params.ampEnvDecay * unit;
    ctx.lineTo(x2, sustainY);
    let x3 = x2 + 0.2 * unit;
    ctx.lineTo(x3, sustainY);
    let x4 = x3 + params.ampEnvRelease * unit;
    ctx.lineTo(x4, height);
    ctx.stroke();
}

function drawPrOrbDisplay(node, section) {
    const container = document.getElementById('prorb-orbital-container');
    if (!container) return;
    const canvas = container.querySelector('.prorb-display-screen');
    if (!canvas) return;
    const ctxd = canvas.getContext('2d');
    ctxd.clearRect(0, 0, canvas.width, canvas.height);
    const params = node.audioParams;
    if (section === 'OSC') {
        drawWaveform(ctxd, params.osc2Waveform, 'rgba(150,150,220,0.9)', 1.1, canvas.width, canvas.height);
        drawWaveform(ctxd, params.osc1Waveform, 'rgba(220,220,255,0.9)', 1.0, canvas.width, canvas.height);
    } else if (section === 'AMP') {
        drawAmpEnv(ctxd, params, canvas.width, canvas.height);
    } else if (section === 'MOD') {
        drawWaveform(ctxd, params.lfo2Waveform, 'rgba(150,255,150,0.9)', 1.0, canvas.width, canvas.height);
        drawWaveform(ctxd, params.lfoWaveform, 'rgba(220,255,220,0.9)', 1.0, canvas.width, canvas.height);
    }
    
}


function hideSamplerOrbMenu() {
    const existing = document.getElementById('sampler-orb-container');
    if (existing) existing.remove();
    if (samplerPanelContent) samplerPanelContent.innerHTML = '';
    currentSamplerNode = null;
    samplerWaveformCanvas = null;
    samplerVisualPlayhead = null;
    samplerEnvelopeDot = null;
    if (samplerPlayheadTimeout) {
        clearTimeout(samplerPlayheadTimeout);
        samplerPlayheadTimeout = null;
    }
}

function hideRadioOrbMenu() {
    const existing = document.getElementById('radio-orb-container');
    if (existing) existing.remove();
    if (radioOrbPanelContent) radioOrbPanelContent.innerHTML = '';
}

function hideResonauterOrbMenu() {
    const existing = document.getElementById('resonauter-orb-container');
    if (existing) existing.remove();
    if (resonauterPanelContent) resonauterPanelContent.innerHTML = '';
}


function showResonauterOrbMenu(node) {
    hideResonauterOrbMenu();
    hideSamplerOrbMenu();
    if (!node || node.type !== RESONAUTER_TYPE) return;
    showResonauterPanel(node);
    if (!resonauterPanelContent) return;
    const container = document.createElement('div');
    container.id = 'resonauter-orb-container';
    container.className = 'op1-panel';
    container.dataset.nodeId = node.id;
    resonauterPanelContent.innerHTML = '';
    resonauterPanelContent.appendChild(container);

    const displayRow = document.createElement('div');
    displayRow.className = 'op1-display-row';
    const displayWrap = document.createElement('div');
    displayWrap.className = 'op1-display';
    const dispCanvas = document.createElement('canvas');
    dispCanvas.width = 240;
    dispCanvas.height = 80;
    dispCanvas.className = 'prorb-display-screen';
    displayWrap.appendChild(dispCanvas);
    displayRow.appendChild(displayWrap);
    container.appendChild(displayRow);

    const tabs = document.createElement('div');
    tabs.className = 'retrigger-editor-tabs';
    const btnExc = document.createElement('button');
    btnExc.className = 'retrigger-tab-button active';
    btnExc.textContent = 'Exciters';
    const btnMat = document.createElement('button');
    btnMat.className = 'retrigger-tab-button';
    btnMat.textContent = 'Material';
    const btnMot = document.createElement('button');
    btnMot.className = 'retrigger-tab-button';
    btnMot.textContent = 'Motion';
    const btnFx = document.createElement('button');
    btnFx.className = 'retrigger-tab-button';
    btnFx.textContent = 'Effects';
    [btnExc, btnMat, btnMot, btnFx].forEach(b => tabs.appendChild(b));
    container.appendChild(tabs);

    Object.assign(resonauterGranParams, {
        gSize: node.audioParams.gSize ?? 0.3,
        gPitch: node.audioParams.gPitch ?? 0.5,
        gPos: node.audioParams.gPos ?? 0.0,
        gDensity: node.audioParams.gDensity ?? 0.5,
        gTexture: node.audioParams.gTexture ?? 0.5,
        gMix: node.audioParams.gMix ?? 0.0,
    });
    if (node.audioNodes?.reverbSendGain) {
        node.audioNodes.reverbSendGain.gain.value = node.audioParams.reverbSend ?? 0.2;
    }

    function createRow(paramList, labelMap) {
        const row = document.createElement('div');
        row.className = 'prorb-bar-row';
        paramList.forEach(p => {
            const wrap = document.createElement('div');
            wrap.className = 'prorb-bar-wrapper';
            const bar = document.createElement('div');
            bar.className = 'prorb-bar';
            const val = (node.audioParams[p] ?? 0.5) * 100;
            const setVal = v => { bar.style.height = `${Math.max(2, Math.min(100, v))}%`; wrap.dataset.value = v / 100; };
            setVal(val);
            wrap.appendChild(bar);
            let dragging = false;
            const updateFromPos = y => {
                const rect = wrap.getBoundingClientRect();
                let ratio = (rect.bottom - y) / rect.height;
                ratio = Math.max(0, Math.min(1, ratio));
                const newVal = ratio;
                setVal(newVal * 100);
                node.audioParams[p] = newVal;
                if (p === 'space') {
                    node.audioParams.reverbSend = newVal;
                    if (node.audioNodes?.reverbSendGain) {
                        node.audioNodes.reverbSendGain.gain.setTargetAtTime(newVal, audioContext.currentTime, 0.05);
                    }
                }
                if (p.startsWith('g')) {
                    resonauterGranParams[p] = newVal;
                }
                updateNodeAudioParams(node);
            };
            wrap.addEventListener('mousedown', e => {
                dragging = true;
                updateFromPos(e.clientY);
                const move = ev => { if (dragging) updateFromPos(ev.clientY); };
                const up = () => {
                    dragging = false;
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                    saveState();
                };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            });
            row.appendChild(wrap);
            const lbl = document.createElement('div');
            lbl.className = 'prorb-bar-label';
            lbl.textContent = labelMap[p] || p;
            wrap.appendChild(lbl);
        });
        return row;
    }

    const excParams = ['bow', 'blow', 'strike', 'mallet', 'hammer'];
    const excLabels = { bow: 'BOW', blow: 'BLW', strike: 'STRK', mallet: 'MAL', hammer: 'HAM' };
    const matParams = ['brightness', 'damping', 'geometry', 'material'];
    const matLabels = { brightness: 'BRI', damping: 'DMP', geometry: 'GEO', material: 'MAT' };
    const motParams = ['strength', 'contour', 'length', 'repeat', 'strum', 'position'];
    const motLabels = { strength: 'STR', contour: 'CNT', length: 'LEN', repeat: 'RPT', strum: 'STRM', position: 'POS' };
    const fxParams = ['release', 'space', 'gSize', 'gPitch', 'gPos', 'gDensity', 'gTexture', 'gMix'];
    const fxLabels = { release: 'REL', space: 'SPC', gSize: 'SIZE', gPitch: 'PIT', gPos: 'POS', gDensity: 'DEN', gTexture: 'TEX', gMix: 'MIX' };

    const rowExc = createRow(excParams, excLabels);
    const rowMat = createRow(matParams, matLabels);
    const rowMot = createRow(motParams, motLabels);
    const rowFx = createRow(fxParams, fxLabels);
    container.appendChild(rowExc);
    container.appendChild(rowMat);
    container.appendChild(rowMot);
    container.appendChild(rowFx);

    function switchTab(t) {
        rowExc.style.display = t === 'exc' ? 'flex' : 'none';
        rowMat.style.display = t === 'mat' ? 'flex' : 'none';
        rowMot.style.display = t === 'mot' ? 'flex' : 'none';
        rowFx.style.display = t === 'fx' ? 'flex' : 'none';
        btnExc.classList.toggle('active', t === 'exc');
        btnMat.classList.toggle('active', t === 'mat');
        btnMot.classList.toggle('active', t === 'mot');
        btnFx.classList.toggle('active', t === 'fx');
        currentResonauterTab = t;
    }
    btnExc.addEventListener('click', () => switchTab('exc'));
    btnMat.addEventListener('click', () => switchTab('mat'));
    btnMot.addEventListener('click', () => switchTab('mot'));
    btnFx.addEventListener('click', () => switchTab('fx'));
    switchTab(currentResonauterTab);
    positionResonauterPanel(node);
}

function showRadioOrbMenu(node) {
    hideRadioOrbMenu();
    hideSamplerOrbMenu();
    if (!node || node.type !== RADIO_ORB_TYPE) return;
    showRadioOrbPanel(node);
    if (!radioOrbPanelContent) return;
    const container = document.createElement('div');
    container.id = 'radio-orb-container';
    container.className = 'panel-section';
    container.dataset.nodeId = node.id;
    radioOrbPanelContent.innerHTML = '';
    radioOrbPanelContent.appendChild(container);

    const label = document.createElement('label');
    label.textContent = 'Sample Pad:';
    const select = document.createElement('select');
    for (let i = 0; i < 8; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Pad ${i + 1}`;
        if ((node.audioParams.sampleIndex ?? 0) === i) opt.selected = true;
        select.appendChild(opt);
    }
    select.addEventListener('change', e => {
        node.audioParams.sampleIndex = parseInt(e.target.value);
        saveState();
    });
    container.appendChild(label);
    container.appendChild(select);
}

function hideStringConnectionMenu() {
    const existing = document.getElementById('string-connection-container');
    if (existing) existing.remove();
    if (stringPanelContent) stringPanelContent.innerHTML = '';
}

function showStringConnectionMenu(connection) {
    hideStringConnectionMenu();
    if (!connection || connection.type !== 'string_violin') return;
    showStringPanel(connection);
    if (!stringPanelContent) return;
    const container = document.createElement('div');
    container.id = 'string-connection-container';
    container.className = 'panel-section';
    stringPanelContent.innerHTML = '';
    stringPanelContent.appendChild(container);
    const params = connection.audioParams || {};
    const d = STRING_VIOLIN_DEFAULTS;

    const addSlider = (id, label, min, max, step, val, prop, fmt) => {
        const slider = createSlider(id, `${label} (${fmt(val)}):`, min, max, step, val,
            () => { updateConnectionAudioParams(connection); saveState(); },
            e => { const v=parseFloat(e.target.value); connection.audioParams[prop]=v; e.target.previousElementSibling.textContent = `${label} (${fmt(v)}):`; updateConnectionAudioParams(connection); });
        container.appendChild(slider);
    };

    addSlider(`string-vol-${connection.id}`, 'Volume', 0, 1, 0.01, params.volume ?? d.volume, 'volume', v=>v.toFixed(2));
    addSlider(`string-attack-${connection.id}`, 'Attack', 0.01, 1, 0.01, params.attack ?? d.attack, 'attack', v=>v.toFixed(2)+'s');
    addSlider(`string-release-${connection.id}`, 'Release', 0.1, 5, 0.01, params.release ?? d.release, 'release', v=>v.toFixed(2)+'s');
    addSlider(
        `string-vdepth-${connection.id}`,
        'Vibrato Amt',
        0,
        50,
        0.1,
        params.vibratoDepth ?? d.vibratoDepth,
        'vibratoDepth',
        v => v.toFixed(1)
    );
    addSlider(`string-vrate-${connection.id}`, 'Vibrato Rate', 0.1, 12, 0.1, params.vibratoRate ?? d.vibratoRate, 'vibratoRate', v=>v.toFixed(1)+'Hz');
}

function showSamplerOrbMenu(node) {
    hideSamplerOrbMenu();
    if (!node || node.type !== 'sound' || !node.audioParams.waveform || !node.audioParams.waveform.startsWith('sampler_')) return;
    currentSamplerNode = node;
    showSamplerPanel(node);
    if (!samplerPanelContent) return;
    const samplerId = node.audioParams.waveform.replace('sampler_', '');
    const definition = typeof SAMPLER_DEFINITIONS !== 'undefined' ? SAMPLER_DEFINITIONS.find(s => s.id === samplerId) : null;
    const buffer = definition?.buffer || null;
    const container = document.createElement('div');
    container.id = 'sampler-orb-container';
    container.className = 'op1-panel';
    container.dataset.nodeId = node.id;
    samplerPanelContent.innerHTML = '';
    samplerPanelContent.appendChild(container);
    const displayRow = document.createElement('div');
    displayRow.className = 'op1-display-row';
    const displayWrap = document.createElement('div');
    displayWrap.className = 'op1-display';
    samplerWaveformCanvas = document.createElement('canvas');
    samplerWaveformCanvas.id = 'samplerWaveformCanvas';
    samplerWaveformCanvas.className = 'prorb-display-screen';
    samplerWaveformCanvas.width = 240;
    samplerWaveformCanvas.height = 80;
    displayWrap.appendChild(samplerWaveformCanvas);
    samplerVisualPlayhead = document.createElement('div');
    samplerVisualPlayhead.id = 'samplerVisualPlayhead';
    samplerVisualPlayhead.className = 'sampler-visual-playhead';
    samplerVisualPlayhead.style.display = 'none';
    samplerEnvelopeDot = document.createElement('div');
    samplerEnvelopeDot.className = 'sampler-envelope-dot';
    samplerVisualPlayhead.appendChild(samplerEnvelopeDot);
    displayWrap.appendChild(samplerVisualPlayhead);
    displayRow.appendChild(displayWrap);
    container.appendChild(displayRow);
    drawSamplerWaveform(
        buffer,
        samplerWaveformCanvas,
        node.audioParams.sampleStart ?? 0,
        node.audioParams.sampleEnd ?? 1,
        node.audioParams.sampleAttack ?? 0,
        node.audioParams.sampleRelease ?? 0
    );
    const barRow = document.createElement('div');
    barRow.className = 'prorb-bar-row';
    const controls = [
        {id:'sampleStart',min:0,max:1,label:'STA'},
        {id:'sampleEnd',min:0,max:1,label:'END'},
        {id:'sampleAttack',min:0,max:1,label:'F.IN'},
        {id:'sampleRelease',min:0,max:1.5,label:'F.OUT'},
        {id:'sampleGain',min:0,max:2,label:'VOL'}
    ];
    samplerSliders = {};
    controls.forEach(info => {
        const wrap = document.createElement('div');
        wrap.className = 'prorb-bar-wrapper';
        const bar = document.createElement('div');
        bar.className = 'prorb-bar';
        const val = node.audioParams[info.id] ?? info.min;
        const pct = ((val - info.min) / (info.max - info.min)) * 100;
        bar.style.height = `${Math.max(2, Math.min(100, pct))}%`;
        wrap.appendChild(bar);
        const setVal = v => { bar.style.height = `${Math.max(2, Math.min(100, v))}%`; };
        let dragging = false;
        const updateFromPos = y => {
            const rect = wrap.getBoundingClientRect();
            let ratio = (rect.bottom - y) / rect.height;
            ratio = Math.max(0, Math.min(1, ratio));
            const newVal = info.min + ratio * (info.max - info.min);
            node.audioParams[info.id] = newVal;
            if(info.id==='sampleStart' || info.id==='sampleEnd' || info.id==='sampleAttack' || info.id==='sampleRelease'){
                let st=node.audioParams.sampleStart ?? 0;
                let en=node.audioParams.sampleEnd ?? 1;
                if(en < st){ if(info.id==='sampleStart') { en = st; node.audioParams.sampleEnd = en; } else { st = en; node.audioParams.sampleStart = st; } }
                let atk = node.audioParams.sampleAttack ?? 0;
                let rel = node.audioParams.sampleRelease ?? 0;
                node.audioParams.sampleAttack = atk;
                node.audioParams.sampleRelease = rel;
                drawSamplerWaveform(
                    buffer,
                    samplerWaveformCanvas,
                    st,
                    en,
                    atk,
                    rel
                );
                if(samplerSliders.sampleAttack && info.id!=='sampleAttack'){
                    const pctA=((atk - controls[2].min)/(controls[2].max-controls[2].min))*100;
                    samplerSliders.sampleAttack.setVal(pctA);
                }
                if(samplerSliders.sampleRelease && info.id!=='sampleRelease'){
                    const pctR=((rel - controls[3].min)/(controls[3].max-controls[3].min))*100;
                    samplerSliders.sampleRelease.setVal(pctR);
                }
            }
            const pct=((node.audioParams[info.id]-info.min)/(info.max-info.min))*100;
            setVal(pct);
            if(node.audioNodes) updateNodeAudioParams(node);
        };
        wrap.addEventListener('mousedown', e => {
            dragging = true; updateFromPos(e.clientY);
            const move = ev => { if (dragging) updateFromPos(ev.clientY); };
            const up = () => { dragging = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); saveState(); };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
        const lbl = document.createElement('div');
        lbl.className = 'prorb-bar-label';
        lbl.textContent = info.label;
        wrap.appendChild(lbl);
        barRow.appendChild(wrap);
        samplerSliders[info.id] = { wrap, setVal };
    });
    container.appendChild(barRow);
    const revRow = document.createElement('div');
    revRow.style.display = 'flex';
    revRow.style.justifyContent = 'center';
    revRow.style.marginTop = '4px';
    const revBtn = document.createElement('button');
    revBtn.className = 'toggle-button';
    revBtn.textContent = 'REV';
    if (node.audioParams.sampleReverse) revBtn.classList.add('active');
    revBtn.addEventListener('click', () => {
        node.audioParams.sampleReverse = !node.audioParams.sampleReverse;
        revBtn.classList.toggle('active', node.audioParams.sampleReverse);
        saveState();
    });
    revRow.appendChild(revBtn);
    container.appendChild(revRow);
    positionSamplerPanel(node);
}

export function handleNewWorkspace(skipConfirm = false) {
  if (!skipConfirm && unsavedChanges) {
    if (
      !confirm(
        "Are you sure you want to start a new workspace? Unsaved changes will be lost.",
      )
    ) {
      return;
    }
  }

  nodes.forEach((node) => stopNodeAudio(node));
  connections.forEach((conn) => stopConnectionAudio(conn));
  activePulses = [];
  nodes = [];
  if (typeof window !== 'undefined') {
    window.nodes = nodes;
  }
  connections = [];
  selectedElements.clear();
  currentConstellationGroup.clear();
  fluctuatingGroupNodeIDs.clear();
  nodeIdCounter = 0;
  connectionIdCounter = 0;
  pulseIdCounter = 0;
  particleIdCounter = 0;
  windParticles = [];

  historyStack = [];
  historyIndex = -1;
  saveState();
  unsavedChanges = false;
  try {
    localStorage.removeItem('resonaut_state');
  } catch (e) {}

  viewOffsetX = 0;
  viewOffsetY = 0;
  viewScale = 1.0;

  clearEditPanel();
  updateConstellationGroup();
  updateGroupControlsUI();
  if (isAudioReady) {
    identifyAndRouteAllGroups();
    updateMixerGUI();
  }
  if (pianoRollCanvas && pianoRollCtx) drawPianoRoll();

  if (isPlaying && !animationFrameId) {
    startAnimationLoop();
  } else if (!isPlaying) {
    if (appMenuPlayPauseBtn) appMenuPlayPauseBtn.textContent = "Play ▶";
  }

  draw();
}

if (appMenuRecordBtn) {
  appMenuRecordBtn.addEventListener("click", () => {
    if (!userHasInteracted && !isAudioReady) {
      alert(
        "Start alsjeblieft eerst de audio door op Play te klikken of de pagina te herladen als er een fout was.",
      );
      return;
    }
    if (!isAudioReady) {
      alert(
        "Audio is nog niet geïnitialiseerd. Probeer de pagina te vernieuwen of wacht even.",
      );
      return;
    }
    if (audioContext.state === "suspended") {
      alert(
        "Audio is gepauzeerd. Hervat audio (Play) voordat je probeert op te nemen.",
      );
      return;
    }

    if (window.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
} else {
  console.error("#app-menu-record-btn niet gevonden in DOM!");
}

if (tapeLoopRecordBtn) {
  tapeLoopRecordBtn.addEventListener("click", () => {
    if (!tapeLoopRecordBtnClickable) {
      return;
    }

    if (!audioContext || audioContext.state !== "running") {
      alert(
        "Audio context is nog niet klaar of is gepauzeerd. Activeer audio eerst.",
      );
      return;
    }

    if (tapeLoopRecordBtn.dataset.isArmed === "true") {
      tapeLoopRecordBtn.dataset.isArmed = "false";
      tapeLoopRecordBtnClickable = true;
      scheduledTapeLoopEvents = scheduledTapeLoopEvents.filter(
        (e) => e.action !== "startRec",
      );

      if (tapeLoopInputGate) {
        tapeLoopInputGate.gain.cancelScheduledValues(audioContext.currentTime);
        tapeLoopInputGate.gain.setValueAtTime(0, audioContext.currentTime);
      }
      isTapeLoopRecording = false;
      updateTapeLooperUI();
    } else if (isTapeLoopRecording) {
      if (tapeLoopInputGate) {
        tapeLoopInputGate.gain.cancelScheduledValues(audioContext.currentTime);
        tapeLoopInputGate.gain.setValueAtTime(0.0, audioContext.currentTime);
      }
      scheduledTapeLoopEvents = scheduledTapeLoopEvents.filter(
        (e) => e.action !== "stopRecAndPlay",
      );

      isTapeLoopRecording = false;
      if (scriptNodeForTapeLoop) {
        try {
          scriptNodeForTapeLoop.disconnect();
        } catch (e) {}
        if (tapeLoopInputGate && scriptNodeForTapeLoop) {
          try {
            tapeLoopInputGate.disconnect(scriptNodeForTapeLoop);
          } catch (e) {}
        }
        scriptNodeForTapeLoop.onaudioprocess = null;
        scriptNodeForTapeLoop = null;
      }

      if (
        tapeLoopBuffer &&
        tapeLoopWritePosition > audioContext.sampleRate * 0.05
      ) {
        const actualRecordedDuration =
          tapeLoopWritePosition / audioContext.sampleRate;
        tapeLoopEffectivelyRecordedDuration = actualRecordedDuration;
        userDefinedLoopStart = 0;
        userDefinedLoopEnd = actualRecordedDuration;

        if (tapeLoopStartInput)
          tapeLoopStartInput.value = userDefinedLoopStart.toFixed(2);
        if (tapeLoopEndInput)
          tapeLoopEndInput.value = userDefinedLoopEnd.toFixed(2);

        waveformPathData = null;
        updateTapeLooperUI();
        playTapeLoop(audioContext.currentTime);
      } else {
        clearTapeLoop();
      }
    } else if (!isTapeLoopPlaying) {
      clearTapeLoop();
      startTapeLoopRecording();
    } else {
    }
  });
}

if (tapeLoopPlayBtn) {
  tapeLoopPlayBtn.addEventListener("click", () => {
    if (tapeLoopBuffer && !isTapeLoopPlaying && !isTapeLoopRecording) {
      playTapeLoop();
    }
  });
}

if (tapeLoopStopBtn) {
  tapeLoopStopBtn.addEventListener("click", () => {
    if (isTapeLoopPlaying) {
      stopTapeLoopPlayback();
    }
  });
}

if (tapeLoopClearBtn) {
  tapeLoopClearBtn.addEventListener("click", () => {
    clearTapeLoop();
  });
}

if (tapeLoopDurationInput) {
  tapeLoopDurationInput.addEventListener("change", (e) => {
    const newDuration = parseFloat(e.target.value);
    if (!isNaN(newDuration) && newDuration > 0) {
      configuredTapeLoopDurationSeconds = newDuration;
      if (!isTapeLoopRecording && !isTapeLoopPlaying) {
        updateTapeLooperUI();
      }
    } else {
      e.target.value = configuredTapeLoopDurationSeconds;
    }
  });
}

if (tapeTrackButtons) {
  tapeTrackButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.track);
      if (!isNaN(idx)) switchTapeTrack(idx);
    });
  });
}

function clearEditPanel() {
  if (editPanelContent) {
    editPanelContent.innerHTML = "";
  }

  if (
    selectedElements.size === 0 &&
    hamburgerMenuPanel &&
    !hamburgerMenuPanel.classList.contains("hidden")
  ) {
    hamburgerMenuPanel.classList.add("hidden");
    if (hamburgerBtn) hamburgerBtn.classList.remove("active");
  }
}


function toggleHelpPopup() {
  if (helpPopup) {
    helpPopup.classList.toggle("hidden");
  }
}

let toneSynthBtn = null;
let squareWaveBtn = null;
const helpSteps = [
  {
    text: "Add a Pulsar using the 🔆 button",
    target: addPulsarBtn,
  },
  {
    text: "Choose the Standard Pulsar",
    target: null,
  },
  {
    text: "Open the 🎼 Instruments menu",
    target: instrumentsMenuBtn,
  },
  {
    text: "Choose Tone Synth",
    target: null,
  },
  {
    text: "Select the Square waveform",
    target: null,
  },
  {
    text: "Connect orbs from the 🔗 menu",
    target: connectionsMenuBtn,
  },
  {
    text: "All done! Good luck and have fun!",
    target: document.body,
  },
];
let currentHelpStep = 0;

function showHelpStep() {
  if (!helpWizard) return;
  const step = helpSteps[currentHelpStep];

  if (!step) return;
  if (wizardMessage)
    wizardMessage.textContent = step.text;
  const rect = (step.target || document.body).getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  let arrowTop = rect.top + scrollY - 50;
  let arrowLeft = rect.left + scrollX + rect.width / 2;
  let textTop = rect.top + scrollY - 110;
  let textLeft = rect.left + scrollX;

  if (wizardHighlight) {
    wizardHighlight.style.top = rect.top + scrollY - 4 + "px";
    wizardHighlight.style.left = rect.left + scrollX - 4 + "px";
    wizardHighlight.style.width = rect.width + 8 + "px";
    wizardHighlight.style.height = rect.height + 8 + "px";
    wizardHighlight.style.display = step.target ? "block" : "none";
  }

  if (rect.top < 100) {
    if (wizardArrow) wizardArrow.textContent = "⬅️";
    arrowTop = rect.top + scrollY + rect.height / 2;
    arrowLeft = rect.left + scrollX + rect.width + 10;
    textTop = rect.top + scrollY;
    textLeft = rect.left + scrollX + rect.width + 40;
  } else {
    if (wizardArrow) wizardArrow.textContent = "⬇️";
  }

  wizardArrow.style.top = Math.max(0, arrowTop) + "px";
  wizardArrow.style.left = Math.max(0, arrowLeft) + "px";
  wizardArrow.style.display = step.target ? "block" : "none";
  wizardText.style.top = Math.max(0, textTop) + "px";
  wizardText.style.left = Math.max(0, textLeft) + "px";
  helpWizard.classList.remove("hidden");
  if (wizardPrevBtn)
    wizardPrevBtn.disabled = currentHelpStep === 0;
  if (wizardNextBtn)
    wizardNextBtn.disabled = currentHelpStep === helpSteps.length - 1;
}

function openHelpWizard() {
  currentHelpStep = 0;
  showHelpStep();
  document.addEventListener("keydown", handleWizardKey);
}

function closeHelpWizard() {
  if (helpWizard) helpWizard.classList.add("hidden");
  document.removeEventListener("keydown", handleWizardKey);
}

function nextHelpStep() {
  if (currentHelpStep < helpSteps.length - 1) {
    currentHelpStep++;
    showHelpStep();
  }
}

function prevHelpStep() {
  if (currentHelpStep > 0) {
    currentHelpStep--;
    showHelpStep();
  }
}

function handleWizardKey(e) {
  if (e.key === "Escape") {
    closeHelpWizard();
  }
}

function populateBrushOptionsPanel() {
  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = "Brush Options";

  const createBrushSection = (titleText) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("brush-tool-section");

    const header = document.createElement("p");
    header.textContent = titleText;
    header.classList.add("brush-section-header");
    sectionDiv.appendChild(header);

    const gridContainer = document.createElement("div");
    gridContainer.classList.add("brush-section-grid");
    sectionDiv.appendChild(gridContainer);

    sideToolbarContent.appendChild(sectionDiv);
    return gridContainer;
  };

  const createBrushOptionButton = (
    item,
    nodeTypeForBrush,
    waveformValue,
    gridContainer,
  ) => {
    const button = document.createElement("button");
    button.classList.add("brush-option-icon-button");
    button.dataset.nodeType = nodeTypeForBrush;
    button.dataset.waveform = waveformValue;

    button.innerHTML = `<span class="type-icon">${item.icon || "❔"}</span>`;
    button.title = item.label;

    if (item.loadFailed) {
      button.disabled = true;
      button.title = `${item.label} (sample failed to load)`;
      button.classList.add("disabled");
    }

    if (brushNodeType === nodeTypeForBrush && brushWaveform === waveformValue) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      if (button.disabled) return;
      brushNodeType = nodeTypeForBrush;
      brushWaveform = waveformValue;

      sideToolbarContent
        .querySelectorAll(".brush-option-icon-button")
        .forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
    });
    gridContainer.appendChild(button);
  };

  if (
    typeof analogWaveformPresets !== "undefined" &&
    analogWaveformPresets.length > 0
  ) {
    const analogGrid = createBrushSection("Analog");
    analogWaveformPresets.forEach((preset) => {
      createBrushOptionButton(preset, "sound", preset.type, analogGrid);
    });
  }


  if (
    typeof samplerWaveformTypes !== "undefined" &&
    samplerWaveformTypes.length > 0
  ) {
    const samplerGrid = createBrushSection("Samplers");
    samplerWaveformTypes.forEach((samplerPreset) => {
      createBrushOptionButton(
        samplerPreset,
        "sound",
        samplerPreset.type,
        samplerGrid,
      );
    });
  }

  if (typeof drumElementTypes !== "undefined" && drumElementTypes.length > 0) {
    const drumGrid = createBrushSection("Drums");
    drumElementTypes.forEach((drumPreset) => {
      createBrushOptionButton(
        drumPreset,
        drumPreset.type,
        drumPreset.type,
        drumGrid,
      );
    });
  }

  const midiGrid = createBrushSection("MIDI");
  createBrushOptionButton(
    { label: "MIDI Orb", icon: "🔮" },
    MIDI_ORB_TYPE,
    "",
    midiGrid,
  );

  const pulseOptionDiv = document.createElement("div");
  pulseOptionDiv.classList.add("panel-section");
  pulseOptionDiv.style.marginTop = "15px";
  const pulseLabel = document.createElement("label");
  pulseLabel.htmlFor = "brushStartPulseCheckbox";
  pulseLabel.style.display = "inline-block";
  pulseLabel.style.marginRight = "5px";
  pulseLabel.textContent = "Start chain with Pulsar?";
  const pulseCheckbox = document.createElement("input");
  pulseCheckbox.type = "checkbox";
  pulseCheckbox.id = "brushStartPulseCheckbox";
  pulseCheckbox.checked = brushStartWithPulse;
  pulseCheckbox.style.verticalAlign = "middle";
  pulseCheckbox.addEventListener("change", (e) => {
    brushStartWithPulse = e.target.checked;
  });
  pulseOptionDiv.appendChild(pulseCheckbox);
  pulseOptionDiv.appendChild(pulseLabel);
  sideToolbarContent.appendChild(pulseOptionDiv);

  const notesDiv = document.createElement("div");
  notesDiv.classList.add("panel-section");
  notesDiv.style.marginTop = "10px";
  const notesLabel = document.createElement("label");
  notesLabel.htmlFor = "brushNotesInput";
  notesLabel.textContent = "Note Sequence:";
  notesLabel.style.display = "block";
  const notesInput = document.createElement("input");
  notesInput.type = "text";
  notesInput.id = "brushNotesInput";
  notesInput.placeholder = "e4,e3,d5";
  notesInput.value = brushNotesInputValue;
  notesInput.addEventListener("input", (e) => {
    updateBrushNoteSequenceFromString(e.target.value);
  });
  notesDiv.appendChild(notesLabel);
  notesDiv.appendChild(notesInput);
  sideToolbarContent.appendChild(notesDiv);

  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function handleElementTypeSelect(button, elementType) {
  nodeTypeToAdd = elementType;
  waveformToAdd = elementType;
  noteIndexToAdd = -1;
  const currentTypeButtons = sideToolbarContent.querySelectorAll(
    ".type-button, .drum-element-button",
  );
  currentTypeButtons.forEach((btn) => btn.classList.remove("selected"));
  if (button) button.classList.add("selected");
  removeNoteSelector();
}

function handleWaveformSelect(button, waveformType) {
  if (nodeTypeToAdd !== "sound" && nodeTypeToAdd !== "nebula") {
    console.warn(
      `handleWaveformSelect called with unexpected nodeTypeToAdd: ${nodeTypeToAdd} for waveform ${waveformType}`,
    );
    return;
  }

  waveformToAdd = waveformType;

  const currentWaveButtons = sideToolbarContent.querySelectorAll(
    ".waveform-button, .sampler-button",
  );
  currentWaveButtons.forEach((btn) => btn.classList.remove("selected"));
  if (button) button.classList.add("selected");

  if (
    nodeTypeToAdd === "sound" ||
    nodeTypeToAdd === "nebula" ||
    nodeTypeToAdd === RESONAUTER_TYPE
  ) {
    sideToolbarContent.innerHTML = "";
    sideToolbar.classList.remove("narrow");
    createHexNoteSelectorDOM(sideToolbarContent);
  }
}

function updateScaleAndTransposeUI() {
  if (scaleSelectTransport) scaleSelectTransport.value = currentScaleKey;
  if (pianoRollModeSelect) pianoRollModeSelect.value = pianoRollMode;
  if (backgroundSelect) backgroundSelect.value = backgroundMode;
}

function changeScale(scaleKey, skipNodeUpdate = false) {
  if (!scales[scaleKey]) return;
  currentScaleKey = scaleKey;
  currentScale = scales[scaleKey];
  document.body.className = currentScale.theme;
  if (scaleSelectTransport) {
      scaleSelectTransport.value = scaleKey;
  }
  
  setTimeout(() => {
      const computedStyles = getComputedStyle(document.body);
      const gradStart = computedStyles.getPropertyValue('--mixer-gradient-start').trim();
      const gradMid = computedStyles.getPropertyValue('--mixer-gradient-mid').trim();
      const gradEnd = computedStyles.getPropertyValue('--mixer-gradient-end').trim();
  
      const dialGrad = document.getElementById('dialGrad');
      if (dialGrad) {
          const stops = dialGrad.getElementsByTagName('stop');
          if (stops.length >= 3) {
              if (gradStart) stops[0].setAttribute('stop-color', gradStart);
              if (gradMid) stops[1].setAttribute('stop-color', gradMid);
              if (gradEnd) stops[2].setAttribute('stop-color', gradEnd);
          }
      }
      if(isAudioReady && mixerPanel && !mixerPanel.classList.contains('hidden')) {
          updateMixerGUI(); 
      }
  }, 50);
  
  if (!skipNodeUpdate) {
      const newThemeMeteorColors = getThemeMeteorColors(); 
  
      nodes.forEach((node) => {
          if (
              node.type === "sound" ||
              node.type === "nebula" ||
              node.type === PRORB_TYPE ||
              node.type === MIDI_ORB_TYPE
          ) {
              node.audioParams.scaleIndex = Math.max(
                  MIN_SCALE_INDEX,
                  Math.min(MAX_SCALE_INDEX, node.audioParams.scaleIndex ?? 0),
              );
              node.audioParams.pitch = getFrequency(
                  currentScale,
                  node.audioParams.scaleIndex,
                  0,
                  currentRootNote,
                  globalTransposeOffset,
              );
              if (isNaN(node.audioParams.pitch)) {
                  node.audioParams.scaleIndex = 0;
                  node.audioParams.pitch = getFrequency(
                    currentScale,
                    0,
                    0,
                    currentRootNote,
                    globalTransposeOffset,
                  );
              }
              updateNodeAudioParams(node);
          }
          if (node.type === 'pulsar_meteorshower' && newThemeMeteorColors.length > 0) {
              node.color = newThemeMeteorColors[Math.floor(Math.random() * newThemeMeteorColors.length)];
          }
      });
      connections.forEach((conn) => {
          if (conn.type === "string_violin") {
              conn.audioParams.scaleIndex = Math.max(
                  MIN_SCALE_INDEX,
                  Math.min(MAX_SCALE_INDEX, conn.audioParams.scaleIndex ?? 0),
              );
              conn.audioParams.pitch = getFrequency(
                  currentScale,
                  conn.audioParams.scaleIndex,
                  0,
                  currentRootNote,
                  globalTransposeOffset,
              );
              if (isNaN(conn.audioParams.pitch)) {
                  conn.audioParams.scaleIndex = 0;
                  conn.audioParams.pitch = getFrequency(
                    currentScale,
                    0,
                    0,
                    currentRootNote,
                    globalTransposeOffset,
                  );
              }
              updateConnectionAudioParams(conn);
          }
      });
  }
  
  if (
      !sideToolbar.classList.contains("hidden") &&
        (nodeTypeToAdd === "sound" || nodeTypeToAdd === "nebula" || nodeTypeToAdd === RESONAUTER_TYPE || nodeTypeToAdd === ALIEN_ORB_TYPE || nodeTypeToAdd === ALIEN_DRONE_TYPE)
  ) {
      noteIndexToAdd = -1;
      if (currentTool === "add" || currentTool === "brush") {
          if (document.getElementById("hexNoteSelectorContainer")) {
              createHexNoteSelectorDOM(sideToolbarContent);
          }
      }
  }
  
  drawPianoRoll();
  populateEditPanel();
  if (!skipNodeUpdate) {
      saveState();
  }
}
function updateSyncUI() {
  if (appMenuSyncToggleBtn) {
    appMenuSyncToggleBtn.textContent = "Sync";
    appMenuSyncToggleBtn.classList.toggle("active", isGlobalSyncEnabled);
  }
  if (appMenuBpmControls) {
    appMenuBpmControls.classList.toggle("hidden", !isGlobalSyncEnabled);
  }
  if (appMenuBpmInput) {
    appMenuBpmInput.value = globalBPM;
  }
  updateRestartPulsarsButtonVisibility();
  populateEditPanel();
}

function updateRestartPulsarsButtonVisibility() {
  let showButton = false;
  if (
    currentTool === "edit" &&
    !isGlobalSyncEnabled &&
    selectedElements.size > 0
  ) {
    for (const el of selectedElements) {
      if (el.type === "node") {
        const node = findNodeById(el.id);
        if (node && node.isStartNode && node.type !== "pulsar_triggerable") {
          showButton = true;
          break;
        }
      }
    }
  }
  if (appMenuRestartPulsarsBtn) {
    appMenuRestartPulsarsBtn.classList.toggle("hidden", !showButton);
  }
}

function updateReplaceMenuState() {
  if (!appMenuReplace) return;
  let hasNodeSelected = false;
  selectedElements.forEach((el) => {
    if (el.type === "node") {
      hasNodeSelected = true;
    }
  });
  appMenuReplace.classList.toggle("disabled", !hasNodeSelected);
}

function updateInfoToggleUI() {
  toggleInfoTextBtn.textContent = "Info";
  toggleInfoTextBtn.classList.toggle("active", isInfoTextVisible);
}


function hideOverlappingPanels() {
  const sideToolbar = document.getElementById("sideToolbar");
  const hamburgerMenuPanel = document.getElementById("hamburgerMenuPanel");
  const hamburgerBtn = document.getElementById("hamburgerBtn");

  if (sideToolbar) sideToolbar.classList.add("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}

function makePanelDraggable(panel, handle) {
  if (!panel || !handle) return;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  const onMove = ev => {
    if (!dragging) return;
    panel.style.left = `${ev.clientX - offsetX}px`;
    panel.style.top = `${ev.clientY - offsetY}px`;
    panel.style.transform = 'none';
  };
  const onUp = () => {
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  handle.addEventListener('mousedown', e => {
    dragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}



function drawResonatorShape(ctx, cx, cy, radius, geometry, material, brightness, damping, now) {
    const sides = 3 + Math.floor(geometry * 7);
    const angleOffset = resonauterSpinPhase * 0.1;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + angleOffset;
        const r = radius * (1 + Math.sin(angle * (sides / 2) + now / 500) * geometry * 0.1);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    const hue = 200 + brightness * 60;
    const sat = 50 + material * 40;
    const light = 40 + brightness * 30;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
    ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 20}%, 1)`;
    ctx.lineWidth = 1 + (1 - damping) * 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = (1 - damping) * 15;
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
}


function togglePlayPause() {
  userHasInteracted = true;
  const startPlayback = () => {
    isPlaying = true;
    onPlaybackStarted();
    if (appMenuPlayPauseBtn) appMenuPlayPauseBtn.textContent = "Pause ⏸";
    if (startMessage) startMessage.style.display = "none";
    startAnimationLoop();
    resetStartNodeTimers();
    resetTimelineGridPositions();
  };
  const stopPlayback = () => {
    isPlaying = false;
    onPlaybackStopped();
    if (appMenuPlayPauseBtn) appMenuPlayPauseBtn.textContent = "Play ▶";
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    activePulses.forEach((p) => {
      const conn = findConnectionById(p.connectionId);
      if (conn && conn.type === "string_violin") stopStringSound(conn);
    });
  };
  if (!isAudioReady) {
    setupAudio()
      .then((context) => {
        if (context) {
          context
            .resume()
            .catch(() => {})
            .finally(startPlayback);
        }
      })
      .catch(() => {});
    return;
  }

  if (!isPlaying) {
    audioContext
      .resume()
      .then(startPlayback)
      .catch(() => {});
  } else {
    audioContext
      .suspend()
      .then(stopPlayback)
      .catch(() => {});
  }
}


function getOrbitoneFrequencies(
  baseScaleIndex,
  orbitoneCount,
  orbitoneIntervals,
  orbitoneSpread,
  scaleDef,
  mainNodePitch,
) {
  const frequencies = [mainNodePitch];
  const numNotesInScale = scaleDef.notes.length;

  if (orbitoneCount <= 0) {
    return [mainNodePitch];
  }

  for (let i = 0; i < orbitoneCount; i++) {
    let currentIntervalOffsetInScaleSteps =
      orbitoneIntervals[i] !== undefined ? orbitoneIntervals[i] : (i + 1) * 2;
    let noteOctaveOffsetFromSpread = 0;
    const targetScaleIndexForOrbitone =
      baseScaleIndex + currentIntervalOffsetInScaleSteps;
    const freq = getFrequency(
      scaleDef,
      targetScaleIndexForOrbitone,
      noteOctaveOffsetFromSpread,
      currentRootNote,
      globalTransposeOffset,
    );

    if (!isNaN(freq) && freq > 0) {
      frequencies.push(freq);
    } else {
      const fallbackSemitoneOffset = (i + 1) * 3;
      frequencies.push(
        mainNodePitch * Math.pow(2, fallbackSemitoneOffset / 12),
      );
    }
  }
  return frequencies.slice(0, 1 + orbitoneCount);
}

function applyOrbitoneVoicingFromPhase(node) {
  if (
    !node ||
    !node.audioParams ||
    !(
      node.type === "sound" ||
      node.type === ALIEN_ORB_TYPE ||
      node.type === ALIEN_DRONE_TYPE
    )
  )
    return;
  const phase = node.audioParams.orbitoneVoicingPhase || 0;
  const count = node.audioParams.orbitoneCount || 0;
  let intervals = [];
  let calculatedSpread = 0;

  if (count > 0) {
    if (phase <= 20) {
      intervals = count > 0 ? [2] : [];
      if (count > 1) intervals.push(3);
      if (count > 2) intervals.push(1);
      if (count > 3) intervals.push(4);
      if (count > 4) intervals.push(5);
      calculatedSpread = 0;
    } else if (phase <= 40) {
      intervals = count > 0 ? [4] : [];
      if (count > 1) intervals.push(count > 2 ? 3 : 2);
      if (count > 2) intervals.push(1);
      if (count > 3) intervals.push(5);
      if (count > 4) intervals.push(2);
      calculatedSpread = 0;
    } else if (phase <= 60) {
      intervals = count > 0 ? [2] : [];
      if (count > 1) intervals.push(4);
      if (count > 2) intervals.push(6);
      if (count > 3) intervals.push(1);
      if (count > 4) intervals.push(3);
      calculatedSpread = 0;
    } else if (phase <= 80) {
      intervals = count > 0 ? [0] : [];
      if (count > 1) intervals.push(2);
      if (count > 2) intervals.push(-2);
      if (count > 3) intervals.push(4);
      if (count > 4) intervals.push(-4);
      calculatedSpread = 1;
    } else {
      intervals = count > 0 ? [1 + Math.floor(Math.random() * 2)] : [];
      if (count > 1) intervals.push(4 + Math.floor(Math.random() * 3 - 1));
      if (count > 2) intervals.push(-1 + Math.floor(Math.random() * 3 - 1));
      if (count > 3) intervals.push(5 + Math.floor(Math.random() * 2 - 1));
      if (count > 4) intervals.push(-3 + Math.floor(Math.random() * 3 - 1));
      calculatedSpread = Math.random() > 0.4 ? 1 : 0;
    }
  }
  node.audioParams.orbitoneIntervals = intervals.slice(0, count);
  node.audioParams.orbitoneSpread = calculatedSpread;
}

function applyOrbitoneTimingFromPhase(node) {
  if (
    !node ||
    !node.audioParams ||
    !(
      node.type === "sound" ||
      node.type === ALIEN_ORB_TYPE ||
      node.type === ALIEN_DRONE_TYPE
    )
  )
    return;
  const phase = node.audioParams.orbitoneTimingPhase || 0;
  const count = node.audioParams.orbitoneCount || 0;
  let offsets = [];

  if (count > 0) {
    if (phase <= 10) {
      for (let i = 0; i < count; i++) offsets.push(0);
    } else if (phase <= 30) {
      for (let i = 0; i < count; i++)
        offsets.push(Math.floor(Math.random() * 25) + i * 5);
    } else if (phase <= 50) {
      for (let i = 0; i < count; i++)
        offsets.push(i * 30 + Math.floor(Math.random() * 20));
    } else if (phase <= 70) {
      for (let i = 0; i < count; i++)
        offsets.push(i * 80 + Math.floor(Math.random() * 40));
    } else if (phase <= 90) {
      for (let i = 0; i < count; i++)
        offsets.push(i * 150 + Math.floor(Math.random() * 50));
    } else {
      for (let i = 0; i < count; i++)
        offsets.push(Math.floor(Math.random() * 200) + i * 15);
    }
  }
  const spreadFactor = node.audioParams.orbitoneSpread || 0;
  const finalOffsets = offsets.map((o) => o * spreadFactor);
  node.audioParams.orbitoneTimingOffsets = finalOffsets.slice(0, count);
}

function addNode(x, y, type, subtype = null, optionalDimensions = null) {

  const isStartNodeType = isPulsarType(type);
  let nodeTypeVisual = type;
  let initialScaleIndex = 0;
  let initialPitch = 0;
  let nodeSubtypeForAudioParams = subtype;
  let initialBaseHue = null;
  let visualStyle = null;
  let audioDetails = {};
  let selectedPreset = null;

  if (type === "sound" && type !== PRORB_TYPE) {
    selectedPreset =
      analogWaveformPresets.find((p) => p.type === subtype) ||
      fmSynthPresets.find((p) => p.type === subtype);
  } else if (isPulsarType(type)) {
    nodeSubtypeForAudioParams = type;
    selectedPreset = pulsarTypes.find((p) => p.type === type);
  }

  if (selectedPreset && selectedPreset.details) {
    visualStyle = selectedPreset.details.visualStyle || null;
    Object.keys(selectedPreset.details).forEach((key) => {
      if (key === "filterCutoff") {
        audioDetails["lowPassFreq"] = selectedPreset.details[key];
      } else if (key !== "visualStyle") {
        audioDetails[key] = selectedPreset.details[key];
      }
    });
    if (selectedPreset.details.filterType)
      audioDetails.filterType = selectedPreset.details.filterType;
    if (selectedPreset.details.filterResonance !== undefined)
      audioDetails.filterResonance = selectedPreset.details.filterResonance;
  }

  if (type === "sound" && type !== PRORB_TYPE) {
    if (
      noteIndexToAdd !== -1 &&
      noteIndexToAdd !== null &&
      noteIndexToAdd >= MIN_SCALE_INDEX &&
      noteIndexToAdd <= MAX_SCALE_INDEX
    ) {
      initialScaleIndex = noteIndexToAdd;
    } else {
      initialScaleIndex = Math.floor(
        Math.random() * currentScale.notes.length * 3,
      ) - currentScale.notes.length;
    }
    initialScaleIndex = Math.max(
      MIN_SCALE_INDEX,
      Math.min(MAX_SCALE_INDEX, initialScaleIndex),
    );
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch) || initialPitch <= 0) {
      initialScaleIndex = 0;
      initialPitch = getFrequency(
        currentScale,
        0,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
      if (isNaN(initialPitch) || initialPitch <= 0) initialPitch = 261.63;
    }

    if (
      !nodeSubtypeForAudioParams ||
      !(
        analogWaveformPresets.some(
          (p) => p.type === nodeSubtypeForAudioParams,
        ) ||
        fmSynthPresets.some((p) => p.type === nodeSubtypeForAudioParams) ||
        samplerWaveformTypes.some((s) => s.type === nodeSubtypeForAudioParams)
      )
    ) {
      nodeSubtypeForAudioParams = "sine";
      const sinePreset = analogWaveformPresets.find((p) => p.type === "sine");
      if (sinePreset && sinePreset.details) {
        visualStyle = sinePreset.details.visualStyle || "analog_sine";
        audioDetails = {};
        Object.keys(sinePreset.details).forEach((key) => {
          if (key === "filterCutoff")
            audioDetails["lowPassFreq"] = sinePreset.details[key];
          else if (key !== "visualStyle")
            audioDetails[key] = sinePreset.details[key];
        });
        if (sinePreset.details.filterType)
          audioDetails.filterType = sinePreset.details.filterType;
        if (sinePreset.details.filterResonance !== undefined)
          audioDetails.filterResonance = sinePreset.details.filterResonance;
      }
    } else if (
      nodeSubtypeForAudioParams &&
      nodeSubtypeForAudioParams.startsWith("sampler_")
    ) {
      const samplerId = nodeSubtypeForAudioParams.replace("sampler_", "");
      const definition =
        typeof SAMPLER_DEFINITIONS !== "undefined" ?
        SAMPLER_DEFINITIONS.find((s) => s.id === samplerId) :
        null;
      if (!definition || definition.loadFailed) {
        nodeSubtypeForAudioParams = "sine";
        const sinePreset = analogWaveformPresets.find((p) => p.type === "sine");
        if (sinePreset && sinePreset.details) {
          visualStyle = sinePreset.details.visualStyle || "analog_sine";
          audioDetails = {};
          Object.keys(sinePreset.details).forEach((key) => {
            if (key === "filterCutoff")
              audioDetails["lowPassFreq"] = sinePreset.details[key];
            else if (key !== "visualStyle")
              audioDetails[key] = sinePreset.details[key];
          });
          if (sinePreset.details.filterType)
            audioDetails.filterType = sinePreset.details.filterType;
          if (sinePreset.details.filterResonance !== undefined)
            audioDetails.filterResonance = sinePreset.details.filterResonance;
        }
      } else {
        visualStyle = visualStyle || `sampler_${samplerId}`;
      }
    }
  } else if (type === PRORB_TYPE) {
    initialScaleIndex = noteIndexToAdd !== -1 && noteIndexToAdd !== null
        ? noteIndexToAdd
        : Math.floor(Math.random() * currentScale.notes.length * 3)
          - currentScale.notes.length;
    initialScaleIndex = Math.max(MIN_SCALE_INDEX, Math.min(MAX_SCALE_INDEX, initialScaleIndex));
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch) || initialPitch <= 0) {
        initialScaleIndex = 0;
        initialPitch = getFrequency(
          currentScale,
          0,
          0,
          currentRootNote,
          globalTransposeOffset,
        );
    }
    visualStyle = "prorb_default";
    nodeSubtypeForAudioParams = null;
  } else if (type === MIDI_ORB_TYPE) {
    initialScaleIndex =
      noteIndexToAdd !== -1 && noteIndexToAdd !== null
        ? noteIndexToAdd
        : Math.floor(Math.random() * currentScale.notes.length * 3)
          - currentScale.notes.length;
    initialScaleIndex = Math.max(
      MIN_SCALE_INDEX,
      Math.min(MAX_SCALE_INDEX, initialScaleIndex),
    );
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch) || initialPitch <= 0) {
      initialScaleIndex = 0;
      initialPitch = getFrequency(
        currentScale,
        0,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
    }
    visualStyle = "midi_orb_default";
    nodeSubtypeForAudioParams = null;
  } else if (type === ALIEN_ORB_TYPE) {
    initialScaleIndex =
      noteIndexToAdd !== -1 && noteIndexToAdd !== null
        ? noteIndexToAdd
        : Math.floor(Math.random() * currentScale.notes.length * 3)
          - currentScale.notes.length;
    initialScaleIndex = Math.max(
      MIN_SCALE_INDEX,
      Math.min(MAX_SCALE_INDEX, initialScaleIndex),
    );
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch) || initialPitch <= 0) {
      initialScaleIndex = 0;
      initialPitch = getFrequency(
        currentScale,
        0,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
    }
    visualStyle = "alien_orb_default";
    nodeSubtypeForAudioParams = null;
  } else if (type === RESONAUTER_TYPE) {
    initialScaleIndex =
      noteIndexToAdd !== -1 && noteIndexToAdd !== null
        ? noteIndexToAdd
        : Math.floor(Math.random() * currentScale.notes.length * 3)
          - currentScale.notes.length;
    initialScaleIndex = Math.max(
      MIN_SCALE_INDEX,
      Math.min(MAX_SCALE_INDEX, initialScaleIndex),
    );
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch) || initialPitch <= 0) {
      initialScaleIndex = 0;
      initialPitch = getFrequency(
        currentScale,
        0,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
    }
    visualStyle = "resonauter_default";
    nodeSubtypeForAudioParams = null;
  } else if (type === RADIO_ORB_TYPE) {
    initialScaleIndex = noteIndexToAdd !== -1 && noteIndexToAdd !== null ? noteIndexToAdd : 0;
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    visualStyle = "radio_orb_default";
    nodeSubtypeForAudioParams = null;
  } else if (type === "nebula") {
    initialBaseHue = Math.random() * 360;
    nodeSubtypeForAudioParams =
      waveformToAdd || audioDetails.osc1Type || "sawtooth";
    visualStyle = visualStyle || "nebula_default";
    initialScaleIndex =
      noteIndexToAdd !== -1 && noteIndexToAdd !== null
        ? noteIndexToAdd
        : Math.floor(
            Math.random() * currentScale.notes.length * 3,
          ) - currentScale.notes.length;
    initialScaleIndex = Math.max(
      MIN_SCALE_INDEX,
      Math.min(MAX_SCALE_INDEX, initialScaleIndex),
    );
    initialPitch = getFrequency(
      currentScale,
      initialScaleIndex,
      0,
      currentRootNote,
      globalTransposeOffset,
    );
    if (isNaN(initialPitch) || initialPitch <= 0)
      initialPitch = getFrequency(
        scales.major,
        0,
        0,
        currentRootNote,
        globalTransposeOffset,
      );
  } else if (type === PORTAL_NEBULA_TYPE) {
    initialBaseHue =
      PORTAL_NEBULA_DEFAULTS.baseColorHue + (Math.random() - 0.5) * 40;
    initialPitch = PORTAL_NEBULA_DEFAULTS.droneBaseFreq;
    nodeSubtypeForAudioParams = null;
    visualStyle = visualStyle || "portal_default";
    audioDetails.actualOscillatorType = "triangle";
  } else if (type === "global_key_setter") {
    nodeSubtypeForAudioParams = type;
    initialPitch = null;
    initialScaleIndex = null;
    visualStyle = "key_setter_default";
  }


  const drumDefaults = isDrumType(type) ? DRUM_ELEMENT_DEFAULTS[type] : {};
  if (isDrumType(type) && !visualStyle) visualStyle = type;

  const starPoints = isStartNodeType ? 6 : 5;
  let defaultIsEnabled = true;
  if (type === "pulsar_triggerable") {
    defaultIsEnabled = false;
  } else if (type === "pulsar_manual") {
    defaultIsEnabled = true;
  }

  const defaultVolumeSteps = [0.8, 0.65, 0.5];
  const numDefaultSteps = defaultVolumeSteps.length;
  const defaultOrbitoneCount = 0;

  let determinedNodeSize;
  if (
    type === "relay" ||
    type === "reflector" ||
    type === "switch" ||
    type === TIMELINE_GRID_TYPE ||
    type === GRID_SEQUENCER_TYPE ||
    type === "global_key_setter"
  ) {
    determinedNodeSize = 0.7;
  } else {
    determinedNodeSize = 1.0;
  }

  const newNode = {
    id: nodeIdCounter++,
    x: x,
    y: y,
    size: determinedNodeSize,
    radius: NODE_RADIUS_BASE,
    type: nodeTypeVisual,
    baseHue: initialBaseHue,
    connections: new Set(),
    isSelected: false,
    isInConstellation: false,
    audioParams: {},
    color: null,
    audioNodes: null,
    isStartNode: isStartNodeType,
    isTriggered: false,
    lastTriggerPulseId: -1,
    animationState: 0,
    isEnabled: defaultIsEnabled,
    starPoints: starPoints,
    currentAngle:
      type === "gate" ||
      (type === "sound" &&
        type !== PRORB_TYPE &&
        nodeSubtypeForAudioParams?.startsWith("sampler_")) ?
      Math.random() * Math.PI * 2 :
      0,
    innerAngle: 0,
    pulsePhase:
      type === "nebula" || type === PORTAL_NEBULA_TYPE ?
      Math.random() * Math.PI * 2 :
      0,
    primaryInputConnectionId: type === "switch" ? null : undefined,
    lastTriggerTime: -1,
    nextSyncTriggerTime: 0,
    activeRetriggers: [],
    currentRetriggerVisualIndex: -1,
    spinSpeed: type === "nebula" ? NEBULA_ROTATION_SPEED_OUTER : 0,
    spinLfoPhase: 0,
    orbitoneRotatePhase: 0,
  };

  if (newNode.type === "pulsar_triggerable") {
    newNode.isEnabled = false;
  }
  
  if (type === "global_key_setter") {
     newNode.isStartNode = false;
  }

  if (type === CANVAS_SEND_ORB_TYPE) {
     newNode.targetCanvasIndex = 0;
     newNode.receiverId = null;
     newNode.audioParams = null;
     visualStyle = "canvas_orb_send";
  } else if (type === CANVAS_RECEIVE_ORB_TYPE) {
     newNode.audioParams = null;
     visualStyle = "canvas_orb_receive";
  } else if (type === PRORB_TYPE) {
    newNode.audioParams = {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
        osc1Waveform: 'sawtooth',
        osc1Octave: 0,
        osc1Level: 0.7,
        osc2Enabled: true,
        osc2Waveform: 'square',
        osc2Octave: -1,
        osc2Detune: 0,
        osc2Level: 0.7,
        filterType: 'lowpass',
        filterCutoff: 4000,
        filterResonance: 1.0,
        filterEnvAmount: 2500,
        ampEnvAttack: 0.02,
        ampEnvDecay: 0.3,
        ampEnvSustain: 0.6,
        ampEnvRelease: 0.4,
        filterEnvAttack: 0.05,
        filterEnvDecay: 0.2,
        filterEnvSustain: 0.3,
        filterEnvRelease: 0.5,
        lfoEnabled: false,
        lfoTarget: 'filter',
        lfoWaveform: 'sine',
        lfoRate: 5.0,
        lfoAmount: 1000,
        lfo2Enabled: false,
        lfo2Target: 'filter',
        lfo2Waveform: 'sine',
        lfo2Rate: 2.0,
        lfo2Amount: 500,
        reverbSend: 0.1,
        delaySend: 0.1,
        visualStyle: "prorb_default",
        ignoreGlobalSync: false,
    };
  } else if (type === MIDI_ORB_TYPE) {
    newNode.audioParams = {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
        velocity: 100,
        noteLength: 0.4,
        midiChannel: 1,
        visualStyle: "midi_orb_default",
        ignoreGlobalSync: false,
    };
  } else if (type === ALIEN_ORB_TYPE) {
    newNode.audioParams = {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
        flux: 50,
        vorr: 50,
        chime: 50,
        dross: 50,
        krell: 50,
        prax: 50,
        zuul: 50,
        qorx: 50,
        lfoRate: 1.0,
        lfoAmount: 0.2,
        lfoTargets: ['flux'],
        engine: alienEngine,
        visualStyle: "alien_orb_default",
        orbitonesEnabled: false,
        orbitoneCount: defaultOrbitoneCount,
        orbitoneVoicingPhase: 0,
        orbitoneTimingPhase: 0,
        orbitoneMix: 0.5,
        orbitoneIntervals: [],
        orbitoneTimingOffsets: [],
        orbitoneSpread: 1,
        orbitoneRotateSpeed: 0,
        orbitoneRotateSpread: 1,
        ignoreGlobalSync: false,
      };
  } else if (type === ALIEN_DRONE_TYPE) {
    newNode.audioParams = {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
        flux: 50,
        vorr: 50,
        chime: 50,
        dross: 50,
        krell: 50,
        prax: 50,
        zuul: 50,
        qorx: 50,
        lfoRate: 0.5,
        lfoAmount: 0.3,
        lfoTargets: ['flux'],
        engine: alienEngine,
        visualStyle: "alien_drone_default",
        orbitonesEnabled: false,
        orbitoneCount: defaultOrbitoneCount,
        orbitoneVoicingPhase: 0,
        orbitoneTimingPhase: 0,
        orbitoneMix: 0.5,
        orbitoneIntervals: [],
        orbitoneTimingOffsets: [],
        orbitoneSpread: 1,
        orbitoneRotateSpeed: 0,
      orbitoneRotateSpread: 1,
      ignoreGlobalSync: false,
    };
  } else if (type === ARVO_DRONE_TYPE) {
    newNode.audioParams = Object.assign({}, DEFAULT_ARVO_DRONE_PARAMS, {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
    });
  } else if (type === FM_DRONE_TYPE) {
    newNode.audioParams = Object.assign({}, DEFAULT_FM_DRONE_PARAMS, {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
    });
  } else if (type === RESONAUTER_TYPE) {
    newNode.audioParams = Object.assign({}, DEFAULT_RESONAUTER_PARAMS, {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
    });
  } else if (type === RADIO_ORB_TYPE) {
    newNode.audioParams = {
        pitch: initialPitch,
        scaleIndex: initialScaleIndex,
        sampleIndex: 0,
        visualStyle: "radio_orb_default",
        ignoreGlobalSync: false,
    };
  } else if (type === MOTOR_ORB_TYPE) {
    newNode.audioParams = Object.assign({}, DEFAULT_MOTOR_PARAMS);
  } else if (type === CLOCKWORK_ORB_TYPE) {
    newNode.audioParams = Object.assign({}, DEFAULT_CLOCKWORK_PARAMS);
    newNode.pulseAdvanceRemaining = 0;
    newNode.pulseForce = CLOCKWORK_FORCE_DEFAULT;
    newNode.pulseDecay = CLOCKWORK_DECAY_DEFAULT;
    newNode.audioParams.pulseForce = newNode.pulseForce;
    newNode.audioParams.pulseDecay = newNode.pulseDecay;
  } else {
    const initialLowPassFreq =
      audioDetails.lowPassFreq !== undefined ?
      audioDetails.lowPassFreq :
      MAX_FILTER_FREQ;
    const initialFilterType = audioDetails.filterType || "lowpass";
    const initialFilterResonance =
      audioDetails.filterResonance !== undefined ?
      audioDetails.filterResonance :
      1.2;

    newNode.audioParams = {
      waveform: nodeSubtypeForAudioParams,
      visualStyle: visualStyle,
      pitch: initialPitch,
      scaleIndex: initialScaleIndex,
      volume: drumDefaults?.volume ?? (type === PORTAL_NEBULA_TYPE ? 0.6 : 1.0),
      reverbSend:
        type === PORTAL_NEBULA_TYPE ?
        DEFAULT_REVERB_SEND * 1.5 :
        DEFAULT_REVERB_SEND,
      delaySend:
        type === PORTAL_NEBULA_TYPE ?
        DEFAULT_DELAY_SEND * 1.2 :
        DEFAULT_DELAY_SEND,
      lowPassFreq: initialLowPassFreq,
      filterType: initialFilterType,
      filterResonance: initialFilterResonance,
      ...audioDetails,
      triggerInterval: audioDetails.triggerInterval || DEFAULT_TRIGGER_INTERVAL,
      syncSubdivisionIndex: audioDetails.syncSubdivisionIndex || DEFAULT_SUBDIVISION_INDEX,
      probability: audioDetails.probability || DEFAULT_PROBABILITY,
      pulseIntensity: audioDetails.pulseIntensity || DEFAULT_PULSE_INTENSITY,
      volLfoRate: audioDetails.volLfoRate || 0.1 + Math.random() * 0.2,
      volLfoDepth: audioDetails.volLfoDepth || 0,
      detune: audioDetails.detune || 7,
      lfoDepthFactor: audioDetails.lfoDepthFactor || 1,
      baseFreq: audioDetails.baseFreq || drumDefaults?.baseFreq,
      decay: audioDetails.decay || drumDefaults?.decay,
      noiseDecay: audioDetails.noiseDecay || drumDefaults?.noiseDecay,
      pitchShiftIndex: type === "pitchShift" ? (audioDetails.pitchShiftIndex || DEFAULT_PITCH_SHIFT_INDEX) : 0,
      pitchShiftAmount: type === "pitchShift" ? PITCH_SHIFT_AMOUNTS[audioDetails.pitchShiftIndex || DEFAULT_PITCH_SHIFT_INDEX] : 0,
      pitchShiftAlternating: type === "pitchShift" ? (audioDetails.pitchShiftAlternating || false) : false,
      pitchShiftDirection: type === "pitchShift" ? (audioDetails.pitchShiftDirection || 1) : 1,
      gateModeIndex: type === "gate" ? (audioDetails.gateModeIndex || DEFAULT_GATE_MODE_INDEX) : 0,
      gateCounter: 0,
      lastRandomGateResult: true,
      midiOutEnabled: false,
      midiChannel: 1,
      midiNote: 60,
      osc1Type: nodeSubtypeForAudioParams,
      orbitonesEnabled: false,
      orbitoneCount: defaultOrbitoneCount,
      orbitoneVoicingPhase: 0,
      orbitoneTimingPhase: 0,
      orbitoneMix: 0.5,
      orbitoneIntervals: [],
      orbitoneTimingOffsets: [],
      orbitoneSpread: 1,
      retriggerEnabled: false,
      retriggerVolumeSteps: [...defaultVolumeSteps],
      retriggerPitchSteps: Array(numDefaultSteps).fill(0),
      retriggerFilterSteps: Array(numDefaultSteps).fill(0),
      retriggerMuteSteps: Array(numDefaultSteps).fill(false),
      retriggerIntervalMs: 100,
      retriggerRateMode: "constant",
      retriggerSyncSubdivisionIndex: DEFAULT_SUBDIVISION_INDEX,
      ignoreGlobalSync: false,
    };
    if (nodeSubtypeForAudioParams && nodeSubtypeForAudioParams.startsWith("sampler_")) {
      Object.assign(newNode.audioParams, {
        sampleStart: 0,
        sampleEnd: 1,
        sampleAttack: 0.01,
        sampleRelease: 0.2,
        sampleGain: 1.0,
        sampleReverse: false,
      });
    }

    if (soundEngineToAdd) {
      newNode.audioParams.engine = soundEngineToAdd;
      if (soundEngineToAdd === 'tone') {
        const existing = { ...newNode.audioParams };
        Object.assign(newNode.audioParams, DEFAULT_ANALOG_ORB_PARAMS);
        Object.assign(newNode.audioParams, existing);
        if (nodeSubtypeForAudioParams) {
          newNode.audioParams.osc1Waveform = nodeSubtypeForAudioParams;
        }
      } else if (soundEngineToAdd === 'tonefm') {
        const existing = { ...newNode.audioParams };
        Object.assign(newNode.audioParams, DEFAULT_TONE_FM_SYNTH_PARAMS);
        Object.assign(newNode.audioParams, existing);
        if (nodeSubtypeForAudioParams && !existing.carrierWaveform) {
          newNode.audioParams.carrierWaveform = nodeSubtypeForAudioParams;
        }
      }
    }
  }
  
  if (type === "global_key_setter") {
     newNode.audioParams.keySetterMode = "key";
     newNode.audioParams.targetKeyNote = 0; 
     newNode.audioParams.targetTransposeOffset = 0;
     newNode.audioParams.pitch = null; 
     newNode.audioParams.scaleIndex = null;
     newNode.audioParams.volume = null; 
     newNode.audioParams.reverbSend = null;
     newNode.audioParams.delaySend = null;
     newNode.audioParams.lowPassFreq = null;
     newNode.audioParams.filterType = null;
     newNode.audioParams.filterResonance = null;
     newNode.audioParams.waveform = type;
  }

  if (type === "pulsar_meteorshower") {
      newNode.audioParams.meteorMaxRadius = METEOR_SHOWER_DEFAULT_MAX_RADIUS;
      newNode.audioParams.meteorGrowthRate = METEOR_SHOWER_DEFAULT_GROWTH_RATE;
      newNode.audioParams.pulseIntensity = newNode.audioParams.pulseIntensity ?? DEFAULT_PULSE_INTENSITY;
      newNode.audioParams.ignoreGlobalSync = newNode.audioParams.ignoreGlobalSync ?? false;
      newNode.audioParams.syncSubdivisionIndex = newNode.audioParams.syncSubdivisionIndex ?? DEFAULT_SUBDIVISION_INDEX;
      newNode.audioParams.triggerInterval = newNode.audioParams.triggerInterval ?? DEFAULT_TRIGGER_INTERVAL;
      
      const themeMeteorColorsForNode = getThemeMeteorColors();
      if (themeMeteorColorsForNode.length > 0) {
          newNode.color = themeMeteorColorsForNode[Math.floor(Math.random() * themeMeteorColorsForNode.length)];
      } else {
          newNode.color = 'rgba(255, 150, 50, 0.7)';
      }
  }

  applyOrbitoneVoicingFromPhase(newNode);
  applyOrbitoneTimingFromPhase(newNode);

  if (newNode.type === "pulsar_rocket" || newNode.type === "pulsar_ufo") {
    newNode.audioParams.rocketDirectionAngle = 0;
    newNode.audioParams.rocketSpeed = ROCKET_DEFAULT_SPEED;
    newNode.audioParams.rocketRange = ROCKET_DEFAULT_RANGE;
    newNode.audioParams.rocketGravity = ROCKET_DEFAULT_GRAVITY;
  }

  if (type === TIMELINE_GRID_TYPE) {
    newNode.width = optionalDimensions ?
      optionalDimensions.width :
      TIMELINE_GRID_DEFAULT_WIDTH;
    newNode.height = optionalDimensions ?
      optionalDimensions.height :
      TIMELINE_GRID_DEFAULT_HEIGHT;
    newNode.timelineSpeed = TIMELINE_GRID_DEFAULT_SPEED;
    newNode.timelineMusicalDurationBars = 1;
    newNode.timelineIsPlaying = true;
    newNode.timelineIsLooping = true;
    newNode.scanLinePosition = 0;
    newNode.triggeredInThisSweep = new Set();
    newNode.timelinePulseIntensity = TIMELINE_GRID_DEFAULT_PULSE_INTENSITY;
    newNode.internalGridDivisions = 8;
    newNode.showInternalGrid = true;
    newNode.snapToInternalGrid = true;
    newNode.isInResizeMode = optionalDimensions ? true : false;
    newNode.scanlineDirection = "forward";
    newNode.isPingPongForward = true;
    newNode.rotation = 0;

    if (!newNode.audioParams) newNode.audioParams = {};
    newNode.audioParams.timelineSpeed = newNode.timelineSpeed;
    newNode.audioParams.timelineMusicalDurationBars =
      newNode.timelineMusicalDurationBars;
    newNode.audioParams.timelineIsPlaying = newNode.timelineIsPlaying;
    newNode.audioParams.timelineIsLooping = newNode.timelineIsLooping;
    newNode.audioParams.timelinePulseIntensity = newNode.timelinePulseIntensity;
    newNode.audioParams.width = newNode.width;
    newNode.audioParams.height = newNode.height;
    newNode.audioParams.internalGridDivisions = newNode.internalGridDivisions;
    newNode.audioParams.showInternalGrid = newNode.showInternalGrid;
    newNode.audioParams.snapToInternalGrid = newNode.snapToInternalGrid;
    newNode.audioParams.scanlineDirection = newNode.scanlineDirection;
    newNode.audioParams.isInResizeMode = newNode.isInResizeMode;
    newNode.audioParams.rotation = 0;

    newNode.audioParams.isTransposeEnabled = false;
    newNode.audioParams.transposeDirection = "+";
    newNode.audioParams.transposeAmount = 0;

    newNode.audioParams.autoRotateEnabled = TIMELINE_GRID_DEFAULT_AUTO_ROTATE_ENABLED;
    newNode.audioParams.autoRotateSpeedManual = TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SPEED_MANUAL;
    newNode.audioParams.autoRotateDirection = TIMELINE_GRID_DEFAULT_AUTO_ROTATE_DIRECTION;
    newNode.audioParams.autoRotateSyncSubdivisionIndex = TIMELINE_GRID_DEFAULT_AUTO_ROTATE_SYNC_SUBDIVISION_INDEX;

    newNode.isStartNode = false;
    newNode.audioNodes = null;
    delete newNode.starPoints;
    delete newNode.baseHue;
    delete newNode.color;
  }
  if (type === SPACERADAR_TYPE || type === CRANK_RADAR_TYPE) {
    newNode.radius = optionalDimensions ? optionalDimensions.width / 2 : SPACERADAR_DEFAULT_RADIUS;
    newNode.radarSpeed = SPACERADAR_DEFAULT_SPEED;
    newNode.radarMusicalDurationBars = SPACERADAR_DEFAULT_MUSICAL_BARS;
    newNode.radarIsPlaying = type === SPACERADAR_TYPE;
    newNode.scanAngle = 0;
    newNode.manualAdvanceIncrement = 0;
    if (type === CRANK_RADAR_TYPE) {
      newNode.pulseAdvanceRemaining = 0;
      newNode.pulseForce = PULSE_FORCE_DEFAULT;
      newNode.pulseDecay = PULSE_DECAY_DEFAULT;
    }
    newNode.triggeredInThisSweep = new Set();
    newNode.radarPulseIntensity = SPACERADAR_DEFAULT_PULSE_INTENSITY;
    newNode.internalGridDivisions = 8;
    newNode.showInternalGrid = true;
    newNode.snapToInternalGrid = true;
    newNode.radarMode = SPACERADAR_DEFAULT_MODE;
    newNode.radarDirection = 1;

    if (!newNode.audioParams) newNode.audioParams = {};
    newNode.audioParams.radarSpeed = newNode.radarSpeed;
    newNode.audioParams.radarIsPlaying = newNode.radarIsPlaying;
    newNode.audioParams.radarMusicalDurationBars = newNode.radarMusicalDurationBars;
    newNode.audioParams.radarPulseIntensity = newNode.radarPulseIntensity;
    newNode.audioParams.manualAdvanceIncrement = newNode.manualAdvanceIncrement;
    if (type === CRANK_RADAR_TYPE) {
      newNode.audioParams.pulseForce = newNode.pulseForce;
      newNode.audioParams.pulseDecay = newNode.pulseDecay;
    }
    newNode.audioParams.radius = newNode.radius;
    newNode.audioParams.internalGridDivisions = newNode.internalGridDivisions;
    newNode.audioParams.showInternalGrid = newNode.showInternalGrid;
    newNode.audioParams.snapToInternalGrid = newNode.snapToInternalGrid;
    newNode.audioParams.radarMode = newNode.radarMode;
    newNode.isStartNode = false;
    newNode.audioNodes = null;
    delete newNode.starPoints;
    delete newNode.baseHue;
    delete newNode.color;
  }

  if (isStartNodeType && newNode.isEnabled && audioContext) {
    const nowTime = audioContext.currentTime;
    const interval = newNode.audioParams.triggerInterval;
    if (newNode.type === "pulsar_random_particles") {
      newNode.nextRandomTriggerTime =
        nowTime + (Math.random() * 2) / PULSAR_RANDOM_TIMING_CHANCE_PER_SEC;
    } else if (
      newNode.type !== "pulsar_triggerable" &&
      newNode.type !== "pulsar_manual"
    ) {
      if (isGlobalSyncEnabled && !newNode.audioParams.ignoreGlobalSync) {
        const secondsPerBeat = 60.0 / (globalBPM || 120);
        const subdivIndex = newNode.audioParams.syncSubdivisionIndex;
        if (subdivIndex >= 0 && subdivIndex < subdivisionOptions.length) {
          const subdiv = subdivisionOptions[subdivIndex];
          if (
            subdiv &&
            typeof subdiv.value === "number" &&
            secondsPerBeat > 0
          ) {
            const nodeIntervalSeconds = secondsPerBeat * subdiv.value;
            if (nodeIntervalSeconds > 0) {
              newNode.nextSyncTriggerTime =
                Math.ceil(nowTime / nodeIntervalSeconds) * nodeIntervalSeconds;
              if (newNode.nextSyncTriggerTime <= nowTime + 0.01)
                newNode.nextSyncTriggerTime += nodeIntervalSeconds;
            }
          }
        }
      } else {
        newNode.lastTriggerTime =
          nowTime - interval * (0.8 + Math.random() * 0.19);
      }
    }
  }

  if (isAudioReady && newNode.type !== TIMELINE_GRID_TYPE && newNode.type !== GRID_SEQUENCER_TYPE && newNode.type !== SPACERADAR_TYPE && newNode.type !== CRANK_RADAR_TYPE && newNode.type !== "global_key_setter") {
    newNode.audioNodes = createAudioNodesForNode(newNode);
    if (newNode.audioNodes) {
      updateNodeAudioParams(newNode);
    }
  } else if (newNode.type === TIMELINE_GRID_TYPE || newNode.type === GRID_SEQUENCER_TYPE || newNode.type === SPACERADAR_TYPE || newNode.type === CRANK_RADAR_TYPE || newNode.type === "global_key_setter") {
    newNode.audioNodes = null;
  }

  nodes.push(newNode);
  identifyAndRouteAllGroups();
  updateMistWetness();
  updateCrushWetness();
  draw();
  if (
    helpWizard &&
    !helpWizard.classList.contains("hidden") &&
    currentHelpStep === 0 &&
    isPulsarType(newNode.type)
  ) {
    nextHelpStep();
  }
  return newNode;
}

function createBitCrusherNode(bits, normFreq) {
  const proc = audioContext.createScriptProcessor(256, 2, 2);
  let ph = 0;
  let lastL = 0, lastR = 0;
  const step = Math.pow(0.5, bits);
  proc.onaudioprocess = (e) => {
    const inL = e.inputBuffer.getChannelData(0);
    const inR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inL;
    const outL = e.outputBuffer.getChannelData(0);
    const outR = e.outputBuffer.getChannelData(1);
    for (let i = 0; i < inL.length; i++) {
      ph += normFreq;
      if (ph >= 1.0) {
        ph -= 1.0;
        lastL = step * Math.floor(inL[i] / step + 0.5);
        lastR = step * Math.floor(inR[i] / step + 0.5);
      }
      outL[i] = lastL;
      outR[i] = lastR;
    }
  };
  return proc;
}



function getThemeMeteorColors() {
  const styles = getComputedStyle(document.body); 
  const colors = [];
  const color1 = styles.getPropertyValue('--meteorshower-style-color-1').trim();
  const color2 = styles.getPropertyValue('--meteorshower-style-color-2').trim();
  const color3 = styles.getPropertyValue('--meteorshower-style-color-3').trim();

  if (color1) colors.push(color1);
  if (color2) colors.push(color2);
  if (color3) colors.push(color3);

  
  if (colors.length === 0) {
      return [
          'rgba(255,100,100,0.7)', 
          'rgba(100,255,100,0.7)', 
          'rgba(100,100,255,0.7)'  
      ];
  }
  return colors;
}
function resetStartNodeTimers() {
  const nowTime = audioContext ? audioContext.currentTime : 0;
  nodes.forEach((node) => {
    if (node.isStartNode) {
      node.lastTriggerTime = -1;
      node.nextSyncTriggerTime = 0;
      node.nextGridTriggerTime = 0;
      node.nextRandomTriggerTime = 0;
    }
  });
  lastBeatTime = 0;
}

function resetTimelineGridPositions() {
  nodes.forEach((n) => {
    if (n.type === TIMELINE_GRID_TYPE) {
      n.scanLinePosition = 0;
      n.isPingPongForward = true;
      if (n.triggeredInThisSweep) n.triggeredInThisSweep.clear();
      else n.triggeredInThisSweep = new Set();
    }
  });
}

async function stopAllPlayback() {
  if (audioContext && audioContext.state === "running") {
    try {
      await audioContext.suspend();
    } catch (e) {}
  }
  isPlaying = false;
  onPlaybackStopped();
  if (appMenuPlayPauseBtn) appMenuPlayPauseBtn.textContent = "Play ▶";
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  activePulses = [];
  activeRockets.forEach((r) => {
    try {
      r.audioNodes?.engineSound?.stop();
    } catch (e) {}
  });
  activeRockets = [];
  nodes.forEach((n) => {
    stopNodeAudio(n);
    if (n.type === TIMELINE_GRID_TYPE) {
      n.scanLinePosition = 0;
      n.isPingPongForward = true;
      if (n.triggeredInThisSweep) n.triggeredInThisSweep.clear();
    }
  });
}

function triggerLoad() {
  let dynamicLoadInput = document.getElementById("dynamicLoadStateInput");
  if (!dynamicLoadInput) {
    dynamicLoadInput = document.createElement("input");
    dynamicLoadInput.type = "file";
    dynamicLoadInput.id = "dynamicLoadStateInput";
    dynamicLoadInput.accept = ".json";
    dynamicLoadInput.style.display = "none";
    dynamicLoadInput.addEventListener("change", handleFileLoad);
    document.body.appendChild(dynamicLoadInput);
  }
  dynamicLoadInput.value = null;
  dynamicLoadInput.click();
}

hamburgerBtn.addEventListener("click", () => {
  const isOpen = !hamburgerMenuPanel.classList.contains("hidden");
  resetSideToolbars();
  hideOverlappingPanels();
  if (!isOpen) {
    hamburgerMenuPanel.classList.remove("hidden");
    setActiveTool("edit");
    hamburgerBtn.classList.add("active");
    populateEditPanel();
  } else {
    hamburgerMenuPanel.classList.add("hidden");
    hamburgerBtn.classList.remove("active");
  }
});
scaleSelectTransport.addEventListener("change", (e) =>
  changeScale(e.target.value),
);

if (pianoRollModeSelect) {
  pianoRollModeSelect.addEventListener("change", (e) => {
    pianoRollMode = e.target.value || 'hex';
    drawPianoRoll();
    saveState();
  });
}

if (backgroundSelect) {
  backgroundSelect.value = backgroundMode;
  backgroundSelect.addEventListener("change", (e) => {
    setBackgroundMode(e.target.value || 'starfield');
    if (backgroundMode === 'starfield') initStarfield();
    if (backgroundMode === 'neural') initNeuralBackground();
    if (backgroundMode !== 'stardrops') windParticles = [];
    saveState();
  });
}

if (midiInputSelect)
  midiInputSelect.addEventListener("change", (e) =>
    selectMIDIInput(e.target.value),
  );
if (midiOutputSelect)
  midiOutputSelect.addEventListener("change", (e) =>
    selectMIDIOutput(e.target.value),
  );
if (midiSyncInCheckbox)
  midiSyncInCheckbox.addEventListener("change", (e) => {
    midiSyncInEnabled = e.target.checked;
  });
if (midiSyncOutCheckbox)
  midiSyncOutCheckbox.addEventListener("change", (e) => {
    midiSyncOutEnabled = e.target.checked;
    if (midiSyncOutEnabled && isPlaying) {
      onPlaybackStarted();
    } else if (!midiSyncOutEnabled) {
      stopMidiClock();
    }
  });

if (canvasSwitcherToggle && canvasSwitcherEl)
  canvasSwitcherToggle.addEventListener("change", (e) => {
    canvasSwitcherEl.classList.toggle("hidden", !e.target.checked);
  });

if (groupVolumeSlider) {
  groupVolumeSlider.addEventListener("input", (e) => {
    if (currentConstellationGroup.size > 0) {
      const firstSelectedNodeId = currentConstellationGroup
        .values()
        .next().value;

      const selectedGroup = findGroupContainingNode(firstSelectedNodeId);

      if (selectedGroup) {
        setSpecificGroupVolume(selectedGroup.id, parseFloat(e.target.value));
      } else {
        console.warn(
          "Selected group node ID not found in any identified group.",
        );
      }
    } else {
    }

    const vol = parseFloat(e.target.value);
    const originalLabel = document.querySelector(
      'label[for="groupVolumeSlider"]',
    );
    if (originalLabel && originalLabel.textContent.includes("(")) {
      originalLabel.textContent = `Group Volume (${vol.toFixed(2)}):`;
    }
  });

  groupVolumeSlider.addEventListener("change", saveState);
}
groupFluctuateToggle.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  const currentGroupIDs = Array.from(currentConstellationGroup);
  if (isChecked) {
    currentGroupIDs.forEach((id) => fluctuatingGroupNodeIDs.add(id));
  } else {
    currentGroupIDs.forEach((id) => fluctuatingGroupNodeIDs.delete(id));
  }
  updateFluctuatingNodesLFO();
  groupFluctuateAmount.disabled = !isChecked;
  saveState();
});
groupFluctuateAmount.addEventListener("input", applyGroupFluctuationSettings);
groupFluctuateAmount.addEventListener("change", saveState);

if (appMenuNew)
  appMenuNew.addEventListener("click", (e) => {
    e.preventDefault();
    handleNewWorkspace();
  });
if (appMenuLoad)
  appMenuLoad.addEventListener("click", (e) => {
    e.preventDefault();
    triggerLoad();
  });
if (appMenuSave)
  appMenuSave.addEventListener("click", (e) => {
    e.preventDefault();
    triggerSave();
  });
if (appMenuEnterUfoMode)
  appMenuEnterUfoMode.addEventListener("click", (e) => {
    e.preventDefault();
    toggleUfoMode();
  });
if (appMenuUndoBtn) appMenuUndoBtn.addEventListener("click", undo);
if (appMenuRedoBtn) appMenuRedoBtn.addEventListener("click", redo);
if (appMenuCut)
  appMenuCut.addEventListener("click", (e) => {
    e.preventDefault();
    cutSelection();
  });
if (appMenuCopy)
  appMenuCopy.addEventListener("click", (e) => {
    e.preventDefault();
    copySelectionToClipboard();
  });
if (appMenuPaste)
  appMenuPaste.addEventListener("click", (e) => {
    e.preventDefault();
    pasteClipboard();
  });
if (appMenuReplace)
  appMenuReplace.addEventListener("click", (e) => {
    e.preventDefault();
    openReplaceInstrumentMenu();
  });
if (appMenuStopBtn)
  appMenuStopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    stopAllPlayback();
  });
if (appMenuToggleTapeLooperBtn) {
  appMenuToggleTapeLooperBtn.addEventListener("click", () => {
    if (tapeLooperPanel) {
      if (tapeLooperPanel.classList.contains("hidden")) {
        hideOverlappingPanels();
        tapeLooperPanel.classList.remove("hidden");
        appMenuToggleTapeLooperBtn.classList.add("active");
      } else {
        tapeLooperPanel.classList.add("hidden");
        appMenuToggleTapeLooperBtn.classList.remove("active");
      }
    }
  });
}

if (closeTapeLooperPanelBtn) {
  closeTapeLooperPanelBtn.addEventListener("click", () => {
    if (tapeLooperPanel) {
      tapeLooperPanel.classList.add("hidden");
    }
    if (appMenuToggleTapeLooperBtn) {
      appMenuToggleTapeLooperBtn.classList.remove("active");
    }
  });
}

if (appMenuPerformanceBtn) {
  appMenuPerformanceBtn.addEventListener("click", () => {
    if (performancePanel) {
      if (performancePanel.classList.contains("hidden")) {
        hideOverlappingPanels();
        performancePanel.classList.remove("hidden");
        appMenuPerformanceBtn.classList.add("active");
      } else {
        performancePanel.classList.add("hidden");
        appMenuPerformanceBtn.classList.remove("active");
      }
    }
  });
}

if (performancePanelCloseBtn) {
  performancePanelCloseBtn.addEventListener("click", () => {
    if (performancePanel) performancePanel.classList.add("hidden");
    if (appMenuPerformanceBtn) appMenuPerformanceBtn.classList.remove("active");
  });
}

if (openPerformancePanelBtn) {
  openPerformancePanelBtn.addEventListener("click", () => {
    if (performancePanel) {
      hideOverlappingPanels();
      performancePanel.classList.remove("hidden");
      if (appMenuPerformanceBtn) appMenuPerformanceBtn.classList.add("active");
    }
  });
}



if (alienPanelCloseBtn) {
  alienPanelCloseBtn.addEventListener('click', () => {
    hideAlienPanel();
  });
}
if (arvoPanelCloseBtn) {
  arvoPanelCloseBtn.addEventListener('click', () => {
    hideArvoPanel();
    hideArvoDroneOrbMenu();
  });
}
if (resonauterPanelCloseBtn) {
  resonauterPanelCloseBtn.addEventListener('click', () => {
    hideResonauterPanel();
    hideResonauterOrbMenu();
  });
}
if (samplerPanelCloseBtn) {
  samplerPanelCloseBtn.addEventListener('click', () => {
    hideSamplerPanel();
    hideSamplerOrbMenu();
  });
}
if (tonePanelCloseBtn) {
  tonePanelCloseBtn.addEventListener('click', () => {
    hideTonePanel();
    hideAnalogOrbMenu();
  });
}
if (radioOrbPanelCloseBtn) {
  radioOrbPanelCloseBtn.addEventListener('click', () => {
    hideRadioOrbPanel();
    hideRadioOrbMenu();
  });
}
if (motorOrbPanelCloseBtn) {
  motorOrbPanelCloseBtn.addEventListener('click', () => {
    hideMotorOrbPanel();
    hideMotorOrbMenu();
  });
}
if (clockworkOrbPanelCloseBtn) {
  clockworkOrbPanelCloseBtn.addEventListener('click', () => {
    hideClockworkOrbPanel();
    hideClockworkOrbMenu();
  });
}
if (stringPanelCloseBtn) {
  stringPanelCloseBtn.addEventListener('click', () => {
    hideStringPanel();
    hideStringConnectionMenu();
  });
}

if (appMenuGridToggleBtn) {
  appMenuGridToggleBtn.addEventListener("click", () => {
    isGridVisible = !isGridVisible;
    appMenuGridToggleBtn.classList.toggle("active", isGridVisible);
  });
}
if (appMenuGridSnapBtn) {
  appMenuGridSnapBtn.addEventListener("click", () => {
    isSnapEnabled = !isSnapEnabled;
    appMenuGridSnapBtn.classList.toggle("active", isSnapEnabled);
  });
}
if (appMenuSyncToggleBtn) {
  appMenuSyncToggleBtn.addEventListener("click", () => {
    isGlobalSyncEnabled = !isGlobalSyncEnabled;
    nodes.forEach((n) => {
      if (n.isStartNode) {
        n.lastTriggerTime = -1;
        n.nextSyncTriggerTime = 0;
        n.nextGridTriggerTime = 0;
        n.nextRandomTriggerTime = 0;
      }
    });
    lastBeatTime = 0;
    updateSyncUI();
    saveState();
  });
}
if (appMenuBpmInput) {
  appMenuBpmInput.addEventListener("change", (e) => {
    const newBPMValue = parseInt(e.target.value, 10);
    if (!isNaN(newBPMValue) && newBPMValue >= 30 && newBPMValue <= 300) {
      globalBPM = newBPMValue;
      saveState();
      updateMidiClockInterval();

      if (
        isTapeLoopPlaying &&
        tapeLoopSourceNode &&
        tapeLoopRecordedAtBPM > 0 &&
        isGlobalSyncEnabled &&
        audioContext
      ) {
        const newPlaybackRate = globalBPM / tapeLoopRecordedAtBPM;
        tapeLoopSourceNode.playbackRate.setTargetAtTime(
          newPlaybackRate,
          audioContext.currentTime,
          0.05,
        );
      }
    } else {
      console.warn(
        `Ongeldige BPM input: ${e.target.value}. Reset naar ${globalBPM}.`,
      );
      appMenuBpmInput.value = globalBPM;
    }
  });
}
if (appMenuPlayPauseBtn)
  appMenuPlayPauseBtn.addEventListener("click", togglePlayPause);
if (appMenuRestartPulsarsBtn) {
  appMenuRestartPulsarsBtn.addEventListener("click", () => {
    if (!isAudioReady || isGlobalSyncEnabled) return;
    const nowTime = audioContext.currentTime;
    let restarted = false;
    selectedElements.forEach((el) => {
      if (el.type === "node") {
        const node = findNodeById(el.id);
        if (node && node.isStartNode && node.type !== "pulsar_triggerable") {
          node.lastTriggerTime = nowTime;
          node.isEnabled = true;
          node.animationState = 0.5;
          setTimeout(() => {
            const check = findNodeById(node.id);
            if (check) check.animationState = 0;
          }, 150);
          restarted = true;
        }
      }
    });
    if (restarted) saveState();
  });
}

if (appMenuHelpBtn) appMenuHelpBtn.addEventListener("click", openHelpWizard);
if (wizardNextBtn) wizardNextBtn.addEventListener("click", nextHelpStep);
if (wizardPrevBtn) wizardPrevBtn.addEventListener("click", prevHelpStep);
if (wizardCloseBtn) wizardCloseBtn.addEventListener("click", closeHelpWizard);
if (wizardEndBtn) wizardEndBtn.addEventListener("click", closeHelpWizard);
if (closeHelpPopupBtn)
  closeHelpPopupBtn.addEventListener("click", toggleHelpPopup);

if (closeHamburgerBtn) {
  closeHamburgerBtn.addEventListener("click", () => {
    if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
    if (hamburgerBtn) hamburgerBtn.classList.remove("active");
  });
}

if (connectRopeBtn) {
  connectRopeBtn.addEventListener("click", () => {
    setActiveTool("connect_rope");
  });
} else {
  console.warn("#connectRopeBtn not found during listener setup!");
}

if (connectWaveTrailBtn) {
  connectWaveTrailBtn.addEventListener("click", () => {
    setActiveTool("connect_wavetrail");
  });
} else {
  console.warn("#connectWaveTrailBtn not found during listener setup!");
}
if (connectOneWayBtn) {
  connectOneWayBtn.addEventListener("click", () => {
    setActiveTool("connect_oneway");
  });
} else {
  console.warn("#connectOneWayBtn not found during listener setup!");
}
toggleInfoTextBtn.addEventListener("click", () => {
  isInfoTextVisible = !isInfoTextVisible;
  updateInfoToggleUI();
});

function setupAddTool(
  buttonElement,
  type,
  requiresSubmenu = false,
  submenuType = null,
  submenuTitle = "",
) {
  const previousType = nodeTypeToAdd;
  setActiveTool("add");
  nodeTypeToAdd = type;

  if (currentTool !== "add" || previousType !== type) {
    waveformToAdd = null;
    noteIndexToAdd = -1;
  }

  const addButtons = toolbar.querySelectorAll(
    "#toolbar-sound-generators button, #toolbar-drones button, #toolbar-pulsars button, #toolbar-logic-nodes button, #toolbar-environment-nodes button",
  );
  addButtons.forEach((btn) => {
    if (btn !== buttonElement) btn.classList.remove("active");
  });
  if (buttonElement) buttonElement.classList.add("active");

  if (requiresSubmenu && submenuType) {
    populateSideToolbar(submenuType, submenuTitle);
  } else {
    resetSideToolbars();
    if (sideToolbar) sideToolbar.classList.add("hidden");
    if (type === PORTAL_NEBULA_TYPE) {
      waveformToAdd = null;
    } else if (type === MIDI_ORB_TYPE) {
      if (sideToolbar) sideToolbar.classList.remove("hidden");
      if (sideToolbar) sideToolbar.classList.remove("narrow");
      sideToolbarContent.innerHTML = "";
      createHexNoteSelectorDOM(sideToolbarContent);
    } else if (type === RESONAUTER_TYPE || type === ARVO_DRONE_TYPE || type === FM_DRONE_TYPE) {
      if (sideToolbar) sideToolbar.classList.remove("hidden");
      if (sideToolbar) sideToolbar.classList.remove("narrow");
      sideToolbarContent.innerHTML = "";
      createHexNoteSelectorDOM(sideToolbarContent);
    }
  }

}

if (instrumentsMenuBtn) {
  instrumentsMenuBtn.addEventListener("click", () => {
    populateInstrumentMenu();
    if (
      helpWizard &&
      !helpWizard.classList.contains("hidden") &&
      currentHelpStep === 2
    ) {
      nextHelpStep();
    }
  });
}

if (connectionsMenuBtn) {
  connectionsMenuBtn.addEventListener("click", () => {
    populateConnectionMenu();
  });
}

if (dronesMenuBtn) {
  dronesMenuBtn.addEventListener("click", () => {
    populateDroneMenu();
  });
}

if (mistMenuBtn) {
  mistMenuBtn.addEventListener("click", () => {
    populateMistMenu();
  });
}

if (motionMenuBtn) {
  motionMenuBtn.addEventListener("click", () => {
    populateMotionMenu();
  });
}

if (addAnalogSynthBtn) {
  addAnalogSynthBtn.addEventListener("click", (e) => {
    soundEngineToAdd = "tone";
    setupAddTool(
      e.currentTarget,
      "sound",
      true,
      "analogWaveforms",
      "Tone Synths",
    );
  });
}

if (addFmSynthBtn) {
  addFmSynthBtn.addEventListener("click", (e) => {
    soundEngineToAdd = "tonefm";
    setupAddTool(e.currentTarget, "sound", true, "fmSynths", "FM Synths");
  });
}
if (addNebulaBtn) {
  addNebulaBtn.addEventListener("click", (e) => {
    soundEngineToAdd = null;
    setupAddTool(e.currentTarget, "nebula", true, "waveforms", "Nebula Sounds");
  });
}
if (addMeteorShowerBtn) {
  addMeteorShowerBtn.addEventListener("click", (e) => {
    soundEngineToAdd = null;
    setupAddTool(e.currentTarget, "pulsar_meteorshower", false);
  });
}
addPulsarBtn.addEventListener("click", (e) => {
  setupAddTool(e.currentTarget, null, true, "pulsarTypes", "Pulsars");
  if (
    helpWizard &&
    !helpWizard.classList.contains("hidden") &&
    currentHelpStep === 0
  ) {
    nextHelpStep();
  }
});
if (addDrumElementBtn) {
  addDrumElementBtn.addEventListener("click", (e) => {
    soundEngineToAdd = null;
    setupAddTool(e.currentTarget, null, true, "drumElements", "Drum Elements");
  });
}
const addPortalNebulaBtn = document.getElementById("addPortalNebulaBtn");
if (addPortalNebulaBtn) {
  addPortalNebulaBtn.addEventListener("click", (e) => {
    soundEngineToAdd = null;
    setupAddTool(e.currentTarget, PORTAL_NEBULA_TYPE, false);
  });
} else {
  console.warn("#addPortalNebulaBtn not found");
}
const brushBtn = document.getElementById("brushBtn");
if (brushBtn) {
  brushBtn.addEventListener("click", (e) => {
    setActiveTool("brush");
    populateBrushOptionsPanel();
  });
} else {
  console.warn("#brushBtn not found");
}
if (mistBtn) {
  mistBtn.addEventListener("click", () => setActiveTool("mist"));
} else {
  console.warn("#mistBtn not found");
}
if (crushBtn) {
  crushBtn.addEventListener("click", () => setActiveTool("crush"));
} else {
  console.warn("#crushBtn not found");
}
if (wandBtn) {
  wandBtn.addEventListener("click", () => setActiveTool("wand"));
} else {
  console.warn("#wandBtn not found");
}
if (addSamplerBtn) {
  addSamplerBtn.addEventListener("click", (e) => {
    setupAddTool(e.currentTarget, "sound", true, "samplers", "Samplers");
  });
}
if (toolsMenuBtn) {
  toolsMenuBtn.addEventListener("click", () => {
    populateToolMenu();
  });
}

if (mistLayer) {
  mistLayer.addEventListener('pointerdown', (e) => {
    if (currentTool === 'mist') {
      patchState.isMisting = true;
      patchState.currentMistGroup = null;
      const coords = getWorldCoords(e.clientX, e.clientY);
      createMistPatch(coords.x, coords.y);
    } else if (currentTool === 'eraser') {
      patchState.isErasing = true;
      erasePatchesAt(e.clientX, e.clientY);
    }
  });
  mistLayer.addEventListener('pointermove', (e) => {
    if (currentTool === 'mist' && patchState.isMisting) {
      const coords = getWorldCoords(e.clientX, e.clientY);
      createMistPatch(coords.x, coords.y);
    } else if (currentTool === 'eraser' && patchState.isErasing) {
      erasePatchesAt(e.clientX, e.clientY);
    }
  });
}
if (crushLayer) {
  crushLayer.addEventListener('pointerdown', (e) => {
    if (currentTool === 'crush') {
      patchState.isCrushing = true;
      patchState.currentCrushGroup = null;
      const coords = getWorldCoords(e.clientX, e.clientY);
      createCrushPatch(coords.x, coords.y);
    } else if (currentTool === 'eraser') {
      patchState.isErasing = true;
      erasePatchesAt(e.clientX, e.clientY);
    }
  });
  crushLayer.addEventListener('pointermove', (e) => {
    if (currentTool === 'crush' && patchState.isCrushing) {
      const coords = getWorldCoords(e.clientX, e.clientY);
      createCrushPatch(coords.x, coords.y);
    } else if (currentTool === 'eraser' && patchState.isErasing) {
      erasePatchesAt(e.clientX, e.clientY);
    }
  });
}
document.addEventListener('pointerup', () => {
  let didChange = false;
  if (patchState.isMisting) {
    patchState.isMisting = false;
    patchState.currentMistGroup = null;
    didChange = true;
  }
  if (patchState.isCrushing) {
    patchState.isCrushing = false;
    patchState.currentCrushGroup = null;
    didChange = true;
  }
  if (patchState.isErasing) {
    patchState.isErasing = false;
    didChange = true;
  }
  if (didChange) {
    saveState();
  }
});

editBtn.addEventListener("click", () => setActiveTool("edit"));
if (connectBtn)
  connectBtn.addEventListener("click", () => setActiveTool("connect"));
if (connectStringBtn)
  connectStringBtn.addEventListener("click", () =>
    setActiveTool("connect_string"),
  );
deleteBtn.addEventListener("click", () => setActiveTool("delete"));
if (eraserBtn)
  eraserBtn.addEventListener("click", () => setActiveTool("eraser"));
if (mixerToggleBtn) {
  mixerToggleBtn.addEventListener("click", () => {
    const mixerPanel = document.getElementById("mixerPanel");
    if (mixerPanel) {
      const isHidden = mixerPanel.classList.contains("hidden");
      if (isHidden) {
        hideOverlappingPanels();
        mixerPanel.classList.remove("hidden");
        mixerToggleBtn.classList.add("active");
        updateMixerGUI();
      } else {
        mixerPanel.classList.add("hidden");
        mixerToggleBtn.classList.remove("active");
      }
    } else {
      console.error("#mixerPanel not found inside mixerToggleBtn listener!");
    }
  });
} else {
  console.error("#mixerToggleBtn not found during listener setup!");
}

if (mixerTabButtons) {
  mixerTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;
      document.querySelectorAll(".mixer-tab-content").forEach((el) => {
        el.classList.add("hidden");
      });
      document.querySelectorAll(".mixer-tab-button").forEach((b) => {
        b.classList.remove("active");
      });
      const tabEl = document.getElementById(`mixerTab${targetTab.charAt(0).toUpperCase()}${targetTab.slice(1)}`);
      if (tabEl) tabEl.classList.remove("hidden");
      btn.classList.add("active");
    });
  });
}


window.addEventListener("keydown", (e) => {
  if (isUfoModeActive) {
    switch (e.key) {
      case "ArrowUp":
        ufoKeys.up = true;
        e.preventDefault();
        return;
      case "ArrowDown":
        ufoKeys.down = true;
        e.preventDefault();
        return;
      case "ArrowLeft":
        ufoKeys.left = true;
        e.preventDefault();
        return;
      case "ArrowRight":
        ufoKeys.right = true;
        e.preventDefault();
        return;
      case "Escape":
        toggleUfoMode();
        e.preventDefault();
        return;
      case "Control":
        if (!e.repeat) {
          placeOrbFromUfo();
        }
        e.preventDefault();
        return;
      case "Shift":
      case "x":
      case "X":
        tractorBeamActive = true;
        e.preventDefault();
        return;
      case "z":
      case "Z":
        fireUfoTorpedo();
        e.preventDefault();
        return;
      case "c":
      case "C":
        shootUfoConnector();
        e.preventDefault();
        return;
      case "1":
        ufoOrbWaveform = "sine";
        e.preventDefault();
        return;
      case "2":
        ufoOrbWaveform = "square";
        e.preventDefault();
        return;
      case "3":
        ufoOrbWaveform = "sawtooth";
        e.preventDefault();
        return;
    }
    if (e.code === "Space" && !isSpacebarDown) {
      isSpacebarDown = true;
      shootUfo();
      e.preventDefault();
      return;
    }
  }
  const targetIsInput = ["input", "select", "textarea"].includes(
    e.target.tagName.toLowerCase(),
  );
  const bottomPanelOpen = !mixerPanel.classList.contains("hidden");

  if (targetIsInput && bottomPanelOpen) return;
  if (targetIsInput && !bottomPanelOpen && e.key !== "Escape") return;

  if (e.code === "Space" && !isSpacebarDown) {
    isSpacebarDown = true;
    e.preventDefault();
  }

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const undoKeyPressed =
    (isMac ? e.metaKey : e.ctrlKey) &&
    e.key.toLowerCase() === "z" &&
    !e.shiftKey;
  const redoKeyPressed =
    (isMac ? e.metaKey : e.ctrlKey) &&
    (e.key.toLowerCase() === "y" ||
      (e.key.toLowerCase() === "z" && e.shiftKey));
  const cutKeyPressed =
    (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "x";
  const copyKeyPressed =
    (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "c" && !e.shiftKey;
  const pasteKeyPressed =
    (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "v";
  let panX = 0;
  let panY = 0;

  switch (e.key) {
    case "ArrowUp":
      panY = PAN_SPEED;
      break;
    case "ArrowDown":
      panY = -PAN_SPEED;
      break;
    case "ArrowLeft":
      panX = PAN_SPEED;
      break;
    case "ArrowRight":
      panX = -PAN_SPEED;
      break;
  }

  if (panX !== 0 || panY !== 0) {
    viewOffsetX += panX;
    viewOffsetY += panY;
    e.preventDefault();
  } else if (undoKeyPressed) {
    e.preventDefault();
    undo();
  } else if (redoKeyPressed) {
    e.preventDefault();
    redo();
  } else if (cutKeyPressed) {
    e.preventDefault();
    cutSelection();
  } else if (copyKeyPressed) {
    e.preventDefault();
    copySelectionToClipboard();
  } else if (pasteKeyPressed) {
    e.preventDefault();
    pasteClipboard();
  } else if (
    e.key.toLowerCase() === "y" &&
    !isMac &&
    !e.ctrlKey &&
    !e.metaKey
  ) {
    if (appMenuSyncToggleBtn) appMenuSyncToggleBtn.click();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "g") {
    if (appMenuGridToggleBtn) appMenuGridToggleBtn.click();
    e.preventDefault();
  } else if (
    isGridVisible &&
    e.key.toLowerCase() === "n" &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey
  ) {
    if (appMenuGridSnapBtn) {
      appMenuGridSnapBtn.click();
    }
    e.preventDefault();
  } else if (e.key.toLowerCase() === "i") {
    toggleInfoTextBtn.click();
    e.preventDefault();
  } else if (
    (e.key === "Delete" || e.key === "Backspace") &&
    selectedElements.size > 0 &&
    currentTool === "edit"
  ) {
    const elementsToRemove = [...selectedElements];
    elementsToRemove.forEach((el) => {
      if (el.type === "node") removeNode(findNodeById(el.id));
      else if (el.type === "connection")
        removeConnection(findConnectionById(el.id));
    });
    selectedElements.clear();
    populateEditPanel();
    isBrushing = false;
    lastBrushNode = null;
    brushNoteSequenceIndex = 0;
  } else if (e.key.toLowerCase() === "e") {
    setActiveTool("edit");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "c") {
    setActiveTool("connect");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "v" && !targetIsInput) {
    setActiveTool("connect_string");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "b" && !targetIsInput && brushBtn) {
    brushBtn.click();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "f" && !targetIsInput) {
    setActiveTool("mist");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "h" && !targetIsInput) {
    setActiveTool("crush");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "q" && !targetIsInput && wandBtn) {
    wandBtn.click();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "k" && !targetIsInput) {
    setActiveTool("eraser");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "r" && !targetIsInput) {
    setupAddTool(null, "relay");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "d" && !targetIsInput) {
    addDrumElementBtn.click();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "s" && !targetIsInput) {
    addSoundStarBtn.click();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "w" && !targetIsInput) {
    setupAddTool(null, "nebula", true, "waveforms", "Nebula Sounds");
    e.preventDefault();
  } else if (e.key.toLowerCase() === "p" && !targetIsInput) {
    addPulsarBtn.click();
    e.preventDefault();
  } else if (e.key.toLowerCase() === "m" && !targetIsInput) {
    hamburgerBtn.click();
    e.preventDefault();
  } else if (e.key === "Escape") {
    if (isBrushing) {
      isBrushing = false;
      lastBrushNode = null;
      brushNoteSequenceIndex = 0;

      setActiveTool("edit");
      e.preventDefault();
      return;
    }
    if (patchState.isMisting) {
      patchState.isMisting = false;
      setActiveTool("edit");
      e.preventDefault();
      return;
    }
    if (patchState.isCrushing) {
      patchState.isCrushing = false;
      setActiveTool("edit");
      e.preventDefault();
      return;
    }

    if (selectedElements.size > 0) {
      selectedElements.clear();
      populateEditPanel();
      updateConstellationGroup();
    }
    setActiveTool("edit");
    resetSideToolbars();
    hideOverlappingPanels();
    e.preventDefault();
  } else if (e.altKey && currentTool === "edit") {
    e.preventDefault();
  }
});
window.addEventListener("keyup", (e) => {
  if (isUfoModeActive) {
    switch (e.key) {
      case "ArrowUp":
        ufoKeys.up = false;
        break;
      case "ArrowDown":
        ufoKeys.down = false;
        break;
      case "ArrowLeft":
        ufoKeys.left = false;
        break;
      case "ArrowRight":
        ufoKeys.right = false;
        break;
      case "Shift":
      case "x":
      case "X":
        tractorBeamActive = false;
        tractorBeamTarget = null;
        break;
    }
  }
  if (e.code === "Space") {
    isSpacebarDown = false;
  }
  if (e.altKey && currentTool === "edit") {
    e.preventDefault();
  }
});
function attachCanvasEvents(cnv) {
  if (!cnv) return;
  cnv.addEventListener("wheel", handleWheel, { passive: false });
  cnv.addEventListener("mousedown", handleMouseDown);
  cnv.addEventListener("mousemove", handleMouseMove);
  cnv.addEventListener("mouseup", handleMouseUp);
  cnv.addEventListener("contextmenu", (e) => e.preventDefault());
  cnv.addEventListener("contextmenu", handleContextMenu);
}

function handleContextMenu(event) {
  if (isBrushing) {
    isBrushing = false;
    lastBrushNode = null;
    brushNoteSequenceIndex = 0;
  }
  if (currentTool === "add") {
    setActiveTool("edit");
    resetSideToolbars();
    hideOverlappingPanels();
  }
  event.preventDefault();
}

function startAnimationLoop() {
  if (!animationFrameId) {
    previousFrameTime = audioContext
      ? audioContext.currentTime
      : performance.now() / 1000;
    animationLoop();
  } else {}
}

function createSlider(
  id,
  labelText,
  min,
  max,
  step,
  value,
  changeHandler,
  inputHandler = null,
) {
  const container = document.createElement("div");
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;
  container.appendChild(label);
  const slider = document.createElement("input");
  slider.type = "range";
  slider.id = id;
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = value;
  slider.addEventListener("input", (e) => {
    if (inputHandler) inputHandler(e);
    else
      label.textContent = `${labelText.split("(")[0]}(${parseFloat(
        e.target.value,
      ).toFixed(
        step.toString().includes(".")
          ? step.toString().split(".")[1].length
          : 0,
      )}):`;
  });
  slider.addEventListener("change", (e) => {
    if (changeHandler) changeHandler(e);
    saveState();
  });
  container.appendChild(slider);
  return container;
}

function handleWaveTrailFileInputChange(event, connection) {
  if (!connection || connection.type !== "wavetrail") return;
  const file = event.target.files[0];
  const fileNameDisplay = document.getElementById(
    `edit-wavetrail-filename-${connection.id}`,
  );

  if (file) {
    if (fileNameDisplay)
      fileNameDisplay.textContent = `Loading: ${file.name}...`;

    const reader = new FileReader();
    reader.onload = (e) => {
      loadAndDecodeAudio(e.target.result, connection);
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      if (fileNameDisplay) fileNameDisplay.textContent = `Error reading file.`;
      connection.audioParams.buffer = null;
      connection.audioParams.fileName = null;
    };
    reader.readAsArrayBuffer(file);
    connection.audioParams.fileName = file.name;
  }
  event.target.value = null;
}

async function loadAndDecodeAudio(arrayBuffer, connection) {
  if (!audioContext || !connection || !arrayBuffer) {
      console.error(
          "[Wavetrail Debug] loadAndDecodeAudio: Called with invalid parameters.",
          { audioContextPresent: !!audioContext, connectionPresent: !!connection, arrayBufferPresent: !!arrayBuffer }
      );
      if (connection && connection.audioParams) {
          connection.audioParams.buffer = null;
          connection.audioParams.waveformPath = null;
          const fileNameDisplay = document.getElementById(`edit-wavetrail-filename-${connection.id}`);
          if (fileNameDisplay) {
              fileNameDisplay.textContent = `Error: Invalid data for ${connection.audioParams.fileName || "file"}`;
          }
      }
      populateEditPanel();
      return;
  }

  const fileNameDisplay = document.getElementById(`edit-wavetrail-filename-${connection.id}`);

  try {
    let decodedBuffer;
    if (audioContext.decodeAudioData.length !== 1) {
        decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } else {
        decodedBuffer = await new Promise((resolve, reject) => {
            audioContext.decodeAudioData(arrayBuffer, resolve, reject);
        });
    }

    if (!decodedBuffer) {
        throw new Error("Decoded buffer is null or undefined after decodeAudioData.");
    }

    connection.audioParams.buffer = decodedBuffer;
    connection.audioParams.waveformPath = generateWaveformPath(decodedBuffer, 200);

    if (connection.audioParams.waveformPath && connection.audioParams.waveformPath.length > 0) {} else {
        console.warn(
            `[Wavetrail Debug] loadAndDecodeAudio: Failed to generate a valid waveform path for ${connection.id}. Buffer duration: ${decodedBuffer?.duration}`
        );
    }

    if (fileNameDisplay) {
        fileNameDisplay.textContent = `Current: ${connection.audioParams.fileName || "Unnamed"}`;
    }

    if (connection.audioParams.endTimeOffset === null && connection.audioParams.buffer) {
        connection.audioParams.endTimeOffset = connection.audioParams.buffer.duration;
    }

    populateEditPanel();
  } catch (error) {
      console.error(
          `[Wavetrail Debug] Error in loadAndDecodeAudio for connection ${connection.id} (${connection.audioParams.fileName || 'unknown file'}):`,
          error
      );
      if (fileNameDisplay) {
          fileNameDisplay.textContent = `Error decoding: ${connection.audioParams.fileName || "file"}`;
      }
      connection.audioParams.buffer = null;
      connection.audioParams.waveformPath = null;
      populateEditPanel();
  }
}

function drawConnection(conn) {
    const nA = findNodeById(conn.nodeAId);
    const nB = findNodeById(conn.nodeBId);
    if (!nA || !nB || !ctx) return;
    const pA = getConnectionPoint(nA, conn.nodeAHandle);
    const pB = getConnectionPoint(nB, conn.nodeBHandle);

    const isSelected = isElementSelected("connection", conn.id);
    let baseClr = "grey";
    let thickness = 1 / viewScale;
    let dash = [];
    let drawAsWaveformBars = false;

    ctx.save();

    if (conn.type === "string_violin") {
        baseClr =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--string-violin-connection-color")
                .trim() || "#ffccaa";
        thickness = (1.5 + 2.0 * (1 - Math.min(1, conn.length / 500))) / viewScale;
        dash = [5 / viewScale, 3 / viewScale];
        ctx.setLineDash(dash);
    } else if (conn.type === "glide") {
        baseClr = GLIDE_LINE_COLOR;
        thickness =
            (GLIDE_LINE_WIDTH + 1.5 * (1 - Math.min(1, conn.length / 500))) /
            viewScale;
        dash = [8 / viewScale, 4 / viewScale];
        ctx.setLineDash(dash);
    } else if (conn.type === "rope") {
        baseClr = ROPE_LINE_COLOR;
        thickness = Math.max(0.5, 1.5 / viewScale);
        dash = [4 / viewScale, 4 / viewScale];
        ctx.setLineDash(dash);
    } else if (conn.type === "wavetrail") {
      thickness = Math.max(0.5, 1.5 / viewScale);
      dash = [];
      if (conn.audioParams?.buffer && conn.audioParams?.waveformPath && conn.audioParams.waveformPath.length > 0) {
          baseClr = "rgba(180, 255, 180, 0.8)";
          drawAsWaveformBars = true;
      } else {
          baseClr = "rgba(200, 200, 200, 0.5)";
          dash = [4 / viewScale, 4 / viewScale];
          ctx.setLineDash(dash);
      }
    } else {
        baseClr =
            getComputedStyle(document.documentElement)
                .getPropertyValue("--connection-color")
                .trim() || "#8AC";
        thickness = (1.0 + 1.5 * (1 - Math.min(1, conn.length / 500))) / viewScale;
        ctx.setLineDash(dash);
    }

    ctx.strokeStyle = isSelected ? "rgba(255, 255, 0, 0.9)" : baseClr;
    ctx.lineWidth = Math.max(0.5, thickness) + (isSelected ? 2 / viewScale : 0);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    if (drawAsWaveformBars) {
        const pathData = conn.audioParams.waveformPath;
        const totalPathPoints = pathData.length;

        if (totalPathPoints > 0 && conn.audioParams.buffer) {
            const bufferDuration = conn.audioParams.buffer.duration;
            const startTimeOffset = conn.audioParams.startTimeOffset || 0;
            const endTimeOffset = conn.audioParams.endTimeOffset ?? bufferDuration;
            const actualEndTime = Math.max(startTimeOffset + 0.01, endTimeOffset);

            const startSampleIndex = Math.max(
                0,
                Math.min(
                    totalPathPoints - 1,
                    Math.floor((startTimeOffset / bufferDuration) * totalPathPoints)
                )
            );
            const endSampleIndex = Math.max(
                0,
                Math.min(
                    totalPathPoints - 1,
                    Math.ceil((actualEndTime / bufferDuration) * totalPathPoints)
                )
            );

            const selectedDataPointCount = Math.max(
                1,
                endSampleIndex - startSampleIndex + 1
            );

            const maxAmplitude = 15 / viewScale;
            const barWidth = Math.max(0.5, 1.5 / viewScale);
            ctx.lineWidth = barWidth;
            ctx.strokeStyle = isSelected ? "rgba(220, 255, 220, 0.9)" : baseClr;
            ctx.setLineDash([]);

            const dx = pB.x - pA.x;
            const dy = pB.y - pA.y;
            const angle = Math.atan2(dy, dx);
            const perpAngle = angle + Math.PI / 2;

            const visualBarCount = Math.min(selectedDataPointCount, 200);

            for (let j = 0; j < visualBarCount; j++) {
                const visualProgress =
                    visualBarCount === 1 ? 0.5 : j / (visualBarCount - 1 || 1);

                const i = Math.round(
                    startSampleIndex + visualProgress * (selectedDataPointCount - 1)
                );
                const clamped_i = Math.max(
                    startSampleIndex,
                    Math.min(endSampleIndex, i)
                );

                const lx = pA.x + dx * visualProgress;
                const ly = pA.y + dy * visualProgress;

                const waveData = pathData[clamped_i];
                if (!waveData) continue;

                const positiveAmplitude = waveData.max > 0 ? waveData.max : 0;
                const negativeAmplitude = waveData.min < 0 ? waveData.min : 0;
                const topOffsetX =
                    Math.cos(perpAngle) * positiveAmplitude * maxAmplitude;
                const topOffsetY =
                    Math.sin(perpAngle) * positiveAmplitude * maxAmplitude;
                const bottomOffsetX =
                    Math.cos(perpAngle) * negativeAmplitude * maxAmplitude;
                const bottomOffsetY =
                    Math.sin(perpAngle) * negativeAmplitude * maxAmplitude;

                ctx.beginPath();
                ctx.moveTo(lx + bottomOffsetX, ly + bottomOffsetY);
                ctx.lineTo(lx + topOffsetX, ly + topOffsetY);
                ctx.stroke();
            }
        } else {
            ctx.strokeStyle = baseClr;
            ctx.lineWidth = Math.max(0.5, thickness) + (isSelected ? 2 / viewScale : 0);
            ctx.setLineDash(dash);
            ctx.beginPath();
            const steps = Math.max(5, Math.floor(conn.length / 10));
            for (let i = 0; i <= steps; i++) {
                const p = getStringConnectionPoint(conn, i / steps);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }
    } else {
        ctx.strokeStyle = isSelected ? "rgba(255, 255, 0, 0.9)" : baseClr;
        ctx.lineWidth =
            Math.max(0.5, thickness) + (isSelected ? 2 / viewScale : 0);
        ctx.setLineDash(dash);
        ctx.beginPath();
        if (conn.type === 'string_violin') {
            const steps = Math.max(5, Math.floor(conn.length / 10));
            for (let i = 0; i <= steps; i++) {
                const p = getStringConnectionPoint(conn, i / steps);
                if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
        } else {
            const mX = (pA.x + pB.x) / 2;
            const mY = (pA.y + pB.y) / 2;
            const cX = mX + conn.controlPointOffsetX;
            const cY = mY + conn.controlPointOffsetY;
            ctx.moveTo(pA.x, pA.y);
            ctx.quadraticCurveTo(cX, cY, pB.x, pB.y);
        }
        ctx.stroke();
        if (conn.type === ONE_WAY_TYPE) {
            const pos = getArrowPosition(nA, nB, conn, 0.5);
            const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
            ctx.fillStyle = isSelected ? "rgba(255, 255, 0, 0.9)" : baseClr;
            drawArrow(ctx, pos.x, pos.y, angle, 6 / viewScale);
        }
    }

    ctx.shadowBlur = 0;
    if (conn.animationState > 0 && conn.type === "string_violin") {
        ctx.strokeStyle = isSelected
            ? "rgba(255, 255, 0, 0.9)"
            : getComputedStyle(document.documentElement)
                  .getPropertyValue("--string-violin-connection-color")
                  .trim() || "#ffccaa";
        ctx.lineWidth =
            Math.max(0.5, thickness) + (isSelected ? 2 / viewScale : 0);
        ctx.setLineDash([5 / viewScale, 3 / viewScale]);
        ctx.shadowColor = isSelected
            ? "rgba(255, 255, 0, 0.9)"
            : getComputedStyle(document.documentElement)
                  .getPropertyValue("--string-violin-pulse-color")
                  .trim() || "#ffccaa";
        ctx.shadowBlur = (conn.animationState * 15) / viewScale;
        ctx.beginPath();
        const steps = Math.max(5, Math.floor(conn.length / 10));
        for (let i = 0; i <= steps; i++) {
            const p = getStringConnectionPoint(conn, i / steps);
            if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        conn.animationState -= 0.1;
        conn.animationState = Math.max(0, conn.animationState);
    }

    ctx.restore();
}

function drawHexPianoRoll() {
  if (!pianoRollCtx || !pianoRollCanvas) {
    return;
  }

  
  
  const dpr = window.devicePixelRatio || 1;

  
  let displayWidth = pianoRollCanvas.clientWidth;
  let displayHeight = pianoRollCanvas.clientHeight;
  
  if (displayHeight <= 0) displayHeight = 80;

  
  try {
    if (displayWidth > 0 && pianoRollCanvas.width !== displayWidth * dpr) {
      pianoRollCanvas.width = displayWidth * dpr;
    }
    if (displayHeight > 0 && pianoRollCanvas.height !== displayHeight * dpr) {
      pianoRollCanvas.height = displayHeight * dpr;
    }
  } catch (e) {
    console.warn("Could not set pianoRollCanvas dimensions correctly:", e);
    
    if (pianoRollCanvas.width <= 0 || pianoRollCanvas.height <= 0) return;
  }

  
  pianoRollCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  
  const canvasWidth = displayWidth;
  const canvasHeight = displayHeight;
  pianoRollCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  pianoRollHexagons = []; 

  
  const scaleNotes = currentScale.notes;
  const rootNoteModulo = currentRootNote % 12;
  const noteNameMap = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const naturalNotes = [0, 2, 4, 5, 7, 9, 11]; 

  
  const numHexagons = 12;
  const rows = 3;
  const horizontalMargin = 6;
  const verticalMargin = 4;
  const availableWidth = canvasWidth - 2 * horizontalMargin;

  
  
  
  
  let hexRadius = availableWidth / ((numHexagons - 1) * 1.5 + 2);

  
  const maxRadiusHeight = (canvasHeight - 2 * verticalMargin) / (rows * Math.sqrt(3));
  hexRadius = Math.max(5, Math.min(maxRadiusHeight, hexRadius, 15)); 

  const finalHexHeight = Math.sqrt(3) * hexRadius;
  const hSpacing = hexRadius * 1.5;
  const vSpacing = finalHexHeight / 2;

  const startX = horizontalMargin + hexRadius;
  const startY = verticalMargin + finalHexHeight / 2;

  
  pianoRollCtx.lineWidth = 1;
  pianoRollCtx.font = `bold ${Math.max(6, Math.min(9, hexRadius * 0.55))}px sans-serif`;
  pianoRollCtx.textAlign = "center";
  pianoRollCtx.textBaseline = "middle";

  const rowMarkers = ["▼", "", "▲"]; 

  
  for (let row = 0; row < rows; row++) {
    let currentColumn = 0;
    const baseY = startY + row * (finalHexHeight + verticalMargin);

    for (let i = 0; i < numHexagons; i++) {
      const noteValue = (i * 7 + rootNoteModulo) % 12; 
      const noteModulo = noteValue;

      
      const posX = startX + currentColumn * hSpacing;
      const posY = baseY + (currentColumn % 2 !== 0 ? vSpacing : 0); 

      
      const noteRelativeToRoot = (noteModulo - rootNoteModulo + 12) % 12;
      const isScaleNote = scaleNotes.includes(noteRelativeToRoot);
      const isRootNote = noteModulo === rootNoteModulo;
      const isNatural = naturalNotes.includes(noteModulo);

      let fillStyle, strokeStyle, textColor;
      if (isNatural) {
        fillStyle = "rgba(200, 210, 230, 0.8)";
        strokeStyle = "rgba(230, 240, 255, 0.7)";
        textColor = "#ddeeff";
        if (isScaleNote) {
          fillStyle = "rgba(220, 230, 250, 0.9)";
        }
        if (isRootNote) {
          fillStyle = "rgba(255, 230, 80, 0.9)";
          textColor = "#332";
          strokeStyle = "rgba(255, 240, 120, 1)";
        }
      } else { 
        fillStyle = "rgba(40, 45, 55, 0.9)";
        strokeStyle = "rgba(70, 80, 95, 0.8)";
        textColor = "#cdd5e0";
        if (isScaleNote) {
          fillStyle = "rgba(80, 90, 110, 0.9)";
        }
        if (isRootNote) {
          fillStyle = "rgba(210, 190, 60, 0.9)";
          textColor = "#332";
          strokeStyle = "rgba(230, 210, 100, 1)";
        }
      }

      
      pianoRollCtx.fillStyle = fillStyle;
      pianoRollCtx.strokeStyle = strokeStyle;
      pianoRollCtx.beginPath();
      for (let side = 0; side < 6; side++) {
        pianoRollCtx.lineTo(
          posX + hexRadius * Math.cos((side * Math.PI) / 3),
          posY + hexRadius * Math.sin((side * Math.PI) / 3),
        );
      }
      pianoRollCtx.closePath();
      pianoRollCtx.fill();
      pianoRollCtx.stroke();

      
      pianoRollCtx.fillStyle = textColor;
      const label = noteNameMap[noteModulo] + rowMarkers[row];
      pianoRollCtx.fillText(label, posX, posY + 1);

      
      pianoRollHexagons.push({
        x: posX,
        y: posY,
        radius: hexRadius,
        semitone: noteValue,
      });
      currentColumn++;
    }
  }
}


function handleHexPianoRollClick(event) {
  if (!pianoRollCanvas || !pianoRollHexagons || pianoRollHexagons.length === 0)
    return;

  const { x: canvasX, y: canvasY } = getPianoRollEventPos(event);

  let clickedSemitone = -1;

  let minDistSq = Infinity;
  for (const hex of pianoRollHexagons) {
    const dx = canvasX - hex.x;
    const dy = canvasY - hex.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < hex.radius * hex.radius && distSq < minDistSq) {
      minDistSq = distSq;
      clickedSemitone = hex.semitone;
    }
  }

  if (clickedSemitone !== -1) {
    setRootNote(clickedSemitone);
  } else {}
}

function drawKeysPianoRoll() {
  if (!pianoRollCtx || !pianoRollCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  let displayWidth = pianoRollCanvas.clientWidth;
  let displayHeight = pianoRollCanvas.clientHeight;
  if (displayHeight <= 0) displayHeight = 80;
  try {
    if (displayWidth > 0 && pianoRollCanvas.width !== displayWidth * dpr) {
      pianoRollCanvas.width = displayWidth * dpr;
    }
    if (displayHeight > 0 && pianoRollCanvas.height !== displayHeight * dpr) {
      pianoRollCanvas.height = displayHeight * dpr;
    }
  } catch (e) {
    if (pianoRollCanvas.width <= 0 || pianoRollCanvas.height <= 0) return;
  }
  pianoRollCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const canvasWidth = displayWidth;
  const canvasHeight = displayHeight;
  pianoRollCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  pianoRollKeys = [];
  pianoRollMinusRect = null;
  pianoRollPlusRect = null;

  const accent = getComputedStyle(document.body).getPropertyValue('--button-active').trim() || 'rgba(255,230,80,0.9)';
  const scaleNotes = currentScale.notes;
  const rootNoteModulo = currentRootNote % 12;
  const leftPad = 20;
  const rightPad = 20;
  const whiteCount = 9;
  const whiteWidth = (canvasWidth - leftPad - rightPad) / whiteCount;
  const blackWidth = whiteWidth * 0.6;
  const blackHeight = canvasHeight * 0.6;
  const minusBg = pianoRollHoverMinus ? 'rgba(60,60,60,0.9)' : 'rgba(40,40,40,0.9)';
  const plusBg = pianoRollHoverPlus ? 'rgba(60,60,60,0.9)' : 'rgba(40,40,40,0.9)';
  pianoRollCtx.fillStyle = minusBg;
  pianoRollCtx.fillRect(0, 0, leftPad, canvasHeight);
  pianoRollCtx.fillStyle = plusBg;
  pianoRollCtx.fillRect(canvasWidth - rightPad, 0, rightPad, canvasHeight);
  pianoRollCtx.fillStyle = '#eee';
  pianoRollCtx.textAlign = 'center';
  pianoRollCtx.textBaseline = 'middle';
  pianoRollCtx.font = 'bold 16px sans-serif';
  pianoRollCtx.fillText('-', leftPad / 2, canvasHeight / 2);
  pianoRollCtx.fillText('+', canvasWidth - rightPad / 2, canvasHeight / 2);
  pianoRollMinusRect = { x: 0, y: 0, width: leftPad, height: canvasHeight };
  pianoRollPlusRect = { x: canvasWidth - rightPad, y: 0, width: rightPad, height: canvasHeight };

  const baseSemitone = pianoRollOctave * 12;
  const whiteSemitones = [0, 2, 4, 5, 7, 9, 11, 12, 14];
  for (let i = 0; i < whiteCount; i++) {
    const x = leftPad + i * whiteWidth;
    const absValue = baseSemitone + whiteSemitones[i];
    const noteValue = absValue % 12;
    const noteRelative = (noteValue - rootNoteModulo + 12) % 12;
    const isScale = scaleNotes.includes(noteRelative);
    const isRoot = noteValue === rootNoteModulo;
    let fill = '#eee';
    let stroke = '#333';
    if (isRoot) {
      fill = accent;
      stroke = '#332';
    } else if (isScale) {
      fill = 'rgba(220,230,250,0.9)';
    }
    pianoRollCtx.fillStyle = fill;
    pianoRollCtx.strokeStyle = stroke;
    pianoRollCtx.fillRect(x, 0, whiteWidth, canvasHeight);
    pianoRollCtx.strokeRect(x, 0, whiteWidth, canvasHeight);
    const keyIndex = pianoRollKeys.length;
    pianoRollKeys.push({ x, y: 0, width: whiteWidth, height: canvasHeight, semitone: absValue });
    if (keyIndex === pianoRollHoveredIndex) {
      pianoRollCtx.fillStyle = 'rgba(255,255,255,0.3)';
      pianoRollCtx.fillRect(x, 0, whiteWidth, canvasHeight);
    }
  }

  const blackInfo = [
    { index: 0, semitone: 1 },
    { index: 1, semitone: 3 },
    { index: 3, semitone: 6 },
    { index: 4, semitone: 8 },
    { index: 5, semitone: 10 },
    { index: 7, semitone: 13 },
    { index: 8, semitone: 15 },
  ];
  blackInfo.forEach((info) => {
    const x = leftPad + (info.index + 1) * whiteWidth - blackWidth / 2;
    const absValue = baseSemitone + info.semitone;
    const noteValue = absValue % 12;
    const noteRelative = (noteValue - rootNoteModulo + 12) % 12;
    const isScale = scaleNotes.includes(noteRelative);
    const isRoot = noteValue === rootNoteModulo;
    let fill = '#333';
    if (isRoot) fill = accent;
    else if (isScale) fill = '#555';
    pianoRollCtx.fillStyle = fill;
    pianoRollCtx.fillRect(x, 0, blackWidth, blackHeight);
    pianoRollCtx.strokeStyle = '#000';
    pianoRollCtx.strokeRect(x, 0, blackWidth, blackHeight);
    const keyIndex = pianoRollKeys.length;
    pianoRollKeys.push({ x, y: 0, width: blackWidth, height: blackHeight, semitone: absValue });
    if (keyIndex === pianoRollHoveredIndex) {
      pianoRollCtx.fillStyle = 'rgba(255,255,255,0.3)';
      pianoRollCtx.fillRect(x, 0, blackWidth, blackHeight);
    }
  });
  pianoRollCtx.fillStyle = accent;
  pianoRollCtx.font = 'bold 12px sans-serif';
  pianoRollCtx.textAlign = 'right';
  pianoRollCtx.fillText(`${pianoRollOctave}`, canvasWidth - 4, canvasHeight - 10);
}

function drawPianoRoll() {
  if (pianoRollMode === 'piano') {
    drawKeysPianoRoll();
  } else {
    drawHexPianoRoll();
  }
}

function getPianoRollEventPos(event) {
  const rect = pianoRollCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const scaleX = pianoRollCanvas.width / dpr / rect.width;
  const scaleY = pianoRollCanvas.height / dpr / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function handleKeysPianoRollClick(event) {
  if (!pianoRollCanvas || !pianoRollKeys) return;
  const { x, y } = getPianoRollEventPos(event);

  if (pianoRollMinusRect && x >= pianoRollMinusRect.x && x <= pianoRollMinusRect.x + pianoRollMinusRect.width && y >= pianoRollMinusRect.y && y <= pianoRollMinusRect.y + pianoRollMinusRect.height) {
      pianoRollOctave = Math.max(-4, pianoRollOctave - 1);
      drawPianoRoll();
      saveState();
      return;
  }
  if (pianoRollPlusRect && x >= pianoRollPlusRect.x && x <= pianoRollPlusRect.x + pianoRollPlusRect.width && y >= pianoRollPlusRect.y && y <= pianoRollPlusRect.y + pianoRollPlusRect.height) {
      pianoRollOctave = Math.min(8, pianoRollOctave + 1);
      drawPianoRoll();
      saveState();
      return;
  }
  
  for (let i = pianoRollKeys.length - 1; i >= 0; i--) {
      const key = pianoRollKeys[i];
      if (x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height) {
          setAbsoluteTranspose(key.semitone);
          return;
      }
  }
}

function handlePianoRollClick(event) {
  if (pianoRollMode === 'piano') {
    handleKeysPianoRollClick(event);
  } else {
    handleHexPianoRollClick(event);
  }
}

function handlePianoRollMouseMove(event) {
  if (pianoRollMode !== 'piano' || !pianoRollCanvas) return;
  const { x, y } = getPianoRollEventPos(event);
  const prevIndex = pianoRollHoveredIndex;
  const prevMinus = pianoRollHoverMinus;
  const prevPlus = pianoRollHoverPlus;
  pianoRollHoverMinus =
    pianoRollMinusRect &&
    x >= pianoRollMinusRect.x &&
    x <= pianoRollMinusRect.x + pianoRollMinusRect.width &&
    y >= pianoRollMinusRect.y &&
    y <= pianoRollMinusRect.y + pianoRollMinusRect.height;
  pianoRollHoverPlus =
    pianoRollPlusRect &&
    x >= pianoRollPlusRect.x &&
    x <= pianoRollPlusRect.x + pianoRollPlusRect.width &&
    y >= pianoRollPlusRect.y &&
    y <= pianoRollPlusRect.y + pianoRollPlusRect.height;
  let found = -1;
  for (let i = pianoRollKeys.length - 1; i >= 0; i--) {
    const key = pianoRollKeys[i];
    if (x >= key.x && x <= key.x + key.width && y >= key.y && y <= key.y + key.height) {
      found = i;
      break;
    }
  }
  if (found !== prevIndex || pianoRollHoverMinus !== prevMinus || pianoRollHoverPlus !== prevPlus) {
    pianoRollHoveredIndex = found;
    drawPianoRoll();
  }
}

function handlePianoRollMouseLeave() {
  if (pianoRollHoveredIndex !== -1 || pianoRollHoverMinus || pianoRollHoverPlus) {
    pianoRollHoveredIndex = -1;
    pianoRollHoverMinus = false;
    pianoRollHoverPlus = false;
    drawPianoRoll();
  }
}


function setRootNote(newRootNote, preventSave = false) {
  const newRootMod = newRootNote % 12;
  if (currentRootNote === newRootMod) {
      return;
  }
  currentRootNote = newRootMod;

  updateAllPitchesAndUI();

  if (!preventSave) {
      saveState();
  }
}

function setAbsoluteTranspose(absoluteSemitone, preventSave = false) {
    const root = ((absoluteSemitone % 12) + 12) % 12;
    const offset = absoluteSemitone - root;
    if (currentRootNote === root && globalTransposeOffset === offset) {
        return;
    }
    currentRootNote = root;
    globalTransposeOffset = offset;
    updateAllPitchesAndUI();
    if (!preventSave) {
        saveState();
    }
}

function triggerManualPulsar(node) {
  if (!node || node.type !== "pulsar_manual" || !isAudioReady) return;

  const pulseData = {
    intensity: node.audioParams.pulseIntensity ?? DEFAULT_PULSE_INTENSITY,
    color: node.color ?? null,
    particleMultiplier: 1.0,
  };

  currentGlobalPulseId++;
  node.animationState = 1;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode) checkNode.animationState = 0;
  }, 150);

  node.connections.forEach((neighborId) => {
    const neighborNode = findNodeById(neighborId);
    const connection = connections.find(
      (c) =>
        (c.nodeAId === node.id && c.nodeBId === neighborId) ||
        (!c.directional && c.nodeAId === neighborId && c.nodeBId === node.id),
    );

    if (
      neighborNode &&
      neighborNode.type !== "nebula" &&
      connection &&
      connection.type !== "rope" &&
      neighborNode.lastTriggerPulseId !== currentGlobalPulseId
    ) {
      const travelTime = connection.length * DELAY_FACTOR;
      createVisualPulse(
        connection.id,
        travelTime,
        node.id,
        Infinity,
        "trigger",
        pulseData.color,
        pulseData.intensity,
      );
      propagateTrigger(
        neighborNode,
        travelTime,
        currentGlobalPulseId,
        node.id,
        Infinity,
        {
          type: "trigger",
          data: pulseData,
        },
        connection,
      );
    }
  });
}

function triggerPulsarOnce(node) {
  if (!node || !isPulsarType(node.type) || !isAudioReady) return;

  const pulseData = {
    intensity: node.audioParams?.pulseIntensity ?? DEFAULT_PULSE_INTENSITY,
    color: node.color ?? null,
    particleMultiplier: 1.0,
  };

  currentGlobalPulseId++;
  node.animationState = 1;
  setTimeout(() => {
    const checkNode = findNodeById(node.id);
    if (checkNode) checkNode.animationState = 0;
  }, 150);

  node.connections.forEach((neighborId) => {
    const neighborNode = findNodeById(neighborId);
    const connection = connections.find(
      (c) =>
        (c.nodeAId === node.id && c.nodeBId === neighborId) ||
        (!c.directional && c.nodeAId === neighborId && c.nodeBId === node.id)
    );

    if (
      neighborNode &&
      neighborNode.type !== "nebula" &&
      neighborNode.type !== PORTAL_NEBULA_TYPE &&
      connection &&
      connection.type !== "rope" &&
      neighborNode.lastTriggerPulseId !== currentGlobalPulseId
    ) {
      const travelTime = connection.length * DELAY_FACTOR;
      createVisualPulse(
        connection.id,
        travelTime,
        node.id,
        Infinity,
        "trigger",
        pulseData.color,
        pulseData.intensity
      );
      propagateTrigger(
        neighborNode,
        travelTime,
        currentGlobalPulseId,
        node.id,
        Infinity,
        {
          type: "trigger",
          data: pulseData,
        },
        connection
      );
    }
  });
}

function triggerSave() {
  try {
    const state = {
      nodes: nodes,
      connections: connections,
      fluctuatingGroupNodeIDs: Array.from(fluctuatingGroupNodeIDs),
      nodeIdCounter: nodeIdCounter,
      connectionIdCounter: connectionIdCounter,
      isGlobalSyncEnabled: isGlobalSyncEnabled,
      globalBPM: globalBPM,
      viewOffsetX: viewOffsetX,
      viewOffsetY: viewOffsetY,
      viewScale: viewScale,
      currentScaleKey: currentScaleKey,
      currentRootNote: currentRootNote,
      globalTransposeOffset: globalTransposeOffset,
      masterVolume: masterGain?.gain.value ?? 0.8,
      delaySend: masterDelaySendGain?.gain.value ?? 0.3,
      delayTime: delayNode?.delayTime.value ?? 0.25,
      delayFeedback: delayFeedbackGain?.gain.value ?? 0.4,
    };
    const stateString = JSON.stringify(
      state,
      (key, value) => {
        if (value instanceof Set) {
          return Array.from(value);
        }
        if (
          key === "audioParams" &&
          value &&
          typeof value.pulseIntensity === "number"
        ) {
          value.pulseIntensity = parseFloat(value.pulseIntensity.toFixed(3));
        }
        if (key === "audioNodes") return undefined;
        return value;
      },
      2,
    );
    const blob = new Blob([stateString], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", "_")
      .replace(":", "-");
    a.download = `celestial-constellation_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {}
}

function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loadedState = JSON.parse(e.target.result);
      if (loadedState && loadedState.nodes && loadedState.connections) {
        loadedState.selectedElements = new Set(
          loadedState.selectedElements || [],
        );

        loadState(loadedState);

        unsavedChanges = false;

        saveState();
      } else {
        console.error(
          "Loaded file is not a valid ResonAut state object after parsing.",
        );
        alert(
          "Failed to load file. The file content is not a valid ResonAut project.",
        );
      }
    } catch (err) {
      console.error("Error parsing or processing loaded file:", err);
      alert(
        "Failed to load file. It might be corrupted or not in the correct JSON format.",
      );
    } finally {
      event.target.value = "";
    }
  };
  reader.onerror = (error) => {
    console.error("Error reading file:", error);
    alert("An error occurred while trying to read the file.");
    event.target.value = "";
  };
  reader.readAsText(file);
}

function setupMIDI() {
  if (!navigator.requestMIDIAccess) return;
  navigator
    .requestMIDIAccess({ sysex: false })
    .then(onMIDISuccess, onMIDIFailure);
}

function onMIDISuccess(access) {
  midiAccess = access;
  populateMIDIDevices();
  midiAccess.onstatechange = populateMIDIDevices;
}

function onMIDIFailure(msg) {
  console.warn("MIDI access failed", msg);
}

function populateMIDIDevices() {
  if (!midiAccess) return;
  if (midiInputSelect) {
    midiInputSelect.innerHTML = "";
    midiAccess.inputs.forEach((input) => {
      const opt = document.createElement("option");
      opt.value = input.id;
      opt.textContent = input.name;
      midiInputSelect.appendChild(opt);
    });
  }
  if (midiOutputSelect) {
    midiOutputSelect.innerHTML = "";
    midiAccess.outputs.forEach((output) => {
      const opt = document.createElement("option");
      opt.value = output.id;
      opt.textContent = output.name;
      midiOutputSelect.appendChild(opt);
    });
  }
}

function selectMIDIInput(id) {
  if (!midiAccess) return;
  if (activeMidiInput) activeMidiInput.onmidimessage = null;
  activeMidiInput = midiAccess.inputs.get(id) || null;
  if (activeMidiInput) {
    activeMidiInput.onmidimessage = handleMIDIMessage;
  }
}

function selectMIDIOutput(id) {
  if (!midiAccess) return;
  activeMidiOutput = midiAccess.outputs.get(id) || null;
}

function handleMIDIMessage(event) {
  const [command, note, velocity] = event.data;
  if (midiSyncInEnabled) {
    if (command === 0xfa || command === 0xfb) {
      if (!isPlaying) togglePlayPause();
    } else if (command === 0xfc) {
      if (isPlaying) stopAllPlayback();
    } else if (command === 0xf8) {
      handleIncomingMidiClock();
    }
  }
  const cmd = command & 0xf0;
  if (cmd === 0x90 && velocity > 0) {
    playMidiNote(note, velocity);
    sendMidiMessage([command, note, velocity]);
  } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
    stopMidiNote(note);
    sendMidiMessage([command, note, velocity]);
  }
}

function sendMidiMessage(messageArray) {
  if (activeMidiOutput && messageArray) {
    try {
      activeMidiOutput.send(messageArray);
    } catch (error) {}
  }
}

function playMidiNote(midiNote, velocity = 127) {
  if (!audioContext || !masterGain) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const freq = A4_FREQ * Math.pow(2, (midiNote - A4_MIDI_NOTE) / 12);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  const velGain = Math.max(0, Math.min(1, velocity / 127));
  gain.gain.setValueAtTime(velGain, audioContext.currentTime);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  activeMidiNotes.set(midiNote, { osc, gain });
}

function stopMidiNote(midiNote) {
  const data = activeMidiNotes.get(midiNote);
  if (!data) return;
  const now = audioContext.currentTime;
  data.gain.gain.linearRampToValueAtTime(0, now + 0.1);
  data.osc.stop(now + 0.1);
  activeMidiNotes.delete(midiNote);
}

function sendMidiStart() {
  if (midiSyncOutEnabled && activeMidiOutput) {
    try {
      activeMidiOutput.send([0xfa]);
    } catch (e) {}
  }
}

function sendMidiStop() {
  if (midiSyncOutEnabled && activeMidiOutput) {
    try {
      activeMidiOutput.send([0xfc]);
    } catch (e) {}
  }
}

function startMidiClock() {
  if (midiClockIntervalId) clearInterval(midiClockIntervalId);
  if (isPlaying && midiSyncOutEnabled && activeMidiOutput) {
    const interval = (60000 / globalBPM) / 24;
    midiClockIntervalId = setInterval(() => {
      if (midiSyncOutEnabled && activeMidiOutput) {
        try {
          activeMidiOutput.send([0xf8]);
        } catch (e) {}
      }
    }, interval);
  }
}

function stopMidiClock() {
  if (midiClockIntervalId) {
    clearInterval(midiClockIntervalId);
    midiClockIntervalId = null;
  }
}

function updateMidiClockInterval() {
  if (midiClockIntervalId) {
    clearInterval(midiClockIntervalId);
    midiClockIntervalId = null;
  }
  if (isPlaying && midiSyncOutEnabled) {
    startMidiClock();
  }
}

function handleIncomingMidiClock() {
  const now = performance.now();
  midiClockPulseCounter++;
  if (midiClockPulseCounter >= 24) {
    if (lastMidiClockBeatTime) {
      const diff = now - lastMidiClockBeatTime;
      const bpm = 60000 / diff;
      if (bpm > 0 && bpm < 300) {
        globalBPM = bpm;
        if (appMenuBpmInput) appMenuBpmInput.value = Math.round(globalBPM);
        updateMidiClockInterval();
      }
    }
    lastMidiClockBeatTime = now;
    midiClockPulseCounter = 0;
  }
}

function onPlaybackStarted() {
  sendMidiStart();
  startMidiClock();
}

function onPlaybackStopped() {
  sendMidiStop();
  stopMidiClock();
}


if (glideToolButton) {
  glideToolButton.addEventListener("click", () => {
    setActiveTool("connect_glide");

    isConnecting = false;
    connectingNode = null;
  });
} else {
  console.warn("Knop met ID #glide-tool-button niet gevonden.");
}

window.addEventListener("resize", () => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (pianoRollCanvas && pianoRollCtx) {
      try {
          const w = pianoRollCanvas.clientWidth;
          const h = pianoRollCanvas.clientHeight;
          pianoRollCanvas.width = w * dpr;
          pianoRollCanvas.height = h * dpr;
          drawPianoRoll();
      } catch (e) {}
  }
  if (tapeWaveformCanvas && tapeWaveformCtx) {
      waveformPathData = null; 
      drawTapeWaveform();
      updateLoopRegionAndInputs();
  }
});
window.addEventListener("load", () => {
  document.addEventListener('visibilitychange', () => {});
  ['pointerdown', 'click', 'touchstart'].forEach((evt) => {
    window.addEventListener(
      evt,
      (e) => {},
      true
    );
  });
  const dpr = window.devicePixelRatio || 1;
  if(canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
  }

  pianoRollCanvas = document.getElementById("pianoRollCanvas");
  if (pianoRollCanvas) {
      pianoRollCtx = pianoRollCanvas.getContext("2d");
      try {
          const w = pianoRollCanvas.clientWidth || 300;
          const h = pianoRollCanvas.clientHeight || 80;
          pianoRollCanvas.width = w * dpr;
          pianoRollCanvas.height = h * dpr;
      } catch(e) {
          pianoRollCanvas.width = 300 * dpr; pianoRollCanvas.height = 80 * dpr;
      }

      pianoRollCanvas.addEventListener("mousedown", handlePianoRollClick);
      pianoRollCanvas.addEventListener("mousemove", handlePianoRollMouseMove);
      pianoRollCanvas.addEventListener("mouseleave", handlePianoRollMouseLeave);
  }

  if (tapeWaveformCanvas) {
      tapeWaveformCtx = tapeWaveformCanvas.getContext("2d");
  }

  if (tapeLoopSetLoopPointsBtn) {
      tapeLoopSetLoopPointsBtn.addEventListener("click", () => {
          if (!tapeLoopBuffer) return;
          let newStart = parseFloat(tapeLoopStartInput.value);
          let newEnd = parseFloat(tapeLoopEndInput.value);
          const bufferDuration = tapeLoopBuffer.duration;
          if (isNaN(newStart) || newStart < 0 || newStart >= bufferDuration) newStart = 0;
          if (isNaN(newEnd) || newEnd <= newStart || newEnd > bufferDuration) newEnd = bufferDuration;
          userDefinedLoopStart = newStart;
          userDefinedLoopEnd = (Math.abs(newEnd - bufferDuration) < 0.005 && newEnd > newStart) ? -1 : newEnd;
          tapeLoopStartInput.value = userDefinedLoopStart.toFixed(2);
          tapeLoopEndInput.value = (userDefinedLoopEnd === -1 || userDefinedLoopEnd > bufferDuration ? bufferDuration : userDefinedLoopEnd).toFixed(2);
          updateLoopRegionAndInputs();
          if (isTapeLoopPlaying && tapeLoopSourceNode) {
              const wasPlaying = isTapeLoopPlaying;
              const currentTime = tapeLoopSourceNode.loopStart + (((audioContext.currentTime - tapeLoopSourceNodeStartTime) * tapeLoopSourceNode.playbackRate.value) % (tapeLoopSourceNode.loopEnd - tapeLoopSourceNode.loopStart));
              stopTapeLoopPlayback();
              if (wasPlaying) { playTapeLoop(audioContext.currentTime, currentTime); }
          }
          saveState();
      });
  }

  if (tapeLoopSpeedSlider) {
      tapeLoopSpeedSlider.addEventListener("input", () => {
          currentPlaybackRate = parseFloat(tapeLoopSpeedSlider.value);
          if (tapeLoopSourceNode && !isGlobalSyncEnabled) { tapeLoopSourceNode.playbackRate.value = currentPlaybackRate; }
          if (tapeLoopSpeedValue) tapeLoopSpeedValue.textContent = currentPlaybackRate.toFixed(2) + "x";
          tapeTracks[currentTapeTrack].playbackRate = currentPlaybackRate;
      });
      tapeLoopSpeedSlider.addEventListener("change", () => { if (!isGlobalSyncEnabled) saveState(); });
  }

  if (tapeLoopResetSpeedBtn) {
      tapeLoopResetSpeedBtn.addEventListener("click", () => {
          currentPlaybackRate = 1.0;
          if (tapeLoopSpeedSlider) tapeLoopSpeedSlider.value = 1.0;
          if (tapeLoopSourceNode && !isGlobalSyncEnabled) { tapeLoopSourceNode.playbackRate.value = 1.0; }
          if (tapeLoopSpeedValue) tapeLoopSpeedValue.textContent = "1.00x";
          tapeTracks[currentTapeTrack].playbackRate = 1.0;
          if (!isGlobalSyncEnabled) saveState();
      });
  }
  
  const tapeLoopFitToLoopBtn = document.getElementById("tapeLoopFitToLoopBtn");
  const tapeLoopResetZoomBtn = document.getElementById("tapeLoopResetZoomBtn");

  if (tapeLoopFitToLoopBtn) {
      tapeLoopFitToLoopBtn.addEventListener("click", () => {
          const hasContent = !!tapeLoopBuffer || configuredTapeLoopDurationSeconds > 0.01;
          if (!hasContent) return;
          const loopStartToUse = userDefinedLoopStart;
          let loopEndToUse = userDefinedLoopEnd;
          const maxDuration = tapeLoopBuffer ? (tapeLoopEffectivelyRecordedDuration > 0 ? tapeLoopEffectivelyRecordedDuration : tapeLoopBuffer.duration) : configuredTapeLoopDurationSeconds;
          if (loopEndToUse === -1 || loopEndToUse > maxDuration || loopEndToUse <= loopStartToUse) { loopEndToUse = maxDuration; }
          if (loopEndToUse > loopStartToUse) {
              tapeDisplayStartTime = loopStartToUse;
              tapeDisplayEndTime = loopEndToUse;
              waveformPathData = null; drawTapeWaveform(); updateLoopRegionAndInputs();
          }
      });
  }
  if (tapeLoopResetZoomBtn) {
      tapeLoopResetZoomBtn.addEventListener("click", () => {
          const hasContent = !!tapeLoopBuffer || configuredTapeLoopDurationSeconds > 0.01;
          if (!hasContent) return;
          tapeDisplayStartTime = 0;
          tapeDisplayEndTime = tapeLoopBuffer ? (tapeLoopEffectivelyRecordedDuration > 0 ? tapeLoopEffectivelyRecordedDuration : tapeLoopBuffer.duration) : configuredTapeLoopDurationSeconds;
          if (tapeDisplayEndTime <= tapeDisplayStartTime) tapeDisplayEndTime = tapeDisplayStartTime + 0.1;
          waveformPathData = null; drawTapeWaveform(); updateLoopRegionAndInputs();
      });
  }

  Object.keys(scales).forEach(key => {
      const o = document.createElement("option");
      o.value = key; o.textContent = scales[key].name;
      scaleSelectTransport.appendChild(o.cloneNode(true));
  });
  scaleSelectTransport.value = currentScaleKey;
  if (pianoRollModeSelect) pianoRollModeSelect.value = pianoRollMode;
  if (backgroundSelect) backgroundSelect.value = backgroundMode;

  setActiveTool("edit");
  resetSideToolbars();
  hideOverlappingPanels();
  noteSelectContainer = null;
  startMessage.style.display = "block";
  dailyTipManager.random();
  loadStateFromLocalStorage();
  if (startChillBtn) startChillBtn.addEventListener("click", () => {
      selectedMode = "chill";
      startChillBtn.classList.add("selected");
      if (startProBtn) startProBtn.classList.remove("selected");
  });
  if (startProBtn) startProBtn.addEventListener("click", () => {
      selectedMode = "pro";
      startProBtn.classList.add("selected");
      if (startChillBtn) startChillBtn.classList.remove("selected");
  });

  if (startEngineBtn) startEngineBtn.addEventListener("click", async () => {
    if (loadingIndicator) {
        loadingIndicator.style.display = "block";
        loadingIndicator.style.opacity = "1";
    }
    if (startMessage) startMessage.style.display = "none";
    await startApplication();
  });
  setupLoopHandles();
  loadTapeTrack(0);


  makePanelDraggable(alienPanel, document.getElementById('alien-panel-header'));
  makePanelDraggable(resonauterPanel, document.getElementById('resonauter-panel-header'));
  makePanelDraggable(samplerPanel, document.getElementById('sampler-panel-header'));
  makePanelDraggable(tonePanel, document.getElementById('tone-panel-header'));
  makePanelDraggable(motorOrbPanel, document.getElementById('motor-orb-panel-header'));
  makePanelDraggable(clockworkOrbPanel, document.getElementById('clockwork-orb-panel-header'));
  const stringHeader = stringPanel ? stringPanel.querySelector('h3') : null;
  makePanelDraggable(stringPanel, stringHeader || stringPanel);
  updateReplaceMenuState();
});

if (typeof window !== 'undefined') {
  Object.assign(window, {
    saveState,
    getLatestState,
    createOp1HBar,
    setupAudio,
    stopNodeAudio,
    createAudioNodesForNode,
    updateNodeAudioParams,
    identifyAndRouteAllGroups,
    handleNewWorkspace,
    loadState,
    openReplaceInstrumentMenu,
    updateReplaceMenuState,
    audioContext,
    isAudioReady,
    pulsarTypes,
    nodes,
    propagateTrigger,
    triggerNodeEffect,
    isPulsarType,
    isDrumType,
    activeParticles,
    particleIdCounter,
    ctx,
    viewScale,
    NODE_RADIUS_BASE,
    populateSideToolbar,
    waveformToAdd,
    nodeTypeToAdd,
    samplerWaveformTypes,
    drumElementTypes,
    NEBULA_PRESET_OPTIONS,
    helpWizard,
    currentHelpStep,
    nextHelpStep,
    helpSteps,
    showHelpStep,
    squareWaveBtn,
    handleWaveformSelect,
    handleElementTypeSelect,
    createHexNoteSelectorDOM,
    hamburgerMenuPanel,
    hamburgerBtn,
  });
}
