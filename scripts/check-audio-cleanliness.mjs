import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `\nwindow.__cleanAudio = {
    solo(kind='tone') {
      handleNewWorkspace(true); soundEngineToAdd=kind==='sampler' ? null : kind; noteIndexToAdd=0;
      return addNode(650,400,kind==='resonauter' ? RESONAUTER_TYPE : 'sound',
        kind==='sampler' ? 'sampler_piano' : kind==='tonefm' ? fmSynthPresets[0].type : 'sine').id;
    },
    ensemble() { handleNewWorkspace(true); createSymphioseEnsemble(); },
    trigger(id, degree=null) { triggerNodeEffect(findNodeById(id), {intensity:1, ...(degree===null ? {} : {note:{degree,mode:'absolute'}})}); },
    play() { if (!isPlaying) togglePlayPause(); },
    pause() { if (isPlaying) togglePlayPause(); },
    get transientCount() { return nodes.reduce((count,n)=>count+(n.audioNodes?.transientVoices?.size || 0),0); },
    async measure(ms) {
      const analyser = audioContext.createAnalyser(); analyser.fftSize=2048;
      const sources = [window.kaosPadDryGain,window.kaosPadWetGain,reverbReturnAnalyser,delayReturnAnalyser];
      sources.forEach(source=>source.connect(analyser));
      let peak=0, over=0, samples=0, sum=0, jumps=0;
      const data=new Float32Array(analyser.fftSize);
      const timer=setInterval(()=> {
        analyser.getFloatTimeDomainData(data);
        for(let i=0;i<data.length;i++) { const value=data[i]; peak=Math.max(peak,Math.abs(value)); if(Math.abs(value)>1) over++; if(i>0 && Math.abs(value-data[i-1])>0.2) jumps++; sum+=value*value; samples++; }
      },20);
      await new Promise(resolve=>setTimeout(resolve,ms)); clearInterval(timer);
      sources.forEach(source=>source.disconnect(analyser)); analyser.disconnect();
      return {peak,over,jumps,rms:Math.sqrt(sum/samples),samples};
    },
    async mutations(ms) {
      let changes=0; const observer=new MutationObserver(records=>{changes+=records.length;});
      observer.observe(document.getElementById('toolbar'),{childList:true,subtree:true});
      await new Promise(resolve=>setTimeout(resolve,ms));observer.disconnect();return changes;
    }
  };` });
});
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(() => window.__cleanAudio && window.audioContext?.state === 'running');
  await page.waitForFunction(() => !document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({ state: 'hidden' });
  const id = await page.evaluate(() => window.__cleanAudio.solo());
  const solo = await page.evaluate(async id => {
    const timer = setInterval(()=>window.__cleanAudio.trigger(id), 300);
    const result=await window.__cleanAudio.measure(1800); clearInterval(timer); return result;
  }, id);
  console.log('Solo', solo);
  assert.ok(solo.peak > 0.01 && solo.over === 0 && solo.jumps === 0, 'clean repeated solo notes');
  const churn = await page.evaluate(() => window.__cleanAudio.mutations(1000));
  console.log('Idle toolbar DOM mutations per second', churn);
  assert.equal(churn, 0, 'icon injection settles without rebuilding itself');
  for (const kind of ['tonefm', 'sampler', 'resonauter']) {
    const result = await page.evaluate(async kind => {
      const id=window.__cleanAudio.solo(kind);
      const timer=setInterval(()=>window.__cleanAudio.trigger(id),400);
      const stats=await window.__cleanAudio.measure(1800);clearInterval(timer);return stats;
    },kind);
    console.log(kind, result);
    assert.ok(result.rms > 0.001, `${kind} produces audio`);
    assert.equal(result.over, 0, `${kind} retains headroom with one orb`);
  }
  for (const kind of ['tone','tonefm']) {
    const result=await page.evaluate(async kind=>{
      const id=window.__cleanAudio.solo(kind);let step=0;
      const timer=setInterval(()=>window.__cleanAudio.trigger(id,[0,2,4,7][step++%4]),180);
      const stats=await window.__cleanAudio.measure(2400);clearInterval(timer);return stats;
    },kind);
    console.log(kind,'changing notes with overlapping tails',result);
    assert.ok(result.rms>0.001,`${kind} note sequence produces audio`);
    assert.equal(result.over,0,`${kind} transposed tails retain headroom`);
  }
  await page.evaluate(() => { window.__cleanAudio.ensemble(); window.__cleanAudio.play(); });
  const ensemble = await page.evaluate(() => window.__cleanAudio.measure(6000));
  console.log('Ensemble', ensemble);
  assert.ok(ensemble.peak > 0.01 && ensemble.peak < 0.95 && ensemble.over === 0, 'ensemble retains mixing headroom');
  await page.evaluate(() => window.__cleanAudio.pause());
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(() => window.__cleanAudio.transientCount), 0, 'finished synth voices are disposed promptly');
  const continuity = await page.evaluate(async () => {
    const { holdAudioParam } = await import('/utils/audioLifecycle.js');
    const ctx = new OfflineAudioContext(1, 24000, 48000);
    const osc = ctx.createOscillator(); osc.frequency.value=220;
    const gain=ctx.createGain(); gain.gain.value=0;
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0,0);gain.gain.linearRampToValueAtTime(0.7,0.01);
    gain.gain.setValueAtTime(0.7,0.05);gain.gain.linearRampToValueAtTime(0.3,0.2);
    holdAudioParam(gain.gain,0.101);gain.gain.linearRampToValueAtTime(0.7,0.106);
    osc.start(0); const buffer=await ctx.startRendering();const data=buffer.getChannelData(0);
    let jump=0;for(let i=4750;i<5300;i++)jump=Math.max(jump,Math.abs(data[i]-data[i-1]));return jump;
  });
  assert.ok(continuity < 0.03, `retrigger remains continuous (${continuity})`);
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
