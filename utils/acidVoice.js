import { holdAudioParam } from './audioLifecycle.js';

// A dedicated monophonic voice: slides are intentional here, never imposed on
// the release tails of other instruments receiving this sequencer's notes.
export function createAcidVoice(context, destination) {
  const oscillator=context.createOscillator(), filter=context.createBiquadFilter();
  const drive=context.createWaveShaper();
  drive.curve=Float32Array.from({length:2048},(_,i)=>Math.tanh((i/2047*2-1)*1.7)/Math.tanh(1.7));drive.oversample='2x';
  const envelope=context.createGain(), gainNode=context.createGain();
  oscillator.type='sawtooth';filter.type='lowpass';envelope.gain.value=0;gainNode.gain.value=.22;
  oscillator.connect(filter);filter.connect(drive);drive.connect(envelope);envelope.connect(gainNode);gainNode.connect(destination);oscillator.start();
  let lastTime=-Infinity;
  return {gainNode,oscillator,filter,envelope,
    trigger(frequency, params, step, intensity, duration) {
      const now=context.currentTime, slide=!!step.slide && now-lastTime<Math.max(.4,duration*1.5);
      lastTime=now;
      const cutoff=Math.max(60,Math.min(12000,params.cutoff||450));
      const peak=Math.min(context.sampleRate*.4,cutoff*Math.pow(2,(params.envDepth??3)*(step.accent?1.25:1)));
      oscillator.type=params.acidWave==='square'?'square':'sawtooth';
      holdAudioParam(oscillator.frequency,now);
      if(slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,frequency),now+(params.slideMs??70)/1000);
      else oscillator.frequency.setValueAtTime(Math.max(20,frequency),now);
      filter.Q.setTargetAtTime(Math.max(.1,Math.min(14,params.resonance??7)),now,.012);
      holdAudioParam(filter.frequency,now);
      if(!slide) filter.frequency.linearRampToValueAtTime(peak,now+.008);
      filter.frequency.setTargetAtTime(cutoff,now+.008,Math.max(.02,(params.acidDecay??.2)/3));
      holdAudioParam(envelope.gain,now);
      const level=Math.min(.8,intensity*(step.accent?1.2:.8));
      envelope.gain.linearRampToValueAtTime(level,now+(slide?.025:.004));
      envelope.gain.setTargetAtTime(0,now+Math.max(.025,duration*(params.gate??.8)),.018);
    },
    rest(){lastTime=-Infinity;holdAudioParam(envelope.gain,context.currentTime);envelope.gain.setTargetAtTime(0,context.currentTime,.012);},
    dispose(){try{oscillator.stop();}catch{}[oscillator,filter,drive,envelope,gainNode].forEach(n=>n.disconnect());},
  };
}
