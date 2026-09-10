import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/main\.js(?:\?.*)?$/,async route=>{
  const response=await route.fetch();
  const source=await response.text();
  const patternModule=source.match(/from\s+["']([^"']*\/utils\/patternOrbs\.js[^"']*)["']/)[1];
  await route.fulfill({response,body:source+`\n
  const patternDebug = await import(${JSON.stringify(patternModule)});
  const originalPatternTrigger = triggerNodeEffect;
  window.__patterns={events:[],
    fixture(type, clockType='pulsar_standard', viaGate=false) {
      handleNewWorkspace(true); soundEngineToAdd='tone';
      const source=addNode(500,400,clockType); source.isEnabled=clockType!=='pulsar_standard'; source.audioParams.advanceOnPulse=true;
      const seq=addNode(720,400,type); seq.audioParams.advanceOnPulse=true;
      const sound=addNode(960,400,'sound','sine');
      const gate=viaGate ? addNode(840,400,'gate') : null;
      if(gate) gate.audioParams.gatePulseCount=2;
      setActiveTool('connect');
      const rect=canvas.getBoundingClientRect();
      const point=n=>{const p=getScreenCoords(n.x,n.y);return{x:p.x+rect.left,y:p.y+rect.top};};
      window.__patterns.events=[]; return (gate ? [source,seq,gate,sound] : [source,seq,sound]).map(point);
    },
    pulse(){propagateTrigger(nodes[0],0,++currentGlobalPulseId,-1,16,{type:'trigger',data:{intensity:1}});},
    edit(){setActiveTool('edit');selectedElements.clear();selectedElements.add({type:'node',id:nodes[1].id});populateEditPanel();},
    editInstrument(){setActiveTool('edit');selectedElements.clear();selectedElements.add({type:'node',id:nodes[2].id});populateEditPanel();},
    note(degree){triggerNodeEffect(nodes[2],{intensity:0.3,note:{degree,mode:'absolute'}});},
    get noteLabel(){return getNoteNameFromScaleIndex(currentScale,nodes[2].audioParams.scaleIndex,NOTE_NAMES,currentRootNote,globalTransposeOffset);},
    get step(){return patternDebug.patternState(nodes[1]).step;},
    get params(){return nodes[1].audioParams;},
    get playing(){return isPlaying;},
    get visualNotes(){return activePulses.filter(p=>p.type==='note').map(p=>p.note);},
    save(){saveState();return getLatestState();}, load:loadState,
    get count(){return nodes.length;},
    rms(){const data=new Float32Array(masterAnalyser.fftSize);masterAnalyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,n)=>sum+n*n,0)/data.length);},
  };
  triggerNodeEffect=function(n,p,...rest){if(n.type==='sound'&&!n.isChordVoice)window.__patterns.events.push({...p,resolvedIndex:resolvePulseScaleIndex(p,n.audioParams.scaleIndex),instrumentIndex:n.audioParams.scaleIndex});return originalPatternTrigger(n,p,...rest);};
  `});
});
async function connect(points,reverse) {
  for(let a=0;a<points.length-1;a++) {
    const b=a+1;
    const start=points[reverse?b:a],end=points[reverse?a:b];
    await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up();
  }
}
try {
  await page.goto(process.env.RESONAUT_URL||'http://127.0.0.1:5000/');
  await page.locator('#startEngineBtn').click();
  await page.waitForFunction(()=>window.__patterns&&window.audioContext?.state==='running'&&!document.getElementById('startEngineBtn').disabled);
  await page.locator('#loadingIndicator').waitFor({state:'hidden'});
  for(const type of ['chord_garden','arp_orbit','orbit_rhythm','note_loom']) for(const reverse of [false,true]) {
    const points=await page.evaluate(type=>window.__patterns.fixture(type),type);
    await connect(points,reverse);
    await page.evaluate(()=>window.__patterns.pulse());
    await page.waitForFunction(()=>window.__patterns.step===0);
    await page.waitForFunction(()=>window.__patterns.events.length===1);
    if(type==='note_loom')assert.equal(await page.evaluate(()=>window.__patterns.events[0].note.degree),0);
  }
  await page.evaluate(()=>window.__patterns.edit());
  await page.locator('[data-step-index="0"][data-step-param="degree"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},'5');
  await page.locator('[data-step-index="0"][data-step-param="degree"]').dispatchEvent('change');
  await page.locator('[data-step-index="0"][data-step-param="velocity"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},'40');
  await page.locator('[data-step-index="0"][data-step-param="velocity"]').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>window.__patterns.params.steps[0].degree),5);
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  await page.evaluate(()=>window.__patterns.events=[]);
  await page.getByRole('button',{name:'Step',exact:true}).click();
  await page.waitForFunction(()=>window.__patterns.visualNotes.some(n=>n.degree===5));
  await page.waitForFunction(()=>window.__patterns.events.some(e=>e.note?.degree===5));
  assert.ok((await page.evaluate(()=>window.__patterns.events.find(e=>e.note?.degree===5).intensity))<=0.28);
  const changedPitch=await page.evaluate(()=>({index:window.nodes[2].audioParams.scaleIndex,pitch:window.nodes[2].audioParams.pitch,reference:window.nodes[2].audioParams.notePulseReference}));
  assert.equal(changedPitch.index,changedPitch.reference.base+5);
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  await page.getByRole('button',{name:'Step',exact:true}).click();
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>window.nodes[2].audioParams.scaleIndex),changedPitch.index,'relative pattern does not accumulate pitch');
  const saved=await page.evaluate(()=>window.__patterns.save());
  await page.evaluate(saved=>window.__patterns.load(saved),saved);
  assert.equal(await page.evaluate(()=>window.__patterns.params.steps[0].degree),5);
  assert.equal(await page.evaluate(()=>window.nodes[2].audioParams.scaleIndex),changedPitch.index,'actual receiving note is saved');
  await page.evaluate(()=>window.__patterns.edit());
  await page.locator('[data-pattern-param="advanceOnPulse"]').selectOption('false',{force:true});
  if (!await page.evaluate(()=>window.__patterns.playing)) await page.locator('#app-menu-play-pause-btn').click();
  await page.waitForFunction(()=>window.__patterns.playing&&window.__patterns.step>=2);
  await page.waitForFunction(()=>window.__patterns.rms()>0.001);
  await page.locator('#app-menu-play-pause-btn').click();
  await page.waitForFunction(()=>!window.__patterns.playing);
  const stopped=await page.evaluate(()=>window.__patterns.step);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__patterns.step),stopped);
  await page.screenshot({path:process.env.TEMP+'/resonaut-note-loom.png'});
  const chain=await page.evaluate(()=>window.__patterns.fixture('note_loom','orbit_rhythm'));
  await connect(chain,false);
  await page.evaluate(()=>window.__patterns.pulse());
  await page.waitForFunction(()=>window.__patterns.events.length>0);
  assert.equal(await page.evaluate(()=>window.__patterns.events[0].note.degree),0);
  const gateChain=await page.evaluate(()=>window.__patterns.fixture('note_loom','pulsar_standard',true));
  await connect(gateChain,true);
  await page.evaluate(()=>window.__patterns.edit());
  await page.locator('[data-pattern-param="noteMode"]').selectOption('absolute',{force:true});
  await page.evaluate(()=>window.__patterns.pulse());
  await page.waitForFunction(()=>window.__patterns.step===0);
  await page.evaluate(()=>window.__patterns.pulse());
  await page.waitForFunction(()=>window.__patterns.events.length===1);
  const gated=await page.evaluate(()=>window.__patterns.events[0]);
  assert.deepEqual(gated.note,{degree:2,mode:'absolute'});
  assert.equal(gated.resolvedIndex,2);
  assert.equal(await page.evaluate(()=>window.nodes[2].audioParams.scaleIndex),2,'gate passes a real retuning note');
  const tunedFrequency=await page.evaluate(()=>window.nodes[2].audioParams.pitch);
  await page.evaluate(()=>window.nodes[2].triggerFromLife(0.4,{}));
  assert.equal(await page.evaluate(()=>window.nodes[2].audioParams.pitch),tunedFrequency,'ordinary triggers retain the new tuning');
  await page.evaluate(()=>window.__patterns.editInstrument());
  await page.evaluate(()=>window.__patterns.note(7));
  assert.equal(await page.locator('#hexSelectedNoteLabel').textContent(),await page.evaluate(()=>window.__patterns.noteLabel),'note selector follows incoming notes');
  assert.equal(await page.evaluate(()=>window.nodes[2].audioParams.scaleIndex),7);
  await page.evaluate(()=>window.handleNewWorkspace(true));
  await page.locator('#addPulsarBtn').click();
  await page.locator('button[data-type="orbit_rhythm"]').click();
  await page.mouse.click(650,450);
  assert.equal(await page.evaluate(()=>window.nodes[0]?.type),'orbit_rhythm');
  await page.evaluate(()=>window.handleNewWorkspace(true));
  await page.locator('#workspaceSearchBtn').click();
  await page.locator('#workspaceCommandInput').fill('Orbit Rhythm');
  await page.locator('#workspaceCommandInput').press('Enter');
  await page.mouse.click(650,450);
  assert.equal(await page.evaluate(()=>window.nodes[0]?.type),'orbit_rhythm');
  assert.deepEqual(errors,[]);
  console.log('Pattern orbs: both cable directions, custom notes/dynamics, save/load, internal clock, pause and search placement passed.');
} catch(error) {
  console.log('Failure state', await page.evaluate(()=>JSON.stringify({step:window.__patterns?.step,events:window.__patterns?.events,nodes:window.nodes?.map(n=>({type:n.type,id:n.id,x:n.x,y:n.y,enabled:n.isEnabled,last:n.lastTriggerPulseId,connections:[...n.connections],params:n.type==='orbit_rhythm'?n.audioParams:undefined}))})),errors);
  throw error;
} finally {await browser.close();}
