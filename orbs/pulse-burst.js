// Pulse Burst module: Takes one pulse and outputs multiple pulses with timing control

export const PULSE_BURST_TYPE = 'pulse_burst';

// Default parameters
export const DEFAULT_PULSE_BURST_PARAMS = {
  burstCount: 4,        // Number of pulses to output (2-16)
  burstDuration: 1.0,   // Total duration in seconds (0.1-5.0)
  burstPattern: 'even', // Pattern: 'even', 'accelerate', 'decelerate', 'random'
  patternIntensity: 0.5, // How much pattern affects timing (0-1)
  pulseIntensity: 1.0,  // Intensity of output pulses
  retriggerable: true   // Whether new pulse cancels current burst
};

// Initialize Pulse Burst node
export function initPulseBurstNode(newNode, deps) {
  const {
    DEFAULT_PULSE_INTENSITY,
  } = deps;

  newNode.burstState = {
    isActive: false,
    currentBurst: null,
    timeouts: [] // Track scheduled pulses for cancellation
  };

  newNode.audioParams = newNode.audioParams || {};
  const ap = newNode.audioParams;
  
  // Apply default parameters
  Object.assign(ap, { ...DEFAULT_PULSE_BURST_PARAMS, ...ap });
  ap.pulseIntensity = ap.pulseIntensity ?? DEFAULT_PULSE_INTENSITY;
}

// Handle pulse to Burst node
export function handlePulseBurstPulse(currentNode, incomingConnection, deps) {
  const {
    findNodeById,
    triggerNodeEffect,
  } = deps;

  console.log('🎆 Pulse Burst triggered for node', currentNode.id);

  // Accept pulse input from any handle
  if (!incomingConnection) {
    console.log('Pulse Burst: No incoming connection');
    return true;
  }

  currentNode.animationState = 1;
  const ap = currentNode.audioParams || {};
  const burstState = currentNode.burstState;

  // Cancel existing burst if retriggerable
  if (ap.retriggerable && burstState.isActive) {
    console.log('Cancelling existing burst for retrigger');
    cancelCurrentBurst(currentNode);
  }

  // Start new burst sequence
  startBurstSequence(currentNode, deps);
  
  return true;
}

// Start a burst sequence
function startBurstSequence(node, deps) {
  const ap = node.audioParams;
  const burstState = node.burstState;
  
  burstState.isActive = true;
  burstState.timeouts = [];

  const count = Math.max(2, Math.min(16, ap.burstCount || 4));
  const duration = Math.max(0.1, Math.min(5.0, ap.burstDuration || 1.0));
  const pattern = ap.burstPattern || 'even';
  const intensity = Math.max(0, Math.min(1, ap.patternIntensity || 0.5));

  console.log('Starting burst:', { count, duration, pattern, intensity });

  // Calculate timing for each pulse based on pattern
  const timings = calculateBurstTimings(count, duration, pattern, intensity);
  
  // Schedule each pulse
  timings.forEach((delay, index) => {
    const timeout = setTimeout(() => {
      fireBurstPulse(node, index, count, deps);
      
      // Clean up if this was the last pulse
      if (index === count - 1) {
        burstState.isActive = false;
        burstState.timeouts = [];
        console.log('Burst sequence completed');
      }
    }, delay * 1000); // Convert to milliseconds
    
    burstState.timeouts.push(timeout);
  });
}

// Calculate timing array based on pattern
function calculateBurstTimings(count, duration, pattern, intensity) {
  const timings = [];
  
  switch (pattern) {
    case 'even':
      // Evenly spaced pulses
      for (let i = 0; i < count; i++) {
        timings.push((i / (count - 1)) * duration);
      }
      break;
      
    case 'accelerate':
      // Start slow, get faster (exponential spacing)
      for (let i = 0; i < count; i++) {
        const progress = i / (count - 1);
        // Exponential curve: slow start, fast end
        const curved = Math.pow(progress, 2 - intensity);
        timings.push(curved * duration);
      }
      break;
      
    case 'decelerate':
      // Start fast, get slower
      for (let i = 0; i < count; i++) {
        const progress = i / (count - 1);
        // Inverse exponential: fast start, slow end  
        const curved = 1 - Math.pow(1 - progress, 2 - intensity);
        timings.push(curved * duration);
      }
      break;
      
    case 'random':
      // Random spacing with some intensity control
      const baseSpacing = duration / (count - 1);
      let currentTime = 0;
      
      for (let i = 0; i < count; i++) {
        timings.push(currentTime);
        if (i < count - 1) {
          const randomFactor = (Math.random() - 0.5) * intensity * 2;
          const nextSpacing = baseSpacing * (1 + randomFactor);
          currentTime += Math.max(0.05, nextSpacing); // Minimum 50ms between pulses
        }
      }
      // Normalize to fit within duration
      const totalTime = currentTime;
      if (totalTime > 0) {
        for (let i = 0; i < timings.length; i++) {
          timings[i] = (timings[i] / totalTime) * duration;
        }
      }
      break;
      
    default:
      // Fallback to even spacing
      for (let i = 0; i < count; i++) {
        timings.push((i / (count - 1)) * duration);
      }
  }
  
  console.log('Calculated burst timings:', timings);
  return timings;
}

// Fire a single pulse in the burst sequence
function fireBurstPulse(node, pulseIndex, totalPulses, deps) {
  const { triggerNodeEffect, findNodeById } = deps;
  const ap = node.audioParams;
  
  console.log(`Firing burst pulse ${pulseIndex + 1}/${totalPulses}`);
  
  // Create pulse with intensity and visual feedback
  const pulse = {
    intensity: ap.pulseIntensity || 1.0,
    color: node.color || null,
    particleMultiplier: 0.8,
    burstIndex: pulseIndex,
    burstTotal: totalPulses
  };

  // Visual feedback - brief flash
  node.animationState = 1;
  
  // Find connected output nodes and fire to them
  if (globalThis.connections) {
    globalThis.connections.forEach(conn => {
      const isSource = (conn.nodeAId === node.id && conn.nodeAHandle === 0);
      if (isSource) {
        const targetNode = findNodeById(conn.nodeBId);
        if (targetNode) {
          const delay = 0.1 + (pulseIndex * 0.05); // Slight stagger for visual effect
          triggerNodeEffect(targetNode, pulse, conn, delay);
        }
      }
    });
  }
}

// Cancel current burst sequence
function cancelCurrentBurst(node) {
  const burstState = node.burstState;
  
  if (burstState.timeouts) {
    burstState.timeouts.forEach(timeout => clearTimeout(timeout));
    burstState.timeouts = [];
  }
  
  burstState.isActive = false;
  console.log('Burst sequence cancelled');
}

// Build center instrument panel (if needed)
export function buildPulseBurstPanel(node, deps) {
  const { document } = deps;
  
  const section = document.createElement('div');
  section.classList.add('pulse-burst-panel');
  
  const title = document.createElement('div');
  title.textContent = 'Pulse Burst Configuration';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '8px';
  section.appendChild(title);
  
  const info = document.createElement('div');
  info.textContent = 'Takes one pulse input and outputs multiple timed pulses';
  info.style.fontSize = '12px';
  info.style.opacity = '0.7';
  info.style.marginBottom = '8px';
  section.appendChild(info);
  
  return section;
}