const safeGetById = (id) =>
  typeof document !== 'undefined' && typeof document.getElementById === 'function'
    ? document.getElementById(id)
    : { addEventListener: () => {}, classList: { add() {}, remove() {}, contains() { return false; } }, style: {} };
const safeQueryAll = (sel) =>
  typeof document !== 'undefined' && typeof document.querySelectorAll === 'function'
    ? document.querySelectorAll(sel)
    : [];

export let canvas = safeGetById("mainCanvas") || { getContext: () => null };
export let ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;

export function setCanvas(newCanvas) {
  if (!newCanvas) return;
  canvas = newCanvas;
  ctx = canvas.getContext("2d");
  const evt = new Event("canvas-set");
  window.dispatchEvent(evt);
}
export const startMessage = safeGetById("startMessage");
export const dailyTipEl = safeGetById("dailyTip");
export const prevTipBtn = safeGetById("prevTipBtn");
export const nextTipBtn = safeGetById("nextTipBtn");
export const startChillBtn = safeGetById("startChillBtn");
export const startProBtn = safeGetById("startProBtn");
export const loadingIndicator = safeGetById("loadingIndicator");
export const startEngineBtn = safeGetById("startEngineBtn");
export const appMenuBar = safeGetById("app-menu-bar");
export const appMenuNew = safeGetById("app-menu-new");
export const appMenuLoad = safeGetById("app-menu-load");
export const appMenuSave = safeGetById("app-menu-save");
export const midiInputSelect = safeGetById("midi-input-select");
export const midiOutputSelect = safeGetById("midi-output-select");
export const midiSyncInCheckbox = safeGetById("midi-sync-in");
export const midiSyncOutCheckbox = safeGetById("midi-sync-out");
export const appMenuEnterUfoMode = safeGetById("app-menu-enter-ufo-mode");
export const appMenuUndoBtn = safeGetById("app-menu-undo-btn");
export const appMenuRedoBtn = safeGetById("app-menu-redo-btn");
export const appMenuCut = safeGetById("app-menu-cut");
export const appMenuCopy = safeGetById("app-menu-copy");
export const appMenuPaste = safeGetById("app-menu-paste");
export const appMenuReplace = safeGetById("app-menu-replace");
export const appMenuGridToggleBtn = safeGetById("app-menu-grid-toggle-btn");
export const appMenuGridSnapBtn = safeGetById("app-menu-grid-snap-btn");
export const appMenuSyncToggleBtn = safeGetById("app-menu-sync-toggle-btn");
export const appMenuBpmControls = safeGetById("app-menu-bpm-controls");
export const appMenuBpmInput = safeGetById("app-menu-bpm-input");
export const appMenuPlayPauseBtn = safeGetById("app-menu-play-pause-btn");
export const appMenuStopBtn = safeGetById("app-menu-stop-btn");
export const appMenuRestartPulsarsBtn = safeGetById("app-menu-restart-pulsars-btn");
export const appMenuBeatIndicator = safeGetById("app-menu-beat-indicator");
export const appMenuHelpBtn = safeGetById("app-menu-help-btn");
export const helpPopup = safeGetById("help-popup");
export const closeHelpPopupBtn = safeGetById("close-help-popup-btn");
export const scaleSelectTransport = safeGetById("scaleSelectTransport");
export const pianoRollModeSelect = safeGetById("transpose-control-select");
export const backgroundSelect = safeGetById("background-select");
export const closeHamburgerBtn = safeGetById("closeHamburgerBtn");
export const groupControlsDiv = safeGetById("groupControls");
export const groupVolumeSlider = safeGetById("groupVolumeSlider");
export const groupFluctuateToggle = safeGetById("groupFluctuateToggle");
export const groupFluctuateAmount = safeGetById("groupFluctuateAmount");
export const groupNodeCountSpan = safeGetById("groupNodeCount");
export const gridOptionsDiv = safeGetById("gridOptions");
export const toggleInfoTextBtn = safeGetById("toggleInfoTextBtn");
export const transportControlsDiv = safeGetById("transportControls");
export const restartPulsarsBtn = safeGetById("restartPulsarsBtn");
export const beatIndicatorElement = safeGetById("app-menu-beat-indicator");
export const mixerPanel = safeGetById("mixerPanel");
export const mixerVolumeControls = safeGetById("mixerVolumeControls");
export const mixerSendControls = safeGetById("mixerSendControls");
export const mixerPanControls = safeGetById("mixerPanControls");
export const mixerTabButtons = safeQueryAll(".mixer-tab-button");
export const addSoundStarBtn = safeGetById("addSoundStarBtn");
export const addSamplerBtn = safeGetById("addSamplerBtn");
export const addNebulaBtn = safeGetById("addNebulaBtn");
export const addPulsarBtn = safeGetById("addPulsarBtn");
export const addMeteorShowerBtn = safeGetById("addMeteorShowerBtn");
export const instrumentsMenuBtn = safeGetById("instrumentsMenuBtn");
export const connectionsMenuBtn = safeGetById("connectionsMenuBtn");
export const addAnalogSynthBtn = safeGetById("addAnalogSynthBtn");
export const addFmSynthBtn = safeGetById("addFmSynthBtn");
export const addDrumElementBtn = safeGetById("addDrumElementBtn");
export const dronesMenuBtn = safeGetById("dronesMenuBtn");
export const toolsMenuBtn = safeGetById("toolsMenuBtn");
export const mistMenuBtn = safeGetById("mistMenuBtn");
export const motionMenuBtn = safeGetById("motionMenuBtn");
export const editBtn = safeGetById("editBtn");
export const connectBtn = safeGetById("connectBtn");
export const connectStringBtn = safeGetById("connectStringBtn");
export const glideToolButton = safeGetById("glide-tool-button");
export const connectWaveTrailBtn = safeGetById("connectWaveTrailBtn");
export const connectOneWayBtn = safeGetById("connectOneWayBtn");
export const connectRopeBtn = safeGetById("connectRopeBtn");
export const deleteBtn = safeGetById("deleteBtn");
export const eraserBtn = safeGetById("eraserBtn");
export const wandBtn = safeGetById("wandBtn");
export const mistBtn = safeGetById("mistBtn");
export const mistLayer = safeGetById("mistLayer");
export const crushBtn = safeGetById("crushBtn");
export const crushLayer = safeGetById("crushLayer");
export const mrfaToggle = safeGetById("mrfaToggle");
export const mrfaBandSliders = [
  safeGetById("mrfaBand1"),
  safeGetById("mrfaBand2"),
  safeGetById("mrfaBand3"),
  safeGetById("mrfaBand4"),
  safeGetById("mrfaBand5"),
  safeGetById("mrfaBand6"),
  safeGetById("mrfaBand7"),
  safeGetById("mrfaBand8"),
];
export const undoBtn = safeGetById("undoBtn");
export const redoBtn = safeGetById("redoBtn");
export const hamburgerBtn = safeGetById("hamburgerBtn");
export const hamburgerMenuPanel = safeGetById("hamburgerMenuPanel");
export const editPanelContent = safeGetById("editPanelContent");
export const toolbar = safeGetById("toolbar");
export const sideToolbar = safeGetById("sideToolbar");
export const sideToolbarTitle = safeGetById("sideToolbarTitle");
export const sideToolbarContent = safeGetById("sideToolbarContent");
export const alienPanel = safeGetById('alien-panel');
export const alienPanelContent = safeGetById('alien-panel-content');
export const alienPanelCloseBtn = safeGetById('alien-panel-close-btn');
export const arvoPanel = safeGetById('arvo-panel');
export const arvoPanelContent = safeGetById('arvo-panel-content');
export const arvoPanelCloseBtn = safeGetById('arvo-panel-close-btn');
export const resonauterPanel = safeGetById('resonauter-panel');
export const resonauterPanelContent = safeGetById('resonauter-panel-content');
export const resonauterPanelCloseBtn = safeGetById('resonauter-panel-close-btn');
export const samplerPanel = safeGetById("sampler-panel");
export const samplerPanelContent = safeGetById("sampler-panel-content");
export const samplerPanelCloseBtn = safeGetById("sampler-panel-close-btn");
export const tonePanel = safeGetById('tone-panel');
export const tonePanelContent = safeGetById('tone-panel-content');
export const tonePanelCloseBtn = safeGetById('tone-panel-close-btn');
export const radioOrbPanel = safeGetById('radio-orb-panel');
export const radioOrbPanelContent = safeGetById('radio-orb-panel-content');
export const radioOrbPanelCloseBtn = safeGetById('radio-orb-panel-close-btn');
export const motorOrbPanel = safeGetById('motor-orb-panel');
export const motorOrbPanelContent = safeGetById('motor-orb-panel-content');
export const motorOrbPanelCloseBtn = safeGetById('motor-orb-panel-close-btn');
export const clockworkOrbPanel = safeGetById('clockwork-orb-panel');
export const clockworkOrbPanelContent = safeGetById('clockwork-orb-panel-content');
export const clockworkOrbPanelCloseBtn = safeGetById('clockwork-orb-panel-close-btn');
export const stringPanel = safeGetById("string-panel");
export const stringPanelContent = safeGetById("string-panel-content");
export const stringPanelCloseBtn = safeGetById("string-panel-close-btn");

export const appMenuRecordBtn = safeGetById("app-menu-record-btn");
export const appMenuToggleTapeLooperBtn = safeGetById("app-menu-toggle-tape-looper-btn");
export const appMenuRadioSamplerBtn = safeGetById("app-menu-radio-sampler-btn");
export const appMenuPerformanceBtn = safeGetById("app-menu-performance-btn");
export const appMenuToggleTimelineBtn = safeGetById("app-menu-toggle-timeline-btn");

export const tapeLooperPanel = safeGetById("tapeLooperPanel");
export const closeTapeLooperPanelBtn = safeGetById("closeTapeLooperPanelBtn");
export const tapeWaveformCanvas = safeGetById("tapeWaveformCanvas");
export const tapeVisualLoopRegion = safeGetById("tapeVisualLoopRegion");
export const tapeLoopHandleStart = safeGetById("tapeLoopHandleStart");
export const tapeLoopHandleEnd = safeGetById("tapeLoopHandleEnd");
export const tapeVisualPlayhead = safeGetById("tapeVisualPlayhead");
export const tapeLoopDurationInput = safeGetById("tapeLoopDurationInput");
export const tapeTrackButtons = safeQueryAll(".tape-track-btn");
export const performancePanel = safeGetById("performance-panel");
export const performancePanelCloseBtn = safeGetById("performance-panel-close-btn");
export const openPerformancePanelBtn = safeGetById("openPerformancePanelBtn");
export const tapeLoopStartInput = safeGetById("tapeLoopStartInput");
export const tapeLoopEndInput = safeGetById("tapeLoopEndInput");
export const tapeLoopSetLoopPointsBtn = safeGetById("tapeLoopSetLoopPointsBtn");
export const tapeLoopRecordBtn = safeGetById("tapeLoopRecordBtn");
export const tapeLoopPlayBtn = safeGetById("tapeLoopPlayBtn");
export const tapeLoopStopBtn = safeGetById("tapeLoopStopBtn");
export const tapeLoopClearBtn = safeGetById("tapeLoopClearBtn");
export const tapeLoopSpeedSlider = safeGetById("tapeLoopSpeedSlider");
export const tapeLoopSpeedValue = safeGetById("tapeLoopSpeedValue");
export const tapeLoopResetSpeedBtn = safeGetById("tapeLoopResetSpeedBtn");
export const tapeLoopStatusLabel = safeGetById("tapeLoopStatusLabel");
export const tapeLoopTimer = safeGetById("tapeLoopTimer");
export const radioSamplerPanel = safeGetById("radioSamplerPanel");
export const closeRadioSamplerPanelBtn = safeGetById("closeRadioSamplerPanelBtn");
export const perfResoSlider = safeGetById("perfResoSlider");
export const perfResoValue = safeGetById("perfResoValue");
export const perfResoToggle = safeGetById("perfResoToggle");
export const perfResoDelaySlider = safeGetById("perfResoDelaySlider");
export const perfResoDelayValue = safeGetById("perfResoDelayValue");
export const perfResoFeedbackSlider = safeGetById("perfResoFeedbackSlider");
export const perfResoFeedbackValue = safeGetById("perfResoFeedbackValue");
export const perfResoFreqSlider = safeGetById("perfResoFreqSlider");
export const perfResoFreqValue = safeGetById("perfResoFreqValue");
export const perfResoQSlider = safeGetById("perfResoQSlider");
export const perfResoQValue = safeGetById("perfResoQValue");
export const perfReverbSlider = safeGetById("perfReverbSlider");
export const perfReverbValue = safeGetById("perfReverbValue");
export const perfReverbToggle = safeGetById("perfReverbToggle");
export const perfReverbSizeSlider = safeGetById("perfReverbSizeSlider");
export const perfReverbSizeValue = safeGetById("perfReverbSizeValue");
export const perfReverbDecaySlider = safeGetById("perfReverbDecaySlider");
export const perfReverbDecayValue = safeGetById("perfReverbDecayValue");
export const perfReverbDampSlider = safeGetById("perfReverbDampSlider");
export const perfReverbDampValue = safeGetById("perfReverbDampValue");
export const canvasSwitcherEl = safeGetById("canvasSwitcher");
export const canvasSwitcherToggle = safeGetById("canvasSwitcherToggle");
export const helpWizard = safeGetById("help-wizard");
export const wizardArrow = safeGetById("wizard-arrow");
export const wizardHighlight = safeGetById("wizard-highlight");
export const wizardText = safeGetById("wizard-text");
export const wizardMessage = safeGetById("wizard-message");
export const wizardNextBtn = safeGetById("wizard-next-btn");
export const wizardPrevBtn = safeGetById("wizard-prev-btn");
export const wizardCloseBtn = safeGetById("wizard-close-btn");
export const wizardEndBtn = safeGetById("wizard-end-btn");