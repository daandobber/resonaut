import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/main\.js(?:\?.*)?$/, async route => {
  const response = await route.fetch();
  await route.fulfill({ response, body: await response.text() + `
    window.__tuning = {
      setup(engine, type='sound', orbitones=true) {
        handleNewWorkspace(true); globalTransposeOffset=0; soundEngineToAdd=engine; noteIndexToAdd=0;
        const node=addNode(600,400,type,engine==='tonefm' ? fmSynthPresets[0].type : 'sine');
        Object.assign(node.audioParams, {ampEnvRelease:2,carrierEnvRelease:2,ampEnvSustain:0.7,carrierEnvSustain:0.7,orbitonesEnabled:orbitones,orbitoneCount:2,orbitoneIntervals:[2,4]});
        stopNodeAudio(node);node.audioNodes=createAudioNodesForNode(node);updateNodeAudioParams(node);
        this.node=node; this.old=node.audioNodes;
        triggerNodeEffect(node,{intensity:0.3});
      },
      frequencies(graph=this.old) {
        const list=[graph.oscillator1,graph.oscillator2,graph.osc1,...(graph.orbitoneOscillators||[]),...(graph.oscillators||[]).map(o=>o.osc||o),...(graph.carriers||[]),graph.osc,graph.carrier];
        return list.filter(o=>o?.frequency).map(o=>o.frequency.value);
      },
      transpose() {globalTransposeOffset+=12;updateAllPitchesAndUI();},
      editFilter() {this.node.audioParams.filterCutoff=2000;updateNodeAudioParams(this.node);},
      next() {triggerNodeEffect(this.node,{intensity:0.3});},
      loom() {propagateTrigger(this.node,0,++currentGlobalPulseId,-1,16,{type:'note',data:{intensity:0.3,note:{degree:5,mode:'relative'}}});},
      get changed() {return this.old!==this.node.audioNodes;},
      get oldGain() {const g=this.old.envelopeGate||this.old.mix||this.old.gainNode||this.old.mainGain;return g?.gain?.value;},
      async oldRms() {
        const analyser=audioContext.createAnalyser();analyser.fftSize=2048;
        const output=this.old.gainNode||this.old.mainGain||this.old.mix;
        output.connect(analyser);await new Promise(resolve=>setTimeout(resolve,60));
        const data=new Float32Array(2048);analyser.getFloatTimeDomainData(data);
        output.disconnect(analyser);analyser.disconnect();
        return Math.sqrt(data.reduce((sum,x)=>sum+x*x,0)/data.length);
      },
      get disposed() {return this.old.oscillator1?.disposed;},
      cleanup() {handleNewWorkspace(true);},
    };
  ` });
});
try {
  await page.goto(process.env.RESONAUT_URL || 'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(()=>window.__tuning&&window.audioContext?.state==='running'&&!document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({state:'hidden'});
  for (const [engine,type] of [['tone','sound'],['pulse','sound'],['tonefm','sound'],['tone','nebula'],['tone','alien_orb'],['tone','fm_drone'],['tone','arvo_drone']]) {
    await page.evaluate(([engine,type])=>window.__tuning.setup(engine,type),[engine,type]);
    await page.waitForTimeout(250);
    const before=await page.evaluate(()=>window.__tuning.frequencies());
    assert.ok(before.length,`${engine}/${type} exposes actual oscillators`);
    await page.evaluate(()=>{window.__tuning.transpose();window.__tuning.editFilter();});
    await page.waitForTimeout(250);
    const after=await page.evaluate(()=>window.__tuning.frequencies());
    for(let i=0;i<before.length;i++)assert.ok(Math.abs(before[i]-after[i])<0.1,`${engine}/${type} old frequency ${before[i]} became ${after[i]} during transpose`);
    await page.evaluate(()=>window.__tuning.next());
    await page.waitForTimeout(120);
    assert.equal(await page.evaluate(()=>window.__tuning.changed),true,`${engine}/${type} next note uses a separate voice`);
    const ringing=await page.evaluate(()=>window.__tuning.frequencies());
    for(let i=0;i<before.length;i++)assert.ok(Math.abs(before[i]-ringing[i])<0.1,`${engine}/${type} old tail was retuned by next note`);
    const current=await page.evaluate(()=>window.__tuning.frequencies(window.__tuning.node.audioNodes));
    assert.ok(Math.abs(current[0]-2*before[0])<1,`${engine}/${type} new note starts transposed: ${current[0]} vs ${before[0]}`);
    if(engine==='tone'&&type==='sound')assert.ok(await page.evaluate(()=>window.__tuning.oldGain)>0.001,'analog old tail remains audible');
    if(type==='sound'&&engine!=='pulse')assert.ok(await page.evaluate(()=>window.__tuning.oldRms())>0.0001,`${engine} old tail still produces audio after next note`);
    await page.evaluate(()=>{window.__tuning.old=window.__tuning.node.audioNodes;});
    const prior=await page.evaluate(()=>window.__tuning.frequencies());
    await page.evaluate(()=>window.__tuning.loom());
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>window.__tuning.changed),true,`${engine}/${type} an incoming note pulse starts the new tuning`);
    const loomTail=await page.evaluate(()=>window.__tuning.frequencies());
    for(let i=0;i<prior.length;i++)assert.ok(Math.abs(prior[i]-loomTail[i])<0.1,`${engine}/${type} Note Loom retuned an existing voice`);
    console.log(engine,type,'old voice fixed, new voice transposed, Note Loom tail preserved');
    await page.evaluate(()=>window.__tuning.cleanup());
    if(type==='sound')assert.equal(await page.evaluate(()=>window.__tuning.disposed),true,'new project disposes retired voices');
  }
  const pool=await page.evaluate(()=>{
    const t=window.__tuning;t.setup('tonefm','sound',false);
    const graph=t.node.audioNodes, first=graph.voices[0], initial=first.getCurrentFreq();
    t.transpose();t.next();
    return {sameGraph:graph===t.node.audioNodes,initial,first:first.getCurrentFreq(),second:graph.voices[1].getCurrentFreq(),releasing:first.isActive()};
  });
  assert.equal(pool.sameGraph,true,'FM reuses its voice pool instead of rebuilding on every note');
  assert.equal(pool.first,pool.initial,'pooled old FM voice keeps its pitch');
  assert.equal(pool.second,pool.initial*2,'next pooled FM voice uses the new pitch');
  assert.equal(pool.releasing,true,'scheduled FM release does not free the voice early');
  await page.evaluate(()=>window.__tuning.cleanup());
  assert.deepEqual(errors,[]);
} finally {await browser.close();}
