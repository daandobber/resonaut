import { afterEach, expect, it, vi } from 'vitest';
import { capturePlaybackTuning, getPlaybackTuning, needsNewTuning, retainAudioTail, stopAudioTails, getAudioTailCount, disposeOwnedAudioGraph } from '../utils/playbackTuning.js';
afterEach(()=>vi.useRealTimers());

it('keeps sounding tuning independent of edited notes and scale',()=>{
  const graph={}, params={pitch:220,scaleIndex:0}, scale={notes:[0,2,4,5,7,9,11]};
  capturePlaybackTuning(graph,params,scale,0,0);
  params.pitch=440;scale.notes[1]=1;
  expect(getPlaybackTuning(graph).pitch).toBe(220);
  expect(getPlaybackTuning(graph).scale.notes[1]).toBe(2);
  expect(needsNewTuning(graph,params,scale,0,12)).toBe(true);
});

it('retains release tails on the audio clock and cleans them on project reset',()=>{
  vi.useFakeTimers();
  const owner={},graph={},clock={currentTime:100},cleanup=vi.fn();
  retainAudioTail(owner,graph,2,clock,cleanup);
  vi.advanceTimersByTime(3000);
  expect(cleanup).not.toHaveBeenCalled();
  clock.currentTime=102.1;vi.advanceTimersByTime(2000);
  expect(cleanup).toHaveBeenCalledExactlyOnceWith(graph);
  retainAudioTail(owner,{},20,clock,cleanup);
  stopAudioTails(owner);stopAudioTails(owner);
  expect(cleanup).toHaveBeenCalledTimes(2);
});

it('disposes all pooled oscillators and sends once without following model references',()=>{
  const osc={stop:vi.fn(),dispose:vi.fn()}, send={disconnect:vi.fn()}, model={dispose:vi.fn()};
  disposeOwnedAudioGraph({oscillator1:osc,voices:[{operators:{1:{osc}}}],mistSendGain:send,nodeRef:model});
  expect(osc.dispose).toHaveBeenCalledOnce();
  expect(send.disconnect).toHaveBeenCalledOnce();
  expect(model.dispose).not.toHaveBeenCalled();
});

it('fades the oldest tail at the polyphony limit instead of growing without bound',()=>{
  vi.useFakeTimers();
  const owner={},clock={currentTime:5},cleanup=vi.fn();
  const gain={cancelAndHoldAtTime:vi.fn(),linearRampToValueAtTime:vi.fn()};
  const first={gainNode:{gain}};
  retainAudioTail(owner,first,20,clock,cleanup);
  for(let i=0;i<8;i++)retainAudioTail(owner,{},20,clock,cleanup);
  expect(gain.linearRampToValueAtTime).toHaveBeenCalledWith(0,5.02);
  expect(cleanup).not.toHaveBeenCalled();
  clock.currentTime=5.1;vi.advanceTimersByTime(60);
  expect(cleanup).toHaveBeenCalledExactlyOnceWith(first);
  stopAudioTails(owner);
});

it('does not lower new notes for silent graphs waiting for cleanup',()=>{
  vi.useFakeTimers();
  const owner={},graph={};
  capturePlaybackTuning(graph,{pitch:220,scaleIndex:0},{notes:[0,2,4]},0,0);
  getPlaybackTuning(graph).audibleUntil=2;
  retainAudioTail(owner,graph,10,{currentTime:0},vi.fn());
  expect(getAudioTailCount(owner,1)).toBe(1);
  expect(getAudioTailCount(owner,3)).toBe(0);
  stopAudioTails(owner);
});
