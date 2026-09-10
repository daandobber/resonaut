import {it,expect,vi} from 'vitest';
import {createAcidVoice} from '../utils/acidVoice.js';
import {patternDefaults,advancePattern} from '../utils/patternOrbs.js';
function fixture(){
  const param=()=>({value:440,cancelAndHoldAtTime:vi.fn(),setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),setTargetAtTime:vi.fn()});
  const resource=()=>({connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),frequency:param(),gain:param(),Q:param()});
  const resources=[],make=()=>{const r=resource();resources.push(r);return r;};
  const context={currentTime:0,sampleRate:48000,createOscillator:make,createBiquadFilter:make,createGain:make,createWaveShaper:make};
  return {context,resources,voice:createAcidVoice(context,{})};
}
it('slides only explicitly selected steps and breaks legato after a rest',()=>{
  const {voice,context}=fixture(),params=patternDefaults('acid_mycelium');
  voice.trigger(65,params,{slide:true},.7,.125);
  expect(voice.oscillator.frequency.exponentialRampToValueAtTime).not.toHaveBeenCalled();
  context.currentTime=.125;voice.trigger(130,params,{slide:true},.7,.125);
  expect(voice.oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(130,.195);
  voice.rest();context.currentTime=.25;voice.trigger(98,params,{slide:true},.7,.125);
  expect(voice.oscillator.frequency.setValueAtTime).toHaveBeenLastCalledWith(98,.25);
});
it('accents open the filter further, keeps output bounded and disposes every audio resource',()=>{
  const {voice,context,resources}=fixture(),params=patternDefaults('acid_mycelium');
  voice.trigger(65,params,{},.7,.125);const normal=voice.filter.frequency.linearRampToValueAtTime.mock.calls.at(-1)[0];
  context.currentTime=.125;voice.trigger(65,params,{accent:true},.7,.125);
  expect(voice.filter.frequency.linearRampToValueAtTime.mock.calls.at(-1)[0]).toBeGreaterThan(normal);
  const drive=resources.find(r=>r.curve);expect(Math.max(...drive.curve)).toBeLessThanOrEqual(1);
  voice.dispose();expect(voice.oscillator.stop).toHaveBeenCalledOnce();
  resources.forEach(r=>expect(r.disconnect).toHaveBeenCalledOnce());
});
it('acid patterns preserve editable rests and send ordinary pitched notes to flowers',()=>{
  const node={type:'acid_mycelium',audioParams:patternDefaults('acid_mycelium')};
  const steps=Array.from({length:8},()=>advancePattern(node,{chord:{intervals:[0,2,4]}}));
  expect(steps[0].note.degree).toBe(-7);expect(steps[0].chord).toBeUndefined();expect(steps[6]).toBeNull();
});
