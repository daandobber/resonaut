import {
  CRUSH_SEND_LEVEL,
  CRUSH_WET_LEVEL,
  MIST_SEND_LEVEL,
  MIST_MAX_COVERAGE,
  MIST_RESON_FREQ,
  MIST_LOW_PASS_FREQ,
  MIST_WET_LEVEL,
} from './utils/appConstants.js';
import { crushLayer, mistLayer } from './utils/domElements.js';

// Debug helper: disabled by default. Enable with window.DEBUG_PATCH_EFFECTS = true
function dbg(...args) {
  try { if (!globalThis.DEBUG_PATCH_EFFECTS) return; } catch (_) { return; }
  try { console.log('[PATCH]', ...args); } catch (_) {}
}

export const patchState = {
  isMisting: false,
  isErasing: false,
  mistGroups: [],
  currentMistGroup: null,
  isCrushing: false,
  crushGroups: [],
  currentCrushGroup: null,
};

let getIsAudioReady = () => false;
let getAudioContext = () => null;
let getNodes = () => [];
let getCrushWetGain = () => null;
let getMistFilter = () => null;
let getMistLowpass = () => null;
let getMistWetGain = () => null;
let getScreenCoords = () => ({ x: 0, y: 0 });
let getWorldCoords = () => ({ x: 0, y: 0 });
let saveState = () => {};

export function initPatchEffects(deps = {}) {
  if (typeof deps.getIsAudioReady === 'function') {
    getIsAudioReady = deps.getIsAudioReady;
  }
  if (typeof deps.getAudioContext === 'function') {
    getAudioContext = deps.getAudioContext;
  }
  if (typeof deps.getNodes === 'function') {
    getNodes = deps.getNodes;
  }
  if (typeof deps.getCrushWetGain === 'function') {
    getCrushWetGain = deps.getCrushWetGain;
  }
  if (typeof deps.getMistFilter === 'function') {
    getMistFilter = deps.getMistFilter;
  }
  if (typeof deps.getMistLowpass === 'function') {
    getMistLowpass = deps.getMistLowpass;
  }
  if (typeof deps.getMistWetGain === 'function') {
    getMistWetGain = deps.getMistWetGain;
  }
  if (typeof deps.getScreenCoords === 'function') {
    getScreenCoords = deps.getScreenCoords;
  }
  if (typeof deps.getWorldCoords === 'function') {
    getWorldCoords = deps.getWorldCoords;
  }
  if (typeof deps.saveState === 'function') {
    saveState = deps.saveState;
  }
}


export function findOrCreateCrushGroup(x, y) {
  const threshold = 150;
  for (const group of patchState.crushGroups) {
    for (const p of group.patches) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= threshold) {
        return group;
      }
    }
  }
  const container = document.createElement('div');
  container.className = 'crush-group';
  crushLayer.appendChild(container);
  const newGroup = { container, patches: [] };
  patchState.crushGroups.push(newGroup);
  return newGroup;
}

export function createCrushPatch(worldX, worldY) {
  if (!crushLayer) return;
  if (!patchState.currentCrushGroup) {
    patchState.currentCrushGroup = findOrCreateCrushGroup(worldX, worldY);
  }
  const patch = document.createElement('div');
  patch.className = 'crush-patch';
  const size = 200;
  patch.style.width = size + 'px';
  patch.style.height = size + 'px';
  const coords = getScreenCoords(worldX, worldY);
  patch.style.left = coords.x - size / 2 + 'px';
  patch.style.top = coords.y - size / 2 + 'px';
  const gradientString = 'radial-gradient(circle at 50% 50%, rgba(255,100,150,0.35) 0%, transparent 70%)';
  patch.style.backgroundImage = gradientString;
  patch.style.setProperty('--dx', `${Math.random() * 20 - 10}px`);
  patch.style.setProperty('--dy', `${Math.random() * 20 - 10}px`);
  patch.style.setProperty('--duration', `${12 + Math.random() * 6}s`);
  patch.style.setProperty('--hueDuration', `${20 + Math.random() * 10}s`);
  patch.dataset.x = worldX;
  patch.dataset.y = worldY;
  patchState.currentCrushGroup.container.appendChild(patch);
  patchState.currentCrushGroup.patches.push({ element: patch, x: worldX, y: worldY, size });
  updateCrushWetness();
  dbg('CRUSH patch created', { worldX, worldY, groups: patchState.crushGroups.length });
}

export function updateCrushPatchPositions() {
  if (!crushLayer) return;
  for (const group of patchState.crushGroups) {
    for (const patch of group.patches) {
      const coords = getScreenCoords(patch.x, patch.y);
      const size = patch.size || parseFloat(patch.element.style.width) || 200;
      patch.element.style.left = `${coords.x - size / 2}px`;
      patch.element.style.top = `${coords.y - size / 2}px`;
    }
  }
}

export function isNodeInCrush(node) {
  for (const group of patchState.crushGroups) {
    for (const patch of group.patches) {
      const dx = node.x - patch.x;
      const dy = node.y - patch.y;
      const radius = (patch.size || 200) / 2;
      if (dx * dx + dy * dy <= radius * radius) {
        return true;
      }
    }
  }
  return false;
}

export function updateCrushWetness() {
  const audioContext = getAudioContext();
  if (!getIsAudioReady() || !audioContext) return;
  const now = audioContext.currentTime;
  let anyInCrush = false;
  let processed = 0;

  const ensureConnected = (sendGain) => {
    try {
      if (!sendGain || !globalThis.crushEffectInput) return;
      const flag = '__crushConnected';
      if (!sendGain[flag] && typeof sendGain.connect === 'function') {
        sendGain.connect(globalThis.crushEffectInput);
        sendGain[flag] = true;
        dbg('CRUSH ensureConnected');
      }
    } catch (_) {}
  };
  getNodes().forEach((node) => {
    if (!node.audioNodes || !node.audioNodes.crushSendGain) {
      // Still try orbitone sends if present
      if (!node.audioNodes || !Array.isArray(node.audioNodes.orbitoneSynths)) return;
    }

    const inCrush = isNodeInCrush(node);
    if (inCrush) anyInCrush = true;
    const target = inCrush ? CRUSH_SEND_LEVEL : 0.0;
    const applyParam = (gainNode) => {
      if (!gainNode) return;
      ensureConnected(gainNode);
      try {
        const param = gainNode.gain;
        if (param && typeof param.setTargetAtTime === 'function') {
          param.setTargetAtTime(target, now, 0.05);
        } else if (param && typeof param.setValueAtTime === 'function') {
          param.setValueAtTime(target, now);
        } else if (param && typeof param.rampTo === 'function') {
          param.rampTo(target, 0.05);
        } else if (param && 'value' in param) {
          param.value = target;
        }
        let currentVal = undefined;
        try { currentVal = (param && 'value' in param) ? param.value : undefined; } catch (_) {}
        dbg('CRUSH param set', { nodeId: node.id, haveParam: !!param, currentVal });
      } catch (_) {}
    };
    if (node.audioNodes && node.audioNodes.crushSendGain) applyParam(node.audioNodes.crushSendGain);
    if (node.audioNodes && Array.isArray(node.audioNodes.orbitoneSynths)) {
      node.audioNodes.orbitoneSynths.forEach((o) => applyParam(o && o.crushSendGain));
    }
    processed++;
    dbg('CRUSH node', { id: node.id, type: node.type, inCrush, target });
  });

  const wetGain = getCrushWetGain();
  if (wetGain) {
    const wet = anyInCrush ? CRUSH_WET_LEVEL : 0.0;
    try {
      const param = wetGain.gain;
      if (param && typeof param.setTargetAtTime === 'function') {
        param.setTargetAtTime(wet, now, 0.2);
      } else if (param && typeof param.setValueAtTime === 'function') {
        param.setValueAtTime(wet, now);
      } else if (param && typeof param.rampTo === 'function') {
        param.rampTo(wet, 0.2);
      } else if (param && 'value' in param) {
        param.value = wet;
      }
    } catch (_) {}
    dbg('CRUSH wet', { anyInCrush, wet });
  }
  if (processed === 0) dbg('CRUSH no nodes processed');
}

export function removePatchAtFromGroups(groups, worldX, worldY, updateFn) {
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    for (let i = group.patches.length - 1; i >= 0; i--) {
      const patch = group.patches[i];
      const dx = worldX - patch.x;
      const dy = worldY - patch.y;
      const radius = (patch.size || 200) / 2;
      if (dx * dx + dy * dy <= radius * radius) {
        patch.element.remove();
        group.patches.splice(i, 1);
        if (group.patches.length === 0) {
          group.container.remove();
          groups.splice(gi, 1);
        }
        if (typeof updateFn === 'function') updateFn();
        saveState();
        return true;
      }
    }
  }
  return false;
}

export function removePatchElementFromGroups(groups, element, updateFn) {
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    for (let i = group.patches.length - 1; i >= 0; i--) {
      const patch = group.patches[i];
      if (patch.element === element) {
        patch.element.remove();
        group.patches.splice(i, 1);
        if (group.patches.length === 0) {
          group.container.remove();
          groups.splice(gi, 1);
        }
        if (typeof updateFn === 'function') updateFn();
        saveState();
        return true;
      }
    }
  }
  return false;
}

export function removeCrushPatchAt(worldX, worldY) {
  return removePatchAtFromGroups(patchState.crushGroups, worldX, worldY, updateCrushWetness);
}

export function removeCrushPatchElement(element) {
  return removePatchElementFromGroups(patchState.crushGroups, element, updateCrushWetness);
}

export function findOrCreateMistGroup(x, y) {
  const threshold = 150;
  for (const group of patchState.mistGroups) {
    for (const p of group.patches) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= threshold) {
        return group;
      }
    }
  }
  const container = document.createElement('div');
  container.className = 'mist-group';
  mistLayer.appendChild(container);
  const newGroup = { container, patches: [] };
  patchState.mistGroups.push(newGroup);
  return newGroup;
}

export function createMistPatch(worldX, worldY) {
  if (!mistLayer) return;
  if (!patchState.currentMistGroup) {
    patchState.currentMistGroup = findOrCreateMistGroup(worldX, worldY);
  }
  const patch = document.createElement('div');
  patch.className = 'mist-patch';
  const size = 200;
  patch.style.width = size + 'px';
  patch.style.height = size + 'px';
  const coords = getScreenCoords(worldX, worldY);
  patch.style.left = coords.x - size / 2 + 'px';
  patch.style.top = coords.y - size / 2 + 'px';
  const gradientString = 'radial-gradient(circle at 50% 50%, rgba(150,100,255,0.35) 0%, transparent 70%)';
  patch.style.backgroundImage = gradientString;
  patch.style.setProperty('--dx', `${Math.random() * 20 - 10}px`);
  patch.style.setProperty('--dy', `${Math.random() * 20 - 10}px`);
  patch.style.setProperty('--duration', `${12 + Math.random() * 6}s`);
  patch.style.setProperty('--hueDuration', `${20 + Math.random() * 10}s`);
  patch.dataset.x = worldX;
  patch.dataset.y = worldY;
  patchState.currentMistGroup.container.appendChild(patch);
  patchState.currentMistGroup.patches.push({ element: patch, x: worldX, y: worldY, size });
  updateMistWetness();
  dbg('MIST patch created', { worldX, worldY, groups: patchState.mistGroups.length });
}

export function removeMistPatchAt(worldX, worldY) {
  return removePatchAtFromGroups(patchState.mistGroups, worldX, worldY, updateMistWetness);
}

export function removeMistPatchElement(element) {
  return removePatchElementFromGroups(
    patchState.mistGroups,
    element,
    updateMistWetness,
  );
}

export function erasePatchesAt(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  if (element) {
    removeMistPatchElement(element);
    removeCrushPatchElement(element);
  }
  const coords = getWorldCoords(clientX, clientY);
  removeMistPatchAt(coords.x, coords.y);
  removeCrushPatchAt(coords.x, coords.y);
}

export function updateMistPatchPositions() {
  if (!mistLayer) return;
  for (const group of patchState.mistGroups) {
    for (const patch of group.patches) {
      const coords = getScreenCoords(patch.x, patch.y);
      const size = patch.size || parseFloat(patch.element.style.width) || 200;
      patch.element.style.left = `${coords.x - size / 2}px`;
      patch.element.style.top = `${coords.y - size / 2}px`;
    }
  }
}

export function mistCoverageForNode(node) {
  let count = 0;
  for (const group of patchState.mistGroups) {
    for (const patch of group.patches) {
      const dx = node.x - patch.x;
      const dy = node.y - patch.y;
      const radius = (patch.size || 200) / 2;
      if (dx * dx + dy * dy <= radius * radius) {
        count++;
      }
    }
  }
  return count;
}

export function updateMistWetness() {
  const audioContext = getAudioContext();
  if (!getIsAudioReady() || !audioContext) return;
  const now = audioContext.currentTime;
  let maxCoverage = 0;
   let processed = 0;

  const ensureConnected = (sendGain) => {
    try {
      if (!sendGain || !globalThis.mistEffectInput) return;
      const flag = '__mistConnected';
      if (!sendGain[flag] && typeof sendGain.connect === 'function') {
        sendGain.connect(globalThis.mistEffectInput);
        sendGain[flag] = true;
        dbg('MIST ensureConnected');
      }
    } catch (_) {}
  };
  getNodes().forEach((node) => {
    if (!node.audioNodes || !node.audioNodes.mistSendGain) {
      if (!node.audioNodes || !Array.isArray(node.audioNodes.orbitoneSynths)) return;
    }

    const coverage = mistCoverageForNode(node);
    if (coverage > maxCoverage) maxCoverage = coverage;
    const normalized = Math.min(coverage, MIST_MAX_COVERAGE) / MIST_MAX_COVERAGE;
    const target = MIST_SEND_LEVEL * normalized;
    const applyParam = (gainNode) => {
      if (!gainNode) return;
      ensureConnected(gainNode);
      try {
        const param = gainNode.gain;
        if (param && typeof param.setTargetAtTime === 'function') {
          param.setTargetAtTime(target, now, 0.05);
        } else if (param && typeof param.setValueAtTime === 'function') {
          param.setValueAtTime(target, now);
        } else if (param && typeof param.rampTo === 'function') {
          param.rampTo(target, 0.05);
        } else if (param && 'value' in param) {
          param.value = target;
        }
        let currentVal = undefined;
        try { currentVal = (param && 'value' in param) ? param.value : undefined; } catch (_) {}
        dbg('MIST param set', { nodeId: node.id, haveParam: !!param, currentVal });
      } catch (_) {}
    };
    if (node.audioNodes && node.audioNodes.mistSendGain) applyParam(node.audioNodes.mistSendGain);
    if (node.audioNodes && Array.isArray(node.audioNodes.orbitoneSynths)) {
      node.audioNodes.orbitoneSynths.forEach((o) => applyParam(o && o.mistSendGain));
    }
    processed++;
    dbg('MIST node', { id: node.id, type: node.type, coverage, target });
  });

  const filter = getMistFilter();
  if (filter) {
    const targetFreq = MIST_RESON_FREQ;
    filter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    dbg('MIST filter freq->', targetFreq);
  }
  const lowpass = getMistLowpass();
  if (lowpass) {
    lowpass.frequency.setTargetAtTime(MIST_LOW_PASS_FREQ, now, 0.1);
    dbg('MIST lowpass freq->', MIST_LOW_PASS_FREQ);
  }
  const wetGain = getMistWetGain();
  if (wetGain) {
    const wetNorm = Math.min(maxCoverage, MIST_MAX_COVERAGE) / MIST_MAX_COVERAGE;
    const wet = MIST_WET_LEVEL * wetNorm;
    try {
      const param = wetGain.gain;
      if (param && typeof param.setTargetAtTime === 'function') {
        param.setTargetAtTime(wet, now, 0.2);
      } else if (param && typeof param.setValueAtTime === 'function') {
        param.setValueAtTime(wet, now);
      } else if (param && typeof param.rampTo === 'function') {
        param.rampTo(wet, 0.2);
      } else if (param && 'value' in param) {
        param.value = wet;
      }
    } catch (_) {}
    dbg('MIST wet', { maxCoverage, wetNorm, wet });
  }
  if (processed === 0) dbg('MIST no nodes processed');
}
