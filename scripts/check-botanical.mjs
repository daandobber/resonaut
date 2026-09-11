import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/main\.js(?:\?.*)?$/,async route=>{
 const response=await route.fetch();
 await route.fulfill({response,body:await response.text()+`
 window.__garden={
 setup(){handleNewWorkspace(true);soundEngineToAdd='tone';
 const points=[];
 for(const [i,type] of ['note_loom','chord_garden','arp_orbit'].entries()){
 const x=410+i*370;const plant=addNode(x,570,type);plant.size=6;plant.audioParams.advanceOnPulse=true;
 const left=addNode(x-95,330+i*50,'sound','sine');const right=addNode(x+95,330+i*130,'sound','sine');left.size=3;right.size=3;
 const rect=canvas.getBoundingClientRect();const point=n=>{const p=getScreenCoords(n.x,n.y);return{x:p.x+rect.left,y:p.y+rect.top};};
 points.push([point(plant),point(left),point(right)]);
 }setActiveTool('connect');return points;},
 switchPalette(){currentScale={...currentScale,baseHSL:{h:35,s:62,l:72}};draw();},
 changeNote(){nodes.find(n=>n.type==='sound').audioParams.scaleIndex+=5;draw();},
 get moving(){return !!botanicalRedraw;},
 get flowers(){return botanicalFlowers.size;},
 disconnect(){for(const c of [...connections])removeConnection(c);draw();},
 cleanup(){handleNewWorkspace(true);},
 freeze(){if(isPlaying)togglePlayPause();setActiveTool('edit');selectedElements.clear();draw();}
 };
 `});
});
try{
 await page.goto('http://127.0.0.1:5000/');await page.locator('#startEngineBtn').click();
 await page.waitForFunction(()=>window.__garden&&window.audioContext?.state==='running'&&!document.getElementById('startEngineBtn').disabled);
 await page.locator('#loadingIndicator').waitFor({state:'hidden'});
 const groups=await page.evaluate(()=>window.__garden.setup());
 for(const [plant,left,right] of groups)for(const [start,end] of [[plant,left],[right,plant]]){
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});await page.mouse.up();
 }
 await page.waitForFunction(()=>window.__garden.flowers===6);
 await page.evaluate(()=>window.__garden.freeze());await page.waitForTimeout(300);
 await page.screenshot({path:path.join(os.tmpdir(),'resonaut-botanical.png')});
 await page.evaluate(()=>window.__garden.switchPalette());
 await page.waitForFunction(()=>!window.__garden.moving);
 await page.screenshot({path:path.join(os.tmpdir(),'resonaut-botanical-palette.png')});
 await page.evaluate(()=>window.__garden.changeNote());
 assert.equal(await page.evaluate(()=>window.__garden.moving),true,'note change animates while paused');
 await page.waitForFunction(()=>!window.__garden.moving);
 await page.evaluate(()=>window.__garden.disconnect());
 assert.equal(await page.evaluate(()=>window.__garden.flowers),0);
 assert.deepEqual(errors,[]);console.log('Six flowers in both cable directions; disconnect restores original appearance. Screenshot: '+path.join(os.tmpdir(),'resonaut-botanical.png'));
 await page.evaluate(()=>window.__garden.cleanup());
}finally{await browser.close();}
