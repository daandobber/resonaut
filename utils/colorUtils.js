export function hexToRgb(hex) { 
 hex = hex.replace('#','');
 const r = parseInt(hex.substr(0,2), 16);
 const g = parseInt(hex.substr(2,2), 16);
 const b = parseInt(hex.substr(4,2), 16);
 return { r, g, b };
}
export function rgbToHex(r, g, b) { 
 const toHex = v => {
  const h = v.toString(16);
  return h.length === 1 ? '0' + h : h;
 };
 return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
export function lerpColor(colorA, colorB, t) {
 const a = hexToRgb(colorA);
 const b = hexToRgb(colorB);
  if (!a || !b) return colorA; 
 const r = Math.round(a.r + (b.r - a.r) * t);
 const g = Math.round(a.g + (b.g - a.g) * t);
 const b_ = Math.round(a.b + (b.b - a.b) * t);
 return rgbToHex(r, g, b_);
}
export function getDialColor(value) { 
  const computedStyles = getComputedStyle(document.body); 
  const colorStart = computedStyles.getPropertyValue('--mixer-gradient-start').trim() || '#7CFC00';
  const colorMid = computedStyles.getPropertyValue('--mixer-gradient-mid').trim() || '#00BFFF';
  const colorEnd = computedStyles.getPropertyValue('--mixer-gradient-end').trim() || '#8A2BE2';

  if (value <= 50) {
      const t = value / 50;
      return lerpColor(colorStart, colorMid, t);
  } else {
      const t = (value - 50) / 50;
      return lerpColor(colorMid, colorEnd, t);
  }
}

const segmentsMap = {
 '0': [1,1,1,1,1,1,0], '1': [0,1,1,0,0,0,0], '2': [1,1,0,1,1,0,1],
 '3': [1,1,1,1,0,0,1], '4': [0,1,1,0,0,1,1], '5': [1,0,1,1,0,1,1],
 '6': [1,0,1,1,1,1,1], '7': [1,1,1,0,0,0,0], '8': [1,1,1,1,1,1,1],
 '9': [1,1,1,1,0,1,1], ' ': [0,0,0,0,0,0,0], '-': [0,0,0,0,0,0,1],
  'P': [1,1,0,0,1,1,1], 'A': [1,1,1,0,1,1,1], 'N': [0,1,0,1,0,1,0],
  'C': [1,0,0,1,1,1,0], 'L': [0,0,0,1,1,1,0], 'R': [0,0,0,0,1,0,1]
};


export function initDial(dialContainerElement, labelElement, targetAudioParamOrGainNode, initialValuePercent = 0, valueMappingFn = null, displayMappingFn = null, saveStateFn = null) {
  if (!dialContainerElement || typeof dialContainerElement.querySelector !== 'function') {
      return;
  }
  if (!labelElement || typeof labelElement.style !== 'object') {
      return;
  }

  if (!dialContainerElement.querySelector('svg.dial-bg')) {
      dialContainerElement.innerHTML = `
          <svg class="dial-bg" width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" fill="none" stroke="var(--mixer-dial-bg-stroke-color)" stroke-width="20" />
          </svg>
          <svg class="dial-fg" width="180" height="180" viewBox="0 0 180 180">
              <circle class="fg-circle" cx="90" cy="90" r="80" fill="none" stroke="url(#dialGrad)"
                      stroke-width="20" stroke-dasharray="0 503" stroke-linecap="round"/>
          </svg>
          <div class="display">
              ${Array(3).fill(0).map(() => `
                  <div class="digit">
                      ${['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(seg => `<div class="segment seg-${seg}"></div>`).join('')}
                  </div>`).join('')}
          </div>
      `;
  }

  const fgCircle = dialContainerElement.querySelector('svg.dial-fg > circle.fg-circle');
  const displayDiv = dialContainerElement.querySelector('div.display');
  const digitElems = displayDiv ? displayDiv.querySelectorAll('.digit') : [];

  if (!fgCircle) {
      return;
  }
   if (displayDiv && digitElems.length !== 3) {
      
  }
  
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  fgCircle.setAttribute('stroke-dasharray', `${CIRCUMFERENCE} ${CIRCUMFERENCE}`);

  let currentValuePercent = Math.max(0, Math.min(100, initialValuePercent));

  function setCircleVisual(valuePercentForCircle) {
      const pct = Math.max(0, Math.min(100, valuePercentForCircle));
      const offset = CIRCUMFERENCE * (1 - pct / 100);
      fgCircle.setAttribute('stroke-dashoffset', offset);
  }

  function updateDisplayVisual(valuePercentForDisplay) {
      const displayColor = getDialColor(valuePercentForDisplay); 
      labelElement.style.color = displayColor; 

      const offSegmentColor = getComputedStyle(document.body).getPropertyValue('--mixer-dial-segment-off-color').trim() || '#031a00';

      if (displayDiv && digitElems.length === 3) {
          let displayStr;
          if (displayMappingFn) {
              displayStr = displayMappingFn(valuePercentForDisplay); 
          } else {
              displayStr = String(Math.round(valuePercentForDisplay));
          }
          displayStr = String(displayStr).padStart(3, ' '); 
          if (displayStr.length > 3) displayStr = displayStr.substr(displayStr.length - 3);

          for (let i = 0; i < 3; i++) {
               if (!digitElems[i]) continue;
              const char = displayStr[i].toUpperCase();
              const segStates = segmentsMap[char] || segmentsMap[' '];
              const segments = digitElems[i].querySelectorAll('.segment');
              segStates.forEach((on, idx) => {
                  if (segments[idx]) {
                      segments[idx].classList.toggle('on', !!on);
                      segments[idx].style.background = on ? displayColor : offSegmentColor; 
                  }
              });
          }
      }
  }

  function updateAudioParamValue(valuePercentForAudio) {
      if (targetAudioParamOrGainNode && audioContext) { 
          let audioValue = valueMappingFn ? valueMappingFn(valuePercentForAudio) : valuePercentForAudio / 100;
          
          if (targetAudioParamOrGainNode instanceof AudioParam) {
               targetAudioParamOrGainNode.setTargetAtTime(audioValue, audioContext.currentTime, 0.01);
          } else if (targetAudioParamOrGainNode.gain && targetAudioParamOrGainNode.gain instanceof AudioParam) {
              targetAudioParamOrGainNode.gain.setTargetAtTime(audioValue, audioContext.currentTime, 0.01);
          }
      }
  }

  setCircleVisual(currentValuePercent);
  updateDisplayVisual(currentValuePercent);
  if (targetAudioParamOrGainNode && (targetAudioParamOrGainNode instanceof AudioParam || (targetAudioParamOrGainNode.gain && targetAudioParamOrGainNode.gain instanceof AudioParam))) {
     updateAudioParamValue(currentValuePercent);
  }

  function getValueFromInteractionEvent(evt) {
      const rect = dialContainerElement.getBoundingClientRect();
      const scaleApplied = 180 / rect.width; 

      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const dxScaled = (clientX - cx) * scaleApplied;
      const dyScaled = (clientY - cy) * scaleApplied;
      
      let rawAngle = Math.atan2(dyScaled, dxScaled) * (180 / Math.PI); 
      let angleFromTop = rawAngle + 90; 
      if (angleFromTop < 0) angleFromTop += 360;
      angleFromTop %= 360;
      
      const epsilon = 1; 
      if (currentValuePercent > (100 - epsilon*15) && angleFromTop < epsilon*15) angleFromTop = 360;
      if (currentValuePercent < epsilon*15 && angleFromTop > (360 - epsilon*15)) angleFromTop = 0;

      return Math.max(0, Math.min(100, Math.round((angleFromTop / 360) * 100)));
  }

  let isDraggingDial = false;
  let lastSentValueForAudio = -1; 

  const handleInteraction = (e_evt, isEndingInteraction) => {
      const v = getValueFromInteractionEvent(e_evt);
      if (v !== currentValuePercent || isEndingInteraction) { 
          currentValuePercent = v;          
          setCircleVisual(currentValuePercent);
          updateDisplayVisual(currentValuePercent); 
          
          if (updateAudioParamValue && (Math.abs(currentValuePercent - lastSentValueForAudio) >= 0.1 || isEndingInteraction)) { 
              updateAudioParamValue(currentValuePercent); 
              lastSentValueForAudio = currentValuePercent;
               if (isEndingInteraction && typeof saveStateFn === 'function') {
                  saveStateFn(); 
              }
          }
      }
  };

  const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return; 
      e.preventDefault(); e.stopPropagation(); 
      isDraggingDial = true; 
      lastSentValueForAudio = -1; 
      handleInteraction(e, false);
      try { dialContainerElement.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onPointerMove = (e) => {
      if (!isDraggingDial) return;
      e.preventDefault(); 
      handleInteraction(e, false);
  };
  const onPointerUpOrLeave = (e) => {
      if (isDraggingDial) {
          handleInteraction(e, true); 
          isDraggingDial = false;
          try { dialContainerElement.releasePointerCapture(e.pointerId); } catch (err) {}
      }
  };

  dialContainerElement.addEventListener('pointerdown', onPointerDown);
  dialContainerElement.addEventListener('pointermove', onPointerMove);
  dialContainerElement.addEventListener('pointerup', onPointerUpOrLeave);
  dialContainerElement.addEventListener('pointerleave', (e) => { 
    if (isDraggingDial) {
      const rect = dialContainerElement.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
         onPointerUpOrLeave(e);
      }
    }
  });
  dialContainerElement.addEventListener('touchmove', (e) => { if(isDraggingDial) e.preventDefault(); }, { passive: false });
}

export function updateDialSevenSegmentDisplay(displayDivElement, valueToDisplay, activeColor) {
  if (!displayDivElement) return;
  const digitElems = displayDivElement.querySelectorAll('.digit');
  if (!digitElems || digitElems.length < 3) return;

  let strValue;
  if (typeof valueToDisplay === 'string' && (valueToDisplay === 'L' || valueToDisplay === 'C' || valueToDisplay === 'R')) {
    strValue = valueToDisplay.padStart(3, ' ');
  } else if (typeof valueToDisplay === 'string' && valueToDisplay.length <= 3 && /^[0-9- ]+$/.test(valueToDisplay) ) {
    strValue = valueToDisplay.padStart(3, ' ');
  } else {
    strValue = String(Math.round(parseFloat(valueToDisplay))).padStart(3, ' ');
  }

  if (strValue.length > 3) strValue = strValue.substr(strValue.length - 3);

  const offSegmentColor = getComputedStyle(document.body).getPropertyValue('--mixer-dial-segment-off-color').trim() || '#031a00';

  for (let i = 0; i < 3; i++) {
    if (!digitElems[i]) continue;
    const char = strValue[i].toUpperCase();
    const segStates = segmentsMap[char] || segmentsMap[' '];
    const segments = digitElems[i].querySelectorAll('.segment');
    segStates.forEach((on, idx) => {
      if (segments[idx]) {
        segments[idx].classList.toggle('on', !!on);
        segments[idx].style.background = on ? activeColor : offSegmentColor;
      }
    });
  }
}

export function setDialSvgCircle(fgCircleElem, value, circumference) { 
  const pct = Math.max(0, Math.min(100, value));
  const actualFillPercentage = pct / 100;
  const dashValue = actualFillPercentage * circumference;
  fgCircleElem.setAttribute('stroke-dasharray', `${dashValue} ${circumference}`);
}

export function initDial_custom(dialContainerElement, labelElement, initialNormalizedValue, updateAudioCallback, displayValueFormatter = null) {
  if (!dialContainerElement || typeof dialContainerElement.querySelector !== 'function') {
      console.error("initDial_custom: dialContainerElement is not a valid DOM element.", dialContainerElement);
      return;
  }
  if (!labelElement || typeof labelElement.style !== 'object') { 
      console.error("initDial_custom: labelElement is not a valid DOM element.", labelElement);
      return;
  }
  const container = dialContainerElement; 
  const labelElem = labelElement;
  const fgCircle = container.querySelector('svg.dial-fg > circle.fg-circle');
  const displayDiv = container.querySelector('div.display'); 
  if (!fgCircle) {
      console.error(`initDial_custom: Foreground circle (svg.dial-fg > circle.fg-circle) not found within provided dial container element.`);
      return;
  }
  const RADIUS = 80; 
  const ACTUAL_CIRCUMFERENCE_FOR_SVG = 2 * Math.PI * RADIUS; 
  let currentValue = Math.max(0, Math.min(100, initialNormalizedValue)); 
  function updateVisuals(valueForVisuals) { 
      const activeColor = getDialColor(valueForVisuals);
      setDialSvgCircle(fgCircle, valueForVisuals, ACTUAL_CIRCUMFERENCE_FOR_SVG);
      if (displayDiv) { 
          const sevenSegFormattedValue = displayValueFormatter ? displayValueFormatter(valueForVisuals) : Math.round(valueForVisuals);           
          updateDialSevenSegmentDisplay(displayDiv, sevenSegFormattedValue, activeColor);
      }
      labelElem.style.color = activeColor;
  }
  updateVisuals(currentValue);
  function getValueFromInteractionEvent(evt) {
      const rect = container.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      const cx = rect.left + (rect.width / 2);
      const cy = rect.top + (rect.height / 2);
      const dx = clientX - cx;
      const dy = clientY - cy;
      let rawAngle = Math.atan2(dy, dx) * (180 / Math.PI); 
      let angleFromTop = rawAngle + 90; 
      if (angleFromTop < 0) angleFromTop += 360;
      angleFromTop %= 360;
      let value = (angleFromTop / 360) * 100;
      return Math.max(0, Math.min(100, Math.round(value)));
  }
  let isDragging = false;
  let lastSentValue = -1; 
  const handleInteraction = (e_evt, isEndingInteraction) => {
      const v = getValueFromInteractionEvent(e_evt);
      if (v !== currentValue || isEndingInteraction) { 
          currentValue = v;          
          updateVisuals(currentValue); 
          if (updateAudioCallback && (currentValue !== lastSentValue || isEndingInteraction)) {
              updateAudioCallback(currentValue); 
              lastSentValue = currentValue;
          }
      }
  };
  const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return; 
      e.preventDefault(); e.stopPropagation(); isDragging = true; lastSentValue = -1; 
      handleInteraction(e, false);
      try { container.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault(); handleInteraction(e, false);
  };
  const onPointerUpOrLeave = (e) => {
      if (isDragging) {
          handleInteraction(e, true); isDragging = false;
          try { container.releasePointerCapture(e.pointerId); } catch (err) {}
      }
  };
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUpOrLeave);
  container.addEventListener('pointerout', onPointerUpOrLeave); 
  container.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}




export function rgbaToHex(rgba) {
  if (!rgba || !rgba.startsWith("rgba")) return "#ffffff";
  try {
    const parts = rgba
      .substring(rgba.indexOf("(") + 1, rgba.lastIndexOf(")"))
      .split(/,\s*/);
    if (parts.length < 3) return "#ffffff";
    const r = parseInt(parts[0]).toString(16).padStart(2, "0");
    const g = parseInt(parts[1]).toString(16).padStart(2, "0");
    const b = parseInt(parts[2]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  } catch (e) {
    return "#ffffff";
  }
}

export function hexToRgba(hex, alpha = 1) {
  if (!hex || !hex.startsWith("#")) return null;
  try {
    let bigint;
    if (hex.length === 4) {
      bigint = parseInt(
        hex
          .slice(1)
          .split("")
          .map((char) => char + char)
          .join(""),
        16,
      );
    } else if (hex.length === 7) {
      bigint = parseInt(hex.slice(1), 16);
    } else {
      return null;
    }
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return null;
  }
}

export function hexToRgbForGradient(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { 
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { 
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
  } else {
      return null;
  }
  return { r, g, b };
}

export function hslToRgba(h, s, l, a = 1) {
  let r, g, b;
  s /= 100;
  l /= 100;
  if (s == 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

export function rgbaToHsl(rgba) {
  const match = rgba && rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  const parts = match[1].split(/,\s*/).slice(0, 3).map(Number);
  const r = parts[0] / 255;
  const g = parts[1] / 255;
  const b = parts[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

