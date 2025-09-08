import * as Tone from 'tone';

// Master EQ configuration with sensible defaults
export const masterEQConfig = {
  // High-pass filter to remove sub rumble
  highpass: {
    frequency: 30,
    Q: 0.7,
    enabled: true
  },
  
  // Peaking EQ to clean up mud
  mudCut: {
    frequency: 375,
    gain: -1,
    Q: 1.0,
    enabled: true
  },
  
  // Peaking EQ for presence
  presence: {
    frequency: 3000,
    gain: 1,
    Q: 1.0,
    enabled: true
  },
  
  // High-shelf for air
  air: {
    frequency: 12000,
    gain: 1,
    Q: 0.7,
    enabled: true
  },
  
  // Limiter/safety stage
  limiter: {
    threshold: -1,
    ratio: 10,
    attack: 0.003,
    release: 0.1,
    enabled: true
  }
};

export function createMasterEQChain(audioContext, config = masterEQConfig) {
  const chain = {
    input: null,
    output: null,
    filters: {},
    limiter: null,
    dispose: null
  };
  
  try {
    // Create input/output nodes using Web Audio API to maintain compatibility
    chain.input = audioContext.createGain();
    chain.output = audioContext.createGain();
    
    // Set gains to unity
    chain.input.gain.value = 1.0;
    chain.output.gain.value = 1.0;
    
    let currentNode = chain.input;
    
    // High-pass filter
    if (config.highpass.enabled) {
      const hpf = audioContext.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = config.highpass.frequency;
      hpf.Q.value = config.highpass.Q;
      chain.filters.highpass = hpf;
      
      currentNode.connect(hpf);
      currentNode = hpf;
    }
    
    // Mud cut peaking EQ
    if (config.mudCut.enabled) {
      const mudEQ = audioContext.createBiquadFilter();
      mudEQ.type = 'peaking';
      mudEQ.frequency.value = config.mudCut.frequency;
      mudEQ.gain.value = config.mudCut.gain;
      mudEQ.Q.value = config.mudCut.Q;
      chain.filters.mudCut = mudEQ;
      
      currentNode.connect(mudEQ);
      currentNode = mudEQ;
    }
    
    // Presence peaking EQ
    if (config.presence.enabled) {
      const presenceEQ = audioContext.createBiquadFilter();
      presenceEQ.type = 'peaking';
      presenceEQ.frequency.value = config.presence.frequency;
      presenceEQ.gain.value = config.presence.gain;
      presenceEQ.Q.value = config.presence.Q;
      chain.filters.presence = presenceEQ;
      
      currentNode.connect(presenceEQ);
      currentNode = presenceEQ;
    }
    
    // Air high-shelf
    if (config.air.enabled) {
      const airEQ = audioContext.createBiquadFilter();
      airEQ.type = 'highshelf';
      airEQ.frequency.value = config.air.frequency;
      airEQ.gain.value = config.air.gain;
      airEQ.Q.value = config.air.Q;
      chain.filters.air = airEQ;
      
      currentNode.connect(airEQ);
      currentNode = airEQ;
    }
    
    // Limiter using Web Audio API (simpler and more reliable)
    if (config.limiter.enabled) {
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = config.limiter.threshold;
      compressor.ratio.value = config.limiter.ratio || 10;
      compressor.attack.value = config.limiter.attack || 0.003;
      compressor.release.value = config.limiter.release || 0.1;
      compressor.knee.value = 0; // Hard knee for limiting
      
      chain.limiter = {
        compressor: compressor
      };
      
      currentNode.connect(compressor);
      currentNode = compressor;
    }
    
    // Connect final node to output
    currentNode.connect(chain.output);
    
    // Dispose function to clean up resources
    chain.dispose = () => {
      try {
        Object.values(chain.filters).forEach(filter => {
          if (filter && typeof filter.disconnect === 'function') {
            filter.disconnect();
          }
        });
        
        if (chain.limiter && chain.limiter.compressor) {
          chain.limiter.compressor.disconnect();
        }
        
        if (chain.input) chain.input.disconnect();
        if (chain.output) chain.output.disconnect();
      } catch (err) {
        console.warn('Error disposing master EQ chain:', err);
      }
    };
    
  } catch (err) {
    console.error('Error creating master EQ chain:', err);
    // Fallback: just pass through
    chain.input.connect(chain.output);
  }
  
  return chain;
}

// Helper function to update EQ parameters
export function updateMasterEQChain(chain, config) {
  try {
    if (config.highpass && chain.filters.highpass) {
      if (config.highpass.frequency !== undefined) {
        chain.filters.highpass.frequency.value = config.highpass.frequency;
      }
      if (config.highpass.Q !== undefined) {
        chain.filters.highpass.Q.value = config.highpass.Q;
      }
    }
    
    if (config.mudCut && chain.filters.mudCut) {
      if (config.mudCut.frequency !== undefined) {
        chain.filters.mudCut.frequency.value = config.mudCut.frequency;
      }
      if (config.mudCut.gain !== undefined) {
        chain.filters.mudCut.gain.value = config.mudCut.gain;
      }
      if (config.mudCut.Q !== undefined) {
        chain.filters.mudCut.Q.value = config.mudCut.Q;
      }
    }
    
    if (config.presence && chain.filters.presence) {
      if (config.presence.frequency !== undefined) {
        chain.filters.presence.frequency.value = config.presence.frequency;
      }
      if (config.presence.gain !== undefined) {
        chain.filters.presence.gain.value = config.presence.gain;
      }
      if (config.presence.Q !== undefined) {
        chain.filters.presence.Q.value = config.presence.Q;
      }
    }
    
    if (config.air && chain.filters.air) {
      if (config.air.frequency !== undefined) {
        chain.filters.air.frequency.value = config.air.frequency;
      }
      if (config.air.gain !== undefined) {
        chain.filters.air.gain.value = config.air.gain;
      }
      if (config.air.Q !== undefined) {
        chain.filters.air.Q.value = config.air.Q;
      }
    }
    
    if (config.limiter && chain.limiter && chain.limiter.compressor) {
      if (config.limiter.threshold !== undefined) {
        chain.limiter.compressor.threshold.value = config.limiter.threshold;
      }
      if (config.limiter.ratio !== undefined) {
        chain.limiter.compressor.ratio.value = config.limiter.ratio;
      }
      if (config.limiter.attack !== undefined) {
        chain.limiter.compressor.attack.value = config.limiter.attack;
      }
      if (config.limiter.release !== undefined) {
        chain.limiter.compressor.release.value = config.limiter.release;
      }
    }
    
  } catch (err) {
    console.warn('Error updating master EQ chain:', err);
  }
}