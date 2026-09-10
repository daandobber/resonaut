import { BitCrusherDSP, GranularDSP } from './dsp.worklet.js';

const preparations = new WeakMap();
const ready = new WeakSet();

export function getSharedAudioContext() {
  if (!window.audioContext || window.audioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    window.audioContext = new AudioContextClass({ latencyHint: 'balanced' });
  }
  return window.audioContext;
}

export function prepareRealtimeAudio(context) {
  if (preparations.has(context)) return preparations.get(context);
  const promise = context.audioWorklet
    ? context.audioWorklet.addModule(new URL('./dsp.worklet.js', import.meta.url)).then(() => {
      ready.add(context); return true;
    }).catch(error => { console.warn('Audio worklet unavailable; using buffered audio fallback.', error); return false; })
    : Promise.resolve(false);
  preparations.set(context, promise);
  return promise;
}

export function createRealtimeDSP(context, options) {
  if (ready.has(context)) {
    const node = new AudioWorkletNode(context, 'resonaut-dsp', {
      numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: options,
    });
    node.setDSPParams = params => node.port.postMessage(params);
    return node;
  }
  // Older browsers retain working effects, with enough buffer for ordinary UI work.
  const node = context.createScriptProcessor(2048, 2, 2);
  const dsp = options.kind === 'granular'
    ? new GranularDSP(context.sampleRate, options.params) : new BitCrusherDSP(options);
  node.setDSPParams = params => dsp.setParams?.(params);
  node.onaudioprocess = event => dsp.process(event.inputBuffer.getChannelData(0),
    event.inputBuffer.numberOfChannels > 1 ? event.inputBuffer.getChannelData(1) : undefined,
    event.outputBuffer.getChannelData(0), event.outputBuffer.getChannelData(1));
  return node;
}
