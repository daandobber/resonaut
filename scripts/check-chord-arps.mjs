import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.route(/\/main\.js(?:\?.*)?$/,async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:await response.text()+`
    const originalChordCreate=createAudioNodesForNode;
    const chordGraphs=[];
    createAudioNodesForNode=function(n){const g=originalChordCreate(n);if(g)chordGraphs.push(g);return g;};
    window.__chords={
      setup(engine='tone') {
        handleNewWorkspace(true); soundEngineToAdd=engine==='sampler'?null:engine;noteIndexToAdd=0;
        this.seq=addNode(550,400,'chord_garden');
        this.sound=addNode(850,400,'sound',engine==='sampler'?'sampler_piano':engine==='tonefm'?fmSynthPresets[0].type:'sine');
        chordGraphs.length=0;
      },
      hit(strum=0){this.seq.audioParams.strumMs=strum;triggerNodeEffect(this.sound,advancePattern(this.seq,{},currentScale.notes.length));},
      get graphs(){return chordGraphs.map(g=>({pitch:getPlaybackTuning(g)?.pitch,index:getPlaybackTuning(g)?.scaleIndex}));},
      get index(){return this.sound.audioParams.scaleIndex;},
      async levels(){
        const analysers=chordGraphs.map(g=>{const a=audioContext.createAnalyser();a.fftSize=2048;(g.gainNode||g.mainGain||g.mix).connect(a);return a;});
        await new Promise(r=>setTimeout(r,220));
        return analysers.map(a=>{const d=new Float32Array(2048);a.getFloatTimeDomainData(d);a.disconnect();return Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length);});
      },
      cleanup(){handleNewWorkspace(true);},
      stop(){stopNodeAudio(this.sound);},
      open(type){handleNewWorkspace(true);const n=addNode(660,380,type);n.audioParams.advanceOnPulse=true;setActiveTool('edit');selectedElements.clear();selectedElements.add({type:'node',id:n.id});populateEditPanel();this.seq=n;},
      save(){saveState();return getLatestState();},load:loadState,
      followRoot(){this.seq.audioParams.advanceOnPulse=false;propagateTrigger(this.seq,0,++currentGlobalPulseId,999,16,{type:'note',data:{note:{degree:5,mode:'absolute'}}});},
      get incomingRoot(){return patternState(this.seq).root;},
      get restored(){return nodes.find(n=>isPatternOrb(n.type))?.audioParams;},
    };
  `});
});
try {
  await page.goto(process.env.RESONAUT_URL||'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(()=>window.__chords&&window.audioContext?.state==='running'&&!document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({state:'hidden'});
  for(const engine of ['tone','pulse','tonefm','tonepluck','etheraura','sampler']) {
    await page.evaluate(e=>window.__chords.setup(e),engine);
    await page.evaluate(()=>window.__chords.hit());
    const graphs=await page.evaluate(()=>window.__chords.graphs);
    assert.equal(graphs.length,3,engine+' has three independent voices');
    assert.equal(new Set(graphs.map(g=>g.pitch)).size,3);
    assert.equal(await page.evaluate(()=>window.__chords.index),graphs[0].index);
    const levels=await page.evaluate(()=>window.__chords.levels());
    assert.ok(levels.every(x=>x>0.00001),engine+' all chord voices audible: '+levels);
    await page.evaluate(()=>window.__chords.hit());
    assert.deepEqual((await page.evaluate(()=>window.__chords.graphs)).slice(0,3),graphs);
    console.log(engine,{graphs,levels});
  }
  for(const action of ['cleanup','stop']) {
    await page.evaluate(()=>{window.__chords.setup();window.__chords.hit(150);});
    await page.evaluate(action=>window.__chords[action](),action);
    await page.waitForTimeout(500);
    assert.equal((await page.evaluate(()=>window.__chords.graphs)).length,1,action+' cancels remaining strum voices');
  }
  for(const [type,button] of [['chord_garden','addChordGardenBtn'],['arp_orbit','addArpOrbitBtn']]) {
    assert.equal(await page.locator('#toolbar-pulsars #'+button).count(),1);
    await page.evaluate(t=>window.__chords.open(t),type);
    const editor=page.locator('.pattern-orb-editor');await editor.waitFor({state:'visible'});
    assert.equal(await editor.locator('details').count(),0);
    assert.equal(await editor.locator('[data-step-param="degree"]').count(),4);
    const input=editor.locator('[data-step-index="0"][data-step-param="degree"]');
    await input.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},'3');await input.press('Tab');
    const state=await page.evaluate(()=>window.__chords.save());
    await page.screenshot({path:path.join(os.tmpdir(),'resonaut-'+type+'.png')});
    await page.evaluate(state=>window.__chords.load(state),state);
    assert.equal(await page.evaluate(()=>window.__chords.restored.steps[0].degree),3);
  }
  await page.evaluate(()=>{window.__chords.open('arp_orbit');window.__chords.followRoot();});
  await page.waitForFunction(()=>window.__chords.incomingRoot?.degree===5);
  await page.evaluate(()=>window.__chords.cleanup());
  assert.deepEqual(errors,[]);console.log('Chord voices, strum cleanup, editors, toolbar and save/load passed.');
} finally {await browser.close();}

