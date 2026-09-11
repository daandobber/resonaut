import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';import os from 'node:os';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/main\.js(?:\?.*)?$/,async route=>{
 const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
 window.__acid={
 setup(){handleNewWorkspace(true);this.n=addNode(760,420,'acid_mycelium');this.n.size=6;this.n.audioParams.advanceOnPulse=true;setActiveTool('edit');selectedElements.clear();selectedElements.add({type:'node',id:this.n.id});populateEditPanel();},
 step(){propagateTrigger(this.n,0,++currentGlobalPulseId,-1,16,{type:'trigger',data:{intensity:1}});},
 get graph(){return !!this.n.audioNodes;},
 get params(){return this.n.audioParams;},
 get frequency(){return this.n.audioNodes?.oscillator.frequency.value;},
 async measure(){const a=audioContext.createAnalyser();a.fftSize=2048;this.n.audioNodes.gainNode.connect(a);const data=new Float32Array(2048);let peak=0,sum=0,count=0;
 for(let i=0;i<24;i++){this.step();await new Promise(r=>setTimeout(r,45));a.getFloatTimeDomainData(data);for(const v of data){peak=Math.max(peak,Math.abs(v));sum+=v*v;count++;}}
 this.n.audioNodes.gainNode.disconnect(a);a.disconnect();return{peak,rms:Math.sqrt(sum/count)};},
 rest(){this.n.audioNodes.rest();},
 connect(){soundEngineToAdd='tone';this.flower=addNode(1070,320,'sound','sine');this.flower.size=3;setActiveTool('connect');const rect=canvas.getBoundingClientRect();return[this.n,this.flower].map(n=>{const p=getScreenCoords(n.x,n.y);return{x:p.x+rect.left,y:p.y+rect.top};});},
 save(){saveState();return getLatestState();},load:loadState,
 get restored(){return nodes.find(n=>n.type==='acid_mycelium')?.audioParams;},
 spore(){createVisualPulse(connections[0].id,2,this.n.id,5,'note',null,.8,false,{degree:0,mode:'relative'});},
 stop(){stopNodeAudio(this.n);},cleanup(){handleNewWorkspace(true);},
 };
 `});
});
try{
 await page.goto('http://127.0.0.1:5000/');await page.locator('#startEngineBtn').click();await page.waitForFunction(()=>window.__acid&&window.audioContext?.state==='running'&&!document.getElementById('startEngineBtn').disabled);await page.locator('#loadingIndicator').waitFor({state:'hidden'});
 await page.evaluate(()=>window.__acid.setup());await page.evaluate(()=>window.__acid.step());await page.waitForFunction(()=>window.__acid.graph);
 const levels=await page.evaluate(()=>window.__acid.measure());assert.ok(levels.rms>.001,JSON.stringify(levels));assert.ok(levels.peak<.3,JSON.stringify(levels));console.log('Acid audio',levels);
 const editor=page.locator('.pattern-orb-editor');assert.equal(await editor.locator('[data-step-param="slide"]').count(),16);assert.equal(await editor.locator('details').count(),0);
 await editor.locator('[data-pattern-param="cutoff"]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},'1400');await editor.locator('[data-pattern-param="cutoff"]').press('Tab');
 await editor.locator('[data-step-index="0"][data-step-param="slide"]').check();assert.equal(await page.evaluate(()=>window.__acid.params.steps[0].slide),true);
 await page.screenshot({path:path.join(os.tmpdir(),'resonaut-acid-editor.png')});
 const points=await page.evaluate(()=>window.__acid.connect());await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();await page.mouse.move(points[1].x,points[1].y,{steps:8});await page.mouse.up();
 await page.evaluate(()=>{window.__acid.step();window.__acid.spore();});await page.waitForTimeout(550);await page.screenshot({path:path.join(os.tmpdir(),'resonaut-acid-spores.png')});
 const state=await page.evaluate(()=>window.__acid.save());await page.evaluate(s=>window.__acid.load(s),state);assert.equal(await page.evaluate(()=>window.__acid.restored.cutoff),1400);assert.equal(await page.evaluate(()=>window.__acid.restored.steps[0].slide),true);
 await page.evaluate(()=>{window.__acid.setup();window.__acid.step();});await page.waitForFunction(()=>window.__acid.graph);
 await page.evaluate(()=>window.__acid.stop());assert.equal(await page.evaluate(()=>window.__acid.graph),false);
 await page.evaluate(()=>window.__acid.cleanup());assert.deepEqual(errors,[]);console.log('Acid sidebar, save/load, sound and spores passed.');
}finally{await browser.close();}
