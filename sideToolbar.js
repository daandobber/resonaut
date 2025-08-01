import { sideToolbarContent, sideToolbarTitle, sideToolbar, hamburgerMenuPanel, hamburgerBtn } from './utils/domElements.js';
import { analogWaveformPresets } from './orbs/analog-waveform-presets.js';
import { fmSynthPresets } from './orbs/fm-synth-orb.js';
import { SAMPLER_DEFINITIONS } from './samplers.js';

export function populateSideToolbar(contentType, title) {
  if (!sideToolbarContent || !sideToolbarTitle || !sideToolbar) return;

  sideToolbarContent.innerHTML = "";
  sideToolbarTitle.textContent = title || "Element Options";

  sideToolbar.classList.add("narrow");

  const groupDiv = document.createElement("div");
  groupDiv.classList.add("type-group");

  let targetPresetArray = [];
  let showNoteSelector = false;
  let currentSelectionKey = window.waveformToAdd;
  if (contentType === "pulsarTypes" || contentType === "drumElements") {
    currentSelectionKey = window.nodeTypeToAdd;
  }

  switch (contentType) {
    case "analogWaveforms":
      targetPresetArray = analogWaveformPresets;
      showNoteSelector = false;
      if (
        window.nodeTypeToAdd !== "sound" ||
        !analogWaveformPresets.some((w) => w.type === window.waveformToAdd)
      ) {
        window.waveformToAdd =
          analogWaveformPresets.length > 0 ? analogWaveformPresets[0].type : null;
        currentSelectionKey = window.waveformToAdd;
      }
      break;
    case "fmSynths":
      targetPresetArray = fmSynthPresets;
      showNoteSelector = false;
      if (
        window.nodeTypeToAdd !== "sound" ||
        !fmSynthPresets.some((w) => w.type === window.waveformToAdd)
      ) {
        window.waveformToAdd = fmSynthPresets.length > 0 ? fmSynthPresets[0].type : null;
        currentSelectionKey = window.waveformToAdd;
      }
      break;
    case "samplers":
      if (typeof SAMPLER_DEFINITIONS !== "undefined" && SAMPLER_DEFINITIONS.length > 0) {
        window.samplerWaveformTypes.forEach((sampler) => {
          const button = document.createElement("button");
          button.classList.add("waveform-button", "sampler-button");
          button.dataset.type = sampler.type;
          button.textContent = sampler.label;
          button.disabled = sampler.loadFailed;
          if (sampler.loadFailed) {
            button.title = `${sampler.label} sample failed to load`;
            button.classList.add("disabled");
          }
          if (window.nodeTypeToAdd === "sound" && window.waveformToAdd === sampler.type) {
            button.classList.add("selected");
          }
          button.addEventListener("click", () => {
            if (!button.disabled) window.handleWaveformSelect(button, sampler.type);
          });
          groupDiv.appendChild(button);
        });
        if (
          window.nodeTypeToAdd === "sound" &&
          (window.waveformToAdd === null ||
            !window.samplerWaveformTypes.some((w) => w.type === window.waveformToAdd && !w.loadFailed))
        ) {
          const firstAvailableSampler = window.samplerWaveformTypes.find((s) => !s.loadFailed);
          if (firstAvailableSampler) {
            window.waveformToAdd = firstAvailableSampler.type;
            currentSelectionKey = window.waveformToAdd;
          }
        }
      } else {
        const errorMsg = document.createElement("p");
        errorMsg.textContent =
          typeof SAMPLER_DEFINITIONS !== "undefined" ? "No samplers defined." : "Error: Sampler definitions not loaded.";
        errorMsg.style.opacity = "0.7";
        groupDiv.appendChild(errorMsg);
      }
      showNoteSelector = false;
      break;
    case "pulsarTypes":
      targetPresetArray = window.pulsarTypes;
      if (!window.pulsarTypes.some((p) => p.type === window.nodeTypeToAdd)) {
        window.nodeTypeToAdd = window.pulsarTypes.length > 0 ? window.pulsarTypes[0].type : null;
        currentSelectionKey = window.nodeTypeToAdd;
      }
      break;
    case "drumElements":
      targetPresetArray = window.drumElementTypes;
      if (!window.drumElementTypes.some((d) => d.type === window.nodeTypeToAdd)) {
        window.nodeTypeToAdd = window.drumElementTypes.length > 0 ? window.drumElementTypes[0].type : null;
        currentSelectionKey = window.nodeTypeToAdd;
      }
      break;
    case "waveforms":
      const nebulaWaveforms = window.NEBULA_PRESET_OPTIONS;
      targetPresetArray = nebulaWaveforms;
      showNoteSelector = false;
      if (
        window.nodeTypeToAdd !== "nebula" ||
        !nebulaWaveforms.some((w) => w.type === window.waveformToAdd)
      ) {
        window.waveformToAdd = nebulaWaveforms.length > 0 ? nebulaWaveforms[0].type : null;
        currentSelectionKey = window.waveformToAdd;
      }
      break;
  }

  if (targetPresetArray.length > 0) {
    targetPresetArray.forEach((item) => {
      const button = document.createElement("button");
      let buttonClass = "type-button";
      if (contentType === "analogWaveforms" || contentType === "fmSynths" || contentType === "waveforms") {
        buttonClass = "waveform-button";
      } else if (contentType === "drumElements") {
        buttonClass = "drum-element-button";
      }

      button.classList.add(buttonClass);
      button.dataset.type = item.type;
      button.textContent = item.label;

      if (item.type === currentSelectionKey) {
        button.classList.add("selected");
      }

      if (contentType === "pulsarTypes" || contentType === "drumElements") {
        button.addEventListener("click", () => {
          window.handleElementTypeSelect(button, item.type);
          if (
            window.helpWizard &&
            !window.helpWizard.classList.contains("hidden") &&
            window.currentHelpStep === 1 &&
            contentType === "pulsarTypes" &&
            item.type === "pulsar_standard"
          ) {
            window.nextHelpStep();
          }
        });
        if (contentType === "pulsarTypes" && item.type === "pulsar_standard") {
          window.helpSteps[1].target = button;
        }
      } else {
        button.addEventListener("click", () => {
          window.handleWaveformSelect(button, item.type);
          if (
            window.helpWizard &&
            !window.helpWizard.classList.contains("hidden") &&
            window.currentHelpStep === 4 &&
            contentType === "analogWaveforms" &&
            item.type === "square"
          ) {
            window.nextHelpStep();
          }
        });
        if (contentType === "analogWaveforms" && item.type === "square") {
          window.squareWaveBtn = button;
          window.helpSteps[4].target = button;
        }
      }
      groupDiv.appendChild(button);
    });
  }

  sideToolbarContent.appendChild(groupDiv);

  if (
    window.helpWizard &&
    !window.helpWizard.classList.contains("hidden") &&
    window.currentHelpStep === 4 &&
    contentType === "analogWaveforms"
  ) {
    window.showHelpStep();
  }

  if (showNoteSelector) {
    window.createHexNoteSelectorDOM(sideToolbarContent, []);
  }

  sideToolbar.classList.remove("hidden");
  if (hamburgerMenuPanel) hamburgerMenuPanel.classList.add("hidden");
  if (hamburgerBtn) hamburgerBtn.classList.remove("active");
}
